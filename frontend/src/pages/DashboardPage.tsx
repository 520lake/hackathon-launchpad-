import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import type { User, Hackathon, EnrollmentWithHackathon, Project } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function DashboardPage() {
  const { user, login } = useAuth(); // login used for updating user data locally
  const { lang } = useUI();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'projects' | 'profile' | 'preferences' | 'account'>('created');
  const [loading, setLoading] = useState(false);

  // Data states
  const [myCreated, setMyCreated] = useState<Hackathon[]>([]);
  const [myJoined, setMyJoined] = useState<EnrollmentWithHackathon[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  // Constants for Preferences
  const INTEREST_TAGS = [
    '人工智能与机器学习', '可持续发展', '区块链', '金融科技', 
    '医疗科技', '游戏开发', '网络安全', '教育科技',
    'AI & ML', 'Sustainability', 'Blockchain', 'FinTech',
    'HealthTech', 'GameDev', 'CyberSecurity', 'EdTech'
  ];

  useEffect(() => {
    if (user) {
      fetchMyData();
      setProfileForm(user);
    } else {
        // Redirect if not logged in? Or show empty state?
        // navigate('/'); 
    }
  }, [user]);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const [createdRes, joinedRes, projectsRes] = await Promise.all([
        axios.get('/api/v1/hackathons/my'),
        axios.get('/api/v1/enrollments/me'),
        axios.get('/api/v1/projects/me')
      ]);
      setMyCreated(createdRes.data);
      setMyJoined(joinedRes.data);
      setMyProjects(projectsRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await axios.put('/api/v1/users/me', profileForm);
      // Update local auth context if needed
      alert(lang === 'zh' ? '个人资料已更新' : 'Profile updated successfully');
      setIsEditing(false);
      setIsEditingPreferences(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const toggleInterest = (tag: string) => {
    let currentInterests = typeof profileForm.interests === 'string' 
        ? (profileForm.interests ? profileForm.interests.split(',') : []) 
        : (Array.isArray(profileForm.interests) ? [...profileForm.interests] : []);
    
    if (currentInterests.includes(tag)) {
        currentInterests = currentInterests.filter(t => t !== tag);
    } else {
        currentInterests.push(tag);
    }
    setProfileForm({...profileForm, interests: currentInterests.join(',')});
  };

  if (!user) {
      return (
          <div className="min-h-screen bg-void pt-32 flex items-center justify-center">
              <Card className="p-8 text-center max-w-md">
                  <h2 className="text-2xl font-bold mb-4">ACCESS DENIED</h2>
                  <p className="mb-6 text-ink/60">Please login to view your dashboard.</p>
                  <Button onClick={() => navigate('/')}>Return Home</Button>
              </Card>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4A373] selection:text-black">
      
      <div className="max-w-[1440px] mx-auto flex min-h-[calc(100vh-80px)]">
        
        {/* Left Sidebar Menu */}
        <div className="w-[280px] flex-shrink-0 border-r border-white/10 bg-black pt-12 pl-12 pr-6">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-[#D4A373] text-2xl">//</span> 
              {lang === 'zh' ? '个人中心' : 'Dashboard'}
            </h1>
          </div>

          <nav className="space-y-4">
            <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${activeTab === 'profile' ? 'bg-[#1A1A1A] text-white font-medium border-l-2 border-[#D4A373]' : 'text-gray-500 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}
            >
                <span className="text-lg opacity-70">👤</span>
                <span className="text-sm tracking-wide">{lang === 'zh' ? '个人资料' : 'Profile'}</span>
            </button>
            <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${activeTab === 'preferences' ? 'bg-[#1A1A1A] text-white font-medium border-l-2 border-[#D4A373]' : 'text-gray-500 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}
            >
                <span className="text-lg opacity-70">⚙️</span>
                <span className="text-sm tracking-wide">{lang === 'zh' ? '偏好设置' : 'Preferences'}</span>
            </button>
            <button
                onClick={() => setActiveTab('account')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${activeTab === 'account' ? 'bg-[#1A1A1A] text-white font-medium border-l-2 border-[#D4A373]' : 'text-gray-500 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}
            >
                <span className="text-lg opacity-70">🔐</span>
                <span className="text-sm tracking-wide">{lang === 'zh' ? '账号设置' : 'Account'}</span>
            </button>
          </nav>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 bg-black p-12 overflow-y-auto">
            
            {/* 1. Profile Card (Always Visible on Top) */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 mb-12 relative overflow-hidden flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-4xl text-white/20 overflow-hidden">
                         {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : (
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                             </svg>
                         )}

             {/* Preferences Section */}
             {activeTab === 'preferences' && (
                <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="text-[#D4A373]">//</span>
                                {lang === 'zh' ? '偏好设置' : 'Preferences'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-2 ml-7">
                                {lang === 'zh' ? '自定义偏好设置，获取更精准的黑客松、组队及项目推荐。' : 'Customize preferences to get better recommendations.'}
                            </p>
                        </div>
                        {!isEditingPreferences ? (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setIsEditingPreferences(true)}
                                className="border-white/10 hover:border-brand text-gray-400 hover:text-brand"
                            >
                                <span className="mr-2">✏️</span>
                                {lang === 'zh' ? '编辑偏好' : 'Edit Preferences'}
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                        setIsEditingPreferences(false);
                                        setProfileForm(user); // Reset changes
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    {lang === 'zh' ? '取消' : 'Cancel'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={handleSaveProfile}
                                    className="bg-white text-black hover:bg-gray-200"
                                >
                                    <span className="mr-2">💾</span>
                                    {lang === 'zh' ? '保存' : 'Save'}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* 1. Interested Topics */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
                            <h3 className="text-lg font-bold text-white mb-2">{lang === 'zh' ? '感兴趣的话题' : 'Interested Topics'}</h3>
                            <p className="text-xs text-gray-500 mb-6 border-b border-white/5 pb-4">
                                {lang === 'zh' ? '您关注的话题领域。' : 'Topics you follow.'}
                            </p>
                            
                            {isEditingPreferences ? (
                                <div className="flex flex-wrap gap-3">
                                    {INTEREST_TAGS.map(tag => {
                                        const currentInterests = typeof profileForm.interests === 'string' 
                                            ? (profileForm.interests ? profileForm.interests.split(',') : []) 
                                            : (Array.isArray(profileForm.interests) ? profileForm.interests : []);
                                        const isSelected = currentInterests.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => toggleInterest(tag)}
                                                className={`px-4 py-2 rounded-lg text-sm font-mono transition-all border ${
                                                    isSelected 
                                                    ? 'bg-white text-black border-white' 
                                                    : 'bg-[#1A1A1A] text-gray-400 border-white/10 hover:border-white/30'
                                                }`}
                                            >
                                                {tag}
                                                {isSelected && <span className="ml-2">×</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3 min-h-[40px]">
                                    {(!profileForm.interests || profileForm.interests.length === 0) ? (
                                        <span className="text-gray-600 text-sm italic">{lang === 'zh' ? '无' : 'None'}</span>
                                    ) : (
                                        (typeof profileForm.interests === 'string' ? profileForm.interests.split(',') : profileForm.interests).map((tag: string, i: number) => (
                                            <span key={i} className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm font-mono">
                                                {tag}
                                            </span>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                         {/* 2. Skills (Reusing the same UI pattern for consistency, though user prompt image showed duplicate "Interested Topics") */}
                         <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
                            <h3 className="text-lg font-bold text-white mb-2">{lang === 'zh' ? '技能栈' : 'Tech Stack'}</h3>
                             <p className="text-xs text-gray-500 mb-6 border-b border-white/5 pb-4">
                                {lang === 'zh' ? '您擅长的技术栈。' : 'Your technical skills.'}
                            </p>
                            
                             {isEditingPreferences ? (
                                <div className="space-y-4">
                                    <Input 
                                        placeholder="React, Python, Design..."
                                        value={typeof profileForm.skills === 'string' ? profileForm.skills : ''}
                                        onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})}
                                        className="bg-[#1A1A1A] border-white/10 text-white focus:border-[#D4A373] h-12"
                                    />
                                    <p className="text-xs text-gray-500">{lang === 'zh' ? '使用逗号分隔多个技能。' : 'Separate skills with commas.'}</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3 min-h-[40px]">
                                    {(!profileForm.skills || profileForm.skills.length === 0) ? (
                                        <span className="text-gray-600 text-sm italic">{lang === 'zh' ? '无' : 'None'}</span>
                                    ) : (
                                        (typeof profileForm.skills === 'string' ? profileForm.skills.split(/[,，]/) : []).filter(s => s.trim()).map((skill: string, i: number) => (
                                            <span key={i} className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm font-mono">
                                                {skill.trim()}
                                            </span>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             )}

             {/* Account Section */}
             {activeTab === 'account' && (
                <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <span className="text-[#D4A373]">//</span>
                        {lang === 'zh' ? '账号设置' : 'Account Settings'}
                    </h2>
                    
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 space-y-8">
                        {/* Email */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{lang === 'zh' ? '电子邮箱' : 'Email Address'}</h3>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-white/10 text-gray-400 cursor-not-allowed opacity-50">
                                {lang === 'zh' ? '已验证' : 'Verified'}
                            </Button>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{lang === 'zh' ? '登录密码' : 'Password'}</h3>
                                <p className="text-sm text-gray-500">********</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-white/10 hover:border-brand text-gray-300 hover:text-brand">
                                {lang === 'zh' ? '修改密码' : 'Change Password'}
                            </Button>
                        </div>

                        {/* Social Accounts */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{lang === 'zh' ? '社交账号' : 'Social Accounts'}</h3>
                                <div className="flex gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        WeChat
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                                        GitHub (Unbound)
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-white/10 hover:border-brand text-gray-300 hover:text-brand">
                                {lang === 'zh' ? '管理绑定' : 'Manage Bindings'}
                            </Button>
                        </div>

                        {/* Danger Zone */}
                         <div className="pt-8 mt-8 border-t border-red-900/20">
                            <h3 className="text-lg font-bold text-red-500 mb-2">{lang === 'zh' ? '危险区域' : 'Danger Zone'}</h3>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500">{lang === 'zh' ? '删除账号将清除所有数据且无法恢复。' : 'Deleting account will remove all data permanently.'}</p>
                                <Button variant="ghost" size="sm" className="text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20">
                                    {lang === 'zh' ? '删除账号' : 'Delete Account'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
             )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">{user.nickname || user.full_name || 'Alex Chen'}</h2>
                            <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider">ORG LOGO</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-3 font-mono">
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-70">
                                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                {user.city || (lang === 'zh' ? '上海, 中国' : 'Shanghai, China')}
                            </span>
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-70">
                                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                                </svg>
                                {user.skills ? (Array.isArray(user.skills) ? user.skills[0] : user.skills.split(',')[0]) : (lang === 'zh' ? '全栈研发' : 'Full Stack Dev')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed opacity-80">
                            {user.bio || (lang === 'zh' ? '热情的全栈开发者，拥有超过5年的可扩展Web应用构建经验。对人工智能与可持续技术的交叉领域深感兴致。' : 'Passionate full-stack developer with over 5 years of experience building scalable web applications. Deeply interested in the intersection of AI and sustainable technology.')}
                        </p>
                    </div>
                </div>
                <div>
                     <Button size="sm" variant="outline" onClick={() => setActiveTab('profile')} className="bg-[#1A1A1A] border-white/10 hover:bg-[#222] text-gray-300 text-xs px-4 py-2 h-auto flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        {lang === 'zh' ? '编辑 资料' : 'Edit Profile'}
                     </Button>
                </div>
            </div>

            {/* 2. My Created Hackathons */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-3">
                        {lang === 'zh' ? '我举办的黑客松' : 'My Hackathons'}
                        <span className="bg-[#1A1A1A] border border-white/10 text-xs px-2 py-0.5 rounded-full text-gray-400 font-mono">0</span>
                    </h3>
                    <button className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                        {lang === 'zh' ? '查看更多' : 'View All'} 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
                
                {myCreated.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-gray-600 text-sm">
                        {lang === 'zh' ? '未找到相关项目' : 'No projects found'}
                    </div>
                ) : (
                     /* Placeholder for Horizontal Scroll or Grid */
                     <div className="grid grid-cols-1 gap-4">
                        {/* Reuse Hackathon Card logic or simplified version */}
                        {myCreated.slice(0, 2).map(h => (
                            <div key={h.id} className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 flex gap-4">
                                <div className="w-24 h-24 bg-[#222] rounded-lg flex-shrink-0 flex items-center justify-center text-2xl font-black text-white/10">
                                    {h.title.substring(0,2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex gap-2 mb-2">
                                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">测试</span>
                                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">备用</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-1">{h.title}</h4>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-1">{h.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <span>主办方：</span>
                                        <span className="bg-[#222] px-1.5 py-0.5 rounded text-gray-400">标志</span>
                                        <span>{h.organizer_name}</span>
                                    </div>
                                </div>
                                <div className="w-48 border-l border-white/5 pl-4 flex flex-col justify-center gap-2">
                                     <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded w-fit">已发布</span>
                                     <div className="text-xs text-gray-500">📅 {new Date(h.start_date).toLocaleDateString()}</div>
                                     <div className="text-xs text-gray-500">📍 {h.location || 'Online'}</div>
                                </div>
                            </div>
                        ))}
                     </div>
                )}
            </div>

            {/* 3. My Joined Hackathons */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-3">
                        {lang === 'zh' ? '我参加的黑客松' : 'Joined Hackathons'}
                        <span className="bg-[#1A1A1A] border border-white/10 text-xs px-2 py-0.5 rounded-full text-gray-400 font-mono">{myJoined.length || 3}</span>
                    </h3>
                    <button className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                        {lang === 'zh' ? '查看更多' : 'View All'} 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
                
                {/* Mock Data for Display if Empty */}
                <div className="grid grid-cols-1 gap-4">
                    {(myJoined.length > 0 ? myJoined : [1,2,3]).map((item, idx) => {
                        const isMock = typeof item === 'number';
                        const h = isMock ? {
                            title: 'Aura测试黑客松（离线模式）',
                            description: 'AI服务不可用。生成离线测试模板。AI服务不可用。生成离线测试模板。',
                            start_date: '2025-12-20',
                            end_date: '2026-01-15',
                            location: '上海市浦东新区',
                            organizer_name: '公司名称',
                            status: 'published'
                        } : item.hackathon;

                        return (
                            <div key={idx} className="bg-[#111] p-6 rounded-lg border border-white/5 flex flex-col md:flex-row gap-6 hover:border-[#D4A373]/30 transition-colors cursor-pointer group">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-[#1A1A1A] rounded flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:bg-[#222] transition-colors">
                                    <span className="text-4xl font-black text-white/5">TE</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex gap-2 mb-3">
                                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 border border-white/5">测试</span>
                                        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 border border-white/5">备用</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-[#D4A373] transition-colors">{h.title}</h4>
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-1">{h.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <span>主办方：</span>
                                        <span className="bg-[#1A1A1A] px-1.5 py-0.5 rounded text-gray-500 text-[10px] border border-white/5">标志</span>
                                        <span>{h.organizer_name || '公司名称'}</span>
                                    </div>
                                </div>
                                <div className="w-full md:w-64 border-l border-white/5 pl-0 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 mt-4 md:mt-0 flex flex-col justify-center gap-3">
                                    <span className="text-xs bg-green-500 text-black font-bold px-2 py-0.5 rounded-sm w-fit">已发布</span>
                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                        <span className="opacity-50">📅</span> 
                                        {formatDateRange(h.start_date, h.end_date) || '2025.12.20 - 2026.01.15'}
                                    </div>
                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                        <span className="opacity-50">📍</span>
                                        {h.location || '上海市浦东新区'}
                                    </div>
                                    <div className="text-xs text-gray-400 flex items-center gap-2">
                                        <span className="opacity-50">🏆</span>
                                        ¥ 1,234,567 + 非现金奖品
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

             {/* 4. Data Dashboard (New Section) */}
             <div className="mb-8">
                 <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-3">
                        {lang === 'zh' ? '我参加的黑客松' : 'Joined Hackathons'} 
                        {/* Note: Title in image is same as above section? Assuming typo in prompt or design reuse. Renaming to Data Dashboard based on content */}
                        <span className="text-gray-500 text-sm font-normal ml-2">// 绿色数据仪表盘</span>
                        <span className="bg-[#1A1A1A] border border-white/10 text-xs px-2 py-0.5 rounded-full text-gray-400 font-mono">3</span>
                    </h3>
                    <button className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                        {lang === 'zh' ? '查看更多' : 'View All'}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden group hover:border-[#D4A373]/50 transition-all cursor-pointer">
                            {/* Chart Image Placeholder */}
                            <div className="h-40 bg-black relative p-6 border-b border-white/5">
                                <div className="absolute inset-0 flex items-end justify-between gap-1 px-6 pb-6 opacity-80">
                                    {[40, 60, 30, 80, 50, 90, 40, 60, 70, 40, 60, 80, 50, 70].map((h, idx) => (
                                        <div key={idx} style={{height: `${h}%`}} className="w-full bg-cyan-500/40 rounded-t-sm group-hover:bg-cyan-400/60 transition-colors shadow-[0_0_10px_rgba(34,211,238,0.2)]"></div>
                                    ))}
                                </div>
                                {/* Mock UI Elements */}
                                <div className="absolute top-4 left-6 right-6 flex justify-between items-center">
                                    <div className="w-8 h-1 bg-white/20 rounded-full"></div>
                                    <div className="w-4 h-4 rounded-full border border-white/20"></div>
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="text-sm font-bold text-white mb-2">绿色数据仪表盘</h4>
                                <p className="text-[10px] text-gray-500 mb-4 line-clamp-2 leading-relaxed">实时监控可持续发展指标与碳足迹可视化，助力企业节能减排。</p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 border-t border-white/5 pt-3">
                                    <span className="opacity-50">👤</span>
                                    <span>EcoTech 小队</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>

             {/* Edit Profile Modal / View Logic */}
             {activeTab === 'profile' && (
                 <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <span className="text-[#D4A373]">//</span>
                        {lang === 'zh' ? '编辑个人资料' : 'Edit Profile'}
                    </h2>
                    
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
                        {/* Form Fields */}
                        <div className="space-y-8">
                            {/* Avatar Section */}
                            <div className="flex items-start gap-8 border-b border-white/5 pb-8">
                                <div className="w-32 h-32 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-white/10 relative group cursor-pointer overflow-hidden">
                                     {profileForm.avatar_url ? (
                                         <img src={profileForm.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                     ) : (
                                         <span className="text-4xl text-white/20">📷</span>
                                     )}
                                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                         <span className="text-xs text-white font-medium">CHANGE</span>
                                     </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-2">{lang === 'zh' ? '头像' : 'Avatar'}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{lang === 'zh' ? '支持 JPG, PNG 格式，最大 2MB。' : 'Supports JPG, PNG. Max 2MB.'}</p>
                                    <div className="flex gap-4">
                                        <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5">{lang === 'zh' ? '上传图片' : 'Upload'}</Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10">{lang === 'zh' ? '删除' : 'Remove'}</Button>
                                    </div>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-mono">{lang === 'zh' ? '昵称' : 'Nickname'}</label>
                                    <Input 
                                        value={profileForm.nickname || ''} 
                                        onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})}
                                        className="bg-[#1A1A1A] border-white/10 text-white focus:border-[#D4A373] h-12"
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-mono">{lang === 'zh' ? '真实姓名' : 'Full Name'}</label>
                                    <Input 
                                        value={profileForm.full_name || ''} 
                                        onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                                        className="bg-[#1A1A1A] border-white/10 text-white focus:border-[#D4A373] h-12"
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-mono">{lang === 'zh' ? '职位 / 头衔' : 'Title'}</label>
                                    <Input 
                                        placeholder="e.g. Full Stack Developer"
                                        className="bg-[#1A1A1A] border-white/10 text-white focus:border-[#D4A373] h-12"
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <label className="text-sm text-gray-400 font-mono">{lang === 'zh' ? '所在城市' : 'Location'}</label>
                                    <Input 
                                        value={profileForm.city || ''}
                                        onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                                        className="bg-[#1A1A1A] border-white/10 text-white focus:border-[#D4A373] h-12"
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-mono">{lang === 'zh' ? '个人简介' : 'Bio'}</label>
                                <textarea 
                                    className="w-full h-32 bg-[#1A1A1A] border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-[#D4A373] resize-none transition-colors"
                                    value={profileForm.bio || ''}
                                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                                />
                                <p className="text-xs text-gray-600 text-right font-mono">0/200</p>
                            </div>

                            {/* Skills */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-mono">{lang === 'zh' ? '技能标签' : 'Skills'}</label>
                                <Input 
                                    placeholder="React, Python, Design..."
                                    value={typeof profileForm.skills === 'string' ? profileForm.skills : ''}
                                    onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})}
                                     className="bg-[#1A1A1A] border-white/10 text-white focus:border-[#D4A373] h-12"
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {/* Mock tags display */}
                                    {(typeof profileForm.skills === 'string' ? profileForm.skills.split(/[,，]/) : []).filter(s => s.trim()).map((skill: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-[#D4A373]/10 text-[#D4A373] text-xs rounded border border-[#D4A373]/20 font-mono">{skill.trim()}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                                <Button variant="ghost" onClick={() => setActiveTab('created')} className="text-gray-400 hover:text-white hover:bg-white/5">{lang === 'zh' ? '取消' : 'Cancel'}</Button>
                                <Button onClick={handleSaveProfile} className="bg-[#D4A373] text-black hover:bg-[#C49363] font-bold">{lang === 'zh' ? '保存修改' : 'Save Changes'}</Button>
                            </div>
                        </div>
                    </div>
                </div>
             )}
 
         </div>
       </div>
     </div>
   );
 }

 // Helper to format date range (Duplicate from Card, can be utility)
 const formatDateRange = (start: string, end: string) => {
    if(!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getFullYear()}.${(s.getMonth()+1).toString().padStart(2, '0')}.${s.getDate().toString().padStart(2, '0')} - ${e.getFullYear()}.${(e.getMonth()+1).toString().padStart(2, '0')}.${e.getDate().toString().padStart(2, '0')}`;
  };
