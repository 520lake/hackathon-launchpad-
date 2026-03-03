import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';

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
}

export default function AdminDashboardModal({ isOpen, onClose }: AdminDashboardModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (containerRef.current) {
        gsap.set(containerRef.current, { opacity: 0, scale: 0.95 });
        gsap.to(containerRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" });
      }
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('[Admin] Fetching users with token:', token?.substring(0, 10));
      // Remove trailing slash to match backend @router.get("")
      const res = await axios.get('/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[Admin] Users fetched:', res.data);
      setUsers(res.data);
    } catch (err: any) {
      console.error('[Admin] Fetch error:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.detail || err.message;
      setError(`无法获取用户列表 (Status: ${status}, Error: ${msg})`);
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

      await axios.put(`/api/v1/users/${user.id}`, {
        [field]: newValue
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
      alert('更新失败');
      fetchUsers(); // Revert on error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div 
        ref={containerRef}
        className="w-full max-w-7xl h-[85vh] flex flex-col bg-surface border border-brand/30 relative overflow-hidden shadow-[0_0_50px_rgba(212,163,115,0.15)]"
      >
        {/* Decorational Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand z-20 pointer-events-none"></div>

        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,163,115,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,163,115,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center bg-black/40 p-6 border-b border-brand/20 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <span className="text-brand text-4xl">☠</span>
                <span className="text-glitch" data-text="后台管理系统">
                    后台管理系统
                </span>
            </h1>
            <p className="text-gray-500 mt-2 font-mono text-sm">
                用户总数: <span className="text-brand font-bold">{users.length}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all font-mono text-sm uppercase tracking-wider"
          >
            退出管理
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
          {error && <div className="p-4 bg-red-900/20 text-red-500 border-b border-red-500/30 font-mono">{error}</div>}
          
          <div className="overflow-x-auto flex-1 p-0 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand/20 bg-black/40">
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">ID</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">邮箱</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">姓名</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">状态</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">认证</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">管理员</th>
                  <th className="p-4 font-bold text-brand font-mono text-sm uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-10 text-center font-mono text-gray-500 uppercase">加载中...</td></tr>
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
                            ? '正常' 
                            : '禁用'
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
                            ? '已认证' 
                            : '未认证'
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
                            ? '取消认证' 
                            : '通过认证'
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
                            ? '禁用账号' 
                            : '激活账号'
                        }
                      </button>
                      <button 
                         onClick={() => {
                             if(confirm('确定要切换该用户的管理员权限吗？')) toggleUserStatus(user, 'is_superuser');
                         }}
                         className="text-xs px-3 py-1 border border-purple-500/30 text-purple-500 hover:bg-purple-500 hover:text-black font-mono uppercase transition"
                      >
                        {user.is_superuser 
                            ? '移除管理' 
                            : '设为管理'
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
