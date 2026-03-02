import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
  onRegisterClick?: () => void;
  lang?: 'zh' | 'en';
}

type AuthMethod = 'wechat' | 'email_code' | 'password';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onRegisterClick, lang = 'zh' }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<AuthMethod>('password');
  
  // Form states
  const [email, setEmail] = useState('admin@aura.com');
  const [password, setPassword] = useState('admin123');
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
          const res = await axios.get('/api/v1/wechat/qr');
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
              const res = await axios.get(`/api/v1/wechat/poll?scene_id=${sid}`);
              if (res.data.status === 'success') {
                  handleLoginSuccessInternal(res.data.access_token);
              }
          } catch (err) {
              // ignore poll errors
          }
      }, 3000);
  };

  const handleLoginSuccessInternal = (token: string) => {
      stopPolling();
      // Set cookie as backup for ModelScope iframe/proxy scenarios
      document.cookie = `access_token=${token}; path=/; max-age=864000; SameSite=None; Secure`;
      // alert(lang === 'zh' ? '登录成功！' : 'Login Success!');
      onLoginSuccess(token);
  };

  const handleSendCode = async () => {
      if (!email) {
          setError('请输入邮箱');
          return;
      }
      try {
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
          const res = await axios.post('/api/v1/login/email', { email, code });
          handleLoginSuccessInternal(res.data.access_token);
      } catch (err: any) {
          console.error('Login error:', err);
          let msg = '登录失败';
          if (err.response) {
              msg = `Error ${err.response.status}: ${err.response.data?.detail || err.message}`;
          } else if (err.request) {
              msg = 'Network Error: No response received';
          } else {
              msg = err.message;
          }
          setError(msg);
      }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const params = new URLSearchParams();
          params.append('username', email);
          params.append('password', password);
          const res = await axios.post('/api/v1/login/access-token', params);
          handleLoginSuccessInternal(res.data.access_token);
      } catch (err: any) {
          console.error('Password login error:', err);
          let msg = '登录失败';
          if (err.response) {
              msg = `Error ${err.response.status}: ${err.response.data?.detail || err.message}`;
          } else if (err.request) {
              msg = 'Network Error: No response received';
          } else {
              msg = err.message;
          }
          setError(msg);
      }
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
            {lang === 'zh' ? '系统接入' : 'SYSTEM ACCESS'}
            </h2>
            <div className="flex justify-center gap-4 text-xs font-mono text-gray-500 uppercase tracking-widest mt-4">
                <button 
                    onClick={() => setActiveTab('password')}
                    className={`pb-1 border-b-2 transition-colors ${activeTab === 'password' ? 'text-brand border-brand' : 'border-transparent hover:text-white'}`}
                >
                    {lang === 'zh' ? '密码登录' : 'PASSWORD'}
                </button>
                <button 
                    onClick={() => setActiveTab('email_code')}
                    className={`pb-1 border-b-2 transition-colors ${activeTab === 'email_code' ? 'text-brand border-brand' : 'border-transparent hover:text-white'}`}
                >
                    {lang === 'zh' ? '验证码' : 'CODE'}
                </button>
                <button 
                    onClick={() => setActiveTab('wechat')}
                    className={`pb-1 border-b-2 transition-colors ${activeTab === 'wechat' ? 'text-brand border-brand' : 'border-transparent hover:text-white'}`}
                >
                    {lang === 'zh' ? '微信' : 'WECHAT'}
                </button>
            </div>
            {onRegisterClick && (
                <div className="mt-4">
                    <button onClick={onRegisterClick} className="text-xs text-gray-500 hover:text-brand underline">
                        {lang === 'zh' ? '没有账号？注册' : 'No account? Register'}
                    </button>
                </div>
            )}
        </div>

        {activeTab === 'password' && (
            <div className="mb-6">
                <div className="mb-4 p-3 bg-brand/5 border border-brand/20 rounded-sm">
                    <p className="text-xs text-brand font-bold mb-1 font-mono uppercase">
                        {lang === 'zh' ? '评委专用账号' : 'JUDGE ACCESS'}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                        Account: <span className="text-ink">admin@aura.com</span><br/>
                        Password: <span className="text-ink">admin123</span>
                    </p>
                </div>
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
            </div>
        )}

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
                            [DEV_MODE]: {sceneId ? (
                                <a href={`${window.location.protocol}//${window.location.hostname}:8000/api/v1/wechat-mock-scan/${sceneId}`} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">MOCK_SCAN &gt;&gt;</a>
                            ) : (
                                <span className="text-gray-600">MOCK_SCAN (WAITING_ID...)</span>
                            )}
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
      </div>
    </div>
  );
}
