import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

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
  /** 主办方列表（支持多个联合主办方） */
  hosts: Array<{
    name: string;
    logo?: string;
  }>;
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

const CalendarIcon = () => (
  <svg
    className="w-4 h-4 flex-shrink-0"
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
    className="w-4 h-4 flex-shrink-0"
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
    className="w-4 h-4 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
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

  /**
   * 主办方渐进式展示：
   * 在不可见的测量层渲染所有主办方条目和 "等 N 个" 汇总文本，
   * 通过 ResizeObserver 监听容器宽度，逐一检查每个条目的右边缘是否超出容器。
   * 第一个条目始终显示；后续条目仅在完整可见时才显示，否则追加 "等 N 个"。
   */
  const hostsMeasureRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLSpanElement>(null);
  const [visibleHostCount, setVisibleHostCount] = useState(data.hosts.length);

  useEffect(() => {
    const container = hostsMeasureRef.current;
    const summaryEl = summaryRef.current;
    if (!container) return;

    const calculate = () => {
      const containerWidth = container.clientWidth;
      const items = container.querySelectorAll<HTMLElement>("[data-host-item]");
      const summaryWidth = summaryEl ? summaryEl.offsetWidth : 0;

      if (items.length === 0) {
        setVisibleHostCount(0);
        return;
      }

      const lastItem = items[items.length - 1];
      if (lastItem.offsetLeft + lastItem.offsetWidth <= containerWidth) {
        setVisibleHostCount(items.length);
        return;
      }

      let count = 1;
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const neededWidth =
          item.offsetLeft + item.offsetWidth + 8 + summaryWidth;
        if (neededWidth <= containerWidth) {
          count = i + 1;
        } else {
          break;
        }
      }
      setVisibleHostCount(count);
    };

    calculate();
    const observer = new ResizeObserver(calculate);
    observer.observe(container);
    return () => observer.disconnect();
  }, [data.hosts]);

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
      <div className="flex flex-row items-center gap-5 p-5">
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
            ) : data.hosts[0]?.logo ? (
              <img
                src={data.hosts[0].logo}
                alt={data.hosts[0].name}
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
          <h3 className="text-[20px] font-normal text-white truncate leading-none">
            {data.title}
          </h3>

          {/* 活动简介：最多展示两行，颜色偏浅灰，减弱信息权重 */}
          {data.description && (
            <p className="text-[14px] leading-[20px] text-[#ccc] line-clamp-2">
              {data.description}
            </p>
          )}

          {/* 主办方信息行：左边“主办方：”，中间为 logo 占位，右边是公司名称 */}
          {/* 外层和内层都加了 min-w-0 + overflow-hidden，确保在 flex 布局中文字过长时 truncate 能正确生效 */}
          <div className="flex items-center gap-2 text-[14px] min-w-0 overflow-hidden">
            <span className="text-[#999] flex-shrink-0">主办方：</span>
            <div className="relative min-w-0 flex-1">
              {/*
                不可见的测量层：渲染所有主办方条目 + "等 N 个" 文本。
                每个条目标记 data-host-item，供 JS 逐一测量右边缘位置。
              */}
              <div
                ref={hostsMeasureRef}
                className="flex items-center gap-2 overflow-hidden invisible"
                aria-hidden="true"
              >
                {data.hosts.map((h, i) => (
                  <div
                    key={i}
                    data-host-item
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <div className="h-[20px] w-[56px] rounded-[4px] bg-[#2a2a2a] flex items-center justify-center">
                      <span className="text-[12px] text-[#666]">
                        {h.logo ? "" : "标志"}
                      </span>
                    </div>
                    <div className="h-[20px] w-px bg-[#333] flex-shrink-0" />
                    <span className="text-[14px] text-[#999] whitespace-nowrap">
                      {h.name}
                    </span>
                  </div>
                ))}
                <span
                  ref={summaryRef}
                  className="text-[12px] text-[#666] whitespace-nowrap flex-shrink-0"
                >
                  等 {data.hosts.length} 个
                </span>
              </div>
              {/* 可见层：只渲染能完整显示的条目，放不下的用 "等 N 个" 代替 */}
              <div className="absolute inset-0 flex items-center gap-2 overflow-hidden">
                {data.hosts.slice(0, visibleHostCount).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <div className="h-[20px] w-[56px] rounded-[4px] bg-[#2a2a2a] flex items-center justify-center">
                      <span className="text-[12px] text-[#666]">
                        {h.logo ? "" : "标志"}
                      </span>
                    </div>
                    <div className="h-[20px] w-px bg-[#333] flex-shrink-0" />
                    <span className="text-[14px] text-[#999] whitespace-nowrap">
                      {h.name}
                    </span>
                  </div>
                ))}
                {visibleHostCount < data.hosts.length && (
                  <span className="text-[12px] text-[#666] whitespace-nowrap flex-shrink-0">
                    等 {data.hosts.length} 个
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 中区与右区之间的竖线分隔符，与 Figma 设计稿一致 */}
        <div className="shrink-0 w-px h-[125px] bg-[#333]" />

        {/* ========== 右区：状态徽章 + 时间 / 地点 / 奖金信息 ========== */}
        <div className="flex-shrink-0 w-[190px] min-w-0 flex flex-col gap-3 items-start overflow-hidden">
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
          <div className="flex items-center gap-2 text-[14px] text-[#ccc] max-w-full">
            <CalendarIcon />
            <span className="truncate min-w-0">{data.dateRange}</span>
          </div>

          {/* 地点 — Figma 中地点文字为 12px，比其他信息行稍小 */}
          <div className="flex items-center gap-2 text-[12px] text-[#ccc] max-w-full">
            <LocationIcon />
            <span className="truncate min-w-0">{data.location}</span>
          </div>

          {/* 奖金信息 */}
          <div className="flex items-center gap-2 text-[14px] text-[#ccc] max-w-full">
            <TrophyIcon />
            <span className="truncate min-w-0">{data.prizeText}</span>
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
      hosts: [{ name: "Aurathon", logo: "" }],
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
      hosts: [
        { name: "TechHub", logo: "" },
        { name: "AI Lab", logo: "" },
      ],
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
      hosts: [
        { name: "Blockchain Labs", logo: "" },
        { name: "Web3 基金会", logo: "" },
        { name: "DeFi Alliance", logo: "" },
      ],
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
