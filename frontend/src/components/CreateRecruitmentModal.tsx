import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

interface CreateRecruitmentModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: number
  onSuccess?: () => void
}

export default function CreateRecruitmentModal({ isOpen, onClose, teamId, onSuccess }: CreateRecruitmentModalProps) {
  const [role, setRole] = useState('')
  const [skills, setSkills] = useState('')
  const [count, setCount] = useState(1)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [useAI, setUseAI] = useState(false)

  const handleGenerateWithAI = async () => {
    if (!role.trim() || !skills.trim()) {
      alert('请先填写角色和技能要求')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/v1/ai/generate', {
        prompt: `为${role}岗位生成招募文案，要求技能：${skills}，招募${count}人`,
        type: 'recruitment'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDescription(res.data.content || '')
      setUseAI(true)
    } catch (e) {
      alert('AI生成失败，请手动填写')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role.trim() || !skills.trim()) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/v1/recruitments', {
        team_id: teamId,
        role: role.trim(),
        skills: skills.trim(),
        count: count,
        description: description.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Reset form
      setRole('')
      setSkills('')
      setCount(1)
      setDescription('')
      setUseAI(false)
      
      onSuccess?.()
      onClose()
    } catch (e: any) {
      alert(e.response?.data?.detail || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = ['前端开发', '后端开发', 'UI/UX设计', '产品经理', '算法工程师', '全栈开发', '移动端开发', '测试工程师', '运维工程师', '其他']

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0A0A0A] border border-[#222222] rounded-lg z-50 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222]">
              <h2 className="text-lg font-semibold text-white">发布招募</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Role */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  招募角色 <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] rounded-md px-4 py-2.5 text-white focus:border-[#FBBF24]/50 focus:outline-none transition-colors"
                  required
                >
                  <option value="">选择角色</option>
                  {roleOptions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  技能要求 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="例如：React, Python, Figma..."
                  className="w-full bg-[#111111] border border-[#222222] rounded-md px-4 py-2.5 text-white placeholder-gray-600 focus:border-[#FBBF24]/50 focus:outline-none transition-colors"
                  required
                />
                <p className="text-[11px] text-gray-600 mt-1">多个技能用逗号分隔</p>
              </div>

              {/* Count */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  招募人数
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-[#FBBF24]"
                  />
                  <span className="w-12 text-center text-white font-medium">{count}人</span>
                </div>
              </div>

              {/* Description with AI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-400">
                    招募描述
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    className="flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI 生成文案
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述岗位职责、项目亮点、团队氛围..."
                  rows={4}
                  className="w-full bg-[#111111] border border-[#222222] rounded-md px-4 py-2.5 text-white placeholder-gray-600 focus:border-[#FBBF24]/50 focus:outline-none transition-colors resize-none"
                />
                {useAI && (
                  <p className="text-[11px] text-purple-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    已使用 AI 生成
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-[#222222] text-gray-400 rounded-[24px] hover:text-white hover:border-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading || !role.trim() || !skills.trim()}
                  className="flex-1 py-2.5 bg-[#FBBF24] text-black font-medium rounded-[24px] hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      发布中...
                    </span>
                  ) : (
                    '发布招募'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
