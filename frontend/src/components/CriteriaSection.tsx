import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Criterion {
  id: string
  name: string
  percentage: number
  description?: string
}

interface CriteriaSectionProps {
  value: Criterion[]
  onChange: (criteria: Criterion[]) => void
  onValidationChange?: (isValid: boolean) => void
}

// 预设的评审标准模板
const AI_TEMPLATES = [
  {
    name: '技术创新性',
    percentage: 30,
    description: '项目的技术难度、创新程度和解决方案的独特性'
  },
  {
    name: '产品完成度',
    percentage: 25,
    description: '功能的完整性、代码质量和用户体验'
  },
  {
    name: '商业潜力',
    percentage: 20,
    description: '市场可行性、商业模式和盈利能力'
  },
  {
    name: '演示表现',
    percentage: 15,
    description: '路演清晰度、答辩质量和现场表现'
  },
  {
    name: '团队协作',
    percentage: 10,
    description: '团队合作效率、分工合理性和沟通效果'
  }
]

export default function CriteriaSection({ value, onChange, onValidationChange }: CriteriaSectionProps) {
  const [criteria, setCriteria] = useState<Criterion[]>(value.length > 0 ? value : [])

  // 同步外部值
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(criteria)) {
      setCriteria(value.length > 0 ? value : [])
    }
  }, [value])

  // 计算总百分比
  const totalPercentage = criteria.reduce((sum, c) => sum + (c.percentage || 0), 0)
  const remaining = 100 - totalPercentage
  const isOverLimit = totalPercentage > 100
  const isComplete = totalPercentage === 100

  // 通知父组件验证状态
  useEffect(() => {
    onValidationChange?.(isComplete && !isOverLimit)
  }, [isComplete, isOverLimit, onValidationChange])

  // 生成唯一ID
  const generateId = () => `criterion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // 添加新标准
  const addCriterion = useCallback(() => {
    const newCriterion: Criterion = {
      id: generateId(),
      name: '',
      percentage: 0,
      description: ''
    }
    const newCriteria = [...criteria, newCriterion]
    setCriteria(newCriteria)
    onChange(newCriteria)
  }, [criteria, onChange])

  // 删除标准
  const removeCriterion = useCallback((id: string) => {
    const newCriteria = criteria.filter(c => c.id !== id)
    setCriteria(newCriteria)
    onChange(newCriteria)
  }, [criteria, onChange])

  // 更新标准
  const updateCriterion = useCallback((id: string, updates: Partial<Criterion>) => {
    const newCriteria = criteria.map(c => 
      c.id === id ? { ...c, ...updates } : c
    )
    setCriteria(newCriteria)
    onChange(newCriteria)
  }, [criteria, onChange])

  // AI 推荐标准
  const applyAITemplate = useCallback(() => {
    const newCriteria = AI_TEMPLATES.map((template, index) => ({
      ...template,
      id: generateId() + index
    }))
    setCriteria(newCriteria)
    onChange(newCriteria)
  }, [onChange])

  // 获取进度条颜色
  const getProgressColor = () => {
    if (isOverLimit) return 'bg-red-500'
    if (isComplete) return 'bg-green-500'
    if (remaining <= 20) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  // 获取状态提示
  const getStatusMessage = () => {
    if (isOverLimit) return { text: `超出 ${totalPercentage - 100}%`, color: 'text-red-400' }
    if (isComplete) return { text: '✓ 标准设置完成', color: 'text-green-400' }
    if (remaining > 0) return { text: `还差 ${remaining}%`, color: 'text-orange-400' }
    return { text: '', color: '' }
  }

  const status = getStatusMessage()

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">评审标准</h3>
          <span className="text-sm text-gray-500">({criteria.length})</span>
        </div>
        <button
          onClick={applyAITemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI 推荐标准
        </button>
      </div>

      {/* 标准列表 */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {criteria.map((criterion, index) => (
            <motion.div
              key={criterion.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="group bg-black/30 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* 序号 */}
                <div className="flex-shrink-0 w-8 h-8 bg-white/[0.05] rounded-lg flex items-center justify-center text-sm text-gray-500 font-medium">
                  {index + 1}
                </div>

                {/* 输入区域 */}
                <div className="flex-1 grid grid-cols-12 gap-4">
                  {/* 标准名称 */}
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                      placeholder="标准名称"
                      className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* 百分比 */}
                  <div className="col-span-3">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={criterion.percentage || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          updateCriterion(criterion.id, { percentage: Math.min(100, Math.max(0, val)) })
                        }}
                        placeholder="占比"
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
                          isOverLimit ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-purple-500/50'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                  </div>

                  {/* 描述 */}
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={criterion.description || ''}
                      onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                      placeholder="描述（可选）"
                      className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={() => removeCriterion(criterion.id)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 空状态 */}
        {criteria.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 border border-dashed border-white/[0.08] rounded-xl"
          >
            <p className="text-gray-500 text-sm mb-4">暂无评审标准</p>
            <button
              onClick={addCriterion}
              className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
            >
              + 添加第一个标准
            </button>
          </motion.div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="mt-6 flex items-center justify-between">
        {/* 添加按钮 */}
        <button
          onClick={addCriterion}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-white/[0.06] border border-white/[0.08] rounded-lg hover:bg-white/[0.1] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加标准
        </button>

        {/* 进度显示 */}
        {criteria.length > 0 && (
          <div className="flex items-center gap-4">
            {/* 进度条 */}
            <div className="w-48 h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getProgressColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(totalPercentage, 100)}%` }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>

            {/* 状态文字 */}
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{totalPercentage}%</span>
              {status.text && (
                <span className={`text-sm ${status.color}`}>{status.text}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
