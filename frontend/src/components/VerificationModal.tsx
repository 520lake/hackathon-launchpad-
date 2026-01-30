import { useState } from 'react';
import axios from 'axios';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VerificationModal({ isOpen, onClose, onSuccess }: VerificationModalProps) {
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Virtual verification: Just call the backend to set is_verified=True
      // We ignore the name/idNumber in this mock implementation, but sending them would be real-world-like
      await axios.post('/api/v1/users/me/verify', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('实名认证成功！');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('认证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative transform transition-all">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          实名认证
        </h2>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
          <p className="font-bold mb-1">模拟实名认证环境</p>
          <p>这是一个测试环境，请输入任意信息完成认证。</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              真实姓名
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="张三"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              身份证号
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none transition"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="110101199001011234"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-50 mt-4"
          >
            {loading ? '认证中...' : '立即认证'}
          </button>
        </form>
      </div>
    </div>
  );
}
