import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { HackathonDetail } from "@/types/hackathon";
import { formatLocation } from "@/utils/hackathon";
import { getTagColor } from "@/utils/constants";

interface EventHeroBannerProps {
  hackathon: HackathonDetail;
  isLoggedIn: boolean;
  isOrganizer: boolean;
  onDeleteOpen: () => void;
  onStartProject: () => void;
  onTeamMatchOpen: () => void;
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    draft: "草稿",
    published: "已发布",
    ongoing: "进行中",
    ended: "已结束",
  };
  return map[status] || status;
}

export default function EventHeroBanner({
  hackathon,
  isLoggedIn,
  isOrganizer,
  onDeleteOpen,
  onStartProject,
  onTeamMatchOpen,
}: EventHeroBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="relative h-[45vh] min-h-[360px] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2a] via-[#0d1020] to-black">
        {hackathon.cover_image && (
          <img
            src={hackathon.cover_image}
            alt={hackathon.title}
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          {hackathon.title}
        </h1>

        {hackathon.description && (
          <p className="text-base text-gray-300 mb-4 max-w-3xl leading-relaxed">
            {hackathon.description}
          </p>
        )}

        {/* Info Bar */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
          {hackathon.tags && hackathon.tags.length > 0 && (
            <div className="flex items-center gap-2">
              {hackathon.tags.map((tag, i) => {
                const color = getTagColor(tag);
                return (
                  <span
                    key={i}
                    className={`px-2.5 py-0.5 text-[11px] font-medium rounded-[8px] border ${color.bg} ${color.text} ${color.border}`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[#FBBF24]">◆</span>
            <span>
              {new Date(hackathon.start_date).toLocaleDateString("zh-CN")} -{" "}
              {new Date(hackathon.end_date).toLocaleDateString("zh-CN")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#FBBF24]">◆</span>
            <span>
              {formatLocation(hackathon.province, hackathon.city, hackathon.district)}
            </span>
          </div>
          {/* Status badge */}
          <div
            className={`px-4 py-1.5 text-[12px] font-medium flex items-center gap-2 rounded-[16px] ${
              hackathon.status === "published"
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                : hackathon.status === "ongoing"
                  ? "bg-sky-500/20 border border-sky-500/40 text-sky-400"
                  : hackathon.status === "ended"
                    ? "bg-gray-500/20 border border-gray-500/40 text-gray-400"
                    : "bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                hackathon.status === "published"
                  ? "bg-emerald-400"
                  : hackathon.status === "ongoing"
                    ? "bg-sky-400"
                    : hackathon.status === "ended"
                      ? "bg-gray-400"
                      : "bg-brand"
              }`}
            />
            {getStatusText(hackathon.status)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          {isOrganizer && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/create?edit=${hackathon.id}`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-[16px] hover:border-white hover:text-white transition-colors text-[13px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                编辑活动
              </Button>
              <Button
                variant="outline"
                onClick={onDeleteOpen}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 rounded-[16px] hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-colors text-[13px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                删除活动
              </Button>
            </>
          )}

          {isLoggedIn && !isOrganizer && (
            <>
              <Button
                onClick={onStartProject}
                className="flex items-center gap-2 px-4 py-2 bg-[#FBBF24] text-black font-medium rounded-[16px] hover:bg-white transition-colors text-[13px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                开始项目
              </Button>
              <Button
                variant="outline"
                onClick={onTeamMatchOpen}
                className="flex items-center gap-2 px-4 py-2 border border-[#FBBF24]/50 text-[#FBBF24] rounded-[16px] hover:bg-[#FBBF24]/10 transition-colors text-[13px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                智能组队
              </Button>
            </>
          )}

          {!isLoggedIn && (
            <Button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-6 py-2 bg-[#FBBF24] text-black font-medium rounded-md hover:bg-white transition-colors text-[13px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              登录参与
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
