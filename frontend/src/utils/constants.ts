/**
 * 数据字典与常量配置
 * 
 * 统一映射后端枚举值为前端展示配置
 * 保持暗黑毛玻璃风格一致性
 */

// ============================================
// 活动状态映射
// ============================================
export const STATUS_MAP: Record<string, {
  label: string
  bgColor: string
  textColor: string
  borderColor: string
  dotColor: string
}> = {
  upcoming: {
    label: '即将开始',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    dotColor: 'bg-blue-400'
  },
  ongoing: {
    label: '进行中',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    dotColor: 'bg-green-400'
  },
  ended: {
    label: '已结束',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30',
    dotColor: 'bg-gray-400'
  },
  draft: {
    label: '草稿',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    dotColor: 'bg-yellow-400'
  },
  published: {
    label: '已发布',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    dotColor: 'bg-purple-400'
  },
  cancelled: {
    label: '已取消',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    dotColor: 'bg-red-400'
  },
  // 后端可能返回的中文状态
  '即将开始': {
    label: '即将开始',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    dotColor: 'bg-blue-400'
  },
  '进行中': {
    label: '进行中',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    dotColor: 'bg-green-400'
  },
  '已结束': {
    label: '已结束',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30',
    dotColor: 'bg-gray-400'
  }
}

// ============================================
// 标签颜色映射
// ============================================
export const TAG_COLORS: Record<string, {
  bg: string
  text: string
  border: string
}> = {
  // 技术主题
  AI: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  人工智能: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Blockchain: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  区块链: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Web3: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  IoT: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  物联网: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  Cloud: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  云计算: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Security: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  安全: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  Data: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  数据: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  
  // 活动类型
  Hackathon: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  黑客松: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  Workshop: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  工作坊: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  Competition: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  竞赛: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  
  // 默认
  default: { bg: 'bg-white/5', text: 'text-gray-400', border: 'border-white/10' }
}

// ============================================
// 活动形式映射
// ============================================
export const FORMAT_MAP: Record<string, {
  label: string
  icon: string
}> = {
  online: {
    label: '线上',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
  },
  offline: {
    label: '线下',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
  },
  hybrid: {
    label: '混合',
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064'
  }
}

// ============================================
// 技能标签颜色映射
// ============================================
export const SKILL_COLORS: Record<string, string> = {
  React: 'bg-blue-500/20 text-blue-400',
  Vue: 'bg-green-500/20 text-green-400',
  Angular: 'bg-red-500/20 text-red-400',
  Python: 'bg-yellow-500/20 text-yellow-400',
  'Node.js': 'bg-green-600/20 text-green-500',
  JavaScript: 'bg-yellow-400/20 text-yellow-300',
  TypeScript: 'bg-blue-600/20 text-blue-500',
  Go: 'bg-cyan-500/20 text-cyan-400',
  Rust: 'bg-orange-500/20 text-orange-400',
  Java: 'bg-red-600/20 text-red-500',
  'C++': 'bg-blue-700/20 text-blue-600',
  AI: 'bg-purple-500/20 text-purple-400',
  ML: 'bg-pink-500/20 text-pink-400',
  Design: 'bg-pink-400/20 text-pink-300',
  Product: 'bg-indigo-500/20 text-indigo-400',
  default: 'bg-white/10 text-gray-400'
}

// ============================================
// MBTI 颜色映射
// ============================================
export const MBTI_COLORS: Record<string, {
  bg: string
  text: string
  desc: string
}> = {
  INTJ: { bg: 'bg-purple-500/20', text: 'text-purple-400', desc: '建筑师' },
  INTP: { bg: 'bg-blue-500/20', text: 'text-blue-400', desc: '逻辑学家' },
  ENTJ: { bg: 'bg-red-500/20', text: 'text-red-400', desc: '指挥官' },
  ENTP: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', desc: '辩论家' },
  INFJ: { bg: 'bg-green-500/20', text: 'text-green-400', desc: '提倡者' },
  INFP: { bg: 'bg-pink-500/20', text: 'text-pink-400', desc: '调停者' },
  ENFJ: { bg: 'bg-teal-500/20', text: 'text-teal-400', desc: '主人公' },
  ENFP: { bg: 'bg-orange-500/20', text: 'text-orange-400', desc: '竞选者' },
  ISTJ: { bg: 'bg-gray-500/20', text: 'text-gray-400', desc: '检查员' },
  ISFJ: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', desc: '守卫者' },
  ESTJ: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', desc: '总经理' },
  ESFJ: { bg: 'bg-rose-500/20', text: 'text-rose-400', desc: '执政官' },
  ISTP: { bg: 'bg-lime-500/20', text: 'text-lime-400', desc: '鉴赏家' },
  ISFP: { bg: 'bg-amber-500/20', text: 'text-amber-400', desc: '探险家' },
  ESTP: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', desc: '企业家' },
  ESFP: { bg: 'bg-violet-500/20', text: 'text-violet-400', desc: '表演者' },
  default: { bg: 'bg-white/10', text: 'text-gray-400', desc: '未知' }
}

// ============================================
// 通知类型映射
// ============================================
export const NOTIFICATION_TYPES: Record<string, {
  label: string
  icon: string
  color: string
}> = {
  activity_reminder: {
    label: '活动提醒',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'text-blue-400'
  },
  new_hackathon_push: {
    label: '新活动推送',
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    color: 'text-green-400'
  },
  system_announcement: {
    label: '系统公告',
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    color: 'text-yellow-400'
  },
  general_notification: {
    label: '一般通知',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    color: 'text-gray-400'
  }
}

// ============================================
// 工具函数
// ============================================

/**
 * 获取状态配置
 */
export const getStatusConfig = (status: string) => {
  return STATUS_MAP[status] || STATUS_MAP.draft
}

/**
 * 获取标签颜色配置
 */
export const getTagColor = (tag: string) => {
  return TAG_COLORS[tag] || TAG_COLORS.default
}

/**
 * 获取技能颜色
 */
export const getSkillColor = (skill: string) => {
  return SKILL_COLORS[skill] || SKILL_COLORS.default
}

/**
 * 获取 MBTI 配置
 */
export const getMBTIConfig = (mbti: string) => {
  return MBTI_COLORS[mbti?.toUpperCase()] || MBTI_COLORS.default
}

/**
 * 获取活动形式配置
 */
export const getFormatConfig = (format: string) => {
  return FORMAT_MAP[format] || { label: '未知', icon: '' }
}

/**
 * 格式化日期范围
 */
export const formatDateRange = (start?: string, end?: string) => {
  if (!start || !end) return '待定'
  
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const format = (d: Date) => {
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
  
  return `${format(startDate)} - ${format(endDate)}`
}

/**
 * 格式化金额
 */
export const formatAmount = (amount: number) => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}亿`
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`
  }
  return amount.toLocaleString()
}
