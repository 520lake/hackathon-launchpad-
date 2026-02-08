import { useState, useEffect } from 'react';
import axios from 'axios';

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface EnrollmentWithHackathon {
  id: number;
  status: string;
  joined_at: string;
  hackathon: Hackathon;
}

interface User {
  id: number;
  email: string;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  is_verified: boolean;
  skills?: string;
  interests?: string;
  city?: string;
  phone?: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHackathonSelect: (id: number) => void;
  onVerifyClick: () => void;
  onUserUpdate?: () => void;
  lang: 'zh' | 'en';
}

export default function UserDashboardModal({ isOpen, onClose, onHackathonSelect, onVerifyClick, onUserUpdate, lang }: UserDashboardModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [myCreated, setMyCreated] = useState<Hackathon[]>([]);
  const [myJoined, setMyJoined] = useState<EnrollmentWithHackathon[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'projects' | 'profile'>('created');
  
  // Profile form
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Constants
  const CITY_OPTIONS = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆',
    '天津', '苏州', '长沙', '郑州', '沈阳', '青岛', '大连', '厦门', '合肥', '福州',
    '济南', '哈尔滨', '长春', '石家庄', '太原', '昆明', '贵阳', '南宁', '南昌', '海口',
    '乌鲁木齐', '兰州', '银川', '西宁', '呼和浩特', '拉萨', '香港', '澳门', '台北', 'Overseas/海外'
  ];

  const SKILL_OPTIONS = [
    { value: 'Full Stack', label: '全栈开发' },
    { value: 'Frontend', label: '前端开发' },
    { value: 'Backend', label: '后端开发' },
    { value: 'Mobile', label: '移动端开发' },
    { value: 'Data Analysis', label: '数据分析' },
    { value: 'UI/UX', label: 'UI/UX' },
    { value: 'Product Design', label: '产品设计' },
    { value: 'Business Analysis', label: '商业分析' },
    { value: 'Marketing', label: '市场营销' },
    { value: 'Product Ops', label: '产品运营' },
    { value: 'Other', label: '其他' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchMyData();
    }
  }, [isOpen]);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 0. 获取当前用户信息
      const resUser = await axios.get('api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` }
      });
      setUser(resUser.data);
      // Init form data
      setNickname(resUser.data.nickname || '');
      setAvatarUrl(resUser.data.avatar_url || '');
      setSkills(resUser.data.skills || '');
      setInterests(resUser.data.interests || '');
      setCity(resUser.data.city || '');
      setPhone(resUser.data.phone || '');

      // 1. 获取我创建的活动
      const resCreated = await axios.get('api/v1/hackathons/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyCreated(resCreated.data);
      
      // 2. 获取我参与的活动
      const resJoined = await axios.get('api/v1/enrollments/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyJoined(resJoined.data);

      // 3. Get my projects
      try {
        const resProjects = await axios.get('api/v1/projects/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setMyProjects(resProjects.data);
      } catch (e) {
        console.error("Failed to fetch projects", e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    onVerifyClick();
  };

  const handleMockVerify = async () => {
    try {
        const token = localStorage.getItem('token');
        await axios.post('api/v1/users/me/verify', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert(lang === 'zh' ? '模拟认证成功！' : 'Mock verification successful!');
        fetchMyData(); // Refresh user data to show verified status
        if (onUserUpdate) {
            onUserUpdate(); // Notify parent component
        }
    } catch (e) {
        console.error(e);
        alert(lang === 'zh' ? '模拟认证失败' : 'Mock verification failed');
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('api/v1/upload/file', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            setResume(res.data.url);
        } catch (err) {
            console.error(err);
            alert('Resume upload failed');
        }
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
        const token = localStorage.getItem('token');
        await axios.put('api/v1/users/me', {
            nickname,
            avatar_url: avatarUrl,
            skills,
            interests,
            city,
            phone
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert('个人资料保存成功！');
        fetchMyData();
    } catch (e) {
        console.error(e);
        alert('保存失败');
    } finally {
        setSavingProfile(false);
    }
  };
  
  const toggleSkill = (skillValue: string) => {
    const currentSkills = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (currentSkills.includes(skillValue)) {
      setSkills(currentSkills.filter(s => s !== skillValue).join(','));
    } else {
      setSkills([...currentSkills, skillValue].join(','));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-void border border-brand shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl p-0 relative transform transition-all max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-brand/20 flex justify-between items-center bg-surface">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
             <span className="text-brand">◈</span> {lang === 'zh' ? '个人中心' : 'USER DASHBOARD'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-brand transition-colors text-xl">✕</button>
        </div>

        {/* User Info & Verification */}
        {!loading && !user && (
            <div className="px-6 py-6 bg-void border-b border-brand/20 text-center">
                <p className="text-red-500 font-mono mb-2">
                    {lang === 'zh' ? '无法加载用户信息' : 'FAILED TO LOAD USER INFO'}
                </p>
                <button 
                    onClick={fetchMyData}
                    className="text-brand hover:underline font-mono text-sm"
                >
                    {lang === 'zh' ? '点击重试' : 'RETRY'}
                </button>
            </div>
        )}
        
        {user && user.is_verified && (
            <div className="px-4 py-1 bg-green-900/30 text-green-400 text-xs font-bold border border-green-700 uppercase tracking-wider">
                {lang === 'zh' ? '已实名认证' : 'VERIFIED ACCOUNT'}
            </div>
        )}
        
        {user && (
            <div className="px-6 py-6 bg-void border-b border-brand/20 flex justify-between items-center">
                <div>
                    <div className="font-bold text-lg text-white font-mono">{user.email}</div>
                    <div className="text-xs text-brand/60 font-mono mt-1">ID: {user.id}</div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider border ${
                        user.is_verified 
                        ? 'bg-brand/20 text-brand border-brand' 
                        : 'bg-red-500/10 text-red-500 border-red-500/30'
                    }`}>
                        {user.is_verified 
                            ? (lang === 'zh' ? '已实名认证' : 'VERIFIED') 
                            : (lang === 'zh' ? '未认证' : 'UNVERIFIED')
                        }
                    </span>
                    {!user.is_verified && (
                        <div className="flex gap-2">
                            <button 
                                onClick={handleMockVerify}
                                className="px-4 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-500 transition uppercase tracking-wider border border-green-400 animate-pulse"
                                title="Click to instantly verify (Demo)"
                            >
                                {lang === 'zh' ? '👉 点此模拟认证' : '👉 CLICK TO MOCK VERIFY'}
                            </button>
                            <button 
                                onClick={handleVerify}
                                className="px-4 py-1 bg-brand text-black text-xs font-bold hover:bg-white transition uppercase tracking-wider"
                            >
                                {lang === 'zh' ? '立即认证' : 'VERIFY NOW'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-brand/20 bg-surface">
          <button
            onClick={() => setActiveTab('created')}
            className={`flex-1 py-4 text-center font-bold font-mono text-sm uppercase tracking-wider transition-all ${
              activeTab === 'created' 
                ? 'text-brand border-b-2 border-brand bg-brand/5' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {lang === 'zh' ? '我发起的' : 'INITIATED'}
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 py-4 text-center font-bold font-mono text-sm uppercase tracking-wider transition-all ${
              activeTab === 'joined' 
                ? 'text-brand border-b-2 border-brand bg-brand/5' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {lang === 'zh' ? '我参与的' : 'JOINED'}
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-4 text-center font-bold font-mono text-sm uppercase tracking-wider transition-all ${
              activeTab === 'projects' 
                ? 'text-brand border-b-2 border-brand bg-brand/5' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {lang === 'zh' ? '我的项目' : 'PROJECTS'}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 text-center font-bold font-mono text-sm uppercase tracking-wider transition-all ${
              activeTab === 'profile' 
                ? 'text-brand border-b-2 border-brand bg-brand/5' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {lang === 'zh' ? '个人资料' : 'PROFILE'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-void custom-scrollbar">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
          {activeTab === 'profile' && (
            <div className="space-y-8 max-w-2xl mx-auto py-4">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-black/50 border border-brand/30 rounded-full flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl">👤</span>
                        )}
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="group">
                            <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">
                                {lang === 'zh' ? '昵称' : 'NICKNAME'}
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder={lang === 'zh' ? "输入昵称" : "Enter nickname"}
                                className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors placeholder-gray-700"
                            />
                        </div>
                        <div className="group">
                             <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">
                                {lang === 'zh' ? '头像链接' : 'AVATAR URL'}
                            </label>
                            <input
                                type="text"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors placeholder-gray-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                        <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">
                            {lang === 'zh' ? '城市' : 'CITY'}
                        </label>
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 text-white px-4 py-3 focus:outline-none focus:border-brand font-mono transition-colors appearance-none"
                        >
                            <option value="">{lang === 'zh' ? '选择城市...' : 'Select City...'}</option>
                            {CITY_OPTIONS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="group">
                        <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">
                            {lang === 'zh' ? '手机号' : 'PHONE'}
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={lang === 'zh' ? "输入手机号" : "Enter phone number"}
                            className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors placeholder-gray-700"
                        />
                    </div>
                </div>

                <div className="group">
                    <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">
                        {lang === 'zh' ? '专业能力 (多选)' : 'PROFESSIONAL SKILLS (MULTI-SELECT)'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {SKILL_OPTIONS.map((opt) => {
                            const isSelected = skills.split(',').map(s => s.trim()).includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleSkill(opt.value)}
                                    className={`px-3 py-1 text-xs font-mono font-bold uppercase border transition-all ${
                                        isSelected 
                                            ? 'bg-brand text-black border-brand' 
                                            : 'bg-black/50 text-gray-400 border-gray-700 hover:border-brand hover:text-brand'
                                    }`}
                                >
                                    {lang === 'zh' ? opt.label : opt.value}
                                </button>
                            );
                        })}
                    </div>
                    <input
                        type="hidden"
                        value={skills}
                    />
                </div>
                <div className="group">
                    <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">
                        {lang === 'zh' ? '兴趣领域 (自定义标签)' : 'INTEREST AREAS (CUSTOM TAGS)'}
                    </label>
                    <input
                        type="text"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder={lang === 'zh' ? "例如: Web3, AI, DeFi (用逗号分隔)" : "e.g., Web3, AI, DeFi (comma separated)"}
                        className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors placeholder-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                        {lang === 'zh' ? '用于活动推荐和组队匹配' : 'Used for event recommendation and team matching'}
                    </p>
                </div>
                
                <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full px-6 py-4 bg-brand hover:bg-white text-black font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 mt-8 clip-path-polygon"
                >
                    {savingProfile ? (lang === 'zh' ? '保存中...' : 'SAVING...') : (lang === 'zh' ? '保存资料' : 'SAVE PROFILE')}
                </button>
            </div>
          )}

              {activeTab === 'created' && (
                <div className="space-y-4">
                  {myCreated.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-800">
                        <p className="text-gray-600 font-mono text-sm uppercase">
                            {lang === 'zh' ? '你还没有发起过任何活动' : 'NO HACKATHONS INITIATED'}
                        </p>
                    </div>
                  ) : (
                    myCreated.map(h => (
                      <div 
                        key={h.id} 
                        className="group border border-brand/20 bg-surface p-6 hover:border-brand hover:bg-black transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => {
                          onHackathonSelect(h.id);
                          onClose();
                        }}
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="text-4xl font-black text-brand">INIT</div>
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <h3 className="font-bold text-lg text-white font-mono group-hover:text-brand transition-colors">{h.title}</h3>
                            <p className="text-xs text-gray-500 mt-2 font-mono uppercase">
                                {lang === 'zh' ? '开始时间' : 'START'}: <span className="text-gray-300">{new Date(h.start_date).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-white/5 border border-white/10 text-xs text-gray-400 font-mono uppercase">
                            {h.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'joined' && (
                <div className="space-y-4">
                  {myJoined.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-800">
                        <p className="text-gray-600 font-mono text-sm uppercase">
                            {lang === 'zh' ? '你还没有参与任何活动' : 'NO HACKATHONS JOINED'}
                        </p>
                    </div>
                  ) : (
                    myJoined.map(e => (
                      <div 
                        key={e.id} 
                        className="group border border-brand/20 bg-surface p-6 hover:border-brand hover:bg-black transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => {
                          onHackathonSelect(e.hackathon.id);
                          onClose();
                        }}
                      >
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="text-4xl font-black text-white">JOIN</div>
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <h3 className="font-bold text-lg text-white font-mono group-hover:text-brand transition-colors">{e.hackathon.title}</h3>
                            <p className="text-xs text-gray-500 mt-2 font-mono uppercase">
                                {lang === 'zh' ? '报名时间' : 'JOINED'}: <span className="text-gray-300">{new Date(e.joined_at).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-mono font-bold uppercase border ${
                            e.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                            e.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                          }`}>
                            {e.status === 'pending' 
                                ? (lang === 'zh' ? '审核中' : 'PENDING') 
                                : e.status === 'approved' 
                                    ? (lang === 'zh' ? '已通过' : 'APPROVED') 
                                    : (lang === 'zh' ? '已拒绝' : 'REJECTED')
                            }
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-4">
                  {myProjects.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-800">
                        <p className="text-gray-600 font-mono text-sm uppercase">
                            {lang === 'zh' ? '你还没有提交任何项目' : 'NO PROJECTS SUBMITTED'}
                        </p>
                    </div>
                  ) : (
                    myProjects.map(p => (
                      <div 
                        key={p.id} 
                        className="group border border-brand/20 bg-surface p-6 hover:border-brand hover:bg-black transition-all relative overflow-hidden"
                      >
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="text-4xl font-black text-brand">PROJ</div>
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <h3 className="font-bold text-lg text-white font-mono group-hover:text-brand transition-colors">{p.title}</h3>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                            <p className="text-xs text-gray-500 mt-2 font-mono uppercase">
                                {lang === 'zh' ? '提交时间' : 'CREATED'}: <span className="text-gray-300">{new Date(p.created_at).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-white/5 border border-white/10 text-xs text-gray-400 font-mono uppercase">
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
