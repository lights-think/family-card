#!/usr/bin/env node
/**
 * End-to-end write test for Family Wallet.
 * Creates temporary user/card, performs income/expense, creates savings,
 * fast-forwards savings start date, triggers interest, then cleans up the user.
 * NOTE: This mutates the DB; caller is responsible for restoring snapshot afterward.
 */
import Database from 'better-sqlite3';
import http from 'node:http';
import https from 'node:https';

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const baseUrl = new URL(API_BASE);
const client = baseUrl.protocol === 'https:' ? https : http;

const requestJson = ({ path, method = 'GET', token, body }) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = client.request(
      {
        protocol: baseUrl.protocol,
        hostname: baseUrl.hostname,
        port: baseUrl.port,
        path,
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let chunks = '';
        res.on('data', (c) => (chunks += c));
        res.on('end', () => {
          let json = {};
          try {
            json = chunks ? JSON.parse(chunks) : {};
          } catch (_) {
            // ignore parse errors; json stays empty
          }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const msg = json?.error || res.statusMessage;
            return reject(new Error(`${path} failed: ${res.statusCode} ${msg}`));
          }
          resolve(json);
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });

const expectEqual = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label} expected ${expected}, got ${actual}`);
  }
};

const logStep = (msg) => console.log(`✓ ${msg}`);

const main = async () => {
  const db = new Database('data/data.sqlite');

  // Login
  const login = await requestJson({ path: '/api/admin/login', method: 'POST', body: { password: ADMIN_PASSWORD } });
  const token = login.token;
  if (!token) throw new Error('Login did not return token');
  logStep('Admin login');
  const authed = (path, options = {}) => requestJson({ path, token, ...options });

  // Create temp user
  const slug = `testuser_${Date.now()}`;
  const userRes = await authed('/api/admin/users', { method: 'POST', body: { name: slug, slug } });
  const userId = userRes.user.id;
  logStep(`Created temp user ${slug}`);

  // Create card with initial balance
  const initBalance = 100_000; // ¥1000.00
  const cardRes = await authed('/api/admin/cards', {
    method: 'POST',
    body: { name: 'Test Card', ownerSlug: slug, initialBalanceCents: initBalance },
  });
  const card = cardRes.card;
  const cardId = card.id;
  const publicId = card.publicId;
  expectEqual(card.balanceCents, initBalance, 'Initial balance');
  logStep('Created card with initial balance');

  const getCard = async () => {
    const data = await requestJson({ path: `/api/public/cards/${publicId}` });
    return data.card;
  };

  // Income
  const income = 5_000; // ¥50
  await requestJson({
    path: `/api/public/cards/${publicId}/transactions`,
    method: 'POST',
    body: { type: 'income', amountCents: income, category: '测试收入' },
  });
  let cardNow = await getCard();
  expectEqual(cardNow.balanceCents, initBalance + income, 'Balance after income');
  logStep('Income transaction ok');

  // Expense
  const expense = 2_000; // ¥20
  await requestJson({
    path: `/api/public/cards/${publicId}/transactions`,
    method: 'POST',
    body: { type: 'expense', amountCents: expense, category: '测试支出' },
  });
  cardNow = await getCard();
  expectEqual(cardNow.balanceCents, initBalance + income - expense, 'Balance after expense');
  logStep('Expense transaction ok');

  // Savings deposit
  const savingsAmount = 10_000; // ¥100
  const maturityMonths = 6;
  const savingsRes = await requestJson({
    path: `/api/public/cards/${publicId}/savings`,
    method: 'POST',
    body: { amountCents: savingsAmount, maturityMonths },
  });
  const savingsId = savingsRes.savings.id;
  cardNow = await getCard();
  expectEqual(cardNow.balanceCents, initBalance + income - expense - savingsAmount, 'Balance after savings deposit');
  logStep('Savings deposit ok');

  // Fast-forward savings start date so interest accrues
  const pastDate = '2024-01-01T00:00:00.000Z';
  db.prepare('UPDATE savings SET start_date = ? WHERE id = ?').run(pastDate, savingsId);
  logStep('Adjusted savings start date for interest accrual');

  // Trigger interest processing
  await authed('/api/admin/process-interest', { method: 'POST' });

  // Check interest paid (should pay for min(elapsed, maturityMonths) months)
  const monthsElapsed = 6; // clamped by maturityMonths
  const monthlyRate = savingsRes.savings.interest_rate / 12;
  const expectedMonthlyInterest = Math.round(savingsAmount * monthlyRate);
  const expectedTotalInterest = expectedMonthlyInterest * monthsElapsed;

  const savingsList = await requestJson({ path: `/api/public/cards/${publicId}/savings` });
  const updatedSavings = savingsList.savings.find((s) => s.id === savingsId);
  if (!updatedSavings) throw new Error('Savings not found after interest processing');
  if (updatedSavings.total_interest_cents < expectedTotalInterest) {
    throw new Error(`Interest too low: expected at least ${expectedTotalInterest}, got ${updatedSavings.total_interest_cents}`);
  }
  logStep(`Interest processed (>= ${expectedTotalInterest} cents)`);

  // Check balance reflects interest (within tolerance for additional months if any)
  cardNow = await getCard();
  if (cardNow.balanceCents < initBalance + income - expense - savingsAmount + expectedTotalInterest) {
    throw new Error('Card balance did not include expected interest');
  }
  logStep('Balance includes interest');

  // Cleanup temp user (best-effort; database will be restored afterward anyway)
  try {
    await authed(`/api/admin/users/${userId}`, { method: 'DELETE' });
    logStep('Cleaned up temp user');
  } catch (cleanupErr) {
    console.warn('Cleanup user failed (ignored because DB will be restored):', cleanupErr.message);
  }
};

main().catch((err) => {
  console.error('Full test failed:', err.message);
  process.exit(1);
});
