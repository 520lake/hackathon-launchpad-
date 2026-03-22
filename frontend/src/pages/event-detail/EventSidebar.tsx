import { Button } from "@/components/ui/button";
import type { HackathonDetail } from "@/types/hackathon";
import type { Team } from "./types";
import CountdownTimer from "./CountdownTimer";

interface ScheduleItem {
  id: number;
  event_name: string;
  start_time: string;
  end_time: string;
}

interface EventSidebarProps {
  hackathon: HackathonDetail;
  activeTab: string;
  myTeam: Team | null;
  allScheduleItems: ScheduleItem[];
  onSetActiveTab: (tab: string) => void;
  onCreateTeamOpen: () => void;
  onSubmitOpen: () => void;
}

export default function EventSidebar({
  hackathon,
  activeTab,
  myTeam,
  allScheduleItems,
  onSetActiveTab,
  onCreateTeamOpen,
  onSubmitOpen,
}: EventSidebarProps) {
  return (
    <div
      className={`hidden md:block w-72 flex-shrink-0${["gallery", "judging", "publish"].includes(activeTab) ? " !hidden" : ""}`}
      style={{ flexBasis: "25%" }}
    >
      <div className="sticky top-24 space-y-6">
        {/* 右侧边栏操作区 */}
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
          {!myTeam ? (
            <>
              <Button
                onClick={onCreateTeamOpen}
                className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-[16px] hover:bg-white transition-colors duration-200 mb-4"
              >
                创建战队
              </Button>
              <p className="text-[11px] text-gray-500 text-center">
                创建战队后即可参与活动和提交作品
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-[16px]">
                  <span>✓</span> 已参与
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => onSetActiveTab("participants")}
                  className="py-2 border border-white/10 text-[11px] text-white rounded-[16px] hover:bg-[#111111] transition-colors duration-200"
                >
                  组队广场
                </Button>
                <Button
                  onClick={onSubmitOpen}
                  className="py-2 bg-[#FBBF24] text-black text-[11px] font-medium rounded-[16px] hover:bg-white transition-colors duration-200"
                >
                  提交作品
                </Button>
              </div>
            </>
          )}
        </div>

        {/* 倒计时 */}
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            活动倒计时
          </div>
          <CountdownTimer targetDate={hackathon.end_date} />
        </div>

        {/* 时间轴 */}
        {allScheduleItems.length > 0 && (
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">
              时间轴
            </div>
            <div className="space-y-4 relative pl-4 border-l border-[#222222]">
              {allScheduleItems.map((item, idx) => (
                <div key={item.id} className="relative">
                  <div
                    className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ${
                      idx === 0 ? "bg-[#FBBF24]" : "bg-gray-600"
                    }`}
                  ></div>
                  <div
                    className={`text-[10px] font-mono mb-1 ${
                      idx === 0 ? "text-[#FBBF24]" : "text-gray-500"
                    }`}
                  >
                    {new Date(item.start_time).toLocaleDateString("zh-CN")}
                    {" - "}
                    {new Date(item.end_time).toLocaleDateString("zh-CN")}
                  </div>
                  <div
                    className={`text-[12px] ${idx === 0 ? "text-white" : "text-gray-400"}`}
                  >
                    {item.event_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 主办方信息 */}
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            主办方
          </div>
          <div className="space-y-3">
            {(hackathon.hosts && hackathon.hosts.length > 0
              ? hackathon.hosts
              : [{ id: 0, name: "Aura 平台", logo_url: null, display_order: 0 }]
            ).map((host) => (
              <div key={host.id || host.name} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#111111] border border-[#333] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {host.logo_url ? (
                    <img
                      src={host.logo_url}
                      alt={host.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-gray-500">
                      {host.name?.[0] || "A"}
                    </span>
                  )}
                </div>
                <div className="text-sm text-white font-medium truncate">
                  {host.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 快速导航 */}
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">
            快速导航
          </div>
          <div className="space-y-1">
            {[
              { id: "overview", label: "活动详情" },
              { id: "myproject", label: "我的项目" },
              { id: "participants", label: "参赛人员" },
              { id: "gallery", label: "作品展示" },
              { id: "results", label: "评审结果" },
            ].map((item) => (
              <Button
                variant="ghost"
                key={item.id}
                onClick={() => onSetActiveTab(item.id)}
                className={`block w-full text-left px-3 py-2 text-[12px] rounded-[16px] transition-colors duration-200 ${
                  activeTab === item.id
                    ? "text-[#FBBF24] bg-[#FBBF24]/5"
                    : "text-gray-500 hover:text-white hover:bg-[#111111]"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
