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
    CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);
    CREATE INDEX IF NOT EXISTS idx_cards_public_id ON cards(public_id);
    CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);
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
  return {
    id: cardRow.id,
    name: cardRow.name,
    publicId: cardRow.public_id,
    face: cardRow.face || null,
    faceUrl: cardRow.face ? `/assets/cards/${cardRow.face}` : null,
    owner,
    balanceCents,
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
