import { useState } from 'react';
import axios from 'axios';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: 'zh' | 'en';
}

export default function VerificationModal({ isOpen, onClose, onSuccess, lang }: VerificationModalProps) {
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
      await axios.post('api/v1/users/me/verify', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(lang === 'zh' ? '实名认证成功！' : 'Verification successful!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(lang === 'zh' ? '认证失败，请重试' : 'Verification failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-void border border-brand shadow-[0_0_50px_rgba(212,163,115,0.2)] w-full max-w-md p-8 relative transform transition-all clip-path-polygon">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-brand transition-colors text-xl"
        >
          ✕
        </button>
        
        <h2 className="text-3xl font-black mb-8 text-center text-white uppercase tracking-tighter flex items-center justify-center gap-2">
          <span className="text-brand">◈</span> {lang === 'zh' ? '实名认证' : 'VERIFICATION'}
        </h2>
        
        <div className="mb-8 p-4 bg-brand/10 border-l-4 border-brand text-brand font-mono text-xs">
          <p className="font-bold mb-1 uppercase">{lang === 'zh' ? '模拟认证环境' : 'SIMULATION MODE'}</p>
          <p>{lang === 'zh' ? '这是一个测试环境，请输入任意信息完成认证。' : 'Test environment. Enter any info to proceed.'}</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase font-mono group-hover:text-brand transition-colors">
              {lang === 'zh' ? '真实姓名' : 'REAL NAME'}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors placeholder-gray-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'zh' ? "张三" : "John Doe"}
            />
          </div>
          
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase font-mono group-hover:text-brand transition-colors">
              {lang === 'zh' ? '身份证号' : 'ID NUMBER'}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors placeholder-gray-700"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="110101199001011234"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand hover:bg-white text-black font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 mt-4 clip-path-polygon"
          >
            {loading ? (lang === 'zh' ? '认证中...' : 'VERIFYING...') : (lang === 'zh' ? '立即认证' : 'VERIFY IDENTITY')}
          </button>
        </form>
      </div>
    </div>
  );
}
