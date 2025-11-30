import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  PiggyBank,
  ShoppingBag,
  Home,
  Car,
  Gift,
  CreditCard,
  Plus,
  Minus,
  X,
  Utensils,
  Zap,
  BookOpen,
  Coffee,
  Shirt,
  Plane,
  LayoutDashboard,
  Wallet as WalletIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Link as LinkIcon,
  Clipboard,
} from 'lucide-react';

const API_BASE = '';

const CARD_FACES = [
  { key: 'Mother.png', label: '妈妈卡面', file: 'Mother.png' },
  { key: 'Father.png', label: '爸爸卡面', file: 'Father.png' },
  { key: 'Girl.png', label: '女孩卡面', file: 'Girl.png' },
  { key: 'Boy.png', label: '男孩卡面', file: 'Boy.png' },
  { key: 'Partner.png', label: '伴侣卡面', file: 'Partner.png' },
];

const expenseCategories = [
  { name: '餐饮', icon: <Utensils size={20} /> },
  { name: '购物', icon: <ShoppingBag size={20} /> },
  { name: '交通', icon: <Car size={20} /> },
  { name: '居家', icon: <Home size={20} /> },
  { name: '娱乐', icon: <Zap size={20} /> },
  { name: '学习', icon: <BookOpen size={20} /> },
  { name: '服饰', icon: <Shirt size={20} /> },
  { name: '旅行', icon: <Plane size={20} /> },
];

const incomeCategories = [
  { name: '工资', icon: <WalletIcon size={20} /> },
  { name: '红包', icon: <Gift size={20} /> },
  { name: '理财', icon: <LayoutDashboard size={20} /> },
  { name: '兼职', icon: <Coffee size={20} /> },
];

const walletStyles = [
  {
    name: 'Classic Leather',
    backBgColor: '#A48466',
    frontBgColor: '#BFA07F',
    stitchingColor: '#E8D4BE',
    textShadowColor: '#6B4E3D',
    textMainColor: '#5D4037',
    texture: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='leatherTexture'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23leatherTexture)' opacity='0.4'/%3E%3C/svg%3E")`,
    textureOpacity: 0.4,
    borderRadius: '2.5rem',
    detailBgColor: 'white',
    detailTextColor: 'slate-600',
    customContent: null,
  },
  {
    name: 'Cute Bear',
    backBgColor: '#8ECDDD',
    frontBgColor: '#A8DDEB',
    stitchingColor: '#FFFFFF',
    textShadowColor: '#3A7EA1',
    textMainColor: '#2B6A8C',
    texture: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='2'/%3E%3Ccircle cx='13' cy='13' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 1,
    borderRadius: '3rem',
    detailBgColor: 'white',
    detailTextColor: 'slate-600',
    customContent: (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 pointer-events-none select-none">
        <div className="text-[80px] opacity-20 rotate-12 grayscale-0 filter drop-shadow-sm">🐻</div>
      </div>
    ),
  },
  {
    name: 'Modern Geo',
    backBgColor: '#4A5C6C',
    frontBgColor: '#6B7E8C',
    stitchingColor: '#E0E0E0',
    textShadowColor: '#2A3C4C',
    textMainColor: '#FFFFFF',
    texture: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 0h10L0 10V0zm10 10H0L10 0v10z'/%3E%3C/g%3E%3C/svg%3E")`,
    textureOpacity: 1,
    borderRadius: '2rem',
    detailBgColor: 'white',
    detailTextColor: 'slate-600',
    customContent: (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 pointer-events-none">
        <div className="w-24 h-24 rounded-full border-[1px] border-white/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-[1px] border-white/20"></div>
        </div>
      </div>
    ),
  },
];

const cardThemes = [
  {
    color: 'bg-gradient-to-br from-[#F8C3CD] to-[#FCECEC]',
    textColor: 'text-[#8B4A56]',
    iconBg: 'bg-white/60',
    icon: <ShoppingBag className="text-[#D66C7E]" size={24} />,
  },
  {
    color: 'bg-gradient-to-br from-[#A0D8EF] to-[#E6F4FA]',
    textColor: 'text-[#2C5870]',
    iconBg: 'bg-white/60',
    icon: <Car className="text-[#5B9BB5]" size={24} />,
  },
  {
    color: 'bg-gradient-to-br from-[#FCD575] to-[#FFF8DC]',
    textColor: 'text-[#8B6914]',
    iconBg: 'bg-white/60',
    icon: <PiggyBank className="text-[#DAA520]" size={24} />,
  },
  {
    color: 'bg-gradient-to-br from-[#D7C8F7] to-[#F1EDFF]',
    textColor: 'text-[#4B3C73]',
    iconBg: 'bg-white/60',
    icon: <Gift className="text-[#7B5BD6]" size={24} />,
  },
];

const fetchJson = async (path, options = {}) => {
  const opts = { ...options };
  opts.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (options.body && typeof options.body !== 'string') {
    opts.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || '请求失败';
    throw new Error(message);
  }
  return data;
};

const formatCentsToYuan = (cents) => (cents / 100).toFixed(2);

const normalizeCard = (card, index = 0) => {
  const theme = cardThemes[index % cardThemes.length];
  const ownerName = card.owner?.name || card.owner || '未命名';
  const ownerKey = card.owner?.slug || ownerName;
  const faceFile = card.face || card.faceFile;
  const faceUrl = card.faceUrl || (faceFile ? `/assets/cards/${faceFile}` : null);
  return {
    ...card,
    ownerName,
    ownerKey,
    ownerSlug: card.owner?.slug,
    faceFile,
    faceUrl,
    color: theme.color,
    textColor: theme.textColor,
    iconBg: theme.iconBg,
    icon: theme.icon,
    balance: formatCentsToYuan(card.balanceCents || 0),
    transactions: (card.transactions || []).map((t) => ({
      id: t.id,
      title: t.note || t.category || (t.type === 'income' ? '收入' : '支出'),
      amount: Math.abs(t.amount_cents || t.amountCents || 0) / 100,
      rawAmount: t.amount_cents || t.amountCents || 0,
      type: t.type === 'expense' || (t.amount_cents || t.amountCents || 0) < 0 ? 'expense' : 'income',
      date: t.created_at || t.createdAt || new Date().toISOString(),
      category: t.category,
    })),
  };
};

const parseDeepLink = () => {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search || '');
  if (path.startsWith('/admin')) return { mode: 'admin' };
  const publicId = path.startsWith('/c/') ? path.split('/c/')[1].split('/')[0] : search.get('card');
  const token = search.get('token');
  return { mode: 'wallet', publicId, token };
};

const AdminPanel = () => {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [userForm, setUserForm] = useState({ name: '', slug: '' });
  const [cardForm, setCardForm] = useState({ name: '', ownerSlug: '', initialBalance: '0', face: CARD_FACES[0].key });
  const [adjustForm, setAdjustForm] = useState({ cardKey: '', newBalance: '', newOwnerSlug: '', newName: '', newFace: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cards, setCards] = useState([]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);

  const authedFetch = async (path, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetchJson(path, { ...options, headers });
  };

  const reloadCards = async () => {
    try {
      const data = await fetchJson('/api/public/cards');
      const normalized = (data.cards || []).map((c, idx) => normalizeCard(c, idx));
      setCards(normalized);
    } catch (err) {
      setError(err.message || '加载卡片失败');
    }
  };

  useEffect(() => {
    reloadCards();
  }, []);

  const handleLogin = async () => {
    setError('');
    setMessage('');
    try {
      const data = await fetchJson('/api/admin/login', { method: 'POST', body: { password } });
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setMessage('登录成功');
    } catch (err) {
      setError(err.message || '登录失败');
    }
  };

  const handleCreateUser = async () => {
    setError('');
    setMessage('');
    try {
      await authedFetch('/api/admin/users', { method: 'POST', body: { name: userForm.name, slug: userForm.slug } });
      setMessage('账户创建成功');
      setUserForm({ name: '', slug: '' });
    } catch (err) {
      setError(err.message || '创建失败');
    }
  };

  const handleCreateCard = async () => {
    setError('');
    setMessage('');
    const initialBalanceCents = Math.round(Number(cardForm.initialBalance || 0) * 100);
    try {
      const data = await authedFetch('/api/admin/cards', {
        method: 'POST',
        body: { name: cardForm.name, ownerSlug: cardForm.ownerSlug, initialBalanceCents, face: cardForm.face },
      });
      const link = `${window.location.origin}/c/${data.card.publicId}`;
      setGeneratedLink(link);
      setMessage('卡片创建成功');
      setCardForm({ name: '', ownerSlug: '', initialBalance: '0', face: CARD_FACES[0].key });
      reloadCards();
    } catch (err) {
      setError(err.message || '创建失败');
    }
  };

  const handleAdjustCard = async () => {
    setError('');
    setMessage('');
    if (!adjustForm.cardKey) {
      setError('请输入卡片 ID 或 publicId');
      return;
    }
    const balanceProvided = adjustForm.newBalance !== '' && adjustForm.newBalance !== null;
    const balanceCents = balanceProvided ? Math.round(Number(adjustForm.newBalance || 0) * 100) : undefined;
    try {
      await authedFetch(`/api/admin/cards/${adjustForm.cardKey}`, {
        method: 'PATCH',
        body: {
          name: adjustForm.newName || undefined,
          ownerSlug: adjustForm.newOwnerSlug || undefined,
          balanceCents,
          face: adjustForm.newFace || undefined,
        },
      });
      setMessage('修改成功');
      setAdjustForm({ cardKey: '', newBalance: '', newOwnerSlug: '', newName: '', newFace: '' });
      reloadCards();
    } catch (err) {
      setError(err.message || '修改失败');
    }
  };

  const handleGenerateLink = async (publicId) => {
    if (!publicId) return;
    setError('');
    setMessage('');
    try {
      const data = await fetchJson(`/api/public/cards/${publicId}/token?days=30`);
      setGeneratedLink(data.url);
      setMessage('已生成 NFC 链接');
    } catch (err) {
      setError(err.message || '生成失败');
    }
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setMessage('已复制链接');
    } catch (err) {
      setError('复制失败');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 space-y-6 border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-emerald-500" /> Admin 控制台</h1>
            <p className="text-sm text-slate-500 mt-1">无前端入口，访问 /admin 进入</p>
          </div>
          <div className="text-xs text-slate-400">默认密码: htl g361254</div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-semibold mb-2">登录</h3>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" type="password" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
            <button onClick={handleLogin} className="mt-3 w-full bg-emerald-500 text-white rounded-xl py-2 font-bold">登录</button>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-semibold mb-2">创建账户</h3>
            <div className="space-y-2">
              <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="姓名" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
              <input value={userForm.slug} onChange={(e) => setUserForm({ ...userForm, slug: e.target.value })} placeholder="slug (拼音/英文)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
            </div>
            <button onClick={handleCreateUser} className="mt-3 w-full bg-slate-800 text-white rounded-xl py-2 font-bold">创建账户</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-semibold mb-2">创建卡片</h3>
            <div className="space-y-2">
              <input value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} placeholder="卡片名称" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
              <input value={cardForm.ownerSlug} onChange={(e) => setCardForm({ ...cardForm, ownerSlug: e.target.value })} placeholder="拥有者 slug" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
              <input value={cardForm.initialBalance} onChange={(e) => setCardForm({ ...cardForm, initialBalance: e.target.value })} placeholder="初始余额 (元)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
              <div className="grid grid-cols-5 gap-2">
                {CARD_FACES.map((face) => (
                  <button
                    type="button"
                    key={face.key}
                    onClick={() => setCardForm({ ...cardForm, face: face.key })}
                    className={`border rounded-xl overflow-hidden bg-white transition ring-2 ${cardForm.face === face.key ? 'ring-orange-400 border-orange-200' : 'ring-transparent border-slate-200'}`}
                  >
                    <img src={`/assets/cards/${face.file}`} alt={face.label} className="w-full h-16 object-cover" />
                    <div className="text-[11px] text-center py-1 font-semibold text-slate-600">{face.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreateCard} className="mt-3 w-full bg-orange-500 text-white rounded-xl py-2 font-bold">创建卡片</button>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-semibold mb-2">修改卡片</h3>
            <div className="space-y-2">
              <input value={adjustForm.cardKey} onChange={(e) => setAdjustForm({ ...adjustForm, cardKey: e.target.value })} placeholder="卡片 ID 或 publicId" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
              <input value={adjustForm.newName} onChange={(e) => setAdjustForm({ ...adjustForm, newName: e.target.value })} placeholder="新名称 (可选)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
              <input value={adjustForm.newOwnerSlug} onChange={(e) => setAdjustForm({ ...adjustForm, newOwnerSlug: e.target.value })} placeholder="新拥有者 slug (可选)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
              <input value={adjustForm.newBalance} onChange={(e) => setAdjustForm({ ...adjustForm, newBalance: e.target.value })} placeholder="设定余额 (元，可选)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2" />
              <select value={adjustForm.newFace} onChange={(e) => setAdjustForm({ ...adjustForm, newFace: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="">卡面不变</option>
                {CARD_FACES.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
            <button onClick={handleAdjustCard} className="mt-3 w-full bg-blue-500 text-white rounded-xl py-2 font-bold">提交修改</button>
          </div>
        </div>

        {generatedLink && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold text-emerald-700">NFC 链接</div>
              <div className="text-emerald-800 break-all text-xs">{generatedLink}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyLink} className="px-3 py-2 bg-white rounded-xl border border-emerald-100 text-emerald-700 flex items-center gap-1"><Clipboard size={16} /> 复制</button>
            </div>
          </div>
        )}

        {(message || error) && (
          <div className={`p-3 rounded-xl text-sm ${message ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} border ${message ? 'border-emerald-100' : 'border-rose-100'}`}>
            {message || error}
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-slate-500" />
            <h3 className="font-semibold">当前卡片</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {cards.map((card) => (
              <div key={card.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  {card.faceUrl && <img src={card.faceUrl} alt={card.name} className="w-16 h-10 rounded-lg object-cover border border-slate-200" />}
                  <div>
                    <div className="text-sm font-semibold">{card.name}</div>
                    <div className="text-xs text-slate-500">Owner: {card.ownerName}</div>
                  </div>
                </div>
                <div className="text-lg font-bold mt-1">¥ {card.balance}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => handleGenerateLink(card.publicId)} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg flex items-center gap-1"><LinkIcon size={14} /> 链接</button>
                </div>
              </div>
            ))}
            {!cards.length && <div className="text-sm text-slate-500">暂无卡片</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const WalletScreen = ({ deepLink }) => {
  const [viewState, setViewState] = useState(deepLink.publicId || deepLink.token ? 'detail' : 'folded');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showInputModal, setShowInputModal] = useState(null);
  const [currentWalletStyleIndex, setCurrentWalletStyleIndex] = useState(0);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');

  const currentWalletStyle = walletStyles[currentWalletStyleIndex];

  const handleWalletStyleChange = (direction) => {
    if (viewState !== 'folded') {
      setViewState('folded');
      setTimeout(() => {
        setCurrentWalletStyleIndex((prevIndex) => (prevIndex + direction + walletStyles.length) % walletStyles.length);
      }, 300);
    } else {
      setCurrentWalletStyleIndex((prevIndex) => (prevIndex + direction + walletStyles.length) % walletStyles.length);
    }
  };

  const loadCards = async () => {
    setLoading(true);
    setError('');
    try {
      if (deepLink.token) {
        const data = await fetchJson(`/api/public/cards/by-token/${deepLink.token}`);
        const normalized = normalizeCard(data.card, 0);
        setCards([normalized]);
        setSelectedCardId(normalized.id);
        setViewState('detail');
        setOwnerFilter(normalized.ownerKey || 'all');
      } else if (deepLink.publicId) {
        const data = await fetchJson(`/api/public/cards/${deepLink.publicId}`);
        const normalized = normalizeCard(data.card, 0);
        setCards([normalized]);
        setSelectedCardId(normalized.id);
        setViewState('detail');
        setOwnerFilter(normalized.ownerKey || 'all');
      } else {
        const data = await fetchJson('/api/public/cards');
        const normalized = (data.cards || []).map((c, idx) => normalizeCard(c, idx));
        setCards(normalized);
        if (normalized.length && !selectedCardId) setSelectedCardId(normalized[0].id);
        setOwnerFilter('all');
      }
    } catch (err) {
      setError(err.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [deepLink.publicId, deepLink.token]);

  const ownerOptions = React.useMemo(() => {
    const map = new Map();
    cards.forEach((c) => {
      const key = c.ownerKey || c.ownerName;
      if (!map.has(key)) map.set(key, c.ownerName);
    });
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [cards]);

  const visibleCards = React.useMemo(() => {
    if (ownerFilter === 'all') return cards;
    return cards.filter((c) => (c.ownerKey || c.ownerName) === ownerFilter);
  }, [cards, ownerFilter]);

  useEffect(() => {
    if (!visibleCards.length && cards.length) {
      setOwnerFilter('all');
      return;
    }
    if (visibleCards.length && !visibleCards.find((c) => c.id === selectedCardId)) {
      setSelectedCardId(visibleCards[0].id);
    }
  }, [visibleCards, cards, selectedCardId]);

  const selectedCard = visibleCards.find((c) => c.id === selectedCardId) || visibleCards[0];

  const getCardStyle = (index) => {
    const baseStyle = {
      transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
      position: 'absolute',
      left: '50%',
      marginLeft: '-165px',
      width: '330px',
      height: '192px',
    };

    if (viewState === 'folded') {
      const rotateAngle = (index - 1) * 6;
      const xOffset = (index - 1) * 20;
      const yOffset = Math.abs(index - 1) * 8;
      const baseBottom = 180;
      const stackOffset = (visibleCards.length - 1 - index) * 35;
      return {
        ...baseStyle,
        bottom: `${baseBottom + stackOffset - yOffset}px`,
        transform: `translateX(${xOffset}px) rotate(${rotateAngle}deg) scale(${0.95})`,
        zIndex: 10 + index,
        filter: 'brightness(0.98)',
        transformOrigin: 'bottom center',
      };
    }
    if (viewState === 'expanded') {
      return {
        ...baseStyle,
        bottom: 'auto',
        top: `${140 + index * 150}px`,
        transform: 'scale(1) rotate(0deg)',
        zIndex: 10 + index,
        filter: 'brightness(1)',
        boxShadow: '0 15px 35px -10px rgba(0,0,0,0.15)',
      };
    }
    const isSelected = visibleCards[index]?.id === selectedCardId;
    if (isSelected) {
      return {
        ...baseStyle,
        bottom: 'auto',
        top: '110px',
        transform: 'scale(1) rotate(0deg)',
        zIndex: 50,
        filter: 'brightness(1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
      };
    }
    return {
      ...baseStyle,
      bottom: '-300px',
      transform: 'scale(0.8) rotate(0deg)',
      opacity: 0,
      zIndex: 0,
    };
  };

  const handleCardClick = (e, id) => {
    e.stopPropagation();
    if (viewState === 'folded') {
      setViewState('expanded');
    } else if (viewState === 'expanded') {
      setSelectedCardId(id);
      setViewState('detail');
    }
  };

  const handleBack = () => {
    if (viewState === 'detail') {
      setViewState('expanded');
      setSelectedCardId(null);
    } else if (viewState === 'expanded') {
      setViewState('folded');
    }
  };

  const submitTransaction = async () => {
    if (!selectedCard) return;
    const amountCents = Math.round(Number(amountInput || 0) * 100);
    if (!amountCents) {
      setError('请输入金额');
      return;
    }
    try {
      const payload = {
        type: showInputModal,
        amountCents: amountCents,
        category: selectedCategory || null,
      };
      if (deepLink.token) {
        await fetchJson(`/api/public/cards/by-token/${deepLink.token}/transactions`, { method: 'POST', body: payload });
      } else {
        await fetchJson(`/api/public/cards/${selectedCard.publicId}/transactions`, { method: 'POST', body: payload });
      }
      setAmountInput('');
      setSelectedCategory('');
      setShowInputModal(null);
      loadCards();
    } catch (err) {
      setError(err.message || '提交失败');
    }
  };

  const handleWalletClick = () => {
    if (viewState === 'folded') {
      setViewState('expanded');
    } else if (viewState === 'expanded') {
      setViewState('folded');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] font-sans text-slate-600 flex items-center justify-center overflow-hidden relative select-none">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#C8BFA9 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
      <div className="w-full max-w-md h-screen md:h-[850px] md:rounded-[3.5rem] bg-[#FAF9F6] relative shadow-[0_0_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col ring-8 ring-white/50">
        <div className="h-24 px-8 flex items-center justify-between z-40 pt-6 transition-all duration-300">
          {viewState !== 'folded' ? (
            <button onClick={handleBack} className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 text-slate-600">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className="w-10"></div>
          )}
          <span className={`font-bold text-xl text-slate-700 tracking-wide opacity-80 transition-opacity duration-300 ${viewState === 'folded' ? 'opacity-0' : 'opacity-100'}`}>
            {viewState === 'detail' ? selectedCard?.name : '家庭钱包'}
          </span>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 relative w-full" onClick={viewState === 'expanded' ? handleBack : undefined}>
          {!deepLink.publicId && !deepLink.token && (
            <div className="absolute top-[90px] left-0 right-0 px-6 z-40 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={(e) => { e.stopPropagation(); setOwnerFilter('all'); }}
                className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition ${ownerFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                全部
              </button>
              {ownerOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={(e) => { e.stopPropagation(); setOwnerFilter(o.key); }}
                  className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition ${ownerFilter === o.key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          )}
          <div className={`absolute top-[8%] left-0 right-0 text-center transition-all duration-700 flex flex-col items-center justify-center ${viewState === 'folded' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
            <div className="mb-6 p-4 bg-[#F5F0E6] rounded-full shadow-inner transform scale-110 border border-white">
              <Sparkles size={28} className="text-[#C9A885]" />
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="h-[1px] w-16 bg-[#C9A885]/40"></div>
              <p className="text-[#8B6B4F] text-lg font-medium italic font-serif tracking-wider">"积少成多，汇聚爱意"</p>
              <p className="text-[#C8BFA9] text-xs font-medium uppercase tracking-[0.3em] mt-1">Where love resides</p>
              <div className="h-[1px] w-16 bg-[#C9A885]/40"></div>
            </div>
            <div className="mt-12 animate-bounce opacity-50">
              <div className="w-1.5 h-1.5 bg-[#C9A885] rounded-full mb-1.5 mx-auto"></div>
              <div className="w-1.5 h-1.5 bg-[#C9A885] rounded-full mb-1.5 mx-auto"></div>
              <div className="w-1.5 h-1.5 bg-[#C9A885] rounded-full mx-auto"></div>
            </div>
          </div>

          {visibleCards.map((card, index) => (
            <div key={card.id} onClick={(e) => handleCardClick(e, card.id)} className="rounded-[1.5rem] p-6 cursor-pointer overflow-hidden border border-white/40 flex flex-col justify-between group hover:brightness-105 origin-bottom" style={getCardStyle(index)}>
              <div className={`absolute inset-0 ${card.color}`} style={card.faceUrl ? { backgroundImage: `url(${card.faceUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}></div>
              <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ filter: 'contrast(120%) brightness(100%)', backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
              <div className={`relative z-10 h-full flex flex-col justify-between ${card.textColor}`}>
                <div className="flex justify-between items-start">
                  <div className={`${card.iconBg} w-10 h-10 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm`}>{card.icon || <CreditCard className="text-white" size={24} />}</div>
                  <CreditCard className="opacity-20" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold opacity-80 tracking-wide mt-2">{card.ownerName}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold opacity-80">¥</span>
                    <span className="text-4xl font-bold tracking-tighter">{card.balance}</span>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-sm font-medium opacity-70 invisible">Hidden</span>
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[92%] h-[38%] rounded-t-[${currentWalletStyle.borderRadius}] shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] transition-all duration-700 ease-out-back ${viewState === 'folded' ? 'translate-y-0' : viewState === 'expanded' ? 'translate-y-[250px]' : 'translate-y-[800px]'}`}
            style={{ zIndex: 5, backgroundColor: currentWalletStyle.backBgColor, backgroundImage: currentWalletStyle.texture, backgroundBlendMode: 'overlay', backgroundSize: '10px 10px' }}>
            <div className="absolute inset-0 rounded-t-[2.5rem] bg-gradient-to-b from-black/20 to-transparent pointer-events-none opacity-50"></div>
          </div>

          <div onClick={handleWalletClick} className={`absolute bottom-0 left-0 right-0 h-[35%] rounded-t-[${currentWalletStyle.borderRadius}] cursor-pointer transition-all duration-700 ease-out-back group ${viewState === 'folded' ? 'translate-y-0' : viewState === 'expanded' ? 'translate-y-[220px]' : 'translate-y-[800px]'}`}
            style={{ zIndex: 30, backgroundColor: currentWalletStyle.frontBgColor, backgroundImage: `${currentWalletStyle.texture}, linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)`, backgroundBlendMode: 'overlay, normal', backgroundSize: '10px 10px', boxShadow: viewState === 'folded' ? '0 -15px 40px -5px rgba(0,0,0,0.25), inset 0 2px 5px rgba(255,255,255,0.2), inset 0 -5px 15px rgba(0,0,0,0.1)' : 'none' }}>
            <div className={`absolute inset-x-5 top-5 bottom-0 border border-dashed rounded-t-[2rem] pointer-events-none shadow-[0_1px_1px_rgba(0,0,0,0.2)_inset]`} style={{ borderWidth: '1.5px', borderColor: `${currentWalletStyle.stitchingColor}99` }}></div>
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/20 to-transparent rounded-t-[2.5rem] pointer-events-none mix-blend-multiply"></div>
            <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 flex flex-col items-center ${viewState === 'folded' ? 'opacity-90' : 'opacity-0'}`}>
              <span className={`font-bold text-[10px] tracking-[0.3em] uppercase font-serif`} style={{ color: currentWalletStyle.textMainColor, textShadow: `0 1px 1px rgba(255,255,255,0.3), 0 -1px 1px ${currentWalletStyle.textShadowColor}` }}>
                Family Wallet
              </span>
              <div className={`w-1 h-1 bg-[${currentWalletStyle.textMainColor}] rounded-full mt-2 opacity-60 shadow-[0_1px_1px_rgba(255,255,255,0.4)]`} style={{ backgroundColor: currentWalletStyle.textMainColor }}></div>
            </div>
            {currentWalletStyle.customContent}
            <div className={`absolute inset-y-0 inset-x-0 flex items-center justify-between pointer-events-none transition-opacity duration-500 ${viewState === 'folded' ? 'opacity-100' : 'opacity-0'}`}>
              <div onClick={(e) => { e.stopPropagation(); handleWalletStyleChange(-1); }} className="w-12 h-20 flex items-center justify-center ml-2 pointer-events-auto cursor-pointer group/nav hover:bg-black/5 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-white/60 group-hover/nav:text-white group-hover/nav:scale-110 transition-all" />
              </div>
              <div onClick={(e) => { e.stopPropagation(); handleWalletStyleChange(1); }} className="w-12 h-20 flex items-center justify-center mr-2 pointer-events-auto cursor-pointer group/nav hover:bg-black/5 rounded-full transition-colors">
                <ChevronRight size={24} className="text-white/60 group-hover/nav:text-white group-hover/nav:scale-110 transition-all" />
              </div>
            </div>
          </div>

          <div className={`absolute inset-x-0 bottom-0 bg-${currentWalletStyle.detailBgColor} rounded-t-[3rem] transition-all duration-500 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] flex flex-col ${viewState === 'detail' ? 'h-[65%]' : 'h-0 opacity-0 pointer-events-none'}`} style={{ zIndex: 60 }}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2"></div>
            <div className="px-8 pt-6 pb-6 grid grid-cols-2 gap-4 shrink-0">
              <button onClick={() => setShowInputModal('expense')} className="h-20 bg-orange-50/80 rounded-[1.5rem] border border-orange-100 flex items-center justify-center gap-3 text-orange-700 font-bold hover:bg-orange-100 active:scale-95 transition-all shadow-sm hover:shadow-orange-100 group">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Minus size={18} className="text-orange-500" />
                </div>
                <span>记支出</span>
              </button>
              <button onClick={() => setShowInputModal('income')} className="h-20 bg-emerald-50/80 rounded-[1.5rem] border border-emerald-100 flex items-center justify-center gap-3 text-emerald-700 font-bold hover:bg-emerald-100 active:scale-95 transition-all shadow-sm hover:shadow-emerald-100 group">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Plus size={18} className="text-emerald-500" />
                </div>
                <span>存一笔</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 relative">
              <div className="sticky top-0 bg-white z-10 pb-4 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">近期动态</h3>
              </div>
              <div className="space-y-1">
                {(selectedCard?.transactions || []).map((t) => (
                  <div key={t.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-default border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${t.type === 'expense' ? 'bg-orange-100 text-orange-600 group-hover:scale-110 group-hover:rotate-3' : 'bg-emerald-100 text-emerald-600 group-hover:scale-110 group-hover:-rotate-3'}`}>
                        {t.type === 'expense' ? <ShoppingBag size={16} /> : <WalletIcon size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-base">{t.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{t.date}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-lg ${t.type === 'expense' ? 'text-slate-800' : 'text-emerald-600'}`}>
                      {t.type === 'expense' ? '-' : '+'}{t.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                {!selectedCard?.transactions?.length && (
                  <div className="py-6 text-center text-xs text-slate-300 font-medium tracking-wider">暂无交易记录</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[200]">
            <div className="px-4 py-2 bg-white rounded-xl shadow text-slate-500">加载中...</div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2 rounded-xl shadow">{error}</div>
        )}

        {showInputModal && (
          <div className="absolute inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-20 duration-300 shadow-2xl ring-1 ring-black/5">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-2xl text-slate-800">{showInputModal === 'expense' ? '记录支出' : '存入资金'}</h3>
                  <p className="text-slate-400 text-sm mt-1">今天又是精打细算的一天</p>
                </div>
                <button onClick={() => setShowInputModal(null)} className="w-10 h-10 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-colors">
                  <X size={22} />
                </button>
              </div>
              <div className="mb-8">
                <div className="relative bg-slate-50 rounded-3xl p-4 ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase ml-2">金额</label>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-slate-800 mr-2">¥</span>
                    <input type="number" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} className="w-full bg-transparent text-4xl font-bold text-slate-800 focus:outline-none placeholder:text-slate-200" placeholder="0.00" autoFocus />
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3 px-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">选择类别</h4>
                  <span className="text-xs text-orange-500 font-bold cursor-pointer">可选</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {(showInputModal === 'expense' ? expenseCategories : incomeCategories).map((category, idx) => (
                    <button key={idx} onClick={() => setSelectedCategory(category.name === selectedCategory ? '' : category.name)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl border ${selectedCategory === category.name ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-50 hover:bg-white border-transparent hover:border-orange-100 hover:shadow-lg hover:shadow-orange-100/50 text-slate-500 hover:text-orange-600'} transition-all group`}>
                      <div className="mb-1.5 group-hover:scale-110 transition-transform">{category.icon}</div>
                      <span className="text-[10px] font-bold">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={submitTransaction} className={`w-full h-16 rounded-2xl font-bold text-white text-xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 ${showInputModal === 'expense' ? 'bg-gradient-to-r from-orange-400 to-rose-400 shadow-orange-200' : 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-emerald-200'}`}>
                <span>确认{showInputModal === 'expense' ? '支出' : '存入'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FamilyWallet = () => {
  const deepLink = useMemo(parseDeepLink, []);
  if (deepLink.mode === 'admin') {
    return <AdminPanel />;
  }
  return <WalletScreen deepLink={deepLink} />;
};

export default FamilyWallet;
