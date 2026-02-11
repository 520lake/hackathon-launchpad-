import { useState } from 'react';
import axios from 'axios';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'zh' | 'en';
}

export default function RegisterModal({ isOpen, onClose, lang = 'zh' }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('api/v1/register', {
        email,
        password,
        full_name: fullName,
      });
      alert('注册成功！请登录。');
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
          setError(typeof err.response.data.detail === 'string' 
            ? err.response.data.detail 
            : JSON.stringify(err.response.data.detail));
      } else {
        setError('注册失败，请检查网络或重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="card-brutal w-full max-w-md p-8 relative bg-surface border border-brand/20">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-brand transition-colors"
        >
          ✕
        </button>
        
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-black mb-2 text-ink tracking-tighter">
            JOIN <span className="text-brand">AURA</span>
            </h2>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                {lang === 'zh' ? '初始序列' : 'Initial Sequence'}
            </p>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-none text-sm font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider">
              {lang === 'zh' ? '邮箱' : 'EMAIL'}
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          
          <div>
            <label className="block text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider">
              {lang === 'zh' ? '代号 (全名)' : 'CODENAME (FULL NAME)'}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={lang === 'zh' ? "您的名字" : "YOUR_NAME"}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider">
              {lang === 'zh' ? '密码' : 'PASSWORD'}
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand text-void font-bold text-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8 clip-path-slant"
          >
            {loading ? (lang === 'zh' ? '处理中...' : 'PROCESSING...') : (lang === 'zh' ? '加入网络' : 'JOIN_NETWORK')}
          </button>
        </form>
      </div>
    </div>
  );
}
