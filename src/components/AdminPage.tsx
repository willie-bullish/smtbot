import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { DataService } from '../services/data';

const AdminPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'tasks' | 'announcements' | 'users'>('tasks');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Access denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>

      <button
        onClick={() => navigate('/main')}
        className="mb-4 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-all"
      >
        ← Back to Homepage
      </button>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${msg.ok ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-2 p-1 bg-gray-900 rounded-xl border border-gray-800 mb-6">
        {(['tasks', 'announcements', 'users'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              tab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'tasks' ? 'Tasks' : t === 'announcements' ? 'Announcements' : 'Users'}
          </button>
        ))}
      </div>

      {tab === 'tasks' && <TaskForm adminId={user.id} flash={flash} />}
      {tab === 'announcements' && <AnnouncementForm adminId={user.id} flash={flash} />}
      {tab === 'users' && <UsersPanel adminId={user.id} flash={flash} />}
    </div>
  );
};

const TaskForm: React.FC<{ adminId: string; flash: (t: string, ok: boolean) => void }> = ({ adminId, flash }) => {
  const [title, setTitle] = useState('');
  const [reward, setReward] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [verifyType, setVerifyType] = useState('manual');
  const [referralTarget, setReferralTarget] = useState('0');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !reward) return;
    setSaving(true);
    const result = await DataService.adminAddTask(adminId, {
      title,
      reward: parseInt(reward),
      link_url: linkUrl || undefined,
      verify_type: verifyType,
      referral_target: parseInt(referralTarget),
      telegram_chat_id: telegramChatId || undefined,
    });
    setSaving(false);
    if (result) {
      flash('Task added', true);
      setTitle(''); setReward(''); setLinkUrl('');
      setVerifyType('manual'); setReferralTarget('0'); setTelegramChatId('');
    } else {
      flash('Failed to add task', false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title" value={title} onChange={setTitle} required />
      <Input label="Reward" type="number" value={reward} onChange={setReward} required />
      <Input label="Link URL" value={linkUrl} onChange={setLinkUrl} />
      <div>
        <label className="block text-sm text-gray-400 mb-1">Verify Type</label>
        <select
          value={verifyType}
          onChange={(e) => setVerifyType(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm"
        >
          <option value="manual">Manual</option>
          <option value="auto">Auto</option>
          <option value="referral">Referral</option>
          <option value="telegram">Telegram</option>
        </select>
      </div>
      {verifyType === 'referral' && (
        <Input label="Referral Target" type="number" value={referralTarget} onChange={setReferralTarget} />
      )}
      {verifyType === 'telegram' && (
        <Input label="Telegram Chat ID" value={telegramChatId} onChange={setTelegramChatId} placeholder="@chat or -100..." />
      )}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all"
      >
        {saving ? 'Saving...' : 'Add Task'}
      </button>
    </form>
  );
};

const AnnouncementForm: React.FC<{ adminId: string; flash: (t: string, ok: boolean) => void }> = ({ adminId, flash }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSaving(true);
    const result = await DataService.adminAddAnnouncement(adminId, title, content);
    setSaving(false);
    if (result) {
      flash('Announcement added', true);
      setTitle(''); setContent('');
    } else {
      flash('Failed to add announcement', false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title" value={title} onChange={setTitle} required />
      <div>
        <label className="block text-sm text-gray-400 mb-1">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all"
      >
        {saving ? 'Saving...' : 'Add Announcement'}
      </button>
    </form>
  );
};

const UsersPanel: React.FC<{ adminId: string; flash: (t: string, ok: boolean) => void }> = ({ adminId }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const load = async (s: string, p: number) => {
    setLoading(true);
    const result = await DataService.adminGetAllUsers(adminId, s, p, pageSize);
    setLoading(false);
    if (result) {
      setUsers(result.users || []);
      setTotal(result.total || 0);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  React.useEffect(() => {
    load('', 1);
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, wallet, or telegram ID..."
          className="flex-1 p-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm"
        />
        <button
          type="submit"
          className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500"
        >
          Search
        </button>
      </form>

      <p className="text-sm text-gray-500 mb-3">{total} users</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="p-4 rounded-xl bg-gray-900 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{u.full_name || u.username || 'User'}</span>
                {u.is_admin && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400">Admin</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>ID: {u.telegram_id}</span>
                <span>Balance: {u.balance} SMT</span>
                <span>Referrals: {u.referral_count}</span>
                <span>Wallet: {u.wallet_address ? u.wallet_address.slice(0, 8) + '...' : 'None'}</span>
                <span>Bonus: {u.welcome_bonus_claimed ? 'Claimed' : 'Not claimed'}</span>
                <span>Joined: {new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-gray-500 text-center py-4">No users found</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => { const p = page - 1; setPage(p); load(search, p); }}
            disabled={page <= 1}
            className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-2 text-gray-400 text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => { const p = page + 1; setPage(p); load(search, p); }}
            disabled={page >= totalPages}
            className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, required, type = 'text', placeholder }) => (
  <div>
    <label className="block text-sm text-gray-400 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm"
    />
  </div>
);

export default AdminPage;
