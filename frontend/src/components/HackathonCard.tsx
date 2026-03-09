import { motion } from 'framer-motion'

// Hackathon 数据接口
export interface HackathonData {
  id: number
  title: string
  description: string
  status: 'upcoming' | 'ongoing' | 'ended' | 'draft' | string
  start_date: string
  end_date: string
  location?: string
  format?: 'online' | 'offline' | 'hybrid'
  cover_image?: string
  theme_tags?: string
  professionalism_tags?: string
  organizer_name?: string
  awards_detail?: string
  // 扩展字段
  [key: string]: any
}

interface HackathonCardProps {
  data: HackathonData
  index?: number
  onClick?: (data: HackathonData) => void
  className?: string
}

// 状态配置映射
const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  upcoming: {
    label: '即将开始',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  ongoing: {
    label: '进行中',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30'
  },
  ended: {
    label: '已结束',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30'
  },
  draft: {
    label: '草稿',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30'
  },
  published: {
    label: '已发布',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30'
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '待定'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 解析奖金
const parseAwards = (awardsDetail?: string) => {
  if (!awardsDetail) return '暂无奖品信息'
  
  // 尝试提取现金金额
  const cashMatch = awardsDetail.match(/(\d+)/)
  if (cashMatch) {
    const amount = parseInt(cashMatch[1])
    if (amount >= 10000) {
      return `¥${(amount / 10000).toFixed(0)}万+`
    }
    return `¥${amount.toLocaleString()}`
  }
  
  return awardsDetail.length > 20 ? awardsDetail.slice(0, 20) + '...' : awardsDetail
}

// 图标组件
const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const LocationIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const TrophyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
)

/**
 * HackathonCard - 纯展示组件 (Dumb Component)
 * 
 * 职责：
 * - 仅通过 props.data 接收数据
 * - 严禁在组件内部直接调用 API
 * - 负责渲染活动卡片的所有 UI 元素
 */
export default function HackathonCard({ 
  data, 
  index = 0, 
  onClick,
  className = ''
}: HackathonCardProps) {
  const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.draft

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onClick?.(data)}
      className={`
        group cursor-pointer 
        bg-white/[0.03] 
        border border-white/[0.08] 
        rounded-3xl 
        overflow-hidden 
        hover:border-white/[0.15] 
        transition-all duration-300
        ${className}
      `}
    >
      {/* 卡片内部：左中右布局 */}
      <div className="flex p-5 gap-5">
        
        {/* 左区：图像占位 */}
        <div className="w-28 h-28 bg-[#1A1A1A] rounded-2xl flex items-center justify-center flex-shrink-0">
          {data.cover_image ? (
            <img 
              src={data.cover_image} 
              alt={data.title}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <span className="text-3xl font-bold text-gray-700">
              {data.title?.slice(0, 2).toUpperCase() || 'TE'}
            </span>
          )}
        </div>

        {/* 中区：信息主体 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* 标签 */}
          <div className="flex items-center gap-2 mb-2">
            {data.theme_tags?.split(',').slice(0, 2).map((tag, i) => (
              <span 
                key={i} 
                className="px-2 py-0.5 bg-[#222222] text-gray-500 text-[10px] rounded"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
          
          {/* 标题 */}
          <h3 className="text-lg font-bold text-white group-hover:text-[#FBBF24] transition-colors duration-200 mb-2 truncate">
            {data.title}
          </h3>
          
          {/* 描述 */}
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {data.description}
          </p>

          {/* 主办方 */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">主办方：</span>
            <span className="px-2 py-0.5 border border-white/10 text-gray-400 rounded text-[10px]">
              {data.professionalism_tags?.split(',')[0] || '标签'}
            </span>
            <span className="text-gray-400">{data.organizer_name || '公司名称'}</span>
          </div>
        </div>

        {/* 右区：状态与数据 */}
        <div className="w-48 flex-shrink-0 flex flex-col justify-between items-end">
          {/* 状态标签 */}
          <span className={`
            px-3 py-1 text-[10px] rounded-full border
            ${statusConfig.bgColor}
            ${statusConfig.textColor}
            ${statusConfig.borderColor}
          `}>
            {statusConfig.label}
          </span>

          {/* 信息维度 */}
          <div className="flex flex-col gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <CalendarIcon />
              <span>{formatDate(data.start_date)} - {formatDate(data.end_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <LocationIcon />
              <span>{data.location || '线上'}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrophyIcon />
              <span>{parseAwards(data.awards_detail)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
