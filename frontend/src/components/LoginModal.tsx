import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMethod = 'wechat' | 'email_code' | 'password';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
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
          await axios.post('/api/v1/email-code', { email });
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
          alert('验证码已发送（请查看后端控制台日志）');
      } catch (err: any) {
          setError(err.response?.data?.detail || '发送失败');
      }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await axios.post('/api/v1/login/email', { email, code });
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
          const res = await axios.post('/api/v1/login/access-token', params);
          handleLoginSuccess(res.data.access_token);
      } catch (err: any) {
          setError(err.response?.data?.detail || '登录失败');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">✕</button>
        
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          登录 VibeBuild
        </h2>

        <div className="flex justify-center mb-6 border-b border-gray-200 dark:border-gray-700">
            <button 
                className={`pb-2 px-4 ${activeTab === 'wechat' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('wechat')}
            >微信扫码</button>
            <button 
                className={`pb-2 px-4 ${activeTab === 'email_code' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('email_code')}
            >邮箱验证码</button>
            <button 
                className={`pb-2 px-4 ${activeTab === 'password' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('password')}
            >密码登录</button>
        </div>

        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

        {activeTab === 'wechat' && (
            <div className="text-center py-4">
                {loading ? <p>加载二维码...</p> : (
                    <>
                        <div className="flex justify-center mb-4">
                            {qrUrl ? <img src={qrUrl} alt="WeChat QR" className="w-48 h-48 border" /> : <p>二维码加载失败</p>}
                        </div>
                        <p className="text-sm text-gray-500">请使用微信扫一扫登录</p>
                        <p className="text-xs text-gray-400 mt-2">测试号Mock: <a href={`/api/v1/wechat-mock-scan/${sceneId}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">点击模拟扫码</a></p>
                    </>
                )}
            </div>
        )}

        {activeTab === 'email_code' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
                <input 
                    type="email" required placeholder="邮箱地址" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <div className="flex gap-2">
                    <input 
                        type="text" required placeholder="验证码" value={code} onChange={e => setCode(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button 
                        type="button" onClick={handleSendCode} disabled={countDown > 0}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 whitespace-nowrap"
                    >
                        {countDown > 0 ? `${countDown}s` : '获取验证码'}
                    </button>
                </div>
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">登录 / 注册</button>
            </form>
        )}

        {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
                 <input 
                    type="email" required placeholder="邮箱地址" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                 <input 
                    type="password" required placeholder="密码" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">登录</button>
            </form>
        )}
      </div>
    </div>
  );
}
