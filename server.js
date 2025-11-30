import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'family-wallet-admin-secret';
const NFC_TOKEN_SECRET = process.env.NFC_TOKEN_SECRET || 'family-wallet-nfc-secret';
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const designDir = path.join(__dirname, 'Family Card Design');
const dataDir = path.join(__dirname, 'data');

// 确保 data 目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'data.sqlite'));
db.pragma('journal_mode = WAL');

const app = express();
app.use(cors());
app.use(express.json());

const nowIso = () => new Date().toISOString();

const signDeepLinkToken = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', NFC_TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const verifyDeepLinkToken = (token) => {
  const [body, sig] = token.split('.');
  if (!body || !sig) throw new Error('Malformed token');
  const expected = crypto.createHmac('sha256', NFC_TOKEN_SECRET).update(body).digest('base64url');
  if (expected !== sig) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Date.now()) throw new Error('Token expired');
  return payload;
};

const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      public_id TEXT NOT NULL UNIQUE,
      face TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      category TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(card_id) REFERENCES cards(id)
    );
    -- 用户储蓄设置表
    CREATE TABLE IF NOT EXISTS user_savings_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      interest_rate REAL NOT NULL DEFAULT 0.03,
      penalty_rate REAL NOT NULL DEFAULT 0.05,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    -- 储蓄记录表
    CREATE TABLE IF NOT EXISTS savings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      penalty_rate REAL NOT NULL,
      start_date TEXT NOT NULL,
      maturity_months INTEGER NOT NULL DEFAULT 12,
      status TEXT NOT NULL DEFAULT 'active',
      ended_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(card_id) REFERENCES cards(id)
    );
    -- 利息发放记录表
    CREATE TABLE IF NOT EXISTS interest_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      savings_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      payment_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(savings_id) REFERENCES savings(id)
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);
    CREATE INDEX IF NOT EXISTS idx_cards_public_id ON cards(public_id);
    CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);
    CREATE INDEX IF NOT EXISTS idx_savings_card_id ON savings(card_id);
    CREATE INDEX IF NOT EXISTS idx_savings_status ON savings(status);
    CREATE INDEX IF NOT EXISTS idx_interest_payments_savings_id ON interest_payments(savings_id);
  `);
};

const seedData = () => {
  const hasUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count > 0;
  if (hasUsers) return;

  const userStmt = db.prepare('INSERT INTO users (name, slug, created_at) VALUES (?, ?, ?)');
  const mom = userStmt.run('妈妈', 'mom', nowIso()).lastInsertRowid;
  const dad = userStmt.run('爸爸', 'dad', nowIso()).lastInsertRowid;
  const baby = userStmt.run('宝宝', 'baby', nowIso()).lastInsertRowid;

  const cardStmt = db.prepare('INSERT INTO cards (name, owner_id, public_id, face, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const txStmt = db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)');

  const seedCard = (name, ownerId, publicId, face, initialCents, txs = []) => {
    const cardId = cardStmt.run(name, ownerId, publicId, face, nowIso(), nowIso()).lastInsertRowid;
    if (initialCents !== 0) txStmt.run(cardId, 'init', initialCents, 'init', '初始余额', nowIso());
    txs.forEach((t) => {
      txStmt.run(cardId, t.type, t.amount_cents, t.category || null, t.note || null, t.created_at || nowIso());
    });
  };

  seedCard('妈妈的购物卡', mom, 'mom-card', 'Mother.png', 234050, [
    { type: 'expense', amount_cents: -32050, category: '居家', note: '周末超市采购' },
    { type: 'expense', amount_cents: -15800, category: '服饰', note: '给宝贝买衣服' },
  ]);
  seedCard('爸爸的加油卡', dad, 'dad-card', 'Father.png', 110000, [
    { type: 'expense', amount_cents: -40000, category: '交通', note: '壳牌加油站' },
    { type: 'expense', amount_cents: -3500, category: '餐饮', note: '上班咖啡' },
  ]);
  seedCard('宝宝的存钱罐', baby, 'baby-card', 'Boy.png', 500000, [
    { type: 'income', amount_cents: 200000, category: '红包', note: '过年红包' },
    { type: 'income', amount_cents: 50000, category: '理财', note: '每月定存' },
  ]);
};

const getUserBySlug = (slug) => db.prepare('SELECT * FROM users WHERE slug = ?').get(slug);
const getCardRowByPublicId = (publicId) => db.prepare('SELECT * FROM cards WHERE public_id = ?').get(publicId);
const getCardRowById = (id) => db.prepare('SELECT * FROM cards WHERE id = ?').get(id);

const normalizeAmountByType = (type, amountCents) => {
  const abs = Math.abs(Math.round(Number(amountCents)));
  if (type === 'expense') return -abs;
  return abs;
};

const computeBalance = (cardId) => {
  const row = db.prepare('SELECT COALESCE(SUM(amount_cents), 0) as balance FROM transactions WHERE card_id = ?').get(cardId);
  return row.balance || 0;
};

const buildCardResponse = (cardRow) => {
  const owner = db.prepare('SELECT id, name, slug FROM users WHERE id = ?').get(cardRow.owner_id);
  const transactions = db
    .prepare('SELECT id, type, amount_cents, category, note, created_at FROM transactions WHERE card_id = ? ORDER BY datetime(created_at) DESC LIMIT 30')
    .all(cardRow.id);
  const balanceCents = computeBalance(cardRow.id);
  
  // 获取活跃的储蓄
  const activeSavings = db.prepare(`
    SELECT s.*, 
           (SELECT COALESCE(SUM(ip.amount_cents), 0) FROM interest_payments ip WHERE ip.savings_id = s.id) as total_interest_cents
    FROM savings s 
    WHERE s.card_id = ? AND s.status = 'active'
    ORDER BY s.created_at DESC
  `).all(cardRow.id);
  
  const totalSavingsCents = activeSavings.reduce((sum, s) => sum + s.amount_cents, 0);
  
  return {
    id: cardRow.id,
    name: cardRow.name,
    publicId: cardRow.public_id,
    face: cardRow.face || null,
    faceUrl: cardRow.face ? `/assets/cards/${cardRow.face}` : null,
    owner,
    balanceCents,
    totalSavingsCents,
    activeSavings,
    createdAt: cardRow.created_at,
    updatedAt: cardRow.updated_at,
    transactions,
  };
};

const listCards = () => {
  const rows = db.prepare('SELECT * FROM cards ORDER BY owner_id, id').all();
  return rows.map(buildCardResponse);
};

const requireAdmin = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.replace('Bearer ', '') : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    req.admin = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
  const token = jwt.sign({ role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '4h' });
  res.json({ token, expiresIn: '4h' });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, slug, created_at as createdAt FROM users ORDER BY id DESC').all();
  res.json({ users });
});

app.post('/api/admin/users', requireAdmin, (req, res) => {
  const { name, slug } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
  try {
    const info = db.prepare('INSERT INTO users (name, slug, created_at) VALUES (?, ?, ?)').run(name, slug, nowIso());
    const user = db.prepare('SELECT id, name, slug, created_at as createdAt FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: 'Failed to create user, maybe slug already exists' });
  }
});

// 删除用户
app.delete('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // 获取该用户的所有卡片
  const userCards = db.prepare('SELECT id FROM cards WHERE owner_id = ?').all(user.id);
  
  // 删除所有卡片的交易记录
  for (const card of userCards) {
    db.prepare('DELETE FROM transactions WHERE card_id = ?').run(card.id);
  }
  
  // 删除该用户的所有卡片
  db.prepare('DELETE FROM cards WHERE owner_id = ?').run(user.id);
  
  // 删除用户
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

  res.json({ success: true, deletedUserId: user.id });
});

app.post('/api/admin/cards', requireAdmin, (req, res) => {
  const { name, ownerSlug, initialBalanceCents = 0, face } = req.body || {};
  if (!name || !ownerSlug) return res.status(400).json({ error: 'name and ownerSlug are required' });
  const owner = getUserBySlug(ownerSlug);
  if (!owner) return res.status(404).json({ error: 'Owner not found' });

  const publicId = nanoid(10);
  const createdAt = nowIso();
  const info = db
    .prepare('INSERT INTO cards (name, owner_id, public_id, face, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, owner.id, publicId, face || null, createdAt, createdAt);

  if (Number(initialBalanceCents)) {
    db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(info.lastInsertRowid, 'init', Math.round(initialBalanceCents), 'init', '初始余额', createdAt);
  }

  res.json({ card: buildCardResponse(getCardRowById(info.lastInsertRowid)) });
});

const resolveCardRow = (key) => {
  const asNumber = Number(key);
  if (!Number.isNaN(asNumber)) {
    const found = getCardRowById(asNumber);
    if (found) return found;
  }
  return getCardRowByPublicId(key);
};

app.patch('/api/admin/cards/:cardKey', requireAdmin, (req, res) => {
  const { cardKey } = req.params;
  const { name, ownerSlug, balanceCents, face } = req.body || {};
  const card = resolveCardRow(cardKey);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  const updates = [];
  if (name) updates.push({ field: 'name', value: name });
  if (ownerSlug) {
    const owner = getUserBySlug(ownerSlug);
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    updates.push({ field: 'owner_id', value: owner.id });
  }
  if (face !== undefined) {
    updates.push({ field: 'face', value: face || null });
  }
  if (updates.length) {
    const setSql = updates.map((u) => `${u.field} = ?`).join(', ');
    const params = updates.map((u) => u.value);
    params.push(nowIso(), card.id);
    db.prepare(`UPDATE cards SET ${setSql}, updated_at = ? WHERE id = ?`).run(...params);
  }

  if (balanceCents !== undefined && balanceCents !== null) {
    const current = computeBalance(card.id);
    const desired = Math.round(balanceCents);
    const delta = desired - current;
    if (delta !== 0) {
      db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(card.id, 'adjustment', delta, 'adjustment', '管理员调整余额', nowIso());
    }
  }

  res.json({ card: buildCardResponse(getCardRowById(card.id)) });
});

app.post('/api/admin/cards/:cardKey/transactions', requireAdmin, (req, res) => {
  const { cardKey } = req.params;
  const { type, amountCents, category, note } = req.body || {};
  const card = resolveCardRow(cardKey);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  if (!type || !Number(amountCents)) return res.status(400).json({ error: 'type and amountCents are required' });

  const normalizedAmount = normalizeAmountByType(type, amountCents);
  db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(card.id, type, normalizedAmount, category || null, note || null, nowIso());

  res.json({ card: buildCardResponse(getCardRowById(card.id)) });
});

// 删除卡片
app.delete('/api/admin/cards/:cardKey', requireAdmin, (req, res) => {
  const { cardKey } = req.params;
  const card = resolveCardRow(cardKey);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  // 先删除该卡片的所有交易记录
  db.prepare('DELETE FROM transactions WHERE card_id = ?').run(card.id);
  // 再删除卡片
  db.prepare('DELETE FROM cards WHERE id = ?').run(card.id);

  res.json({ success: true, deletedCardId: card.id });
});

app.get('/api/public/cards', (req, res) => {
  const cards = listCards();
  res.json({ cards });
});

// 根据用户 slug 获取该用户的所有卡片
app.get('/api/public/users/:slug/cards', (req, res) => {
  const { slug } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE slug = ?').get(slug);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const cardRows = db.prepare('SELECT * FROM cards WHERE owner_id = ? ORDER BY id').all(user.id);
  const cards = cardRows.map(buildCardResponse);
  res.json({ user: { id: user.id, name: user.name, slug: user.slug }, cards });
});

app.get('/api/public/cards/:publicId', (req, res) => {
  const { publicId } = req.params;
  const cardRow = getCardRowByPublicId(publicId);
  if (!cardRow) return res.status(404).json({ error: 'Card not found' });
  res.json({ card: buildCardResponse(cardRow) });
});

app.post('/api/public/cards/:publicId/transactions', (req, res) => {
  const { publicId } = req.params;
  const { type, amountCents, category, note } = req.body || {};
  const card = getCardRowByPublicId(publicId);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  if (!type || !Number(amountCents)) return res.status(400).json({ error: 'type and amountCents are required' });

  const normalizedAmount = normalizeAmountByType(type, amountCents);
  db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(card.id, type, normalizedAmount, category || null, note || null, nowIso());

  res.json({ card: buildCardResponse(card) });
});

// 保留旧的 token 验证 API 以保持向后兼容（已有链接仍可用）
app.get('/api/public/cards/by-token/:token', (req, res) => {
  const { token } = req.params;
  try {
    const payload = verifyDeepLinkToken(token);
    const card = getCardRowByPublicId(payload.publicId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    return res.json({ card: buildCardResponse(card), payload });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid token' });
  }
});

app.post('/api/public/cards/by-token/:token/transactions', (req, res) => {
  const { token } = req.params;
  try {
    const payload = verifyDeepLinkToken(token);
    const card = getCardRowByPublicId(payload.publicId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const { type, amountCents, category, note } = req.body || {};
    if (!type || !Number(amountCents)) return res.status(400).json({ error: 'type and amountCents are required' });
    const normalizedAmount = normalizeAmountByType(type, amountCents);
    db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(card.id, type, normalizedAmount, category || null, note || null, nowIso());
    return res.json({ card: buildCardResponse(card), payload });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid token' });
  }
});

// =============== 储蓄功能 API ===============

// 获取用户储蓄设置
const getUserSavingsSettings = (userId) => {
  let settings = db.prepare('SELECT * FROM user_savings_settings WHERE user_id = ?').get(userId);
  if (!settings) {
    // 返回默认设置
    settings = { user_id: userId, interest_rate: 0.03, penalty_rate: 0.05 };
  }
  return settings;
};

// 管理员：获取所有用户的储蓄设置
app.get('/api/admin/savings-settings', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, slug FROM users ORDER BY id').all();
  const settingsMap = {};
  const allSettings = db.prepare('SELECT * FROM user_savings_settings').all();
  allSettings.forEach(s => { settingsMap[s.user_id] = s; });
  
  const result = users.map(u => ({
    userId: u.id,
    userName: u.name,
    userSlug: u.slug,
    interestRate: settingsMap[u.id]?.interest_rate ?? 0.03,
    penaltyRate: settingsMap[u.id]?.penalty_rate ?? 0.05,
  }));
  res.json({ settings: result });
});

// 管理员：更新用户储蓄设置
app.put('/api/admin/savings-settings/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { interestRate, penaltyRate } = req.body || {};
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const ir = Math.max(0, Math.min(1, Number(interestRate) || 0.03));
  const pr = Math.max(0, Math.min(1, Number(penaltyRate) || 0.05));
  
  const existing = db.prepare('SELECT * FROM user_savings_settings WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare('UPDATE user_savings_settings SET interest_rate = ?, penalty_rate = ?, updated_at = ? WHERE user_id = ?')
      .run(ir, pr, nowIso(), userId);
  } else {
    db.prepare('INSERT INTO user_savings_settings (user_id, interest_rate, penalty_rate, updated_at) VALUES (?, ?, ?, ?)')
      .run(userId, ir, pr, nowIso());
  }
  
  res.json({ 
    userId: Number(userId), 
    interestRate: ir, 
    penaltyRate: pr,
    message: '储蓄设置已更新'
  });
});

// 获取卡片的储蓄列表
const getCardSavings = (cardId) => {
  return db.prepare(`
    SELECT s.*, 
           (SELECT COALESCE(SUM(ip.amount_cents), 0) FROM interest_payments ip WHERE ip.savings_id = s.id) as total_interest_cents
    FROM savings s 
    WHERE s.card_id = ? 
    ORDER BY s.created_at DESC
  `).all(cardId);
};

// 公开：获取卡片的储蓄列表
app.get('/api/public/cards/:publicId/savings', (req, res) => {
  const { publicId } = req.params;
  const card = getCardRowByPublicId(publicId);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  
  const savings = getCardSavings(card.id);
  res.json({ savings });
});

// 公开：创建储蓄
app.post('/api/public/cards/:publicId/savings', (req, res) => {
  const { publicId } = req.params;
  const { amountCents, maturityMonths = 12 } = req.body || {};
  
  const card = getCardRowByPublicId(publicId);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  
  const amount = Math.abs(Math.round(Number(amountCents) || 0));
  if (amount <= 0) return res.status(400).json({ error: '储蓄金额必须大于0' });
  const months = Math.max(1, Math.min(120, Math.round(Number(maturityMonths) || 12)));
  
  // 检查余额是否足够
  const currentBalance = computeBalance(card.id);
  if (currentBalance < amount) {
    return res.status(400).json({ error: '余额不足' });
  }
  
  // 获取用户的储蓄设置
  const settings = getUserSavingsSettings(card.owner_id);
  
  // 从卡片扣除金额
  db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(card.id, 'savings_deposit', -amount, '储蓄', '转入储蓄账户', nowIso());
  
  // 创建储蓄记录
  const info = db.prepare(`
    INSERT INTO savings (card_id, amount_cents, interest_rate, penalty_rate, start_date, maturity_months, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(card.id, amount, settings.interest_rate, settings.penalty_rate, nowIso(), months, nowIso());
  
  const savings = db.prepare('SELECT * FROM savings WHERE id = ?').get(info.lastInsertRowid);
  res.json({ 
    savings,
    message: `已成功存入 ¥${(amount / 100).toFixed(2)}，年利率 ${(settings.interest_rate * 100).toFixed(1)}%`
  });
});

// 公开：提前取出储蓄（需要扣违约金）
app.post('/api/public/cards/:publicId/savings/:savingsId/withdraw', (req, res) => {
  const { publicId, savingsId } = req.params;
  
  const card = getCardRowByPublicId(publicId);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  
  const savings = db.prepare('SELECT * FROM savings WHERE id = ? AND card_id = ?').get(savingsId, card.id);
  if (!savings) return res.status(404).json({ error: 'Savings not found' });
  if (savings.status !== 'active') return res.status(400).json({ error: '该储蓄已结束' });
  
  // 计算已获得的利息
  const totalInterest = db.prepare('SELECT COALESCE(SUM(amount_cents), 0) as total FROM interest_payments WHERE savings_id = ?').get(savingsId).total;
  
  // 检查是否到期
  const startDate = new Date(savings.start_date);
  const maturityDate = new Date(startDate);
  maturityDate.setMonth(maturityDate.getMonth() + savings.maturity_months);
  const now = new Date();
  const isMatured = now >= maturityDate;
  
  let returnAmount = savings.amount_cents;
  let penaltyAmount = 0;
  let note = '';
  
  if (!isMatured) {
    // 提前取出，扣除违约金：通过独立交易扣减，归还全额本金
    penaltyAmount = Math.round(savings.amount_cents * savings.penalty_rate);
    returnAmount = savings.amount_cents;
    note = `提前取出储蓄，扣除违约金 ¥${(penaltyAmount / 100).toFixed(2)}`;
    
    // 记录违约金扣除
    db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(card.id, 'savings_penalty', -penaltyAmount, '储蓄', '储蓄违约金', nowIso());
  } else {
    note = '储蓄到期取出';
  }
  
  // 归还本金（提前取出时已单独扣罚金，这里返还全额本金）
  db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(card.id, 'savings_withdraw', returnAmount, '储蓄', note, nowIso());
  
  // 更新储蓄状态
  db.prepare('UPDATE savings SET status = ?, ended_at = ? WHERE id = ?')
    .run(isMatured ? 'matured' : 'withdrawn', nowIso(), savingsId);
  
  res.json({
    returnAmount,
    penaltyAmount,
    totalInterest,
    isMatured,
    message: isMatured 
      ? `储蓄到期，已取回本金 ¥${(returnAmount / 100).toFixed(2)}，累计利息 ¥${(totalInterest / 100).toFixed(2)}`
      : `提前取出，扣除违约金 ¥${(penaltyAmount / 100).toFixed(2)}，实际取回 ¥${((returnAmount - penaltyAmount) / 100).toFixed(2)}`
  });
});

// 计算并发放利息的函数（每月调用）
const processMonthlyInterest = () => {
  const activeSavings = db.prepare('SELECT * FROM savings WHERE status = ?').all('active');
  const now = new Date();
  
  for (const savings of activeSavings) {
    const startDate = new Date(savings.start_date);
    // 计算从开始到现在经过了多少个完整月份
    const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    if (monthsElapsed <= 0) continue;

    const card = getCardRowById(savings.card_id);
    if (!card) continue;

    // 已发放的利息次数
    let paidCount = db.prepare('SELECT COUNT(*) as count FROM interest_payments WHERE savings_id = ?').get(savings.id).count;
    // 不超过到期月份的可发放次数
    const allowedMonths = Math.min(monthsElapsed, savings.maturity_months);
    const missingMonths = allowedMonths - paidCount;

    if (missingMonths > 0) {
      const monthlyRate = savings.interest_rate / 12;
      for (let i = 0; i < missingMonths; i++) {
        const monthNumber = paidCount + i + 1;
        const monthlyInterest = Math.round(savings.amount_cents * monthlyRate);

        db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(card.id, 'income', monthlyInterest, '理财', `储蓄利息（第${monthNumber}个月）`, nowIso());

        db.prepare('INSERT INTO interest_payments (savings_id, amount_cents, payment_date, created_at) VALUES (?, ?, ?, ?)')
          .run(savings.id, monthlyInterest, nowIso(), nowIso());
      }
      paidCount += missingMonths;
    }
    
    // 检查是否到期
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + savings.maturity_months);
    if (now >= maturityDate && savings.status === 'active') {
      // 自动到期，归还本金
      const card = getCardRowById(savings.card_id);
      if (card) {
        db.prepare('INSERT INTO transactions (card_id, type, amount_cents, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(card.id, 'savings_withdraw', savings.amount_cents, '储蓄', '储蓄到期自动取回', nowIso());
        db.prepare('UPDATE savings SET status = ?, ended_at = ? WHERE id = ?')
          .run('matured', nowIso(), savings.id);
      }
    }
  }
};

// 管理员：手动触发利息计算
app.post('/api/admin/process-interest', requireAdmin, (req, res) => {
  processMonthlyInterest();
  res.json({ message: '利息计算完成' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

initSchema();
// Add missing face column if older DB exists
try {
  const hasFaceColumn = db.prepare(`PRAGMA table_info(cards)`).all().some((col) => col.name === 'face');
  if (!hasFaceColumn) {
    db.prepare('ALTER TABLE cards ADD COLUMN face TEXT').run();
  }
} catch (err) {
  console.warn('Could not ensure face column', err.message);
}
seedData();

// 启动时检查并处理利息（在数据库初始化之后）
processMonthlyInterest();

// 每小时检查一次利息（在生产环境中可以使用定时任务）
setInterval(processMonthlyInterest, 60 * 60 * 1000);

// Serve card face assets
app.use('/assets/cards', express.static(designDir));

// Serve wallet style assets from Family Wallet Design folder
const walletDesignDir = path.join(__dirname, 'Family Wallet Design');
app.use('/assets/wallet-styles', express.static(walletDesignDir));

// 获取卡面列表 API
app.get('/api/public/card-faces', (req, res) => {
  try {
    const files = fs.readdirSync(designDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
    const faces = files.map(file => ({
      key: file,
      label: file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      file: file,
      url: `/assets/cards/${file}`,
    }));
    res.json({ faces });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read card faces', faces: [] });
  }
});

// 获取卡包样式列表 API（使用 Family Wallet Design 文件夹）
app.get('/api/public/wallet-styles', (req, res) => {
  try {
    if (!fs.existsSync(walletDesignDir)) {
      fs.mkdirSync(walletDesignDir, { recursive: true });
    }
    const files = fs.readdirSync(walletDesignDir).filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
    const styles = files.map(file => ({
      key: file,
      label: file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      file: file,
      url: `/assets/wallet-styles/${file}`,
    }));
    res.json({ styles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read wallet styles', styles: [] });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
