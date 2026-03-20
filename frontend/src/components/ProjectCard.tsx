import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description?: string;
    tech_stack?: string;
    cover_image?: string;
    total_score?: number;
  };
  team?: {
    name: string;
    members?: any[];
    max_members?: number;
  };
  variant?: "horizontal" | "vertical";
  onEdit?: () => void;
  onClick?: () => void;
}

export default function ProjectCard({
  project,
  team,
  variant = "vertical",
  onEdit,
  onClick,
}: ProjectCardProps) {
  const isVertical = variant === "vertical";

  return (
    <div
      className="group border border-white/[0.08] rounded-[16px] cursor-pointer hover:border-brand/30 transition-all overflow-hidden"
      onClick={onClick}
    >
      <div className={isVertical ? "" : "flex"}>
        {/* Cover image */}
        <div
          className={
            isVertical
              ? "aspect-[4/3] bg-white/[0.02] overflow-hidden"
              : "w-32 h-24 bg-white/[0.02] flex-shrink-0 overflow-hidden m-4 rounded-[12px] border border-white/[0.08]"
          }
        >
          {project.cover_image ? (
            <img
              src={project.cover_image}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              alt={project.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white/20">
              {(project.title || "未命名")[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={isVertical ? "p-4" : "flex-1 py-4 pr-4"}>
          <h4
            className={`font-semibold text-white truncate group-hover:text-brand transition-colors ${
              isVertical ? "text-sm mb-1" : "text-lg mb-2"
            }`}
          >
            {project.title || "未命名项目"}
          </h4>
          <p
            className={`text-gray-400 ${
              isVertical ? "text-[12px] mb-3 line-clamp-2" : "text-sm mb-4 line-clamp-2"
            }`}
          >
            {project.description || "暂无描述"}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
            {project.tech_stack && (
              <span className="px-1.5 py-0.5 border border-white/[0.08] rounded">
                {project.tech_stack}
              </span>
            )}
            {project.total_score != null && project.total_score > 0 && (
              <span className="text-brand">
                {project.total_score.toFixed(1)}分
              </span>
            )}
            {team && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {team.name}
              </span>
            )}
          </div>

          {/* Edit button */}
          {onEdit && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className={`mt-3 py-2 border border-white/[0.15] text-[12px] text-white hover:bg-white hover:text-black transition-colors rounded-[16px] ${
                isVertical ? "w-full" : "px-4"
              }`}
            >
              编辑项目
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
