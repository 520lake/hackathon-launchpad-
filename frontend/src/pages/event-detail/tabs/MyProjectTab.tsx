import { Button } from "@/components/ui/button";
import ProjectCard from "../../../components/ProjectCard";
import type { Team, Project } from "../types";
import type { HackathonDetail } from "@/types/hackathon";

interface MyProjectTabProps {
  hackathon: HackathonDetail;
  isLoggedIn: boolean;
  myTeam: Team | null;
  myProject: Project | null;
  onSubmitOpen: () => void;
  onCreateTeamOpen: () => void;
  onAIAssistantOpen: () => void;
  onTeamMatchOpen: () => void;
  onRecruitOpen: () => void;
  onNavigateParticipants: () => void;
  onNavigateCommunity: () => void;
}

export default function MyProjectTab({
  hackathon,
  isLoggedIn,
  myTeam,
  myProject,
  onSubmitOpen,
  onCreateTeamOpen,
  onAIAssistantOpen,
  onTeamMatchOpen,
  onRecruitOpen,
  onNavigateParticipants,
  onNavigateCommunity,
}: MyProjectTabProps) {
  return (
    <div className="space-y-8">
      {/* Quick action CTA buttons */}
      {isLoggedIn && (
        <div className="border-b border-white/[0.08] pb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
            <span className="w-5 h-[2px] bg-brand"></span>
            我的项目
          </h3>
          {!myTeam && !myProject ? (
            <div className="border border-white/[0.08] p-6 rounded-[16px]">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-white text-sm font-medium">
                    开始您的黑客松之旅
                  </p>
                  <p className="text-[12px] text-gray-600 mt-1">
                    {hackathon?.registration_type === "individual"
                      ? "本活动为个人参赛模式"
                      : "选择适合您的方式参与"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {hackathon?.registration_type === "individual" ? (
                    <Button
                      onClick={onSubmitOpen}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand text-black text-sm font-medium hover:bg-white transition-colors rounded-[16px]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      提交作品
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={onCreateTeamOpen}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand text-black text-sm font-medium hover:bg-white transition-colors rounded-[16px]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        创建战队
                      </Button>
                      <Button
                        variant="outline"
                        onClick={onNavigateParticipants}
                        className="flex items-center gap-2 px-5 py-2.5 border border-[#FBBF24]/30 text-[#FBBF24] text-sm hover:bg-[#FBBF24]/10 transition-colors rounded-[16px]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        加入战队
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 项目卡片 */}
              <ProjectCard
                variant="horizontal"
                project={{
                  id: myProject?.id || 0,
                  title: myProject?.title || "未命名项目",
                  description: myProject?.description,
                  tech_stack: myProject?.tech_stack,
                  cover_image: myProject?.cover_image,
                  total_score: myProject?.total_score,
                }}
                team={
                  myTeam
                    ? {
                        name: myTeam.name,
                        members: myTeam.members,
                        max_members: myTeam.max_members,
                      }
                    : undefined
                }
                onEdit={onSubmitOpen}
              />

              {/* 快捷操作栏 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={onAIAssistantOpen}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 rounded-[16px] hover:border-brand/50 transition-colors"
                >
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm text-white">AI 助手</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={onTeamMatchOpen}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 rounded-[16px] hover:border-brand/50 transition-colors"
                >
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-white">智能组队</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={onRecruitOpen}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 rounded-[16px] hover:border-brand/50 transition-colors"
                >
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="text-sm text-white">发布招募</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={onNavigateCommunity}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 rounded-[16px] hover:border-brand/50 transition-colors"
                >
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-white">招募大厅</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
