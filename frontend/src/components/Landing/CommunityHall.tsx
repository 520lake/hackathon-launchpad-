import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, MessageCircle, Zap, Trophy, Sparkles } from 'lucide-react'
import axios from 'axios'

interface VirtualUser {
  id: number
  full_name: string
  nickname: string
  avatar: string
  skills: string
  bio: string
  personality: string
  is_virtual: boolean
}

export default function CommunityHall() {
  const navigate = useNavigate()
  const [virtualUsers, setVirtualUsers] = useState<VirtualUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVirtualUsers()
  }, [])

  const fetchVirtualUsers = async () => {
    try {
      const response = await axios.get('/api/v1/users/virtual')
      setVirtualUsers(response.data.slice(0, 8)) // 只显示8个
    } catch (err) {
      console.error('获取虚拟用户失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnterHall = () => {
    navigate('/community')
  }

  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-brand" />
            <span className="text-sm text-brand font-medium">黑客松爱好者聚集地</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            社区大厅
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            与志同道合的开发者交流，寻找队友，分享经验
            <br />
            <span className="text-brand">这里是黑客松文化的核心社区</span>
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { icon: Users, label: '社区成员', value: '2,000+' },
            { icon: MessageCircle, label: '今日讨论', value: '156' },
            { icon: Zap, label: '组队成功', value: '89' },
            { icon: Trophy, label: '获奖项目', value: '234' },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center hover:border-brand/30 transition-colors"
            >
              <stat.icon className="w-6 h-6 text-brand mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Virtual Users Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">活跃的参赛者</h3>
              <p className="text-sm text-zinc-500">来自不同背景的虚拟人物，展现参赛者视角</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-400">虚拟人物演示</span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {virtualUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 hover:border-brand/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                      alt={user.full_name}
                      className="w-12 h-12 rounded-full bg-zinc-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{user.nickname}</div>
                      <div className="text-xs text-zinc-500">{user.personality}</div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                    {user.skills?.split(',').slice(0, 3).join(' · ')}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-2 py-0.5 bg-brand/10 text-brand rounded-full">
                      虚拟人物
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Enter Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleEnterHall}
            className="inline-flex items-center gap-3 px-8 py-4 bg-brand text-black font-bold text-lg rounded-2xl hover:bg-white transition-all hover:scale-105"
          >
            <Users className="w-6 h-6" />
            进入社区大厅
            <span className="px-2 py-0.5 bg-black/20 rounded text-sm">Beta</span>
          </button>
          <p className="text-sm text-zinc-500 mt-4">
            与 {virtualUsers.length}+ 位虚拟参赛者一起探索黑客松世界
          </p>
        </motion.div>
      </div>
    </section>
  )
}
