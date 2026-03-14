import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

// Modals
import SubmitProjectModal from '../components/SubmitProjectModal'
import JudgingModal from '../components/JudgingModal'
import ResultPublishModal from '../components/ResultPublishModal'
import AIResumeModal from '../components/AIResumeModal'
import TeamMatchModal from '../components/TeamMatchModal'
import CreateTeamModal from '../components/CreateTeamModal'
import AIProjectAssistant from '../components/AIProjectAssistant'
import CreateRecruitmentModal from '../components/CreateRecruitmentModal'

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
  max_members?: number;
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

// 解析奖项 JSON
interface AwardItem {
  name: string
  prize: string
  description?: string
  count?: number
  amount?: number
  prize_pool?: number
}

const parseAwardsDetail = (awardsDetail?: string): AwardItem[] => {
  if (!awardsDetail) return []
  try {
    const parsed = JSON.parse(awardsDetail)
    if (Array.isArray(parsed)) {
      // 转换数据格式，支持多种字段名
      return parsed.map(item => ({
        name: item.name || '',
        prize: item.prize || item.prize_pool || '',
        description: item.description || '',
        count: item.count || item.quota || 1,
        amount: item.amount || (typeof item.prize_pool === 'number' ? item.prize_pool : 0)
      }))
    }
  } catch (e) {
    // 如果不是 JSON，返回空数组
  }
  return []
}

// 解析评审维度 JSON
const parseScoringDimensions = (dimensions?: string): Array<{name: string, description: string, weight: number}> => {
  if (!dimensions) return []
  try {
    const parsed = JSON.parse(dimensions)
    if (Array.isArray(parsed)) return parsed
  } catch (e) {
    // 如果不是 JSON，返回空数组
  }
  return []
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
  const [searchParams] = useSearchParams()
  const { isLoggedIn, currentUser } = useOutletContext<OutletContextType>()
  
  const hackathonId = id ? parseInt(id) : null
  const tabParam = searchParams.get('tab')
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [myProject, setMyProject] = useState<Project | null>(null)
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [activeTab, setActiveTab] = useState(tabParam || 'overview')
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
  const [isTeamMatchOpen, setIsTeamMatchOpen] = useState(false)
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [isRecruitOpen, setIsRecruitOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Join team confirmation
  const [showJoinConfirm, setShowJoinConfirm] = useState(false)
  const [joiningTeamId, setJoiningTeamId] = useState<number | null>(null)
  const [joiningTeamName, setJoiningTeamName] = useState('')
  
  // 判断当前用户是否为活动发起者
  const isOrganizer = hackathon?.organizer_id === currentUser?.id
  
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
      
      // Fetch my team - API returns list, find the one for this hackathon
      const teamRes = await axios.get(`/api/v1/teams/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Filter teams for current hackathon
      const myTeamsInHackathon = teamRes.data.filter((t: Team) => t.hackathon_id === Number(hackathonId))
      setMyTeam(myTeamsInHackathon.length > 0 ? myTeamsInHackathon[0] : null)
      
      // Fetch my project - API returns list, get first one for this hackathon
      const projRes = await axios.get(`/api/v1/projects/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Filter projects for current hackathon (via team.hackathon_id)
      const myProjectsInHackathon = projRes.data.filter((p: Project) => p.team?.hackathon_id === Number(hackathonId))
      setMyProject(myProjectsInHackathon.length > 0 ? myProjectsInHackathon[0] : null)
    } catch (e) {
      console.error(e)
    }
  }

  // 删除活动
  const handleDeleteHackathon = async () => {
    if (!hackathonId) return
    
    try {
      setIsDeleting(true)
      const token = localStorage.getItem('token')
      await axios.delete(`/api/v1/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // 删除成功后跳转到活动列表
      navigate('/events')
    } catch (e: any) {
      console.error('删除活动失败:', e)
      alert(e.response?.data?.detail || '删除活动失败，请重试')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleJoinTeamClick = (teamId: number, teamName: string) => {
    setJoiningTeamId(teamId)
    setJoiningTeamName(teamName)
    setShowJoinConfirm(true)
  }

  const handleConfirmJoinTeam = async () => {
    if (!joiningTeamId) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/api/v1/teams/${joiningTeamId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowJoinConfirm(false)
      setJoiningTeamId(null)
      setJoiningTeamName('')
      fetchTeams()
      fetchEnrollment()
      alert('加入战队成功！')
    } catch (e: any) {
      alert(e.response?.data?.detail || '加入失败')
    }
  }

  // 创建个人项目（自动创建单人战队）
  const handleCreatePersonalTeam = async () => {
    try {
      const token = localStorage.getItem('token')
      // 1. 创建个人战队
      const teamRes = await axios.post('/api/v1/teams', {
        hackathon_id: hackathonId,
        name: `${currentUser?.nickname || currentUser?.full_name || '我'}的个人项目`,
        description: '个人参赛项目',
        max_members: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // 2. 自动创建项目
      await axios.post('/api/v1/projects', {
        hackathon_id: hackathonId,
        team_id: teamRes.data.id,
        title: '未命名项目',
        description: '请完善项目描述'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      fetchTeams()
      fetchEnrollment()
      setIsSubmitOpen(true)
    } catch (e: any) {
      alert(e.response?.data?.detail || '创建失败')
    }
  }

  // 处理创建战队
  const handleCreateTeam = async (teamData: { name: string; description: string; max_members: number }) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/v1/teams', {
        hackathon_id: hackathonId,
        ...teamData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchTeams()
      fetchEnrollment()
      setIsCreateTeamOpen(false)
    } catch (e: any) {
      alert(e.response?.data?.detail || '创建战队失败')
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
      <div className="relative h-[45vh] min-h-[360px] overflow-hidden">
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
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium tracking-wide flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </button>
            <span className="text-gray-600">/</span>
            <button
              onClick={() => navigate('/events')}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium tracking-wide flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded-[24px]"
            >
              探索网络
            </button>
            <span className="text-gray-600">/</span>
            <span className="text-[#FBBF24] text-sm font-bold tracking-wide px-2 py-1 bg-[#FBBF24]/5 rounded-[24px]">{hackathon.title}</span>
          </div>

          {/* Tags - 活动分类标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {hackathon.theme_tags?.split(',').map((tag, i) => (
              <span key={i} className="px-3 py-1 text-[11px] border border-[#FBBF24]/40 text-[#FBBF24] bg-[#FBBF24]/5 rounded-[16px]">
                #{tag.trim()}
              </span>
            ))}
            {hackathon.professionalism_tags?.split(',').map((tag, i) => (
              <span key={`p-${i}`} className="px-3 py-1 text-[11px] border border-[#333] text-gray-300 rounded-[16px]">
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
            <div className={`px-4 py-1.5 text-[12px] font-medium flex items-center gap-2 rounded-[16px] ${
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

          {/* Action Buttons - 头栏操作按钮 */}
          <div className="flex items-center gap-3 mt-6">
            {/* 参赛者视角提示 */}
            {isLoggedIn && !isOrganizer && (
              <div className="flex-1 p-3 bg-brand/10 border border-brand/20 rounded-[16px] flex items-start gap-3">
                <svg className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-brand/80">
                  <p className="font-medium mb-0.5">参赛者视角</p>
                  <p className="text-brand/60 text-xs">您正在浏览他人创建的活动，仅可查看公开信息和参与竞赛。</p>
                </div>
              </div>
            )}
            
            {/* 编辑活动 - 仅发起者可见 */}
            {isOrganizer && (
              <>
                <button
                  onClick={() => navigate(`/create?edit=${hackathon.id}`)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-[16px] hover:border-white hover:text-white transition-colors text-[13px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑活动
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 rounded-[16px] hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-colors text-[13px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除活动
                </button>
              </>
            )}
            
            {/* 核心功能按钮 - 登录用户可见 */}
            {isLoggedIn && !isOrganizer && (
              <>
                <button
                  onClick={() => setActiveTab('myproject')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FBBF24] text-black font-medium rounded-[16px] hover:bg-white transition-colors text-[13px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  开始项目
                </button>
                <button
                  onClick={() => setIsTeamMatchOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-[#FBBF24]/50 text-[#FBBF24] rounded-[16px] hover:bg-[#FBBF24]/10 transition-colors text-[13px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  智能组队
                </button>
              </>
            )}
            
            {/* 未登录提示 */}
            {!isLoggedIn && (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-6 py-2 bg-[#FBBF24] text-black font-medium rounded-[24px] hover:bg-white transition-colors text-[13px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                登录参与
              </button>
            )}
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
                  { id: 'myproject', label: isOrganizer ? '作品管理' : '我的作品' },
                  { id: 'participants', label: isOrganizer ? '参赛管理' : '参赛人员' },
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
                
                {/* 发起者管理按钮组 */}
                {isOrganizer && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => setIsJudgingOpen(true)}
                      className="px-4 py-4 text-[12px] text-gray-500 hover:text-white transition-colors duration-200 ease-in-out"
                    >
                      评审管理
                    </button>
                    <button
                      onClick={() => setIsResultPublishOpen(true)}
                      className="px-4 py-4 text-[12px] text-gray-500 hover:text-white transition-colors duration-200 ease-in-out"
                    >
                      发布结果
                    </button>
                  </div>
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
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors rounded-[16px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">报名开始</div>
                        <div className="text-brand font-mono text-sm">
                          {hackathon.registration_start_date ? new Date(hackathon.registration_start_date).toLocaleDateString('zh-CN') : '待定'}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors rounded-[16px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">报名截止</div>
                        <div className="text-gray-300 font-mono text-sm">
                          {hackathon.registration_end_date ? new Date(hackathon.registration_end_date).toLocaleDateString('zh-CN') : '待定'}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors rounded-[16px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">提交截止</div>
                        <div className="text-gray-300 font-mono text-sm">
                          {hackathon.submission_end_date ? new Date(hackathon.submission_end_date).toLocaleDateString('zh-CN') : '待定'}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors rounded-[16px]">
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
                      <div className="prose prose-invert max-w-none text-gray-300 bg-white/[0.02] border border-white/[0.08] p-6 rounded-[16px]">
                        <ReactMarkdown>{hackathon.requirements}</ReactMarkdown>
                      </div>
                    </section>
                  )}

                  {/* 评审维度 */}
                  {hackathon.scoring_dimensions && parseScoringDimensions(hackathon.scoring_dimensions).length > 0 && (
                    <section id="scoring">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-6 h-[2px] bg-brand"></span>
                        评审标准
                      </h3>
                      <div className="border-l border-white/[0.08] pl-6 space-y-4">
                        {parseScoringDimensions(hackathon.scoring_dimensions).map((dim, idx) => (
                          <div key={idx} className="bg-[#111111] border border-[#222222] rounded-[16px] p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{dim.name}</span>
                              <span className="text-[#FBBF24] font-bold">{dim.weight}%</span>
                            </div>
                            {dim.description && (
                              <p className="text-gray-500 text-sm">{dim.description}</p>
                            )}
                          </div>
                        ))}
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
                      <div className="border-l border-white/[0.08] pl-6 space-y-4">
                        {parseAwardsDetail(hackathon.awards_detail).map((award, idx) => (
                          <div key={idx} className="bg-[#111111] border border-[#222222] rounded-[16px] p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{award.name}</span>
                              <span className="text-gray-500 text-sm">名额: {award.count}</span>
                            </div>
                            {award.prize && (
                              <div className="text-[#FBBF24] font-bold mt-2">
                                {award.prize}
                              </div>
                            )}
                            {award.description && (
                              <div className="text-gray-400 text-sm mt-1">
                                {award.description}
                              </div>
                            )}
                          </div>
                        ))}
                        {parseAwardsDetail(hackathon.awards_detail).length === 0 && (
                          <div className="prose prose-invert max-w-none text-gray-300">
                            <ReactMarkdown>{hackathon.awards_detail}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* MY PROJECT TAB - 我的作品/作品展示 */}
              {activeTab === 'myproject' && (
                <div className="space-y-8">
                  {/* 我的项目区域 - 仅登录用户可见 */}
                  {isLoggedIn && (
                    <div className="border-b border-zinc-800 pb-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                        <span className="w-5 h-[2px] bg-brand"></span>
                        我的项目
                      </h3>
                      {!myTeam && !myProject ? (
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[24px]">
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className="text-white text-sm font-medium">开始您的黑客松之旅</p>
                              <p className="text-[12px] text-zinc-500 mt-1">选择适合您的方式参与</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <button 
                                onClick={handleCreatePersonalTeam}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand text-black text-sm font-medium hover:bg-white transition-colors rounded-[24px]"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                个人项目
                              </button>
                              <button 
                                onClick={() => setIsCreateTeamOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-white text-sm hover:bg-zinc-700 transition-colors rounded-[24px]"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                创建战队
                              </button>
                              <button 
                                onClick={() => setActiveTab('participants')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-brand/30 text-brand text-sm hover:bg-brand/10 transition-colors rounded-[24px]"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                加入战队
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* 战队信息卡片 */}
                          {myTeam && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] overflow-hidden">
                              <div className="p-5">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 flex items-center justify-center">
                                      <span className="text-xl font-bold text-brand">{myTeam.name[0].toUpperCase()}</span>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-lg font-semibold text-white">{myTeam.name}</h4>
                                        <span className={`px-2.5 py-0.5 text-[10px] rounded-full ${myTeam.max_members === 1 ? 'bg-zinc-800 text-zinc-400' : 'bg-brand/20 text-brand'}`}>
                                          {myTeam.max_members === 1 ? '个人项目' : '团队项目'}
                                        </span>
                                      </div>
                                      <p className="text-sm text-zinc-400">{myTeam.description || '暂无描述'}</p>
                                </div>
                              </div>
                              {myTeam.max_members && myTeam.max_members > 1 && (
                                    <button 
                                      onClick={() => setIsRecruitOpen(true)}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-brand/10 text-brand text-[12px] font-medium rounded-[24px] hover:bg-brand/20 transition-colors"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      招募成员
                                    </button>
                                  )}
                                </div>
                                
                                {/* 成员统计 */}
                                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-800">
                                  <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>成员 {myTeam.members?.length || 1}/{myTeam.max_members || '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>队长: {myTeam.members?.find(m => m.user_id === myTeam.leader_id)?.user?.nickname || '我'}</span>
                                  </div>
                                </div>
                                
                                {/* 成员列表 */}
                                {myTeam.members && myTeam.members.length > 0 && (
                                  <div className="mt-4">
                                    <div className="flex flex-wrap gap-2">
                                      {myTeam.members.map((member) => (
                                        <div key={member.id} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                                            {member.user?.avatar_url ? (
                                              <img src={member.user.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                              <span className="text-[11px] text-zinc-300">
                                                {(member.user?.nickname || member.user?.full_name || '?')[0]}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[12px] text-zinc-300">
                                            {member.user?.nickname || member.user?.full_name || '成员'}
                                          </span>
                                          {member.user_id === myTeam.leader_id && (
                                            <span className="text-[9px] px-1.5 py-0.5 bg-brand/20 text-brand rounded-full">队长</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 项目卡片 */}
                          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] overflow-hidden">
                            <div className="p-6">
                              <div className="flex items-start gap-5">
                                <div className="w-28 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-700">
                                  {myProject?.cover_image ? (
                                    <img src={myProject.cover_image} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl font-bold text-zinc-600">{(myProject?.title || '未命名')[0]}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-semibold text-white mb-1 truncate">{myProject?.title || '未命名项目'}</h4>
                                  <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{myProject?.description || '暂无描述，点击编辑项目添加详情'}</p>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {myProject?.tech_stack && (
                                      <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 text-[11px] rounded-lg border border-zinc-700">
                                        {myProject.tech_stack}
                                      </span>
                                    )}
                                    {myProject?.total_score ? (
                                      <span className="flex items-center gap-1 px-2.5 py-1 bg-brand/10 text-brand text-[11px] rounded-lg border border-brand/20">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        {myProject.total_score.toFixed(1)}分
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-zinc-800 text-zinc-500 text-[11px] rounded-lg border border-zinc-700">
                                        待评审
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setIsSubmitOpen(true)}
                                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white text-[12px] font-medium rounded-[24px] hover:bg-zinc-700 transition-colors border border-zinc-700"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={myProject?.id ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                                  </svg>
                                  {myProject?.id ? '编辑项目' : '提交作品'}
                                </button>
                              </div>
                              
                              {/* 项目链接 */}
                              {(myProject?.repo_url || myProject?.demo_url) && (
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
                                  {myProject?.repo_url && (
                                    <a href={myProject.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-[11px] rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700">
                                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                      代码仓库
                                    </a>
                                  )}
                                  {myProject?.demo_url && (
                                    <a href={myProject.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-[11px] rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                      演示链接
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 快捷操作栏 */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button 
                              onClick={() => setIsAIAssistantOpen(true)}
                              className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-[24px] hover:bg-zinc-700 transition-colors"
                            >
                              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-sm text-zinc-300">AI 助手</span>
                            </button>
                            <button 
                              onClick={() => setIsTeamMatchOpen(true)}
                              className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-[24px] hover:bg-zinc-700 transition-colors"
                            >
                              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-sm text-zinc-300">智能组队</span>
                            </button>
                            <button 
                              onClick={() => setIsRecruitOpen(true)}
                              className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-[24px] hover:bg-zinc-700 transition-colors"
                            >
                              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              <span className="text-sm text-zinc-300">发布招募</span>
                            </button>
                            <button 
                              onClick={() => navigate('/community')}
                              className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-[24px] hover:bg-zinc-700 transition-colors"
                            >
                              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span className="text-sm text-zinc-300">招募大厅</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 所有作品展示 - 对所有人可见 */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                      <span className="w-5 h-[2px] bg-brand"></span>
                      所有作品 <span className="text-[12px] text-zinc-500 font-normal ml-2">{galleryProjects.length} 个</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {galleryProjects.map(proj => (
                        <div key={proj.id} className="group bg-zinc-900 border border-zinc-800 rounded-[24px] overflow-hidden hover:border-brand/30 transition-all">
                          <div className="p-4 flex gap-4">
                            <div className="w-20 h-16 bg-zinc-800 rounded-2xl flex-shrink-0 overflow-hidden border border-zinc-700">
                              {proj.cover_image ? (
                                <img src={proj.cover_image} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold text-lg">{proj.title[0]}</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-white text-sm mb-1 truncate group-hover:text-brand transition-colors">{proj.title}</h5>
                              <p className="text-[12px] text-zinc-500 line-clamp-1">{proj.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[11px] text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-lg">{proj.team?.name}</span>
                                {proj.total_score && (
                                  <span className="flex items-center gap-1 text-[11px] text-brand">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                    {proj.total_score.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {galleryProjects.length === 0 && (
                        <div className="col-span-2 text-center py-16 bg-zinc-900 border border-zinc-800 rounded-[24px]">
                          <div className="text-[11px] tracking-[0.2em] text-zinc-600 uppercase">暂无作品</div>
                          <p className="text-[12px] text-zinc-500 mt-2">活动作品将在这里展示</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PARTICIPANTS TAB - 参赛人员与组队 */}
              {activeTab === 'participants' && (
                <div className="space-y-8">
                  {/* 筛选条 */}
                  <div className="flex items-center gap-4 pb-6 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 uppercase tracking-wider">身份:</span>
                      <div className="flex gap-1">
                        {[{key: 'all', label: '全部'}, {key: 'individual', label: '个人'}, {key: 'team', label: '团队'}].map(item => (
                          <button 
                            key={item.key}
                            onClick={() => setIdentityFilter(item.key as any)}
                            className={`px-3 py-1.5 text-[11px] rounded-[24px] transition-colors duration-200 ease-in-out ${
                              identityFilter === item.key 
                                ? 'bg-brand text-black font-medium' 
                                : 'border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
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
                        className="bg-zinc-900 border border-zinc-800 rounded-[24px] px-4 py-1.5 text-[12px] text-white placeholder-zinc-600 focus:border-brand/50 outline-none w-40 transition-colors duration-200"
                      />
                      <button 
                        onClick={() => {
                          setIdentityFilter('all')
                          setLocationSearch('')
                        }}
                        className="text-[11px] text-zinc-500 hover:text-brand transition-colors duration-200"
                      >
                        重置
                      </button>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-5">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">总参赛者</div>
                      <div className="text-2xl font-bold text-white">{participants.length}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-5">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">团队数</div>
                      <div className="text-2xl font-bold text-white">{teams.length}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-5">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">招募中</div>
                      <div className="text-2xl font-bold text-brand">{teams.filter(t => t.recruitments && t.recruitments.length > 0).length}</div>
                    </div>
                  </div>

                  {/* 团队列表 */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-800">
                      <h4 className="text-sm font-medium text-white flex items-center gap-3">
                        <span className="text-brand font-mono">//</span>
                        团队 & 招募
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[11px] rounded-[24px]">{teams.length}</span>
                      </h4>
                    </div>
                    
                    {teams.length > 0 ? (
                      <div>
                        {teams.map((team, idx) => (
                          <div 
                            key={team.id} 
                            className={`flex items-center gap-5 px-6 py-5 hover:bg-zinc-800/50 transition-colors duration-200 ease-in-out cursor-pointer ${
                              idx !== teams.length - 1 ? 'border-b border-zinc-800' : ''
                            }`}
                          >
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-[20px] bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {team.members?.[0]?.user?.avatar_url ? (
                                <img src={team.members[0].user.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl font-bold text-zinc-500">{team.name[0].toUpperCase()}</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h5 className="text-[14px] font-semibold text-white group-hover:text-brand transition-colors">{team.name}</h5>
                                {team.recruitments && team.recruitments.length > 0 && (
                                  <span className="px-2 py-0.5 text-[10px] bg-brand/20 text-brand rounded-full border border-brand/20">招募中</span>
                                )}
                                <span className="text-[11px] text-zinc-500 font-mono">{team.members?.length || 0}人</span>
                              </div>
                              <p className="text-[12px] text-zinc-400 truncate">{team.description || '暂无描述'}</p>
                            </div>

                            {/* Recruitment Tags */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {team.recruitments?.slice(0, 3).map(r => (
                                <span key={r.id} className="px-2 py-1 text-[10px] bg-zinc-800 text-zinc-400 rounded-[24px] border border-zinc-700">招{r.role}</span>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!myTeam && enrollment && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleJoinTeamClick(team.id, team.name); }} 
                                  className="px-3 py-1.5 text-[11px] bg-brand text-black font-medium rounded-[24px] hover:bg-white transition-colors duration-200"
                                >
                                  + 加入
                                </button>
                              )}
                              <button className="px-3 py-1.5 text-[11px] bg-zinc-800 text-zinc-300 rounded-[24px] hover:bg-zinc-700 transition-colors duration-200 border border-zinc-700">
                                联系
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-500 text-sm">暂无团队</div>
                    )}
                  </div>

                  {/* 个人参赛者 */}
                  {(() => {
                    // 从团队成员中提取所有已组队的 user_id
                    const teamMemberIds = new Set(
                      teams.flatMap(t => t.members?.map((m: any) => m.user_id) || [])
                    )
                    const individualParticipants = participants.filter(p => !teamMemberIds.has(p.user_id))
                    return (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-800">
                          <h4 className="text-sm font-medium text-white flex items-center gap-3">
                            <span className="text-brand font-mono">//</span>
                            个人参赛者
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[11px] rounded-[24px]">{individualParticipants.length}</span>
                          </h4>
                        </div>
                        
                        {individualParticipants.length > 0 ? (
                          <div>
                            {individualParticipants.map((p: any, idx: number) => (
                              <div 
                                key={p.user_id} 
                                className={`flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/50 transition-colors duration-200 ease-in-out ${
                                  idx !== individualParticipants.length - 1 ? 'border-b border-zinc-800' : ''
                                }`}
                              >
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-[20px] bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {p.avatar_url ? (
                                    <img src={p.avatar_url} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-lg font-medium text-zinc-400">{p.nickname?.[0] || '?'}</span>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white mb-0.5">{p.nickname || '匿名'}</div>
                                  <div className="text-[11px] text-zinc-400">{p.bio || '个人参赛'}</div>
                                </div>

                                {/* Skills */}
                                {p.skills && p.skills.length > 0 && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {p.skills.slice(0, 3).map((skill: string, i: number) => (
                                      <span key={i} className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded-[24px] border border-zinc-700">{skill}</span>
                                    ))}
                                  </div>
                                )}

                                {/* Action */}
                                <button className="px-3 py-1.5 text-[11px] bg-zinc-800 text-zinc-300 rounded-[24px] hover:bg-zinc-700 transition-colors duration-200 flex-shrink-0 border border-zinc-700">
                                  查看
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-zinc-500 text-sm">暂无个人参赛者</div>
                        )}
                      </div>
                    )
                  })()}

                  {teams.length === 0 && participants.length === 0 && (
                    <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-[24px]">
                      <div className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase">暂无参赛者</div>
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
              {/* 右侧边栏操作区 */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6">
                {!myTeam ? (
                  <>
                    <button 
                      onClick={() => setIsCreateTeamOpen(true)}
                      className="w-full py-3 bg-brand text-black font-bold rounded-[24px] hover:bg-white transition-colors duration-200 mb-4"
                    >
                      创建战队
                    </button>
                    <p className="text-[11px] text-zinc-500 text-center">创建战队后即可参与活动和提交作品</p>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 text-brand text-[11px] rounded-[24px]">
                        <span>✓</span> 已参与
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setActiveTab('participants')}
                        className="py-2 border border-zinc-700 text-[11px] text-white rounded-[24px] hover:bg-zinc-800 transition-colors duration-200"
                      >
                        组队广场
                      </button>
                      <button 
                        onClick={() => setIsSubmitOpen(true)}
                        className="py-2 bg-brand text-black text-[11px] font-medium rounded-[24px] hover:bg-white transition-colors duration-200"
                      >
                        提交作品
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 倒计时 */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-4">活动倒计时</div>
                <CountdownTimer targetDate={hackathon.registration_end_date || hackathon.end_date} />
              </div>

              {/* 时间轴 */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-4">时间轴</div>
                <div className="space-y-4 relative pl-4 border-l border-zinc-800">
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-brand rounded-full"></div>
                    <div className="text-[10px] text-brand font-mono mb-1">
                      {hackathon.registration_start_date ? new Date(hackathon.registration_start_date).toLocaleDateString('zh-CN') : '待定'}
                    </div>
                    <div className="text-[12px] text-white">报名开启</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-zinc-600 rounded-full"></div>
                    <div className="text-[10px] text-zinc-500 font-mono mb-1">
                      {hackathon.registration_end_date ? new Date(hackathon.registration_end_date).toLocaleDateString('zh-CN') : '待定'}
                    </div>
                    <div className="text-[12px] text-zinc-400">报名截止</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-zinc-600 rounded-full"></div>
                    <div className="text-[10px] text-zinc-500 font-mono mb-1">
                      {hackathon.submission_end_date ? new Date(hackathon.submission_end_date).toLocaleDateString('zh-CN') : '待定'}
                    </div>
                    <div className="text-[12px] text-zinc-400">提交截止</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-zinc-600 rounded-full"></div>
                    <div className="text-[10px] text-zinc-500 font-mono mb-1">
                      {hackathon.judging_end_date ? new Date(hackathon.judging_end_date).toLocaleDateString('zh-CN') : '待定'}
                    </div>
                    <div className="text-[12px] text-zinc-400">结果公布</div>
                  </div>
                </div>
              </div>

              {/* 主办方信息 */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
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
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-4">
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
                      className={`block w-full text-left px-3 py-2 text-[12px] rounded-[16px] transition-colors duration-200 ${
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
          <TeamMatchModal isOpen={isTeamMatchOpen} onClose={() => setIsTeamMatchOpen(false)} hackathonId={hackathonId} />
          <CreateTeamModal isOpen={isCreateTeamOpen} onClose={() => setIsCreateTeamOpen(false)} onCreate={handleCreateTeam} />
          <AIProjectAssistant isOpen={isAIAssistantOpen} onClose={() => setIsAIAssistantOpen(false)} />
          <CreateRecruitmentModal isOpen={isRecruitOpen} onClose={() => setIsRecruitOpen(false)} teamId={myTeam?.id || 0} onSuccess={fetchTeams} />
        </>
      )}
      <AIResumeModal isOpen={isAIResumeOpen} onClose={() => setIsAIResumeOpen(false)} />

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#222222] px-4 py-3 z-40">
        {!isLoggedIn ? (
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-[24px] hover:bg-white transition-colors"
          >
            登录参与
          </button>
        ) : isOrganizer ? (
          <button 
            onClick={() => navigate(`/create?edit=${hackathon.id}`)}
            className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-[24px] hover:bg-white transition-colors"
          >
            编辑活动
          </button>
        ) : !myTeam ? (
          <button 
            onClick={() => setActiveTab('myproject')}
            className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-[24px] hover:bg-white transition-colors"
          >
            开始项目
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('participants')}
              className="flex-1 py-3 border border-white/10 text-white text-sm font-medium rounded-[24px] hover:bg-[#111111]"
            >
              组队广场
            </button>
            <button 
              onClick={() => setIsSubmitOpen(true)}
              className="flex-1 py-3 bg-[#FBBF24] text-black font-bold rounded-[24px] hover:bg-white"
            >
              提交作品
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-[20px] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">确认删除活动</h3>
                <p className="text-sm text-gray-400">此操作不可撤销</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              您确定要删除活动 <span className="text-white font-medium">"{hackathon?.title}"</span> 吗？
              删除后，所有相关数据（报名、团队、作品等）都将被永久删除。
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-[#333333] text-gray-300 rounded-[12px] hover:border-gray-500 hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteHackathon}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-[12px] hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Confirmation Modal */}
      {showJoinConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-[20px] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">确认加入战队</h3>
                <p className="text-sm text-gray-400">加入后将可以参与该战队的项目</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              您确定要加入战队 <span className="text-brand font-medium">"{joiningTeamName}"</span> 吗？
              加入后您将成为该战队的成员，可以共同开发项目。
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-[#333333] text-gray-300 rounded-[12px] hover:border-gray-500 hover:text-white transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmJoinTeam}
                className="flex-1 px-4 py-2.5 bg-brand text-black rounded-[12px] hover:bg-white transition-colors text-sm font-medium font-semibold"
              >
                确认加入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
