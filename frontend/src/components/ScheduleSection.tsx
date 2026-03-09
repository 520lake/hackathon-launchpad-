import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 日程节点类型
type ScheduleType = 'spot' | 'range'

// 日程节点数据结构
interface ScheduleNode {
  id: string
  type: ScheduleType
  name: string
  // 时间点模式
  spotDate?: string
  spotTime?: string
  // 时间段模式
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
}

// 导出给父组件的数据
interface ScheduleData {
  nodes: ScheduleNode[]
  startDate: string | null
  endDate: string | null
}

interface ScheduleSectionProps {
  value?: ScheduleNode[]
  onChange?: (data: ScheduleData) => void
}

// 生成唯一ID
const generateId = () => `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// 格式化日期时间为标准格式
const formatDateTime = (date: string, time: string) => {
  if (!date || !time) return null
  return `${date}T${time}`
}

export default function ScheduleSection({ value = [], onChange }: ScheduleSectionProps) {
  const [nodes, setNodes] = useState<ScheduleNode[]>(value.length > 0 ? value : [])

  // 同步外部值
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(nodes) && value.length > 0) {
      setNodes(value)
    }
  }, [value])

  // 计算最早和最晚时间
  const { startDate, endDate } = useMemo(() => {
    const allTimes: string[] = []
    
    nodes.forEach(node => {
      if (node.type === 'spot' && node.spotDate && node.spotTime) {
        const dt = formatDateTime(node.spotDate, node.spotTime)
        if (dt) allTimes.push(dt)
      } else if (node.type === 'range') {
        if (node.startDate && node.startTime) {
          const start = formatDateTime(node.startDate, node.startTime)
          if (start) allTimes.push(start)
        }
        if (node.endDate && node.endTime) {
          const end = formatDateTime(node.endDate, node.endTime)
          if (end) allTimes.push(end)
        }
      }
    })

    if (allTimes.length === 0) {
      return { startDate: null, endDate: null }
    }

    allTimes.sort()
    return {
      startDate: allTimes[0],
      endDate: allTimes[allTimes.length - 1]
    }
  }, [nodes])

  // 通知父组件变化
  useEffect(() => {
    onChange?.({
      nodes,
      startDate,
      endDate
    })
  }, [nodes, startDate, endDate, onChange])

  // 添加新节点
  const addNode = useCallback(() => {
    const newNode: ScheduleNode = {
      id: generateId(),
      type: 'spot',
      name: ''
    }
    setNodes(prev => [...prev, newNode])
  }, [])

  // 删除节点
  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
  }, [])

  // 更新节点
  const updateNode = useCallback((id: string, updates: Partial<ScheduleNode>) => {
    setNodes(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates } : n
    ))
  }, [])

  // 切换类型时重置相关字段
  const handleTypeChange = useCallback((id: string, newType: ScheduleType) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          type: newType,
          // 清除另一模式的字段
          spotDate: newType === 'spot' ? n.spotDate : undefined,
          spotTime: newType === 'spot' ? n.spotTime : undefined,
          startDate: newType === 'range' ? n.startDate : undefined,
          startTime: newType === 'range' ? n.startTime : undefined,
          endDate: newType === 'range' ? n.endDate : undefined,
          endTime: newType === 'range' ? n.endTime : undefined,
        }
      }
      return n
    }))
  }, [])

  // 预设模板
  const applyTemplate = useCallback(() => {
    const now = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    
    const regStart = new Date(now)
    const regEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const submitEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const hackathonStart = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
    const hackathonEnd = new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000)

    const template: ScheduleNode[] = [
      {
        id: generateId(),
        type: 'spot',
        name: '报名开始',
        spotDate: formatDate(regStart),
        spotTime: '09:00'
      },
      {
        id: generateId(),
        type: 'spot',
        name: '报名截止',
        spotDate: formatDate(regEnd),
        spotTime: '23:59'
      },
      {
        id: generateId(),
        type: 'spot',
        name: '提交截止',
        spotDate: formatDate(submitEnd),
        spotTime: '23:59'
      },
      {
        id: generateId(),
        type: 'range',
        name: '黑客松活动',
        startDate: formatDate(hackathonStart),
        startTime: '09:00',
        endDate: formatDate(hackathonEnd),
        endTime: '18:00'
      }
    ]
    setNodes(template)
  }, [])

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">// 日程安排</h2>
        <button
          onClick={applyTemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm text-brand border border-brand/30 rounded-lg hover:bg-brand/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          快速模板
        </button>
      </div>

      {/* 日程节点列表 */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {nodes.map((node, index) => (
            <ScheduleNodeCard
              key={node.id}
              node={node}
              index={index}
              onUpdate={(updates) => updateNode(node.id, updates)}
              onTypeChange={(type) => handleTypeChange(node.id, type)}
              onRemove={() => removeNode(node.id)}
            />
          ))}
        </AnimatePresence>

        {/* 空状态 */}
        {nodes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl"
          >
            <p className="text-gray-500 text-sm mb-4">暂无日程安排</p>
            <button
              onClick={addNode}
              className="text-brand text-sm hover:text-brand/80 transition-colors"
            >
              + 添加第一个日程节点
            </button>
          </motion.div>
        )}
      </div>

      {/* 添加按钮 */}
      <motion.button
        onClick={addNode}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full py-4 bg-black/40 border border-white/[0.08] rounded-xl text-gray-500 hover:text-gray-300 hover:border-white/[0.15] transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加日程节点
      </motion.button>

      {/* 时间范围预览 */}
      {(startDate || endDate) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
        >
          <h4 className="text-sm font-medium text-green-400 mb-2">活动时间范围</h4>
          <div className="flex items-center gap-4 text-sm">
            {startDate && (
              <div>
                <span className="text-gray-500">开始：</span>
                <span className="text-white">{new Date(startDate).toLocaleString('zh-CN')}</span>
              </div>
            )}
            {endDate && (
              <div>
                <span className="text-gray-500">结束：</span>
                <span className="text-white">{new Date(endDate).toLocaleString('zh-CN')}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// 单个日程节点卡片组件
interface ScheduleNodeCardProps {
  node: ScheduleNode
  index?: number
  onUpdate: (updates: Partial<ScheduleNode>) => void
  onTypeChange: (type: ScheduleType) => void
  onRemove: () => void
}

function ScheduleNodeCard({ node, index: _index, onUpdate, onTypeChange, onRemove }: ScheduleNodeCardProps) {
  // 校验时间段是否有效
  const isTimeRangeValid = useMemo(() => {
    if (node.type !== 'range') return true
    if (!node.startDate || !node.startTime || !node.endDate || !node.endTime) return true
    
    const start = new Date(`${node.startDate}T${node.startTime}`)
    const end = new Date(`${node.endDate}T${node.endTime}`)
    
    return end >= start
  }, [node])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="group bg-white/[0.05] backdrop-blur-sm border border-white/[0.10] rounded-2xl p-5 hover:border-white/[0.15] transition-colors"
    >
      {/* 卡片头部：类型切换器 + 删除按钮 */}
      <div className="flex items-center justify-between mb-4">
        {/* 类型切换器 */}
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg">
          <button
            onClick={() => onTypeChange('spot')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              node.type === 'spot'
                ? 'bg-white/[0.1] text-white border border-white/[0.15]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            时间点 (Time Spot)
          </button>
          <button
            onClick={() => onTypeChange('range')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              node.type === 'range'
                ? 'bg-white/[0.1] text-white border border-white/[0.15]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            时间段 (Time Range)
          </button>
        </div>

        {/* 删除按钮 */}
        <button
          onClick={onRemove}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* 日程名称 */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-2">日程名称</label>
        <input
          type="text"
          value={node.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder={node.type === 'spot' ? '报名开始' : '黑客松活动'}
          className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-brand/50 focus:outline-none transition-colors"
        />
      </div>

      {/* 时间设置 - 条件渲染 */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">时间设置</label>
        
        <AnimatePresence mode="wait">
          {node.type === 'spot' ? (
            <motion.div
              key="spot"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="grid grid-cols-2 gap-3"
            >
              {/* 日期 */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="date"
                  value={node.spotDate || ''}
                  onChange={(e) => onUpdate({ spotDate: e.target.value })}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:border-brand/50 focus:outline-none transition-colors"
                />
              </div>
              {/* 时间 */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type="time"
                  value={node.spotTime || ''}
                  onChange={(e) => onUpdate({ spotTime: e.target.value })}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:border-brand/50 focus:outline-none transition-colors"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="range"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center gap-2">
                {/* 开始日期 */}
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    value={node.startDate || ''}
                    onChange={(e) => onUpdate({ startDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:border-brand/50 focus:outline-none transition-colors"
                  />
                </div>
                {/* 开始时间 */}
                <div className="relative w-28">
                  <input
                    type="time"
                    value={node.startTime || ''}
                    onChange={(e) => onUpdate({ startTime: e.target.value })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand/50 focus:outline-none transition-colors"
                  />
                </div>
                
                {/* 箭头 */}
                <div className="text-gray-500 px-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                
                {/* 结束日期 */}
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    value={node.endDate || ''}
                    onChange={(e) => onUpdate({ endDate: e.target.value })}
                    className={`w-full bg-black/40 border rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                      !isTimeRangeValid 
                        ? 'border-red-500/50 focus:border-red-500 animate-pulse' 
                        : 'border-white/[0.08] focus:border-brand/50'
                    }`}
                  />
                </div>
                {/* 结束时间 */}
                <div className="relative w-28">
                  <input
                    type="time"
                    value={node.endTime || ''}
                    onChange={(e) => onUpdate({ endTime: e.target.value })}
                    className={`w-full bg-black/40 border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                      !isTimeRangeValid 
                        ? 'border-red-500/50 focus:border-red-500 animate-pulse' 
                        : 'border-white/[0.08] focus:border-brand/50'
                    }`}
                  />
                </div>
              </div>
              
              {/* 错误提示 */}
              {!isTimeRangeValid && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 mt-2 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  结束时间不能早于开始时间
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
