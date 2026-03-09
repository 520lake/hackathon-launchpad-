import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'

interface Recruitment {
  id: number
  team_id: number
  role: string
  skills: string
  count: number
  description?: string
  contact_info?: string
  status: string
  created_at: string
  team?: {
    id: number
    name: string
    description?: string
    hackathon_id: number
    leader_id: number
    hackathon?: {
      id: number
      title: string
      cover_image?: string
    }
  }
}

export default function CommunityHallPage() {
  const navigate = useNavigate()
  const [recruitments, setRecruitments] = useState<Recruitment[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    role: '',
    skill: '',
    search: ''
  })

  // 角色选项
  const roleOptions = ['前端开发', '后端开发', 'UI/UX设计', '产品经理', '算法工程师', '全栈开发', '移动端开发', 'DevOps', '测试工程师', '其他']
  
  // 技能选项
  const skillOptions = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'TypeScript', 'JavaScript', 'Figma', 'Sketch', 'AI/ML', '区块链', '云计算', '数据库', 'Docker', 'Kubernetes']

  useEffect(() => {
    fetchRecruitments()
  }, [])

  const fetchRecruitments = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/v1/teams/recruitments/all?limit=100')
      setRecruitments(res.data)
    } catch (e) {
      console.error('获取招募信息失败:', e)
    } finally {
      setLoading(false)
    }
  }

  // 过滤招募信息
  const filteredRecruitments = recruitments.filter(r => {
    if (filters.role && !r.role.includes(filters.role)) return false
    if (filters.skill && !r.skills.includes(filters.skill)) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        r.role.toLowerCase().includes(searchLower) ||
        r.skills.toLowerCase().includes(searchLower) ||
        r.team?.name.toLowerCase().includes(searchLower) ||
        r.team?.hackathon?.title.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const handleContact = (contactInfo: string) => {
    if (contactInfo.includes('@')) {
      window.location.href = `mailto:${contactInfo}`
    } else if (contactInfo.match(/^1[3-9]\d{9}$/)) {
      alert(`联系方式: ${contactInfo}`)
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(contactInfo)
      alert(`联系方式已复制: ${contactInfo}`)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">社区大厅</h1>
            <p className="text-gray-500">发现招募信息，找到你的理想团队</p>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-white hover:text-white transition-colors text-sm"
          >
            浏览活动
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="搜索团队、角色或活动..."
                className="w-full bg-[#111111] border border-[#222222] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#FBBF24]/50 focus:outline-none"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="bg-[#111111] border border-[#222222] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#FBBF24]/50 focus:outline-none"
            >
              <option value="">所有角色</option>
              {roleOptions.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            {/* Skill Filter */}
            <select
              value={filters.skill}
              onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
              className="bg-[#111111] border border-[#222222] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#FBBF24]/50 focus:outline-none"
            >
              <option value="">所有技能</option>
              {skillOptions.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>

            {/* Reset */}
            <button
              onClick={() => setFilters({ role: '', skill: '', search: '' })}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-white transition-colors"
            >
              重置筛选
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#222222]">
            <div className="text-sm">
              <span className="text-gray-500">招募中: </span>
              <span className="text-[#FBBF24] font-medium">{recruitments.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">筛选结果: </span>
              <span className="text-white font-medium">{filteredRecruitments.length}</span>
            </div>
          </div>
        </div>

        {/* Recruitments Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#FBBF24] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRecruitments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecruitments.map((recruitment, idx) => (
              <motion.div
                key={recruitment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden hover:border-[#333333] transition-colors group"
              >
                {/* Hackathon Banner */}
                <div className="h-24 bg-gradient-to-r from-[#1a1a2e] to-[#0f0f1a] relative overflow-hidden">
                  {recruitment.team?.hackathon?.cover_image && (
                    <img
                      src={recruitment.team.hackathon.cover_image}
                      alt=""
                      className="w-full h-full object-cover opacity-30"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">活动</p>
                    <p className="text-sm text-white font-medium truncate">
                      {recruitment.team?.hackathon?.title || '未知活动'}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Team Name */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#FBBF24]">
                        {recruitment.team?.name?.[0] || 'T'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{recruitment.team?.name}</p>
                      <p className="text-[11px] text-gray-500">正在招募</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24] text-xs rounded-full">
                      {recruitment.role}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">需 {recruitment.count} 人</span>
                  </div>

                  {/* Skills */}
                  {recruitment.skills && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {recruitment.skills.split(',').slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#111111] text-gray-400 text-[10px] rounded border border-[#222]"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                      {recruitment.skills.split(',').length > 4 && (
                        <span className="px-2 py-0.5 text-gray-600 text-[10px]">
                          +{recruitment.skills.split(',').length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {recruitment.description && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                      {recruitment.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/events/${recruitment.team?.hackathon_id}`)}
                      className="flex-1 py-2 border border-[#333] text-gray-300 text-xs rounded-lg hover:border-white hover:text-white transition-colors"
                    >
                      查看活动
                    </button>
                    {recruitment.contact_info ? (
                      <button
                        onClick={() => handleContact(recruitment.contact_info!)}
                        className="flex-1 py-2 bg-[#FBBF24] text-black text-xs font-medium rounded-lg hover:bg-white transition-colors"
                      >
                        联系队长
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/events/${recruitment.team?.hackathon_id}`)}
                        className="flex-1 py-2 bg-[#FBBF24] text-black text-xs font-medium rounded-lg hover:bg-white transition-colors"
                      >
                        申请加入
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">暂无招募信息</p>
            <p className="text-gray-600 text-xs mt-1">前往活动页面创建团队并发布招募</p>
          </div>
        )}
      </div>
    </div>
  )
}
