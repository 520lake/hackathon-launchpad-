import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { User, Hackathon, EnrollmentWithHackathon, Project } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function DashboardPage() {
  const { user, login } = useAuth(); // login used for updating user data locally
  const { lang } = useUI();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'projects' | 'profile'>('created');
  const [loading, setLoading] = useState(false);

  // Data states
  const [myCreated, setMyCreated] = useState<Hackathon[]>([]);
  const [myJoined, setMyJoined] = useState<EnrollmentWithHackathon[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);

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
        axios.get('http://localhost:8000/api/hackathons/my-created'), // Adjust endpoint
        axios.get('http://localhost:8000/api/hackathons/my-joined'), // Adjust endpoint
        axios.get('http://localhost:8000/api/projects/my-projects')   // Adjust endpoint
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
      const response = await axios.put('http://localhost:8000/api/users/me', profileForm);
      // Update local auth context
      // login(response.data.token); // If token is refreshed
      // Or manually update user object if AuthContext supports it. 
      // For now assume backend update is enough and refresh might be needed or simple alert.
      alert(lang === 'zh' ? '个人资料已更新' : 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
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
    <div className="min-h-screen bg-void pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card className="p-6 sticky top-24">
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-ink/10 mb-4 overflow-hidden border-2 border-brand">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">👾</div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-center">{user.nickname || user.full_name || 'Hacker'}</h2>
                <p className="text-xs font-mono text-ink/50 mt-1">{user.email}</p>
              </div>

              <nav className="space-y-2">
                {[
                  { id: 'created', label: lang === 'zh' ? '我创建的' : 'Created' },
                  { id: 'joined', label: lang === 'zh' ? '我参与的' : 'Joined' },
                  { id: 'projects', label: lang === 'zh' ? '我的项目' : 'Projects' },
                  { id: 'profile', label: lang === 'zh' ? '个人资料' : 'Profile' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full text-left px-4 py-3 text-sm font-mono uppercase tracking-wider transition-colors border-l-2
                      ${activeTab === item.id 
                        ? 'border-brand bg-brand/5 text-brand font-bold' 
                        : 'border-transparent text-ink/60 hover:text-ink hover:bg-ink/5'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
             <div className="mb-8 border-b border-ink/10 pb-4">
               <h1 className="text-3xl font-bold uppercase tracking-tighter">
                 {activeTab === 'created' && (lang === 'zh' ? '我创建的黑客松' : 'My Hackathons')}
                 {activeTab === 'joined' && (lang === 'zh' ? '我参与的黑客松' : 'Joined Hackathons')}
                 {activeTab === 'projects' && (lang === 'zh' ? '我的项目' : 'My Projects')}
                 {activeTab === 'profile' && (lang === 'zh' ? '编辑资料' : 'Edit Profile')}
               </h1>
             </div>

             {activeTab === 'created' && (
               <div className="grid gap-6">
                 {myCreated.length === 0 ? (
                   <div className="text-center py-12 border border-dashed border-ink/20">
                     <p className="text-ink/40 mb-4">No hackathons created yet.</p>
                     <Button onClick={() => navigate('/create')}>Create Hackathon</Button>
                   </div>
                 ) : (
                   myCreated.map(h => (
                     <Card key={h.id} className="p-6 flex justify-between items-center group hover:border-brand transition-colors">
                       <div>
                         <h3 className="text-xl font-bold mb-2">{h.title}</h3>
                         <span className="text-xs px-2 py-1 bg-ink/10 rounded">{h.status}</span>
                       </div>
                       <Button variant="outline" onClick={() => navigate(`/hackathons/${h.id}/edit`)}>Manage</Button>
                     </Card>
                   ))
                 )}
               </div>
             )}

             {activeTab === 'joined' && (
                <div className="grid gap-6">
                  {myJoined.map(enrollment => (
                    <Card key={enrollment.id} className="p-6 cursor-pointer hover:border-brand" onClick={() => navigate(`/hackathons/${enrollment.hackathon.id}`)}>
                      <h3 className="text-xl font-bold mb-2">{enrollment.hackathon.title}</h3>
                      <p className="text-sm text-ink/60 mb-4">Joined at: {new Date(enrollment.joined_at!).toLocaleDateString()}</p>
                      <span className={`text-xs px-2 py-1 ${enrollment.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {enrollment.status.toUpperCase()}
                      </span>
                    </Card>
                  ))}
                </div>
             )}
             
             {activeTab === 'profile' && (
               <Card className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs uppercase font-mono text-ink/50">Nickname</label>
                     <Input 
                       value={profileForm.nickname || ''} 
                       onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs uppercase font-mono text-ink/50">Full Name</label>
                     <Input 
                       value={profileForm.full_name || ''} 
                       onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                     <label className="text-xs uppercase font-mono text-ink/50">Bio</label>
                     <textarea 
                       className="w-full bg-void border border-ink/20 p-3 text-sm min-h-[100px] focus:border-brand outline-none"
                       value={profileForm.bio || ''}
                       onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                     <label className="text-xs uppercase font-mono text-ink/50">Skills (comma separated)</label>
                     <Input 
                       value={Array.isArray(profileForm.skills) ? profileForm.skills.join(', ') : profileForm.skills || ''} 
                       onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})}
                       placeholder="React, Python, Design..."
                     />
                   </div>
                 </div>
                 <div className="mt-8 flex justify-end">
                   <Button onClick={handleSaveProfile} disabled={loading}>
                     {loading ? 'Saving...' : 'Save Changes'}
                   </Button>
                 </div>
               </Card>
             )}

          </div>
        </div>
      </div>
    </div>
  );
}
