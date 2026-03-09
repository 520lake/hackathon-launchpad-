import { useState } from 'react';
import axios from 'axios';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countDown, setCountDown] = useState(0);
  const [step, setStep] = useState<1 | 2>(1); // 1: 验证邮箱，2: 设置密码

  if (!isOpen) return null;

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
        alert(`验证码已发送：${res.data.code} (已自动填入)`);
      } else {
        alert('验证码已发送（请查看邮箱）');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // 验证验证码
      await axios.post('/api/v1/verify-code', { email, code });
      // 验证通过，进入设置密码步骤
      setStep(2);
      setError('');
    } catch (err: any) {
      console.error('Verify code error:', err);
      let msg = '验证码错误';
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }

    try {
      setLoading(true);
      // 调用注册接口（包含验证码和密码）
      await axios.post('/api/v1/register', {
        email,
        password,
        full_name: fullName,
        code,
        invitation_code: invitationCode || undefined
      });
      
      alert('注册成功！请登录');
      onClose();
      onSwitchToLogin?.();
    } catch (err: any) {
      console.error('Register error:', err);
      let msg = '注册失败';
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

  const handleBackToStep1 = () => {
    setStep(1);
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="card-brutal w-full max-w-md p-8 relative bg-surface border border-brand/20">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-brand transition-colors"
        >✕</button>
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black mb-2 text-ink tracking-tighter">
            JOIN <span className="text-brand">Aurathon</span>
          </h2>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            {step === 1 ? '创建账号' : '设置密码'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        {step === 1 ? (
          // 第一步：验证邮箱
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3 bg-brand/10 border border-brand/20 rounded-lg mb-4">
              <p className="text-sm text-brand font-medium">邮箱验证</p>
              <p className="text-xs text-brand/80 mt-1">验证邮箱后设置密码</p>
            </div>

            <input 
              type="email" required 
              placeholder="邮箱地址"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
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

            <button 
              type="submit" 
              disabled={loading || !code}
              className="w-full py-3 bg-brand text-void font-bold font-mono hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? '验证中...' : '验证邮箱'}
            </button>

            <div className="text-center text-xs text-gray-500 pt-2">
              <span>已有账号？</span>
              <button 
                type="button"
                onClick={onSwitchToLogin}
                className="text-brand hover:underline ml-1"
              >
                立即登录
              </button>
            </div>
          </form>
        ) : (
          // 第二步：设置密码
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
              <p className="text-sm text-green-300 font-medium">✓ 邮箱已验证</p>
              <p className="text-xs text-green-400/80 mt-1">{email}</p>
            </div>

            <input 
              type="text" required 
              placeholder="昵称（可选）"
              value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
            />

            <input 
              type="password" required 
              placeholder="设置密码" 
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
            />

            <input 
              type="password" required 
              placeholder="确认密码" 
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
            />

            <input 
              type="text"
              placeholder="邀请码（可选，用于发布活动）"
              value={invitationCode} onChange={e => setInvitationCode(e.target.value)}
              className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
            />

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-brand text-void font-bold font-mono hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? '注册中...' : '完成注册'}
            </button>

            <button 
              type="button"
              onClick={handleBackToStep1}
              className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-mono text-sm hover:bg-white/10 transition-colors"
            >
              返回上一步
            </button>
            
            <p className="text-xs text-gray-500 font-mono text-center">
              提示：需要邀请码才能发布活动
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
