import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import SubmitProjectModal from './SubmitProjectModal';
import JudgingModal from './JudgingModal';
import ResultPublishModal from './ResultPublishModal';
import AIResumeModal from './AIResumeModal';
import AIParticipantTools from './AIParticipantTools';
import AIProjectAssistant from './AIProjectAssistant';
import ReactMarkdown from 'react-markdown';

interface Recruitment {
  id: number;
  team_id: number;
  role: string;
  skills: string;
  count: number;
  description?: string;
  status: string;
  created_at: string;
  team?: Team;
}


interface Hackathon {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  registration_type?: 'individual' | 'team';
  format?: 'online' | 'offline';
  location?: string;
  organizer_name?: string;
  contact_info?: string; // JSON
  requirements?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  submission_start_date?: string;
  submission_end_date?: string;
  judging_start_date?: string;
  judging_end_date?: string;
  awards_detail?: string; // JSON
  rules_detail?: string;
  scoring_dimensions?: string; // JSON
  resource_detail?: string;
  results_detail?: string; // JSON
  sponsors_detail?: string; // JSON
  status: string;
  organizer_id: number;
}

interface Enrollment {
  id: number;
  status: string;
}

interface User {
  id: number;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  skills?: string[];
  interests?: string[];
}

interface JudgeUser {
  id: number;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
}

interface SponsorItem {
  name: string;
  logo: string;
  url: string;
}

interface TeamMember {
  id: number;
  user_id: number;
  user?: User;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  hackathon_id: number;
  leader_id: number;
  members?: TeamMember[];
  recruitments?: Recruitment[];
}

interface Project {
  id: number;
  title: string;
  description: string;
  tech_stack?: string;
  repo_url?: string;
  demo_url?: string;
  hackathon_id: number;
  team_id: number;
  team?: Team;
  status: string;
  cover_image?: string;
  total_score?: number;
}

interface HackathonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number | null;
  onEdit?: (hackathon: Hackathon) => void;
  onTeamMatch?: () => void;
  lang: 'zh' | 'en';
  initialTab?: string;
}

export default function HackathonDetailModal({ isOpen, onClose, hackathonId, onEdit, onTeamMatch, lang, initialTab }: HackathonDetailModalProps) {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [myProject, setMyProject] = useState<Project | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Data for tabs
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [galleryProjects, setGalleryProjects] = useState<Project[]>([]);
  
  // Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [initialProjectData, setInitialProjectData] = useState<any>(null);
  const [isJudgingOpen, setIsJudgingOpen] = useState(false);
  const [isResultPublishOpen, setIsResultPublishOpen] = useState(false);
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false);
  const [isRecruitOpen, setIsRecruitOpen] = useState(false);
  const [recruitForm, setRecruitForm] = useState({ role: '', skills: '', count: 1, description: '', contact_info: '' });
  const [refinedDescription, setRefinedDescription] = useState<string>('');
  const [recruitLoading, setRecruitLoading] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Parsed Data
  const [awards, setAwards] = useState<any[]>([]);
  const [contact, setContact] = useState<{text?: string, image?: string} | any[] | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [scoring, setScoring] = useState<any[]>([]); // Added missing state
  const [judges, setJudges] = useState<JudgeUser[]>([]);
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Community
  const [posts, setPosts] = useState<any[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('discussion');
  
  // Comments
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Recruitment List
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loadingRecruitments, setLoadingRecruitments] = useState(false);
  const [recruitmentSearch, setRecruitmentSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const fetchRecruitments = async () => {
      try {
          const token = localStorage.getItem('token');
          const API_BASE_URL = import.meta.env.VITE_API_URL || '';
          const res = await axios.get(`${API_BASE_URL}/api/v1/teams/recruitments/all?hackathon_id=${hackathonId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setRecruitments(res.data);
      } catch (e) {
          console.error("Failed to fetch recruitments", e);
      }
  };

  // AI Insights State
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchInsights = async () => {
    if (loadingInsights) return;
    setLoadingInsights(true);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/v1/community/insights?hackathon_id=${hackathonId}`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        setInsights(res.data);
    } catch (e) {
        console.error("Failed to fetch insights", e);
    } finally {
        setLoadingInsights(false);
    }
  };

  const handleRecruitSubmit = async () => {
    if (!myTeam) return;
    setRecruitLoading(true);
    try {
        const token = localStorage.getItem('token');
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        await axios.post(`${API_BASE_URL}/api/v1/teams/${myTeam.id}/recruitments`, recruitForm, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setIsRecruitOpen(false);
        fetchHackathon(); // Refresh team data to show new recruitment
        fetchRecruitments(); // Also refresh the general recruitment hall
        alert(lang === 'zh' ? '招募信息已发布' : 'Recruitment published');
    } catch (error) {
        console.error("Recruitment failed", error);
        alert(lang === 'zh' ? '发布失败' : 'Failed to publish');
    } finally {
        setRecruitLoading(false);
    }
  };

  // Action Button State
  const sections = [
    { id: 'intro', label: lang === 'zh' ? '活动简介' : 'Introduction' },
    { id: 'schedule', label: lang === 'zh' ? '活动日程' : 'Schedule' },
    { id: 'requirements', label: lang === 'zh' ? '参赛要求' : 'Requirements' },
    { id: 'rules', label: lang === 'zh' ? '评审规则' : 'Rules' },
    { id: 'judges', label: lang === 'zh' ? '评委阵容' : 'Judges' },
    { id: 'awards', label: lang === 'zh' ? '奖项设置' : 'Awards' },
    { id: 'sponsors', label: lang === 'zh' ? '合作伙伴' : 'Sponsors' },
    { id: 'resources', label: lang === 'zh' ? '资源与支持' : 'Resources' },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const LockedView = () => (
      <div className="flex flex-col items-center justify-center py-20 text-center h-full">
          <div className="text-6xl mb-6 opacity-30">🔒</div>
          <h3 className="text-2xl font-bold text-white mb-2">{lang === 'zh' ? '请先报名' : 'Registration Required'}</h3>
          <p className="text-gray-400 mb-6 max-w-md">{lang === 'zh' ? '您需要先报名参加活动，才能查看此内容。' : 'You need to register for the hackathon to view this content.'}</p>
          {renderActionButton()}
      </div>
  );

  // Team Creation
  const [newTeamName, setNewTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  const handleAnalyzeParticipants = async () => {
    setIsAnalyzing(true);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post('/api/v1/ai/generate', {
            prompt: 'Analyze participants',
            type: 'participant_analysis',
            context_data: { participants: participants }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setAiAnalysis(res.data.content);
    } catch (e) {
        console.error(e);
        alert(lang === 'zh' ? 'AI 分析失败' : 'AI Analysis Failed');
    } finally {
        setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    let ctx: gsap.Context;
    if (isOpen && hackathonId) {
      checkUser();
      fetchHackathon();
      setActiveTab(initialTab || 'overview');

      // Animation
      if (containerRef.current) {
        ctx = gsap.context(() => {
          gsap.fromTo(containerRef.current, 
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
          );
        }, containerRef);
      }
    }
    return () => ctx?.revert();
  }, [isOpen, hackathonId]);

  // Fetch Tab Data
  useEffect(() => {
      if (!isOpen || !hackathonId) return;
      if (activeTab === 'participants') {
          fetchTeams();
          fetchGallery(); // Fetch for stats
          fetchPosts();
          fetchRecruitments();
          if (!insights) fetchInsights();
      }
      if (activeTab === 'gallery') fetchGallery();
  }, [activeTab, isOpen, hackathonId]);

  const checkUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.sub ? parseInt(payload.sub) : null);
            
            const res = await axios.get('api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } });
            setIsVerified(res.data.is_verified);
            setCurrentUser(res.data);
        } catch (e) {
            console.error(e);
        }
    } else {
        setCurrentUserId(null);
    }
  };

  const fetchHackathon = async () => {
    if (!hackathonId) return;
    setLoading(true);
    try {
        const res = await axios.get(`api/v1/hackathons/${hackathonId}`);
        const h = res.data;
        setHackathon(h);
        
        // Parse JSON fields
        try { if (h.awards_detail) setAwards(typeof h.awards_detail === 'string' ? JSON.parse(h.awards_detail) : h.awards_detail); } catch(e) { setAwards([]); }
        try { if (h.contact_info) setContact(typeof h.contact_info === 'string' ? JSON.parse(h.contact_info) : h.contact_info); } catch(e) { setContact(null); }
        try { if (h.scoring_dimensions) setScoring(typeof h.scoring_dimensions === 'string' ? JSON.parse(h.scoring_dimensions) : h.scoring_dimensions); } catch(e) { setScoring([]); }
        try { if (h.results_detail) setResults(typeof h.results_detail === 'string' ? JSON.parse(h.results_detail) : h.results_detail); } catch(e) { setResults([]); }
        try { if (h.sponsors_detail) setSponsors(typeof h.sponsors_detail === 'string' ? JSON.parse(h.sponsors_detail) : h.sponsors_detail); } catch(e) { setSponsors([]); }

        // Fetch Judges
        try {
            const resJudges = await axios.get(`api/v1/hackathons/${hackathonId}/judges`);
            setJudges(resJudges.data);
        } catch(e) { setJudges([]); }

        // Fetch User Data if logged in
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Enrollment
                const resEnroll = await axios.get('api/v1/enrollments/me', { headers: { Authorization: `Bearer ${token}` } });
                const myEnroll = resEnroll.data.find((e: any) => Number(e.hackathon_id) === Number(hackathonId));
                
                // Fix: Don't overwrite enrollment with null if we just enrolled (handled in handleRegister)
                if (myEnroll) {
                    setEnrollment(myEnroll);
                } else if (!enrollment) {
                    setEnrollment(null);
                }

                // My Team
                const resTeams = await axios.get('api/v1/teams/me', { headers: { Authorization: `Bearer ${token}` } });
                const myTeamFound = resTeams.data.find((t: any) => Number(t.hackathon_id) === Number(hackathonId));
                setMyTeam(myTeamFound || null);

                // My Project (via Team)
                if (myTeamFound) {
                    const resProj = await axios.get('api/v1/projects', { 
                        params: { hackathon_id: hackathonId },
                        headers: { Authorization: `Bearer ${token}` } 
                    });
                    const myProj = resProj.data.find((p: any) => Number(p.team_id) === Number(myTeamFound.id));
                    setMyProject(myProj || null);
                } else {
                    setMyProject(null);
                }

                // Judge Check
                try {
                   const resJudges = await axios.get(`api/v1/hackathons/${hackathonId}/judges`, { headers: { Authorization: `Bearer ${token}` } });
                   setIsJudge(resJudges.data.some((j: any) => j.user_id === parseInt(JSON.parse(atob(token.split('.')[1])).sub)));
                } catch(e) {}
            } catch (e) { console.error(e); }
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const fetchTeams = async () => {
      if (!hackathonId) return;
      try {
          const res = await axios.get(`api/v1/teams?hackathon_id=${hackathonId}`);
          setTeams(res.data);
          
          // Fetch Individual Participants
          const resPart = await axios.get(`api/v1/enrollments/public/${hackathonId}`);
          setParticipants(resPart.data);
      } catch (e) { console.error(e); }
  };

  const fetchGallery = async () => {
      if (!hackathonId) return;
      try {
          const res = await axios.get(`api/v1/projects?hackathon_id=${hackathonId}`);
          setGalleryProjects(res.data);
      } catch (e) { console.error(e); }
  };

  const handleRegister = async () => {
    if (!currentUserId) { alert(lang === 'zh' ? '请先登录' : 'Please login first'); return; }
    if (!isVerified) { alert(lang === 'zh' ? '请先完成实名认证' : 'Please verify your identity first'); return; }
    
    setRegisterLoading(true);
    try {
        const response = await axios.post('api/v1/enrollments/', { hackathon_id: hackathonId, user_id: 0 }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Fix: Immediately update local enrollment state to unlock UI
        const newEnrollment = {
            id: response.data.id,
            status: response.data.status || 'pending'
        };
        setEnrollment(newEnrollment);
        
        // Success Logic
        // Switch to my_project tab immediately
        setActiveTab('my_project');
        
        // Fetch full data in background
        await fetchHackathon();
        
        alert(lang === 'zh' ? '🎉 报名成功！已为您解锁“我的项目”空间。' : '🎉 Registration Successful! "My Project" space is now unlocked.');
        
    } catch (e: any) {
        // Fix for Bug 1: If already enrolled, refresh state and unlock
        const errorMsg = e.response?.data?.detail || '';
        if (errorMsg.includes('Already enrolled') || errorMsg.includes('already enrolled') || e.response?.status === 400) {
             console.log("Already enrolled, refreshing state...");
             
             // Manually set a dummy enrollment to unlock UI immediately
             setEnrollment({ id: 0, status: 'approved' }); 
             setActiveTab('my_project');
             
             await fetchHackathon();
             alert(lang === 'zh' ? '您已报名，正在跳转...' : 'You are already enrolled. Redirecting...');
             return;
        }
        alert(errorMsg || (lang === 'zh' ? '报名失败' : 'Registration failed'));
    } finally {
        setRegisterLoading(false);
    }
  };

  const handleCreateTeam = async () => {
      if (!newTeamName.trim()) return;
      setCreatingTeam(true);
      try {
          await axios.post('api/v1/teams', { name: newTeamName }, {
              params: { hackathon_id: hackathonId },
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          fetchHackathon();
          setNewTeamName('');
      } catch (e: any) {
          alert(e.response?.data?.detail || 'Failed to create team');
      } finally {
          setCreatingTeam(false);
      }
  };

  const handleJoinTeam = async (teamId: number) => {
      try {
          await axios.post(`api/v1/teams/${teamId}/join`, {}, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          fetchHackathon();
      } catch (e: any) {
          alert(e.response?.data?.detail || 'Failed to join team');
      }
  };

  const handleLeaveTeam = async () => {
      if (!myTeam) return;
      if (myTeam.leader_id === currentUserId) {
          alert(lang === 'zh' ? '作为队长，您无法直接退出战队。' : 'As the leader, you cannot leave the team.');
          return;
      }
      if (!confirm(lang === 'zh' ? '确定要退出战队吗？' : 'Are you sure you want to leave the team?')) return;
      try {
          await axios.delete(`api/v1/teams/${myTeam.id}/leave`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          fetchHackathon();
      } catch (e: any) {
          alert(e.response?.data?.detail || 'Failed to leave team');
      }
  };

  const handleStartIndividual = async () => {
      // Auto-create team for individual
      try {
          // Check if already has team (should be handled by UI, but double check)
          await axios.post('api/v1/teams', { name: `${lang === 'zh' ? '个人项目' : 'Individual Project'} - ${currentUserId}` }, {
              params: { hackathon_id: hackathonId },
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          fetchHackathon();
      } catch (e: any) {
           alert(e.response?.data?.detail || 'Failed to start project');
      }
  };

  const renderActionButton = () => {
    if (!hackathon) return null;
    const now = new Date().getTime();
    const regStart = hackathon.registration_start_date ? new Date(hackathon.registration_start_date).getTime() : 0;
    const regEnd = hackathon.registration_end_date ? new Date(hackathon.registration_end_date).getTime() : 0;
    const actStart = hackathon.start_date ? new Date(hackathon.start_date).getTime() : 0;
    const actEnd = hackathon.end_date ? new Date(hackathon.end_date).getTime() : 0;

    // 1. Check Enrollment FIRST
    // "活动详情页检测到已报名→不再显示任何报名按钮，改为'已进入活动'或'进入社区'"
    // Also consider team membership as enrollment
    if (currentUserId && (enrollment || myTeam)) {
         return <button onClick={() => setActiveTab('participants')} className="btn-primary w-full md:w-auto text-xl px-8 py-3 hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-brand/50">{lang === 'zh' ? '进入社区' : 'ENTER COMMUNITY'}</button>;
    }

    // 2. Status Logic based on Time
    // IF now < registration_start
    if (now < regStart) {
        return <button disabled className="btn-disabled w-full md:w-auto">{lang === 'zh' ? '报名未开始' : 'NOT STARTED'}</button>;
    }
    
    // ELIF registration_start <= now < registration_end
    if (now >= regStart && now < regEnd) {
        if (!currentUserId) {
             return <button onClick={() => alert(lang === 'zh' ? '请先登录' : 'Please Login First')} className="btn-primary w-full md:w-auto text-xl px-8 py-3 hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-brand/50">{lang === 'zh' ? '立即报名' : 'REGISTER NOW'}</button>;
        }
        if (!isVerified) {
             return <button onClick={() => alert(lang === 'zh' ? '请前往个人中心完成实名认证' : 'Please Verify Identity')} className="btn-primary w-full md:w-auto text-xl px-8 py-3 hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-brand/50">{lang === 'zh' ? '立即报名' : 'REGISTER NOW'}</button>;
        }
        return <button onClick={handleRegister} disabled={registerLoading} className="btn-primary w-full md:w-auto text-xl px-8 py-3 hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-brand/50 flex items-center justify-center gap-2">
            {registerLoading && <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
            {lang === 'zh' ? '立即报名' : 'REGISTER NOW'}
        </button>;
    }
    
    // ELIF now >= registration_end
    if (now >= regEnd) {
        if (now < actStart) {
            // 子状态 = "等待活动开始"
            return <button disabled className="btn-disabled w-full md:w-auto">{lang === 'zh' ? '等待活动开始' : 'WAITING START'}</button>;
        } else if (now >= actStart && now < actEnd) {
            // 子状态 = "活动进行中"
            return <button disabled className="btn-disabled w-full md:w-auto">{lang === 'zh' ? '活动进行中' : 'ONGOING'}</button>;
        } else {
             // 子状态 = "活动已结束"
             return <button disabled className="btn-disabled w-full md:w-auto">{lang === 'zh' ? '活动已结束' : 'ENDED'}</button>;
        }
    }

    return null;
  };

  const handleSaveResume = async (bio: string, skills: string[]) => {
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              alert(lang === 'zh' ? '请先登录' : 'Please login first');
              return;
          }
          
          await axios.put('/api/v1/users/me', {
              bio,
              skills: JSON.stringify(skills)
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          alert(lang === 'zh' ? '个人资料已更新！' : 'Profile Updated!');
          setIsAIResumeOpen(false);
          // Refresh participants list if we are in that tab
          if (activeTab === 'participants') {
              fetchHackathon();
          }
      } catch (e) {
          console.error(e);
          alert(lang === 'zh' ? '保存失败' : 'Failed to save profile');
      }
  };

  const fetchPosts = async () => {
      if (!hackathonId) return;
      setIsPostsLoading(true);
      try {
          const res = await axios.get(`api/v1/community/posts?hackathon_id=${hackathonId}`);
          setPosts(res.data);
      } catch (e) { console.error(e); }
      finally { setIsPostsLoading(false); }
  };

  const handleCreatePost = async () => {
      if (!newPostTitle || !newPostContent) return;
      try {
          await axios.post('api/v1/community/posts', {
              hackathon_id: hackathonId,
              title: newPostTitle,
              content: newPostContent,
              type: newPostType
          }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setNewPostTitle('');
          setNewPostContent('');
          setShowNewPost(false);
          fetchPosts();
      } catch (e) { alert('Failed to create post'); }
  };

  const handleGenerateTopic = async () => {
      try {
          await axios.post(`api/v1/community/generate?hackathon_id=${hackathonId}`, {}, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          fetchPosts();
      } catch (e) { alert('Failed to generate topic'); }
  };

  const handleLikePost = async (postId: number) => {
    try {
        await axios.post(`api/v1/community/posts/${postId}/like`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    } catch (e) { alert('Failed to like post'); }
  };

  const toggleComments = async (postId: number) => {
    if (expandedPostId === postId) {
        setExpandedPostId(null);
    } else {
        setExpandedPostId(postId);
        if (!comments[postId]) {
            fetchComments(postId);
        }
    }
  };

  const fetchComments = async (postId: number) => {
    setLoadingComments(true);
    try {
        const res = await axios.get(`api/v1/community/posts/${postId}/comments`);
        setComments(prev => ({ ...prev, [postId]: res.data }));
    } catch (e) { console.error(e); }
    finally { setLoadingComments(false); }
  };

  const handleCreateComment = async (postId: number) => {
    if (!commentContent.trim()) return;
    try {
        await axios.post(`api/v1/community/posts/${postId}/comments`, {
            content: commentContent,
            post_id: postId
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setCommentContent('');
        fetchComments(postId);
    } catch (e) { alert('Failed to post comment'); }
  };

  // Dynamic Filters
  const availableRoles = Array.from(new Set(recruitments.map(r => r.role))).filter(Boolean).sort();
  const availableSkills = Array.from(new Set(recruitments.flatMap(r => (r.skills || '').split(/[,，]/).map(s => s.trim())))).filter(Boolean).sort();

  const filteredRecruitments = recruitments.filter(r => {
      const searchLower = recruitmentSearch.toLowerCase();
      const matchesSearch = !recruitmentSearch || 
          r.role.toLowerCase().includes(searchLower) || 
          r.skills.toLowerCase().includes(searchLower) ||
          (r.team?.name || '').toLowerCase().includes(searchLower);
      
      const matchesRole = !roleFilter || r.role.toLowerCase().includes(roleFilter.toLowerCase());
      const matchesSkill = !skillFilter || r.skills.toLowerCase().includes(skillFilter.toLowerCase());

      return matchesSearch && matchesRole && matchesSkill;
  });

  if (!isOpen || !hackathonId) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-0">
      {/* Sub Modals */}
      <SubmitProjectModal 
        isOpen={isSubmitOpen} 
        onClose={() => { 
          setIsSubmitOpen(false); 
          fetchHackathon(); 
          setRefinedDescription(''); 
          setInitialProjectData(null); // Reset AI generated data
        }} 
        hackathonId={hackathonId}
        teamId={myTeam?.id}
        existingProject={myProject}
        initialDescription={refinedDescription}
        initialData={initialProjectData}
        lang={lang}
      />
      <JudgingModal
        isOpen={isJudgingOpen}
        onClose={() => setIsJudgingOpen(false)}
        hackathonId={hackathonId}
        hackathonTitle={hackathon?.title || ''}
        lang={lang}
      />
      <ResultPublishModal
        isOpen={isResultPublishOpen}
        onClose={() => { setIsResultPublishOpen(false); fetchHackathon(); }}
        hackathonId={hackathonId}
        lang={lang}
      />
      <AIResumeModal
        isOpen={isAIResumeOpen}
        onClose={() => setIsAIResumeOpen(false)}
        lang={lang}
        onSave={handleSaveResume}
      />

      <div ref={containerRef} className="bg-surface w-full h-full flex flex-col relative border-none shadow-none overflow-hidden">


        {loading || !hackathon ? (
            <div className="flex-1 flex items-center justify-center">
                <div className="font-mono text-brand animate-pulse">{lang === 'zh' ? '正在加载...' : 'LOADING...'}</div>
            </div>
        ) : (
            <div className="h-full overflow-y-auto scrollbar-thin relative bg-surface" id="detail-scroll-container">
                {/* Header Section */}
                <div className="relative shrink-0 bg-black border-b border-brand/20">
                    {/* Close Button */}
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-brand text-white hover:text-black rounded-full transition-all backdrop-blur-md border border-white/10 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="relative h-auto min-h-[300px] w-full overflow-hidden flex flex-col justify-end">
                        {hackathon.cover_image && (
                            <div className="absolute inset-0">
                                <img src={hackathon.cover_image} className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
                            </div>
                        )}
                        
                        <div className="relative z-10 w-full p-6 md:p-10 flex flex-col gap-6">
                             {/* Organizer Info */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/50 flex items-center justify-center text-brand font-bold">
                                    {hackathon.organizer_name ? hackathon.organizer_name[0].toUpperCase() : 'O'}
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">{lang === 'zh' ? '主办方' : 'ORGANIZED BY'}</div>
                                    <div className="font-bold text-white hover:text-brand cursor-pointer transition-colors text-sm">{hackathon.organizer_name || 'Unknown'}</div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                                <div className="flex-1 space-y-4">
                                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none text-shadow-brand">
                                        {hackathon.title}
                                    </h1>
                                    {hackathon.subtitle && <p className="text-xl text-gray-300 font-light">{hackathon.subtitle}</p>}
                                    
                                    {/* Key Info Bar */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm font-mono text-gray-300 bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-sm inline-flex">
                                        <div className="flex items-center gap-2">
                                            <span className="text-brand">📅</span>
                                            <span>{new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="w-px h-3 bg-white/20" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-brand">{hackathon.format === 'online' ? '🌐' : '📍'}</span>
                                            <span>{hackathon.format === 'online' ? 'ONLINE' : (hackathon.location || 'OFFLINE')}</span>
                                        </div>
                                        {hackathon.theme_tags && (
                                            <>
                                                <div className="w-px h-3 bg-white/20" />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-brand">🏷️</span>
                                                    <span className="uppercase">{hackathon.theme_tags.split(',').slice(0, 2).join(', ')}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="w-px h-3 bg-white/20" />
                                        <button className="hover:text-white transition-colors flex items-center gap-1">
                                            <span className="text-brand">🔗</span> SHARE
                                        </button>
                                    </div>
                                </div>

                                <div className="min-w-[200px] flex flex-col items-end gap-3">
                                    {renderActionButton()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="sticky top-0 z-40 flex border-b border-brand/20 bg-black/80 backdrop-blur-md overflow-x-auto">
                    {[
                        { id: 'overview', label: lang === 'zh' ? '活动详情' : 'OVERVIEW' },
                        { id: 'my_project', label: lang === 'zh' ? '我的项目' : 'MY PROJECT' },
                        { id: 'participants', label: lang === 'zh' ? '社区 & 组队' : 'COMMUNITY' },
                        { id: 'gallery', label: lang === 'zh' ? '项目展示' : 'GALLERY' },
                        { id: 'results', label: lang === 'zh' ? '评审结果' : 'RESULTS' },
                        ...(enrollment?.status === 'approved' ? [{ id: 'tools', label: lang === 'zh' ? 'AI 工具箱' : 'AI TOOLS' }] : []),
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${
                                activeTab === tab.id ? 'text-brand bg-white/5' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand" />}
                        </button>
                    ))}
                    {hackathon.organizer_id === currentUserId && (
                        <div className="ml-auto flex items-center px-4 gap-2">
                             <button onClick={() => onEdit && onEdit(hackathon)} className="text-xs text-gray-400 hover:text-white font-mono">[{lang === 'zh' ? '编辑' : 'EDIT'}]</button>
                             <button onClick={() => setIsJudgingOpen(true)} className="text-xs text-gray-400 hover:text-white font-mono">[{lang === 'zh' ? '评审' : 'JUDGE'}]</button>
                             <button onClick={() => setIsResultPublishOpen(true)} className="text-xs text-gray-400 hover:text-white font-mono">[{lang === 'zh' ? '发布' : 'PUBLISH'}]</button>
                        </div>
                    )}
                    {/* Public Judge Button - Only visible during judging phase for judges */}
                    {isJudge && hackathon.status === 'judging' && (
                        <div className="ml-auto flex items-center px-4">
                             <button 
                                onClick={() => setIsJudgingOpen(true)} 
                                className="px-6 py-2 bg-brand text-black font-black uppercase tracking-wider hover:bg-white border-2 border-brand shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all text-sm animate-pulse"
                             >
                                {lang === 'zh' ? '进入评审室' : 'ENTER JUDGING ROOM'}
                             </button>
                        </div>
                    )}
                </div>

                {/* Tab Content */}
                <div className="relative min-h-screen bg-surface">
                    <div className="p-6 md:p-12 pb-32">
                        
                        {/* OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
                                {/* Left Sidebar - TOC */}
                                <div className="hidden md:block col-span-1">
                                    <div className="sticky top-24 space-y-2 border-l border-white/10 pl-6">
                                        <div className="text-xs font-mono text-gray-500 mb-4 uppercase tracking-widest">Navigation</div>
                                        {sections.map(s => (
                                            <button key={s.id} onClick={() => scrollToSection(s.id)} 
                                                className="block text-sm text-gray-400 hover:text-brand hover:translate-x-1 transition-all text-left w-full py-1">
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Middle Content */}
                                <div className="col-span-1 md:col-span-2 space-y-16">
                                    <section id="intro" className="scroll-mt-24">
                                        <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                            <span className="w-8 h-1 bg-brand"></span>
                                            {lang === 'zh' ? '活动简介' : 'INTRODUCTION'}
                                        </h3>
                                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed">
                                            <ReactMarkdown>{hackathon.description || ''}</ReactMarkdown>
                                        </div>
                                    </section>
                                    
                                    <section id="schedule" className="scroll-mt-24">
                                        <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                            <span className="w-8 h-1 bg-brand"></span>
                                            {lang === 'zh' ? '活动日程' : 'SCHEDULE'}
                                        </h3>
                                        <div className="bg-white/5 border border-white/10 p-8 rounded-sm space-y-6 hover:border-brand/30 transition-colors">
                                             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                                <span className="text-gray-400 font-mono text-sm uppercase tracking-wider">{lang === 'zh' ? '报名开始' : 'REGISTRATION START'}</span>
                                                <span className="text-white font-mono text-lg">{hackathon.registration_start_date ? new Date(hackathon.registration_start_date).toLocaleString() : 'TBD'}</span>
                                             </div>
                                             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                                <span className="text-gray-400 font-mono text-sm uppercase tracking-wider">{lang === 'zh' ? '报名截止' : 'REGISTRATION END'}</span>
                                                <span className="text-white font-mono text-lg">{hackathon.registration_end_date ? new Date(hackathon.registration_end_date).toLocaleString() : 'TBD'}</span>
                                             </div>
                                             <div className="flex justify-between items-center pb-2">
                                                <span className="text-brand font-mono text-sm uppercase tracking-wider">{lang === 'zh' ? '作品提交截止' : 'SUBMISSION DEADLINE'}</span>
                                                <span className="text-brand font-mono text-xl font-bold">{hackathon.submission_end_date ? new Date(hackathon.submission_end_date).toLocaleString() : 'TBD'}</span>
                                             </div>
                                            

                                        </div>
                                    </section>

                                    {hackathon.requirements && (
                                        <section id="requirements">
                                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                                <span className="w-8 h-1 bg-brand"></span>
                                                {lang === 'zh' ? '参赛要求' : 'REQUIREMENTS'}
                                            </h3>
                                            <div className="prose prose-invert max-w-none text-gray-300 bg-black/20 p-6 border-l-2 border-brand/20">
                                                <ReactMarkdown>{hackathon.requirements}</ReactMarkdown>
                                            </div>
                                        </section>
                                    )}

                                    {hackathon.rules_detail && (
                                        <section id="rules">
                                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                                <span className="w-8 h-1 bg-brand"></span>
                                                {lang === 'zh' ? '评审规则' : 'RULES'}
                                            </h3>
                                            <div className="prose prose-invert max-w-none text-gray-300">
                                                <ReactMarkdown>{hackathon.rules_detail}</ReactMarkdown>
                                            </div>
                                        </section>
                                    )}

                                    {judges.length > 0 && (
                                        <section id="judges" className="scroll-mt-24">
                                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                                <span className="w-8 h-1 bg-brand"></span>
                                                {lang === 'zh' ? '评委阵容' : 'JUDGES'}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {judges.map((judge) => (
                                                    <div key={judge.id} className="bg-white/5 border border-white/10 p-6 flex items-start gap-4 hover:border-brand/30 transition-colors">
                                                        <div className="w-16 h-16 shrink-0 bg-brand/20 rounded-full overflow-hidden border border-brand/20">
                                                            {judge.avatar_url ? (
                                                                <img src={judge.avatar_url} alt={judge.nickname || judge.full_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-brand font-bold text-xl">
                                                                    {(judge.nickname || judge.full_name || '?')[0].toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-bold text-lg mb-1">{judge.nickname || judge.full_name}</div>
                                                            {judge.bio && <div className="text-sm text-gray-400 line-clamp-2">{judge.bio}</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {awards.length > 0 && (
                                        <section id="awards">
                                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                                <span className="w-8 h-1 bg-brand"></span>
                                                {lang === 'zh' ? '奖项设置' : 'AWARDS'}
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6">
                                                {awards.map((award, i) => (
                                                    <div key={i} className="relative overflow-hidden bg-gradient-to-r from-brand/5 to-transparent border border-brand/20 p-6 flex flex-col md:flex-row justify-between items-center group hover:border-brand/50 transition-all">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="mb-4 md:mb-0 text-center md:text-left">
                                                            <div className="text-brand font-black text-xl uppercase tracking-wider mb-1">{award.name}</div>
                                                            <div className="text-sm text-gray-400 font-mono">{award.description}</div>
                                                        </div>
                                                        <div className="text-3xl font-black text-white tracking-tighter text-shadow-brand">{award.prize}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {sponsors.length > 0 && (
                                        <section id="sponsors" className="scroll-mt-24">
                                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                                <span className="w-8 h-1 bg-brand"></span>
                                                {lang === 'zh' ? '合作伙伴' : 'SPONSORS'}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {sponsors.map((sponsor, idx) => (
                                                    <a key={idx} href={sponsor.url} target="_blank" rel="noopener noreferrer" className="block bg-white/5 border border-white/10 p-4 hover:border-brand/50 transition-all group">
                                                        <div className="h-16 mb-3 flex items-center justify-center bg-black/20 p-2">
                                                            {sponsor.logo ? (
                                                                <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all" />
                                                            ) : (
                                                                <span className="text-gray-600 text-xs">NO LOGO</span>
                                                            )}
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-sm font-bold text-gray-300 group-hover:text-brand truncate">{sponsor.name}</div>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    
                                    {hackathon.resource_detail && (
                                        <section id="resources" className="scroll-mt-24">
                                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                                <span className="w-8 h-1 bg-brand"></span>
                                                {lang === 'zh' ? '资源与支持' : 'RESOURCES'}
                                            </h3>
                                            <div className="prose prose-invert max-w-none text-gray-300">
                                                <ReactMarkdown>{hackathon.resource_detail}</ReactMarkdown>
                                            </div>
                                        </section>
                                    )}
                                </div>

                                {/* Right Sidebar - Info Cards */}
                                <div className="hidden md:block col-span-1 space-y-6">
                                    {/* AI Team Match Card */}
                                    {(enrollment || myTeam) && (
                                    <div className="bg-brand/10 border border-brand/50 p-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl group-hover:opacity-20 transition-opacity">⚡</div>
                                        <h4 className="text-brand font-black uppercase mb-2">{lang === 'zh' ? '寻找队友' : 'TEAM MATCH'}</h4>
                                        <p className="text-xs text-gray-300 mb-4">
                                            {lang === 'zh' ? '基于 AI 的智能组队推荐' : 'AI-powered teammate recommendation'}
                                        </p>
                                        <button onClick={onTeamMatch} className="w-full btn-primary py-2 text-xs">
                                            {lang === 'zh' ? '开始匹配' : 'START MATCH'}
                                        </button>
                                    </div>
                                    )}
                                    <div className="bg-white/5 border border-white/10 p-6">
                                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">{lang === 'zh' ? '主办方' : 'ORGANIZER'}</div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-xl">
                                                {hackathon.organizer_name ? hackathon.organizer_name[0].toUpperCase() : 'O'}
                                            </div>
                                            <div className="font-bold text-white">{hackathon.organizer_name || 'Unknown'}</div>
                                        </div>
                                        <button 
                                            onClick={() => setShowContact(!showContact)} 
                                            className={`w-full text-xs transition-colors ${showContact ? 'btn-primary' : 'btn-secondary'}`}
                                        >
                                            {showContact ? (lang === 'zh' ? '收起联系方式' : 'HIDE CONTACT') : (lang === 'zh' ? '联系主办方' : 'CONTACT')}
                                        </button>
                                        
                                        {showContact && (
                                            <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                {contact ? (
                                                    <>
                                                        {!Array.isArray(contact) ? (
                                                            <>
                                                                {contact.text && <div className="text-sm text-gray-300 whitespace-pre-wrap">{contact.text}</div>}
                                                                {contact.image && (
                                                                    <div className="mt-2">
                                                                        <img src={contact.image} alt="Contact QR" className="w-full h-auto rounded border border-white/10" />
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            contact.map((item: any, idx: number) => (
                                                                <div key={idx} className="text-sm text-gray-300">
                                                                    {item.type && <span className="text-brand font-mono text-xs mr-2 uppercase">{item.type}:</span>}
                                                                    {item.type === 'image' || item.type === 'qr' ? (
                                                                        <img src={item.value} alt="Contact" className="mt-1 w-full h-auto rounded border border-white/10" />
                                                                    ) : (
                                                                        <span>{item.value}</span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-xs text-gray-500 italic text-center">
                                                        {lang === 'zh' ? '暂无联系方式' : 'No contact info provided'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-6">
                                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">{lang === 'zh' ? '时间轴' : 'TIMELINE'}</div>
                                        <div className="space-y-4 relative pl-4 border-l border-white/10">
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand"></div>
                                                <div className="text-xs text-brand font-mono mb-1">{hackathon.registration_start_date ? new Date(hackathon.registration_start_date).toLocaleDateString() : 'TBD'}</div>
                                                <div className="text-sm text-white">{lang === 'zh' ? '报名开启' : 'Reg Start'}</div>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-600"></div>
                                                <div className="text-xs text-gray-400 font-mono mb-1">{hackathon.registration_end_date ? new Date(hackathon.registration_end_date).toLocaleDateString() : 'TBD'}</div>
                                                <div className="text-sm text-gray-300">{lang === 'zh' ? '报名截止' : 'Reg End'}</div>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-600"></div>
                                                <div className="text-xs text-gray-400 font-mono mb-1">{hackathon.submission_end_date ? new Date(hackathon.submission_end_date).toLocaleDateString() : 'TBD'}</div>
                                                <div className="text-sm text-gray-300">{lang === 'zh' ? '提交截止' : 'Submit End'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MY PROJECT */}
                        {activeTab === 'my_project' && (
                            loading ? (
                                <div className="flex flex-col items-center justify-center py-40">
                                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6"></div>
                                    <div className="text-brand font-mono animate-pulse">LOADING DATA...</div>
                                </div>
                            ) : (!currentUserId || (!enrollment && !myTeam)) ? <LockedView /> : (
                            <div className="max-w-3xl mx-auto">
                                {!enrollment && !myTeam ? (
                                    <div className="text-center py-20 border border-brand/20 bg-white/5">
                                        <h3 className="text-2xl font-bold text-white mb-4">{lang === 'zh' ? '尚未报名' : 'NOT ENROLLED'}</h3>
                                        <p className="text-gray-400 mb-8">{lang === 'zh' ? '请先报名参加活动，然后再创建项目。' : 'Please register for the hackathon first.'}</p>
                                        <button onClick={handleRegister} className="btn-primary px-8 py-3">{lang === 'zh' ? '立即报名' : 'REGISTER NOW'}</button>
                                    </div>
                                ) : !myTeam ? (
                                    <div className="space-y-12">
                                        {hackathon.registration_type === 'individual' ? (
                                             <div className="text-center py-20 border border-brand/20 bg-white/5">
                                                <h3 className="text-2xl font-bold text-white mb-4">{lang === 'zh' ? '开始个人项目' : 'START INDIVIDUAL PROJECT'}</h3>
                                                <button onClick={handleStartIndividual} className="btn-primary px-8 py-3">{lang === 'zh' ? '创建项目空间' : 'CREATE WORKSPACE'}</button>
                                            </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {/* Create Team */}
                                                <div className="p-6 border border-brand/20 bg-white/5">
                                                    <h3 className="text-xl font-bold text-white mb-6">{lang === 'zh' ? '创建战队' : 'CREATE TEAM'}</h3>
                                                    <div className="space-y-4">
                                                        <input 
                                                            type="text" 
                                                            placeholder={lang === 'zh' ? "战队名称" : "Team Name"}
                                                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-brand outline-none font-mono"
                                                            value={newTeamName}
                                                            onChange={e => setNewTeamName(e.target.value)}
                                                        />
                                                        <button 
                                                            onClick={handleCreateTeam}
                                                            disabled={creatingTeam || !newTeamName}
                                                            className="w-full btn-primary py-3"
                                                        >
                                                            {lang === 'zh' ? '立即创建' : 'CREATE NOW'}
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Join Team */}
                                                <div className="p-6 border border-white/10 bg-white/5">
                                                    <h3 className="text-xl font-bold text-white mb-6">{lang === 'zh' ? '加入战队' : 'JOIN TEAM'}</h3>
                                                    <p className="text-gray-400 text-sm mb-4 h-20">{lang === 'zh' ? '请在“参赛人员”页面找到想加入的战队，并联系队长。' : 'Please find a team in "Participants" tab and contact the leader.'}</p>
                                                    <button onClick={() => setActiveTab('participants')} className="btn-secondary w-full py-3">{lang === 'zh' ? '浏览战队' : 'BROWSE TEAMS'}</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Team Header */}
                                        <div className="p-6 border border-brand/30 bg-brand/5 flex justify-between items-center">
                                            <div>
                                                <div className="text-xs text-brand font-mono uppercase tracking-widest mb-1">{lang === 'zh' ? '我的战队' : 'MY TEAM'}</div>
                                                <h2 className="text-3xl font-black text-white">{myTeam.name}</h2>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 font-mono mb-2">ID: {myTeam.id}</div>
                                                <button onClick={handleLeaveTeam} className="text-xs text-red-500 hover:text-red-400 font-mono uppercase underline">
                                                    {lang === 'zh' ? '退出战队' : 'LEAVE TEAM'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Team Members */}
                                        <div className="p-6 border border-white/10 bg-white/5">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{lang === 'zh' ? '战队成员' : 'TEAM MEMBERS'}</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {myTeam.members?.map(member => (
                                                    <div key={member.id} className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2 rounded-full">
                                                        <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-xs overflow-hidden">
                                                            {member.user?.avatar_url ? (
                                                                <img src={member.user.avatar_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                (member.user?.nickname || member.user?.full_name || 'U')[0].toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-white font-medium">{member.user?.nickname || member.user?.full_name || 'User'}</span>
                                                            {member.user_id === myTeam.leader_id && <span className="text-[10px] text-brand uppercase">LEADER</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Recruit Section */}
                                            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div>
                                                    <h4 className="text-white font-bold mb-1">{lang === 'zh' ? '招募队友' : 'RECRUIT TEAMMATES'}</h4>
                                                    <p className="text-xs text-gray-400">{lang === 'zh' ? '邀请更多伙伴加入你的战队' : 'Invite more members to join your team'}</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => setIsRecruitOpen(true)}
                                                        className="px-4 py-2 border border-brand/50 text-brand hover:bg-brand hover:text-black transition-colors font-mono text-xs uppercase"
                                                    >
                                                        {lang === 'zh' ? '发布招募' : 'PUBLISH RECRUIT'}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/hackathons/${hackathon.id}?invite=${myTeam.id}`);
                                                            alert(lang === 'zh' ? '邀请链接已复制' : 'Link Copied');
                                                        }}
                                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white transition-colors font-mono text-xs uppercase"
                                                    >
                                                        {lang === 'zh' ? '复制链接' : 'COPY LINK'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Project Status */}
                                        <div className="p-8 border border-white/10 bg-white/5">
                                            <div className="flex justify-between items-start mb-6">
                                                <h3 className="text-xl font-bold text-white">{lang === 'zh' ? '项目状态' : 'PROJECT STATUS'}</h3>
                                                {myProject && (
                                                    <span className={`px-3 py-1 text-xs font-mono uppercase border ${
                                                        myProject.status === 'submitted' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'
                                                    }`}>
                                                        {myProject.status}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {myProject ? (
                                                <div className="space-y-6">
                                                    {myProject.cover_image && (
                                                        <div className="w-full h-48 bg-black/50 border border-white/10 overflow-hidden">
                                                            <img src={myProject.cover_image} alt="Cover" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="text-xs text-gray-500 uppercase font-mono">{lang === 'zh' ? '项目名称' : 'PROJECT TITLE'}</label>
                                                        <div className="text-xl font-bold text-white">{myProject.title}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 uppercase font-mono">{lang === 'zh' ? '简介' : 'DESCRIPTION'}</label>
                                                        <div className="text-sm text-gray-300 line-clamp-3">{myProject.description}</div>
                                                    </div>
                                                    {myProject.tech_stack && (
                                                        <div>
                                                            <label className="text-xs text-gray-500 uppercase font-mono">{lang === 'zh' ? '技术栈' : 'TECH STACK'}</label>
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {myProject.tech_stack.split(',').map((s, i) => (
                                                                    <span key={i} className="px-2 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-mono uppercase">
                                                                        {s.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-4 pt-4">
                                                        <button onClick={() => setIsSubmitOpen(true)} className="btn-secondary px-6">{lang === 'zh' ? '编辑项目' : 'EDIT PROJECT'}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10">
                                                    <p className="text-gray-400 mb-6">{lang === 'zh' ? '尚未提交项目' : 'No project submitted yet'}</p>
                                                    <button onClick={() => setIsSubmitOpen(true)} className="btn-primary px-8 py-3">{lang === 'zh' ? '立即提交' : 'SUBMIT PROJECT'}</button>
                                                </div>
                                            )}
                                        </div>

                                        {/* AI Project Assistant */}
                                        <div className="mt-8">
                                            <AIProjectAssistant 
                                                lang={lang}
                                                currentDescription={myProject?.description}
                                                mode="idea"
                                                onIdeaSelect={(idea) => {
                                                    console.log("Selected Idea:", idea);
                                                    setInitialProjectData({
                                                        title: idea.title,
                                                        description: idea.description,
                                                        tech_stack: Array.isArray(idea.tech_stack) ? idea.tech_stack.join(', ') : idea.tech_stack
                                                    });
                                                    setIsSubmitOpen(true);
                                                }}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <AIProjectAssistant 
                                                    lang={lang}
                                                    currentDescription={myProject?.description}
                                                    mode="recruitment"
                                                    onRecruitmentGenerate={(recruitments) => {
                                                        if (recruitments && recruitments.length > 0) {
                                                            const r = recruitments[0];
                                                            setRecruitForm({
                                                                ...recruitForm,
                                                                role: r.role || '',
                                                                skills: Array.isArray(r.skills) ? r.skills.join(', ') : (r.skills || ''),
                                                                description: r.description || '',
                                                                count: r.count || 1
                                                            });
                                                            setIsRecruitOpen(true);
                                                        }
                                                    }}
                                                />
                                                <AIProjectAssistant 
                                                    lang={lang}
                                                    currentDescription={myProject?.description}
                                                    mode="refine"
                                                    onRefineDescription={(refined) => {
                                                        setInitialProjectData({
                                                            ...myProject,
                                                            description: refined
                                                        });
                                                        setIsSubmitOpen(true);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Recruitment Form Overlay */}
                                        {isRecruitOpen && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                                <div className="bg-[#1a1a1a] border border-white/10 p-6 max-w-md w-full relative">
                                                    <button onClick={() => setIsRecruitOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                                                    <h3 className="text-xl font-bold text-white mb-4">{lang === 'zh' ? '发布招募' : 'PUBLISH RECRUITMENT'}</h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">{lang === 'zh' ? '角色' : 'ROLE'}</label>
                                                            <input 
                                                                type="text" 
                                                                value={recruitForm.role}
                                                                onChange={e => setRecruitForm({...recruitForm, role: e.target.value})}
                                                                className="w-full bg-black/50 border border-white/20 p-2 text-white"
                                                                placeholder="e.g. Frontend Developer"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">{lang === 'zh' ? '技能要求' : 'SKILLS'}</label>
                                                            <input 
                                                                type="text" 
                                                                value={recruitForm.skills}
                                                                onChange={e => setRecruitForm({...recruitForm, skills: e.target.value})}
                                                                className="w-full bg-black/50 border border-white/20 p-2 text-white"
                                                                placeholder="e.g. React, TypeScript"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">{lang === 'zh' ? '人数' : 'COUNT'}</label>
                                                            <input 
                                                                type="number" 
                                                                value={recruitForm.count}
                                                                onChange={e => setRecruitForm({...recruitForm, count: parseInt(e.target.value)})}
                                                                className="w-full bg-black/50 border border-white/20 p-2 text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">{lang === 'zh' ? '联系方式' : 'CONTACT INFO'}</label>
                                                            <input 
                                                                type="text" 
                                                                value={recruitForm.contact_info}
                                                                onChange={e => setRecruitForm({...recruitForm, contact_info: e.target.value})}
                                                                className="w-full bg-black/50 border border-white/20 p-2 text-white"
                                                                placeholder="e.g. Email, WeChat, Discord"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">{lang === 'zh' ? '描述' : 'DESCRIPTION'}</label>
                                                            <textarea 
                                                                value={recruitForm.description}
                                                                onChange={e => setRecruitForm({...recruitForm, description: e.target.value})}
                                                                className="w-full bg-black/50 border border-white/20 p-2 text-white h-24"
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={handleRecruitSubmit}
                                                            disabled={recruitLoading}
                                                            className="w-full py-3 bg-brand text-black font-bold uppercase hover:bg-brand/90 disabled:opacity-50"
                                                        >
                                                            {recruitLoading ? '...' : (lang === 'zh' ? '确认发布' : 'PUBLISH')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </div>
                            )
                        )}

                        {/* PARTICIPANTS */}
                        {activeTab === 'participants' && (
                            <div className="space-y-12">
                                {/* Community Stats Banner */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="p-4 bg-white/5 border border-white/10 text-center">
                                        <div className="text-3xl font-black text-brand mb-1">{participants.length}</div>
                                        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">{lang === 'zh' ? '参赛者' : 'PARTICIPANTS'}</div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 text-center">
                                        <div className="text-3xl font-black text-white mb-1">{teams.length}</div>
                                        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">{lang === 'zh' ? '战队' : 'TEAMS'}</div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 text-center">
                                        <div className="text-3xl font-black text-white mb-1">{galleryProjects.length}</div>
                                        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">{lang === 'zh' ? '项目' : 'PROJECTS'}</div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 text-center">
                                        <div className="text-3xl font-black text-green-500 mb-1">
                                            {teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">{lang === 'zh' ? '已组队' : 'MATCHED'}</div>
                                    </div>
                                </div>

                                {/* Community AI Insights */}
                                {insights && (
                                    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                                            <span className="w-2 h-8 bg-brand"></span>
                                            {lang === 'zh' ? '社区 AI 洞察' : 'COMMUNITY AI INSIGHTS'}
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Hot Topics Word Cloud */}
                                            <div className="bg-white/5 border border-white/10 p-6 relative overflow-hidden group">
                                                 <div className="absolute top-0 right-0 p-2 text-brand/10 text-6xl font-black">#</div>
                                                 <h4 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">{lang === 'zh' ? '热门话题' : 'HOT TOPICS'}</h4>
                                                 <div className="flex flex-wrap gap-2 relative z-10">
                                                     {insights.hot_topics.map((topic: any, idx: number) => (
                                                         <span key={idx} 
                                                             className="px-2 py-1 bg-black/50 border border-white/10 text-xs text-gray-300 hover:text-brand hover:border-brand/50 transition-colors cursor-default"
                                                             style={{ fontSize: `${Math.max(10, Math.min(24, topic.value / 2))}px` }}
                                                         >
                                                             {topic.text}
                                                         </span>
                                                     ))}
                                                 </div>
                                            </div>

                                            {/* Skill Distribution */}
                                            <div className="bg-white/5 border border-white/10 p-6">
                                                <h4 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">{lang === 'zh' ? '技能分布' : 'SKILL DISTRIBUTION'}</h4>
                                                <div className="space-y-3">
                                                    {insights.skill_distribution.map((skill: any, idx: number) => (
                                                        <div key={idx}>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-gray-300">{skill.name}</span>
                                                                <span className="text-brand font-mono">{skill.count}%</span>
                                                            </div>
                                                            <div className="h-1 bg-white/10 w-full">
                                                                <div className="h-full bg-brand" style={{ width: `${skill.count}%` }}></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* AI Summary */}
                                            <div className="bg-brand/5 border border-brand/20 p-6 relative">
                                                <div className="absolute top-2 right-2 text-brand text-xs font-mono border border-brand/50 px-1">AI GENERATED</div>
                                                <h4 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">{lang === 'zh' ? '参与者画像' : 'PARTICIPANT PORTRAITS'}</h4>
                                                <ul className="space-y-2">
                                                    {insights.participant_portraits.map((p: string, idx: number) => (
                                                         <li key={idx} className="text-xs text-gray-300 flex gap-2">
                                                             <span className="text-brand">►</span>
                                                             {p}
                                                         </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Recruitment List */}
                                <div className="mb-12">
                                    <div className="flex flex-col gap-4 mb-6">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                            <span className="w-2 h-8 bg-brand"></span>
                                            {lang === 'zh' ? '招募大厅' : 'RECRUITMENT HALL'}
                                        </h3>
                                        
                                        <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 border border-white/10">
                                            <div className="flex-1 relative">
                                                <input 
                                                    type="text" 
                                                    value={recruitmentSearch}
                                                    onChange={e => setRecruitmentSearch(e.target.value)}
                                                    placeholder={lang === 'zh' ? '搜索职位、技能或战队...' : 'Search role, skills or team...'}
                                                    className="w-full bg-black/50 border border-white/20 p-2 pl-8 text-sm text-white focus:border-brand outline-none"
                                                />
                                                <div className="absolute left-2.5 top-2.5 text-gray-500 text-xs">🔍</div>
                                            </div>

                                            <select 
                                                value={roleFilter}
                                                onChange={e => setRoleFilter(e.target.value)}
                                                className="bg-black/50 border border-white/20 p-2 text-sm text-white focus:border-brand outline-none min-w-[140px]"
                                            >
                                                <option value="">{lang === 'zh' ? '所有角色' : 'All Roles'}</option>
                                                {availableRoles.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>

                                            <select 
                                                value={skillFilter}
                                                onChange={e => setSkillFilter(e.target.value)}
                                                className="bg-black/50 border border-white/20 p-2 text-sm text-white focus:border-brand outline-none min-w-[140px]"
                                            >
                                                <option value="">{lang === 'zh' ? '所有技能' : 'All Skills'}</option>
                                                {availableSkills.map(skill => (
                                                    <option key={skill} value={skill}>{skill}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {loadingRecruitments ? (
                                        <div className="text-center py-8 text-gray-500">Loading recruitments...</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredRecruitments.length > 0 ? (
                                                filteredRecruitments.map(recruitment => (
                                                    <div key={recruitment.id} className="bg-white/5 border border-white/10 p-5 hover:border-brand/50 transition-all group relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                                            <div className="text-4xl font-black text-brand">R</div>
                                                        </div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-lg font-bold text-white group-hover:text-brand transition-colors">
                                                                {recruitment.role}
                                                            </h4>
                                                            <span className="bg-brand/20 text-brand text-xs px-2 py-1 font-mono">
                                                                {recruitment.count} {lang === 'zh' ? '人' : 'Openings'}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-400 mb-3 line-clamp-2">
                                                            {recruitment.description || (lang === 'zh' ? '暂无描述' : 'No description')}
                                                        </div>
                                                        {recruitment.contact_info && (
                                                            <div className="text-xs text-gray-500 mb-3 font-mono">
                                                                <span className="text-brand mr-2">✉</span>
                                                                {recruitment.contact_info}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {recruitment.skills.split(',').map((skill, i) => (
                                                                <span key={i} className="text-xs border border-white/20 text-gray-300 px-2 py-0.5">
                                                                    {skill.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                                    {recruitment.team?.name?.substring(0, 1).toUpperCase() || 'T'}
                                                                </div>
                                                                <span className="text-xs text-gray-300 font-bold">{recruitment.team?.name || 'Unknown Team'}</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    if (recruitment.team_id) {
                                                                        handleJoinTeam(recruitment.team_id);
                                                                    }
                                                                }}
                                                                className="text-xs text-brand hover:text-white uppercase font-bold tracking-wider flex items-center gap-1"
                                                            >
                                                                {lang === 'zh' ? '申请加入' : 'APPLY TO JOIN'} <span>→</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-2 text-center py-10 text-gray-500 border border-dashed border-white/10">
                                                    {lang === 'zh' ? '暂无招募信息' : 'No open recruitments found.'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Discussion Board */}
                                <div className="mb-12">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                            <span className="w-2 h-8 bg-brand"></span>
                                            {lang === 'zh' ? '讨论区' : 'DISCUSSION BOARD'}
                                        </h3>
                                        <div className="flex gap-3">
                                            <button onClick={handleGenerateTopic} className="px-4 py-2 border border-brand text-brand hover:bg-brand hover:text-black transition-all text-xs font-mono uppercase">
                                                {lang === 'zh' ? '✨ AI 生成话题' : '✨ AI GENERATE TOPIC'}
                                            </button>
                                            <button onClick={() => setShowNewPost(!showNewPost)} className="btn-primary px-4 py-2 text-xs">
                                                {lang === 'zh' ? '发布帖子' : 'NEW POST'}
                                            </button>
                                        </div>
                                    </div>

                                    {showNewPost && (
                                        <div className="bg-white/5 border border-white/10 p-6 mb-6 animate-fade-in">
                                            <input 
                                                type="text" 
                                                value={newPostTitle}
                                                onChange={e => setNewPostTitle(e.target.value)}
                                                placeholder={lang === 'zh' ? '标题' : 'Title'}
                                                className="w-full bg-black border border-white/20 p-3 text-white mb-4 focus:border-brand outline-none"
                                            />
                                            <textarea 
                                                value={newPostContent}
                                                onChange={e => setNewPostContent(e.target.value)}
                                                placeholder={lang === 'zh' ? '内容...' : 'Content...'}
                                                className="w-full h-32 bg-black border border-white/20 p-3 text-white mb-4 focus:border-brand outline-none resize-none"
                                            />
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setShowNewPost(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                                                <button onClick={handleCreatePost} className="btn-primary px-6 py-2">Post</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {posts.map(post => (
                                            <div key={post.id} className="bg-white/5 border border-white/10 p-6 hover:border-brand/30 transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                                                            post.type === 'question' ? 'border-yellow-500 text-yellow-500' : 
                                                            post.type === 'sharing' ? 'border-green-500 text-green-500' : 
                                                            'border-blue-500 text-blue-500'
                                                        } uppercase`}>{post.type}</span>
                                                        <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-brand transition-colors">{post.title}</h4>
                                                <p className="text-gray-400 text-sm line-clamp-2">{post.content}</p>
                                                <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">👤 {post.author?.nickname || 'User'}</span>
                                                    <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors">
                                                        <span>❤️</span> {post.likes}
                                                    </button>
                                                    <button onClick={() => toggleComments(post.id)} className={`flex items-center gap-1 hover:text-white transition-colors ${expandedPostId === post.id ? 'text-brand' : ''}`}>
                                                        <span>💬</span> {post.comments_count || (comments[post.id]?.length) || 0} {lang === 'zh' ? '评论' : 'Comments'}
                                                    </button>
                                                </div>

                                                {/* Comments Section */}
                                                {expandedPostId === post.id && (
                                                    <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2">
                                                        {/* Comment List */}
                                                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                            {loadingComments && !comments[post.id] ? (
                                                                <div className="text-xs text-gray-500 text-center py-2">Loading comments...</div>
                                                            ) : (
                                                                comments[post.id]?.length > 0 ? (
                                                                    comments[post.id].map(comment => (
                                                                        <div key={comment.id} className="bg-black/30 p-3 rounded-sm border border-white/5">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <span className="text-xs font-bold text-gray-300">{comment.author?.nickname || 'User'}</span>
                                                                                <span className="text-[10px] text-gray-600">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                                            </div>
                                                                            <div className="text-sm text-gray-400">{comment.content}</div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-xs text-gray-500 italic text-center py-2">{lang === 'zh' ? '暂无评论' : 'No comments yet'}</div>
                                                                )
                                                            )}
                                                        </div>

                                                        {/* Add Comment */}
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="text" 
                                                                value={commentContent}
                                                                onChange={e => setCommentContent(e.target.value)}
                                                                placeholder={lang === 'zh' ? '写下你的评论...' : 'Write a comment...'}
                                                                className="flex-1 bg-black border border-white/20 p-2 text-sm text-white focus:border-brand outline-none"
                                                                onKeyDown={e => e.key === 'Enter' && handleCreateComment(post.id)}
                                                            />
                                                            <button 
                                                                onClick={() => handleCreateComment(post.id)}
                                                                disabled={!commentContent.trim()}
                                                                className="btn-primary px-4 py-1 text-xs"
                                                            >
                                                                {lang === 'zh' ? '发送' : 'SEND'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {posts.length === 0 && (
                                            <div className="text-center py-10 text-gray-500 border border-dashed border-white/10">
                                                {lang === 'zh' ? '暂无讨论，来发布第一条吧！' : 'No discussions yet. Be the first to post!'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Teams Section */}
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                        <span className="w-2 h-8 bg-brand"></span>
                                        {lang === 'zh' ? '活跃战队' : 'ACTIVE TEAMS'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {teams.map(team => (
                                            <div key={team.id} className="p-6 border border-white/10 bg-white/5 hover:border-brand/50 transition-colors group flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-bold text-white text-lg group-hover:text-brand">{team.name}</h4>
                                                    <span className="text-xs font-mono text-gray-500">#{team.id}</span>
                                                </div>
                                                <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-grow">{team.description || 'No description'}</p>
                                                
                                                {/* Members */}
                                                <div className="mb-4">
                                                     <div className="text-xs text-gray-500 mb-2 uppercase font-mono">{lang === 'zh' ? '成员' : 'MEMBERS'} ({team.members?.length || 0})</div>
                                                     <div className="flex -space-x-2 overflow-hidden">
                                                        {team.members?.map(member => (
                                                            <div key={member.id} className="w-8 h-8 rounded-full bg-gray-800 border border-black flex items-center justify-center text-xs text-white relative group/avatar" title={member.user?.nickname || member.user?.full_name || 'User'}>
                                                                {member.user?.avatar_url ? (
                                                                    <img src={member.user.avatar_url} className="w-full h-full rounded-full object-cover" />
                                                                ) : (
                                                                    <span>{(member.user?.nickname || member.user?.full_name || 'U')[0].toUpperCase()}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                     </div>
                                                </div>

                                                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                                                    <span className="text-xs text-gray-500">{lang === 'zh' ? '队长 ID' : 'Leader'}: {team.leader_id}</span>
                                                    {!myTeam && enrollment && (
                                                        <button onClick={() => handleJoinTeam(team.id)} className="text-xs text-brand hover:underline uppercase font-mono">
                                                            {lang === 'zh' ? '加入' : 'JOIN'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {teams.length === 0 && <div className="col-span-full text-center py-10 text-gray-500 font-mono text-sm">NO TEAMS YET</div>}
                                    </div>
                                </div>

                                {/* Individual Participants Section */}
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                        <span className="w-2 h-8 bg-brand"></span>
                                        {lang === 'zh' ? '参赛者广场' : 'PARTICIPANT PLAZA'} ({participants.length})
                                    </h3>

                                    {/* AI Analysis Section */}
                                    <div className="mb-8 p-6 bg-brand/5 border border-brand/20 relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                                    <span>📊</span>
                                                    {lang === 'zh' ? '社区 AI 洞察' : 'COMMUNITY AI INSIGHTS'}
                                                </h4>
                                                <p className="text-gray-400 text-sm">
                                                    {lang === 'zh' 
                                                        ? '基于当前报名参赛者的 AI 实时分析报告' 
                                                        : 'Real-time AI analysis of current participants'}
                                                </p>
                                            </div>
                                            {!aiAnalysis && (
                                                <button 
                                                    onClick={handleAnalyzeParticipants}
                                                    disabled={isAnalyzing}
                                                    className="btn-primary px-6 py-2 text-sm flex items-center gap-2"
                                                >
                                                    {isAnalyzing ? (
                                                        <><span className="animate-spin">⌛</span> ANALYZING...</>
                                                    ) : (
                                                        <><span className="text-lg">⚡</span> {lang === 'zh' ? '生成报告' : 'GENERATE REPORT'}</>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {aiAnalysis && (
                                            <div className="animate-fade-in">
                                                <div className="mb-4 text-gray-200 italic border-l-2 border-brand pl-4">
                                                    "{aiAnalysis.summary}"
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-black/20 p-4">
                                                        <h5 className="text-brand font-bold mb-3 text-sm uppercase">SKILL DISTRIBUTION</h5>
                                                        <div className="space-y-2">
                                                            {aiAnalysis.skill_distribution?.map((s: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 text-xs">
                                                                    <div className="w-24 truncate text-gray-400">{s.name}</div>
                                                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-brand" style={{width: `${s.percentage}%`}}></div>
                                                                    </div>
                                                                    <div className="w-8 text-right text-brand">{s.percentage}%</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="bg-black/20 p-4">
                                                        <h5 className="text-brand font-bold mb-3 text-sm uppercase">INTEREST CLUSTERS</h5>
                                                        <div className="space-y-2">
                                                            {aiAnalysis.interest_clusters?.map((c: any, i: number) => (
                                                                <div key={i} className="text-xs">
                                                                    <span className="text-white font-bold block mb-0.5">● {c.name}</span>
                                                                    <span className="text-gray-500">{c.description}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                                                    <strong className="text-brand">RECOMMENDATION:</strong> {aiAnalysis.recommendation}
                                                </div>
                                                <div className="mt-4 text-right">
                                                    <button onClick={handleAnalyzeParticipants} className="text-xs text-brand hover:text-white underline">
                                                        {lang === 'zh' ? '刷新分析' : 'Refresh Analysis'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {participants.map(p => (
                                            <div key={p.user_id} className="group relative bg-[#1a1a1a] border border-white/10 hover:border-brand/50 transition-all duration-300 overflow-hidden">
                                                {/* Agent Badge */}
                                                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-brand text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                                                        AI AGENT
                                                    </div>
                                                </div>

                                                <div className="p-6 flex flex-col items-center text-center relative z-10">
                                                    <div className="w-20 h-20 rounded-full bg-brand/10 border-2 border-brand/20 mb-4 p-1 group-hover:scale-110 transition-transform duration-500">
                                                         {p.avatar_url ? (
                                                            <img src={p.avatar_url} className="w-full h-full object-cover rounded-full" />
                                                         ) : (
                                                            <div className="w-full h-full rounded-full bg-brand/20 flex items-center justify-center text-2xl text-brand font-black">
                                                                {(p.nickname || 'U')[0].toUpperCase()}
                                                            </div>
                                                         )}
                                                    </div>
                                                    <h4 className="text-white font-bold text-lg truncate w-full mb-1 group-hover:text-brand transition-colors">{p.nickname}</h4>
                                                    <div className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-wider">{p.enrollment_status}</div>
                                                    
                                                    {/* Skills Tags */}
                                                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                                                        {(p.skills || ['Developer']).slice(0, 3).map((s: string, i: number) => (
                                                            <span key={i} className="text-[10px] text-gray-400 border border-white/10 px-1.5 py-0.5">{s}</span>
                                                        ))}
                                                    </div>

                                                    {/* Agent Action */}
                                                    <button 
                                                        onClick={() => alert(lang === 'zh' ? `正在连接 ${p.nickname} 的智能体...\n(分析其过往项目与代码风格)` : `Connecting to ${p.nickname}'s Agent...\n(Analyzing past projects & code style)`)}
                                                        className="w-full py-2 bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-brand hover:text-black hover:border-brand transition-all font-mono uppercase flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100"
                                                    >
                                                        <span>🤖</span> {lang === 'zh' ? '智能分析' : 'AI INSIGHT'}
                                                    </button>
                                                </div>

                                                {/* Background Noise/Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            </div>
                                        ))}
                                         {participants.length === 0 && <div className="col-span-full text-center py-20 text-gray-500 font-mono text-sm">NO PARTICIPANTS YET</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* GALLERY */}
                        {activeTab === 'gallery' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {galleryProjects.map(proj => (
                                    <div key={proj.id} className="border border-white/10 bg-white/5 hover:border-brand/50 transition-colors group overflow-hidden flex flex-col h-full">
                                        <div className="h-48 bg-black/50 relative overflow-hidden">
                                            {proj.cover_image ? (
                                                <img src={proj.cover_image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl font-black bg-noise">{proj.title[0]}</div>
                                            )}
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h4 className="font-bold text-white text-lg mb-2 group-hover:text-brand transition-colors">{proj.title}</h4>
                                            <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">{proj.description}</p>
                                            <div className="flex justify-between items-center text-xs font-mono text-gray-500 pt-4 border-t border-white/5">
                                                <span>{proj.team?.name || `Team #${proj.team_id}`}</span>
                                                {proj.total_score ? <span className="text-brand font-bold">{proj.total_score.toFixed(1)} PTS</span> : <span>PENDING</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {galleryProjects.length === 0 && <div className="col-span-full text-center py-20 text-gray-500 font-mono">NO PROJECTS YET</div>}
                            </div>
                        )}

                        {/* RESULTS */}
                        {activeTab === 'results' && (
                            <div className="max-w-4xl mx-auto">
                                {results.length > 0 ? (
                                    <div className="space-y-6">
                                        {results.map((result: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-6 p-6 border border-brand/20 bg-brand/5 relative overflow-hidden">
                                                <div className="text-6xl font-black text-white/10 absolute -left-4 -bottom-4 select-none">{idx + 1}</div>
                                                <div className="relative z-10 w-16 h-16 flex items-center justify-center bg-brand text-black font-black text-2xl rounded-full">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 relative z-10">
                                                    <h4 className="text-2xl font-bold text-white mb-1">{result.project_title || result.name}</h4>
                                                    <p className="text-brand font-mono text-sm">{result.award_name}</p>
                                                </div>
                                                <div className="text-right relative z-10">
                                                    <div className="text-3xl font-black text-white">{result.score || ''}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-gray-500 font-mono">{lang === 'zh' ? '结果尚未公布' : 'RESULTS NOT PUBLISHED'}</div>
                                )}
                            </div>
                        )}

                        {/* AI TOOLS */}
                        {activeTab === 'tools' && hackathon && currentUser && (
                            <div className="max-w-4xl mx-auto h-full min-h-[500px]">
                                <AIParticipantTools user={currentUser} hackathon={hackathon} />
                            </div>
                        )}

                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}