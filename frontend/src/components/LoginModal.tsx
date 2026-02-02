import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'zh' | 'en';
}

type AuthMethod = 'wechat' | 'email_code' | 'password';

export default function LoginModal({ isOpen, onClose, lang = 'zh' }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<AuthMethod>('wechat');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countDown, setCountDown] = useState(0);
  
  // WeChat states
  const [qrUrl, setQrUrl] = useState('');
  const [sceneId, setSceneId] = useState('');
  const pollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
        setError('');
        if (activeTab === 'wechat') {
            loadWeChatQr();
        } else {
            stopPolling();
        }
    } else {
        stopPolling();
    }
    return () => stopPolling();
  }, [isOpen, activeTab]);

  const stopPolling = () => {
      if (pollTimerRef.current) {
          window.clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
      }
  };

  const loadWeChatQr = async () => {
      try {
          setLoading(true);
          const res = await axios.get('api/v1/wechat/qr');
          setQrUrl(res.data.qr_url);
          setSceneId(res.data.scene_id);
          startPolling(res.data.scene_id);
      } catch (err) {
          console.error(err);
          setError('获取二维码失败');
      } finally {
          setLoading(false);
      }
  };

  const startPolling = (sid: string) => {
      stopPolling();
      pollTimerRef.current = window.setInterval(async () => {
          try {
              const res = await axios.get(`api/v1/wechat/poll?scene_id=${sid}`);
              if (res.data.status === 'success') {
                  handleLoginSuccess(res.data.access_token);
              }
          } catch (err) {
              // ignore poll errors
          }
      }, 3000);
  };

  const handleLoginSuccess = (token: string) => {
      stopPolling();
      localStorage.setItem('token', token);
      // Set cookie as backup for ModelScope iframe/proxy scenarios
      document.cookie = `access_token=${token}; path=/; max-age=864000; SameSite=Lax`;
      alert(lang === 'zh' ? '登录成功！' : 'Login Success!');
      onClose();
      window.location.reload();
  };

  const handleSendCode = async () => {
      if (!email) {
          setError('请输入邮箱');
          return;
      }
      try {
          const res = await axios.post('api/v1/email-code', { email });
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
          // Show code to user for demo
          if (res.data.code) {
             setCode(res.data.code);
             alert(`验证码已发送: ${res.data.code} (已自动填入)`);
          } else {
             alert('验证码已发送（请查看后端控制台日志）');
          }
      } catch (err: any) {
          setError(err.response?.data?.detail || '发送失败');
      }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await axios.post('api/v1/login/email', { email, code });
          handleLoginSuccess(res.data.access_token);
      } catch (err: any) {
          setError(err.response?.data?.detail || '登录失败');
      }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const params = new URLSearchParams();
          params.append('username', email);
          params.append('password', password);
          const res = await axios.post('api/v1/login/access-token', params);
          handleLoginSuccess(res.data.access_token);
      } catch (err: any) {
          setError(err.response?.data?.detail || '登录失败');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="card-brutal w-full max-w-md p-8 relative bg-surface border border-brand/20">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-brand transition-colors"
        >✕</button>
        
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-black mb-2 text-ink tracking-tighter">
            LOGIN <span className="text-brand">AURA</span>
            </h2>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                {lang === 'zh' ? '身份验证' : 'AUTHENTICATION'}
            </p>
        </div>

        <div className="flex justify-center mb-6 border-b border-brand/10">
            <button 
                className={`pb-2 px-4 font-mono text-sm transition-colors ${activeTab === 'wechat' ? 'border-b-2 border-brand text-brand' : 'text-gray-500 hover:text-ink'}`}
                onClick={() => setActiveTab('wechat')}
            >
                {lang === 'zh' ? '微信扫码' : 'WECHAT'}
            </button>
            <button 
                className={`pb-2 px-4 font-mono text-sm transition-colors ${activeTab === 'email_code' ? 'border-b-2 border-brand text-brand' : 'text-gray-500 hover:text-ink'}`}
                onClick={() => setActiveTab('email_code')}
            >
                {lang === 'zh' ? '邮箱验证' : 'EMAIL_CODE'}
            </button>
            <button 
                className={`pb-2 px-4 font-mono text-sm transition-colors ${activeTab === 'password' ? 'border-b-2 border-brand text-brand' : 'text-gray-500 hover:text-ink'}`}
                onClick={() => setActiveTab('password')}
            >
                {lang === 'zh' ? '密码登录' : 'PASSWORD'}
            </button>
        </div>

        {error && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
                {error}
            </div>
        )}

        {activeTab === 'wechat' && (
            <div className="text-center py-4">
                {loading ? <p className="font-mono text-brand animate-pulse">LOADING_QR...</p> : (
                    <>
                        <div className="flex justify-center mb-4">
                            {qrUrl ? (
                                <div className="p-2 bg-white border border-brand/20">
                                    <img src={qrUrl} alt="WeChat QR" className="w-48 h-48" />
                                </div>
                            ) : <p className="text-red-400 font-mono">QR_LOAD_FAILED</p>}
                        </div>
                        <p className="text-sm text-gray-500 font-mono">
                            {lang === 'zh' ? '请使用微信扫一扫登录' : 'Scan via WeChat to Login'}
                        </p>
                        <p className="text-xs text-gray-400 mt-4 font-mono">
                            [DEV_MODE]: <a href={`api/v1/wechat-mock-scan/${sceneId}`} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">MOCK_SCAN &gt;&gt;</a>
                        </p>
                    </>
                )}
            </div>
        )}

        {activeTab === 'email_code' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
                <input 
                    type="email" required 
                    placeholder={lang === 'zh' ? "邮箱地址" : "Email Address"} 
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
                />
                <div className="flex gap-2">
                    <input 
                        type="text" required 
                        placeholder={lang === 'zh' ? "验证码" : "Code"} 
                        value={code} onChange={e => setCode(e.target.value)}
                        className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
                    />
                    <button 
                        type="button" onClick={handleSendCode} disabled={countDown > 0}
                        className="px-4 py-3 bg-white/5 border border-white/10 text-brand font-mono text-xs hover:bg-white/10 disabled:opacity-50 whitespace-nowrap transition-colors"
                    >
                        {countDown > 0 ? `${countDown}s` : (lang === 'zh' ? '获取验证码' : 'GET_CODE')}
                    </button>
                </div>
                <button type="submit" className="w-full py-3 bg-brand text-void font-bold font-mono hover:bg-white transition-colors">
                    {lang === 'zh' ? '登录 / 注册' : 'LOGIN / REGISTER'}
                </button>
            </form>
        )}

        {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
                 <input 
                    type="email" required 
                    placeholder={lang === 'zh' ? "邮箱地址" : "Email Address"} 
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
                />
                <input 
                    type="password" required 
                    placeholder={lang === 'zh' ? "密码" : "Password"} 
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-void border border-white/10 focus:border-brand text-ink outline-none font-mono text-sm transition-colors"
                />
                <button type="submit" className="w-full py-3 bg-brand text-void font-bold font-mono hover:bg-white transition-colors">
                    {lang === 'zh' ? '登录' : 'LOGIN'}
                </button>
            </form>
        )}
      </div>
    </div>
  );
}
