import ReactMarkdown from "react-markdown";
import type { HackathonDetail } from "@/types/hackathon";

interface OverviewTabProps {
  hackathon: HackathonDetail;
}

export default function OverviewTab({ hackathon }: OverviewTabProps) {
  return (
    <div className="space-y-12">
      {/* Render all sections in display_order */}
      {hackathon.sections
        ?.sort((a, b) => a.display_order - b.display_order)
        .map((section) => {
          // --- Markdown sections ---
          if (section.section_type === "markdown" && section.content) {
            return (
              <section key={section.id} id={`section-${section.id}`}>
                {section.title && (
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-[#FBBF24] font-mono">//</span>
                    {section.title}
                  </h3>
                )}
                <div className="prose prose-invert max-w-none text-gray-300">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </section>
            );
          }

          // --- Prize sections ---
          if (section.section_type === "prizes" && section.prizes?.length) {
            return (
              <section key={section.id} id={`section-${section.id}`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-[#FBBF24] font-mono">//</span>
                  {section.title || "奖项设置"}
                </h3>
                <div className="space-y-4">
                  {section.prizes
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((prize) => (
                      <div
                        key={prize.id}
                        className="bg-[#111111] border border-[#222222] rounded-[16px] p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            {prize.name}
                          </span>
                          <span className="text-gray-500 text-sm">
                            名额: {prize.quantity}
                          </span>
                        </div>
                        {prize.total_cash_amount > 0 && (
                          <div className="text-[#FBBF24] font-bold mt-2">
                            ¥{Number(prize.total_cash_amount).toLocaleString()}
                          </div>
                        )}
                        {prize.winning_standards && (
                          <div className="text-gray-400 text-sm mt-1">
                            {prize.winning_standards}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            );
          }

          // --- Judging criteria sections ---
          if (
            section.section_type === "judging_criteria" &&
            section.judging_criteria?.length
          ) {
            return (
              <section key={section.id} id={`section-${section.id}`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-[#FBBF24] font-mono">//</span>
                  {section.title || "评审标准"}
                </h3>
                <div className="space-y-4">
                  {section.judging_criteria
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((criterion) => (
                      <div
                        key={criterion.id}
                        className="bg-[#111111] border border-[#222222] rounded-[16px] p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            {criterion.name}
                          </span>
                          <span className="text-[#FBBF24] font-bold">
                            {criterion.weight_percentage}%
                          </span>
                        </div>
                        {criterion.description && (
                          <p className="text-gray-500 text-sm">
                            {criterion.description}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            );
          }

          // --- Schedule sections ---
          if (
            section.section_type === "schedules" &&
            section.schedules?.length
          ) {
            return (
              <section key={section.id} id={`section-${section.id}`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-[#FBBF24] font-mono">//</span>
                  {section.title || "日程安排"}
                </h3>
                <div className="space-y-3">
                  {section.schedules
                    .sort(
                      (a, b) =>
                        new Date(a.start_time).getTime() -
                        new Date(b.start_time).getTime(),
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#111111] border border-[#222222] rounded-[16px] p-4 flex items-center gap-4"
                      >
                        <div className="text-[11px] font-mono text-gray-500 w-32 flex-shrink-0">
                          {new Date(item.start_time).toLocaleDateString(
                            "zh-CN",
                          )}
                        </div>
                        <div className="text-sm text-white">
                          {item.event_name}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            );
          }

          return null;
        })}

      {/* Partners section */}
      {hackathon.partners && hackathon.partners.length > 0 && (
        <section id="partners">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#FBBF24] font-mono">//</span>
            合作伙伴
          </h3>
          <div className="space-y-6">
            {Array.from(
              new Set(hackathon.partners.map((p) => p.category)),
            ).map((category) => (
              <div key={category}>
                <h4 className="text-sm text-gray-400 mb-3 uppercase tracking-wider">
                  {category}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hackathon.partners
                    .filter((p) => p.category === category)
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((partner) => (
                      <a
                        key={partner.id}
                        href={partner.website_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-4 border border-white/[0.08] rounded-[16px] hover:border-brand/30 transition-colors"
                      >
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.name}
                            className="h-10 w-auto object-contain"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center text-white font-bold">
                            {partner.name[0]}
                          </div>
                        )}
                        <span className="text-xs text-gray-400 text-center truncate w-full">
                          {partner.name}
                        </span>
                      </a>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state when no sections exist */}
      {(!hackathon.sections || hackathon.sections.length === 0) &&
        (!hackathon.partners || hackathon.partners.length === 0) && (
          <div className="text-center py-20 border border-white/[0.05] rounded-[16px]">
            <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase mb-4">
              暂无活动详情
            </div>
            <p className="text-sm text-gray-500">活动内容正在准备中</p>
          </div>
        )}
    </div>
  );
}
