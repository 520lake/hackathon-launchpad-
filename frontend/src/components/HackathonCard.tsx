import { motion } from "framer-motion";
import { Fragment, useRef, useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import type { HackathonCardData } from "@/types/hackathon";

// Re-export the shared type so existing consumers that import from here
// (e.g. EventsPage) keep working without changing their import path.
export type { HackathonCardData } from "@/types/hackathon";

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
// 图标组件 — 统一 16×16, strokeWidth 1.5
// ============================================

const CalendarIcon = () => (
  <svg
    className="w-[16px] h-[16px] flex-shrink-0"
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
    className="w-[16px] h-[16px] flex-shrink-0"
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
    className="w-[16px] h-[16px] flex-shrink-0"
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
  return STATUS_MAP[status] || STATUS_MAP.draft;
};

// ============================================
// 主组件
// ============================================

/**
 * HackathonCard - 全局复用的活动卡片组件
 *
 * Design tokens (unified):
 *   Padding:  20px          Gap between columns: 20px
 *   Vertical gap (middle):  8px   Vertical gap (right): 12px
 *   Icon–text gap:          8px
 *   Font sizes:  10px (tags/badge) · 14px (body) · 20px (title)
 *   Colors:  #fff (title) · #ccc (body/values) · #999 (labels) · #333 (dividers)
 */
export default function HackathonCard({
  data,
  onClick,
  index = 0,
  className = "",
}: HackathonCardProps) {
  const statusConfig = getStatusConfig(data.status);
  const titleInitials = data.title.replace(/\s/g, "").slice(0, 2).toUpperCase();

  // ---- Host progressive disclosure via ResizeObserver ----
  const hostsContainerRef = useRef<HTMLDivElement>(null);
  const [visibleHostCount, setVisibleHostCount] = useState(data.hosts.length);

  useEffect(() => {
    const container = hostsContainerRef.current;
    if (!container) return;

    const calculate = () => {
      const items = container.querySelectorAll<HTMLElement>("[data-host-item]");
      if (items.length === 0) {
        setVisibleHostCount(0);
        return;
      }

      const containerRight = container.getBoundingClientRect().right;
      let count = items.length;
      for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        if (rect.right > containerRight + 1) {
          count = i;
          break;
        }
      }
      setVisibleHostCount(Math.max(count, 1));
    };

    // Defer initial calculation to ensure layout is complete
    requestAnimationFrame(calculate);
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
        group w-full cursor-pointer transition-all duration-300
        bg-[#1a1a1a] rounded-[8px]
        border border-[#262626] hover:border-[#3f3f3f] hover:bg-[#202020]
        ${className}
      `}
    >
      <div className="flex items-center gap-[20px] p-[20px]">
        {/* ========== 左区：缩略图 125×125 ========== */}
        <div className="flex-shrink-0 w-[125px] h-[125px] rounded-[8px] bg-[#2a2a2a] overflow-hidden flex items-center justify-center">
          {data.coverImage ? (
            <img
              src={data.coverImage}
              alt={data.title}
              className="w-full h-full object-cover"
            />
          ) : data.hosts[0]?.logo_url ? (
            <img
              src={data.hosts[0].logo_url}
              alt={data.hosts[0].name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[56px] font-bold text-[#666] leading-none">
              {titleInitials}
            </span>
          )}
        </div>

        {/* ========== 中区：信息主体 ========== */}
        <div className="flex-1 min-w-0 flex flex-col gap-[8px]">
          {/* 标签 */}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-[8px] items-center">
              {data.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-[4px] bg-[#2a2a2a] px-[6px] py-[2px] text-[10px] font-medium text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 标题 */}
          <h3 className="text-[20px] font-normal text-white truncate leading-none">
            {data.title}
          </h3>

          {/* 简介 */}
          {data.description && (
            <p className="text-[14px] text-[#ccc] leading-[16px] w-full">
              {data.description}
            </p>
          )}

          {/* 主办方 */}
          <div className="flex items-center text-[14px] min-w-0 overflow-hidden">
            <span className="text-[#999] font-medium flex-shrink-0 mr-[8px]">主办方：</span>
            <div
              ref={hostsContainerRef}
              className="flex items-center gap-[8px] min-w-0 flex-1 overflow-hidden"
            >
              {data.hosts.slice(0, visibleHostCount).map((h, i) => (
                <Fragment key={i}>
                  {i > 0 && (
                    <Separator
                      orientation="vertical"
                      className="!self-auto h-[14px] bg-[#333]"
                    />
                  )}
                  <div
                    data-host-item
                    className="flex items-center gap-[8px] flex-shrink-0"
                  >
                    {h.logo_url ? (
                      <img
                        src={h.logo_url}
                        alt={h.name}
                        className="h-[20px] w-[56px] rounded-[4px] object-contain bg-[#2a2a2a]"
                      />
                    ) : (
                      <span className="text-[14px] text-[#999] whitespace-nowrap">
                        {h.name}
                      </span>
                    )}
                  </div>
                </Fragment>
              ))}
              {visibleHostCount < data.hosts.length && (
                <span className="text-[14px] text-[#999] whitespace-nowrap flex-shrink-0">
                  等 {data.hosts.length} 个
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 竖线分隔符 */}
        <Separator orientation="vertical" className="h-[125px] bg-[#333]" />

        {/* ========== 右区：状态 + 信息 ========== */}
        <div className="flex-shrink-0 w-[220px] flex flex-col gap-[12px] items-start">
          {/* 状态胶囊 */}
          <span
            className={`
              inline-flex items-center justify-center
              rounded-[12px] px-[10px] py-[3px]
              text-[10px] font-medium
              ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}
            `}
          >
            {statusConfig.label}
          </span>

          {/* 时间 */}
          <div className="flex items-center gap-[8px] text-[14px] text-[#ccc]">
            <CalendarIcon />
            <span className="whitespace-nowrap">{data.dateRange}</span>
          </div>

          {/* 地点 */}
          <div className="flex items-center gap-[8px] text-[14px] text-[#ccc]">
            <LocationIcon />
            <span className="whitespace-nowrap">{data.location}</span>
          </div>

          {/* 奖金 */}
          <div className="flex items-center gap-[8px] text-[14px] text-[#ccc]">
            <TrophyIcon />
            <span className="whitespace-nowrap">{data.prizeText}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
