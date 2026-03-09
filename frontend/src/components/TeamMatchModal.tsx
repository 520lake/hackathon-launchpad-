import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

interface TeamMatchModalProps {
  isOpen: boolean
  onClose: () => void
  hackathonId: number
}

interface MatchResult {
  user_id: number
  name: string
  skills: string
  interests: string
  personality: string
  bio: string
  match_reason: string
  match_score: number
  avatar_url?: string
}

export default function TeamMatchModal({ isOpen, onClose, hackathonId }: TeamMatchModalProps) {
  const [requirements, setRequirements] = useState('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [error, setError] = useState('')

  const handleMatch = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/v1/ai/team-match', {
        hackathon_id: hackathonId,
        requirements: requirements || '寻找合适的队友'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMatches(res.data.matches || [])
    } catch (e: any) {
      setError(e.response?.data?.detail || '匹配失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleContact = (userId: number) => {
    // 这里可以实现联系功能，比如打开聊天窗口或显示联系方式
    alert(`已发送组队邀请给用户 #${userId}`)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:max-h-[85vh] bg-[#0A0A0A] border border-[#222222] rounded-xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#FBBF24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">智能组队匹配</h3>
                  <p className="text-[11px] text-gray-500">AI 根据您的技能和兴趣推荐最佳队友</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Input Section */}
              <div className="mb-6">
                <label className="block text-[12px] text-gray-400 mb-2 uppercase tracking-wider">
                  描述您需要的队友
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="例如：寻找有前端开发经验的队友，熟悉 React 和 TypeScript，有黑客松参赛经验者优先..."
                  className="w-full h-24 bg-[#111111] border border-[#222222] rounded-lg px-4 py-3 text-[13px] text-white placeholder-gray-600 focus:border-[#FBBF24]/50 focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[11px] text-gray-500">
                    描述越详细，匹配结果越精准
                  </p>
                  <button
                    onClick={handleMatch}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-[#FBBF24] text-black text-[13px] font-medium rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        匹配中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        开始匹配
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-[12px] text-red-400">{error}</p>
                </div>
              )}

              {/* Results Section */}
              {matches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      匹配结果
                      <span className="px-2 py-0.5 bg-[#FBBF24]/10 text-[#FBBF24] text-[11px] rounded">
                        {matches.length} 位推荐
                      </span>
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {matches.map((match, idx) => (
                      <motion.div
                        key={match.user_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[#111111] border border-[#222222] rounded-lg p-4 hover:border-[#333333] transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {match.avatar_url ? (
                              <img src={match.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-bold text-gray-500">{match.name[0]}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h5 className="text-white font-medium">{match.name}</h5>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#FBBF24]/10 rounded">
                                <svg className="w-3 h-3 text-[#FBBF24]" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-[11px] text-[#FBBF24] font-medium">{match.match_score}%</span>
                              </div>
                            </div>

                            {/* Skills & Interests */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {match.skills?.split(',').slice(0, 4).map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 bg-[#1a1a1a] text-gray-400 text-[10px] rounded border border-[#222]">
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>

                            {/* Bio */}
                            {match.bio && (
                              <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">{match.bio}</p>
                            )}

                            {/* Match Reason */}
                            <div className="flex items-start gap-2 p-2 bg-[#FBBF24]/5 border border-[#FBBF24]/20 rounded">
                              <svg className="w-4 h-4 text-[#FBBF24] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-[11px] text-gray-400">{match.match_reason}</p>
                            </div>
                          </div>

                          {/* Action */}
                          <button
                            onClick={() => handleContact(match.user_id)}
                            className="flex-shrink-0 px-4 py-2 bg-[#FBBF24] text-black text-[12px] font-medium rounded-lg hover:bg-white transition-colors"
                          >
                            联系
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {matches.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-[13px]">输入您的组队需求，点击开始匹配</p>
                  <p className="text-gray-600 text-[11px] mt-1">AI 将为您推荐最合适的队友</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
