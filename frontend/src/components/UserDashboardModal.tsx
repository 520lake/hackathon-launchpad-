import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import AIResumeModal from './AIResumeModal';

// Constants
const CITY_OPTIONS = ['New York', 'London', 'Tokyo', 'San Francisco', 'Berlin', 'Singapore', 'Remote', 'Shanghai', 'Beijing', 'Hangzhou', 'Shenzhen'];
const SKILL_OPTIONS = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Full Stack' },
  { value: 'design', label: 'UI/UX Design' },
  { value: 'product', label: 'Product Mgmt' },
  { value: 'ai', label: 'AI/LLM' },
  { value: 'blockchain', label: 'Web3/Blockchain' },
  { value: 'mobile', label: 'Mobile Dev' },
  { value: 'data', label: 'Data Science' },
  { value: 'devops', label: 'DevOps' },
];

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
  personality?: string;
  bio?: string;
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
  onTeamMatchClick?: () => void;
  lang: 'zh' | 'en';
}

export default function UserDashboardModal({ isOpen, onClose, onHackathonSelect, onVerifyClick, onUserUpdate, onTeamMatchClick, lang }: UserDashboardModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [myCreated, setMyCreated] = useState<Hackathon[]>([]);
  const [myJoined, setMyJoined] = useState<EnrollmentWithHackathon[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'projects' | 'profile'>('created');
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false);
  const [resume, setResume] = useState('');
  
  // Profile form
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [personality, setPersonality] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMyData();
      
      // Reset animations
      if (containerRef.current) {
        gsap.set(containerRef.current, { opacity: 0, scale: 0.95 });
        gsap.to(containerRef.current, { 
          opacity: 1, 
          scale: 1, 
          duration: 0.4, 
          ease: "power3.out" 
        });
      }

      if (sidebarRef.current) {
        gsap.fromTo(sidebarRef.current.children,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, delay: 0.2, ease: "power2.out" }
        );
      }
    }
  }, [isOpen]);

  // Tab change animation
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [activeTab]);

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
      setPersonality(resUser.data.personality || '');
      setBio(resUser.data.bio || '');

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

  const handleSaveResume = async (newBio: string, newSkills: string[]) => {
    const skillsString = newSkills.join(',');
    setBio(newBio);
    setSkills(skillsString);
    
    setSavingProfile(true);
    try {
        const token = localStorage.getItem('token');
        await axios.put('api/v1/users/me', {
            nickname,
            avatar_url: avatarUrl,
            skills: skillsString,
            interests,
            city,
            phone,
            personality,
            bio: newBio
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert(lang === 'zh' ? 'AI 简历已保存至个人资料！' : 'AI Resume saved to profile!');
        setIsAIResumeOpen(false);
        fetchMyData();
    } catch (e) {
        console.error(e);
        alert(lang === 'zh' ? '保存失败' : 'Failed to save');
    } finally {
        setSavingProfile(false);
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
            phone,
            personality,
            bio
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
    <div className="fixed inset-0 z-[150] bg-void/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div 
        ref={containerRef} 
        className="w-full max-w-6xl h-[85vh] bg-surface border border-brand/30 flex flex-col md:flex-row relative overflow-hidden shadow-[0_0_50px_rgba(212,163,115,0.15)]"
      >
        {/* Decorational Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand z-20 pointer-events-none"></div>

        {/* Sidebar */}
        <div className="w-full md:w-72 bg-void/30 border-b md:border-b-0 md:border-r border-brand/20 flex flex-col relative z-10">
          <div className="p-6 border-b border-brand/20">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3 select-none">
               <span className="text-brand text-3xl">◈</span> 
               <span className="text-glitch" data-text={lang === 'zh' ? '个人中心' : 'DASHBOARD'}>
                 {lang === 'zh' ? '个人中心' : 'DASHBOARD'}
               </span>
            </h2>
            {user && (
              <div className="mt-6 flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-brand/50 p-0.5">
                   {user.avatar_url ? (
                     <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                   ) : (
                     <div className="w-full h-full bg-brand/20 flex items-center justify-center text-brand font-bold text-xl">
                       {user.nickname ? user.nickname[0].toUpperCase() : 'U'}
                     </div>
                   )}
                </div>
                <div>
                   <div className="text-white font-bold font-mono text-sm truncate max-w-[140px]">{user.nickname || user.email.split('@')[0]}</div>
                   <div className="text-xs text-brand/80 font-mono flex items-center gap-1 mt-1">
                      {user.is_verified ? (
                        <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> VERIFIED</>
                      ) : (
                        <><span className="w-2 h-2 bg-red-500 rounded-full"></span> UNVERIFIED</>
                      )}
                   </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar" ref={sidebarRef}>
            {[
              { id: 'created', label: lang === 'zh' ? '我发起的' : 'CREATED' },
              { id: 'joined', label: lang === 'zh' ? '我参与的' : 'JOINED' },
              { id: 'projects', label: lang === 'zh' ? '我的项目' : 'PROJECTS' },
              { id: 'profile', label: lang === 'zh' ? '资料设置' : 'PROFILE' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-4 py-3 font-mono text-sm tracking-wider transition-all duration-300 border-l-2 relative overflow-hidden group ${
                  activeTab === tab.id 
                    ? 'border-brand bg-brand/10 text-white pl-6' 
                    : 'border-transparent text-gray-500 hover:text-white hover:pl-6 hover:border-brand/50'
                }`}
              >
                <span className="relative z-10 group-hover:tracking-widest transition-all duration-300 font-bold">
                  {activeTab === tab.id && '> '} {tab.label}
                </span>
                {activeTab === tab.id && <div className="absolute inset-0 bg-brand/5 z-0 animate-pulse"></div>}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-brand/20">
             <button onClick={onClose} className="w-full py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all font-mono text-sm uppercase tracking-wider">
                {lang === 'zh' ? '关闭系统' : 'CLOSE SYSTEM'}
             </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-surface relative overflow-hidden flex flex-col">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(212,163,115,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,163,115,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10 custom-scrollbar" ref={contentRef}>
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
               <div className="space-y-8 max-w-3xl mx-auto pb-10">
                  <div className="flex justify-between items-center border-b border-brand/20 pb-4">
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                       {lang === 'zh' ? '个人资料' : 'PROFILE SETTINGS'}
                     </h3>
                     <button 
                       onClick={() => setIsAIResumeOpen(true)}
                       className="px-4 py-2 bg-brand text-void font-bold hover:bg-white hover:text-black transition-all uppercase text-sm flex items-center gap-2 clip-path-polygon"
                     >
                       <span>✨</span> {lang === 'zh' ? 'AI 简历生成' : 'AI RESUME BUILDER'}
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                          <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">{lang === 'zh' ? '昵称' : 'NICKNAME'}</label>
                          <input
                              type="text"
                              value={nickname}
                              onChange={(e) => setNickname(e.target.value)}
                              className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors rounded-none"
                          />
                      </div>
                      <div className="group">
                          <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">{lang === 'zh' ? '头像链接' : 'AVATAR URL'}</label>
                          <input
                              type="text"
                              value={avatarUrl}
                              onChange={(e) => setAvatarUrl(e.target.value)}
                              className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors rounded-none"
                          />
                      </div>
                      <div className="group">
                          <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">{lang === 'zh' ? '城市' : 'CITY'}</label>
                          <select
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors rounded-none appearance-none"
                          >
                              <option value="">{lang === 'zh' ? '选择城市...' : 'Select City...'}</option>
                              {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div className="group">
                          <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">{lang === 'zh' ? '手机号' : 'PHONE'}</label>
                          <input
                              type="text"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors rounded-none"
                          />
                      </div>
                  </div>

                  <div className="group">
                      <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">{lang === 'zh' ? '性格 (MBTI)' : 'PERSONALITY (MBTI)'}</label>
                      <input
                          type="text"
                          value={personality}
                          onChange={(e) => setPersonality(e.target.value)}
                          placeholder="INTJ, ENFP..."
                          className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors rounded-none"
                      />
                  </div>

                  <div className="group">
                      <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">{lang === 'zh' ? '个人简介' : 'BIO / MANIFESTO'}</label>
                      <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors rounded-none resize-none"
                      />
                  </div>

                  <div className="group">
                      <label className="block text-xs font-bold text-brand mb-3 uppercase tracking-wider font-mono">{lang === 'zh' ? '专业技能' : 'SKILL MATRIX'}</label>
                      <div className="flex flex-wrap gap-2">
                          {SKILL_OPTIONS.map((opt) => {
                              const isSelected = skills.split(',').map(s => s.trim()).includes(opt.value);
                              return (
                                  <button
                                      key={opt.value}
                                      onClick={() => toggleSkill(opt.value)}
                                      className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all ${
                                          isSelected 
                                              ? 'bg-brand text-black border-brand shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]' 
                                              : 'bg-black/50 text-gray-500 border-gray-800 hover:border-brand hover:text-brand'
                                      }`}
                                  >
                                      {lang === 'zh' ? opt.label : opt.label}
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  <div className="group">
                      <label className="block text-xs font-bold text-brand mb-2 uppercase tracking-wider font-mono">{lang === 'zh' ? '兴趣标签' : 'INTEREST TAGS'}</label>
                      <input
                          type="text"
                          value={interests}
                          onChange={(e) => setInterests(e.target.value)}
                          placeholder="Web3, AI, DeFi..."
                          className="w-full px-4 py-3 bg-black/50 border border-brand/30 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors rounded-none"
                      />
                  </div>

                  <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="w-full py-4 bg-brand hover:bg-white text-black font-black uppercase tracking-[0.2em] text-sm transition-all disabled:opacity-50 mt-4 border border-brand relative overflow-hidden group"
                  >
                      <span className="relative z-10">{savingProfile ? (lang === 'zh' ? '保存中...' : 'SAVING...') : (lang === 'zh' ? '保存资料' : 'SAVE PROFILE')}</span>
                      <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                  </button>

                   {/* AI Team Match Entry */}
                  <div className="mt-8 p-6 border border-brand/30 bg-brand/5 relative overflow-hidden group hover:bg-brand/10 transition-colors cursor-pointer" onClick={() => {
                        if (onTeamMatchClick) {
                            // Keep dashboard open
                            onTeamMatchClick();
                        }
                    }}>
                      <div className="absolute top-0 right-0 p-2 opacity-50 text-4xl group-hover:scale-110 transition-transform">⚡</div>
                      <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight flex items-center gap-2">
                          {lang === 'zh' ? '寻找神队友？' : 'LOOKING FOR TEAMMATES?'}
                          <span className="text-xs bg-brand text-black px-2 py-0.5 rounded-sm">AI POWERED</span>
                      </h3>
                      <p className="text-sm text-gray-400 font-mono">
                          {lang === 'zh' 
                              ? '使用 AI 根据你的性格和技能匹配最佳队友。' 
                              : 'Use AI to match the best teammates based on your personality and skills.'}
                      </p>
                  </div>
               </div>
            )}

            {/* CREATED TAB */}
            {activeTab === 'created' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider border-l-4 border-brand pl-4">
                  {lang === 'zh' ? '我发起的活动' : 'INITIATED HACKATHONS'}
                </h3>
                {myCreated.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-gray-800 bg-black/20">
                      <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">
                          {lang === 'zh' ? '无数据' : 'NO SIGNAL DETECTED'}
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
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                          <div className="text-6xl font-black text-brand tracking-tighter">INIT</div>
                      </div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <h3 className="font-bold text-xl text-white font-mono group-hover:text-brand transition-colors">{h.title}</h3>
                          <div className="flex items-center gap-4 mt-3">
                             <p className="text-xs text-gray-500 font-mono uppercase">
                                {lang === 'zh' ? '开始时间' : 'START'}: <span className="text-brand">{new Date(h.start_date).toLocaleDateString()}</span>
                             </p>
                             <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                             <p className="text-xs text-gray-500 font-mono uppercase">
                                {lang === 'zh' ? '状态' : 'STATUS'}: <span className="text-white">{h.status}</span>
                             </p>
                          </div>
                        </div>
                        <div className="w-10 h-10 border border-brand/30 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-black transition-all">
                           ➜
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* JOINED TAB */}
            {activeTab === 'joined' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider border-l-4 border-brand pl-4">
                  {lang === 'zh' ? '我参与的活动' : 'JOINED HACKATHONS'}
                </h3>
                {myJoined.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-gray-800 bg-black/20">
                      <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">
                          {lang === 'zh' ? '无数据' : 'NO SIGNAL DETECTED'}
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
                       <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                          <div className="text-6xl font-black text-white tracking-tighter">JOIN</div>
                      </div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <h3 className="font-bold text-xl text-white font-mono group-hover:text-brand transition-colors">{e.hackathon.title}</h3>
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

            {/* PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider border-l-4 border-brand pl-4">
                  {lang === 'zh' ? '我的项目' : 'MY PROJECTS'}
                </h3>
                {myProjects.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-gray-800 bg-black/20">
                      <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">
                          {lang === 'zh' ? '无数据' : 'NO SIGNAL DETECTED'}
                      </p>
                  </div>
                ) : (
                  myProjects.map(p => (
                    <div 
                      key={p.id} 
                      className="group border border-brand/20 bg-surface p-6 hover:border-brand hover:bg-black transition-all relative overflow-hidden"
                    >
                       <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                          <div className="text-6xl font-black text-brand tracking-tighter">PROJ</div>
                      </div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <h3 className="font-bold text-xl text-white font-mono group-hover:text-brand transition-colors">{p.title}</h3>
                          <p className="text-sm text-gray-400 mt-2 line-clamp-2 max-w-xl">{p.description}</p>
                          <div className="flex items-center gap-4 mt-4">
                            <p className="text-xs text-gray-500 font-mono uppercase">
                                {lang === 'zh' ? '提交时间' : 'CREATED'}: <span className="text-gray-300">{new Date(p.created_at).toLocaleDateString()}</span>
                            </p>
                          </div>
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
          </div>
        </div>
      </div>

      <AIResumeModal
        isOpen={isAIResumeOpen}
        onClose={() => setIsAIResumeOpen(false)}
        lang={lang}
        onSave={handleSaveResume}
      />
    </div>
  );
}
