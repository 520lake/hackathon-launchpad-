import { useState, useEffect } from 'react'
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

const PrizeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

export default function ProfilePage() {
  const navigate = useNavigate()
  const context = useOutletContext<OutletContextType>()
  const isLoggedIn = context?.isLoggedIn ?? false
  const currentUser = context?.currentUser ?? null
  const fetchCurrentUser = context?.fetchCurrentUser ?? (() => {})
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'account' | 'notifications'>('profile')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [myHackathons, setMyHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
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
  const availableTopics = ['AI', '可持续发展', 'Web3', '物联网', '大数据', '区块链', '云计算', '元宇宙', '智能制造', '金融科技']

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
    } else if (activeTab !== 'notifications' && window.location.pathname === '/notifications') {
      navigate('/profile')
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
        setMyHackathons(hackRes.data || [])
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

  const handleDeleteAccount = async () => {
    if (!confirm('确定要删除账号吗？此操作不可恢复！')) return
    if (!confirm('再次确认：删除账号将清除所有数据，确定继续？')) return
    
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await axios.delete('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.removeItem('token')
      navigate('/')
    } catch (e: any) {
      console.error(e)
      alert(e.response?.data?.detail || '删除失败')
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

  if (!isLoggedIn) return null

  const menuItems = [
    { id: 'profile', label: '个人资料', icon: <UserIcon /> },
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-[#FBBF24] font-mono">//</span>
            个人中心
          </h1>
        </motion.div>

        {/* Main Layout - Left 20% / Right 80% */}
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-all rounded-md ${
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
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-8">
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
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border-2 border-[#333] flex items-center justify-center overflow-hidden">
                            {editForm.avatar_url ? (
                              <img src={editForm.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon />
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="text-gray-400 text-sm mb-1 block">头像链接</label>
                            <input
                              type="text"
                              value={editForm.avatar_url}
                              onChange={e => setEditForm({...editForm, avatar_url: e.target.value})}
                              placeholder="输入图片URL"
                              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                            />
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-gray-400 text-sm mb-1 block">姓名</label>
                            <input
                              type="text"
                              value={editForm.full_name}
                              onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm mb-1 block">昵称</label>
                            <input
                              type="text"
                              value={editForm.nickname}
                              onChange={e => setEditForm({...editForm, nickname: e.target.value})}
                              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm mb-1 block">城市</label>
                            <input
                              type="text"
                              value={editForm.city}
                              onChange={e => setEditForm({...editForm, city: e.target.value})}
                              placeholder="如：上海"
                              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm mb-1 block">手机号</label>
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={e => setEditForm({...editForm, phone: e.target.value})}
                              placeholder="+86 138****8888"
                              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">个人简介</label>
                          <textarea
                            value={editForm.bio}
                            onChange={e => setEditForm({...editForm, bio: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">技能（用逗号分隔）</label>
                          <input
                            type="text"
                            value={editForm.skills}
                            onChange={e => setEditForm({...editForm, skills: e.target.value})}
                            placeholder="React, Python, AI..."
                            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">兴趣领域（用逗号分隔）</label>
                          <input
                            type="text"
                            value={editForm.interests}
                            onChange={e => setEditForm({...editForm, interests: e.target.value})}
                            placeholder="AI, Web3, 可持续发展..."
                            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-[#333] text-gray-400 text-sm rounded-md hover:text-white transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="px-4 py-2 bg-brand text-black font-medium text-sm rounded-md hover:bg-white transition-colors disabled:opacity-50"
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-[#1A1A1A] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                              <span className="px-3 py-1 bg-brand text-black text-[11px] font-medium rounded">
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
                                <span key={i} className="px-2 py-1 bg-[#222] text-gray-400 text-xs rounded">
                                  {interest.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edit Button */}
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-300 text-sm rounded-md hover:bg-white/[0.05] transition-colors"
                        >
                          <EditIcon />
                          编辑资料
                        </button>
                      </div>
                    )}
                  </div>

                  {/* My Participated Hackathons */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <ArrowLeftIcon />
                        </button>
                        <h3 className="text-white font-semibold">我参与的黑客松</h3>
                        <span className="px-2 py-0.5 bg-[#222] text-gray-400 text-[12px] rounded-full">
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
                            onClick={() => navigate(`/events/${enroll.hackathon_id}`)}
                            className="bg-[#111111] border border-[#222222] rounded-md p-5 cursor-pointer hover:border-[#333] transition-all group"
                          >
                            <div className="flex gap-5">
                              {/* Thumbnail */}
                              <div className="w-20 h-20 bg-[#1A1A1A] rounded-md flex items-center justify-center flex-shrink-0 text-2xl font-bold text-gray-600">
                                {enroll.hackathon?.cover_image ? (
                                  <img src={enroll.hackathon.cover_image} className="w-full h-full rounded-md object-cover" />
                                ) : (
                                  enroll.hackathon?.title?.substring(0, 2) || 'TE'
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                {/* Tags */}
                                <div className="flex items-center gap-2 mb-2">
                                  {enroll.hackathon?.theme_tags?.split(',').slice(0, 2).map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-[#222] text-gray-400 text-[10px] rounded">
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
                          className="mt-4 px-4 py-2 bg-brand text-black text-sm font-medium rounded-md hover:bg-white transition-colors"
                        >
                          去探索活动
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
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-semibold text-lg">感兴趣的话题</h3>
                      <button 
                        onClick={handleSaveProfile}
                        className="text-brand text-sm hover:text-white transition-colors"
                      >
                        保存
                      </button>
                    </div>

                    <p className="text-gray-500 text-sm mb-6">
                      选择你感兴趣的话题，我们将为你推荐相关的黑客松活动。
                    </p>

                    {/* Tag Cloud */}
                    <div className="flex flex-wrap gap-3">
                      {availableTopics.map(topic => (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                          className={`px-4 py-2 rounded-full text-sm transition-all ${
                            selectedTopics.includes(topic)
                              ? 'bg-white text-black font-medium'
                              : 'bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-8">
                    <h3 className="text-white font-semibold text-lg mb-6">通知设置</h3>
                    
                    <div className="space-y-4">
                      {[
                        { label: '活动提醒', desc: '接收报名活动的开始、截止提醒' },
                        { label: '新活动推送', desc: '接收符合兴趣标签的新活动通知' },
                        { label: '系统公告', desc: '接收平台重要公告和更新' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-[#222]">
                          <div>
                            <div className="text-white text-sm">{item.label}</div>
                            <div className="text-gray-500 text-[12px]">{item.desc}</div>
                          </div>
                          <button className="w-12 h-6 bg-brand rounded-full relative">
                            <span className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full" />
                          </button>
                        </div>
                      ))}
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
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[11px] rounded">
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
                        className="text-gray-500 text-sm hover:text-white transition-colors"
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
                        className="text-gray-500 text-sm hover:text-white transition-colors"
                      >
                        修改密码
                      </button>
                    </div>

                    {/* Third-party Login */}
                    <div className="flex items-center justify-between p-6 border-b border-[#222]">
                      <div>
                        <div className="text-gray-400 text-sm mb-1">第三方登录</div>
                        <div className="text-white text-sm">
                          {currentUser?.wx_openid ? '微信已绑定' : '未绑定第三方账号'}
                        </div>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="flex items-center justify-between p-6">
                      <div>
                        <div className="text-red-400 text-sm mb-1">删除账号</div>
                        <div className="text-gray-500 text-[12px]">删除后将无法恢复，请谨慎操作</div>
                      </div>
                      <button 
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 border border-red-500/50 text-red-400 text-sm rounded-md hover:bg-red-500/10 transition-colors"
                      >
                        删除账号
                      </button>
                    </div>
                  </div>

                  {/* Change Password Modal */}
                  {showChangePassword && (
                    <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6">
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
                            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">新密码</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm mb-1 block">确认新密码</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#333] rounded-md text-white text-sm focus:border-brand outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => setShowChangePassword(false)}
                            className="px-4 py-2 border border-[#333] text-gray-400 text-sm rounded-md hover:text-white transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleChangePassword}
                            className="px-4 py-2 bg-brand text-black font-medium text-sm rounded-md hover:bg-white transition-colors"
                          >
                            确认修改
                          </button>
                        </div>
                      </div>
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
