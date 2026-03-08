import { useState, useEffect } from 'react';
import axios from 'axios';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countDown, setCountDown] = useState(0);
  const [showCodeInput, setShowCodeInput] = useState(false); // 显示验证码输入（用于忘记密码）
  
  // 忘记密码模式
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('token', token);
    document.cookie = `access_token=${token}; path=/; max-age=864000; SameSite=None; Secure`;
    alert('登录成功！');
    onClose();
    window.location.reload();
  };

  const handleSendCode = async () => {
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post('/api/v1/email-code', { email });
      setCountDown(60);
      const timer = setInterval(() => {
        setCountDown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      if (res.data.code) {
        setCode(res.data.code);
        alert(`验证码已发送：${res.data.code} (已自动填入，请勿删除)`);
      } else {
        alert('验证码已发送（请查看邮箱）');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const res = await axios.post('/api/v1/login/access-token', params);
      handleLoginSuccess(res.data.access_token);
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = '登录失败';
      if (err.response?.status === 400) {
        msg = '邮箱或密码错误';
      } else if (err.response) {
        msg = err.response.data?.detail || err.message;
      } else if (err.request) {
        msg = '网络错误，请检查网络连接';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // 验证验证码并重置密码
      await axios.post('/api/v1/reset-password', {
        email,
        code,
        password
      });
      alert('密码重置成功！请登录');
      setIsForgotPassword(false);
      setShowCodeInput(false);
      setCode('');
      setPassword('');
    } catch (err: any) {
      console.error('Reset password error:', err);
      let msg = '重置密码失败';
      if (err.response) {
        msg = err.response.data?.detail || err.message;
      } else if (err.request) {
        msg = '网络错误，请检查网络连接';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startForgotPasswordFlow = () => {
    setIsForgotPassword(true);
    setShowCodeInput(true);
    setError('');
    setCode('');
    setPassword('');
  };

  const cancelForgotPassword = () => {
    setIsForgotPassword(false);
    setShowCodeInput(false);
    setError('');
    setCode('');
    setPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="card-brutal w-full max-w-md p-8 relative bg-surface border border-brand/20">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-brand transition-colors"
        >✕</button>
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black mb-2 text-ink tracking-tighter">
            LOGIN <span className="text-brand">Aurathon</span>
          </h2>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            {isForgotPassword ? '重置密码' : '欢迎回来'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        {isForgotPassword ? (
          // 忘记密码表单
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mb-4">
              <p className="text-sm text-indigo-300 font-medium">忘记密码</p>
              <p className="text-xs text-indigo-400/80 mt-1">通过邮箱验证码重置密码</p>
            </div>

            <input 
              type="email" required 
              placeholder="邮箱地址"
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={showCodeInput}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors disabled:opacity-50"
            />

            <div className="flex gap-2">
              <input 
                type="text" required 
                placeholder="验证码" 
                value={code} onChange={e => setCode(e.target.value)}
                className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
              />
              <button 
                type="button" onClick={handleSendCode} disabled={countDown > 0 || !email}
                className="px-4 py-3 bg-white/5 border border-white/10 text-brand font-mono text-xs hover:bg-white/10 disabled:opacity-50 whitespace-nowrap transition-colors"
              >
                {countDown > 0 ? `${countDown}s` : '获取验证码'}
              </button>
            </div>

            <input 
              type="password" required 
              placeholder="设置新密码" 
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
            />

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-brand text-void font-bold font-mono hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? '重置中...' : '重置密码'}
            </button>

            <button 
              type="button"
              onClick={cancelForgotPassword}
              className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-mono text-sm hover:bg-white/10 transition-colors"
            >
              返回登录
            </button>
          </form>
        ) : (
          // 登录表单
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" required 
              placeholder="邮箱地址" 
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
            />
            <input 
              type="password" required 
              placeholder="密码" 
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-brand text-void font-bold font-mono hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
            <div className="text-center text-xs text-gray-500 pt-2 flex justify-between">
              <button 
                type="button"
                onClick={startForgotPasswordFlow}
                className="text-brand hover:underline"
              >
                忘记密码？
              </button>
              <span>没有账号？</span>
              <button 
                type="button"
                onClick={onSwitchToRegister}
                className="text-brand hover:underline"
              >
                立即注册
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
