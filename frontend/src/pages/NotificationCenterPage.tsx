import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Bell, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface Notification {
  id: number
  title: string
  content: string
  type: string
  category: string
  is_read: boolean
  created_at: string
}

export default function NotificationCenterPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchNotifications()
    fetchCategoryCounts()
  }, [categoryFilter])

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setLoading(true)
    try {
      const res = await axios.get('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      })
      setNotifications(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await axios.post(`/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      await axios.post('/api/v1/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (e) {
      console.error(e)
    }
  }

  const deleteNotification = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    if (!confirm('确定要删除这条通知吗？')) return
    
    try {
      await axios.delete(`/api/v1/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
      fetchCategoryCounts()
    } catch (e) {
      console.error(e)
    }
  }

  const fetchCategoryCounts = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const categories = ['activity', 'system', 'promotion', 'general']
      const counts: Record<string, number> = {}
      
      for (const cat of categories) {
        const res = await axios.get('/api/v1/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
          params: { category: cat }
        })
        counts[cat] = res.data.unread_count || 0
      }
      
      setCategoryCounts(counts)
    } catch (e) {
      console.error('Failed to fetch category counts:', e)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'system':
        return <Bell className="w-5 h-5 text-brand" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500/20'
      case 'warning':
        return 'border-yellow-500/20'
      case 'error':
        return 'border-red-500/20'
      case 'system':
        return 'border-brand/20'
      default:
        return 'border-blue-500/20'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-[#FBBF24] font-mono">//</span>
              通知中心
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-black text-[12px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <button
              onClick={() => navigate('/profile')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← 返回个人中心
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            查看所有系统通知、活动提醒和AI协作消息
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-brand text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            全部通知
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-brand text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            未读通知
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-black text-[10px] rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            全部分类
          </button>
          <button
            onClick={() => setCategoryFilter('activity')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
              categoryFilter === 'activity'
                ? 'bg-[#FBBF24] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FBBF24]"></span>
            活动提醒
            {categoryCounts['activity'] > 0 && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded-full text-[10px]">
                {categoryCounts['activity']}
              </span>
            )}
          </button>
          <button
            onClick={() => setCategoryFilter('system')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
              categoryFilter === 'system'
                ? 'bg-[#3B82F6] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
            系统公告
            {categoryCounts['system'] > 0 && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded-full text-[10px]">
                {categoryCounts['system']}
              </span>
            )}
          </button>
          <button
            onClick={() => setCategoryFilter('promotion')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
              categoryFilter === 'promotion'
                ? 'bg-[#10B981] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            新活动推送
            {categoryCounts['promotion'] > 0 && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded-full text-[10px]">
                {categoryCounts['promotion']}
              </span>
            )}
          </button>
          <button
            onClick={() => setCategoryFilter('general')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
              categoryFilter === 'general'
                ? 'bg-gray-600 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-600"></span>
            其他消息
            {categoryCounts['general'] > 0 && (
              <span className="px-1.5 py-0.5 bg-black/30 rounded-full text-[10px]">
                {categoryCounts['general']}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications
                .filter(n => (filter === 'all' || !n.is_read) && (categoryFilter === 'all' || n.category === categoryFilter))
                .map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-[#0A0A0A] border ${getTypeColor(notification.type)} rounded-xl p-5 relative group hover:border-brand/40 transition-all`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`text-base font-semibold ${notification.is_read ? 'text-gray-400' : 'text-white'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                          {notification.content}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-brand hover:text-white transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              标记已读
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            删除
                          </button>
                        </div>
                      </div>
                      
                      {/* Unread Dot */}
                      {!notification.is_read && (
                        <div className="absolute top-5 right-5 w-2 h-2 bg-brand rounded-full animate-pulse" />
                      )}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
            
            {notifications.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">暂无通知</p>
                <p className="text-sm mt-2">系统会在这里推送重要消息</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State Actions */}
        {notifications.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={markAllAsRead}
              className="px-6 py-2 border border-gray-700 text-gray-400 text-sm rounded-md hover:text-white hover:border-gray-600 transition-colors"
            >
              标记全部已读
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
