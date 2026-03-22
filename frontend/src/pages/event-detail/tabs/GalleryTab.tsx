import ProjectCard from "../../../components/ProjectCard";
import type { Project } from "../types";

interface GalleryTabProps {
  galleryProjects: Project[];
}

export default function GalleryTab({ galleryProjects }: GalleryTabProps) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-4">
        {galleryProjects.map((proj) => (
          <ProjectCard
            key={proj.id}
            project={proj}
            team={
              proj.team
                ? {
                    name: proj.team.name,
                    members: proj.team.members,
                    max_members: proj.team.max_members,
                  }
                : undefined
            }
          />
        ))}
        {galleryProjects.length === 0 && (
          <div className="col-span-5 text-center py-16 border border-white/[0.05]">
            <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase">
              暂无作品
            </div>
            <p className="text-[12px] text-gray-500 mt-2">
              活动作品将在这里展示
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
