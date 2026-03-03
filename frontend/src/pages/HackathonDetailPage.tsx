import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import type { Hackathon, Team, Enrollment } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ReactMarkdown from 'react-markdown';

// Sub-Modals
import SubmitProjectModal from '../components/SubmitProjectModal';
import JudgingModal from '../components/JudgingModal';
import AIResumeModal from '../components/AIResumeModal';
import AIParticipantTools from '../components/AIParticipantTools';

export default function HackathonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, openLogin } = useUI();
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // Default to details
  
  // User status
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  
  // AI Tools State
  const [activeAiTool, setActiveAiTool] = useState<'idea' | 'pitch' | 'roadmap' | 'teammate'>('idea');

  // Modals
  const [isSubmitProjectOpen, setIsSubmitProjectOpen] = useState(false);
  const [isJudgingOpen, setIsJudgingOpen] = useState(false);
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHackathonDetail(id);
    }
  }, [id, user]);

  const fetchHackathonDetail = async (hackathonId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/v1/hackathons/${hackathonId}`);
      setHackathon(response.data);
      
      if (user) {
        if (response.data.organizer_id === user.id) setIsOrganizer(true);
        try {
          const enrollRes = await axios.get(`/api/v1/enrollments/${hackathonId}/me`);
          setEnrollment(enrollRes.data);
        } catch (e) {
          setEnrollment(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch hackathon detail", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      openLogin();
      return;
    }
    try {
      await axios.post(`/api/v1/enrollments/`, { hackathon_id: parseInt(id!) });
      alert(lang === 'zh' ? '报名成功！' : 'Registered successfully!');
      fetchHackathonDetail(id!);
    } catch (error) {
      console.error("Registration failed", error);
      alert(lang === 'zh' ? '报名失败' : 'Registration failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4A373] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">404 NOT FOUND</h2>
          <Button onClick={() => navigate('/hackathons')}>Back to List</Button>
        </div>
      </div>
    );
  }

  // Mock Data for UI (Replacing static text with dynamic where possible, but structure matches image)
  const TABS = [
    { id: 'details', label: lang === 'zh' ? '活动详情' : 'Details' },
    { id: 'my_project', label: lang === 'zh' ? '我的作品' : 'My Project' },
    { id: 'participants', label: lang === 'zh' ? '参赛人员' : 'Participants' },
    { id: 'showcase', label: lang === 'zh' ? '作品展示' : 'Showcase' },
    { id: 'results', label: lang === 'zh' ? '评审结果' : 'Results' },
  ];

  const CHALLENGE_AREAS = [
    { title: lang === 'zh' ? '智能能源管理' : 'Smart Energy', desc: lang === 'zh' ? '利用IoT设备优化家庭或工业用电，减少碳足迹。' : 'Optimize energy usage with IoT.' },
    { title: lang === 'zh' ? '循环经济数字化' : 'Circular Economy', desc: lang === 'zh' ? '开发促进物品回收、再利用的平台或算法。' : 'Platforms for recycling and reuse.' },
    { title: lang === 'zh' ? '环境数据可视化' : 'Data Viz', desc: lang === 'zh' ? '将复杂的空气质量或碳排放转化为公众易懂的交互图表。' : 'Visualize environmental data.' },
  ];

  const SCHEDULE = [
    { time: '2026/1/18 17:08', event: lang === 'zh' ? '报名开始' : 'Registration Starts' },
    { time: '2026/1/31 17:08', event: lang === 'zh' ? '报名截止' : 'Registration Ends' },
    { time: '2026/1/31 17:08', event: lang === 'zh' ? '比赛开始' : 'Hackathon Starts' },
    { time: '2026/2/2 17:08', event: lang === 'zh' ? '提交截止' : 'Submission Ends' },
    { time: '2026/2/2 17:08', event: lang === 'zh' ? '评审开始' : 'Judging Starts' },
    { time: '2026/2/4 17:08', event: lang === 'zh' ? '评审结束' : 'Results Announced' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4A373] selection:text-black pb-20">
      
      {/* 1. Hero Section */}
      <div className="relative h-[500px] w-full bg-[#050505] overflow-hidden group">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0">
            {hackathon.cover_image ? (
                 <img src={hackathon.cover_image} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt="Cover" />
            ) : (
                 // Fallback abstract gradient if no image
                 <div className="w-full h-full bg-gradient-to-r from-blue-900 via-black to-purple-900 opacity-50"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 w-full h-full flex flex-col justify-end pb-16 px-6 sm:px-12 max-w-[1440px] mx-auto">
            {/* Tags */}
            <div className="flex gap-3 mb-6">
                <span className="bg-[#333] text-white text-xs px-3 py-1 rounded-sm font-mono">
                    {hackathon.status === 'published' ? (lang === 'zh' ? '报名中' : 'OPEN') : 'DRAFT'}
                </span>
                {['#可持续发展', '#物联网', '#大数据'].map((tag, i) => (
                    <span key={i} className="border border-white/20 text-gray-300 text-xs px-3 py-1 rounded-sm backdrop-blur-sm">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                {hackathon.title}
            </h1>

            {/* Description & Actions Row */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                <p className="text-gray-300 max-w-2xl text-base leading-relaxed opacity-90">
                    {hackathon.description.substring(0, 120)}...
                </p>

                <div className="flex gap-4">
                    {isOrganizer && (
                         <button className="flex items-center gap-2 text-white hover:text-[#D4A373] transition-colors px-4 py-3">
                            <span>✏️</span>
                            <span className="text-sm font-bold">{lang === 'zh' ? '编辑活动' : 'Edit'}</span>
                        </button>
                    )}
                   
                    <button className="flex items-center gap-2 border border-[#D4A373] text-[#D4A373] px-6 py-3 rounded hover:bg-[#D4A373] hover:text-black transition-all">
                        <span>⚡</span>
                        <span className="text-sm font-bold">{lang === 'zh' ? '智能组队' : 'AI Match'}</span>
                    </button>

                    {!enrollment ? (
                        <button 
                            onClick={handleRegister}
                            className="bg-[#D4A373] text-black px-8 py-3 rounded font-bold hover:bg-[#C49363] transition-colors shadow-[0_0_20px_rgba(212,163,115,0.3)]"
                        >
                            {lang === 'zh' ? '立即报名' : 'REGISTER NOW'}
                        </button>
                    ) : (
                        <button className="bg-gray-700 text-gray-400 px-8 py-3 rounded font-bold cursor-not-allowed">
                            {lang === 'zh' ? '已报名' : 'REGISTERED'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* 2. Tabs Navigation */}
      <div className="sticky top-0 z-50 bg-black border-b border-white/10 w-full">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex gap-1">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-8 py-5 text-sm font-bold transition-colors relative ${
                        activeTab === tab.id 
                        ? 'bg-[#D4A373] text-black' 
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4A373]"></div>
                    )}
                </button>
            ))}
          </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12">
          
          {/* TAB: Details */}
          {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  {/* Left Column (Content) */}
                  <div className="lg:col-span-8 space-y-16">
                      
                      {/* Intro */}
                      <section>
                          <h2 className="text-xl font-bold text-[#D4A373] mb-6 flex items-center gap-2">
                              <span>//</span> {lang === 'zh' ? '活动介绍' : 'Introduction'}
                          </h2>
                          <div className="space-y-6">
                              <h3 className="text-lg font-bold text-white">{lang === 'zh' ? '背景与愿景' : 'Background & Vision'}</h3>
                              <p className="text-gray-400 leading-relaxed">
                                  {hackathon.description}
                              </p>
                          </div>
                      </section>

                      {/* Challenge Areas */}
                      <section>
                          <h3 className="text-lg font-bold text-white mb-6">{lang === 'zh' ? '挑战方向' : 'Challenge Areas'}</h3>
                          <p className="text-gray-400 mb-6">{lang === 'zh' ? '本次黑客松聚焦三大核心领域：' : 'Focusing on three core areas:'}</p>
                          <div className="space-y-4">
                              {CHALLENGE_AREAS.map((area, i) => (
                                  <div key={i} className="pl-4 border-l-2 border-white/10 hover:border-[#D4A373] transition-colors">
                                      <h4 className="text-white font-bold mb-1">{area.title}</h4>
                                      <p className="text-sm text-gray-500">{area.desc}</p>
                                  </div>
                              ))}
                          </div>
                      </section>

                      {/* Rules */}
                      <section>
                           <h2 className="text-xl font-bold text-[#D4A373] mb-6 flex items-center gap-2">
                              <span>//</span> {lang === 'zh' ? '详细规则' : 'Rules'}
                          </h2>
                          <div className="space-y-6 text-gray-400 text-sm leading-relaxed">
                              <div>
                                  <h4 className="text-white font-bold mb-2">{lang === 'zh' ? '团队构成' : 'Team Composition'}</h4>
                                  <p>{lang === 'zh' ? '参赛者需以团队形式报名，每队人数限制为 1-5 人。鼓励跨学科组队（如开发者+设计师+环境科学家）。每人仅限加入一个团队。' : 'Teams of 1-5 people. Cross-disciplinary teams encouraged.'}</p>
                              </div>
                              <div>
                                  <h4 className="text-white font-bold mb-2">{lang === 'zh' ? '原创性要求' : 'Originality'}</h4>
                                  <p>{lang === 'zh' ? '所有参赛作品必须为本次活动期间编写的原创代码。允许使用开源库和API，但核心逻辑需由团队独立完成。严禁抄袭或直接提交已有项目。' : 'Must be original code written during the event. Open source allowed.'}</p>
                              </div>
                          </div>
                      </section>

                       {/* Judging Criteria */}
                       <section>
                           <h2 className="text-xl font-bold text-[#D4A373] mb-6 flex items-center gap-2">
                              <span>//</span> {lang === 'zh' ? '评审标准' : 'Judging Criteria'}
                          </h2>
                          <div className="space-y-6 text-gray-400 text-sm">
                              <div>
                                  <h4 className="text-white font-bold mb-1">{lang === 'zh' ? '技术实现 - 60%' : 'Technical - 60%'}</h4>
                                  <p>{lang === 'zh' ? '包含代码质量、有效性、与 Amazon Nova 的成功集成以及整体系统架构。' : 'Code quality, implementation, and architecture.'}</p>
                              </div>
                               <div>
                                  <h4 className="text-white font-bold mb-1">{lang === 'zh' ? '企业或社区影响力 - 20%' : 'Impact - 20%'}</h4>
                                  <p>{lang === 'zh' ? '评估解决方案如何传达商业价值或为社区创造有意义的效益。' : 'Business value and community impact.'}</p>
                              </div>
                               <div>
                                  <h4 className="text-white font-bold mb-1">{lang === 'zh' ? '创意与创新 - 20%' : 'Creativity - 20%'}</h4>
                                  <p>{lang === 'zh' ? '包括方法的新颖性以及利用多智能体系统解决现实问题的创新性。' : 'Novelty and innovative approach.'}</p>
                              </div>
                          </div>
                      </section>

                      {/* Awards */}
                      <section>
                           <h2 className="text-xl font-bold text-[#D4A373] mb-6 flex items-center gap-2">
                              <span>//</span> {lang === 'zh' ? '奖项设置' : 'Awards'}
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {[1, 2, 3, 4].map((i) => (
                                  <div key={i} className="bg-[#111] border border-white/5 rounded-lg p-6 hover:border-[#D4A373]/30 transition-colors">
                                      <div className="flex justify-between items-start mb-4">
                                          <div className="flex items-center gap-2 text-[#FFD700]">
                                              <span className="text-2xl">🏆</span>
                                              <h4 className="text-lg font-bold text-white">{lang === 'zh' ? '金奖' : 'Gold Award'}</h4>
                                          </div>
                                          <span className="bg-white/10 text-xs px-2 py-1 rounded text-gray-400">x 1</span>
                                      </div>
                                      <p className="text-sm text-gray-500 mb-4">{lang === 'zh' ? '综合评分排名第一的团队。' : 'Ranked #1 team.'}</p>
                                      <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside marker:text-[#D4A373]">
                                          <li>{lang === 'zh' ? '奖金 $10,000 US' : '$10,000 USD'}</li>
                                          <li>{lang === 'zh' ? '投资人对接机会' : 'Investor Intro'}</li>
                                          <li>{lang === 'zh' ? '云服务资源包 (价值 $5,000)' : 'Cloud Credits ($5k)'}</li>
                                      </ul>
                                  </div>
                              ))}
                          </div>
                      </section>

                  </div>

                  {/* Right Column (Sidebar) */}
                  <div className="lg:col-span-4 space-y-12">
                      
                      {/* Location */}
                      <div>
                           <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                              <span className="text-[#D4A373]">📍</span> {lang === 'zh' ? '活动地点' : 'Location'}
                          </h4>
                          <p className="text-sm text-gray-400 leading-relaxed">
                              {hackathon.location || (lang === 'zh' ? '上海市浦东新区上钢新村街道博成路1099号上海世博展览馆' : 'Shanghai World Expo Exhibition & Convention Center')}
                          </p>
                      </div>

                      {/* Schedule */}
                      <div>
                           <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                              <span className="text-[#D4A373]">📅</span> {lang === 'zh' ? '日程安排' : 'Schedule'}
                          </h4>
                          <div className="relative pl-2 border-l border-white/10 space-y-8">
                              {SCHEDULE.map((item, i) => (
                                  <div key={i} className="relative pl-6">
                                      <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${i < 2 ? 'bg-[#D4A373] border-[#D4A373]' : 'bg-black border-gray-600'}`}></div>
                                      <div className="text-xs text-gray-500 mb-1 font-mono">{item.time}</div>
                                      <div className={`text-sm ${i < 2 ? 'text-white font-bold' : 'text-gray-400'}`}>{item.event}</div>
                                  </div>
                              ))}
                          </div>
                      </div>

                       {/* Organizers */}
                       <div>
                           <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                              <span className="text-[#D4A373]">🏢</span> {lang === 'zh' ? '主办方' : 'Organizers'}
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                              {[1, 2, 3, 4].map((i) => (
                                  <div key={i} className="aspect-[3/1] bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-gray-600 font-bold text-xs hover:text-white hover:border-white/20 transition-all cursor-pointer">
                                      LOGO {String.fromCharCode(64 + i)}
                                  </div>
                              ))}
                          </div>
                      </div>

                  </div>
              </div>
          )}

          {/* TAB: My Project */}
          {activeTab === 'my_project' && (
              <div className="animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden group hover:border-[#D4A373]/50 transition-all cursor-pointer">
                            {/* Chart Image Placeholder */}
                            <div className="h-48 bg-black relative p-6 border-b border-white/5">
                                <div className="absolute top-4 left-4 text-[10px] text-gray-500 font-mono">ART 7 DAYS USING MEDIAN</div>
                                <div className="absolute inset-0 flex items-end justify-between gap-1 px-6 pb-6 opacity-80 pt-16">
                                    {[40, 60, 30, 80, 50, 90, 40, 60, 70, 40, 60, 80, 50, 70].map((h, idx) => (
                                        <div key={idx} style={{height: `${h}%`}} className="w-full bg-cyan-500/40 rounded-t-sm group-hover:bg-cyan-400/60 transition-colors shadow-[0_0_10px_rgba(34,211,238,0.2)]"></div>
                                    ))}
                                </div>
                                {/* Mock UI Elements */}
                                <div className="absolute top-4 right-4 flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="text-sm font-bold text-white mb-2">{lang === 'zh' ? '绿色数据仪表盘' : 'Green Data Dashboard'}</h4>
                                <p className="text-[10px] text-gray-500 mb-4 line-clamp-2 leading-relaxed">{lang === 'zh' ? '实时监控可持续发展指标与碳足迹可视化，助力企业节能减排。' : 'Real-time monitoring of sustainability metrics and carbon footprint.'}</p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 border-t border-white/5 pt-3">
                                    <span className="opacity-50">👤</span>
                                    <span>EcoTech 小队</span>
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
          )}

          {/* TAB: Participants */}
          {activeTab === 'participants' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                  {/* Left: Filter Sidebar */}
                  <div className="lg:col-span-3 space-y-8">
                      {/* Filter: Identity */}
                      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5">
                          <h4 className="text-sm font-bold text-white mb-4 flex justify-between items-center">
                              {lang === 'zh' ? '筛选条件' : 'Filters'}
                              <span className="text-xs text-gray-500 cursor-pointer hover:text-white">{lang === 'zh' ? '重置' : 'Reset'}</span>
                          </h4>
                          
                          <div className="space-y-6">
                              {/* Identity Type */}
                              <div>
                                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3 block">{lang === 'zh' ? '身份类型' : 'Identity Type'}</label>
                                  <div className="space-y-2">
                                      <label className="flex items-center gap-3 cursor-pointer group">
                                          <div className="w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center bg-[#D4A373] border-[#D4A373] text-black">
                                              <span className="text-xs font-bold">✓</span>
                                          </div>
                                          <span className="text-sm text-gray-300">个人 (Individual)</span>
                                          <span className="text-xs text-gray-600 ml-auto">128</span>
                                      </label>
                                      <label className="flex items-center gap-3 cursor-pointer group">
                                          <div className="w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center hover:border-white/50"></div>
                                          <span className="text-sm text-gray-400">团队 (Team)</span>
                                          <span className="text-xs text-gray-600 ml-auto">45</span>
                                      </label>
                                  </div>
                              </div>

                              {/* Roles */}
                              <div>
                                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3 block">{lang === 'zh' ? '角色 / 技能' : 'Role / Skill'}</label>
                                  <div className="space-y-2">
                                      {['开发 (Developer)', '设计 (Designer)', '产品 (PM)', '数据科学 (Data)', '领域专家 (Expert)'].map((role, i) => (
                                          <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                              <div className="w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center hover:border-white/50"></div>
                                              <span className="text-sm text-gray-400">{role.split(' ')[0]} <span className="text-gray-600 text-xs">{role.split(' ')[1]}</span></span>
                                              <span className="text-xs text-gray-600 ml-auto">{Math.floor(Math.random() * 50) + 5}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>

                              {/* Status */}
                              <div>
                                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3 block">{lang === 'zh' ? '状态' : 'Status'}</label>
                                  <div className="space-y-2">
                                      <label className="flex items-center gap-3 cursor-pointer group">
                                          <div className="w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center bg-[#D4A373] border-[#D4A373] text-black">
                                              <span className="text-xs font-bold">✓</span>
                                          </div>
                                          <span className="text-sm text-gray-300">求组队 (Open)</span>
                                          <span className="text-xs text-gray-600 ml-auto">96</span>
                                      </label>
                                      <label className="flex items-center gap-3 cursor-pointer group">
                                          <div className="w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center hover:border-white/50"></div>
                                          <span className="text-sm text-gray-400">招募中 (Recruiting)</span>
                                          <span className="text-xs text-gray-600 ml-auto">32</span>
                                      </label>
                                      <label className="flex items-center gap-3 cursor-pointer group">
                                          <div className="w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center hover:border-white/50"></div>
                                          <span className="text-sm text-gray-400">已满员 (Full)</span>
                                          <span className="text-xs text-gray-600 ml-auto">12</span>
                                      </label>
                                  </div>
                              </div>

                              {/* Location Search */}
                              <div>
                                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3 block">{lang === 'zh' ? '地点' : 'Location'}</label>
                                  <div className="relative">
                                      <input 
                                          type="text" 
                                          placeholder={lang === 'zh' ? "输入城市..." : "Enter city..."}
                                          className="w-full bg-[#1A1A1A] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-[#D4A373] outline-none"
                                      />
                                      <span className="absolute right-3 top-2.5 text-gray-500 text-xs">🔍</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Right: Participants List */}
                  <div className="lg:col-span-9 space-y-6">
                      
                      {/* My Card */}
                      <div className="mb-8">
                          <div className="flex items-center gap-2 mb-2 text-[#D4A373] font-bold text-sm">
                              <span>👤</span>
                              {lang === 'zh' ? '我的名片' : 'My Profile Card'}
                          </div>
                          <div className="bg-[#0A0A0A] border border-[#D4A373] rounded-xl p-6 relative overflow-hidden group shadow-[0_0_20px_rgba(212,163,115,0.1)]">
                              <div className="absolute top-0 right-0 p-6">
                                  <button className="bg-white text-black px-4 py-1.5 rounded text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
                                      <span>💬</span> {lang === 'zh' ? '联系' : 'Contact'}
                                  </button>
                              </div>
                              <div className="flex gap-6 items-start">
                                  <div className="w-20 h-20 rounded-full border-2 border-[#D4A373] p-1">
                                      <div className="w-full h-full rounded-full bg-gray-800 bg-[url('https://api.dicebear.com/7.x/avataaars/svg?seed=Alex')] bg-cover"></div>
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-3 mb-1">
                                          <h3 className="text-xl font-bold text-white">Alex Chen</h3>
                                          <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded border border-green-500/30">● 求组队</span>
                                          <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded border border-blue-500/30">个人</span>
                                      </div>
                                      <p className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                                          <span className="text-[#D4A373]">&lt;/&gt;</span> 全栈开发者
                                          <span className="text-gray-600">|</span>
                                          <span>📍 上海</span>
                                      </p>
                                      <p className="text-gray-300 text-sm bg-[#1A1A1A] p-3 rounded-lg border border-white/5 mb-4 max-w-2xl">
                                          拥有5年开发经验，专注于物联网应用。希望能加入一个关注可持续能源管理的团队。擅长快速构建原型。
                                      </p>
                                      <div className="flex gap-2">
                                          <span className="text-xs font-mono text-gray-500 mt-1">技能 (SKILLS)</span>
                                          {['React', 'Node.js', 'IoT', 'TypeScript'].map((skill, i) => (
                                              <span key={i} className="bg-[#1A1A1A] border border-white/10 text-gray-300 text-xs px-2 py-1 rounded">
                                                  {skill}
                                              </span>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Search Bar & Actions */}
                      <div className="flex justify-between items-center bg-[#0A0A0A] p-4 rounded-xl border border-white/10">
                          <h3 className="font-bold text-white">{lang === 'zh' ? '寻找队友 & 组建团队' : 'Find Teammates & Build Team'}</h3>
                          <div className="flex gap-3">
                              <div className="relative">
                                  <input 
                                      type="text" 
                                      placeholder={lang === 'zh' ? "搜索名字、技能或团队..." : "Search name, skill..."}
                                      className="bg-[#1A1A1A] border border-white/10 text-white px-4 py-2 rounded text-sm w-64 focus:border-[#D4A373] outline-none"
                                  />
                                  <span className="absolute right-3 top-2.5 text-gray-500 text-xs">🔍</span>
                              </div>
                              <button className="bg-[#D4A373] text-black px-4 py-2 rounded text-sm font-bold hover:bg-[#C49363]">
                                  {lang === 'zh' ? '发布需求' : 'Post Request'}
                              </button>
                          </div>
                      </div>

                      {/* Team / User List */}
                      <div className="space-y-4">
                          {[
                              { name: 'EcoWarriors', type: '团队', status: '招募中', tags: ['智能回收项目', '线上'], desc: '我们想打造一个基于计算机视觉的智能垃圾分类助手，目前已有后端和硬件工程师，急需设计师和算法专家加入！', lookingFor: ['UI设计师', 'AI工程师'], members: 3, avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Eco' },
                              { name: 'Sarah Li', type: '个人', status: '求组队', tags: ['UI/UX 设计师', '北京'], desc: '热衷于环保的设计师。希望能为具有社会影响力的项目贡献设计力量。曾获红点设计奖。', lookingFor: [], skills: ['Figma', 'Design System', 'User Research'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
                              { name: 'DataMinds', type: '团队', status: '招募中', tags: ['碳排放数据平台', '深圳'], desc: '专注于企业碳排放追踪的SaaS平台。寻找擅长 D3.js 或 ECharts 的前端开发者，帮助我们将数据可视化。', lookingFor: ['前端开发', '数据可视化'], members: 4, avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Data' },
                              { name: 'David Zhang', type: '个人', status: '求组队', tags: ['数据科学家', '新加坡'], desc: '拥有环境科学背景的数据科学家。擅长处理气象数据和构建预测模型。寻找志同道合的团队。', lookingFor: [], skills: ['Python', 'Machine Learning', 'Big Data'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
                              { name: 'GreenEnergy', type: '团队', status: '已满员', tags: ['家庭能源优化', '杭州'], desc: '利用智能插座和算法优化家庭用电。目前团队已组建完毕，准备冲刺金奖！', lookingFor: [], members: 5, avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Green' },
                          ].map((item, i) => (
                              <div key={i} className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-colors group">
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-4">
                                          <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-white/5 overflow-hidden">
                                              <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                                          </div>
                                          <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                  <h4 className="text-lg font-bold text-white">{item.name}</h4>
                                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.status === '招募中' || item.status === '求组队' ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-gray-500 border-gray-500/30 bg-gray-500/10'}`}>● {item.status}</span>
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#D4A373]/30 text-[#D4A373] bg-[#D4A373]/10">{item.type}</span>
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                                  {item.tags.map((tag, idx) => (
                                                      <span key={idx} className="flex items-center gap-1">
                                                          {idx > 0 && <span>•</span>}
                                                          {tag}
                                                      </span>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>
                                      <button className="border border-white/10 bg-[#1A1A1A] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-white hover:text-black transition-colors flex items-center gap-2">
                                          <span>💬</span> {lang === 'zh' ? '联系' : 'Contact'}
                                      </button>
                                  </div>

                                  <div className="pl-20">
                                      <p className="text-gray-400 text-sm mb-4 bg-[#111] p-3 rounded border border-white/5 leading-relaxed">
                                          {item.desc}
                                      </p>

                                      {item.type === '团队' ? (
                                          <div className="flex items-center gap-4">
                                              {item.lookingFor.length > 0 && (
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-xs text-gray-500 font-mono">寻找队友 (LOOKING FOR)</span>
                                                      {item.lookingFor.map((role, idx) => (
                                                          <span key={idx} className="text-xs bg-[#D4A373] text-black px-2 py-0.5 rounded font-bold">{role}</span>
                                                      ))}
                                                  </div>
                                              )}
                                              <div className="flex items-center gap-2 ml-auto">
                                                  <span className="text-xs text-gray-500">共 {item.members} 人</span>
                                                  <button className="text-xs text-gray-400 border border-white/10 px-2 py-0.5 rounded hover:text-white hover:border-white">+ 申请加入</button>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-500 font-mono">技能 (SKILLS)</span>
                                              {item.skills?.map((skill, idx) => (
                                                  <span key={idx} className="text-xs bg-[#1A1A1A] border border-white/10 text-gray-400 px-2 py-0.5 rounded">{skill}</span>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <div className="text-center pt-4">
                           <button className="text-gray-500 hover:text-white text-sm transition-colors">
                               {lang === 'zh' ? '加载更多...' : 'Load More...'}
                           </button>
                      </div>

                  </div>
              </div>
          )}

           {/* TAB: Showcase (Placeholder) */}
           {activeTab === 'showcase' && (
              <div className="text-center py-20 border border-white/10 rounded-lg">
                  <p className="text-gray-500">{lang === 'zh' ? '作品展示即将开放' : 'Project showcase coming soon.'}</p>
              </div>
          )}

          {/* TAB: Results (Placeholder) */}
          {activeTab === 'results' && (
              <div className="text-center py-20 border border-white/10 rounded-lg">
                  <p className="text-gray-500">{lang === 'zh' ? '评审结果将在比赛结束后公布' : 'Results will be announced after the event.'}</p>
              </div>
          )}
          
      </div>

      {/* Modals */}
      <SubmitProjectModal 
        isOpen={isSubmitProjectOpen} 
        onClose={() => setIsSubmitProjectOpen(false)} 
        hackathonId={hackathon.id}
        lang={lang}
      />
      <JudgingModal 
        isOpen={isJudgingOpen} 
        onClose={() => setIsJudgingOpen(false)} 
        hackathonId={hackathon.id}
        hackathonTitle={hackathon.title}
        lang={lang}
      />
      <AIResumeModal
        isOpen={isAIResumeOpen}
        onClose={() => setIsAIResumeOpen(false)}
        lang={lang}
      />
    </div>
  );
}
