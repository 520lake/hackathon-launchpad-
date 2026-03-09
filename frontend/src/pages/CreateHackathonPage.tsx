import { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Sparkles, Plus, X, Globe, MapPin, Save, Rocket, Calendar, Target, Trophy, Tag, Wand2, Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import AIGenerateImageButton from '../components/AIGenerateImageButton'

interface OutletContextType {
  isLoggedIn: boolean
  currentUser: any
  fetchCurrentUser: () => void
  lang: 'zh' | 'en'
}

interface TimelinePhase {
  phase: string
  time_offset: string
  description: string
}

interface CriteriaDimension {
  dimension: string
  weight: number
  description: string
}

interface AwardItem {
  name: string
  prize_pool: number
  quota: number
}

interface FormData {
  name: string
  tagline: string
  tags: string[]
  description: string
  timeline: TimelinePhase[]
  criteria: CriteriaDimension[]
  awards: AwardItem[]
}

interface AICommandState {
  isGenerating: boolean
  query: string
  isVisible: boolean
}

export default function CreateHackathonPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { isLoggedIn, currentUser } = useOutletContext<OutletContextType>()

  // Form State
  const [formData, setFormData] = useState<FormData>({
    name: '',
    tagline: '',
    tags: [],
    description: '',
    timeline: [
      { phase: '报名启动', time_offset: 'Day 0', description: '开放报名通道' },
      { phase: '作品提交', time_offset: 'Day 14', description: '截止提交作品' },
      { phase: '评审阶段', time_offset: 'Day 21', description: '专家评审团打分' },
    ],
    criteria: [
      { dimension: '技术创新性', weight: 40, description: '技术方案的前沿性与创新程度' },
      { dimension: '商业价值', weight: 30, description: '商业化潜力与市场需求匹配度' },
      { dimension: '完成度', weight: 30, description: '原型或成品的完整程度' },
    ],
    awards: [
      { name: '冠军', prize_pool: 50000, quota: 1 },
      { name: '亚军', prize_pool: 20000, quota: 2 },
      { name: '季军', prize_pool: 10000, quota: 3 },
    ],
  })

  // UI State
  const [format, setFormat] = useState<'online' | 'offline'>('online')
  const [location, setLocation] = useState('')
  const [organizerName, setOrganizerName] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [aiCommand, setAiCommand] = useState<AICommandState>({
    isGenerating: false,
    query: '',
    isVisible: true,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'published'>('draft')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Refs for animations
  const cmdInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/')
      return
    }
    
    // 检查用户是否有创建活动的权限
    if (currentUser && !currentUser.can_create_hackathon) {
      // 显示提示并跳转
      setTimeout(() => {
        alert('您没有权限创建活动，需要超级管理员分配的邀请码才能发布活动。\n\n请在个人中心使用邀请码激活组织者权限。')
        navigate('/profile')
      }, 100)
      return
    }
    
    // 权限检查通过，设置 loading 为 false
    setLoading(false)
    
    if (editId) {
      loadHackathonData(editId)
    }
  }, [isLoggedIn, currentUser, editId, navigate])

  const loadHackathonData = async (id: string) => {
    try {
      const res = await axios.get(`/api/v1/hackathons/${id}`)
      const data = res.data
      setFormData({
        name: data.title || '',
        tagline: data.subtitle || '',
        tags: data.theme_tags ? data.theme_tags.split(',') : [],
        description: data.description || '',
        timeline: [],
        criteria: data.scoring_dimensions ? JSON.parse(data.scoring_dimensions) : [],
        awards: data.awards_detail ? JSON.parse(data.awards_detail) : [],
      })
      setFormat(data.format || 'online')
      setLocation(data.location || '')
      setOrganizerName(data.organizer_name || '')
      setCoverImage(data.cover_image || '')
      setCurrentStatus(data.status || 'draft')
    } catch (e) {
      console.error(e)
    }
  }

  // AI Generation Handler
  const handleAIGenerate = async () => {
    if (!aiCommand.query.trim()) return

    setAiCommand(prev => ({ ...prev, isGenerating: true }))

    try {
      // Simulate AI API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock AI response - in production, call your AI endpoint
      const mockAIResponse: FormData = {
        name: `${aiCommand.query} - 黑客松`,
        tagline: `探索${aiCommand.query}的无限可能，与全球开发者共创未来`,
        tags: [aiCommand.query, '创新', 'AI', '开发者'],
        description: `# 关于${aiCommand.query}\n\n本次黑客松聚焦于${aiCommand.query}领域的创新应用...\n\n## 参赛要求\n- 3-5 人组队\n- 提交完整代码和演示视频\n\n## 技术支持\n提供云计算资源和技术导师指导`,
        timeline: [
          { phase: '报名启动', time_offset: 'Day 0', description: '开放在线报名' },
          { phase: '开幕 keynote', time_offset: 'Day 1', description: '线上直播开幕' },
          { phase: '黑客松开始', time_offset: 'Day 2', description: '正式进入 coding 环节' },
          { phase: '作品提交', time_offset: 'Day 14', description: '截止提交作品和演示' },
          { phase: '评审', time_offset: 'Day 15-20', description: '专家评审团打分' },
          { phase: '颁奖典礼', time_offset: 'Day 21', description: '线上直播颁奖' },
        ],
        criteria: [
          { dimension: '技术创新性', weight: 35, description: '技术方案的创新程度和技术难度' },
          { dimension: '商业价值', weight: 25, description: '商业化潜力和市场前景' },
          { dimension: '用户体验', weight: 20, description: '产品易用性和交互设计' },
          { dimension: '完成度', weight: 20, description: '原型或成品的完整程度' },
        ],
        awards: [
          { name: '冠军', prize_pool: 100000, quota: 1 },
          { name: '亚军', prize_pool: 50000, quota: 2 },
          { name: '季军', prize_pool: 20000, quota: 3 },
          { name: '最佳创意奖', prize_pool: 10000, quota: 1 },
          { name: '最佳技术奖', prize_pool: 10000, quota: 1 },
        ],
      }

      setFormData(mockAIResponse)
    } catch (e) {
      console.error('AI generation failed:', e)
    } finally {
      setAiCommand(prev => ({ ...prev, isGenerating: false, query: '' }))
    }
  }

  // Form Handlers
  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const addTimelinePhase = () => {
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, { phase: '', time_offset: '', description: '' }],
    }))
  }

  const updateTimeline = (idx: number, field: keyof TimelinePhase, value: string) => {
    const updated = [...formData.timeline] as any
    updated[idx][field] = value
    setFormData(prev => ({ ...prev, timeline: updated }))
  }

  const removeTimeline = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== idx),
    }))
  }

  const addCriteria = () => {
    setFormData(prev => ({
      ...prev,
      criteria: [...prev.criteria, { dimension: '', weight: 0, description: '' }],
    }))
  }

  const updateCriteria = (idx: number, field: keyof CriteriaDimension, value: string | number) => {
    const updated = [...formData.criteria] as any
    updated[idx][field] = value
    setFormData(prev => ({ ...prev, criteria: updated }))
  }

  const removeCriteria = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== idx),
    }))
  }

  const addAward = () => {
    setFormData(prev => ({
      ...prev,
      awards: [...prev.awards, { name: '', prize_pool: 0, quota: 1 }],
    }))
  }

  const updateAward = (idx: number, field: keyof AwardItem, value: string | number) => {
    const updated = [...formData.awards] as any
    updated[idx][field] = value
    setFormData(prev => ({ ...prev, awards: updated }))
  }

  const removeAward = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== idx),
    }))
  }

  // Image Upload Handler
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      // 创建本地预览 URL
      const localUrl = URL.createObjectURL(file)
      setCoverImage(localUrl)
      
      // TODO: 在实际应用中，这里需要调用后端 API 上传图片
      // const formData = new FormData()
      // formData.append('file', file)
      // const res = await axios.post('/api/v1/upload', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // })
      // setCoverImage(res.data.url)
    } catch (e: any) {
      setError('图片上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!formData.name?.trim()) {
      setError('请填写活动名称')
      return
    }
    if (!formData.tagline?.trim()) {
      setError('请填写活动简介')
      return
    }
    if (!formData.description?.trim()) {
      setError('请填写活动描述')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      // 计算日期 - 处理空timeline的情况
      let days = 30 // 默认30天
      if (formData.timeline && formData.timeline.length > 0) {
        const dates = formData.timeline.map(t => {
          const match = t.time_offset?.match(/Day\s*(\d+)/)
          return match ? parseInt(match[1]) : 0
        }).filter(d => d > 0)
        if (dates.length > 0) {
          days = Math.max(...dates)
        }
      }
      const startDate = new Date().toISOString()
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      const payload = {
        title: formData.name,
        subtitle: formData.tagline,
        description: formData.description,
        cover_image: coverImage,
        theme_tags: formData.tags.join(','),
        format,
        location: format === 'offline' ? location : '线上',
        organizer_name: organizerName,
        start_date: startDate,
        end_date: endDate,
        awards_detail: JSON.stringify(formData.awards),
        scoring_dimensions: JSON.stringify(formData.criteria),
        status,
      }

      if (editId) {
        // 编辑时保持原有状态，不修改status字段
        const updatePayload = { ...payload }
        delete (updatePayload as any).status
        await axios.patch(`/api/v1/hackathons/${editId}`, updatePayload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post('/api/v1/hackathons', payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      navigate('/events')
    } catch (e: any) {
      console.error('Submit error:', e)
      console.error('Error response:', e.response?.data)
      const errorDetail = e.response?.data?.detail
      if (Array.isArray(errorDetail)) {
        // Pydantic validation error
        setError(errorDetail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join('\n'))
      } else {
        setError(errorDetail || e.message || '提交失败')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) return null
  
  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200">
      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-md bg-[#050505]/80 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm flex items-center gap-2"
              >
                ← 返回
              </button>
              <div>
                <h1 className="text-lg font-semibold text-zinc-100">
                  {editId ? '编辑活动' : '创建活动'}
                </h1>
                <p className="text-xs text-zinc-500 font-mono tracking-wide">
                  AI-NATIVE HACKATHON PLATFORM
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 font-mono">
                {currentUser?.full_name || 'Organizer'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Main Content (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* AI Command Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-[16px] p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    {aiCommand.isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-brand" />
                    )}
                    <span className="text-xs font-mono tracking-wider">AI 闪电生成</span>
                  </div>
                  <input
                    ref={cmdInputRef}
                    type="text"
                    value={aiCommand.query}
                    onChange={(e) => setAiCommand(prev => ({ ...prev, query: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAIGenerate()}
                    placeholder="描述您的黑客松想法，例如：'AI 驱动的可持续发展黑客松'"
                    className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
                    disabled={aiCommand.isGenerating}
                  />
                  <button
                    onClick={handleAIGenerate}
                    disabled={aiCommand.isGenerating || !aiCommand.query.trim()}
                    className="px-4 py-2 bg-brand/20 border border-brand/30 text-brand text-xs font-medium rounded-[12px] hover:bg-brand/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Wand2 className="w-3 h-3" />
                    Generate
                  </button>
                </div>

                {/* Generating Animation */}
                <AnimatePresence>
                  {aiCommand.isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-zinc-800"
                    >
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                            className="h-full bg-gradient-to-r from-brand via-brand/70 to-brand"
                          />
                        </div>
                        <span className="font-mono">AI 正在构建活动框架...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Module 1: Basic Info */}
            <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-zinc-500" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  基本信息 / Basic Info
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    活动名称 / Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：2026 AI 创新黑客松"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[12px] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    一句话简介 / Tagline *
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="用一句话概括活动的核心价值"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[12px] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    标签 / Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <AnimatePresence>
                      {formData.tags.map((tag) => (
                        <motion.div
                          key={tag}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-[12px] text-xs text-zinc-400 flex items-center gap-2"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-zinc-600 hover:text-zinc-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="输入标签后按回车"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag((e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                      className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-[12px] px-4 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Module 2: Description */}
            <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-zinc-500" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  活动详情 / Description
                </h2>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  详细描述 / Detailed Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="支持 Markdown 语法..."
                  rows={10}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[12px] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition-colors resize-none font-mono"
                />
                <p className="text-[10px] text-zinc-600 mt-2 font-mono">
                  提示：支持 Markdown 语法，可使用 # 标题、**粗体**、- 列表等
                </p>
              </div>
            </section>

            {/* Module 3: Timeline */}
            <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                    日程安排 / Timeline
                  </h2>
                </div>
                <button
                  onClick={addTimelinePhase}
                  className="p-2 hover:bg-zinc-900 rounded-[12px] transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {formData.timeline.map((phase, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="bg-zinc-900/30 border border-zinc-800 rounded-[12px] p-4 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={phase.phase}
                            onChange={(e) => updateTimeline(idx, 'phase', e.target.value)}
                            placeholder="阶段名称"
                            className="bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                          />
                          <input
                            type="text"
                            value={phase.time_offset}
                            onChange={(e) => updateTimeline(idx, 'time_offset', e.target.value)}
                            placeholder="时间偏移 (如：Day 0)"
                            className="bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                          />
                          <input
                            type="text"
                            value={phase.description}
                            onChange={(e) => updateTimeline(idx, 'description', e.target.value)}
                            placeholder="描述"
                            className="bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                          />
                        </div>
                        <button
                          onClick={() => removeTimeline(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/20 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* Module 4: Criteria */}
            <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Target className="w-4 h-4 text-zinc-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                    评审标准 / Criteria
                  </h2>
                </div>
                <button
                  onClick={addCriteria}
                  className="p-2 hover:bg-zinc-900 rounded-[12px] transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {formData.criteria.map((dim, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-zinc-900/30 border border-zinc-800 rounded-[12px] p-4 group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="text"
                          value={dim.dimension}
                          onChange={(e) => updateCriteria(idx, 'dimension', e.target.value)}
                          placeholder="维度名称"
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={dim.weight}
                            onChange={(e) => updateCriteria(idx, 'weight', parseInt(e.target.value) || 0)}
                            placeholder="权重"
                            className="w-16 bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 text-center"
                          />
                          <span className="text-xs text-zinc-500">%</span>
                        </div>
                        <button
                          onClick={() => removeCriteria(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/20 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                      <textarea
                        value={dim.description}
                        onChange={(e) => updateCriteria(idx, 'description', e.target.value)}
                        placeholder="详细描述..."
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-400 placeholder-zinc-600 outline-none focus:border-zinc-700 resize-none"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Weight Summary */}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-mono">总权重</span>
                <span className={`font-mono ${
                  formData.criteria.reduce((sum, c) => sum + c.weight, 0) === 100
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {formData.criteria.reduce((sum, c) => sum + c.weight, 0)}%
                </span>
              </div>
            </section>

            {/* Module 5: Awards */}
            <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-zinc-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                    奖项设置 / Awards
                  </h2>
                </div>
                <button
                  onClick={addAward}
                  className="p-2 hover:bg-zinc-900 rounded-[12px] transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {formData.awards.map((award, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-zinc-900/30 border border-zinc-800 rounded-[12px] p-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={award.name}
                          onChange={(e) => updateAward(idx, 'name', e.target.value)}
                          placeholder="奖项名称"
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">奖金</span>
                          <input
                            type="number"
                            value={award.prize_pool}
                            onChange={(e) => updateAward(idx, 'prize_pool', parseInt(e.target.value) || 0)}
                            className="w-24 bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 text-right"
                          />
                          <span className="text-xs text-zinc-500">元</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">名额</span>
                          <input
                            type="number"
                            value={award.quota}
                            onChange={(e) => updateAward(idx, 'quota', parseInt(e.target.value) || 1)}
                            className="w-16 bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 text-center"
                          />
                        </div>
                        <button
                          onClick={() => removeAward(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/20 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Total Prize Pool */}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-mono">总奖金池</span>
                <span className="text-brand font-mono">
                  ¥ {(formData.awards.reduce((sum, a) => sum + a.prize_pool * a.quota, 0)).toLocaleString()}
                </span>
              </div>
            </section>

          </div>

          {/* Right Column - Sidebar (4 cols) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Sticky Container */}
            <div className="sticky top-24 space-y-6">
              
              {/* Format & Location */}
              <div className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-5">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  活动形式 / Format
                </h3>
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFormat('online')}
                    className={`flex-1 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                      format === 'online'
                        ? 'bg-brand/20 border border-brand/30 text-brand'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <Globe className="w-3 h-3 inline mr-1.5" />
                    线上
                  </button>
                  <button
                    onClick={() => setFormat('offline')}
                    className={`flex-1 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                      format === 'offline'
                        ? 'bg-brand/20 border border-brand/30 text-brand'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <MapPin className="w-3 h-3 inline mr-1.5" />
                    线下
                  </button>
                </div>

                {format === 'offline' && (
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="活动地点"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                  />
                )}

                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    主办方名称
                  </label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="主办方名称"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    实时预览 / Preview
                  </h3>
                  <AIGenerateImageButton
                    buttonText="AI 生图"
                    scene="cover"
                    context={formData.name || '黑客松活动'}
                    onImageGenerated={(url) => setCoverImage(url)}
                    className="text-xs px-3 py-1.5"
                  />
                </div>
                
                <div 
                  className="aspect-video bg-zinc-900 border border-zinc-800 rounded-[12px] overflow-hidden relative group"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {coverImage ? (
                    <>
                      <img
                        src={coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      {/* Upload Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2 bg-brand hover:bg-brand/90 text-black text-xs font-medium rounded-[12px] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <Upload className="w-3 h-3" />
                          {uploading ? '上传中...' : '更换图片'}
                        </button>
                        <button
                          onClick={() => setCoverImage('')}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-[12px] transition-colors flex items-center gap-2"
                        >
                          <X className="w-3 h-3" />
                          移除
                        </button>
                      </div>
                    </>
                  ) : (
                    <div 
                      className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/80 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center p-4">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-zinc-500" />
                        </div>
                        <p className="text-xs text-zinc-400 mb-1">点击或拖拽上传图片</p>
                        <p className="text-[10px] text-zinc-600">支持 JPG、PNG 格式，最大 5MB</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file)
                      }
                    }}
                    className="hidden"
                  />
                  
                  {/* Upload Loading Overlay */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto mb-2" />
                        <p className="text-xs text-zinc-400">图片上传中...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <h4 className="text-xs font-semibold text-white line-clamp-1">
                      {formData.name || '活动名称'}
                    </h4>
                    <p className="text-[10px] text-zinc-400 line-clamp-1 mt-1">
                      {formData.tagline || '活动简介'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/50 rounded-[12px] p-3">
                    <div className="text-[10px] text-zinc-500 mb-1">评审维度</div>
                    <div className="text-sm font-semibold text-zinc-300">
                      {formData.criteria.length} 项
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-[12px] p-3">
                    <div className="text-[10px] text-zinc-500 mb-1">奖项数量</div>
                    <div className="text-sm font-semibold text-zinc-300">
                      {formData.awards.length} 个
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-[12px] p-3">
                    <div className="text-[10px] text-zinc-500 mb-1">日程节点</div>
                    <div className="text-sm font-semibold text-zinc-300">
                      {formData.timeline.length} 个
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-[12px] p-3">
                    <div className="text-[10px] text-zinc-500 mb-1">标签</div>
                    <div className="text-sm font-semibold text-zinc-300">
                      {formData.tags.length} 个
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-5 space-y-3">
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-[12px] text-red-400 text-xs">
                    {error}
                  </div>
                )}

                <button
                  onClick={() => handleSubmit('published')}
                  disabled={loading}
                  className="w-full py-3 bg-brand hover:bg-brand/90 text-black text-sm font-medium rounded-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                >
                  <Rocket className="w-4 h-4" />
                  {loading ? '发布中...' : '发布活动'}
                </button>

                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-sm font-medium rounded-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存为草稿
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
