import { useState, useEffect, useRef, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HackathonDetail } from "@/types/hackathon";

// Extracted components
import EventHeroBanner from "./event-detail/EventHeroBanner";
import EventSidebar from "./event-detail/EventSidebar";
import {
  OverviewTab,
  MyProjectTab,
  ParticipantsTab,
  GalleryTab,
} from "./event-detail/tabs";
import type { Team, Project, OutletContextType } from "./event-detail/types";

// Modals
import SubmitProjectModal from "../components/SubmitProjectModal";
import JudgingPanel from "../components/JudgingPanel";
import ResultPublishPanel from "../components/ResultPublishPanel";
import LeaderboardTable from "../components/LeaderboardTable";
import AIResumeModal from "../components/AIResumeModal";
import TeamMatchModal from "../components/TeamMatchModal";
import CreateTeamModal from "../components/CreateTeamModal";
import AIProjectAssistant from "../components/AIProjectAssistant";
import CreateRecruitmentModal from "../components/CreateRecruitmentModal";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, currentUser } = useOutletContext<OutletContextType>();

  const hackathonId = id ? parseInt(id) : null;
  const tabParam = searchParams.get("tab");

  const [hackathon, setHackathon] = useState<HackathonDetail | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [myProject, setMyProject] = useState<Project | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState(tabParam || "overview");
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [galleryProjects, setGalleryProjects] = useState<Project[]>([]);
  const [isJudge, setIsJudge] = useState(false);

  // Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false);
  const [isTeamMatchOpen, setIsTeamMatchOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isRecruitOpen, setIsRecruitOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOrganizer = hackathon?.created_by === currentUser?.id;

  // Guard: redirect non-organizers away from organizer-only tabs
  useEffect(() => {
    if (hackathon && !isOrganizer && (activeTab === "judging" || activeTab === "publish")) {
      setActiveTab("overview");
    }
  }, [hackathon, isOrganizer, activeTab]);

  const sectionsByType = useMemo(() => {
    if (!hackathon?.sections)
      return { markdown: [], schedules: [], prizes: [], judgingCriteria: [] };
    const sorted = [...hackathon.sections].sort(
      (a, b) => a.display_order - b.display_order,
    );
    return {
      markdown: sorted.filter((s) => s.section_type === "markdown"),
      schedules: sorted.filter((s) => s.section_type === "schedules"),
      prizes: sorted.filter((s) => s.section_type === "prizes"),
      judgingCriteria: sorted.filter(
        (s) => s.section_type === "judging_criteria",
      ),
    };
  }, [hackathon?.sections]);

  const allScheduleItems = useMemo(() => {
    return sectionsByType.schedules
      .flatMap((s) => s.schedules ?? [])
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );
  }, [sectionsByType.schedules]);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Data fetching ---

  useEffect(() => {
    if (hackathonId) {
      fetchHackathon();
      fetchTeams();
      fetchGallery();
      if (isLoggedIn) {
        fetchEnrollment();
        fetchJudgeStatus();
      }
    }
  }, [hackathonId, isLoggedIn]);

  useEffect(() => {
    if (activeTab === "participants") {
      fetchTeams();
    } else if (activeTab === "myproject" || activeTab === "gallery") {
      fetchGallery();
    }
  }, [activeTab]);

  const fetchHackathon = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/hackathons/${hackathonId}`);
      setHackathon(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`/api/v1/teams?hackathon_id=${hackathonId}`);
      setTeams(res.data);
    } catch (e) {
      console.error("获取团队失败:", e);
    }
    try {
      const resPart = await axios.get(
        `/api/v1/enrollments/public/${hackathonId}`,
      );
      setParticipants(resPart.data);
    } catch (e) {
      console.error("获取参赛者失败:", e);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await axios.get(
        `/api/v1/submissions?hackathon_id=${hackathonId}`,
      );
      setGalleryProjects(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJudgeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/v1/hackathons/${hackathonId}/judges/me`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsJudge(res.data.is_judge);
    } catch {
      setIsJudge(false);
    }
  };

  const fetchEnrollment = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/v1/enrollments/my/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollment(res.data);

      const teamRes = await axios.get(`/api/v1/teams/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamsArr = Array.isArray(teamRes.data) ? teamRes.data : [];
      const teamForHackathon = teamsArr.find(
        (t: Team) => t.hackathon_id === hackathonId,
      );
      setMyTeam(teamForHackathon || null);

      const projRes = await axios.get(`/api/v1/submissions/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subsArr = Array.isArray(projRes.data) ? projRes.data : [];
      const subForHackathon = subsArr.find(
        (s: Project) => s.hackathon_id === hackathonId,
      );
      setMyProject(subForHackathon || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHackathon = async () => {
    if (!hackathonId) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      await axios.delete(`/api/v1/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/events");
    } catch (e: any) {
      console.error("删除活动失败:", e);
      const detail = e.response?.data?.detail;
      alert(typeof detail === "string" ? detail : "删除活动失败，请重试");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleJoinTeam = async (teamId: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/v1/teams/${teamId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchTeams();
      fetchEnrollment();
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      alert(typeof detail === "string" ? detail : "加入失败");
    }
  };

  const handleCreateTeam = async (teamData: {
    name: string;
    description: string;
    max_members: number;
  }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/v1/teams?hackathon_id=${hackathonId}`,
        teamData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchTeams();
      fetchEnrollment();
      setIsCreateTeamOpen(false);
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      alert(typeof detail === "string" ? detail : "创建战队失败");
    }
  };

  // --- Loading / Not found ---

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500">活动不存在</div>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-black" ref={containerRef}>
      <EventHeroBanner
        hackathon={hackathon}
        isLoggedIn={isLoggedIn}
        isOrganizer={isOrganizer}
        onDeleteOpen={() => setShowDeleteConfirm(true)}
        onStartProject={() => setActiveTab("myproject")}
        onTeamMatchOpen={() => setIsTeamMatchOpen(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-[#222222] mb-8">
          <div className="flex items-center">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent p-0 h-auto" variant="line">
                {[
                  { id: "overview", label: "活动详情" },
                  {
                    id: "myproject",
                    label: isOrganizer ? "作品管理" : "我的项目",
                  },
                  {
                    id: "participants",
                    label: isOrganizer ? "参赛管理" : "参赛人员",
                  },
                  { id: "gallery", label: "作品展示" },
                  { id: "results", label: "评审结果" },
                  ...(isOrganizer
                    ? [
                        { id: "judging", label: "评审管理" },
                        { id: "publish", label: "发布结果" },
                      ]
                    : isJudge
                      ? [{ id: "judging", label: "评审" }]
                      : []),
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="px-6 py-4 text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors duration-200 rounded-none border-transparent bg-transparent text-gray-500 hover:text-gray-300 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none after:bg-[#FBBF24]"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex gap-8">
            {/* Left content area 75% */}
            <div
              className="flex-1 min-w-0"
              style={{
                flexBasis: ["gallery", "judging", "publish"].includes(activeTab) ? "100%" : "75%",
              }}
            >
              {activeTab === "overview" && (
                <OverviewTab hackathon={hackathon} />
              )}

              {activeTab === "myproject" && (
                <MyProjectTab
                  hackathon={hackathon}
                  isLoggedIn={isLoggedIn}
                  myTeam={myTeam}
                  myProject={myProject}
                  onSubmitOpen={() => setIsSubmitOpen(true)}
                  onCreateTeamOpen={() => setIsCreateTeamOpen(true)}
                  onAIAssistantOpen={() => setIsAIAssistantOpen(true)}
                  onTeamMatchOpen={() => setIsTeamMatchOpen(true)}
                  onRecruitOpen={() => setIsRecruitOpen(true)}
                  onNavigateParticipants={() => setActiveTab("participants")}
                  onNavigateCommunity={() => navigate("/community")}
                />
              )}

              {activeTab === "participants" && (
                <ParticipantsTab
                  teams={teams}
                  participants={participants}
                  myTeam={myTeam}
                  enrollment={enrollment}
                  onJoinTeam={handleJoinTeam}
                />
              )}

              {activeTab === "gallery" && (
                <GalleryTab galleryProjects={galleryProjects} />
              )}

              {activeTab === "results" && (
                <div>
                  <h3 className="text-[11px] tracking-[0.2em] text-gray-600 uppercase mb-4">
                    评分排行榜
                  </h3>
                  <LeaderboardTable hackathonId={hackathonId!} />
                </div>
              )}

              {/* JUDGING TAB - 评审管理 (organizer/judge only) */}
              {activeTab === "judging" && (isOrganizer || isJudge) && hackathonId && (
                <JudgingPanel
                  hackathonId={hackathonId}
                  hackathonTitle={hackathon?.title || ""}
                />
              )}

              {/* PUBLISH TAB - 发布结果 (organizer only) */}
              {activeTab === "publish" && isOrganizer && hackathonId && (
                <ResultPublishPanel
                  hackathonId={hackathonId}
                  onPublished={() => {
                    fetchHackathon();
                    setActiveTab("results");
                  }}
                />
              )}
            </div>

            {/* Right sidebar 25% */}
            <EventSidebar
              hackathon={hackathon}
              activeTab={activeTab}
              myTeam={myTeam}
              allScheduleItems={allScheduleItems}
              onSetActiveTab={setActiveTab}
              onCreateTeamOpen={() => setIsCreateTeamOpen(true)}
              onSubmitOpen={() => setIsSubmitOpen(true)}
            />
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      {hackathonId && (
        <>
          <SubmitProjectModal
            isOpen={isSubmitOpen}
            onClose={() => {
              setIsSubmitOpen(false);
              fetchEnrollment();
              fetchGallery();
            }}
            hackathonId={hackathonId}
            teamId={myTeam?.id}
            registrationType={hackathon?.registration_type || "team"}
            existingSubmission={myProject}
          />
          <TeamMatchModal
            isOpen={isTeamMatchOpen}
            onClose={() => setIsTeamMatchOpen(false)}
            hackathonId={hackathonId}
          />
          <CreateTeamModal
            isOpen={isCreateTeamOpen}
            onClose={() => setIsCreateTeamOpen(false)}
            onCreate={handleCreateTeam}
          />
          <AIProjectAssistant
            isOpen={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
          />
          <CreateRecruitmentModal
            isOpen={isRecruitOpen}
            onClose={() => setIsRecruitOpen(false)}
            teamId={myTeam?.id || 0}
            onSuccess={fetchTeams}
          />
        </>
      )}
      <AIResumeModal
        isOpen={isAIResumeOpen}
        onClose={() => setIsAIResumeOpen(false)}
      />

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#222222] px-4 py-3 z-40">
        {!isLoggedIn ? (
          <Button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-md hover:bg-white transition-colors"
          >
            登录参与
          </Button>
        ) : isOrganizer ? (
          <Button
            onClick={() => navigate(`/create?edit=${hackathon.id}`)}
            className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-md hover:bg-white transition-colors"
          >
            编辑活动
          </Button>
        ) : !myTeam ? (
          <Button
            onClick={() => setActiveTab("myproject")}
            className="w-full py-3 bg-[#FBBF24] text-black font-bold rounded-md hover:bg-white transition-colors"
          >
            开始项目
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab("participants")}
              className="flex-1 py-3 border border-white/10 text-white text-sm font-medium rounded-md hover:bg-[#111111]"
            >
              组队广场
            </Button>
            <Button
              onClick={() => setIsSubmitOpen(true)}
              className="flex-1 py-3 bg-[#FBBF24] text-black font-bold rounded-md hover:bg-white"
            >
              提交作品
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#0A0A0A] border border-[#222222] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除活动</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              您确定要删除活动{" "}
              <span className="text-white font-medium">
                "{hackathon?.title}"
              </span>
              吗？删除后，所有相关数据（报名、团队、作品等）都将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border border-[#333333] text-gray-300 hover:bg-white/5"
              disabled={isDeleting}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteHackathon();
              }}
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
