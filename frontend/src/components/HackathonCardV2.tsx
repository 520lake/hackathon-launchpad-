import { motion } from "framer-motion";

// ============================================
// 类型定义
// ============================================

export interface HackathonCardData {
  /** 活动 ID */
  id: string;
  /** 活动名称 */
  title: string;
  /** 活动描述 */
  description?: string;
  /**
   * 活动封面图片（如果有的话）
   * - 来自后端的封面图 / banner
   * - 优先用来展示在卡片左侧的大缩略图区域
   */
  coverImage?: string;
  /** 主办方信息 */
  host: {
    name: string;
    logo?: string;
  };
  /** 标签数组 */
  tags: string[];
  /** 活动状态 */
  status: "published" | "ongoing" | "ended" | "upcoming" | "draft" | string;
  /** 格式化后的时间字符串 */
  dateRange: string;
  /** 地点 */
  location: string;
  /** 奖金文本 */
  prizeText: string;
  /** 是否为创建者 */
  isOrganizer?: boolean;
}

interface HackathonCardProps {
  /** 卡片数据 */
  data: HackathonCardData;
  /** 点击回调 */
  onClick?: (data: HackathonCardData) => void;
  /** 动画索引（用于列表 stagger 动画） */
  index?: number;
  /** 自定义类名 */
  className?: string;
}

// ============================================
// 状态映射配置
// ============================================

const STATUS_MAP: Record<
  string,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  published: {
    label: "已发布",
    bgColor: "bg-[#22c55e]",
    textColor: "text-white",
    borderColor: "border-transparent",
  },
  ongoing: {
    label: "进行中",
    bgColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  ended: {
    label: "已结束",
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-400",
    borderColor: "border-gray-500/30",
  },
  upcoming: {
    label: "期待开始",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
  },
  registration: {
    label: "报名中",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
  },
  draft: {
    label: "草稿",
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/30",
  },
};

// ============================================
// 图标组件
// ============================================

/**
 * 小圆形图标的通用容器
 * - 用于在彩色圆形背景中居中展示图形 / 字母
 */
const CircularBadge = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`
      inline-flex items-center justify-center
      rounded-full
      bg-gradient-to-br from-[#7367F0] via-[#9F7AEA] to-[#F472B6]
      text-xs font-semibold text-white
      shadow-[0_0_20px_rgba(115,103,240,0.45)]
      ${className}
    `}
  >
    {children}
  </div>
);

const CalendarIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const LocationIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const TrophyIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

// ============================================
// 辅助函数
// ============================================

const getStatusConfig = (status: string) => {
  /**
   * 根据后端传入的状态字符串，选择对应的视觉样式。
   * 如果找不到匹配项，则回退到“草稿”样式，避免页面上出现未定义状态导致的裸文字。
   */
  return STATUS_MAP[status] || STATUS_MAP.draft;
};

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
  className = "",
}: HackathonCardProps) {
  const statusConfig = getStatusConfig(data.status);

  /**
   * 从标题中提取前两个非空白字符，作为卡片左侧缩略图里的字母缩写。
   * 例如：“Aura 测试黑客松”会得到 “AU”，确保在没有封面图时也有明确的视觉锚点。
   */
  const titleInitials = data.title.replace(/\s/g, "").slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      onClick={() => onClick?.(data)}
      className={`
        group
        w-full
        cursor-pointer
        transition-all duration-300
        bg-[#1a1a1a]
        rounded-[8px]
        border border-[#262626]
        hover:border-[#3f3f3f]
        hover:bg-[#202020]
        ${className}
      `}
    >
      {/* 内部三栏布局：与 Figma “Event Card” 结构一致 */}
      <div className="flex flex-row items-center gap-5 px-5 py-4">
        {/* ========== 左区：固定尺寸的缩略图方块 ========== */}
        <div className="flex-shrink-0">
          {/* 
            这里优先展示真实的封面图或主办方 logo，
            如果两者都缺失，则使用深灰背景 + 大号字母缩写，
            模拟设计稿中 TE 方块的效果。
          */}
          <div className="relative w-[125px] h-[125px] rounded-[8px] bg-[#2a2a2a] overflow-hidden flex items-center justify-center">
            {data.coverImage ? (
              <img
                src={data.coverImage}
                alt={data.title}
                className="w-full h-full object-cover"
              />
            ) : data.host.logo ? (
              <img
                src={data.host.logo}
                alt={data.host.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[56px] font-bold text-[#666] leading-none">
                {titleInitials}
              </span>
            )}
          </div>
        </div>

        {/* ========== 中区：标题、描述和主办方信息 ========== */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* 顶部标签行：对应 Figma 中“测试 / 备用”之类的小标签 */}
          <div className="flex flex-wrap gap-2 items-center">
            {data.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-[4px] bg-[#2a2a2a] px-[6px] py-[2px] text-[10px] text-white"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 主标题：一行，字号和颜色参考设计稿 */}
          <h3 className="text-[20px] font-normal text-white truncate">
            {data.title}
          </h3>

          {/* 活动简介：最多展示两行，颜色偏浅灰，减弱信息权重 */}
          {data.description && (
            <p className="text-[14px] leading-[16px] text-[#ccc] line-clamp-2">
              {data.description}
            </p>
          )}

          {/* 主办方信息行：左边“主办方：”，中间为 logo 占位，右边是公司名称 */}
          <div className="flex items-center gap-2 mt-1 text-[14px]">
            <span className="text-[#999]">主办方：</span>
            <div className="flex items-center gap-2">
              <div className="h-[24px] w-[56px] rounded-[4px] bg-[#2a2a2a] flex items-center justify-center">
                <span className="text-[12px] text-[#666]">标志</span>
              </div>
              <div className="h-6 w-px bg-[#333]" />
              <span className="text-[14px] text-[#999] truncate">
                {data.host.name || "公司名称"}
              </span>
            </div>
          </div>
        </div>

        {/* ========== 右区：状态徽章 + 时间 / 地点 / 奖金信息 ========== */}
        <div className="flex-shrink-0 w-[220px] flex flex-col gap-3 items-start">
          {/* 状态胶囊：颜色根据状态映射配置来确定 */}
          <span
            className={`
              inline-flex items-center justify-center
              rounded-[12px]
              px-[10px] py-[3px]
              text-[10px] font-medium
              ${statusConfig.bgColor}
              ${statusConfig.textColor}
              ${statusConfig.borderColor}
            `}
          >
            {statusConfig.label}
          </span>

          {/* 时间 */}
          <div className="flex items-center gap-2 text-[14px] text-[#ccc]">
            <CalendarIcon />
            <span className="truncate">{data.dateRange}</span>
          </div>

          {/* 地点 */}
          <div className="flex items-center gap-2 text-[12px] text-[#ccc]">
            <LocationIcon />
            <span className="truncate">{data.location}</span>
          </div>

          {/* 奖金信息 */}
          <div className="flex items-center gap-2 text-[14px] text-[#ccc]">
            <TrophyIcon />
            <span className="truncate">{data.prizeText}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// 使用示例
// ============================================

export function HackathonCardDemo() {
  const demoData: HackathonCardData[] = [
    {
      id: "1",
      title: "Aura 测试黑客松 (离线模式)",
      description:
        "这是一个测试用的黑客松活动描述，用于展示卡片组件的样式和布局效果。",
      host: { name: "Aurathon", logo: "" },
      tags: ["测试", "备用"],
      status: "published",
      dateRange: "2025.12.20 - 2026.01.15",
      location: "上海市浦东新区",
      prizeText: "¥ 1,234,567 + 非现金奖品",
    },
    {
      id: "2",
      title: "AI 创新挑战赛 2026",
      description: "探索人工智能的无限可能，与全球开发者一起创造未来。",
      host: { name: "TechHub", logo: "" },
      tags: ["AI", "创新", "全球"],
      status: "ongoing",
      dateRange: "2026.01.01 - 2026.03.31",
      location: "线上",
      prizeText: "¥ 500,000 + GPU 算力支持",
    },
    {
      id: "3",
      title: "Web3 开发者大会",
      description: "聚焦区块链、DeFi、NFT 等前沿技术，连接开发者与资本。",
      host: { name: "Blockchain Labs", logo: "" },
      tags: ["Web3", "区块链", "DeFi"],
      status: "ended",
      dateRange: "2025.10.01 - 2025.10.07",
      location: "新加坡",
      prizeText: "¥ 2,000,000 + 投资机会",
    },
  ];

  return (
    <div className="p-8 space-y-4 bg-[#0A0A0A] min-h-screen">
      <h2 className="text-white text-xl font-bold mb-6">
        HackathonCard 组件演示
      </h2>

      {demoData.map((item, index) => (
        <HackathonCard
          key={item.id}
          data={item}
          index={index}
          onClick={(data) => console.log("Clicked:", data)}
        />
      ))}
    </div>
  );
}
