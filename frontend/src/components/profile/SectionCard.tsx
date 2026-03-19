interface SectionCardProps {
  title: string;
  count: number;
  maxPreview?: number;
  onViewMore: () => void;
  children: React.ReactNode;
  emptyText?: string;
}

export default function SectionCard({
  title,
  count,
  maxPreview,
  onViewMore,
  children,
  emptyText = "未找到相关项目",
}: SectionCardProps) {
  const showViewMore = maxPreview != null ? count > maxPreview : count > 0;

  return (
    <div className="bg-[rgba(9,9,11,0.5)] border border-[#27272a] rounded-[14px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[16px] font-semibold text-[#e4e4e7]">
            {title}
          </h3>
          <span className="inline-flex items-center justify-center rounded-[12px] px-[10px] py-[3px] bg-[#18181b] border border-[#27272a] text-gray-400 text-[12px]">
            {count}
          </span>
        </div>
        {showViewMore && (
          <button
            onClick={onViewMore}
            className="flex items-center gap-1 text-[12px] text-[#9f9fa9] hover:text-white transition-colors"
          >
            查看更多
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[#333] my-4" />

      {/* Content */}
      {count > 0 ? children : (
        <div className="text-center py-8 text-gray-500 text-sm">
          {emptyText}
        </div>
      )}
    </div>
  );
}
