import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 奖品类型
interface Prize {
  id: string
  type: 'cash' | 'item'
  amount?: number      // 现金金额
  name?: string        // 物品名称
  description?: string // 描述
}

// 奖项层级
interface PrizeTier {
  id: string
  name: string         // 如：金奖、银奖、铜奖
  count: number        // 名额数量
  description?: string // 层级描述
  prizes: Prize[]      // 该层级的奖品列表
}

interface PrizesSectionProps {
  value: PrizeTier[]
  onChange: (tiers: PrizeTier[]) => void
  onTotalPrizeChange?: (total: number) => void  // 总现金池回调
}

// 预设模板
const PRIZE_TEMPLATES: PrizeTier[] = [
  {
    id: 'gold',
    name: '金奖',
    count: 1,
    description: '冠军团队',
    prizes: [
      { id: '1', type: 'cash' as const, amount: 50000, description: '现金奖励' },
      { id: '2', type: 'item' as const, name: '奖杯', description: '冠军奖杯' }
    ]
  },
  {
    id: 'silver',
    name: '银奖',
    count: 2,
    description: '亚军团队',
    prizes: [
      { id: '3', type: 'cash' as const, amount: 30000, description: '现金奖励' },
      { id: '4', type: 'item' as const, name: '奖杯', description: '亚军奖杯' }
    ]
  },
  {
    id: 'bronze',
    name: '铜奖',
    count: 3,
    description: '季军团队',
    prizes: [
      { id: '5', type: 'cash' as const, amount: 10000, description: '现金奖励' },
      { id: '6', type: 'item' as const, name: '奖杯', description: '季军奖杯' }
    ]
  }
]

export default function PrizesSection({ value, onChange, onTotalPrizeChange }: PrizesSectionProps) {
  const [tiers, setTiers] = useState<PrizeTier[]>(value.length > 0 ? value : [])

  // 同步外部值
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(tiers)) {
      setTiers(value.length > 0 ? value : [])
    }
  }, [value])

  // 计算总现金池
  const totalCashPool = useMemo(() => {
    return tiers.reduce((total, tier) => {
      const tierCash = tier.prizes.reduce((tierTotal, prize) => {
        if (prize.type === 'cash' && prize.amount) {
          return tierTotal + (prize.amount * tier.count)
        }
        return tierTotal
      }, 0)
      return total + tierCash
    }, 0)
  }, [tiers])

  // 通知父组件总现金池变化
  useEffect(() => {
    onTotalPrizeChange?.(totalCashPool)
  }, [totalCashPool, onTotalPrizeChange])

  // 生成唯一ID
  const generateId = () => `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const generatePrizeId = () => `prize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // 添加新层级
  const addTier = useCallback(() => {
    const newTier: PrizeTier = {
      id: generateId(),
      name: '',
      count: 1,
      description: '',
      prizes: []
    }
    const newTiers = [...tiers, newTier]
    setTiers(newTiers)
    onChange(newTiers)
  }, [tiers, onChange])

  // 删除层级
  const removeTier = useCallback((tierId: string) => {
    const newTiers = tiers.filter(t => t.id !== tierId)
    setTiers(newTiers)
    onChange(newTiers)
  }, [tiers, onChange])

  // 更新层级
  const updateTier = useCallback((tierId: string, updates: Partial<PrizeTier>) => {
    const newTiers = tiers.map(t => 
      t.id === tierId ? { ...t, ...updates } : t
    )
    setTiers(newTiers)
    onChange(newTiers)
  }, [tiers, onChange])

  // 添加奖品到层级
  const addPrizeToTier = useCallback((tierId: string, type: 'cash' | 'item') => {
    const newPrize: Prize = {
      id: generatePrizeId(),
      type,
      amount: type === 'cash' ? 0 : undefined,
      name: type === 'item' ? '' : undefined,
      description: ''
    }
    
    const newTiers = tiers.map(t => {
      if (t.id === tierId) {
        return { ...t, prizes: [...t.prizes, newPrize] }
      }
      return t
    })
    setTiers(newTiers)
    onChange(newTiers)
  }, [tiers, onChange])

  // 删除奖品
  const removePrize = useCallback((tierId: string, prizeId: string) => {
    const newTiers = tiers.map(t => {
      if (t.id === tierId) {
        return { ...t, prizes: t.prizes.filter(p => p.id !== prizeId) }
      }
      return t
    })
    setTiers(newTiers)
    onChange(newTiers)
  }, [tiers, onChange])

  // 更新奖品
  const updatePrize = useCallback((tierId: string, prizeId: string, updates: Partial<Prize>) => {
    const newTiers = tiers.map(t => {
      if (t.id === tierId) {
        return {
          ...t,
          prizes: t.prizes.map(p => p.id === prizeId ? { ...p, ...updates } : p)
        }
      }
      return t
    })
    setTiers(newTiers)
    onChange(newTiers)
  }, [tiers, onChange])

  // 应用预设模板
  const applyTemplate = useCallback(() => {
    const newTiers = PRIZE_TEMPLATES.map((template, index) => ({
      ...template,
      id: generateId() + index,
      prizes: template.prizes.map((prize, pIndex) => ({
        ...prize,
        id: generatePrizeId() + pIndex
      }))
    }))
    setTiers(newTiers)
    onChange(newTiers)
  }, [onChange])

  // 格式化金额显示
  const formatAmount = (amount: number) => {
    if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(1)}万`
    }
    return `¥${amount.toLocaleString()}`
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">奖项设置</h3>
          <span className="text-sm text-gray-500">({tiers.length} 个层级)</span>
        </div>
        <div className="flex items-center gap-3">
          {/* 总奖金显示 */}
          {totalCashPool > 0 && (
            <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="text-sm text-green-400">
                总奖金池: {formatAmount(totalCashPool)}
              </span>
            </div>
          )}
          <button
            onClick={applyTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            快速模板
          </button>
        </div>
      </div>

      {/* 奖项层级列表 */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {tiers.map((tier, tierIndex) => (
            <motion.div
              key={tier.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="bg-black/30 border border-white/[0.06] rounded-xl overflow-hidden"
            >
              {/* 层级头部 */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                  {/* 层级序号 */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-400">{tierIndex + 1}</span>
                  </div>

                  {/* 层级信息 */}
                  <div className="flex-1 grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                        placeholder="奖项名称（如：金奖）"
                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          value={tier.count || ''}
                          onChange={(e) => updateTier(tier.id, { count: parseInt(e.target.value) || 1 })}
                          placeholder="名额"
                          className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">个</span>
                      </div>
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={tier.description || ''}
                        onChange={(e) => updateTier(tier.id, { description: e.target.value })}
                        placeholder="描述（如：冠军团队）"
                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* 删除层级按钮 */}
                  <button
                    onClick={() => removeTier(tier.id)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* 该层级小计 */}
                {tier.prizes.some(p => p.type === 'cash' && p.amount) && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">该层级现金:</span>
                    <span className="text-green-400">
                      {formatAmount(tier.prizes.reduce((sum, p) => 
                        p.type === 'cash' && p.amount ? sum + p.amount * tier.count : sum, 0
                      ))}
                    </span>
                  </div>
                )}
              </div>

              {/* 奖品列表 */}
              <div className="p-4 bg-black/20">
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {tier.prizes.map((prize) => (
                      <motion.div
                        key={prize.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 p-3 bg-black/30 rounded-lg group"
                      >
                        {/* 奖品类型图标 */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          prize.type === 'cash' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {prize.type === 'cash' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>

                        {/* 奖品信息 */}
                        <div className="flex-1 grid grid-cols-12 gap-3">
                          {prize.type === 'cash' ? (
                            <>
                              <div className="col-span-4">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={0}
                                    value={prize.amount || ''}
                                    onChange={(e) => updatePrize(tier.id, prize.id, { amount: parseInt(e.target.value) || 0 })}
                                    placeholder="金额"
                                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-green-500/50 focus:outline-none transition-colors"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">元</span>
                                </div>
                              </div>
                              <div className="col-span-8">
                                <input
                                  type="text"
                                  value={prize.description || ''}
                                  onChange={(e) => updatePrize(tier.id, prize.id, { description: e.target.value })}
                                  placeholder="描述（如：现金奖励）"
                                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-green-500/50 focus:outline-none transition-colors"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="col-span-4">
                                <input
                                  type="text"
                                  value={prize.name || ''}
                                  onChange={(e) => updatePrize(tier.id, prize.id, { name: e.target.value })}
                                  placeholder="物品名称"
                                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none transition-colors"
                                />
                              </div>
                              <div className="col-span-8">
                                <input
                                  type="text"
                                  value={prize.description || ''}
                                  onChange={(e) => updatePrize(tier.id, prize.id, { description: e.target.value })}
                                  placeholder="描述（如：冠军奖杯）"
                                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none transition-colors"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* 删除奖品按钮 */}
                        <button
                          onClick={() => removePrize(tier.id, prize.id)}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* 添加奖品按钮 */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => addPrizeToTier(tier.id, 'cash')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      现金
                    </button>
                    <button
                      onClick={() => addPrizeToTier(tier.id, 'item')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      物品
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 空状态 */}
        {tiers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 border border-dashed border-white/[0.08] rounded-xl"
          >
            <p className="text-gray-500 text-sm mb-4">暂无奖项设置</p>
            <button
              onClick={addTier}
              className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
            >
              + 添加第一个奖项层级
            </button>
          </motion.div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={addTier}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-white/[0.06] border border-white/[0.08] rounded-lg hover:bg-white/[0.1] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加奖项层级
        </button>

        {/* 统计信息 */}
        {tiers.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>共 {tiers.reduce((sum, t) => sum + t.prizes.length, 0)} 个奖品</span>
            <span>•</span>
            <span>{tiers.reduce((sum, t) => sum + t.count, 0)} 个获奖名额</span>
          </div>
        )}
      </div>
    </div>
  )
}
