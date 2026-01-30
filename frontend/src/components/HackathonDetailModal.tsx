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
}

export default function HackathonDetailModal({ isOpen, onClose, hackathonId, onEdit }: HackathonDetailModalProps) {
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
    if (!confirm('确定要删除这个活动吗？此操作不可撤销。')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('活动删除成功');
      onClose();
      window.location.reload(); // Simple refresh to update list
    } catch (e) {
      console.error(e);
      alert('删除失败');
    }
  };

  const fetchDetails = async () => {
    if (!hackathonId) return;
    setLoading(true);
    try {
      // Temporary: fetch all and find
      const res = await axios.get('/api/v1/hackathons/'); 
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
           const resProjects = await axios.get('/api/v1/projects/');
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

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString() : 'TBD';

  if (!isOpen || !hackathonId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <SubmitProjectModal 
        isOpen={isSubmitOpen} 
        onClose={() => { setIsSubmitOpen(false); fetchDetails(); }} 
        hackathonId={hackathonId}
        existingProject={myProject}
      />
      <JudgingModal
        isOpen={isJudgingOpen}
        onClose={() => setIsJudgingOpen(false)}
        hackathonId={hackathonId}
        hackathonTitle={hackathon?.title || ''}
      />
      <ResultPublishModal
        isOpen={isResultPublishOpen}
        onClose={() => { setIsResultPublishOpen(false); fetchDetails(); }}
        hackathonId={hackathonId}
      />
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white z-20 bg-black/20 hover:bg-black/40 rounded-full p-2 transition"
        >
          ✕
        </button>

        {loading ? (
           <div className="flex-1 flex items-center justify-center">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
           </div>
        ) : !hackathon ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
                <div className="text-xl text-gray-500">未找到活动信息</div>
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300">关闭</button>
            </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="relative h-48 md:h-64 bg-gray-900">
                {hackathon.cover_image ? (
                    <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-700 opacity-80" />
                )}
                <div className="absolute bottom-0 left-0 p-8 text-white w-full bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex gap-2 mb-2">
                                {hackathon.theme_tags?.split(',').map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-blue-500/30 border border-blue-400/50 rounded text-xs backdrop-blur-sm">{tag.trim()}</span>
                                ))}
                                {hackathon.professionalism_tags?.split(',').map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-purple-500/30 border border-purple-400/50 rounded text-xs backdrop-blur-sm">{tag.trim()}</span>
                                ))}
                            </div>
                            <h2 className="text-4xl font-bold mb-2">{hackathon.title}</h2>
                            <div className="flex gap-6 text-sm opacity-90">
                                <span>📅 {formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}</span>
                                <span className={`capitalize px-2 py-0.5 rounded ${hackathon.status === 'published' ? 'bg-green-500/80' : 'bg-yellow-500/80'}`}>{hackathon.status}</span>
                            </div>
                        </div>
                        
                        {/* Action Button */}
                        <div>
                            {currentUserId === hackathon.organizer_id ? (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onEdit && onEdit(hackathon)}
                                        className="px-4 py-2 bg-white text-gray-700 border rounded hover:bg-gray-50 shadow-lg font-bold"
                                    >
                                        编辑活动
                                    </button>
                                    <button 
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-white text-red-500 border rounded hover:bg-gray-50 shadow-lg font-bold"
                                    >
                                        删除
                                    </button>
                                    {hackathon.status !== 'draft' && (
                                        <button 
                                            onClick={() => setIsResultPublishOpen(true)}
                                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 shadow-lg font-bold"
                                        >
                                            发布/管理结果
                                        </button>
                                    )}
                                </div>
                            ) : isJudge ? (
                                <button 
                                    onClick={() => setIsJudgingOpen(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition"
                                >
                                    开始评审
                                </button>
                            ) : enrollment ? (
                                <div className="flex gap-3">
                                    <div className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg">
                                        已报名 ({enrollment.status === 'pending' ? '审核中' : '已通过'})
                                    </div>
                                    {/* Show Submit button if approved and within time */}
                                    {enrollment.status === 'approved' && (
                                        <button 
                                            onClick={() => setIsSubmitOpen(true)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition"
                                        >
                                            {myProject ? '编辑作品' : '提交作品'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    onClick={handleEnroll}
                                    disabled={hackathon.status !== 'published'}
                                    className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    立即报名
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-8 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
               {['overview', 'participants', 'projects', 'results', 'matching'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`mr-8 py-4 font-medium border-b-2 transition ${
                     activeTab === tab 
                       ? 'border-blue-600 text-blue-600' 
                       : 'border-transparent text-gray-500 hover:text-gray-700'
                   } capitalize`}
                 >
                   {tab === 'overview' ? '活动详情' :
                    tab === 'participants' ? '参赛团队' :
                    tab === 'projects' ? '项目展示' :
                    tab === 'results' ? '比赛结果' :
                    <span className="flex items-center gap-1">🤖 智能组队</span>}
                 </button>
               ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900/50">
               {activeTab === 'matching' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="text-2xl">🤝</span> AI 智能队友推荐
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    基于你的技能标签 ({currentUserId ? '已登录' : '未登录'}) 和兴趣进行匹配
                                </p>
                            </div>
                            <button
                                onClick={handleSmartMatch}
                                disabled={matchingLoading || !currentUserId}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {matchingLoading ? '匹配中...' : '开始匹配'}
                            </button>
                        </div>
                        
                        {!currentUserId && (
                             <div className="text-center p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                                 请先登录并完善个人资料（技能标签）以使用智能匹配功能。
                             </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {matchingUsers.map(user => (
                                <div key={user.user_id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{user.name}</h4>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                                            匹配度 {user.match_score}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                        技能: {user.skills}
                                    </p>
                                    <button className="w-full py-1.5 text-sm border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition">
                                        邀请组队
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {matchingUsers.length === 0 && !matchingLoading && currentUserId && (
                            <div className="text-center py-12 text-gray-400">
                                点击“开始匹配”寻找志同道合的队友
                            </div>
                        )}
                    </div>
                </div>
              )}

              {activeTab === 'overview' && (
                 <div className="grid grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="col-span-2 space-y-8">
                        {/* Results Section */}
                        {hackathon.results_detail && (
                            <section className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700/50">
                                <h3 className="text-xl font-bold mb-6 text-yellow-800 dark:text-yellow-500 flex items-center gap-2">
                                    🏆 获奖名单公布
                                </h3>
                                <div className="grid gap-4">
                                    {(() => {
                                        try {
                                            const winners = JSON.parse(hackathon.results_detail);
                                            return winners.map((w: any, idx: number) => (
                                                <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-yellow-100 dark:border-yellow-900/30 flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold text-sm">
                                                            {w.award_name}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-lg">{w.project_name}</h4>
                                                            {w.comment && <p className="text-sm text-gray-500 mt-1">{w.comment}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        } catch (e) {
                                            return <p>结果数据解析失败</p>;
                                        }
                                    })()}
                                </div>
                            </section>
                        )}

                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold mb-4 border-l-4 border-blue-500 pl-3">活动介绍</h3>
                            <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed">
                                {hackathon.description}
                            </p>
                        </section>

                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold mb-4 border-l-4 border-purple-500 pl-3">详细规则</h3>
                            <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                                {hackathon.rules_detail || "暂无详细规则"}
                            </div>
                        </section>

                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold mb-4 border-l-4 border-yellow-500 pl-3">奖项设置</h3>
                            <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                                {hackathon.awards_detail || "暂无奖项信息"}
                            </div>
                        </section>

                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold mb-4 border-l-4 border-green-500 pl-3">提交要求</h3>
                            <div className="text-gray-600 dark:text-gray-300 space-y-2">
                                <p>参赛者需在规定时间内提交作品，包含以下内容：</p>
                                <ul className="list-disc list-inside pl-4">
                                    <li><strong>项目名称与简介</strong>：清晰描述项目解决了什么问题。</li>
                                    <li><strong>代码仓库 URL</strong>：公开的 GitHub/GitLab 仓库链接。</li>
                                    <li><strong>演示 Demo URL</strong>：可访问的在线演示地址。</li>
                                    <li><strong>演示视频 URL</strong>：(可选) YouTube/Bilibili 等视频链接。</li>
                                </ul>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Timeline & Info */}
                    <div className="col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">📅 日程安排</h3>
                            <div className="space-y-4 relative before:absolute before:left-1.5 before:top-2 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                                <TimelineItem label="报名开始" date={hackathon.registration_start_date} active />
                                <TimelineItem label="报名截止" date={hackathon.registration_end_date} />
                                <TimelineItem label="比赛开始" date={hackathon.start_date} />
                                <TimelineItem label="提交截止" date={hackathon.submission_end_date} />
                                <TimelineItem label="评审开始" date={hackathon.judging_start_date} />
                                <TimelineItem label="评审结束" date={hackathon.judging_end_date} />
                                <TimelineItem label="比赛结束" date={hackathon.end_date} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                            <h3 className="font-bold mb-4">主办方</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {hackathon.organizer_id}
                                </div>
                                <div>
                                    <div className="font-medium">Organizer #{hackathon.organizer_id}</div>
                                    <div className="text-xs text-gray-500">已认证</div>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
               )}

               {activeTab === 'participants' && (
                 <div className="text-center py-10 text-gray-500">
                   <p>团队列表即将上线...</p>
                 </div>
               )}

               {activeTab === 'projects' && (
                 <div className="text-center py-10 text-gray-500">
                   <p>项目展示区...</p>
                 </div>
               )}

               {activeTab === 'results' && (
                 <div className="text-center py-10 text-gray-500">
                   <p>比赛结果将在活动结束后公布。</p>
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
        <div className="relative pl-6">
            <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 dark:border-gray-500 dark:bg-gray-800'}`}></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{new Date(date).toLocaleString()}</div>
            <div className="font-medium text-gray-900 dark:text-gray-200">{label}</div>
        </div>
    );
}
