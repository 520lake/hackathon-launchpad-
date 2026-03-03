import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

interface OutletContextType {
  isLoggedIn: boolean
  currentUser: any
  fetchCurrentUser: () => void
  lang: 'zh' | 'en'
}

// Interfaces
interface AwardItem {
  type: 'cash' | 'other' | 'mixed'
  name: string
  count: number
  amount?: number
  prize?: string
}

interface ScoringDimension {
  name: string
  description: string
  weight: number
}

interface SponsorItem {
  name: string
  logo: string
  url: string
}

export default function CreateHackathonPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { isLoggedIn, currentUser, lang } = useOutletContext<OutletContextType>()

  // Step control (1-4)
  const [currentStep, setCurrentStep] = useState(1)
  const steps = [
    { num: 1, label: '基本信息' },
    { num: 2, label: '详细信息' },
    { num: 3, label: '日程安排' },
    { num: 4, label: '预览发布' },
  ]

  // Form states - Step 1: Basic Info
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [themeTags, setThemeTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [format, setFormat] = useState<'online' | 'offline'>('online')
  const [location, setLocation] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')

  // Step 2: Detailed Info
  const [description, setDescription] = useState('')
  const [organizerName, setOrganizerName] = useState('')
  const [organizerLogos, setOrganizerLogos] = useState<string[]>([])
  const [scoringDimensions, setScoringDimensions] = useState<ScoringDimension[]>([
    { name: '技术实现', description: '', weight: 60 },
    { name: '创新性', description: '', weight: 40 },
  ])
  const [awards, setAwards] = useState<AwardItem[]>([
    { type: 'cash', name: '金奖', count: 1, amount: 10000, prize: '' },
    { type: 'cash', name: '银奖', count: 2, amount: 5000, prize: '' },
  ])

  // Step 3: Schedule
  const [registrationStartDate, setRegistrationStartDate] = useState('')
  const [registrationEndDate, setRegistrationEndDate] = useState('')
  const [submissionStartDate, setSubmissionStartDate] = useState('')
  const [submissionEndDate, setSubmissionEndDate] = useState('')
  const [judgingStartDate, setJudgingStartDate] = useState('')
  const [judgingEndDate, setJudgingEndDate] = useState('')

  // Other states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/')
      return
    }
    checkUserVerification()
    if (editId) {
      loadHackathonData(editId)
    }
  }, [isLoggedIn, editId])

  const checkUserVerification = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const res = await axios.get('/api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsVerified(res.data.is_verified)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadHackathonData = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/v1/hackathons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data
      setTitle(data.title || '')
      setSubtitle(data.subtitle || '')
      setCoverImage(data.cover_image || '')
      setThemeTags(data.theme_tags ? data.theme_tags.split(',').map((t: string) => t.trim()) : [])
      setFormat(data.format || 'online')
      setLocation(data.location || '')
      setDescription(data.description || '')
      setOrganizerName(data.organizer_name || '')
      
      if (data.scoring_dimensions) {
        try { setScoringDimensions(JSON.parse(data.scoring_dimensions)) } catch {}
      }
      if (data.awards_detail) {
        try { setAwards(JSON.parse(data.awards_detail)) } catch {}
      }
      
      const fmt = (d: string) => d ? new Date(d).toISOString().split('T')[0] : ''
      setRegistrationStartDate(fmt(data.registration_start_date))
      setRegistrationEndDate(fmt(data.registration_end_date))
      setSubmissionStartDate(fmt(data.submission_start_date))
      setSubmissionEndDate(fmt(data.submission_end_date))
      setJudgingStartDate(fmt(data.judging_start_date))
      setJudgingEndDate(fmt(data.judging_end_date))
    } catch (e) {
      console.error(e)
    }
  }

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')
    const res = await axios.post('/api/v1/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
    })
    return res.data.url
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await uploadImage(e.target.files[0])
        setCoverImage(url)
      } catch { setError('上传失败') }
    }
  }

  const addTag = () => {
    if (newTag.trim() && !themeTags.includes(newTag.trim())) {
      setThemeTags([...themeTags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setThemeTags(themeTags.filter(t => t !== tag))
  }

  const addScoringDimension = () => {
    setScoringDimensions([...scoringDimensions, { name: '', description: '', weight: 0 }])
  }

  const updateDimension = (index: number, field: keyof ScoringDimension, value: any) => {
    const updated = [...scoringDimensions]
    updated[index] = { ...updated[index], [field]: value }
    setScoringDimensions(updated)
  }

  const removeDimension = (index: number) => {
    setScoringDimensions(scoringDimensions.filter((_, i) => i !== index))
  }

  const addAward = () => {
    setAwards([...awards, { type: 'cash', name: '', count: 1, amount: 0, prize: '' }])
  }

  const updateAward = (index: number, field: keyof AwardItem, value: any) => {
    const updated = [...awards]
    updated[index] = { ...updated[index], [field]: value }
    setAwards(updated)
  }

  const removeAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index))
  }

  const validateStep = (step: number): boolean => {
    setError('')
    if (step === 1) {
      if (!title) { setError('请填写活动名称'); return false }
      if (!subtitle) { setError('请填写简短描述'); return false }
    }
    if (step === 2) {
      if (!description) { setError('请填写活动详情'); return false }
    }
    if (step === 3) {
      if (!registrationStartDate || !registrationEndDate) { setError('请填写报名时间'); return false }
      if (!submissionStartDate || !submissionEndDate) { setError('请填写提交时间'); return false }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1))
    setError('')
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (status === 'published' && !isVerified) {
      setError('发布活动需先完成实名认证')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const dates = [registrationStartDate, registrationEndDate, submissionStartDate, submissionEndDate, judgingStartDate, judgingEndDate]
        .filter(Boolean).map(d => new Date(d).getTime())
      const calculatedStartDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : new Date().toISOString()
      const calculatedEndDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : new Date().toISOString()

      const payload = {
        title,
        subtitle,
        description,
        cover_image: coverImage,
        theme_tags: themeTags.join(','),
        format,
        location: format === 'offline' ? `${province} ${city} ${location}`.trim() : '',
        organizer_name: organizerName,
        start_date: calculatedStartDate,
        end_date: calculatedEndDate,
        registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
        registration_end_date: registrationEndDate ? new Date(registrationEndDate).toISOString() : null,
        submission_start_date: submissionStartDate ? new Date(submissionStartDate).toISOString() : null,
        submission_end_date: submissionEndDate ? new Date(submissionEndDate).toISOString() : null,
        judging_start_date: judgingStartDate ? new Date(judgingStartDate).toISOString() : null,
        judging_end_date: judgingEndDate ? new Date(judgingEndDate).toISOString() : null,
        awards_detail: JSON.stringify(awards),
        scoring_dimensions: JSON.stringify(scoringDimensions),
        status
      }

      if (editId) {
        await axios.patch(`/api/v1/hackathons/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post('/api/v1/hackathons', payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      navigate('/events')
    } catch (e: any) {
      setError(e.response?.data?.detail || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) return null

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Banner */}
      <div className="relative h-[280px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2a] via-[#0d1020] to-black">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] bg-cover" />
          </div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 max-w-7xl mx-auto w-full">
          <h1 className="text-3xl font-bold text-white mb-6">创建活动</h1>
          
          {/* Steps Indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <button
                  onClick={() => currentStep > step.num && setCurrentStep(step.num)}
                  className={`flex items-center gap-2 transition-colors duration-200 ${
                    currentStep === step.num 
                      ? 'text-white' 
                      : currentStep > step.num 
                        ? 'text-gray-400 cursor-pointer hover:text-white' 
                        : 'text-gray-600'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.num 
                      ? 'bg-[#FBBF24] text-black' 
                      : currentStep > step.num 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-800 text-gray-500'
                  }`}>
                    {step.num}
                  </span>
                  <span className="text-sm">{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`w-12 h-px mx-3 ${currentStep > step.num ? 'bg-gray-600' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-8"
            >
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-[#FBBF24] text-sm mb-2">
                    活动名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="例如：2026 夏季极客马拉松"
                    className="w-full bg-[#111111] border border-white/10 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:border-[#FBBF24]/50 outline-none transition-colors"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-[#FBBF24] text-sm mb-2">
                    简短描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    placeholder="一句话介绍这个活动的亮点..."
                    rows={3}
                    className="w-full bg-[#111111] border border-white/10 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:border-[#FBBF24]/50 outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Detailed Info */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Edit Mode Tag */}
              <div className="inline-flex items-center px-3 py-1 bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-md text-[#FBBF24] text-sm">
                编辑黑客松
              </div>

              <div className="flex gap-6">
                {/* Left Column - Main Content */}
                <div className="flex-1 space-y-6">
                  {/* Description */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">背景与愿景</span>
                      <span className="px-2 py-1 bg-[#1A1A1A] text-gray-500 text-[11px] rounded">文本</span>
                    </div>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="在此输入 Markdown 文本..."
                      rows={6}
                      className="w-full bg-[#111111] border border-white/10 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:border-[#FBBF24]/50 outline-none transition-colors resize-none"
                    />
                    <div className="flex items-center gap-4 mt-3 text-gray-500">
                      <button className="hover:text-white transition-colors">📷</button>
                      <button className="hover:text-white transition-colors font-bold">B</button>
                      <button className="hover:text-white transition-colors italic">I</button>
                    </div>
                  </div>

                  {/* Scoring Dimensions */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">评审标准</span>
                      <span className="px-2 py-1 bg-[#1A1A1A] text-gray-500 text-[11px] rounded">评审</span>
                    </div>
                    
                    <div className="space-y-4">
                      {scoringDimensions.map((dim, idx) => (
                        <div key={idx} className="bg-[#111111] border border-[#222222] rounded-md p-4">
                          <div className="flex items-center justify-between mb-3">
                            <input
                              type="text"
                              value={dim.name}
                              onChange={e => updateDimension(idx, 'name', e.target.value)}
                              placeholder="维度名称"
                              className="bg-transparent text-white font-medium outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={dim.weight}
                                onChange={e => updateDimension(idx, 'weight', parseInt(e.target.value) || 0)}
                                className="w-16 bg-transparent text-right text-white outline-none"
                              />
                              <span className="text-gray-500">%</span>
                              <button onClick={() => removeDimension(idx)} className="ml-2 text-gray-600 hover:text-red-400">×</button>
                            </div>
                          </div>
                          <textarea
                            value={dim.description}
                            onChange={e => updateDimension(idx, 'description', e.target.value)}
                            placeholder="详细描述..."
                            rows={2}
                            className="w-full bg-transparent text-gray-400 text-sm outline-none resize-none"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={addScoringDimension}
                      className="w-full mt-4 py-3 border border-dashed border-white/10 text-gray-500 rounded-md hover:border-[#FBBF24]/50 hover:text-[#FBBF24] transition-colors"
                    >
                      + 添加评审项
                    </button>
                  </div>

                  {/* Awards */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-medium">奖项设置</span>
                      <span className="px-2 py-1 bg-[#1A1A1A] text-gray-500 text-[11px] rounded">奖项</span>
                    </div>

                    <div className="space-y-4">
                      {awards.map((award, idx) => (
                        <div key={idx} className="bg-[#111111] border border-[#222222] rounded-md p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <span className="text-gray-500 text-sm">奖项名称</span>
                              <input
                                type="text"
                                value={award.name}
                                onChange={e => updateAward(idx, 'name', e.target.value)}
                                placeholder="金奖"
                                className="bg-transparent text-white outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">名额</span>
                              <span className="text-white">x {award.count}</span>
                              <button onClick={() => removeAward(idx)} className="ml-2 text-gray-600 hover:text-red-400">×</button>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <span className="text-gray-500 text-sm">评选标准</span>
                            <input
                              type="text"
                              placeholder="例如：综合评分第一名的团队..."
                              className="w-full mt-2 bg-transparent text-gray-400 text-sm outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <span className="text-gray-500 text-sm">奖品清单</span>
                            <div className="flex items-center gap-2 bg-[#0A0A0A] rounded-md p-2">
                              <span className="px-2 py-1 bg-[#FBBF24] text-black text-[10px] rounded">现金</span>
                              <span className="px-2 py-1 bg-[#333] text-gray-400 text-[10px] rounded">非</span>
                              <input
                                type="text"
                                value={award.type === 'cash' ? '冠军奖金' : award.prize}
                                className="flex-1 bg-transparent text-white text-sm outline-none"
                                readOnly
                              />
                              <span className="text-[#FBBF24]">${award.amount?.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <button className="mt-3 text-gray-500 text-sm hover:text-[#FBBF24] transition-colors">
                            + 添加奖励
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addAward}
                      className="w-full mt-4 py-3 border border-dashed border-white/10 text-gray-500 rounded-md hover:border-[#FBBF24]/50 hover:text-[#FBBF24] transition-colors"
                    >
                      + 添加奖项
                    </button>
                  </div>

                  {/* Add Section Buttons */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6 text-center">
                    <div className="text-gray-500 text-sm mb-4">添加新章节</div>
                    <div className="flex items-center justify-center gap-3">
                      <button className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-md text-gray-400 text-sm hover:border-[#FBBF24]/50 transition-colors">
                        ≡ 文本
                      </button>
                      <button className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-md text-gray-400 text-sm hover:border-[#FBBF24]/50 transition-colors">
                        ≡ 评审标准
                      </button>
                      <button className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-md text-gray-400 text-sm hover:border-[#FBBF24]/50 transition-colors">
                        🏆 奖项设置
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="w-64 space-y-6 flex-shrink-0">
                  {/* Organizer Logos */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <span>🏢</span>
                      <span>主办方</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-24 h-16 bg-[#111111] border border-white/10 rounded-md flex items-center justify-center">
                        <span className="text-gray-600 text-sm">LOGO A</span>
                      </div>
                      <div className="w-24 h-16 bg-[#111111] border border-white/10 rounded-md flex items-center justify-center">
                        <span className="text-gray-600 text-sm">LOGO B</span>
                      </div>
                      <button className="w-8 h-16 bg-[#111111] border border-dashed border-white/10 rounded-md flex items-center justify-center text-gray-600 hover:border-[#FBBF24]/50 transition-colors">
                        +
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <span>🏷️</span>
                      <span>活动标签</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {themeTags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-[#1A1A1A] border border-white/10 rounded-md text-gray-300 text-sm flex items-center gap-2"
                        >
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="text-gray-500 hover:text-red-400">×</button>
                        </span>
                      ))}
                      <button
                        onClick={() => {
                          const tag = prompt('输入新标签')
                          if (tag) { setThemeTags([...themeTags, tag]) }
                        }}
                        className="px-3 py-1 bg-[#1A1A1A] border border-dashed border-white/10 rounded-md text-gray-500 text-sm hover:border-[#FBBF24]/50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <span>📍</span>
                      <span>活动地点</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={province}
                          onChange={e => setProvince(e.target.value)}
                          placeholder="省份"
                          className="flex-1 bg-[#111111] border border-white/10 rounded-md px-3 py-2 text-white text-sm placeholder-gray-600 outline-none"
                        />
                        <input
                          type="text"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          placeholder="城市"
                          className="flex-1 bg-[#111111] border border-white/10 rounded-md px-3 py-2 text-white text-sm placeholder-gray-600 outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="详细地址"
                        className="w-full bg-[#111111] border border-white/10 rounded-md px-3 py-2 text-white text-sm placeholder-gray-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-8"
            >
              <h3 className="text-white font-medium mb-6">日程安排</h3>
              
              <div className="space-y-6">
                {/* Registration Period */}
                <div className="bg-[#111111] border border-[#222222] rounded-md p-5">
                  <div className="text-[#FBBF24] text-sm mb-4">报名阶段</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">开始时间</label>
                      <input
                        type="date"
                        value={registrationStartDate}
                        onChange={e => setRegistrationStartDate(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">截止时间</label>
                      <input
                        type="date"
                        value={registrationEndDate}
                        onChange={e => setRegistrationEndDate(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submission Period */}
                <div className="bg-[#111111] border border-[#222222] rounded-md p-5">
                  <div className="text-sky-400 text-sm mb-4">作品提交</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">开始时间</label>
                      <input
                        type="date"
                        value={submissionStartDate}
                        onChange={e => setSubmissionStartDate(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">截止时间</label>
                      <input
                        type="date"
                        value={submissionEndDate}
                        onChange={e => setSubmissionEndDate(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Judging Period */}
                <div className="bg-[#111111] border border-[#222222] rounded-md p-5">
                  <div className="text-violet-400 text-sm mb-4">评审阶段</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">开始时间</label>
                      <input
                        type="date"
                        value={judgingStartDate}
                        onChange={e => setJudgingStartDate(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">结果公布</label>
                      <input
                        type="date"
                        value={judgingEndDate}
                        onChange={e => setJudgingEndDate(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-md px-3 py-2 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-8"
            >
              <h3 className="text-white font-medium mb-6">预览 & 发布</h3>
              
              <div className="space-y-6">
                {/* Preview Card */}
                <div className="border border-[#222222] rounded-xl overflow-hidden">
                  {coverImage ? (
                    <img src={coverImage} className="w-full h-40 object-cover rounded-t-xl" />
                  ) : (
                    <div className="w-full h-40 bg-[#111111] flex items-center justify-center text-gray-600 rounded-t-xl">
                      暂无封面图
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {themeTags.map(tag => (
                        <span key={tag} className="text-[#FBBF24] text-xs">#{tag}</span>
                      ))}
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">{title || '活动名称'}</h4>
                    <p className="text-gray-500 text-sm">{subtitle || '活动简介'}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#111111] border border-[#222222] rounded-md p-4">
                    <div className="text-gray-500 mb-1">报名时间</div>
                    <div className="text-white">{registrationStartDate} ~ {registrationEndDate}</div>
                  </div>
                  <div className="bg-[#111111] border border-[#222222] rounded-md p-4">
                    <div className="text-gray-500 mb-1">评审维度</div>
                    <div className="text-white">{scoringDimensions.length} 项</div>
                  </div>
                  <div className="bg-[#111111] border border-[#222222] rounded-md p-4">
                    <div className="text-gray-500 mb-1">奖项数量</div>
                    <div className="text-white">{awards.length} 个奖项</div>
                  </div>
                  <div className="bg-[#111111] border border-[#222222] rounded-md p-4">
                    <div className="text-gray-500 mb-1">活动形式</div>
                    <div className="text-white">{format === 'online' ? '线上' : '线下'}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prevStep}
            className={`text-gray-500 text-sm hover:text-white transition-colors ${currentStep === 1 ? 'invisible' : ''}`}
          >
            ← 上一步
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-[#FBBF24] text-black font-medium rounded-md hover:bg-white transition-colors"
            >
              下一步 →
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="px-6 py-3 border border-white/10 text-gray-300 rounded-md hover:bg-[#111111] transition-colors"
              >
                存为草稿
              </button>
              <button
                onClick={() => handleSubmit('published')}
                disabled={loading}
                className="px-8 py-3 bg-[#FBBF24] text-black font-medium rounded-md hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? '发布中...' : '发布活动'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
