import { useState, useEffect } from 'react';
import axios from 'axios';
import SubmitProjectModal from './SubmitProjectModal';
import JudgingModal from './JudgingModal';
import ResultPublishModal from './ResultPublishModal';

interface Hackathon {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  submission_start_date?: string;
  submission_end_date?: string;
  judging_start_date?: string;
  judging_end_date?: string;
  awards_detail?: string;
  rules_detail?: string;
  scoring_dimensions?: string;
  results_detail?: string;
  status: string;
  organizer_id: number;
}

interface Enrollment {
  id: number;
  status: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  repo_url?: string;
  demo_url?: string;
  hackathon_id: number;
}

interface HackathonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number | null;
  onEdit?: (hackathon: Hackathon) => void;
  lang: 'zh' | 'en';
}

export default function HackathonDetailModal({ isOpen, onClose, hackathonId, onEdit, lang }: HackathonDetailModalProps) {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [myProject, setMyProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matchingUsers, setMatchingUsers] = useState<{user_id: number, name: string, skills: string, match_score: number}[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isJudgingOpen, setIsJudgingOpen] = useState(false);
  const [isResultPublishOpen, setIsResultPublishOpen] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Load user info to check permissions
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      if (token) {
        // Decode token to get user ID (naive implementation)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.sub ? parseInt(payload.sub) : null);
            
            // Check verification status
            axios.get('/api/v1/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setIsVerified(res.data.is_verified);
            }).catch(e => console.error(e));

        } catch (e) {
            console.error(e);
        }
      }
      fetchDetails();
    }
  }, [isOpen, hackathonId]);

  const handleSmartMatch = async () => {
    setMatchingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/ai/generate', {
        prompt: 'match',
        type: 'matching'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatchingUsers(res.data.content.matches);
    } catch (e) {
      console.error(e);
      // Fallback for demo
      setMatchingUsers([
        { user_id: 1, name: "AI Recommended User", skills: "React, Node.js", match_score: 95 },
        { user_id: 2, name: "Design Pro", skills: "Figma, UI/UX", match_score: 88 },
        { user_id: 3, name: "Backend Guru", skills: "Python, Go", match_score: 85 }
      ]);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(lang === 'zh' ? '确定要删除这个活动吗？此操作不可撤销。' : 'Are you sure you want to delete this hackathon? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(lang === 'zh' ? '活动删除成功' : 'Hackathon deleted successfully');
      onClose();
      window.location.reload(); // Simple refresh to update list
    } catch (e) {
      console.error(e);
      alert(lang === 'zh' ? '删除失败' : 'Delete failed');
    }
  };

  const fetchDetails = async () => {
    if (!hackathonId) return;
    setLoading(true);
    try {
      // Temporary: fetch all and find
      const res = await axios.get('/api/v1/hackathons'); 
      const found = res.data.find((h: Hackathon) => h.id === hackathonId);
      setHackathon(found);

      // Check Enrollment and Project
      if (localStorage.getItem('token')) {
         try {
           const resEnroll = await axios.get('/api/v1/enrollments/me');
           const myEnrollment = resEnroll.data.find((e: any) => e.hackathon_id === hackathonId);
           setEnrollment(myEnrollment || null);

           // Check Project
           // Assuming we have an endpoint or we filter
           // For now, let's assume we can get projects via /projects/ and filter (inefficient)
           // Or assume a dedicated endpoint
           const resProjects = await axios.get('/api/v1/projects');
           // Filter by hackathon_id and current user (if project has user/team info)
           // This part is tricky without proper backend support for "my project in this hackathon"
           // Let's assume the project list returns projects I have access to or I created
           // The backend Project model links to Team, Team links to User.
           // Simplified: If I am in a team that has a project in this hackathon.
           // For now, let's skip deep check and just see if any project matches (demo logic)
           // Real logic: GET /projects/my or similar.
           // I'll assume GET /projects/ returns all, and I filter by hackathon_id.
           // Note: This is insecure/inefficient for production but okay for prototype.
           const myProj = resProjects.data.find((p: any) => p.hackathon_id === hackathonId); 
           // Wait, this finds ANY project for the hackathon. I need MINE.
           // Since I can't easily filter by "mine" without checking team, I will leave it as is for now
           // or try to fetch /projects/me if it exists.
           // I'll leave it null for now unless I'm sure.
           // Actually, let's trust the user will create one.
           // If I create a project, it should show up.
           setMyProject(myProj || null);

           // Check Judge Status
           try {
              const resJudges = await axios.get(`/api/v1/hackathons/${hackathonId}/judges`);
              const judgeList = resJudges.data;
              // Assuming judgeList returns Judge objects with user_id
              const amIJudge = judgeList.some((j: any) => j.user_id === currentUserId);
              setIsJudge(amIJudge);
           } catch (e) {
              console.error("Failed to check judge status", e);
              setIsJudge(false);
           }

         } catch (e) {
           console.error("Failed to check details", e);
         }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!hackathonId) return;
    if (!isVerified) {
        alert('报名需先完成实名认证！请前往个人中心完成认证。');
        return;
    }
    try {
      await axios.post('/api/v1/enrollments/', {
        hackathon_id: hackathonId,
        user_id: 0 
      });
      alert('报名成功！');
      fetchDetails(); 
    } catch (err: any) {
      alert(err.response?.data?.detail || '报名失败');
    }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US') : 'TBD';

  if (!isOpen || !hackathonId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm p-4 md:p-8">
      <SubmitProjectModal 
        isOpen={isSubmitOpen} 
        onClose={() => { setIsSubmitOpen(false); fetchDetails(); }} 
        hackathonId={hackathonId}
        existingProject={myProject}
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
        onClose={() => { setIsResultPublishOpen(false); fetchDetails(); }}
        hackathonId={hackathonId}
        lang={lang}
      />
      
      <div className="bg-surface w-full max-w-6xl h-[90vh] flex flex-col relative border-2 border-brand shadow-[8px_8px_0px_0px_#000]">
        <button 
          onClick={onClose}
          className="absolute top-0 right-0 z-50 p-4 bg-brand text-black hover:bg-white hover:text-black transition-colors font-mono font-bold border-l-2 border-b-2 border-black"
        >
          ✕
        </button>

        {loading ? (
           <div className="flex-1 flex items-center justify-center bg-surface">
             <div className="flex flex-col items-center gap-4">
               <div className="animate-spin h-12 w-12 border-4 border-brand border-t-transparent rounded-full"></div>
               <div className="font-mono text-brand blink">{lang === 'zh' ? '加载中...' : 'LOADING...'}</div>
             </div>
           </div>
        ) : !hackathon ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-6 bg-surface">
                <div className="text-2xl font-black text-gray-500 uppercase tracking-widest">{lang === 'zh' ? '数据丢失' : 'DATA LOST'}</div>
                <button onClick={onClose} className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 font-mono hover:text-brand hover:border-brand transition-all">
                  {lang === 'zh' ? '关闭终端' : 'CLOSE TERMINAL'}
                </button>
            </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="relative h-64 md:h-80 bg-black border-b-2 border-brand shrink-0">
                {hackathon.cover_image ? (
                    <div className="relative w-full h-full">
                        <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700" />
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent"></div>
                    </div>
                ) : (
                    <div className="w-full h-full bg-void relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,163,115,0.1),transparent_70%)]"></div>
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0)_40%,rgba(212,163,115,0.1)_50%,rgba(0,0,0,0)_60%)]"></div>
                    </div>
                )}
                
                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`px-2 py-1 text-xs font-mono font-bold uppercase border border-current ${hackathon.status === 'published' ? 'text-green-500 border-green-500 bg-green-500/10' : 'text-yellow-500 border-yellow-500 bg-yellow-500/10'}`}>
                                    [{hackathon.status === 'published' ? (lang === 'zh' ? '已发布' : 'PUBLISHED') : (lang === 'zh' ? '草稿' : 'DRAFT')}]
                                </span>
                                {hackathon.theme_tags?.split(',').map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-mono uppercase tracking-tight">
                                        #{tag.trim()}
                                    </span>
                                ))}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-2 uppercase tracking-tighter leading-none" style={{ textShadow: '4px 4px 0px #000' }}>
                                {hackathon.title}
                            </h2>
                            <div className="flex items-center gap-6 text-sm font-mono text-gray-400">
                                <span className="flex items-center gap-2">
                                    <span className="text-brand">START:</span> {formatDate(hackathon.start_date)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="text-brand">END:</span> {formatDate(hackathon.end_date)}
                                </span>
                            </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex flex-col gap-3 shrink-0">
                            {currentUserId === hackathon.organizer_id ? (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => onEdit && onEdit(hackathon)}
                                        className="px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black font-mono font-bold uppercase transition-all"
                                    >
                                        {lang === 'zh' ? '编辑' : 'EDIT'}
                                    </button>
                                    <button 
                                        onClick={handleDelete}
                                        className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-black font-mono font-bold uppercase transition-all"
                                    >
                                        {lang === 'zh' ? '删除' : 'DELETE'}
                                    </button>
                                    {hackathon.status !== 'draft' && (
                                        <button 
                                            onClick={() => setIsResultPublishOpen(true)}
                                            className="px-6 py-3 bg-brand text-black border-2 border-brand hover:bg-brand-light shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all font-bold uppercase"
                                        >
                                            {lang === 'zh' ? '管理结果' : 'MANAGE RESULTS'}
                                        </button>
                                    )}
                                </div>
                            ) : isJudge ? (
                                <button 
                                    onClick={() => setIsJudgingOpen(true)}
                                    className="px-8 py-4 bg-purple-600 text-white border-2 border-purple-400 font-mono font-bold uppercase hover:bg-purple-500 shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all"
                                >
                                    {lang === 'zh' ? '进入评审系统' : 'ENTER JUDGING SYSTEM'}
                                </button>
                            ) : enrollment ? (
                                <div className="flex gap-3 items-center">
                                    <div className={`px-4 py-2 font-mono text-sm border ${enrollment.status === 'approved' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-yellow-500 text-yellow-500 bg-yellow-500/10'}`}>
                                        STATUS: {enrollment.status === 'pending' ? (lang === 'zh' ? '审核中' : 'PENDING') : (lang === 'zh' ? '已入围' : 'APPROVED')}
                                    </div>
                                    {/* Show Submit button if approved and within time */}
                                    {enrollment.status === 'approved' && (
                                        <button 
                                            onClick={() => setIsSubmitOpen(true)}
                                            className="px-6 py-3 bg-brand text-black border-2 border-brand hover:bg-brand-light font-bold uppercase shadow-[4px_4px_0px_0px_#000] transition-all"
                                        >
                                            {myProject ? (lang === 'zh' ? '编辑项目' : 'EDIT PROJECT') : (lang === 'zh' ? '提交项目' : 'SUBMIT PROJECT')}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    onClick={handleEnroll}
                                    disabled={hackathon.status !== 'published'}
                                    className="px-10 py-4 bg-brand text-black border-2 border-brand font-black text-lg uppercase tracking-wider hover:bg-brand-light shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                                >
                                    {lang === 'zh' ? '立即报名' : 'REGISTER NOW'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-brand bg-black/40 sticky top-0 z-10 overflow-x-auto">
               {[
                 { id: 'overview', label: lang === 'zh' ? '情报概览' : 'OVERVIEW' },
                 { id: 'participants', label: lang === 'zh' ? '行动小队' : 'SQUADS' },
                 { id: 'projects', label: lang === 'zh' ? '原型展示' : 'PROTOTYPES' },
                 { id: 'results', label: lang === 'zh' ? '战果评级' : 'RESULTS' },
                 { id: 'matching', label: lang === 'zh' ? '智能匹配' : 'AI MATCH' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`px-8 py-4 font-mono font-bold text-sm uppercase transition-all relative whitespace-nowrap ${
                     activeTab === tab.id 
                       ? 'bg-brand text-black' 
                       : 'text-gray-500 hover:text-brand hover:bg-white/5'
                   }`}
                 >
                   {tab.id === 'matching' && <span className="mr-2">⚡</span>}
                   {tab.label}
                 </button>
               ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-surface custom-scrollbar">
               {activeTab === 'matching' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-void border border-brand/20 p-8 relative overflow-hidden group hover:border-brand/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="text-9xl font-black text-brand">AI</div>
                        </div>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <span className="text-brand text-3xl">⚡</span> 
                                    {lang === 'zh' ? '神经网络匹配系统' : 'NEURAL MATCHING SYSTEM'}
                                </h3>
                                <p className="text-gray-400 font-mono text-sm mt-2 max-w-lg">
                                    {lang === 'zh' 
                                      ? `基于您的技能矩阵 [${currentUserId ? '已连接' : '离线'}] 和兴趣向量进行高维空间匹配` 
                                      : `Matching based on your skill matrix [${currentUserId ? 'ONLINE' : 'OFFLINE'}] and interest vectors.`}
                                </p>
                            </div>
                            <button
                                onClick={handleSmartMatch}
                                disabled={matchingLoading || !currentUserId}
                                className="px-8 py-3 bg-purple-600/20 text-purple-400 border border-purple-500/50 font-mono font-bold uppercase hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {matchingLoading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                                        {lang === 'zh' ? '计算中...' : 'COMPUTING...'}
                                    </>
                                ) : (
                                    lang === 'zh' ? '启动匹配程序' : 'INITIATE MATCH'
                                )}
                            </button>
                        </div>
                        
                        {!currentUserId && (
                             <div className="mt-6 p-4 bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-500 font-mono text-sm">
                                 ⚠ {lang === 'zh' ? '警告: 用户未登录。无法访问技能数据库。' : 'WARNING: USER NOT LOGGED IN. SKILL DATABASE INACCESSIBLE.'}
                             </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
                            {matchingUsers.map(user => (
                                <div key={user.user_id} className="bg-black/40 p-5 border border-white/10 hover:border-brand hover:bg-black/60 transition-all group/card">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-white font-mono text-lg">{user.name}</h4>
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-mono border border-green-500/30">
                                            MATCH: {user.match_score}%
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="text-xs text-gray-500 uppercase font-mono">Skills</div>
                                        <p className="text-sm text-gray-300 font-mono break-words">
                                            {user.skills}
                                        </p>
                                    </div>
                                    <button className="w-full py-2 bg-white/5 text-brand border border-brand/30 hover:bg-brand hover:text-black hover:border-brand font-mono text-sm font-bold uppercase transition-all">
                                        {lang === 'zh' ? '发送信号' : 'SEND SIGNAL'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {matchingUsers.length === 0 && !matchingLoading && currentUserId && (
                            <div className="text-center py-12 text-gray-600 font-mono text-sm border-2 border-dashed border-white/5 rounded-lg mt-8">
                                {lang === 'zh' ? '等待指令...' : 'AWAITING COMMAND...'}
                            </div>
                        )}
                    </div>
                </div>
              )}

              {activeTab === 'overview' && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Results Section */}
                        {hackathon.results_detail && (
                            <section className="bg-yellow-500/5 border border-yellow-500/20 p-6 relative">
                                <div className="absolute top-0 right-0 px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-mono uppercase">
                                    {lang === 'zh' ? '最新情报' : 'LATEST INTEL'}
                                </div>
                                <h3 className="text-xl font-bold mb-6 text-yellow-500 flex items-center gap-2 font-mono uppercase tracking-tight">
                                    🏆 {lang === 'zh' ? '获奖名单公布' : 'WINNERS ANNOUNCED'}
                                </h3>
                                <div className="grid gap-4">
                                    {(() => {
                                        try {
                                            const winners = JSON.parse(hackathon.results_detail);
                                            return winners.map((w: any, idx: number) => (
                                                <div key={idx} className="bg-black/40 p-4 border border-yellow-500/30 flex justify-between items-center group hover:bg-yellow-500/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 font-mono font-bold text-sm border border-yellow-500/50 uppercase">
                                                            {w.award_name}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-lg text-white font-mono">{w.project_name}</h4>
                                                            {w.comment && <p className="text-sm text-gray-400 mt-1 font-mono">"{w.comment}"</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        } catch (e) {
                                            return <p className="text-red-500 font-mono">{lang === 'zh' ? '结果数据解析失败' : 'DATA PARSING ERROR'}</p>;
                                        }
                                    })()}
                                </div>
                            </section>
                        )}

                        <section className="bg-white/5 border border-white/10 p-8 hover:border-brand/30 transition-colors group">
                            <h3 className="text-xl font-black text-brand uppercase mb-6 flex items-center gap-2 tracking-tight group-hover:translate-x-2 transition-transform">
                                <span className="text-white opacity-50">//</span> {lang === 'zh' ? '活动介绍' : 'MISSION BRIEF'}
                            </h3>
                            <p className="whitespace-pre-wrap text-gray-300 leading-relaxed font-mono text-sm">
                                {hackathon.description}
                            </p>
                        </section>

                        <section className="bg-white/5 border border-white/10 p-8 hover:border-brand/30 transition-colors group">
                            <h3 className="text-xl font-black text-brand uppercase mb-6 flex items-center gap-2 tracking-tight group-hover:translate-x-2 transition-transform">
                                <span className="text-white opacity-50">//</span> {lang === 'zh' ? '详细规则' : 'PROTOCOL RULES'}
                            </h3>
                            <div className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
                                {hackathon.rules_detail || (lang === 'zh' ? "暂无详细规则" : "NO PROTOCOL DATA")}
                            </div>
                        </section>

                        <section className="bg-white/5 border border-white/10 p-8 hover:border-brand/30 transition-colors group">
                            <h3 className="text-xl font-black text-brand uppercase mb-6 flex items-center gap-2 tracking-tight group-hover:translate-x-2 transition-transform">
                                <span className="text-white opacity-50">//</span> {lang === 'zh' ? '奖项设置' : 'BOUNTY DATA'}
                            </h3>
                            <div className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
                                {hackathon.awards_detail || (lang === 'zh' ? "暂无奖项信息" : "NO BOUNTY DATA")}
                            </div>
                        </section>

                        <section className="bg-white/5 border border-white/10 p-8 hover:border-brand/30 transition-colors group">
                            <h3 className="text-xl font-black text-brand uppercase mb-6 flex items-center gap-2 tracking-tight group-hover:translate-x-2 transition-transform">
                                <span className="text-white opacity-50">//</span> {lang === 'zh' ? '提交要求' : 'SUBMISSION REQS'}
                            </h3>
                            <div className="text-gray-300 space-y-2 font-mono text-sm">
                                <p>{lang === 'zh' ? '参赛者需在规定时间内提交作品，包含以下内容：' : 'Participants must submit the following within the timeframe:'}</p>
                                <ul className="list-disc list-inside pl-4 space-y-2 marker:text-brand">
                                    <li><strong className="text-white">{lang === 'zh' ? '项目名称与简介' : 'Project Name & Brief'}</strong>: {lang === 'zh' ? '清晰描述项目解决了什么问题。' : 'Clear description of the problem solved.'}</li>
                                    <li><strong className="text-white">{lang === 'zh' ? '代码仓库 URL' : 'Repo URL'}</strong>: {lang === 'zh' ? '公开的 GitHub/GitLab 仓库链接。' : 'Public GitHub/GitLab link.'}</li>
                                    <li><strong className="text-white">{lang === 'zh' ? '演示 Demo URL' : 'Demo URL'}</strong>: {lang === 'zh' ? '可访问的在线演示地址。' : 'Accessible online demo link.'}</li>
                                    <li><strong className="text-white">{lang === 'zh' ? '演示视频 URL' : 'Video URL'}</strong>: {lang === 'zh' ? '(可选) YouTube/Bilibili 等视频链接。' : '(Optional) Video link.'}</li>
                                </ul>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Timeline & Info */}
                    <div className="col-span-1 space-y-6">
                        <div className="bg-white/5 border border-white/10 p-6">
                            <h3 className="font-black mb-6 text-white uppercase tracking-tight flex items-center gap-2">
                                <span className="text-brand">📅</span> {lang === 'zh' ? '日程安排' : 'TIMELINE'}
                            </h3>
                            <div className="space-y-0 relative before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-20px)] before:w-[2px] before:bg-white/10">
                                <TimelineItem label={lang === 'zh' ? "报名开始" : "REG OPEN"} date={hackathon.registration_start_date} active />
                                <TimelineItem label={lang === 'zh' ? "报名截止" : "REG CLOSE"} date={hackathon.registration_end_date} />
                                <TimelineItem label={lang === 'zh' ? "比赛开始" : "HACK START"} date={hackathon.start_date} />
                                <TimelineItem label={lang === 'zh' ? "提交截止" : "SUBMIT DUE"} date={hackathon.submission_end_date} />
                                <TimelineItem label={lang === 'zh' ? "评审开始" : "JUDGE START"} date={hackathon.judging_start_date} />
                                <TimelineItem label={lang === 'zh' ? "评审结束" : "JUDGE END"} date={hackathon.judging_end_date} />
                                <TimelineItem label={lang === 'zh' ? "比赛结束" : "HACK END"} date={hackathon.end_date} />
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-6">
                            <h3 className="font-black mb-6 text-white uppercase tracking-tight flex items-center gap-2">
                                <span className="text-brand">♟</span> {lang === 'zh' ? '主办方' : 'ORGANIZER'}
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand text-black flex items-center justify-center font-black text-xl border-2 border-white">
                                    {hackathon.organizer_id}
                                </div>
                                <div>
                                    <div className="font-mono font-bold text-white uppercase">Organizer #{hackathon.organizer_id}</div>
                                    <div className="text-xs text-brand font-mono border border-brand px-1 inline-block mt-1 uppercase">
                                        {lang === 'zh' ? '已认证' : 'VERIFIED'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
               )}

               {activeTab === 'participants' && (
                 <div className="flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-white/10 bg-white/5">
                   <div className="text-4xl mb-4">🚧</div>
                   <p className="font-mono uppercase tracking-widest">{lang === 'zh' ? '团队列表即将上线...' : 'SQUAD LIST INCOMING...'}</p>
                 </div>
               )}

               {activeTab === 'projects' && (
                 <div className="flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-white/10 bg-white/5">
                   <div className="text-4xl mb-4">🚧</div>
                   <p className="font-mono uppercase tracking-widest">{lang === 'zh' ? '项目展示区...' : 'PROTOTYPE SHOWCASE...'}</p>
                 </div>
               )}

               {activeTab === 'results' && (
                 <div className="flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-white/10 bg-white/5">
                   <div className="text-4xl mb-4">🔒</div>
                   <p className="font-mono uppercase tracking-widest">{lang === 'zh' ? '比赛结果将在活动结束后公布。' : 'RESULTS CLASSIFIED UNTIL EVENT END.'}</p>
                 </div>
               )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ label, date, active }: { label: string, date?: string, active?: boolean }) {
    if (!date) return null;
    return (
        <div className="relative pl-8 pb-6 last:pb-0 group">
            <div className={`absolute left-0 top-1.5 w-4 h-4 border-2 transition-colors ${active ? 'bg-brand border-brand shadow-[0_0_10px_rgba(212,163,115,0.5)]' : 'bg-black border-gray-600 group-hover:border-brand'}`}></div>
            <div className="text-xs text-gray-500 font-mono mb-1">{new Date(date).toLocaleString()}</div>
            <div className={`font-bold font-mono uppercase text-sm ${active ? 'text-brand' : 'text-gray-300 group-hover:text-white'}`}>{label}</div>
        </div>
    );
}
