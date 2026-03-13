import { useState, useEffect, useRef } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Modals
import SubmitProjectModal from "../components/SubmitProjectModal";
import JudgingModal from "../components/JudgingModal";
import ResultPublishModal from "../components/ResultPublishModal";
import AIResumeModal from "../components/AIResumeModal";
import TeamMatchModal from "../components/TeamMatchModal";
import CreateTeamModal from "../components/CreateTeamModal";
import AIProjectAssistant from "../components/AIProjectAssistant";
import CreateRecruitmentModal from "../components/CreateRecruitmentModal";

// Interfaces
interface Recruitment {
  id: number;
  team_id: number;
  role: string;
  skills: string;
  count: number;
  description?: string;
  status: string;
  created_at: string;
  team?: Team;
}

interface HackathonHostItem {
  id: number;
  name: string;
  logo?: string;
  display_order: number;
}

interface Hackathon {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  registration_type?: "individual" | "team";
  format?: "online" | "offline";
  location?: string;
  organizer_name?: string;
  contact_info?: string;
  requirements?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  submission_start_date?: string;
  submission_end_date?: string;
  judging_start_date?: string;
  judging_end_date?: string;
  awards_detail?: string;
  rules_detail?: string;
  scoring_dimensions?: string;
  resource_detail?: string;
  results_detail?: string;
  sponsors_detail?: string;
  status: string;
  organizer_id: number;
  hosts?: HackathonHostItem[];
}

interface TeamMember {
  id: number;
  user_id: number;
  user?: any;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  hackathon_id: number;
  leader_id: number;
  members?: TeamMember[];
  recruitments?: Recruitment[];
  max_members?: number;
}

interface Project {
  id: number;
  title: string;
  description: string;
  tech_stack?: string;
  repo_url?: string;
  demo_url?: string;
  hackathon_id: number;
  team_id: number;
  team?: Team;
  status: string;
  cover_image?: string;
  total_score?: number;
}

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
  fetchCurrentUser: () => void;
}

// 解析奖项 JSON
interface AwardItem {
  name: string;
  prize: string;
  description?: string;
  count?: number;
  amount?: number;
  prize_pool?: number;
}

const parseAwardsDetail = (awardsDetail?: string): AwardItem[] => {
  if (!awardsDetail) return [];
  try {
    const parsed = JSON.parse(awardsDetail);
    if (Array.isArray(parsed)) {
      // 转换数据格式，支持多种字段名
      return parsed.map((item) => ({
        name: item.name || "",
        prize: item.prize || item.prize_pool || "",
        description: item.description || "",
        count: item.count || item.quota || 1,
        amount:
          item.amount ||
          (typeof item.prize_pool === "number" ? item.prize_pool : 0),
      }));
    }
  } catch (e) {
    // 如果不是 JSON，返回空数组
  }
  return [];
};

// 解析评审维度 JSON
const parseScoringDimensions = (
  dimensions?: string,
): Array<{ name: string; description: string; weight: number }> => {
  if (!dimensions) return [];
  try {
    const parsed = JSON.parse(dimensions);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // 如果不是 JSON，返回空数组
  }
  return [];
};

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { value: timeLeft.days, label: "天" },
        { value: timeLeft.hours, label: "时" },
        { value: timeLeft.minutes, label: "分" },
        { value: timeLeft.seconds, label: "秒" },
      ].map((item, i) => (
        <div key={i}>
          <div className="text-2xl font-bold text-brand font-mono">
            {String(item.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] text-gray-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, currentUser } = useOutletContext<OutletContextType>();

  const hackathonId = id ? parseInt(id) : null;
  const tabParam = searchParams.get("tab");

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [myProject, setMyProject] = useState<Project | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState(tabParam || "overview");
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [galleryProjects, setGalleryProjects] = useState<Project[]>([]);

  // Filter states
  const [identityFilter, setIdentityFilter] = useState<
    "all" | "individual" | "team"
  >("all");
  const [locationSearch, setLocationSearch] = useState("");

  // Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isJudgingOpen, setIsJudgingOpen] = useState(false);
  const [isResultPublishOpen, setIsResultPublishOpen] = useState(false);
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false);
  const [isTeamMatchOpen, setIsTeamMatchOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isRecruitOpen, setIsRecruitOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 判断当前用户是否为活动发起者
  const isOrganizer = hackathon?.organizer_id === currentUser?.id;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hackathonId) {
      fetchHackathon();
      fetchTeams();
      fetchGallery();
      if (isLoggedIn) {
        fetchEnrollment();
      }
    }
  }, [hackathonId, isLoggedIn]);

  useEffect(() => {
    if (activeTab === "participants") {
      fetchTeams();
    } else if (activeTab === "myproject") {
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
    // 独立请求，避免一个失败导致另一个也无数据
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
        `/api/v1/projects?hackathon_id=${hackathonId}`,
      );
      setGalleryProjects(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEnrollment = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/v1/enrollments/my/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollment(res.data);

      // Fetch my team
      const teamRes = await axios.get(
        `/api/v1/teams/my?hackathon_id=${hackathonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMyTeam(teamRes.data);

      // Fetch my project
      const projRes = await axios.get(
        `/api/v1/projects/my?hackathon_id=${hackathonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMyProject(projRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  // 删除活动
  const handleDeleteHackathon = async () => {
    if (!hackathonId) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      await axios.delete(`/api/v1/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 删除成功后跳转到活动列表
      navigate("/events");
    } catch (e: any) {
      console.error("删除活动失败:", e);
      alert(e.response?.data?.detail || "删除活动失败，请重试");
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
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchTeams();
      fetchEnrollment();
    } catch (e: any) {
      alert(e.response?.data?.detail || "加入失败");
    }
  };

  // 创建个人项目（自动创建单人战队）
  const handleCreatePersonalTeam = async () => {
    try {
      const token = localStorage.getItem("token");
      // 1. 创建个人战队
      const teamRes = await axios.post(
        "/api/v1/teams",
        {
          hackathon_id: hackathonId,
          name: `${currentUser?.nickname || currentUser?.full_name || "我"}的个人项目`,
          description: "个人参赛项目",
          max_members: 1,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // 2. 自动创建项目
      await axios.post(
        "/api/v1/projects",
        {
          hackathon_id: hackathonId,
          team_id: teamRes.data.id,
          title: "未命名项目",
          description: "请完善项目描述",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      fetchTeams();
      fetchEnrollment();
      setIsSubmitOpen(true);
    } catch (e: any) {
      alert(e.response?.data?.detail || "创建失败");
    }
  };

  // 处理创建战队
  const handleCreateTeam = async (teamData: {
    name: string;
    description: string;
    max_members: number;
  }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/v1/teams",
        {
          hackathon_id: hackathonId,
          ...teamData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchTeams();
      fetchEnrollment();
      setIsCreateTeamOpen(false);
    } catch (e: any) {
      alert(e.response?.data?.detail || "创建战队失败");
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      draft: "草稿",
      registration: "报名中",
      ongoing: "进行中",
      judging: "评审中",
      completed: "已结束",
    };
    return map[status] || status;
  };

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

  return (
    <div className="min-h-screen bg-black" ref={containerRef}>
      {/* Hero Banner - Full bleed at top */}
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
          {/* Breadcrumb - 优化返回导航 */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium tracking-wide flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded-md"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回首页
            </Button>
            <span className="text-gray-600">/</span>
            <Button
              variant="ghost"
              onClick={() => navigate("/events")}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium tracking-wide flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded-md"
            >
              探索网络
            </Button>
            <span className="text-gray-600">/</span>
            <span className="text-[#FBBF24] text-sm font-bold tracking-wide px-2 py-1 bg-[#FBBF24]/5 rounded-md">
              {hackathon.title}
            </span>
          </div>

          {/* Tags - 活动分类标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {hackathon.theme_tags?.split(",").map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 text-[11px] border border-[#FBBF24]/40 text-[#FBBF24] bg-[#FBBF24]/5 rounded-[16px]"
              >
                #{tag.trim()}
              </span>
            ))}
            {hackathon.professionalism_tags?.split(",").map((tag, i) => (
              <span
                key={`p-${i}`}
                className="px-3 py-1 text-[11px] border border-[#333] text-gray-300 rounded-[16px]"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            {hackathon.title}
          </h1>
          {hackathon.subtitle && (
            <p className="text-lg text-gray-300 font-light mb-4">
              {hackathon.subtitle}
            </p>
          )}

          {/* Info Bar */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
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
                {hackathon.format === "online"
                  ? "线上"
                  : hackathon.location || "线下"}
              </span>
            </div>
            {/* 增强的活动状态徽标 */}
            <div
              className={`px-4 py-1.5 text-[12px] font-medium flex items-center gap-2 rounded-[16px] ${
                hackathon.status === "registration"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                  : hackathon.status === "ongoing"
                    ? "bg-sky-500/20 border border-sky-500/40 text-sky-400"
                    : hackathon.status === "judging"
                      ? "bg-violet-500/20 border border-violet-500/40 text-violet-400"
                      : hackathon.status === "completed"
                        ? "bg-gray-500/20 border border-gray-500/40 text-gray-400"
                        : "bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  hackathon.status === "registration"
                    ? "bg-emerald-400"
                    : hackathon.status === "ongoing"
                      ? "bg-sky-400"
                      : hackathon.status === "judging"
                        ? "bg-violet-400"
                        : hackathon.status === "completed"
                          ? "bg-gray-400"
                          : "bg-brand"
                }`}
              />
              {getStatusText(hackathon.status)}
            </div>
          </div>

          {/* Action Buttons - 头栏操作按钮 */}
          <div className="flex items-center gap-3 mt-6">
            {/* 参赛者视角提示 */}
            {isLoggedIn && !isOrganizer && (
              <div className="flex-1 p-3 bg-brand/10 border border-brand/20 rounded-[16px] flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-brand flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-brand/80">
                  <p className="font-medium mb-0.5">参赛者视角</p>
                  <p className="text-brand/60 text-xs">
                    您正在浏览他人创建的活动，仅可查看公开信息和参与竞赛。
                  </p>
                </div>
              </div>
            )}

            {/* 编辑活动 - 仅发起者可见 */}
            {isOrganizer && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/create?edit=${hackathon.id}`)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-[16px] hover:border-white hover:text-white transition-colors text-[13px]"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  编辑活动
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 rounded-[16px] hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-colors text-[13px]"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  删除活动
                </Button>
              </>
            )}

            {/* 核心功能按钮 - 登录用户可见 */}
            {isLoggedIn && !isOrganizer && (
              <>
                <Button
                  onClick={() => setActiveTab("myproject")}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FBBF24] text-black font-medium rounded-[16px] hover:bg-white transition-colors text-[13px]"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  开始项目
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsTeamMatchOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-[#FBBF24]/50 text-[#FBBF24] rounded-[16px] hover:bg-[#FBBF24]/10 transition-colors text-[13px]"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  智能组队
                </Button>
              </>
            )}

            {/* 未登录提示 */}
            {!isLoggedIn && (
              <Button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-6 py-2 bg-[#FBBF24] text-black font-medium rounded-md hover:bg-white transition-colors text-[13px]"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                登录参与
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - 左三右一布局 */}
      <div className="max-w-7xl mx-auto w-full px-8 py-8">
        <div className="flex gap-8">
          {/* 左侧主内容区 75% */}
          <div className="flex-1 min-w-0" style={{ flexBasis: "75%" }}>
            {/* Navigation Tabs - 1px底线指示器 */}
            <div className="border-b border-[#222222] mb-8">
              <div className="flex items-center">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-transparent p-0 h-auto">
                    {[
                      { id: "overview", label: "活动详情" },
                      {
                        id: "myproject",
                        label: isOrganizer ? "作品管理" : "我的作品",
                      },
                      {
                        id: "participants",
                        label: isOrganizer ? "参赛管理" : "参赛人员",
                      },
                      { id: "results", label: "评审结果" },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="px-6 py-4 text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors duration-200 ease-in-out relative rounded-none bg-transparent text-gray-500 data-[state=active]:text-white"
                      >
                        {tab.label}
                        <span className="pointer-events-none absolute bottom-0 left-0 right-0 h-[1px] bg-[#FBBF24] opacity-0 data-[state=active]:opacity-100" />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {isOrganizer && (
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsJudgingOpen(true)}
                      className="px-4 py-4 text-[12px] text-gray-500 hover:text-white transition-colors duration-200 ease-in-out"
                    >
                      评审管理
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsResultPublishOpen(true)}
                      className="px-4 py-4 text-[12px] text-gray-500 hover:text-white transition-colors duration-200 ease-in-out"
                    >
                      发布结果
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* OVERVIEW TAB - 活动详情 */}
              {activeTab === "overview" && (
                <div className="space-y-12">
                  {/* 活动简介 */}
                  <section id="intro">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-6 h-[2px] bg-brand"></span>
                      活动简介
                    </h3>
                    <div className="prose prose-invert max-w-none text-gray-300 border-l border-white/[0.08] pl-6">
                      <ReactMarkdown>{hackathon.description}</ReactMarkdown>
                    </div>
                  </section>

                  {/* 日程安排 */}
                  <section id="schedule">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-6 h-[2px] bg-brand"></span>
                      活动日程
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors rounded-[16px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                          报名开始
                        </div>
                        <div className="text-brand font-mono text-sm">
                          {hackathon.registration_start_date
                            ? new Date(
                                hackathon.registration_start_date,
                              ).toLocaleDateString("zh-CN")
                            : "待定"}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors rounded-[16px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                          报名截止
                        </div>
                        <div className="text-gray-300 font-mono text-sm">
                          {hackathon.registration_end_date
                            ? new Date(
                                hackathon.registration_end_date,
                              ).toLocaleDateString("zh-CN")
                            : "待定"}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors rounded-[16px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                          提交截止
                        </div>
                        <div className="text-gray-300 font-mono text-sm">
                          {hackathon.submission_end_date
                            ? new Date(
                                hackathon.submission_end_date,
                              ).toLocaleDateString("zh-CN")
                            : "待定"}
                        </div>
                      </div>
                      <div className="border border-white/[0.08] p-4 hover:border-brand/30 transition-colors rounded-[16px]">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                          结果公布
                        </div>
                        <div className="text-gray-300 font-mono text-sm">
                          {hackathon.judging_end_date
                            ? new Date(
                                hackathon.judging_end_date,
                              ).toLocaleDateString("zh-CN")
                            : "待定"}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 参赛要求 */}
                  {hackathon.requirements && (
                    <section id="requirements">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-6 h-[2px] bg-brand"></span>
                        参赛要求
                      </h3>
                      <div className="prose prose-invert max-w-none text-gray-300 bg-white/[0.02] border border-white/[0.08] p-6 rounded-[16px]">
                        <ReactMarkdown>{hackathon.requirements}</ReactMarkdown>
                      </div>
                    </section>
                  )}

                  {/* 评审维度 */}
                  {hackathon.scoring_dimensions &&
                    parseScoringDimensions(hackathon.scoring_dimensions)
                      .length > 0 && (
                      <section id="scoring">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                          <span className="w-6 h-[2px] bg-brand"></span>
                          评审标准
                        </h3>
                        <div className="border-l border-white/[0.08] pl-6 space-y-4">
                          {parseScoringDimensions(
                            hackathon.scoring_dimensions,
                          ).map((dim, idx) => (
                            <div
                              key={idx}
                              className="bg-[#111111] border border-[#222222] rounded-[16px] p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">
                                  {dim.name}
                                </span>
                                <span className="text-[#FBBF24] font-bold">
                                  {dim.weight}%
                                </span>
                              </div>
                              {dim.description && (
                                <p className="text-gray-500 text-sm">
                                  {dim.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                  {/* 评审规则 */}
                  {hackathon.rules_detail && (
                    <section id="rules">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-6 h-[2px] bg-brand"></span>
                        评审规则
                      </h3>
                      <div className="prose prose-invert max-w-none text-gray-300 border-l border-white/[0.08] pl-6">
                        <ReactMarkdown>{hackathon.rules_detail}</ReactMarkdown>
                      </div>
                    </section>
                  )}

                  {/* 奖项设置 */}
                  {hackathon.awards_detail && (
                    <section id="awards">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-6 h-[2px] bg-brand"></span>
                        奖项设置
                      </h3>
                      <div className="border-l border-white/[0.08] pl-6 space-y-4">
                        {parseAwardsDetail(hackathon.awards_detail).map(
                          (award, idx) => (
                            <div
                              key={idx}
                              className="bg-[#111111] border border-[#222222] rounded-[16px] p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">
                                  {award.name}
                                </span>
                                <span className="text-gray-500 text-sm">
                                  名额: {award.count}
                                </span>
                              </div>
                              {award.prize && (
                                <div className="text-[#FBBF24] font-bold mt-2">
                                  {award.prize}
                                </div>
                              )}
                              {award.description && (
                                <div className="text-gray-400 text-sm mt-1">
                                  {award.description}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                        {parseAwardsDetail(hackathon.awards_detail).length ===
                          0 && (
                          <div className="prose prose-invert max-w-none text-gray-300">
                            <ReactMarkdown>
                              {hackathon.awards_detail}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* MY PROJECT TAB - 我的作品/作品展示 */}
              {activeTab === "myproject" && (
                <div className="space-y-8">
                  {/* 我的项目区域 - 仅登录用户可见 */}
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
                                选择适合您的方式参与
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <Button
                                onClick={handleCreatePersonalTeam}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand text-black text-sm font-medium hover:bg-white transition-colors rounded-[16px]"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                个人项目
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setIsCreateTeamOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.15] text-white text-sm hover:bg-white hover:text-black transition-colors rounded-[16px]"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                                创建战队
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setActiveTab("participants")}
                                className="flex items-center gap-2 px-5 py-2.5 border border-[#FBBF24]/30 text-[#FBBF24] text-sm hover:bg-[#FBBF24]/10 transition-colors rounded-[16px]"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                                加入战队
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* 项目卡片 */}
                          <div className="border border-white/[0.08] rounded-[16px]">
                            <div className="flex">
                              <div className="w-[3px] bg-brand" />
                              <div className="flex-1 p-6">
                                <div className="flex items-start gap-6">
                                  <div className="w-32 h-24 bg-white/[0.02] border border-white/[0.08] rounded-[16px] flex items-center justify-center flex-shrink-0">
                                    {myProject?.cover_image ? (
                                      <img
                                        src={myProject.cover_image}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-2xl font-bold text-white/20">
                                        {(myProject?.title || "未命名")[0]}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-white mb-2">
                                      {myProject?.title || "未命名项目"}
                                    </h4>
                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                      {myProject?.description || "暂无描述"}
                                    </p>
                                    <div className="flex items-center gap-4 text-[11px] text-gray-500">
                                      {myProject?.tech_stack && (
                                        <span>
                                          技术栈: {myProject.tech_stack}
                                        </span>
                                      )}
                                      {myProject?.total_score && (
                                        <span className="text-brand">
                                          得分:{" "}
                                          {myProject.total_score.toFixed(1)}
                                        </span>
                                      )}
                                      {myTeam && (
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
                                          {myTeam.name} (
                                          {myTeam.members?.length || 1}/
                                          {myTeam.max_members || "-"})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsSubmitOpen(true)}
                                    className="px-4 py-2 border border-white/[0.15] text-[12px] text-white hover:bg-white hover:text-black transition-colors rounded-[16px]"
                                  >
                                    编辑项目
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 快捷操作栏 */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setIsAIAssistantOpen(true)}
                              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 rounded-[16px] hover:border-brand/50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-brand"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span className="text-sm text-white">
                                AI 助手
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsTeamMatchOpen(true)}
                              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 rounded-[16px] hover:border-brand/50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-brand"
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
                              <span className="text-sm text-white">
                                智能组队
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsRecruitOpen(true)}
                              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 rounded-[16px] hover:border-brand/50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-brand"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                              </svg>
                              <span className="text-sm text-white">
                                发布招募
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => navigate("/community")}
                              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 rounded-[16px] hover:border-brand/50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-brand"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span className="text-sm text-white">
                                招募大厅
                              </span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 所有作品展示 - 对所有人可见 */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                      <span className="w-5 h-[2px] bg-brand"></span>
                      所有作品{" "}
                      <span className="text-[12px] text-gray-600 font-normal ml-2">
                        {galleryProjects.length} 个
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {galleryProjects.map((proj) => (
                        <div
                          key={proj.id}
                          className="group border border-white/[0.08] bg-black hover:border-brand/30 transition-all flex"
                        >
                          <div className="w-[3px] bg-gray-700 group-hover:bg-brand transition-colors" />
                          <div className="flex-1 p-4 flex gap-4">
                            <div className="w-20 h-16 bg-white/[0.02] flex-shrink-0">
                              {proj.cover_image ? (
                                <img
                                  src={proj.cover_image}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">
                                  {proj.title[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-white text-sm mb-1 truncate group-hover:text-brand transition-colors">
                                {proj.title}
                              </h5>
                              <p className="text-[12px] text-gray-500 line-clamp-1">
                                {proj.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                                <span>{proj.team?.name}</span>
                                {proj.total_score && (
                                  <span className="text-brand">
                                    {proj.total_score.toFixed(1)}分
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {galleryProjects.length === 0 && (
                        <div className="col-span-2 text-center py-16 border border-white/[0.05]">
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
                </div>
              )}

              {/* PARTICIPANTS TAB - 参赛人员与组队 (List Row 布局) */}
              {activeTab === "participants" && (
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
                      <div className="text-2xl font-bold text-white">
                        {teams.length}
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[#222222] rounded-xl p-5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                        招募中
                      </div>
                      <div className="text-2xl font-bold text-[#FBBF24]">
                        {
                          teams.filter(
                            (t) => t.recruitments && t.recruitments.length > 0,
                          ).length
                        }
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
                              idx !== teams.length - 1
                                ? "border-b border-[#222222]"
                                : ""
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
                                {team.recruitments &&
                                  team.recruitments.length > 0 && (
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
                                    handleJoinTeam(team.id);
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
                    // 从团队成员中提取所有已组队的 user_id
                    const teamMemberIds = new Set(
                      teams.flatMap(
                        (t) => t.members?.map((m: any) => m.user_id) || [],
                      ),
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
                            {individualParticipants.map(
                              (p: any, idx: number) => (
                                <div
                                  key={p.user_id}
                                  className={`flex items-center gap-4 px-6 py-4 hover:bg-[#111111] transition-colors duration-200 ease-in-out ${
                                    idx !== individualParticipants.length - 1
                                      ? "border-b border-[#222222]"
                                      : ""
                                  }`}
                                >
                                  {/* Avatar - 纯圆形 */}
                                  <div className="w-10 h-10 rounded-full bg-[#111111] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {p.avatar_url ? (
                                      <img
                                        src={p.avatar_url}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-500">
                                        {p.nickname?.[0] || "?"}
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
                              ),
                            )}
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
              )}

              {/* RESULTS TAB - 评审结果 */}
              {activeTab === "results" && (
                <div>
                  {hackathon.results_detail ? (
                    <div className="prose prose-invert max-w-none text-gray-300">
                      <ReactMarkdown>{hackathon.results_detail}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-20 border border-white/[0.05]">
                      <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase mb-4">
                        结果尚未公布
                      </div>
                      <p className="text-sm text-gray-500">
                        请等待评审结束后查看
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* 右侧边栏 25% */}
          <div
            className="hidden md:block w-72 flex-shrink-0"
            style={{ flexBasis: "25%" }}
          >
            <div className="sticky top-24 space-y-6">
              {/* 右侧边栏操作区 */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
                {!myTeam ? (
                  <>
                    <Button
                      onClick={() => setIsCreateTeamOpen(true)}
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
                        onClick={() => setActiveTab("participants")}
                        className="py-2 border border-white/10 text-[11px] text-white rounded-[16px] hover:bg-[#111111] transition-colors duration-200"
                      >
                        组队广场
                      </Button>
                      <Button
                        onClick={() => setIsSubmitOpen(true)}
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
                <CountdownTimer
                  targetDate={
                    hackathon.registration_end_date || hackathon.end_date
                  }
                />
              </div>

              {/* 时间轴 */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">
                  时间轴
                </div>
                <div className="space-y-4 relative pl-4 border-l border-[#222222]">
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-[#FBBF24] rounded-full"></div>
                    <div className="text-[10px] text-[#FBBF24] font-mono mb-1">
                      {hackathon.registration_start_date
                        ? new Date(
                            hackathon.registration_start_date,
                          ).toLocaleDateString("zh-CN")
                        : "待定"}
                    </div>
                    <div className="text-[12px] text-white">报名开启</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-gray-600 rounded-full"></div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">
                      {hackathon.registration_end_date
                        ? new Date(
                            hackathon.registration_end_date,
                          ).toLocaleDateString("zh-CN")
                        : "待定"}
                    </div>
                    <div className="text-[12px] text-gray-400">报名截止</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-gray-600 rounded-full"></div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">
                      {hackathon.submission_end_date
                        ? new Date(
                            hackathon.submission_end_date,
                          ).toLocaleDateString("zh-CN")
                        : "待定"}
                    </div>
                    <div className="text-[12px] text-gray-400">提交截止</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 bg-gray-600 rounded-full"></div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">
                      {hackathon.judging_end_date
                        ? new Date(
                            hackathon.judging_end_date,
                          ).toLocaleDateString("zh-CN")
                        : "待定"}
                    </div>
                    <div className="text-[12px] text-gray-400">结果公布</div>
                  </div>
                </div>
              </div>

              {/* 主办方信息 — shows all hosts from the backend */}
              <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-4">
                  主办方
                </div>
                <div className="space-y-3">
                  {(hackathon.hosts && hackathon.hosts.length > 0
                    ? hackathon.hosts
                    : [
                        {
                          id: 0,
                          name: hackathon.organizer_name || "Aura 平台",
                          display_order: 0,
                        },
                      ]
                  ).map((host) => (
                    <div
                      key={host.id || host.name}
                      className="flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-[#111111] border border-[#333] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {host.logo ? (
                          <img
                            src={host.logo}
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
                  {hackathon.contact_info && (
                    <div className="text-[11px] text-gray-500 mt-1 pt-2 border-t border-[#222222]">
                      {hackathon.contact_info}
                    </div>
                  )}
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
                    { id: "myproject", label: "我的作品" },
                    { id: "participants", label: "参赛人员" },
                    { id: "results", label: "评审结果" },
                  ].map((item) => (
                    <Button
                      variant="ghost"
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
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
        </div>
      </div>

      {/* Modals */}
      {hackathonId && (
        <>
          <SubmitProjectModal
            isOpen={isSubmitOpen}
            onClose={() => setIsSubmitOpen(false)}
            hackathonId={hackathonId}
            teamId={myTeam?.id}
          />
          <JudgingModal
            isOpen={isJudgingOpen}
            onClose={() => setIsJudgingOpen(false)}
            hackathonId={hackathonId}
            hackathonTitle={hackathon?.title || ""}
          />
          <ResultPublishModal
            isOpen={isResultPublishOpen}
            onClose={() => setIsResultPublishOpen(false)}
            hackathonId={hackathonId}
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
