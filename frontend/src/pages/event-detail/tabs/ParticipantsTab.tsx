import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Team } from "../types";

interface ParticipantsTabProps {
  teams: Team[];
  participants: any[];
  myTeam: Team | null;
  enrollment: any;
  onJoinTeam: (teamId: number) => void;
}

export default function ParticipantsTab({
  teams,
  participants,
  myTeam,
  enrollment,
  onJoinTeam,
}: ParticipantsTabProps) {
  const [identityFilter, setIdentityFilter] = useState<"all" | "individual" | "team">("all");
  const [locationSearch, setLocationSearch] = useState("");

  return (
    <div className="space-y-8">
      {/* 筛选条 */}
      <div className="flex items-center gap-4 pb-6 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 uppercase tracking-wider">
            身份:
          </span>
          <div className="flex gap-1">
            {[
              { key: "all", label: "全部" },
              { key: "individual", label: "个人" },
              { key: "team", label: "团队" },
            ].map((item) => (
              <Button
                variant="ghost"
                key={item.key}
                onClick={() => setIdentityFilter(item.key as any)}
                className={`px-3 py-1.5 text-[11px] rounded-md transition-colors duration-200 ease-in-out ${
                  identityFilter === item.key
                    ? "bg-[#FBBF24] text-black font-medium"
                    : "border border-[#222222] text-gray-500 hover:text-white hover:border-gray-600"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Input
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            placeholder="搜索地点..."
            className="bg-transparent border border-[#222222] rounded-md px-3 py-1.5 text-[12px] text-white placeholder-gray-600 focus:border-[#FBBF24]/50 outline-none w-40 transition-colors duration-200"
          />
          <Button
            variant="link"
            onClick={() => {
              setIdentityFilter("all");
              setLocationSearch("");
            }}
            className="text-[11px] text-gray-500 hover:text-[#FBBF24] transition-colors duration-200"
          >
            重置
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            总参赛者
          </div>
          <div className="text-2xl font-bold text-white">
            {participants.length}
          </div>
        </div>
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            团队数
          </div>
          <div className="text-2xl font-bold text-white">{teams.length}</div>
        </div>
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            招募中
          </div>
          <div className="text-2xl font-bold text-[#FBBF24]">
            {teams.filter((t) => t.recruitments && t.recruitments.length > 0).length}
          </div>
        </div>
      </div>

      {/* 团队列表 - List Row 布局 */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222222]">
          <h4 className="text-sm font-medium text-white flex items-center gap-3">
            <span className="text-[#FBBF24] font-mono">//</span>
            团队 & 招募
            <span className="px-2 py-0.5 bg-[#111111] text-gray-500 text-[11px] rounded-md">
              {teams.length}
            </span>
          </h4>
        </div>

        {teams.length > 0 ? (
          <div>
            {teams.map((team, idx) => (
              <div
                key={team.id}
                className={`flex items-center gap-5 px-6 py-5 hover:bg-[#111111] transition-colors duration-200 ease-in-out cursor-pointer ${
                  idx !== teams.length - 1 ? "border-b border-[#222222]" : ""
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#111111] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {team.members?.[0]?.user?.avatar_url ? (
                    <img
                      src={team.members[0].user.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-500">
                      {team.name[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h5 className="text-[14px] font-semibold text-white">
                      {team.name}
                    </h5>
                    {team.recruitments && team.recruitments.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-[16px]">
                        招募中
                      </span>
                    )}
                    <span className="text-[11px] text-gray-600 font-mono">
                      {team.members?.length || 0}人
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate">
                    {team.description || "暂无描述"}
                  </p>
                </div>

                {/* Recruitment Tags */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {team.recruitments?.slice(0, 3).map((r) => (
                    <span
                      key={r.id}
                      className="px-2 py-1 text-[10px] border border-[#333] text-gray-400 rounded-[16px]"
                    >
                      招{r.role}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!myTeam && enrollment && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinTeam(team.id);
                      }}
                      className="px-3 py-1.5 text-[11px] bg-[#FBBF24] text-black font-medium rounded-[16px] hover:bg-white transition-colors duration-200"
                    >
                      + 加入
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-[11px] border border-[#333] text-gray-400 rounded-[16px] hover:text-white hover:border-gray-500 transition-colors duration-200"
                  >
                    联系
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 text-sm">
            暂无团队
          </div>
        )}
      </div>

      {/* 个人参赛者 - List Row 布局 */}
      {(() => {
        const teamMemberIds = new Set(
          teams.flatMap((t) => t.members?.map((m: any) => m.user_id) || []),
        );
        const individualParticipants = participants.filter(
          (p) => !teamMemberIds.has(p.user_id),
        );
        return (
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#222222]">
              <h4 className="text-sm font-medium text-white flex items-center gap-3">
                <span className="text-[#FBBF24] font-mono">//</span>
                个人参赛者
                <span className="px-2 py-0.5 bg-[#111111] text-gray-500 text-[11px] rounded-[16px]">
                  {individualParticipants.length}
                </span>
              </h4>
            </div>

            {individualParticipants.length > 0 ? (
              <div>
                {individualParticipants.map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className={`flex items-center gap-5 px-6 py-4 hover:bg-[#111111] transition-colors duration-200 ease-in-out ${
                      idx !== individualParticipants.length - 1
                        ? "border-b border-[#222222]"
                        : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#111111] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-500">
                          {(p.nickname || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">
                        {p.nickname || "匿名"}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {p.bio || "个人参赛"}
                      </div>
                    </div>

                    {/* Skills */}
                    {p.skills && p.skills.length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {p.skills
                          .slice(0, 3)
                          .map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[10px] border border-[#333] text-gray-500 rounded-[16px]"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Action */}
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 text-[11px] border border-[#333] text-gray-400 rounded-md hover:text-white hover:border-gray-500 transition-colors duration-200 flex-shrink-0"
                    >
                      查看
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600 text-sm">
                暂无个人参赛者
              </div>
            )}
          </div>
        );
      })()}

      {teams.length === 0 && participants.length === 0 && (
        <div className="text-center py-20 bg-[#0A0A0A] border border-[#222222] rounded-xl">
          <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase">
            暂无参赛者
          </div>
        </div>
      )}
    </div>
  );
}
