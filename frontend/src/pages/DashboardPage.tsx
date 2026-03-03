import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import type { User, Hackathon, EnrollmentWithHackathon, Project } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import UserSidebar from '../components/user/UserSidebar';
import UserProfileCard from '../components/user/UserProfileCard';
import { LayoutDashboard, Calendar, FolderGit2, User as UserIcon, Settings } from 'lucide-react';
import EventCard from '../components/dashboard/EventCard';
import ProjectCard from '../components/dashboard/ProjectCard';

export default function DashboardPage() {
  const { user, login } = useAuth();
  const { lang } = useUI();
  const navigate = useNavigate();

  // 'profile' | 'preferences' | 'account' from sidebar, plus 'dashboard', 'hackathons', 'projects'
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [loading, setLoading] = useState(false);

  // Data
  const [myCreated, setMyCreated] = useState<Hackathon[]>([]);
  const [myJoined, setMyJoined] = useState<EnrollmentWithHackathon[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  
  // Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setProfileForm(user);
      fetchMyData();
    }
  }, [user]);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      // Mock data for now if endpoints fail
      // const [createdRes, joinedRes, projectsRes] = await Promise.all([...]);
      // setMyCreated(createdRes.data);
      // ...
      
      // Simulating data fetch
      setTimeout(() => {
          setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Failed to fetch data", error);
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // In a real app, PUT to /api/users/me
      // const res = await axios.put('http://localhost:8000/api/users/me', profileForm);
      // login(res.data.token); 
      
      // Mock update
      setTimeout(() => {
          alert("Profile updated!");
          setIsEditingProfile(false);
          setLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  if (!user) return null;

  // Custom Sidebar items merging Figma design + Dashboard needs
  const sidebarItems = [
    { id: 'profile', label: lang === 'zh' ? '个人资料' : 'Profile', icon: UserIcon },
    { id: 'dashboard', label: lang === 'zh' ? '概览' : 'Overview', icon: LayoutDashboard },
    { id: 'hackathons', label: lang === 'zh' ? '我的黑客松' : 'My Hackathons', icon: Calendar },
    { id: 'projects', label: lang === 'zh' ? '我的项目' : 'My Projects', icon: FolderGit2 },
    { id: 'settings', label: lang === 'zh' ? '设置' : 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <UserSidebar 
            items={sidebarItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
            
            {/* Profile Tab (Matches Node 1190-2115) */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    {isEditingProfile ? (
                        <Card className="p-8 border-brand/50">
                            <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs text-ink-light uppercase">Full Name</label>
                                    <Input value={profileForm.full_name || ''} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-ink-light uppercase">Title / Role</label>
                                    <Input value={profileForm.title || ''} onChange={e => setProfileForm({...profileForm, title: e.target.value})} placeholder="e.g. Full Stack Developer" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-ink-light uppercase">Organization</label>
                                    <Input value={profileForm.organization || ''} onChange={e => setProfileForm({...profileForm, organization: e.target.value})} placeholder="e.g. Acme Corp" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-ink-light uppercase">Location</label>
                                    <Input value={profileForm.city || ''} onChange={e => setProfileForm({...profileForm, city: e.target.value})} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs text-ink-light uppercase">Bio</label>
                                    <textarea 
                                        className="w-full bg-void-light border border-white/10 rounded p-3 text-white focus:border-brand outline-none min-h-[100px]"
                                        value={profileForm.bio || ''}
                                        onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-8">
                                <Button variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                                <Button onClick={handleSaveProfile} isLoading={loading}>Save Changes</Button>
                            </div>
                        </Card>
                    ) : (
                        <UserProfileCard 
                            user={user} 
                            onEdit={() => setIsEditingProfile(true)} 
                        />
                    )}

                    {/* Additional Profile Sections (Stats, etc.) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 bg-void-light/30 border-white/5">
                            <h3 className="text-ink-light text-sm uppercase mb-2">Total Hackathons</h3>
                            <p className="text-3xl font-bold text-white">{myCreated.length + myJoined.length}</p>
                        </Card>
                        <Card className="p-6 bg-void-light/30 border-white/5">
                            <h3 className="text-ink-light text-sm uppercase mb-2">Projects</h3>
                            <p className="text-3xl font-bold text-white">{myProjects.length}</p>
                        </Card>
                        <Card className="p-6 bg-void-light/30 border-white/5">
                            <h3 className="text-ink-light text-sm uppercase mb-2">Reputation</h3>
                            <p className="text-3xl font-bold text-brand">Level 3</p>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'dashboard' && (
                <div className="text-center py-20 text-ink-light">
                    <LayoutDashboard size={48} className="mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl">Dashboard Overview</h2>
                    <p>Coming soon...</p>
                </div>
            )}

             {activeTab === 'hackathons' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">My Hackathons</h2>
                    
                    {/* Created Hackathons Section */}
                    {myCreated.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-ink-light text-sm uppercase font-bold tracking-wider">Hosted by Me</h3>
                        <div className="grid gap-4">
                          {myCreated.map(h => (
                            <EventCard 
                              key={h.id} 
                              hackathon={h} 
                              onView={() => navigate(`/hackathons/${h.id}`)} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Joined Hackathons Section */}
                    {myJoined.length > 0 && (
                      <div className="space-y-4 mt-8">
                        <h3 className="text-ink-light text-sm uppercase font-bold tracking-wider">Joined Events</h3>
                        <div className="grid gap-4">
                          {myJoined.map(enrollment => (
                            <EventCard 
                              key={enrollment.id} 
                              hackathon={enrollment.hackathon} 
                              enrollment={enrollment}
                              onView={() => navigate(`/hackathons/${enrollment.hackathon.id}`)} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {myCreated.length === 0 && myJoined.length === 0 && (
                      <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-void-light/20">
                        <p className="text-ink-light mb-4">You haven't joined or created any hackathons yet.</p>
                        <div className="flex justify-center gap-4">
                          <Button onClick={() => navigate('/hackathons')}>Explore Events</Button>
                          <Button variant="outline" onClick={() => navigate('/create')}>Host a Hackathon</Button>
                        </div>
                      </div>
                    )}
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">My Projects</h2>
                    {myProjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myProjects.map(project => (
                                <ProjectCard 
                                    key={project.id} 
                                    project={project} 
                                    onView={() => console.log('View Project', project.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-void-light/20">
                            <p className="text-ink-light mb-4">You haven't submitted any projects yet.</p>
                            <Button onClick={() => navigate('/hackathons')}>Find a Hackathon to Join</Button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
                    
                    {/* Interests Section - Based on Figma Node 1190-1992 / 1190-3373 */}
                    <div className="bg-void/50 border border-white/10 rounded-[14px] p-8 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-1">感兴趣的话题</h3>
                            <p className="text-sm text-ink-light">您关注的话题领域。</p>
                        </div>
                        <div className="h-px bg-white/5 w-full mb-6" />
                        <div className="flex flex-wrap gap-3">
                             {['人工智能与机器学习', '可持续发展', '区块链', '物联网', '金融科技', '医疗健康', '游戏', '教育'].map(topic => (
                                <div 
                                    key={topic}
                                    className="bg-white/5 border border-white/10 rounded-[10px] px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors group"
                                >
                                    <span className="text-sm font-medium text-white group-hover:text-brand transition-colors">{topic}</span>
                                </div>
                             ))}
                        </div>
                    </div>

                    {/* Preferred Location Section - Based on Figma Node 1190-2419 */}
                    <div className="bg-void/50 border border-white/10 rounded-[14px] p-8 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-1">偏好位置</h3>
                            <p className="text-sm text-ink-light">添加您所在的城市和区域，以便推荐附近的线下活动。</p>
                        </div>
                        <div className="h-px bg-white/5 w-full mb-6" />
                        
                        <div className="space-y-6">
                            {/* Selected Locations List */}
                            <div className="flex flex-wrap gap-3">
                                <div className="bg-white text-black border border-white/10 rounded-[10px] pl-4 pr-1 py-1 flex items-center gap-2 shadow-sm">
                                    <span className="text-sm font-medium">上海 - 上海</span>
                                    <button className="p-1 hover:bg-black/10 rounded text-black/50 hover:text-black transition-colors">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Add Location Form */}
                            <div className="bg-void-light/30 border border-white/10 rounded-[10px] p-4 flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full space-y-1">
                                    <label className="text-xs font-medium text-ink-light uppercase tracking-wider">地区/省份</label>
                                    <select className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-brand outline-none appearance-none">
                                        <option>选择省份...</option>
                                        <option>北京</option>
                                        <option>上海</option>
                                        <option>广东</option>
                                        <option>浙江</option>
                                    </select>
                                </div>
                                <div className="flex-1 w-full space-y-1">
                                    <label className="text-xs font-medium text-ink-light uppercase tracking-wider">城市</label>
                                    <select className="w-full bg-black border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-brand outline-none appearance-none">
                                        <option>选择城市...</option>
                                        <option>上海市</option>
                                        <option>杭州市</option>
                                        <option>广州市</option>
                                        <option>深圳市</option>
                                    </select>
                                </div>
                                <button className="bg-white text-black font-medium px-4 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 h-[38px]">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                    添加
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Section - Styled to match */}
                    <div className="bg-void/50 border border-white/10 rounded-[14px] p-8 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-1">Account</h3>
                            <p className="text-sm text-ink-light">Manage your account settings and preferences.</p>
                        </div>
                        <div className="h-px bg-white/5 w-full mb-6" />
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <div>
                                    <p className="text-white font-medium">Email Notifications</p>
                                    <p className="text-ink-light text-xs">Receive updates about your hackathons</p>
                                </div>
                                <div className="w-10 h-5 bg-brand rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <div>
                                    <p className="text-white font-medium">Public Profile</p>
                                    <p className="text-ink-light text-xs">Allow others to see your profile</p>
                                </div>
                                <div className="w-10 h-5 bg-brand rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button variant="outline" className="text-red-500 border-red-500/30 hover:bg-red-500/10">Delete Account</Button>
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
