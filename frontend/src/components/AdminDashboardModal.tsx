import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email?: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at?: string;
}

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'zh' | 'en';
}

export default function AdminDashboardModal({ isOpen, onClose, lang }: AdminDashboardModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('[Admin] Fetching users with token:', token?.substring(0, 10));
      // Remove trailing slash to match backend @router.get("")
      const res = await axios.get('api/v1/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[Admin] Users fetched:', res.data);
      setUsers(res.data);
    } catch (err: any) {
      console.error('[Admin] Fetch error:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.detail || err.message;
      setError(lang === 'zh' 
        ? `无法获取用户列表 (Status: ${status}, Error: ${msg})` 
        : `Failed to fetch users (Status: ${status}, Error: ${msg})`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user: User, field: 'is_active' | 'is_verified' | 'is_superuser') => {
    try {
      const token = localStorage.getItem('token');
      const newValue = !user[field];
      
      // Optimistic update
      setUsers(users.map(u => u.id === user.id ? { ...u, [field]: newValue } : u));

      await axios.put(`api/v1/users/${user.id}`, {
        [field]: newValue
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
      alert(lang === 'zh' ? '更新失败' : 'Update failed');
      fetchUsers(); // Revert on error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="w-full h-full p-8 flex flex-col bg-void">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-surface p-6 border border-brand shadow-[0_0_20px_rgba(212,163,115,0.1)]">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <span className="text-brand text-4xl">☠</span>
                {lang === 'zh' ? '后台管理系统' : 'ADMIN CONSOLE'}
            </h1>
            <p className="text-gray-500 mt-2 font-mono text-sm">
                {lang === 'zh' ? '用户总数' : 'TOTAL USERS'}: <span className="text-brand font-bold">{users.length}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-red-600 hover:text-white text-gray-300 font-mono text-sm uppercase transition-colors border border-white/10"
          >
            {lang === 'zh' ? '退出管理' : 'EXIT CONSOLE'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-surface border border-brand/20 shadow-lg overflow-hidden flex flex-col relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-transparent opacity-50"></div>
          {error && <div className="p-4 bg-red-900/20 text-red-500 border-b border-red-500/30 font-mono">{error}</div>}
          
          <div className="overflow-x-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand/20 bg-black/40">
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">ID</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">{lang === 'zh' ? '邮箱' : 'EMAIL'}</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">{lang === 'zh' ? '姓名' : 'NAME'}</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">{lang === 'zh' ? '状态' : 'STATUS'}</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">{lang === 'zh' ? '认证' : 'VERIFIED'}</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">{lang === 'zh' ? '管理员' : 'ADMIN'}</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">{lang === 'zh' ? '操作' : 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-10 text-center font-mono text-gray-500 uppercase">{lang === 'zh' ? '加载中...' : 'LOADING DATA...'}</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-gray-500 font-mono">#{user.id}</td>
                    <td className="p-4 font-mono text-white">{user.email}</td>
                    <td className="p-4 text-gray-400 font-mono">{user.full_name || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-mono font-bold uppercase border ${
                          user.is_active 
                          ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                          : 'bg-red-500/10 text-red-500 border-red-500/30'
                      }`}>
                        {user.is_active 
                            ? (lang === 'zh' ? '正常' : 'ACTIVE') 
                            : (lang === 'zh' ? '禁用' : 'BANNED')
                        }
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-mono font-bold uppercase border ${
                          user.is_verified 
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' 
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/30'
                      }`}>
                        {user.is_verified 
                            ? (lang === 'zh' ? '已认证' : 'VERIFIED') 
                            : (lang === 'zh' ? '未认证' : 'UNVERIFIED')
                        }
                      </span>
                    </td>
                    <td className="p-4">
                        {user.is_superuser && <span className="text-purple-400 font-black text-xs font-mono border border-purple-500/30 bg-purple-500/10 px-2 py-1">ADMIN</span>}
                    </td>
                    <td className="p-4 flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toggleUserStatus(user, 'is_verified')}
                        className="text-xs px-3 py-1 border border-white/20 text-gray-300 hover:border-blue-500 hover:text-blue-500 transition font-mono uppercase"
                      >
                        {user.is_verified 
                            ? (lang === 'zh' ? '取消认证' : 'UNVERIFY') 
                            : (lang === 'zh' ? '通过认证' : 'VERIFY')
                        }
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(user, 'is_active')}
                        className={`text-xs px-3 py-1 border font-mono uppercase transition ${
                            user.is_active 
                            ? 'border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black' 
                            : 'border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black'
                        }`}
                      >
                        {user.is_active 
                            ? (lang === 'zh' ? '禁用账号' : 'BAN USER') 
                            : (lang === 'zh' ? '激活账号' : 'ACTIVATE')
                        }
                      </button>
                      <button 
                         onClick={() => {
                             if(confirm(lang === 'zh' ? '确定要切换该用户的管理员权限吗？' : 'Toggle admin status for this user?')) toggleUserStatus(user, 'is_superuser');
                         }}
                         className="text-xs px-3 py-1 border border-purple-500/30 text-purple-500 hover:bg-purple-500 hover:text-black font-mono uppercase transition"
                      >
                        {user.is_superuser 
                            ? (lang === 'zh' ? '移除管理' : 'REVOKE ADMIN') 
                            : (lang === 'zh' ? '设为管理' : 'MAKE ADMIN')
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
