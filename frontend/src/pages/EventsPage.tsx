import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
}

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
  lang: 'zh' | 'en';
}

export default function EventsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { lang } = useOutletContext<OutletContextType>()
  
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    fetchHackathons()
  }, [])

  const fetchHackathons = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/v1/hackathons')
      setHackathons(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 从所有活动中提取唯一标签
  const allThemeTags = Array.from(new Set(
    hackathons.flatMap(h => h.theme_tags?.split(',').map(t => t.trim()).filter(Boolean) || [])
  ))
  
  const allProfTags = Array.from(new Set(
    hackathons.flatMap(h => h.professionalism_tags?.split(',').map(t => t.trim()).filter(Boolean) || [])
  ))

  // 状态分类
  const statusCategories = [
    { key: 'all', label: '全部活动', count: hackathons.length },
    { key: 'registration', label: '报名中', count: hackathons.filter(h => h.status === 'registration').length },
    { key: 'ongoing', label: '进行中', count: hackathons.filter(h => h.status === 'ongoing').length },
    { key: 'judging', label: '评审中', count: hackathons.filter(h => h.status === 'judging').length },
    { key: 'completed', label: '已结束', count: hackathons.filter(h => h.status === 'completed').length },
  ]

  // 筛选逻辑
  const filteredHackathons = hackathons.filter(h => {
    const matchesSearch = !searchQuery || 
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || h.status === statusFilter
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => 
      h.theme_tags?.includes(tag) || h.professionalism_tags?.includes(tag)
    )
    return matchesSearch && matchesStatus && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'ongoing': return 'bg-sky-500/20 text-sky-400 border-sky-500/30'
      case 'judging': return 'bg-violet-500/20 text-violet-400 border-violet-500/30'
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-brand/20 text-brand border-brand/30'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'registration': '报名中',
      'ongoing': '进行中',
      'judging': '评审中',
      'completed': '已结束'
    }
    return statusMap[status] || status
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-white transition-colors duration-200 text-[12px] tracking-wide"
              >
                ← 返回首页
              </button>
              <span className="text-gray-600">/</span>
              <span className="text-[#FBBF24] text-[12px] tracking-wide">活动大厅</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-[#FBBF24] font-mono">//</span>
              活动大厅
            </h1>
            <p className="text-gray-400 mt-2 text-[14px]">探索正在进行的黑客松活动，找到适合你的挑战</p>
          </motion.div>
        </div>

        {/* 左右分栏布局 */}
        <div className="flex gap-8">
          {/* 左侧分类导航 20% */}
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* 搜索框 */}
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索活动..."
                  className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-3 py-2.5 text-[13px] text-white placeholder-gray-600 focus:border-[#FBBF24]/50 outline-none transition-colors duration-200"
                />
              </div>

              {/* 活动状态分类 */}
              <div>
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 px-1">活动状态</div>
                <div className="space-y-1">
                  {statusCategories.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setStatusFilter(cat.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-md transition-colors duration-200 ${
                        statusFilter === cat.key 
                          ? 'bg-[#FBBF24]/10 text-[#FBBF24]' 
                          : 'text-gray-400 hover:text-white hover:bg-[#111111]'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[11px] font-mono ${statusFilter === cat.key ? 'text-[#FBBF24]' : 'text-gray-600'}`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 主题标签分类 */}
              {allThemeTags.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 px-1">主题标签</div>
                  <div className="space-y-1">
                    {allThemeTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-md transition-colors duration-200 ${
                          selectedTags.includes(tag)
                            ? 'bg-[#FBBF24]/10 text-[#FBBF24]'
                            : 'text-gray-500 hover:text-white hover:bg-[#111111]'
                        }`}
                      >
                        <span className={`w-3 h-3 border rounded flex items-center justify-center text-[8px] ${
                          selectedTags.includes(tag) 
                            ? 'border-[#FBBF24] bg-[#FBBF24] text-black' 
                            : 'border-[#333]'
                        }`}>
                          {selectedTags.includes(tag) && '✓'}
                        </span>
                        <span>#{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 专业领域标签 */}
              {allProfTags.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 px-1">专业领域</div>
                  <div className="space-y-1">
                    {allProfTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-md transition-colors duration-200 ${
                          selectedTags.includes(tag)
                            ? 'bg-gray-500/20 text-white'
                            : 'text-gray-500 hover:text-white hover:bg-[#111111]'
                        }`}
                      >
                        <span className={`w-3 h-3 border rounded flex items-center justify-center text-[8px] ${
                          selectedTags.includes(tag) 
                            ? 'border-gray-400 bg-gray-500 text-white' 
                            : 'border-[#333]'
                        }`}>
                          {selectedTags.includes(tag) && '✓'}
                        </span>
                        <span>#{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 清除筛选 */}
              {(selectedTags.length > 0 || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedTags([])
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                  className="w-full text-[11px] text-gray-500 hover:text-[#FBBF24] py-2 transition-colors duration-200"
                >
                  清除所有筛选
                </button>
              )}
            </div>
          </div>

          {/* 右侧活动列表 80% */}
          <div className="flex-1 min-w-0">
            {/* 当前筛选状态 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-gray-600">
                  共找到 <span className="text-white font-mono">{filteredHackathons.length}</span> 个活动
                </span>
                {selectedTags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-600">筛选:</span>
                    {selectedTags.map(tag => (
                      <span 
                        key={tag}
                        className="px-2 py-0.5 text-[10px] bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20 rounded-md cursor-pointer hover:bg-[#FBBF24]/20 transition-colors duration-200"
                        onClick={() => toggleTag(tag)}
                      >
                        #{tag} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hackathons Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-2 border-[#FBBF24] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredHackathons.map((hackathon, idx) => (
                  <motion.div
                    key={hackathon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    onClick={() => navigate(`/events/${hackathon.id}`)}
                    className="group cursor-pointer bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden hover:border-[#333] transition-colors duration-200"
                  >
                    {/* Cover Image */}
                    <div className="h-36 bg-[#111111] relative overflow-hidden rounded-t-xl">
                      {hackathon.cover_image ? (
                        <img 
                          src={hackathon.cover_image} 
                          alt={hackathon.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl font-black">
                          {hackathon.title[0]}
                        </div>
                      )}
                      <div className={`absolute top-3 right-3 px-2 py-1 text-[10px] rounded-md border ${getStatusColor(hackathon.status)}`}>
                        {getStatusText(hackathon.status)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Tags */}
                      {hackathon.theme_tags && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {hackathon.theme_tags.split(',').slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[10px] text-[#FBBF24]/70">#{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                      <h3 className="text-[14px] font-semibold text-white group-hover:text-[#FBBF24] transition-colors duration-200 mb-2 line-clamp-1">
                        {hackathon.title}
                      </h3>
                      <p className="text-[12px] text-gray-500 line-clamp-2 mb-3 font-light">
                        {hackathon.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-600">
                        <span className="font-mono">
                          {new Date(hackathon.start_date).toLocaleDateString('zh-CN')}
                        </span>
                        <span>→</span>
                        <span className="font-mono">
                          {new Date(hackathon.end_date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredHackathons.length === 0 && (
              <div className="text-center py-32 bg-[#0A0A0A] border border-[#222222] rounded-xl">
                <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase mb-4">暂无匹配的活动</div>
                <button
                  onClick={() => {
                    setSelectedTags([])
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                  className="text-[12px] text-[#FBBF24] hover:text-white transition-colors duration-200"
                >
                  清除筛选条件
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
