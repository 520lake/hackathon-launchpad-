import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { name: string; description: string; max_members: number }) => void
}

export default function CreateTeamModal({ isOpen, onClose, onCreate }: CreateTeamModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxMembers, setMaxMembers] = useState(5)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setLoading(true)
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        max_members: maxMembers
      })
      // Reset form
      setName('')
      setDescription('')
      setMaxMembers(5)
    } finally {
      setLoading(false)
    }
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0A0A0A] border border-[#222222] rounded-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222]">
              <h2 className="text-lg font-semibold text-white">创建战队</h2>
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
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  战队名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入战队名称"
                  className="w-full bg-[#111111] border border-[#222222] rounded-md px-4 py-2.5 text-white placeholder-gray-600 focus:border-[#FBBF24]/50 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  战队描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述您的战队目标和特色..."
                  rows={3}
                  className="w-full bg-[#111111] border border-[#222222] rounded-md px-4 py-2.5 text-white placeholder-gray-600 focus:border-[#FBBF24]/50 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  最大人数
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-[#FBBF24]"
                  />
                  <span className="w-12 text-center text-white font-medium">{maxMembers}人</span>
                </div>
              </div>

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
                  disabled={loading || !name.trim()}
                  className="flex-1 py-2.5 bg-[#FBBF24] text-black font-medium rounded-[24px] hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      创建中...
                    </span>
                  ) : (
                    '创建战队'
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
