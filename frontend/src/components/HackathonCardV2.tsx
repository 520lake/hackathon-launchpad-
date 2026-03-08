import { motion } from 'framer-motion'

// ============================================
// 类型定义
// ============================================

export interface HackathonCardData {
  /** 活动 ID */
  id: string
  /** 活动名称 */
  title: string
  /** 活动描述 */
  description?: string
  /** 主办方信息 */
  host: {
    name: string
    logo?: string
  }
  /** 标签数组 */
  tags: string[]
  /** 活动状态 */
  status: 'published' | 'ongoing' | 'ended' | 'upcoming' | 'draft' | string
  /** 格式化后的时间字符串 */
  dateRange: string
  /** 地点 */
  location: string
  /** 奖金文本 */
  prizeText: string
  /** 是否为创建者 */
  isOrganizer?: boolean
}

interface HackathonCardProps {
  /** 卡片数据 */
  data: HackathonCardData
  /** 点击回调 */
  onClick?: (data: HackathonCardData) => void
  /** 动画索引（用于列表 stagger 动画） */
  index?: number
  /** 自定义类名 */
  className?: string
}

// ============================================
// 状态映射配置
// ============================================

const STATUS_MAP: Record<string, {
  label: string
  bgColor: string
  textColor: string
  borderColor: string
}> = {
  published: {
    label: '已发布',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30'
  },
  ongoing: {
    label: '进行中',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  ended: {
    label: '已结束',
    bgColor: 'bg-gray-500/20',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30'
  },
  upcoming: {
    label: '期待开始',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  registration: {
    label: '报名中',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30'
  },
  draft: {
    label: '草稿',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30'
  }
}

// ============================================
// 图标组件
// ============================================

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const TrophyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
)

const BuildingIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

// ============================================
// 辅助函数
// ============================================

const getStatusConfig = (status: string) => {
  return STATUS_MAP[status] || STATUS_MAP.draft
}

// ============================================
// 主组件
// ============================================

/**
 * HackathonCard - 全局复用的活动卡片组件
 * 
 * 特性：
 * - 纯展示组件，通过 props.data 接收数据
 * - 暗黑毛玻璃风格
 * - 三栏布局：左区(图片) + 中区(信息) + 右区(状态和数据)
 * - 流畅的悬停动效
 */
export default function HackathonCard({
  data,
  onClick,
  index = 0,
  className = ''
}: HackathonCardProps) {
  const statusConfig = getStatusConfig(data.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => onClick?.(data)}
      className={`
        group
        w-full
        bg-white/[0.02]
        backdrop-blur-md
        border border-white/[0.05]
        rounded-[24px]
        cursor-pointer
        transition-all duration-300
        hover:bg-white/[0.04]
        hover:border-white/[0.1]
        ${className}
      `}
    >
      {/* 内部三栏布局 */}
      <div className="flex flex-row items-center gap-6 p-5">
        
        {/* ========== 左区：图片缩略图 ========== */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-[16px] bg-white/10 overflow-hidden flex items-center justify-center">
            {data.host.logo ? (
              <img
                src={data.host.logo}
                alt={data.host.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white/30">
                {data.title.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* ========== 中区：主要信息 ========== */}
        <div className="flex-1 min-w-0">
          {/* 顶部标签行 */}
          <div className="flex flex-wrap gap-2 items-center">
            {data.isOrganizer && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                我创建的
              </span>
            )}
            {data.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="
                  text-xs
                  bg-white/5
                  border border-white/10
                  text-gray-400
                  px-2.5 py-1
                  rounded-full
                "
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 标题 */}
          <h3 className="
            text-lg font-bold text-white mt-2
            truncate
            group-hover:text-purple-300
            transition-colors duration-300
          ">
            {data.title}
          </h3>

          {/* 描述 */}
          {data.description && (
            <p className="
              text-gray-400 text-sm mt-1
              line-clamp-2
              leading-relaxed
            ">
              {data.description}
            </p>
          )}

          {/* 主办方 */}
          <div className="flex items-center gap-1.5 mt-3">
            <BuildingIcon />
            <span className="text-xs text-gray-500">
              主办方：{data.host.name}
            </span>
          </div>
        </div>

        {/* ========== 右区：状态和数据 ========== */}
        <div className="flex-shrink-0 flex flex-col items-end gap-4 w-48">
          {/* 状态标签 */}
          <span className={`
            text-xs font-medium
            px-3 py-1.5
            rounded-full
            border
            ${statusConfig.bgColor}
            ${statusConfig.textColor}
            ${statusConfig.borderColor}
          `}>
            {statusConfig.label}
          </span>

          {/* 核心数据列表 */}
          <div className="flex flex-col gap-2.5 w-full">
            {/* 时间 */}
            <div className="flex items-center justify-end gap-2 text-sm text-gray-400">
              <span className="truncate">{data.dateRange}</span>
              <CalendarIcon />
            </div>

            {/* 地点 */}
            <div className="flex items-center justify-end gap-2 text-sm text-gray-400">
              <span className="truncate">{data.location}</span>
              <LocationIcon />
            </div>

            {/* 奖金 */}
            <div className="flex items-center justify-end gap-2 text-sm text-gray-400">
              <span className="truncate">{data.prizeText}</span>
              <TrophyIcon />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// 使用示例
// ============================================

export function HackathonCardDemo() {
  const demoData: HackathonCardData[] = [
    {
      id: '1',
      title: 'Aura 测试黑客松 (离线模式)',
      description: '这是一个测试用的黑客松活动描述，用于展示卡片组件的样式和布局效果。',
      host: { name: 'Aurathon', logo: '' },
      tags: ['测试', '备用'],
      status: 'published',
      dateRange: '2025.12.20 - 2026.01.15',
      location: '上海市浦东新区',
      prizeText: '¥ 1,234,567 + 非现金奖品'
    },
    {
      id: '2',
      title: 'AI 创新挑战赛 2026',
      description: '探索人工智能的无限可能，与全球开发者一起创造未来。',
      host: { name: 'TechHub', logo: '' },
      tags: ['AI', '创新', '全球'],
      status: 'ongoing',
      dateRange: '2026.01.01 - 2026.03.31',
      location: '线上',
      prizeText: '¥ 500,000 + GPU 算力支持'
    },
    {
      id: '3',
      title: 'Web3 开发者大会',
      description: '聚焦区块链、DeFi、NFT 等前沿技术，连接开发者与资本。',
      host: { name: 'Blockchain Labs', logo: '' },
      tags: ['Web3', '区块链', 'DeFi'],
      status: 'ended',
      dateRange: '2025.10.01 - 2025.10.07',
      location: '新加坡',
      prizeText: '¥ 2,000,000 + 投资机会'
    }
  ]

  return (
    <div className="p-8 space-y-4 bg-[#0A0A0A] min-h-screen">
      <h2 className="text-white text-xl font-bold mb-6">HackathonCard 组件演示</h2>
      
      {demoData.map((item, index) => (
        <HackathonCard
          key={item.id}
          data={item}
          index={index}
          onClick={(data) => console.log('Clicked:', data)}
        />
      ))}
    </div>
  )
}
