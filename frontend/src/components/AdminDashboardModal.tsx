import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
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

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err: any) {
      console.error(err);
      setError('无法获取用户列表，权限不足？');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full h-full p-8 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">后台管理系统</h1>
            <p className="text-gray-500 mt-2">用户总数: {users.length}</p>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
          >
            退出管理
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
          {error && <div className="p-4 bg-red-100 text-red-700">{error}</div>}
          
          <div className="overflow-x-auto flex-1 p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">邮箱</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">姓名</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">状态</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">认证</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">管理员</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-4 text-center">加载中...</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 text-gray-500">#{user.id}</td>
                    <td className="p-4 font-medium">{user.email}</td>
                    <td className="p-4 text-gray-500">{user.full_name || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.is_active ? '正常' : '禁用'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${user.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.is_verified ? '已认证' : '未认证'}
                      </span>
                    </td>
                    <td className="p-4">
                        {user.is_superuser && <span className="text-purple-600 font-bold text-xs">ADMIN</span>}
                    </td>
                    <td className="p-4 flex gap-2">
                      <button 
                        onClick={() => toggleUserStatus(user, 'is_verified')}
                        className="text-xs px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {user.is_verified ? '取消认证' : '通过认证'}
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(user, 'is_active')}
                        className={`text-xs px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 ${user.is_active ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
                      >
                        {user.is_active ? '禁用账号' : '激活账号'}
                      </button>
                      <button 
                         onClick={() => {
                             if(confirm('确定要切换该用户的管理员权限吗？')) toggleUserStatus(user, 'is_superuser');
                         }}
                         className="text-xs px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 border-purple-200"
                      >
                        {user.is_superuser ? '移除管理' : '设为管理'}
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
