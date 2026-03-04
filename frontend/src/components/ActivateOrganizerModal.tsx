import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

interface ActivateOrganizerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ActivateOrganizerModal({ isOpen, onClose, onSuccess }: ActivateOrganizerModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/v1/users/activate-organizer',
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid invitation code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">激活组织者权限</h3>
                <p className="text-gray-400 text-sm mt-2">请输入邀请码以解锁创建黑客松的权限</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="输入邀请码"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-center text-lg tracking-wider"
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-[#333] text-gray-300 rounded-lg hover:bg-[#252525] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? '验证中...' : '确认激活'}
                  </button>
                </div>
              </form>

              <p className="text-gray-500 text-xs text-center mt-4">
                没有邀请码？请联系平台管理员获取
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
