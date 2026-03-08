import { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

interface OutletContextType {
  isLoggedIn: boolean
  currentUser: any
  fetchCurrentUser: () => void
  lang?: 'zh' | 'en'
}

interface Enrollment {
  id: number
  hackathon_id: number
  hackathon?: {
    id: number
    title: string
    status: string
    start_date: string
    end_date: string
    cover_image?: string
    location?: string
    theme_tags?: string
    organizer_name?: string
    description?: string
  }
  created_at: string
}

interface Hackathon {
  id: number
  title: string
  status: string
  start_date: string
  end_date: string
  cover_image?: string
  location?: string
  description?: string
  organizer_name?: string
  theme_tags?: string
}

interface OrganizedHackathon extends Hackathon {
  participant_count?: number
  team_count?: number
}

// Icons
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const PreferencesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
)

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const WorkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const EventIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

export default function ProfilePage() {
  const navigate = useNavigate()
  const context = useOutletContext<OutletContextType>()
  const isLoggedIn = context?.isLoggedIn ?? false
  const currentUser = context?.currentUser ?? null
  const fetchCurrentUser = context?.fetchCurrentUser ?? (() => {})
  
  const [activeTab, setActiveTab] = useState<'profile' | 'organized' | 'preferences' | 'account' | 'notifications'>('profile')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [organizedHackathons, setOrganizedHackathons] = useState<OrganizedHackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    nickname: '',
    bio: '',
    city: '',
    phone: '',
    skills: '',
    interests: '',
    avatar_url: ''
  })
  
  // Account settings state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Preferences state
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['AI', '可持续发展', 'Web3'])
  const [customTopic, setCustomTopic] = useState('')
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
    activity_reminder: true,
    new_hackathon_push: true,
    system_announcement: true,
    general_notification: true
  })
  const [availableTopics, setAvailableTopics] = useState(['AI', '可持续发展', 'Web3', '物联网', '大数据', '区块链', '云计算', '元宇宙', '智能制造', '金融科技'])
  
  // Account settings state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivateConfirmText, setDeactivateConfirmText] = useState('')

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/')
      return
    }
    fetchMyData()
    // Initialize edit form with current user data
    if (currentUser) {
      setEditForm({
        full_name: currentUser.full_name || '',
        nickname: currentUser.nickname || '',
        bio: currentUser.bio || '',
        city: currentUser.city || '',
        phone: currentUser.phone || '',
        skills: currentUser.skills || '',
        interests: currentUser.interests || '',
        avatar_url: currentUser.avatar_url || ''
      })
    }
  }, [isLoggedIn, currentUser])

  // Handle navigation to notifications tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      navigate('/notifications')
    }
  }, [activeTab])

  const fetchMyData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch enrollments
      const enrollRes = await axios.get('/api/v1/enrollments/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEnrollments(enrollRes.data || [])
      
      // Fetch my organized hackathons
      try {
        const hackRes = await axios.get('/api/v1/hackathons/my', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setOrganizedHackathons(hackRes.data || [])
      } catch (e) {
        console.log('No organized hackathons')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setSaving(true)
    try {
      await axios.put('/api/v1/users/me', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchCurrentUser()
      setIsEditing(false)
      alert('保存成功')
    } catch (e: any) {
      console.error(e)
      alert(e.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // Image Upload Handler
  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    setUploading(true)
    try {
      // 创建本地预览 URL
      const localUrl = URL.createObjectURL(file)
      setEditForm({...editForm, avatar_url: localUrl})
      
      // TODO: 在实际应用中，这里需要调用后端 API 上传图片
      // const formData = new FormData()
      // formData.append('file', file)
      // const res = await axios.post('/api/v1/upload', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // })
      // setEditForm({...editForm, avatar_url: res.data.url})
    } catch (e: any) {
      alert('图片上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleAvatarUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleSavePreferences = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setSaving(true)
    try {
      await axios.patch('/api/v1/users/me/preferences', {
        notification_settings: notificationSettings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('偏好设置保存成功')
    } catch (e: any) {
      console.error(e)
      alert(e.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的密码不一致')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      alert('新密码至少需要6位')
      return
    }
    
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await axios.post('/api/v1/users/me/change-password', {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('密码修改成功')
      setShowChangePassword(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e: any) {
      console.error(e)
      alert(e.response?.data?.detail || '密码修改失败')
    }
  }

  const handleDeactivateAccount = async () => {
    if (deactivateConfirmText !== '注销账号') {
      alert('请输入"注销账号"以确认操作')
      return
    }
    
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await axios.post('/api/v1/users/me/deactivate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.removeItem('token')
      setShowDeactivateModal(false)
      alert('账号已注销，您现在以游客身份浏览')
      navigate('/')
      window.location.reload()
    } catch (e: any) {
      console.error(e)
      alert(e.response?.data?.detail || '注销失败')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registration':
        return <span className="px-2 py-1 text-[10px] bg-emerald-500 text-white rounded">报名中</span>
      case 'ongoing':
        return <span className="px-2 py-1 text-[10px] bg-sky-500 text-white rounded">进行中</span>
      case 'completed':
        return <span className="px-2 py-1 text-[10px] bg-gray-500 text-white rounded">已结束</span>
      default:
        return <span className="px-2 py-1 text-[10px] bg-emerald-500 text-white rounded">已发布</span>
    }
  }

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const addCustomTopic = () => {
    if (customTopic.trim() && !availableTopics.includes(customTopic.trim())) {
      setAvailableTopics(prev => [...prev, customTopic.trim()])
      setSelectedTopics(prev => [...prev, customTopic.trim()])
      setCustomTopic('')
    }
  }

  const handleSaveTopics = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setSaving(true)
    try {
      await axios.patch('/api/v1/users/me', {
        interests: selectedTopics.join(',')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchCurrentUser()
      alert('话题保存成功，我们将根据您的话题偏好推送相关活动通知')
    } catch (e: any) {
      console.error(e)
      alert(e.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleNotificationSetting = (settingId: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [settingId]: !prev[settingId]
    }))
  }

  if (!isLoggedIn) return null

  const menuItems = [
    { id: 'profile', label: '个人资料', icon: <UserIcon /> },
    { id: 'organized', label: '我发起的活动', icon: <EventIcon /> },
    { id: 'preferences', label: '偏好设置', icon: <PreferencesIcon /> },
    { id: 'account', label: '账号设置', icon: <SettingsIcon /> },
    { id: 'notifications', label: '通知中心', icon: <BellIcon /> },
  ]

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6 py-2">
            <button 
              onClick={() => navigate('/')}
              className="text-ink-dim hover:text-ink transition-colors duration-200 text-sm font-medium tracking-wide flex items-center gap-2 px-4 py-2 hover:bg-surface rounded-[16px]"
            >
              <span>←</span> 返回首页
            </button>
            <span className="text-ink-dim/30">/</span>
            <span className="text-brand text-sm font-bold tracking-wide px-4 py-2 bg-brand/5 rounded-[16px]">个人中心</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-[#FBBF24] font-mono">//</span>
            个人中心
          </h1>
        </motion.div>

        {/* Main Layout - Left 20% / Right 80% */}
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <nav className="sticky top-24 space-y-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-all rounded-[16px] ${
                    activeTab === item.id 
                      ? 'bg-white/[0.08] text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* User Hero Card */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-8">
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold text-lg">编辑个人资料</h3>
                          <button 
                            onClick={() => setIsEditing(false)}
                            className="text-gray-400 hover:text-white"
                          >
                            <CloseIcon />
                          </button>
                        </div>
                        
                        {/* Avatar Upload */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div 
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1A1A1A] border-2 border-[#333] flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand transition-colors relative"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                          >
                            {uploading ? (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : null}
                            {editForm.avatar_url ? (
                              <img src={editForm.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-gray-500">
                                <UserIcon />
                              </div>
                            )}
                            {/* Upload Overlay on Hover */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                              <UploadIcon />
                            </div>
                          </div>
                          <div className="flex-1 w-full">
                            <label className="text-gray-400 text-sm mb-2 block">头像</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex-1 px-4 py-2.5 bg-[#1A1A1A] border border-[#333] text-white text-sm rounded-[16px] hover:border-brand transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <UploadIcon />
                                {uploading ? '上传中...' : '点击上传头像'}
                              </button>
                              {editForm.avatar_url && (
                                <button
                                  type="button"
                                  onClick={() => setEditForm({...editForm, avatar_url: ''})}
                                  className="px-4 py-2.5 bg-red-900/20 border border-red-800/30 text-red-400 text-sm rounded-[16px] hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                                >
                                  <CloseIcon />
                                  移除
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">支持 JPG、PNG 格式，最大 5MB</p>
                          </div>
                        </div>

                        {/* Hidden File Input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleAvatarUpload(file)
                            }
                          }}
                          className="hidden"
                        />

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-gray-400 text-sm mb-1 block">姓名</label>
                            <input
                              type="text"
                              value={editForm.full_name}
                              onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                              className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm mb-1 block">昵称</label>
                            <input
                              type="text"
                              value={editForm.nickname}
                              onChange={e => setEditForm({...editForm, nickname: e.target.value})}
                              className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm mb-1 block">城市</label>
                            <input
                              type="text"
                              value={editForm.city}
                              onChange={e => setEditForm({...editForm, city: e.target.value})}
                              placeholder="如：上海"
                              className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm mb-1 block">手机号</label>
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={e => setEditForm({...editForm, phone: e.target.value})}
                              placeholder="+86 138****8888"
                              className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">个人简介</label>
                          <textarea
                            value={editForm.bio}
                            onChange={e => setEditForm({...editForm, bio: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none resize-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">技能（用逗号分隔）</label>
                          <input
                            type="text"
                            value={editForm.skills}
                            onChange={e => setEditForm({...editForm, skills: e.target.value})}
                            placeholder="React, Python, AI..."
                            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">兴趣领域（用逗号分隔）</label>
                          <input
                            type="text"
                            value={editForm.interests}
                            onChange={e => setEditForm({...editForm, interests: e.target.value})}
                            placeholder="AI, Web3, 可持续发展..."
                            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2.5 border border-[#333] text-gray-400 text-sm rounded-[16px] hover:text-white transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="px-4 py-2.5 bg-brand text-black font-medium text-sm rounded-[16px] hover:bg-white transition-colors disabled:opacity-50"
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-[24px] bg-[#1A1A1A] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {currentUser?.avatar_url ? (
                            <img src={currentUser.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon />
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-2xl font-bold text-white">
                              {currentUser?.full_name || currentUser?.nickname || '未设置姓名'}
                            </h2>
                            {currentUser?.can_create_hackathon && (
                              <span className="px-3 py-1.5 bg-brand text-black text-[11px] font-medium rounded-[16px]">
                                组织者
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-6 text-gray-400 text-sm mb-4">
                            <span className="flex items-center gap-2">
                              <LocationIcon />
                              {currentUser?.city || '未设置城市'}
                            </span>
                            <span className="flex items-center gap-2">
                              <WorkIcon />
                              {currentUser?.skills ? currentUser.skills.split(',')[0] : '未设置技能'}
                            </span>
                          </div>

                          <p className="text-gray-400 text-sm leading-relaxed">
                            {currentUser?.bio || '暂无个人简介'}
                          </p>
                          
                          {currentUser?.interests && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {currentUser.interests.split(',').map((interest: string, i: number) => (
                                <span key={i} className="px-3 py-1.5 bg-[#222] text-gray-400 text-xs rounded-[16px]">
                                  {interest.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edit Button */}
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-gray-300 text-sm rounded-[16px] hover:bg-white/[0.05] transition-colors"
                        >
                          <EditIcon />
                          编辑资料
                        </button>
                      </div>
                    )}
                  </div>

                  {/* My Participated Hackathons */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => navigate('/events')}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <ArrowLeftIcon />
                        </button>
                        <h3 className="text-white font-semibold">我参与的黑客松</h3>
                        <span className="px-3 py-1.5 bg-[#222] text-gray-400 text-[12px] rounded-[16px]">
                          {enrollments.length}
                        </span>
                      </div>
                      <button 
                        onClick={() => navigate('/events')}
                        className="text-gray-500 text-sm hover:text-white transition-colors"
                      >
                        查看更多 →
                      </button>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : enrollments.length > 0 ? (
                      <div className="space-y-4">
                        {enrollments.map(enroll => (
                          <div 
                            key={enroll.id}
                            onClick={() => navigate(`/events/${enroll.hackathon_id}?tab=myproject`)}
                            className="bg-[#111111] border border-[#222222] rounded-[16px] p-5 cursor-pointer hover:border-[#333] transition-all group"
                          >
                            <div className="flex gap-5">
                              {/* Thumbnail */}
                              <div className="w-20 h-20 bg-[#1A1A1A] rounded-[16px] flex items-center justify-center flex-shrink-0 text-2xl font-bold text-gray-600 overflow-hidden">
                                {enroll.hackathon?.cover_image ? (
                                  <img src={enroll.hackathon.cover_image} className="w-full h-full object-cover" />
                                ) : (
                                  enroll.hackathon?.title?.substring(0, 2) || 'TE'
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                {/* Tags */}
                                <div className="flex items-center gap-2 mb-2">
                                  {enroll.hackathon?.theme_tags?.split(',').slice(0, 2).map((tag, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-[#222] text-gray-400 text-[10px] rounded-[16px]">
                                      {tag.trim()}
                                    </span>
                                  ))}
                                </div>
                                
                                <h4 className="text-white font-semibold mb-2 group-hover:text-brand transition-colors">
                                  {enroll.hackathon?.title || `活动 #${enroll.hackathon_id}`}
                                </h4>
                                
                                <p className="text-gray-500 text-sm mb-3 line-clamp-1">
                                  {enroll.hackathon?.description || '暂无描述'}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-gray-500 text-[12px]">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon />
                                    {enroll.hackathon?.start_date ? new Date(enroll.hackathon.start_date).toLocaleDateString('zh-CN') : '待定'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <LocationIcon />
                                    {enroll.hackathon?.location || '线上'}
                                  </span>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="flex flex-col items-end justify-between">
                                {getStatusBadge(enroll.hackathon?.status || 'registration')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">🎯</div>
                        <p>还没有参与任何黑客松</p>
                        <button 
                          onClick={() => navigate('/events')}
                          className="mt-4 px-6 py-3 bg-brand text-black text-sm font-medium rounded-[16px] hover:bg-white transition-colors"
                        >
                          去探索活动
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Organized Hackathons Tab */}
              {activeTab === 'organized' && (
                <motion.div
                  key="organized"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* My Organized Hackathons */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold text-lg">我发起的活动</h3>
                        <span className="px-3 py-1.5 bg-[#222] text-gray-400 text-[12px] rounded-[16px]">
                          {organizedHackathons.length}
                        </span>
                      </div>
                      <button 
                        onClick={() => navigate('/create')}
                        className="px-4 py-2 bg-brand text-black text-sm font-medium rounded-[16px] hover:bg-white transition-colors"
                      >
                        + 发起新活动
                      </button>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : organizedHackathons.length > 0 ? (
                      <div className="space-y-4">
                        {organizedHackathons.map(hackathon => (
                          <div 
                            key={hackathon.id}
                            onClick={() => navigate(`/events/${hackathon.id}?tab=manage`)}
                            className="bg-[#111111] border border-[#222222] rounded-[16px] p-5 cursor-pointer hover:border-[#333] transition-all group"
                          >
                            <div className="flex gap-5">
                              {/* Thumbnail */}
                              <div className="w-20 h-20 bg-[#1A1A1A] rounded-[16px] flex items-center justify-center flex-shrink-0 text-2xl font-bold text-gray-600 overflow-hidden">
                                {hackathon.cover_image ? (
                                  <img src={hackathon.cover_image} className="w-full h-full object-cover" />
                                ) : (
                                  hackathon.title?.substring(0, 2) || 'TE'
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                {/* Tags */}
                                <div className="flex items-center gap-2 mb-2">
                                  {hackathon.theme_tags?.split(',').slice(0, 2).map((tag: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-[#222] text-gray-400 text-[10px] rounded-[16px]">
                                      {tag.trim()}
                                    </span>
                                  ))}
                                  <span className="px-3 py-1.5 bg-brand/10 text-brand text-[10px] rounded-[16px] border border-brand/20">
                                    主办方
                                  </span>
                                </div>
                                
                                <h4 className="text-white font-semibold mb-2 group-hover:text-brand transition-colors">
                                  {hackathon.title || `活动 #${hackathon.id}`}
                                </h4>
                                
                                <p className="text-gray-500 text-sm mb-3 line-clamp-1">
                                  {hackathon.description || '暂无描述'}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-gray-500 text-[12px]">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon />
                                    {hackathon.start_date ? new Date(hackathon.start_date).toLocaleDateString('zh-CN') : '待定'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <LocationIcon />
                                    {hackathon.location || '线上'}
                                  </span>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="flex flex-col items-end justify-between">
                                {getStatusBadge(hackathon.status || 'registration')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">🎉</div>
                        <p>还没有发起任何活动</p>
                        <button 
                          onClick={() => navigate('/create')}
                          className="mt-4 px-6 py-3 bg-brand text-black text-sm font-medium rounded-[16px] hover:bg-white transition-colors"
                        >
                          发起第一个活动
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-semibold text-lg">感兴趣的话题</h3>
                      <button 
                        onClick={handleSaveTopics}
                        disabled={saving}
                        className="text-brand text-sm hover:text-white transition-colors disabled:opacity-50 px-4 py-2 rounded-[16px] hover:bg-brand/5"
                      >
                        {saving ? '保存中...' : '保存话题'}
                      </button>
                    </div>

                    <p className="text-gray-500 text-sm mb-6">
                      选择你感兴趣的话题，我们将为你推荐相关的黑客松活动，并在有相关活动发布时发送通知。
                    </p>

                    {/* Custom Topic Input */}
                    <div className="flex gap-2 mb-6">
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
                        placeholder="输入自定义话题..."
                        className="flex-1 px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-[#FBBF24] outline-none transition-colors"
                      />
                      <button
                        onClick={addCustomTopic}
                        disabled={!customTopic.trim()}
                        className="px-6 py-3 bg-[#FBBF24] text-black text-sm font-medium rounded-[16px] hover:bg-white transition-colors disabled:opacity-50"
                      >
                        添加
                      </button>
                    </div>

                    {/* Tag Cloud */}
                    <div className="flex flex-wrap gap-3">
                      {availableTopics.map(topic => (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                          className={`px-5 py-2.5 rounded-[20px] text-sm transition-all ${
                            selectedTopics.includes(topic)
                              ? 'bg-white text-black font-medium'
                              : 'bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                    
                    {selectedTopics.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#222]">
                        <p className="text-gray-500 text-xs">
                          已选择 {selectedTopics.length} 个话题，当相关活动发布时您将收到通知
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-semibold text-lg">通知偏好设置</h3>
                      <button 
                        onClick={handleSavePreferences}
                        disabled={saving}
                        className="text-brand text-sm hover:text-white transition-colors disabled:opacity-50 px-4 py-2 rounded-[16px] hover:bg-brand/5"
                      >
                        {saving ? '保存中...' : '保存偏好设置'}
                      </button>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-6">
                      管理您希望接收的通知类型。您可以随时在通知中心查看和管理所有通知。
                    </p>
                    
                    <div className="space-y-4">
                      {[
                        { 
                          id: 'activity_reminder', 
                          label: '活动提醒', 
                          desc: '接收报名活动的开始、截止提醒',
                          icon: '⏰',
                          category: 'activity'
                        },
                        { 
                          id: 'new_hackathon_push', 
                          label: '新活动推送', 
                          desc: '接收符合兴趣标签的新活动通知',
                          icon: '🚀',
                          category: 'promotion'
                        },
                        { 
                          id: 'system_announcement', 
                          label: '系统公告', 
                          desc: '接收平台重要公告和更新',
                          icon: '📢',
                          category: 'system'
                        },
                        { 
                          id: 'general_notification', 
                          label: '其他消息', 
                          desc: '接收平台的一般性通知和提醒',
                          icon: '✉️',
                          category: 'general'
                        }
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4 py-4 border-b border-[#222] group hover:bg-[#111] transition-colors rounded-[16px] px-2">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#111] rounded-[16px] flex items-center justify-center text-lg">
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-white text-sm font-medium">{item.label}</div>
                              <span className="px-2 py-0.5 bg-[#222] text-[10px] text-gray-400 rounded font-mono">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-gray-500 text-[12px] leading-relaxed">{item.desc}</div>
                          </div>
                          <button 
                            className={`w-12 h-6 rounded-[16px] relative transition-colors ${
                              notificationSettings[item.id] ? 'bg-[#FBBF24]' : 'bg-gray-600'
                            }`}
                            onClick={() => toggleNotificationSetting(item.id)}
                          >
                            <span className={`absolute top-1 w-4 h-4 bg-black rounded-[12px] transition-all duration-300 ${
                              notificationSettings[item.id] ? 'right-1' : 'left-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[#222]">
                      <button 
                        onClick={() => navigate('/notifications')}
                        className="w-full py-3 border border-[#222] text-gray-400 text-sm rounded-[16px] hover:border-[#FBBF24] hover:text-[#FBBF24] transition-colors flex items-center justify-center gap-2"
                      >
                        <span>🔔</span>
                        前往通知中心管理所有通知
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Account Settings Tab */}
              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden">
                    {/* User ID */}
                    <div className="flex items-center justify-between p-6 border-b border-[#222]">
                      <div>
                        <div className="text-gray-400 text-sm mb-1">用户 ID</div>
                        <div className="text-white font-mono">{currentUser?.id || 'USR_12345678'}</div>
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(currentUser?.id?.toString() || '')}
                        className="text-gray-500 text-sm hover:text-white transition-colors"
                      >
                        复制
                      </button>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between p-6 border-b border-[#222]">
                      <div>
                        <div className="text-gray-400 text-sm mb-1">邮箱</div>
                        <div className="text-white">{currentUser?.email || '未设置'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-[11px] rounded-[16px]">
                          已验证
                        </span>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center justify-between p-6 border-b border-[#222]">
                      <div>
                        <div className="text-gray-400 text-sm mb-1">手机号</div>
                        <div className="text-white">{currentUser?.phone || '未设置'}</div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('profile')}
                        className="text-gray-500 text-sm hover:text-white transition-colors px-4 py-2 rounded-[16px] hover:bg-white/5"
                      >
                        修改
                      </button>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between p-6 border-b border-[#222]">
                      <div>
                        <div className="text-gray-400 text-sm mb-1">密码</div>
                        <div className="text-white">••••••••••••</div>
                      </div>
                      <button 
                        onClick={() => setShowChangePassword(true)}
                        className="text-gray-500 text-sm hover:text-white transition-colors px-4 py-2 rounded-[16px] hover:bg-white/5"
                      >
                        修改密码
                      </button>
                    </div>

                    {/* Third-party Login */}
                    <div className="flex items-center justify-between p-6 border-b border-[#222]">
                      <div>
                        <div className="text-gray-400 text-sm mb-1">第三方登录</div>
                        <div className="flex items-center gap-4">
                          {currentUser?.wx_openid ? (
                            <span className="text-white text-sm flex items-center gap-2">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                              </svg>
                              微信已绑定
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">未绑定第三方账号</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!currentUser?.github_id && (
                          <button 
                            onClick={() => window.location.href = '/api/v1/auth/github'}
                            className="flex items-center gap-2 px-4 py-2 bg-[#24292e] text-white text-sm rounded-[16px] hover:bg-[#2f363d] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            绑定 GitHub
                          </button>
                        )}
                        {currentUser?.github_id && (
                          <span className="text-emerald-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub 已绑定
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Deactivate Account */}
                    <div className="flex items-center justify-between p-6">
                      <div>
                        <div className="text-red-400 text-sm mb-1">注销账号</div>
                        <div className="text-gray-500 text-[12px]">注销后账号将变为游客状态，可重新登录恢复</div>
                      </div>
                      <button 
                        onClick={() => setShowDeactivateModal(true)}
                        className="px-4 py-2 border border-red-500/50 text-red-400 text-sm rounded-[16px] hover:bg-red-500/10 transition-colors"
                      >
                        注销账号
                      </button>
                    </div>
                  </div>

                  {/* Change Password Modal */}
                  {showChangePassword && (
                    <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-semibold">修改密码</h3>
                        <button 
                          onClick={() => setShowChangePassword(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">当前密码</label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">新密码</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">确认新密码</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => setShowChangePassword(false)}
                            className="px-4 py-2.5 border border-[#333] text-gray-400 text-sm rounded-[16px] hover:text-white transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleChangePassword}
                            className="px-4 py-2.5 bg-brand text-black font-medium text-sm rounded-[16px] hover:bg-white transition-colors"
                          >
                            确认修改
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deactivate Account Modal */}
                  {showDeactivateModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0A0A0A] border border-red-500/30 rounded-[24px] p-8 max-w-md w-full"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">注销账号</h3>
                            <p className="text-gray-500 text-sm">此操作将注销您的账号</p>
                          </div>
                        </div>
                        
                        <div className="bg-red-500/10 border border-red-500/20 rounded-[16px] p-4 mb-6">
                          <p className="text-red-300 text-sm leading-relaxed">
                            注销后，您的账号将变为游客状态。您的数据将被保留，您可以随时重新登录恢复账号。
                          </p>
                        </div>

                        <div className="space-y-3 mb-6">
                          <label className="text-gray-400 text-sm">
                            请输入 <span className="text-red-400 font-mono">注销账号</span> 以确认操作
                          </label>
                          <input
                            type="text"
                            value={deactivateConfirmText}
                            onChange={(e) => setDeactivateConfirmText(e.target.value)}
                            placeholder="注销账号"
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-red-500/30 rounded-[16px] text-white text-sm focus:border-red-500 outline-none transition-colors"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowDeactivateModal(false)
                              setDeactivateConfirmText('')
                            }}
                            className="flex-1 px-4 py-3 border border-[#333] text-gray-400 text-sm rounded-[16px] hover:text-white transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleDeactivateAccount}
                            disabled={deactivateConfirmText !== '注销账号'}
                            className="flex-1 px-4 py-3 bg-red-500 text-white text-sm rounded-[16px] hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            确认注销
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
