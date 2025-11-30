#!/usr/bin/env node
/**
 * Read-only smoke tests for the Family Wallet API.
 * Does not mutate the database: only health checks and GETs plus login to obtain a token.
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const fetchJson = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || res.statusText;
    throw new Error(`${path} failed: ${res.status} ${msg}`);
  }
  return data;
};

const logStep = (msg) => console.log(`✓ ${msg}`);

const main = async () => {
  // Health
  await fetchJson('/api/health');
  logStep('API health check');

  // Login (no DB writes)
  const login = await fetchJson('/api/admin/login', { method: 'POST', body: { password: ADMIN_PASSWORD } });
  const token = login.token;
  if (!token) throw new Error('Login did not return token');
  logStep('Admin login');
  const authed = (path) => fetchJson(path, { headers: { Authorization: `Bearer ${token}` } });

  // Users
  const usersResp = await authed('/api/admin/users');
  const users = usersResp.users || [];
  logStep(`Fetched users (${users.length})`);

  // Cards list
  const cardsResp = await fetchJson('/api/public/cards');
  const cards = cardsResp.cards || [];
  if (!cards.length) {
    logStep('No cards found (skipping card-specific checks)');
    return;
  }
  const card = cards[0];
  logStep(`Fetched cards (${cards.length}), sample card ${card.publicId}`);

  // Card detail
  await fetchJson(`/api/public/cards/${card.publicId}`);
  logStep('Card detail by publicId');

  // User cards
  if (card.owner?.slug) {
    await fetchJson(`/api/public/users/${card.owner.slug}/cards`);
    logStep(`Cards by user slug ${card.owner.slug}`);
  }

  // Savings list (read-only)
  await fetchJson(`/api/public/cards/${card.publicId}/savings`);
  logStep('Savings list for card');
};

main().catch((err) => {
  console.error('Smoke tests failed:', err.message);
  process.exit(1);
});
