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
  onEdit?: () => void;
  onClick?: () => void;
}

export default function ProjectCard({
  project,
  team,
  onEdit,
  onClick,
}: ProjectCardProps) {
  return (
    <div
      className="border border-white/[0.08] rounded-[16px] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex">
        <div className="w-[3px] bg-brand" />
        <div className="flex-1 p-6">
          <div className="flex items-start gap-6">
            {/* Cover image */}
            <div className="w-32 h-24 bg-white/[0.02] border border-white/[0.08] rounded-[16px] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {project.cover_image ? (
                <img
                  src={project.cover_image}
                  className="w-full h-full object-cover"
                  alt={project.title}
                />
              ) : (
                <span className="text-2xl font-bold text-white/20">
                  {(project.title || "未命名")[0]}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-2">
                {project.title || "未命名项目"}
              </h4>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {project.description || "暂无描述"}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-gray-500">
                {project.tech_stack && (
                  <span>技术栈: {project.tech_stack}</span>
                )}
                {project.total_score != null && project.total_score > 0 && (
                  <span className="text-brand">
                    得分: {project.total_score.toFixed(1)}
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
                    {team.name} ({team.members?.length || 1}/
                    {team.max_members || "-"})
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            {onEdit && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="px-4 py-2 border border-white/[0.15] text-[12px] text-white hover:bg-white hover:text-black transition-colors rounded-[16px]"
              >
                编辑项目
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
