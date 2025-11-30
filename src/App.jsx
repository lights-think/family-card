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
  Trash2,
  ShieldCheck,
  Link as LinkIcon,
  Clipboard,
  Palette,
  Edit,
  DollarSign,
} from 'lucide-react';

const API_BASE = '';

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
  { name: '家务', icon: <Home size={20} /> },
  { name: '发明', icon: <Zap size={20} /> },
  { name: '创造', icon: <Sparkles size={20} /> },
  { name: '文章', icon: <BookOpen size={20} /> },
];

// 默认保底样式 - Cute Bear
const defaultWalletStyle = {
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
};

// 从图片生成卡包样式
const generateWalletStyleFromImage = (imageUrl, imageName) => ({
  name: imageName,
  backBgColor: '#A48466',
  frontBgColor: '#BFA07F',
  stitchingColor: '#E8D4BE',
  textShadowColor: '#6B4E3D',
  textMainColor: '#5D4037',
  texture: `url("${imageUrl}")`,
  textureOpacity: 1,
  borderRadius: '2.5rem',
  detailBgColor: 'white',
  detailTextColor: 'slate-600',
  customContent: null,
  imageUrl: imageUrl,
});

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
  // 用户级别链接: /u/:slug
  if (path.startsWith('/u/')) {
    const slug = path.split('/u/')[1].split('/')[0];
    return { mode: 'wallet', userSlug: slug };
  }
  // 兼容旧的卡片级别链接 (但不再生成新的)
  const publicId = path.startsWith('/c/') ? path.split('/c/')[1].split('/')[0] : search.get('card');
  const token = search.get('token');
  return { mode: 'wallet', publicId, token };
};

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('adminToken'));
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [cardFaces, setCardFaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);
  const [cardForm, setCardForm] = useState({ name: '', ownerSlug: '', initialBalance: '0', face: '' });
  const [userForm, setUserForm] = useState({ name: '', slug: '' });
  // 设置余额弹窗
  const [balanceModal, setBalanceModal] = useState(null); // { card, newBalance }
  // 修改样式弹窗
  const [styleModal, setStyleModal] = useState(null); // { card, newFace }
  
  // 从 URL 获取用户 ID 筛选参数
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFilter = urlParams.get('user');

  const authedFetch = async (path, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetchJson(path, { ...options, headers });
  };

  const reloadData = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      // 获取卡面列表
      const facesData = await fetchJson('/api/public/card-faces');
      const faces = facesData.faces || [];
      setCardFaces(faces);
      if (faces.length && !cardForm.face) {
        setCardForm(prev => ({ ...prev, face: faces[0].key }));
      }
      
      const cardsData = await fetchJson('/api/public/cards');
      const normalized = (cardsData.cards || []).map((c, idx) => normalizeCard(c, idx));
      setCards(normalized);
      
      // 获取用户列表
      const usersData = await authedFetch('/api/admin/users');
      setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      reloadData();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await fetchJson('/api/admin/login', { method: 'POST', body: { password } });
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setIsLoggedIn(true);
      setPassword('');
    } catch (err) {
      setError(err.message || '密码错误');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setIsLoggedIn(false);
    setCards([]);
    setUsers([]);
  };

  // 生成用户级别的 NFC 链接（通过 slug 标识）
  const generateUserNfcLink = (slug) => {
    return `${window.location.origin}/u/${slug}`;
  };

  const copyToClipboard = async (text, cardId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(cardId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setError('复制失败');
    }
  };

  // 创建卡片
  const handleCreateCard = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const initialBalanceCents = Math.round(Number(cardForm.initialBalance || 0) * 100);
    try {
      await authedFetch('/api/admin/cards', {
        method: 'POST',
        body: { name: cardForm.name, ownerSlug: cardForm.ownerSlug, initialBalanceCents, face: cardForm.face },
      });
      setMessage('卡片创建成功');
      setCardForm({ name: '', ownerSlug: '', initialBalance: '0', face: cardFaces[0]?.key || '' });
      setShowCreateCard(false);
      reloadData();
    } catch (err) {
      setError(err.message || '创建失败');
    }
  };

  // 创建用户
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await authedFetch('/api/admin/users', { method: 'POST', body: { name: userForm.name, slug: userForm.slug } });
      setMessage('用户创建成功');
      setUserForm({ name: '', slug: '' });
      setShowCreateUser(false);
      reloadData();
    } catch (err) {
      setError(err.message || '创建失败');
    }
  };

  // 删除卡片
  const handleDeleteCard = async (cardId) => {
    setError('');
    setMessage('');
    try {
      await authedFetch(`/api/admin/cards/${cardId}`, { method: 'DELETE' });
      setMessage('卡片已删除');
      setDeleteConfirm(null);
      reloadData();
    } catch (err) {
      setError(err.message || '删除失败');
    }
  };

  // 设置余额
  const handleSetBalance = async () => {
    if (!balanceModal) return;
    setError('');
    setMessage('');
    try {
      const newBalanceCents = Math.round(Number(balanceModal.newBalance) * 100);
      await authedFetch(`/api/admin/cards/${balanceModal.card.id}`, {
        method: 'PATCH',
        body: { balanceCents: newBalanceCents },
      });
      setMessage('余额已更新');
      setBalanceModal(null);
      reloadData();
    } catch (err) {
      setError(err.message || '更新失败');
    }
  };

  // 修改卡面样式
  const handleSetStyle = async () => {
    if (!styleModal) return;
    setError('');
    setMessage('');
    try {
      await authedFetch(`/api/admin/cards/${styleModal.card.id}`, {
        method: 'PATCH',
        body: { face: styleModal.newFace },
      });
      setMessage('卡面样式已更新');
      setStyleModal(null);
      reloadData();
    } catch (err) {
      setError(err.message || '更新失败');
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId) => {
    setError('');
    setMessage('');
    try {
      await authedFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setMessage('用户已删除');
      setDeleteUserConfirm(null);
      reloadData();
    } catch (err) {
      setError(err.message || '删除失败');
    }
  };

  // 根据用户ID筛选卡片
  const filteredCards = userIdFilter 
    ? cards.filter(card => String(card.owner?.id) === userIdFilter || card.ownerSlug === userIdFilter)
    : cards;

  // 获取当前筛选用户信息
  const currentUser = userIdFilter 
    ? users.find(u => String(u.id) === userIdFilter || u.slug === userIdFilter)
    : null;

  // 登录页面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">管理员登录</h1>
              <p className="text-slate-500 text-sm mt-2">请输入管理员密码以继续</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm text-center">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl py-3 font-bold text-lg transition-all active:scale-[0.98]"
              >
                {loading ? '验证中...' : '登录'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 控制台页面
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">Family Wallet 控制台</h1>
              {currentUser && (
                <p className="text-xs text-slate-500">当前查看: {currentUser.name} 的卡片</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 用户筛选提示 */}
        {userIdFilter && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                正在查看 {currentUser?.name || `用户 ${userIdFilter}`} 的卡片
              </p>
              <p className="text-xs text-blue-600">用户 ID: {userIdFilter}</p>
            </div>
            <a
              href="/admin"
              className="px-3 py-1.5 text-sm bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              返回全部
            </a>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">总用户数</p>
            <p className="text-2xl font-bold text-slate-800">{users.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">总卡片数</p>
            <p className="text-2xl font-bold text-slate-800">{cards.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">当前显示</p>
            <p className="text-2xl font-bold text-emerald-600">{filteredCards.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">总余额</p>
            <p className="text-2xl font-bold text-orange-500">
              ¥{filteredCards.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* 消息提示 */}
        {(message || error) && (
          <div className={`mb-6 p-4 rounded-2xl text-sm ${message ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
            {message || error}
          </div>
        )}

        {/* 卡片列表 */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <CreditCard size={18} className="text-slate-500" />
              卡片管理
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateCard(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus size={16} />
                添加卡片
              </button>
              <button
                onClick={reloadData}
                disabled={loading}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {loading ? '加载中...' : '刷新'}
              </button>
            </div>
          </div>
          
          {/* 表格头部 */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">ID</div>
            <div className="col-span-2">卡片信息</div>
            <div className="col-span-1">所有者</div>
            <div className="col-span-1">用户</div>
            <div className="col-span-1 text-right">余额</div>
            <div className="col-span-6 text-right">操作</div>
          </div>

          {/* 卡片列表 */}
          <div className="divide-y divide-slate-100">
            {filteredCards.map((card) => (
              <div key={card.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center">
                  {/* 卡片ID */}
                  <div className="col-span-1 mb-2 md:mb-0">
                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                      #{card.id}
                    </span>
                  </div>
                  
                  {/* 卡片信息 */}
                  <div className="col-span-2 flex items-center gap-2 mb-2 md:mb-0">
                    {card.faceUrl && (
                      <img 
                        src={card.faceUrl} 
                        alt={card.name} 
                        className="w-10 h-7 rounded object-cover border border-slate-200 flex-shrink-0" 
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate text-sm">{card.name}</p>
                      <p className="text-xs text-slate-400 font-mono truncate">{card.publicId}</p>
                    </div>
                  </div>
                  
                  {/* 所有者 */}
                  <div className="col-span-1 mb-2 md:mb-0">
                    <p className="text-sm text-slate-700 truncate">{card.ownerName}</p>
                  </div>
                  
                  {/* 用户ID */}
                  <div className="col-span-1 mb-2 md:mb-0">
                    <a 
                      href={`/admin?user=${card.owner?.id || ''}`}
                      className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 text-xs font-mono rounded hover:bg-blue-100 transition-colors"
                    >
                      {card.owner?.id || '-'}
                    </a>
                  </div>
                  
                  {/* 余额 */}
                  <div className="col-span-1 text-right mb-3 md:mb-0">
                    <p className="text-sm font-bold text-slate-800">¥{card.balance}</p>
                  </div>
                  
                  {/* 操作 */}
                  <div className="col-span-6 flex justify-end gap-2">
                    <button
                      onClick={() => setBalanceModal({ card, newBalance: card.balance })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-all"
                      title="设置余额"
                    >
                      <DollarSign size={14} />
                    </button>
                    <button
                      onClick={() => setStyleModal({ card, newFace: card.face || '' })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-all"
                      title="修改样式"
                    >
                      <Palette size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(card.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {!filteredCards.length && (
              <div className="p-12 text-center text-slate-400">
                <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                <p>暂无卡片数据</p>
              </div>
            )}
          </div>
        </div>

        {/* 用户列表 */}
        {!userIdFilter && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">用户列表</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors"
              >
                <Plus size={16} />
                添加用户
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400">ID: {user.id} · Slug: {user.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(generateUserNfcLink(user.slug), `user-${user.id}`)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        copiedId === `user-${user.id}` 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {copiedId === `user-${user.id}` ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          已复制
                        </>
                      ) : (
                        <>
                          <Clipboard size={14} />
                          NFC链接
                        </>
                      )}
                    </button>
                    <a
                      href={generateUserNfcLink(user.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <LinkIcon size={14} />
                      打开
                    </a>
                    <a
                      href={`/admin?user=${user.id}`}
                      className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      查看卡片
                    </a>
                    <button
                      onClick={() => setDeleteUserConfirm(user)}
                      className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                      title="删除用户"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 创建卡片弹窗 */}
      {showCreateCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">创建新卡片</h3>
              <button onClick={() => setShowCreateCard(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">卡片名称</label>
                <input
                  type="text"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  placeholder="例如：妈妈的购物卡"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">所有者 Slug</label>
                <input
                  type="text"
                  value={cardForm.ownerSlug}
                  onChange={(e) => setCardForm({ ...cardForm, ownerSlug: e.target.value })}
                  placeholder="例如：mom"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">用户列表：{users.map(u => u.slug).join(', ') || '暂无用户'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">初始余额（元）</label>
                <input
                  type="number"
                  step="0.01"
                  value={cardForm.initialBalance}
                  onChange={(e) => setCardForm({ ...cardForm, initialBalance: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">选择卡面</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {cardFaces.map((face) => (
                    <button
                      type="button"
                      key={face.key}
                      onClick={() => setCardForm({ ...cardForm, face: face.key })}
                      className={`border rounded-xl overflow-hidden transition ring-2 ${cardForm.face === face.key ? 'ring-emerald-500 border-emerald-200' : 'ring-transparent border-slate-200'}`}
                    >
                      <img src={face.url} alt={face.label} className="w-full h-12 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCard(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
                >
                  创建卡片
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 创建用户弹窗 */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">创建新用户</h3>
              <button onClick={() => setShowCreateUser(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">用户名称</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="例如：妈妈"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">用户 Slug</label>
                <input
                  type="text"
                  value={userForm.slug}
                  onChange={(e) => setUserForm({ ...userForm, slug: e.target.value })}
                  placeholder="例如：mom（用于标识用户，只能用英文）"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-medium"
                >
                  创建用户
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">确认删除</h3>
              <p className="text-sm text-slate-500 mt-2">删除后无法恢复，卡片的所有交易记录也将被删除。</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteCard(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 设置余额弹窗 */}
      {balanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">设置余额</h3>
              <button onClick={() => setBalanceModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            {/* 卡片预览 */}
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                {balanceModal.card.faceUrl && (
                  <img src={balanceModal.card.faceUrl} alt="" className="w-12 h-8 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-semibold text-slate-800">{balanceModal.card.name}</p>
                  <p className="text-xs text-slate-500">{balanceModal.card.ownerName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">当前余额</span>
                <span className="font-bold text-slate-800">¥{balanceModal.card.balance}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">新余额（元）</label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceModal.newBalance}
                  onChange={(e) => setBalanceModal({ ...balanceModal, newBalance: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-semibold"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">余额变动将记录在交易历史中</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModal(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSetBalance}
                  className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
                >
                  确认修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 修改样式弹窗 */}
      {styleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">修改卡面样式</h3>
              <button onClick={() => setStyleModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            {/* 卡片预览 */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">预览效果</p>
              <div className="relative w-full max-w-xs mx-auto aspect-[1.6/1] rounded-2xl overflow-hidden shadow-lg">
                {styleModal.newFace ? (
                  <img 
                    src={`/assets/cards/${styleModal.newFace}`} 
                    alt="卡面预览" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400">
                    无卡面
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <p className="font-bold text-lg drop-shadow">{styleModal.card.name}</p>
                  <p className="text-sm opacity-80">{styleModal.card.ownerName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">选择卡面</label>
                <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
                  {cardFaces.map((face) => (
                    <button
                      type="button"
                      key={face.key}
                      onClick={() => setStyleModal({ ...styleModal, newFace: face.key })}
                      className={`border-2 rounded-xl overflow-hidden transition-all ${styleModal.newFace === face.key ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-200 hover:border-purple-300'}`}
                    >
                      <img src={face.url} alt={face.label} className="w-full h-14 object-cover" />
                      <p className="text-xs text-slate-500 p-1 truncate">{face.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStyleModal(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSetStyle}
                  className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-medium"
                >
                  确认修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除用户确认弹窗 */}
      {deleteUserConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">确认删除用户</h3>
              <p className="text-sm text-slate-500 mt-2">
                将删除用户 <span className="font-semibold text-slate-700">{deleteUserConfirm.name}</span> 及其所有卡片和交易记录，此操作无法恢复。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteUserConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteUser(deleteUserConfirm.id)}
                className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WalletScreen = ({ deepLink }) => {
  const [viewState, setViewState] = useState(deepLink.publicId || deepLink.token ? 'detail' : 'folded');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showInputModal, setShowInputModal] = useState(null);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [currentWalletStyleIndex, setCurrentWalletStyleIndex] = useState(0);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [walletStyles, setWalletStyles] = useState([defaultWalletStyle]);

  const currentWalletStyle = walletStyles[currentWalletStyleIndex] || defaultWalletStyle;

  // 加载卡包样式图片
  const loadWalletStyles = async () => {
    try {
      const data = await fetchJson('/api/public/wallet-styles');
      const styles = (data.styles || []).map(s => generateWalletStyleFromImage(s.url, s.label));
      // 始终保留 Cute Bear 作为保底样式
      setWalletStyles([defaultWalletStyle, ...styles]);
    } catch (err) {
      console.error('Failed to load wallet styles:', err);
      // 加载失败时使用默认样式
      setWalletStyles([defaultWalletStyle]);
    }
  };

  useEffect(() => {
    loadWalletStyles();
  }, []);

  const handleSelectWalletStyle = (index) => {
    if (viewState !== 'folded') {
      setViewState('folded');
      setTimeout(() => {
        setCurrentWalletStyleIndex(index);
        setShowStylePicker(false);
      }, 300);
    } else {
      setCurrentWalletStyleIndex(index);
      setShowStylePicker(false);
    }
  };

  const loadCards = async () => {
    setLoading(true);
    setError('');
    try {
      if (deepLink.userSlug) {
        // 用户级别链接：加载该用户的所有卡片
        const data = await fetchJson(`/api/public/users/${deepLink.userSlug}/cards`);
        const normalized = (data.cards || []).map((c, idx) => normalizeCard(c, idx));
        setCards(normalized);
        if (normalized.length && !selectedCardId) setSelectedCardId(normalized[0].id);
      } else if (deepLink.token) {
        const data = await fetchJson(`/api/public/cards/by-token/${deepLink.token}`);
        const normalized = normalizeCard(data.card, 0);
        setCards([normalized]);
        setSelectedCardId(normalized.id);
        setViewState('detail');
      } else if (deepLink.publicId) {
        const data = await fetchJson(`/api/public/cards/${deepLink.publicId}`);
        const normalized = normalizeCard(data.card, 0);
        setCards([normalized]);
        setSelectedCardId(normalized.id);
        setViewState('detail');
      } else {
        const data = await fetchJson('/api/public/cards');
        const normalized = (data.cards || []).map((c, idx) => normalizeCard(c, idx));
        setCards(normalized);
        if (normalized.length && !selectedCardId) setSelectedCardId(normalized[0].id);
      }
    } catch (err) {
      setError(err.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [deepLink.publicId, deepLink.token, deepLink.userSlug]);

  useEffect(() => {
    if (cards.length && !cards.find((c) => c.id === selectedCardId)) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

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
      const stackOffset = (cards.length - 1 - index) * 35;
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
    const isSelected = cards[index]?.id === selectedCardId;
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
          <button 
            onClick={() => setShowStylePicker(!showStylePicker)} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${showStylePicker ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 shadow-sm hover:bg-slate-50'}`}
          >
            <Palette size={18} />
          </button>
        </div>

        <div className="flex-1 relative w-full" onClick={viewState === 'expanded' ? handleBack : undefined}>
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

          {cards.map((card, index) => (
            <div key={card.id} onClick={(e) => handleCardClick(e, card.id)} className="rounded-[1.5rem] p-6 cursor-pointer overflow-hidden border border-white/40 flex flex-col justify-between group hover:brightness-105 origin-bottom" style={getCardStyle(index)}>
              <div className={`absolute inset-0 ${card.color}`} style={card.faceUrl ? { backgroundImage: `url(${card.faceUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}></div>
              <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ filter: 'contrast(120%) brightness(100%)', backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
              <div className={`relative z-10 h-full flex flex-col justify-between ${card.textColor}`}>
                <div className="flex justify-end items-start">
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
            style={{ 
              zIndex: 5, 
              backgroundColor: currentWalletStyle.backBgColor, 
              backgroundImage: currentWalletStyle.imageUrl ? `url(${currentWalletStyle.imageUrl})` : currentWalletStyle.texture, 
              backgroundBlendMode: currentWalletStyle.imageUrl ? 'normal' : 'overlay', 
              backgroundSize: currentWalletStyle.imageUrl ? 'cover' : '10px 10px',
              backgroundPosition: 'center'
            }}>
            <div className="absolute inset-0 rounded-t-[2.5rem] bg-gradient-to-b from-black/20 to-transparent pointer-events-none opacity-50"></div>
          </div>

          <div onClick={handleWalletClick} className={`absolute bottom-0 left-0 right-0 h-[35%] rounded-t-[${currentWalletStyle.borderRadius}] cursor-pointer transition-all duration-700 ease-out-back group ${viewState === 'folded' ? 'translate-y-0' : viewState === 'expanded' ? 'translate-y-[220px]' : 'translate-y-[800px]'}`}
            style={{ 
              zIndex: 30, 
              backgroundColor: currentWalletStyle.frontBgColor, 
              backgroundImage: currentWalletStyle.imageUrl 
                ? `url(${currentWalletStyle.imageUrl}), linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)` 
                : `${currentWalletStyle.texture}, linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)`, 
              backgroundBlendMode: 'overlay, normal', 
              backgroundSize: currentWalletStyle.imageUrl ? 'cover, 100% 100%' : '10px 10px',
              backgroundPosition: 'center',
              boxShadow: viewState === 'folded' ? '0 -15px 40px -5px rgba(0,0,0,0.25), inset 0 2px 5px rgba(255,255,255,0.2), inset 0 -5px 15px rgba(0,0,0,0.1)' : 'none' 
            }}>
            <div className={`absolute inset-x-5 top-5 bottom-0 border border-dashed rounded-t-[2rem] pointer-events-none shadow-[0_1px_1px_rgba(0,0,0,0.2)_inset]`} style={{ borderWidth: '1.5px', borderColor: `${currentWalletStyle.stitchingColor}99` }}></div>
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/20 to-transparent rounded-t-[2.5rem] pointer-events-none mix-blend-multiply"></div>
            <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 flex flex-col items-center ${viewState === 'folded' ? 'opacity-90' : 'opacity-0'}`}>
              <span className={`font-bold text-[10px] tracking-[0.3em] uppercase font-serif`} style={{ color: currentWalletStyle.textMainColor, textShadow: `0 1px 1px rgba(255,255,255,0.3), 0 -1px 1px ${currentWalletStyle.textShadowColor}` }}>
                Family Wallet
              </span>
              <div className={`w-1 h-1 bg-[${currentWalletStyle.textMainColor}] rounded-full mt-2 opacity-60 shadow-[0_1px_1px_rgba(255,255,255,0.4)]`} style={{ backgroundColor: currentWalletStyle.textMainColor }}></div>
            </div>
            {currentWalletStyle.customContent}
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
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{new Date(t.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
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
          <div className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center">
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

        {/* 样式选择弹出层 */}
        {showStylePicker && (
          <div className="absolute top-20 right-6 z-[150] animate-in slide-in-from-top-2 duration-200">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-3 min-w-[180px]">
              <div className="space-y-2">
                {walletStyles.map((style, index) => (
                  <button
                    key={style.name}
                    onClick={() => handleSelectWalletStyle(index)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${currentWalletStyleIndex === index ? 'bg-slate-100 ring-2 ring-slate-300' : 'hover:bg-slate-50'}`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl shadow-sm flex-shrink-0 border border-white/50 overflow-hidden"
                      style={style.imageUrl ? {
                        backgroundImage: `url(${style.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      } : { 
                        backgroundColor: style.frontBgColor,
                        backgroundImage: style.texture,
                        backgroundBlendMode: 'overlay',
                        backgroundSize: '8px 8px'
                      }}
                    />
                    <span className="text-sm font-medium text-slate-700 truncate">{style.name}</span>
                    {currentWalletStyleIndex === index && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 点击其他区域关闭样式选择器 */}
        {showStylePicker && (
          <div 
            className="absolute inset-0 z-[140]" 
            onClick={() => setShowStylePicker(false)}
          />
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
