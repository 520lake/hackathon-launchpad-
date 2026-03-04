import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

// Modals
import SubmitProjectModal from '../components/SubmitProjectModal'
import JudgingModal from '../components/JudgingModal'
import ResultPublishModal from '../components/ResultPublishModal'
import AIResumeModal from '../components/AIResumeModal'

// Interfaces
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
  contact_info?: string;
  requirements?: string;
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
  resource_detail?: string;
  results_detail?: string;
  sponsors_detail?: string;
  status: string;
  organizer_id: number;
}

interface TeamMember {
  id: number;
  user_id: number;
  user?: any;
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

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
  fetchCurrentUser: () => void;
}

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const diff = target - now

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { value: timeLeft.days, label: '天' },
        { value: timeLeft.hours, label: '时' },
        { value: timeLeft.minutes, label: '分' },
        { value: timeLeft.seconds, label: '秒' },
      ].map((item, i) => (
        <div key={i}>
          <div className="text-2xl font-bold text-brand font-mono">{String(item.value).padStart(2, '0')}</div>
          <div className="text-[10px] text-gray-500">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, currentUser, fetchCurrentUser } = useOutletContext<OutletContextType>()
  
  const hackathonId = id ? parseInt(id) : null
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [myProject, setMyProject] = useState<Project | null>(null)
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [galleryProjects, setGalleryProjects] = useState<Project[]>([])
  
  // Filter states
  const [identityFilter, setIdentityFilter] = useState<'all' | 'individual' | 'team'>('all')
  const [locationSearch, setLocationSearch] = useState('')
  
  // Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [isJudgingOpen, setIsJudgingOpen] = useState(false)
  const [isResultPublishOpen, setIsResultPublishOpen] = useState(false)
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hackathonId) {
      fetchHackathon()
      fetchTeams()
      fetchGallery()
      if (isLoggedIn) {
        fetchEnrollment()
      }
    }
  }, [hackathonId, isLoggedIn])

  useEffect(() => {
    if (activeTab === 'participants') {
      fetchTeams()
    } else if (activeTab === 'myproject') {
      fetchGallery()
    }
  }, [activeTab])

  const fetchHackathon = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/v1/hackathons/${hackathonId}`)
      setHackathon(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    // 独立请求，避免一个失败导致另一个也无数据
    try {
      const res = await axios.get(`/api/v1/teams?hackathon_id=${hackathonId}`)
      setTeams(res.data)
    } catch (e) {
      console.error('获取团队失败:', e)
    }
    try {
      const resPart = await axios.get(`/api/v1/enrollments/public/${hackathonId}`)
      setParticipants(resPart.data)
    } catch (e) {
      console.error('获取参赛者失败:', e)
    }
  }

  const fetchGallery = async () => {
    try {
      const res = await axios.get(`/api/v1/projects?hackathon_id=${hackathonId}`)
      setGalleryProjects(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchEnrollment = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/v1/enrollments/my/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEnrollment(res.data)
      
      // Fetch my team
      const teamRes = await axios.get(`/api/v1/teams/my?hackathon_id=${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMyTeam(teamRes.data)
      
      // Fetch my project
      const projRes = await axios.get(`/api/v1/projects/my?hackathon_id=${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMyProject(projRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleRegister = async () => {
    if (!isLoggedIn) {
      return
    }
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/api/v1/enrollments`,
        { hackathon_id: hackathonId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchEnrollment()
    } catch (e: any) {
      if (e.response?.data?.detail) {
        alert(e.response.data.detail)
      }
    }
  }

  const handleJoinTeam = async (teamId: number) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/api/v1/teams/${teamId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchTeams()
      fetchEnrollment()
    } catch (e: any) {
      alert(e.response?.data?.detail || '加入失败')
    }
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'draft': '草稿',
      'registration': '报名中',
      'ongoing': '进行中',
      'judging': '评审中',
      'completed': '已结束'
    }
    return map[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500">活动不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black" ref={containerRef}>
      {/* Hero Banner - Full bleed at top */}
      <div className="relative h-[45vh] min-h-[360px] overflow-hidden -mt-16">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2a] via-[#0d1020] to-black">
          {hackathon.cover_image && (
            <img 
              src={hackathon.cover_image} 
              alt={hackathon.title}
              className="w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 max-w-7xl mx-auto w-full">
          {/* Breadcrumb - 优化返回导航 */}
          <div className="flex items-center gap-2 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors duration-200 text-[12px] tracking-wide"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              首页
            </button>
            <span className="text-gray-600">/</span>
            <button 
              onClick={() => navigate('/events')}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors duration-200 text-[12px] tracking-wide"
            >
              活动大厅
            </button>
            <span className="text-gray-600">/</span>
            <span className="text-[#FBBF24] text-[12px] tracking-wide">{hackathon.title}</span>
          </div>

          {/* Tags - 活动分类标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {hackathon.theme_tags?.split(',').map((tag, i) => (
              <span key={i} className="px-3 py-1 text-[11px] border border-[#FBBF24]/40 text-[#FBBF24] bg-[#FBBF24]/5 rounded-md">
                #{tag.trim()}
              </span>
            ))}
            {hackathon.professionalism_tags?.split(',').map((tag, i) => (
              <span key={`p-${i}`} className="px-3 py-1 text-[11px] border border-[#333] text-gray-300 rounded-md">
                #{tag.trim()}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            {hackathon.title}
          </h1>
          {hackathon.subtitle && (
            <p className="text-lg text-gray-300 font-light mb-4">{hackathon.subtitle}</p>
          )}

          {/* Info Bar */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-[#FBBF24]">◆</span>
              <span>{new Date(hackathon.start_date).toLocaleDateString('zh-CN')} - {new Date(hackathon.end_date).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#FBBF24]">◆</span>
              <span>{hackathon.format === 'online' ? '线上' : hackathon.location || '线下'}</span>
            </div>
            {/* 增强的活动状态徽标 */}
            <div className={`px-4 py-1.5 text-[12px] font-medium flex items-center gap-2 rounded-md ${
              hackathon.status === 'registration' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' :
              hackathon.status === 'ongoing' ? 'bg-sky-500/20 border border-sky-500/40 text-sky-400' :
              hackathon.status === 'judging' ? 'bg-violet-500/20 border border-violet-500/40 text-violet-400' :
              hackathon.status === 'completed' ? 'bg-gray-500/20 border border-gray-500/40 text-gray-400' :
              'bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24]'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                hackathon.status === 'registration' ? 'bg-emerald-400' :
                hackathon.status === 'ongoing' ? 'bg-sky-400' :
                hackathon.status === 'judging' ? 'bg-violet-400' :
                hackathon.status === 'completed' ? 'bg-gray-400' :
                'bg-brand'
              }`} />
              {getStatusText(hackathon.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 左三右一布局 */}
      <div className="max-w-7xl mx-auto w-full px-8 py-8">
        <div className="flex gap-8">
          {/* 左侧主内容区 75% */}
          <div className="flex-1 min-w-0" style={{ flexBasis: '75%' }}>
            {/* Navigation Tabs - 1px底线指示器 */}
            <div className="border-b border-[#222222] mb-8">
              <div className="flex">
                {[
                  { id: 'overview', label: '活动详情' },
                  { id: 'myproject', label: '我的作品' },
                  { id: 'participants', label: '参赛人员' },
                  { id: 'results', label: '评审结果' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors duration-200 ease-in-out relative ${
                      activeTab === tab.id 
                        ? 'text-white' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#FBBF24]" />
                    )}
                  </button>
                ))}
                {hackathon.organizer_id === currentUser?.id && (
                  <button
                    onClick={() => navigate(`/create?edit=${hackathon.id}`)}
                    className="ml-auto px-4 py-4 text-[12px] text-gray-500 hover:text-white transition-colors duration-200 ease-in-out"
                  >
                    编辑活动
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* OVERVIEW TAB - 活动详情 */}
              {activeTab === 'overview' && (
                <div className="space-y-12">
                  {/* 活动简介 */}
                  <section id="intro">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-6 h-[2px] bg-brand"></span>
                      活动简介
                    </h3>
                    <div className="prose prose-invert max-w-none text-gray-300 border-l border-white/[0.08] pl-6">
                      <ReactMarkdown>{hackathon.description}</ReactMarkdown>
                    </div>
                  </section>

                  {/* 日程安排 */}
                  <section id="schedule">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-6 h-[2px] bg-brand"></span>
                      活动日程
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">报名开始</div>
                        <div className="text-brand font-mono text-sm">
                          {hackathon.registration_start_date ? new Date(hackathon.registration_start_date).toLocaleDateString('zh-CN') : '待定'}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">报名截止</div>
                        <div className="text-gray-300 font-mono text-sm">
                          {hackathon.registration_end_date ? new Date(hackathon.registration_end_date).toLocaleDateString('zh-CN') : '待定'}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">提交截止</div>
                        <div className="text-gray-300 font-mono text-sm">
                          {hackathon.submission_end_date ? new Date(hackathon.submission_end_date).toLocaleDateString('zh-CN') : '待定'}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">结果公布</div>
                        <div className="text-gray-300 font-mono text-sm">
                          {hackathon.judging_end_date ? new Date(hackathon.judging_end_date).toLocaleDateString('zh-CN') : '待定'}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 参赛要求 */}
                  {hackathon.requirements && (
                    <section id="requirements">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-6 h-[2px] bg-brand"></span>
                        参赛要求
                      </h3>
                      <div className="prose prose-invert max-w-none text-gray-300 bg-white/[0.02] border border-white/[0.08] p-6">
                        <ReactMarkdown>{hackathon.requirements}</ReactMarkdown>
                      </div>
                    </section>
                  )}

                  {/* 评审规则 */}
                  {hackathon.rules_detail && (
                    <section id="rules">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-6 h-[2px] bg-brand"></span>
                        评审规则
                      </h3>
                      <div className="prose prose-invert max-w-none text-gray-300 border-l border-white/[0.08] pl-6">
                        <ReactMarkdown>{hackathon.rules_detail}</ReactMarkdown>
                      </div>
                    </section>
                  )}

                  {/* 奖项设置 */}
                  {hackathon.awards_detail && (
                    <section id="awards">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-6 h-[2px] bg-brand"></span>
                        奖项设置
                      </h3>
                      <div className="prose prose-invert max-w-none text-gray-300 border-l border-white/[0.08] pl-6">
                        <ReactMarkdown>{hackathon.awards_detail}</ReactMarkdown>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* MY PROJECT TAB - 我的作品/作品展示 */}
              {activeTab === 'myproject' && (
                <div className="space-y-8">
                  {/* 我的作品区域 - 仅登录用户可见 */}
                  {isLoggedIn && (
                    <div className="border-b border-white/[0.08] pb-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                        <span className="w-5 h-[2px] bg-brand"></span>
                        我的作品
                      </h3>
                      {!enrollment ? (
                        <div className="border border-white/[0.08] p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-sm">您还未报名此活动</p>
                              <p className="text-[12px] text-gray-600 mt-1">报名后可提交作品参与评审</p>
                            </div>
                            <button 
                              onClick={handleRegister}
                              className="px-5 py-2 bg-brand text-black text-sm font-medium hover:bg-white transition-colors"
                            >
                              立即报名
                            </button>
                          </div>
                        </div>
                      ) : !myProject ? (
                        <div className="border border-white/[0.08] p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-sm">您还未提交作品</p>
                              <p className="text-[12px] text-gray-600 mt-1">点击右侧按钮提交您的参赛作品</p>
                            </div>
                            <button 
                              onClick={() => setIsSubmitOpen(true)}
                              className="px-5 py-2 bg-brand text-black text-sm font-medium hover:bg-white transition-colors"
                            >
                              提交作品
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-white/[0.08]">
                          <div className="flex">
                            <div className="w-[3px] bg-brand" />
                            <div className="flex-1 p-6">
                              <div className="flex items-start gap-6">
                                <div className="w-32 h-24 bg-white/[0.02] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                  {myProject.cover_image ? (
                                    <img src={myProject.cover_image} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl font-bold text-white/20">{myProject.title[0]}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-white mb-2">{myProject.title}</h4>
                                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{myProject.description}</p>
                                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                                    {myProject.tech_stack && <span>技术栈: {myProject.tech_stack}</span>}
                                    {myProject.total_score && <span className="text-brand">得分: {myProject.total_score.toFixed(1)}</span>}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setIsSubmitOpen(true)}
                                  className="px-4 py-2 border border-white/[0.15] text-[12px] text-white hover:bg-white hover:text-black transition-colors"
                                >
                                  编辑
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 所有作品展示 - 对所有人可见 */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                      <span className="w-5 h-[2px] bg-brand"></span>
                      所有作品 <span className="text-[12px] text-gray-600 font-normal ml-2">{galleryProjects.length} 个</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {galleryProjects.map(proj => (
                        <div key={proj.id} className="group border border-white/[0.08] bg-black hover:border-brand/30 transition-all flex">
                          <div className="w-[3px] bg-gray-700 group-hover:bg-brand transition-colors" />
                          <div className="flex-1 p-4 flex gap-4">
                            <div className="w-20 h-16 bg-white/[0.02] flex-shrink-0">
                              {proj.cover_image ? (
                                <img src={proj.cover_image} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">{proj.title[0]}</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-white text-sm mb-1 truncate group-hover:text-brand transition-colors">{proj.title}</h5>
                              <p className="text-[12px] text-gray-500 line-clamp-1">{proj.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                                <span>{proj.team?.name}</span>
                                {proj.total_score && <span className="text-brand">{proj.total_score.toFixed(1)}分</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {galleryProjects.length === 0 && (
                        <div className="col-span-2 text-center py-16 border border-white/[0.05]">
                          <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase">暂无作品</div>
                          <p className="text-[12px] text-gray-500 mt-2">活动作品将在这里展示</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PARTICIPANTS TAB - 参赛人员与组队 (List Row 布局) */}
              {activeTab === 'participants' && (
                <div className="space-y-8">
                  {/* 筛选条 */}
                  <div className="flex items-center gap-4 pb-6 border-b border-[#222222]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 uppercase tracking-wider">身份:</span>
                      <div className="flex gap-1">
                        {[{key: 'all', label: '全部'}, {key: 'individual', label: '个人'}, {key: 'team', label: '团队'}].map(item => (
                          <button 
                            key={item.key}
                            onClick={() => setIdentityFilter(item.key as any)}
                            className={`px-3 py-1.5 text-[11px] rounded-md transition-colors duration-200 ease-in-out ${
                              identityFilter === item.key 
                                ? 'bg-[#FBBF24] text-black font-medium' 
                                : 'border border-[#222222] text-gray-500 hover:text-white hover:border-gray-600'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="text"
                        value={locationSearch}
                        onChange={e => setLocationSearch(e.target.value)}
                        placeholder="搜索地点..."
                        className="bg-transparent border border-[#222222] rounded-md px-3 py-1.5 text-[12px] text-white placeholder-gray-600 focus:border-[#FBBF24]/50 outline-none w-40 transition-colors duration-200"
                      />
                      <button 
                        onClick={() => {
                          setIdentityFilter('all')
                          setLocationSearch('')
                        }}
                        className="text-[11px] text-gray-500 hover:text-[#FBBF24] transition-colors duration-200"
                      >
                        重置
                      </button>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">总参赛者</div>
                      <div className="text-2xl font-bold text-white">{participants.length}</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">团队数</div>
                      <div className="text-2xl font-bold text-white">{teams.length}</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">招募中</div>
                      <div className="text-2xl font-bold text-[#FBBF24]">{teams.filter(t => t.recruitments && t.recruitments.length > 0).length}</div>
                    </div>
                  </div>

                  {/* 团队列表 - List Row 布局 */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#222222]">
                      <h4 className="text-sm font-medium text-white flex items-center gap-3">
                        <span className="text-[#FBBF24] font-mono">//</span>
                        团队 & 招募
                        <span className="px-2 py-0.5 bg-[#111111] text-gray-500 text-[11px] rounded-md">{teams.length}</span>
                      </h4>
                    </div>
                    
                    {teams.length > 0 ? (
                      <div>
                        {teams.map((team, idx) => (
                          <div 
                            key={team.id} 
                            className={`flex items-center gap-5 px-6 py-5 hover:bg-[#111111] transition-colors duration-200 ease-in-out cursor-pointer ${
                              idx !== teams.length - 1 ? 'border-b border-[#222222]' : ''
                            }`}
                          >
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-[#111111] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {team.members?.[0]?.user?.avatar_url ? (
                                <img src={team.members[0].user.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg font-bold text-gray-500">{team.name[0].toUpperCase()}</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h5 className="text-[14px] font-semibold text-white">{team.name}</h5>
                                {team.recruitments && team.recruitments.length > 0 && (
                                  <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-md">招募中</span>
                                )}
                                <span className="text-[11px] text-gray-600 font-mono">{team.members?.length || 0}人</span>
                              </div>
                              <p className="text-[12px] text-gray-500 truncate">{team.description || '暂无描述'}</p>
                            </div>

                            {/* Recruitment Tags */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {team.recruitments?.slice(0, 3).map(r => (
                                <span key={r.id} className="px-2 py-1 text-[10px] border border-[#333] text-gray-400 rounded-md">招{r.role}</span>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!myTeam && enrollment && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleJoinTeam(team.id); }} 
                                  className="px-3 py-1.5 text-[11px] bg-[#FBBF24] text-black font-medium rounded-md hover:bg-white transition-colors duration-200"
                                >
                                  + 加入
                                </button>
                              )}
                              <button className="px-3 py-1.5 text-[11px] border border-[#333] text-gray-400 rounded-md hover:text-white hover:border-gray-500 transition-colors duration-200">
                                联系
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-600 text-sm">暂无团队</div>
                    )}
                  </div>

                  {/* 个人参赛者 - List Row 布局 */}
                  {(() => {
                    // 从团队成员中提取所有已组队的 user_id
                    const teamMemberIds = new Set(
                      teams.flatMap(t => t.members?.map((m: any) => m.user_id) || [])
                    )
                    const individualParticipants = participants.filter(p => !teamMemberIds.has(p.user_id))
                    return (
                      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#222222]">
                          <h4 className="text-sm font-medium text-white flex items-center gap-3">
                            <span className="text-[#FBBF24] font-mono">//</span>
                            个人参赛者
                            <span className="px-2 py-0.5 bg-[#111111] text-gray-500 text-[11px] rounded-md">{individualParticipants.length}</span>
                          </h4>
                        </div>
                        
                        {individualParticipants.length > 0 ? (
                          <div>
                            {individualParticipants.map((p: any, idx: number) => (
                              <div 
                                key={p.user_id} 
                                className={`flex items-center gap-4 px-6 py-4 hover:bg-[#111111] transition-colors duration-200 ease-in-out ${
                                  idx !== individualParticipants.length - 1 ? 'border-b border-[#222222]' : ''
                                }`}
                              >
                                {/* Avatar - 纯圆形 */}
                                <div className="w-10 h-10 rounded-full bg-[#111111] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {p.avatar_url ? (
                                    <img src={p.avatar_url} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-medium text-gray-500">{p.nickname?.[0] || '?'}</span>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-white">{p.nickname || '匿名'}</div>
                                  <div className="text-[11px] text-gray-500">{p.bio || '个人参赛'}</div>
                                </div>

                                {/* Skills */}
                                {p.skills && p.skills.length > 0 && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {p.skills.slice(0, 3).map((skill: string, i: number) => (
                                      <span key={i} className="px-2 py-0.5 text-[10px] border border-[#333] text-gray-500 rounded-md">{skill}</span>
                                    ))}
                                  </div>
                                )}

                                {/* Action */}
                                <button className="px-3 py-1.5 text-[11px] border border-[#333] text-gray-400 rounded-md hover:text-white hover:border-gray-500 transition-colors duration-200 flex-shrink-0">
                                  查看
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-600 text-sm">暂无个人参赛者</div>
                        )}
                      </div>
                    )
                  })()}

                  {teams.length === 0 && participants.length === 0 && (
                    <div className="text-center py-20 bg-[#0A0A0A] border border-[#222222] rounded-xl">
                      <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase">暂无参赛者</div>
                    </div>
                  )}
                </div>
              )}

              {/* RESULTS TAB - 评审结果 */}
              {activeTab === 'results' && (
                <div>
                  {hackathon.results_detail ? (
                    <div className="prose prose-invert max-w-none text-gray-300">
                      <ReactMarkdown>{hackathon.results_detail}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-20 border border-white/[0.05]">
                      <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase mb-4">结果尚未公布</div>
                      <p className="text-sm text-gray-500">请等待评审结束后查看</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* 右侧边栏 25% */}
          <div className="hidden md:block w-72 flex-shrink-0" style={{ flexBasis: '25%' }}>
            <div className="sticky top-24 space-y-6">
              {/* 报名按钮 */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
                {!enrollment ? (
                  <>
                    <button 
                      onClick={handleRegister}
                      className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-md hover:bg-white transition-colors duration-200 mb-4"
                    >
                      立即报名
                    </button>
                    <p className="text-[11px] text-gray-500 text-center">报名后可参与组队和提交作品</p>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-md">
                        <span>✓</span> 已报名
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setActiveTab('participants')}
                        className="py-2 border border-white/10 text-[11px] text-white rounded-md hover:bg-[#111111] transition-colors duration-200"
                      >
                        组队广场
                      </button>
                      <button 
                        onClick={() => setIsSubmitOpen(true)}
                        className="py-2 bg-[#FBBF24] text-black text-[11px] font-medium rounded-md hover:bg-white transition-colors duration-200"
                      >
                        提交作品
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 倒计时 */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">活动倒计时</div>
                <CountdownTimer targetDate={hackathon.registration_end_date || hackathon.end_date} />
              </div>

              {/* 时间轴 */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">时间轴</div>
                <div className="space-y-4 relative pl-4 border-l border-[#222222]">
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-[#FBBF24]"></div>
                    <div className="text-[10px] text-[#FBBF24] font-mono mb-1">
                      {hackathon.registration_start_date ? new Date(hackathon.registration_start_date).toLocaleDateString('zh-CN') : '待定'}
                    </div>
                    <div className="text-[12px] text-white">报名开启</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-gray-600"></div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">
                      {hackathon.registration_end_date ? new Date(hackathon.registration_end_date).toLocaleDateString('zh-CN') : '待定'}
                    </div>
                    <div className="text-[12px] text-gray-400">报名截止</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-gray-600"></div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">
                      {hackathon.submission_end_date ? new Date(hackathon.submission_end_date).toLocaleDateString('zh-CN') : '待定'}
                    </div>
                    <div className="text-[12px] text-gray-400">提交截止</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-gray-600"></div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">
                      {hackathon.judging_end_date ? new Date(hackathon.judging_end_date).toLocaleDateString('zh-CN') : '待定'}
                    </div>
                    <div className="text-[12px] text-gray-400">结果公布</div>
                  </div>
                </div>
              </div>

              {/* 主办方信息 */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">主办方</div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#111111] border border-[#333] rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-500">{hackathon.organizer_name?.[0] || 'A'}</span>
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{hackathon.organizer_name || 'Aura 平台'}</div>
                    {hackathon.contact_info && (
                      <div className="text-[11px] text-gray-500 mt-1">{hackathon.contact_info}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 快速导航 */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-4">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">快速导航</div>
                <div className="space-y-1">
                  {[
                    { id: 'overview', label: '活动详情' },
                    { id: 'myproject', label: '我的作品' },
                    { id: 'participants', label: '参赛人员' },
                    { id: 'results', label: '评审结果' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`block w-full text-left px-3 py-2 text-[12px] rounded-md transition-colors duration-200 ${
                        activeTab === item.id 
                          ? 'text-[#FBBF24] bg-[#FBBF24]/5' 
                          : 'text-gray-500 hover:text-white hover:bg-[#111111]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {hackathonId && (
        <>
          <SubmitProjectModal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} hackathonId={hackathonId} teamId={myTeam?.id} />
          <JudgingModal isOpen={isJudgingOpen} onClose={() => setIsJudgingOpen(false)} hackathonId={hackathonId} hackathonTitle={hackathon?.title || ''} />
          <ResultPublishModal isOpen={isResultPublishOpen} onClose={() => setIsResultPublishOpen(false)} hackathonId={hackathonId} />
        </>
      )}
      <AIResumeModal isOpen={isAIResumeOpen} onClose={() => setIsAIResumeOpen(false)} />

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#222222] px-4 py-3 z-40">
        {!enrollment ? (
          <button 
            onClick={handleRegister}
            className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-md hover:bg-white transition-colors"
          >
            立即报名
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('participants')}
              className="flex-1 py-3 border border-white/10 text-white text-sm font-medium rounded-md hover:bg-[#111111]"
            >
              组队广场
            </button>
            <button 
              onClick={() => setIsSubmitOpen(true)}
              className="flex-1 py-3 bg-[#FBBF24] text-black font-bold rounded-md hover:bg-white"
            >
              提交作品
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
