import { useState, useEffect, useRef } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Sparkles,
  Plus,
  X,
  Globe,
  MapPin,
  Save,
  Rocket,
  Calendar,
  Target,
  Trophy,
  Wand2,
  Loader2,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Pencil,
  ChevronRight,
  ChevronLeft,
  FileText,
  Users,
  Eye,
  EyeOff,
  Trash2,
  Link,
} from "lucide-react";
import AIGenerateImageButton from "../components/AIGenerateImageButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { HackathonDetail, SectionType } from "@/types/hackathon";

// ============================================================================
// OUTLET CONTEXT TYPE
// Describes the shape of data passed down from the root layout component
// via React Router's <Outlet context={...} />.
// ============================================================================
interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
  fetchCurrentUser: () => void;
  lang: "zh" | "en";
}

// ============================================================================
// LOCAL FORM TYPES
// These are lightweight versions of the backend response types, stripped of
// auto-generated fields (id, timestamps, audit columns) so they're easy to
// construct in the form. They get sent to the backend as POST payloads.
// ============================================================================

/**
 * A single schedule event row within a "schedules" section.
 * The user enters event_name, start_time, and end_time.
 */
interface LocalScheduleItem {
  event_name: string;
  start_time: string;
  end_time: string;
}

/**
 * A single prize row within a "prizes" section.
 * quantity = how many winners, total_cash_amount = total cash for this tier.
 */
interface LocalPrizeItem {
  name: string;
  winning_standards: string;
  quantity: number;
  total_cash_amount: number;
  awards_sublist: string;
}

/**
 * A single scoring dimension within a "judging_criteria" section.
 * weight_percentage is a whole number (e.g. 30 means 30%).
 */
interface LocalJudgingCriterion {
  name: string;
  weight_percentage: number;
  description: string;
}

/**
 * A content section as represented in the form editor.
 * section_type determines which child array is populated:
 *   "markdown"         → content holds the rich text
 *   "schedules"        → schedules[] holds timeline items
 *   "prizes"           → prizes[] holds prize tiers
 *   "judging_criteria" → judging_criteria[] holds scoring dimensions
 * Unused child arrays remain empty.
 */
interface LocalSection {
  section_type: SectionType;
  title: string;
  content: string;
  schedules: LocalScheduleItem[];
  prizes: LocalPrizeItem[];
  judging_criteria: LocalJudgingCriterion[];
}

/**
 * Host entry for the form. Uses logo_url (NOT logo) to match the
 * backend HackathonHost schema exactly.
 */
interface LocalHost {
  name: string;
  logo_url: string;
}

/**
 * Partner / sponsor entry for the form. Partners have a category
 * (e.g. "赞助商", "技术合作") and optional website URL.
 */
interface LocalPartner {
  name: string;
  logo_url: string;
  category: string;
  website_url: string;
}

/**
 * Step 1 form data – the hackathon's core / top-level fields.
 * These map directly to POST /api/v1/hackathons body parameters.
 */
interface CoreFormData {
  title: string;
  description: string;
  tags: string[];
  cover_image: string;
  format: "online" | "offline";
  registration_type: "individual" | "team";
  start_date: string;
  end_date: string;
  province: string;
  city: string;
  district: string;
  address: string;
  is_address_hidden: boolean;
  status: "draft" | "published";
}

/** Controls the AI command bar at the top of the page */
interface AICommandState {
  isGenerating: boolean;
  query: string;
  isVisible: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Human-readable labels for each section type (Chinese / English) */
const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  markdown: "富文本 / Markdown",
  schedules: "日程安排 / Schedules",
  prizes: "奖项设置 / Prizes",
  judging_criteria: "评审标准 / Judging Criteria",
};

/**
 * Maps section types to lucide-react icon components so each section
 * card shows an appropriate icon in its header.
 */
const SECTION_TYPE_ICONS: Record<SectionType, React.ElementType> = {
  markdown: FileText,
  schedules: Calendar,
  prizes: Trophy,
  judging_criteria: Target,
};

/** The wizard has 3 steps; these labels appear in the step indicator */
const STEP_LABELS = ["基本信息", "内容板块", "主办与合作"];

// ============================================================================
// SHARED TAILWIND CLASS STRINGS
// Used across multiple input elements to keep styling consistent.
// ============================================================================
const INPUT_CLASS =
  "w-full bg-zinc-900/50 border border-zinc-800 rounded-[12px] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition-colors";
const INPUT_SM_CLASS =
  "bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function CreateHackathonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // If ?edit=<id> is in the URL we enter edit mode for that hackathon
  const editId = searchParams.get("edit");
  const { isLoggedIn, currentUser } = useOutletContext<OutletContextType>();

  // --------------------------------------------------------------------------
  // WIZARD STEP STATE
  // Step 1 = Core Info, Step 2 = Section Editor, Step 3 = Hosts & Partners
  // --------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);

  // --------------------------------------------------------------------------
  // STEP 1: CORE FORM FIELDS
  // --------------------------------------------------------------------------
  const [coreForm, setCoreForm] = useState<CoreFormData>({
    title: "",
    description: "",
    tags: [],
    cover_image: "",
    format: "online",
    registration_type: "individual",
    start_date: "",
    end_date: "",
    province: "",
    city: "",
    district: "",
    address: "",
    is_address_hidden: false,
    status: "draft",
  });

  // --------------------------------------------------------------------------
  // STEP 2: SECTIONS WITH CHILD ITEMS
  // --------------------------------------------------------------------------
  const [sections, setSections] = useState<LocalSection[]>([]);

  // --------------------------------------------------------------------------
  // STEP 3: HOSTS & PARTNERS
  // --------------------------------------------------------------------------
  const [hosts, setHosts] = useState<LocalHost[]>([]);
  const [partners, setPartners] = useState<LocalPartner[]>([]);

  // --------------------------------------------------------------------------
  // UI STATE
  // --------------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI command bar state
  const [aiCommand, setAiCommand] = useState<AICommandState>({
    isGenerating: false,
    query: "",
    isVisible: true,
  });
  const cmdInputRef = useRef<HTMLInputElement>(null);

  // ---- Host dialog state ----
  // hostDialogOpen controls the modal; editingHostIndex is null for "add new"
  // mode and a numeric index when editing an existing host.
  const [hostDialogOpen, setHostDialogOpen] = useState(false);
  const [newHostName, setNewHostName] = useState("");
  const [newHostLogo, setNewHostLogo] = useState("");
  const [hostLogoUploading, setHostLogoUploading] = useState(false);
  const hostLogoInputRef = useRef<HTMLInputElement>(null);
  const [editingHostIndex, setEditingHostIndex] = useState<number | null>(null);
  // Drag-reorder ref for hosts (stores the index being dragged)
  const dragIndexRef = useRef<number | null>(null);

  // ---- Partner dialog state ----
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerLogo, setNewPartnerLogo] = useState("");
  const [newPartnerCategory, setNewPartnerCategory] = useState("");
  const [newPartnerWebsite, setNewPartnerWebsite] = useState("");
  const [partnerLogoUploading, setPartnerLogoUploading] = useState(false);
  const partnerLogoInputRef = useRef<HTMLInputElement>(null);
  const [editingPartnerIndex, setEditingPartnerIndex] = useState<number | null>(
    null,
  );
  const partnerDragRef = useRef<number | null>(null);

  // ---- Edit mode: remember existing entity IDs so we can delete-then-recreate ----
  const existingIdsRef = useRef<{
    sectionIds: number[];
    hostIds: number[];
    partnerIds: number[];
  }>({ sectionIds: [], hostIds: [], partnerIds: [] });

  // ==========================================================================
  // AUTH / PERMISSION CHECK + LOAD EDIT DATA
  // Runs once on mount (and when dependencies change). Redirects if the user
  // isn't logged in or lacks the can_create_hackathon permission.
  // ==========================================================================
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }

    // Permission gate: only users with the organizer invite code can create
    if (currentUser && !currentUser.can_create_hackathon) {
      setTimeout(() => {
        alert(
          "您没有权限创建活动，需要超级管理员分配的邀请码才能发布活动。\n\n请在个人中心使用邀请码激活组织者权限。",
        );
        navigate("/profile");
      }, 100);
      return;
    }

    setLoading(false);

    // In edit mode, fetch and populate the hackathon's existing data
    if (editId) {
      loadHackathonData(editId);
    }
  }, [isLoggedIn, currentUser, editId, navigate]);

  // ==========================================================================
  // LOAD EXISTING HACKATHON DATA (EDIT MODE)
  // Fetches the full hackathon detail from GET /api/v1/hackathons/{id} and
  // maps the response into local form state for all three wizard steps.
  // ==========================================================================
  const loadHackathonData = async (id: string) => {
    try {
      const res = await axios.get(`/api/v1/hackathons/${id}`);
      const data: HackathonDetail = res.data;

      // ---- Populate Step 1: core fields ----
      setCoreForm({
        title: data.title || "",
        description: data.description || "",
        tags: data.tags || [],
        cover_image: data.cover_image || "",
        format: data.format || "online",
        registration_type: data.registration_type || "individual",
        // Slice to YYYY-MM-DD for <input type="date">
        start_date: data.start_date ? data.start_date.slice(0, 10) : "",
        end_date: data.end_date ? data.end_date.slice(0, 10) : "",
        province: data.province || "",
        city: data.city || "",
        district: data.district || "",
        address: data.address || "",
        is_address_hidden: data.is_address_hidden ?? false,
        status: data.status === "draft" ? "draft" : "published",
      });

      // ---- Populate Step 2: sections and their child items ----
      if (data.sections?.length) {
        setSections(
          data.sections.map((s) => ({
            section_type: s.section_type,
            title: s.title || "",
            content: s.content || "",
            schedules: (s.schedules || []).map((sc) => ({
              event_name: sc.event_name,
              // Slice to YYYY-MM-DDTHH:MM for <input type="datetime-local">
              start_time: sc.start_time ? sc.start_time.slice(0, 16) : "",
              end_time: sc.end_time ? sc.end_time.slice(0, 16) : "",
            })),
            prizes: (s.prizes || []).map((p) => ({
              name: p.name,
              winning_standards: p.winning_standards || "",
              quantity: p.quantity,
              total_cash_amount: p.total_cash_amount,
              awards_sublist: p.awards_sublist || "[]",
            })),
            judging_criteria: (s.judging_criteria || []).map((jc) => ({
              name: jc.name,
              weight_percentage: jc.weight_percentage,
              description: jc.description || "",
            })),
          })),
        );
        existingIdsRef.current.sectionIds = data.sections.map((s) => s.id);
      }

      // ---- Populate Step 3: hosts (note: field is logo_url, NOT logo) ----
      if (data.hosts?.length) {
        setHosts(
          data.hosts.map((h) => ({
            name: h.name,
            logo_url: h.logo_url || "",
          })),
        );
        existingIdsRef.current.hostIds = data.hosts.map((h) => h.id);
      }

      // ---- Populate Step 3: partners ----
      if (data.partners?.length) {
        setPartners(
          data.partners.map((p) => ({
            name: p.name,
            logo_url: p.logo_url || "",
            category: p.category || "",
            website_url: p.website_url || "",
          })),
        );
        existingIdsRef.current.partnerIds = data.partners.map((p) => p.id);
      }
    } catch (e) {
      console.error("Failed to load hackathon:", e);
      setError("加载活动数据失败");
    }
  };

  // ==========================================================================
  // AI GENERATION HANDLER
  // Simulates an AI API call that auto-fills form fields with sensible
  // defaults based on the user's query. In production, replace the mock
  // delay with a real AI endpoint call.
  // ==========================================================================
  const handleAIGenerate = async () => {
    if (!aiCommand.query.trim()) return;

    setAiCommand((prev) => ({ ...prev, isGenerating: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const topic = aiCommand.query;

      // Fill Step 1 core fields
      setCoreForm((prev) => ({
        ...prev,
        title: `${topic} - 黑客松`,
        format: "online",
        registration_type: "team",
      }));

      // Generate section-compatible data for Step 2
      setSections([
        {
          section_type: "markdown",
          title: "活动介绍",
          content: `# 关于${topic}\n\n本次黑客松聚焦于${topic}领域的创新应用...\n\n## 参赛要求\n- 3-5 人组队\n- 提交完整代码和演示视频\n\n## 技术支持\n提供云计算资源和技术导师指导`,
          schedules: [],
          prizes: [],
          judging_criteria: [],
        },
        {
          section_type: "schedules",
          title: "日程安排",
          content: "",
          schedules: [
            { event_name: "报名启动", start_time: "", end_time: "" },
            { event_name: "黑客松开始", start_time: "", end_time: "" },
            { event_name: "作品提交截止", start_time: "", end_time: "" },
            { event_name: "评审阶段", start_time: "", end_time: "" },
            { event_name: "颁奖典礼", start_time: "", end_time: "" },
          ],
          prizes: [],
          judging_criteria: [],
        },
        {
          section_type: "prizes",
          title: "奖项设置",
          content: "",
          schedules: [],
          prizes: [
            {
              name: "冠军",
              winning_standards: "综合评分最高",
              quantity: 1,
              total_cash_amount: 100000,
              awards_sublist: "[]",
            },
            {
              name: "亚军",
              winning_standards: "综合评分第二",
              quantity: 2,
              total_cash_amount: 50000,
              awards_sublist: "[]",
            },
            {
              name: "季军",
              winning_standards: "综合评分第三",
              quantity: 3,
              total_cash_amount: 20000,
              awards_sublist: "[]",
            },
            {
              name: "最佳创意奖",
              winning_standards: "创意突出",
              quantity: 1,
              total_cash_amount: 10000,
              awards_sublist: "[]",
            },
          ],
          judging_criteria: [],
        },
        {
          section_type: "judging_criteria",
          title: "评审标准",
          content: "",
          schedules: [],
          prizes: [],
          judging_criteria: [
            {
              name: "技术创新性",
              weight_percentage: 35,
              description: "技术方案的创新程度和技术难度",
            },
            {
              name: "商业价值",
              weight_percentage: 25,
              description: "商业化潜力和市场前景",
            },
            {
              name: "用户体验",
              weight_percentage: 20,
              description: "产品易用性和交互设计",
            },
            {
              name: "完成度",
              weight_percentage: 20,
              description: "原型或成品的完整程度",
            },
          ],
        },
      ]);
    } catch (e) {
      console.error("AI generation failed:", e);
    } finally {
      setAiCommand((prev) => ({ ...prev, isGenerating: false, query: "" }));
    }
  };

  // ==========================================================================
  // SECTION MANAGEMENT HELPERS (STEP 2)
  // These functions add, remove, and update sections and their child items
  // in an immutable fashion (returning new arrays via map/filter).
  // ==========================================================================

  /** Appends a new empty section of the given type to the sections list */
  const addSection = (type: SectionType) => {
    setSections((prev) => [
      ...prev,
      {
        section_type: type,
        title: "",
        content: "",
        schedules: [],
        prizes: [],
        judging_criteria: [],
      },
    ]);
  };

  /** Removes the section at the given index */
  const removeSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  /** Updates the title of the section at the given index */
  const updateSectionTitle = (idx: number, title: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, title } : s)),
    );
  };

  /** Updates the markdown content of a "markdown" section */
  const updateSectionContent = (idx: number, content: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, content } : s)),
    );
  };

  // ---- Schedule item helpers ----

  /** Adds an empty schedule event to the section at sectionIdx */
  const addScheduleItem = (sectionIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              schedules: [
                ...s.schedules,
                { event_name: "", start_time: "", end_time: "" },
              ],
            }
          : s,
      ),
    );
  };

  /** Updates one field of a schedule item within a section */
  const updateScheduleItem = (
    sectionIdx: number,
    itemIdx: number,
    field: keyof LocalScheduleItem,
    value: string,
  ) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIdx) return s;
        const updated = [...s.schedules];
        updated[itemIdx] = { ...updated[itemIdx], [field]: value };
        return { ...s, schedules: updated };
      }),
    );
  };

  /** Removes a schedule item from a section */
  const removeScheduleItem = (sectionIdx: number, itemIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIdx) return s;
        return {
          ...s,
          schedules: s.schedules.filter((_, j) => j !== itemIdx),
        };
      }),
    );
  };

  // ---- Prize item helpers ----

  /** Adds an empty prize row to the section at sectionIdx */
  const addPrizeItem = (sectionIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              prizes: [
                ...s.prizes,
                {
                  name: "",
                  winning_standards: "",
                  quantity: 1,
                  total_cash_amount: 0,
                  awards_sublist: "[]",
                },
              ],
            }
          : s,
      ),
    );
  };

  /** Updates one field of a prize item within a section */
  const updatePrizeItem = (
    sectionIdx: number,
    itemIdx: number,
    field: keyof LocalPrizeItem,
    value: string | number,
  ) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIdx) return s;
        const updated = [...s.prizes];
        updated[itemIdx] = { ...updated[itemIdx], [field]: value };
        return { ...s, prizes: updated };
      }),
    );
  };

  /** Removes a prize item from a section */
  const removePrizeItem = (sectionIdx: number, itemIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIdx) return s;
        return { ...s, prizes: s.prizes.filter((_, j) => j !== itemIdx) };
      }),
    );
  };

  // ---- Judging criteria item helpers ----

  /** Adds an empty judging criterion to the section at sectionIdx */
  const addCriterionItem = (sectionIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              judging_criteria: [
                ...s.judging_criteria,
                { name: "", weight_percentage: 0, description: "" },
              ],
            }
          : s,
      ),
    );
  };

  /** Updates one field of a judging criterion item */
  const updateCriterionItem = (
    sectionIdx: number,
    itemIdx: number,
    field: keyof LocalJudgingCriterion,
    value: string | number,
  ) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIdx) return s;
        const updated = [...s.judging_criteria];
        updated[itemIdx] = { ...updated[itemIdx], [field]: value };
        return { ...s, judging_criteria: updated };
      }),
    );
  };

  /** Removes a judging criterion from a section */
  const removeCriterionItem = (sectionIdx: number, itemIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIdx) return s;
        return {
          ...s,
          judging_criteria: s.judging_criteria.filter((_, j) => j !== itemIdx),
        };
      }),
    );
  };

  // ==========================================================================
  // HOST MANAGEMENT HELPERS (STEP 3)
  // Preserved from the original code, updated to use logo_url field name.
  // ==========================================================================

  /** Uploads a host logo image file to the server and stores the returned URL */
  const handleHostLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }
    if (file.size > 500 * 1024) {
      setError("主办方 Logo 大小不能超过 500 KB");
      return;
    }
    setHostLogoUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post("/api/v1/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewHostLogo(res.data.url);
    } catch {
      setError("Logo 上传失败");
    } finally {
      setHostLogoUploading(false);
    }
  };

  /** Opens the host dialog pre-populated with an existing host's data */
  const openEditHostDialog = (idx: number) => {
    const host = hosts[idx];
    setEditingHostIndex(idx);
    setNewHostName(host.name);
    setNewHostLogo(host.logo_url || "");
    setHostDialogOpen(true);
  };

  /**
   * Confirms adding a new host or saving edits to an existing one.
   * Checks editingHostIndex to decide which mode we're in.
   */
  const confirmAddHost = () => {
    if (!newHostName.trim()) return;

    if (editingHostIndex !== null) {
      // Editing an existing host – update in place
      setHosts((prev) =>
        prev.map((h, i) =>
          i === editingHostIndex
            ? { name: newHostName.trim(), logo_url: newHostLogo || "" }
            : h,
        ),
      );
    } else {
      // Adding a new host to the end of the list
      setHosts((prev) => [
        ...prev,
        { name: newHostName.trim(), logo_url: newHostLogo || "" },
      ]);
    }

    // Reset dialog state
    setNewHostName("");
    setNewHostLogo("");
    setEditingHostIndex(null);
    setHostDialogOpen(false);
  };

  /** Removes a host at the given index */
  const removeHost = (idx: number) => {
    setHosts((prev) => prev.filter((_, i) => i !== idx));
  };

  // HTML5 drag-and-drop reorder handlers for hosts
  const handleHostDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };

  const handleHostDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === idx) return;
    setHosts((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(dragIndexRef.current!, 1);
      updated.splice(idx, 0, removed);
      dragIndexRef.current = idx;
      return updated;
    });
  };

  const handleHostDragEnd = () => {
    dragIndexRef.current = null;
  };

  // ==========================================================================
  // PARTNER MANAGEMENT HELPERS (STEP 3)
  // Similar pattern to hosts, with additional category and website_url fields.
  // ==========================================================================

  /** Uploads a partner logo image file */
  const handlePartnerLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }
    if (file.size > 500 * 1024) {
      setError("合作方 Logo 大小不能超过 500 KB");
      return;
    }
    setPartnerLogoUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post("/api/v1/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewPartnerLogo(res.data.url);
    } catch {
      setError("Logo 上传失败");
    } finally {
      setPartnerLogoUploading(false);
    }
  };

  /** Opens the partner dialog pre-populated for editing */
  const openEditPartnerDialog = (idx: number) => {
    const p = partners[idx];
    setEditingPartnerIndex(idx);
    setNewPartnerName(p.name);
    setNewPartnerLogo(p.logo_url || "");
    setNewPartnerCategory(p.category || "");
    setNewPartnerWebsite(p.website_url || "");
    setPartnerDialogOpen(true);
  };

  /** Confirms adding or editing a partner */
  const confirmAddPartner = () => {
    if (!newPartnerName.trim()) return;

    const entry: LocalPartner = {
      name: newPartnerName.trim(),
      logo_url: newPartnerLogo || "",
      category: newPartnerCategory.trim(),
      website_url: newPartnerWebsite.trim(),
    };

    if (editingPartnerIndex !== null) {
      setPartners((prev) =>
        prev.map((p, i) => (i === editingPartnerIndex ? entry : p)),
      );
    } else {
      setPartners((prev) => [...prev, entry]);
    }

    setNewPartnerName("");
    setNewPartnerLogo("");
    setNewPartnerCategory("");
    setNewPartnerWebsite("");
    setEditingPartnerIndex(null);
    setPartnerDialogOpen(false);
  };

  /** Removes a partner at the given index */
  const removePartner = (idx: number) => {
    setPartners((prev) => prev.filter((_, i) => i !== idx));
  };

  // Drag-reorder handlers for partners (same pattern as hosts)
  const handlePartnerDragStart = (idx: number) => {
    partnerDragRef.current = idx;
  };

  const handlePartnerDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (partnerDragRef.current === null || partnerDragRef.current === idx)
      return;
    setPartners((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(partnerDragRef.current!, 1);
      updated.splice(idx, 0, removed);
      partnerDragRef.current = idx;
      return updated;
    });
  };

  const handlePartnerDragEnd = () => {
    partnerDragRef.current = null;
  };

  // ==========================================================================
  // IMAGE UPLOAD HANDLER (cover image)
  // Shows a local preview immediately for responsiveness, then uploads the
  // file to the server and replaces the preview with the server URL.
  // ==========================================================================
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过 5MB");
      return;
    }

    setUploading(true);
    setError("");

    // Show local blob preview immediately so the user sees feedback
    const localUrl = URL.createObjectURL(file);
    setCoreForm((prev) => ({ ...prev, cover_image: localUrl }));

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post("/api/v1/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Replace local preview with the permanent server URL
      setCoreForm((prev) => ({ ...prev, cover_image: res.data.url }));
    } catch {
      setError("图片上传失败，将使用本地预览");
    } finally {
      setUploading(false);
    }
  };

  /** Handles files dropped onto the cover image area */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  /** Prevents the browser's default drag-over behavior (needed for drop) */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // ==========================================================================
  // SUBMIT HANDLER
  // Multi-step submission that mirrors the backend's section-based API:
  //   1. POST/PATCH the hackathon core record
  //   2. POST each section, then POST child items for that section
  //   3. POST each host and partner
  // In edit mode, existing sections/hosts/partners are deleted first, then
  // recreated with the current form data (delete + recreate strategy).
  // ==========================================================================
  const handleSubmit = async () => {
    // ---- Basic validation ----
    if (!coreForm.title.trim()) {
      setError("请填写活动名称");
      setCurrentStep(1);
      return;
    }
    if (hosts.length === 0) {
      setError("请至少添加一个主办方");
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      let hackathonId: number;

      // Build the core payload (same fields for create and update)
      const corePayload = {
        title: coreForm.title,
        description: coreForm.description || null,
        tags: coreForm.tags.length > 0 ? coreForm.tags : null,
        cover_image: coreForm.cover_image || null,
        format: coreForm.format,
        registration_type: coreForm.registration_type,
        start_date: coreForm.start_date
          ? `${coreForm.start_date}T00:00:00`
          : null,
        end_date: coreForm.end_date ? `${coreForm.end_date}T23:59:59` : null,
        province: coreForm.province || null,
        city: coreForm.city || null,
        district: coreForm.district || null,
        address: coreForm.address || null,
        is_address_hidden: coreForm.is_address_hidden,
        status: coreForm.status,
      };

      const authHeaders = { Authorization: `Bearer ${token}` };

      // ==================================================================
      // STEP 1: CREATE OR UPDATE THE HACKATHON CORE
      // ==================================================================
      if (editId) {
        // PATCH existing hackathon
        await axios.patch(`/api/v1/hackathons/${editId}`, corePayload, {
          headers: authHeaders,
        });
        hackathonId = parseInt(editId);

        // Delete all existing sections (cascade deletes their children)
        for (const sid of existingIdsRef.current.sectionIds) {
          try {
            await axios.delete(
              `/api/v1/hackathons/${hackathonId}/sections/${sid}`,
              { headers: authHeaders },
            );
          } catch {
            /* ignore deletion errors – section may already be gone */
          }
        }

        // Delete all existing hosts
        for (const hid of existingIdsRef.current.hostIds) {
          try {
            await axios.delete(
              `/api/v1/hackathons/${hackathonId}/hosts/${hid}`,
              { headers: authHeaders },
            );
          } catch {
            /* ignore */
          }
        }

        // Delete all existing partners
        for (const pid of existingIdsRef.current.partnerIds) {
          try {
            await axios.delete(
              `/api/v1/hackathons/${hackathonId}/partners/${pid}`,
              { headers: authHeaders },
            );
          } catch {
            /* ignore */
          }
        }
      } else {
        // POST new hackathon
        const res = await axios.post("/api/v1/hackathons", corePayload, {
          headers: authHeaders,
        });
        hackathonId = res.data.id;
      }

      // ==================================================================
      // STEP 2: CREATE SECTIONS WITH THEIR CHILD ITEMS
      // Each section is created first, then its children are posted using
      // the section's returned ID.
      // ==================================================================
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        // Create the section itself
        const sectionRes = await axios.post(
          `/api/v1/hackathons/${hackathonId}/sections`,
          {
            section_type: section.section_type,
            title: section.title || null,
            display_order: i,
            content:
              section.section_type === "markdown" ? section.content : null,
          },
          { headers: authHeaders },
        );

        const sectionId = sectionRes.data.id;

        // Create child items for the section based on its type
        if (section.section_type === "schedules") {
          for (let j = 0; j < section.schedules.length; j++) {
            const item = section.schedules[j];
            await axios.post(
              `/api/v1/hackathons/${hackathonId}/sections/${sectionId}/schedules`,
              {
                event_name: item.event_name,
                start_time: item.start_time || null,
                end_time: item.end_time || null,
                display_order: j,
              },
              { headers: authHeaders },
            );
          }
        } else if (section.section_type === "prizes") {
          for (let j = 0; j < section.prizes.length; j++) {
            const item = section.prizes[j];
            await axios.post(
              `/api/v1/hackathons/${hackathonId}/sections/${sectionId}/prizes`,
              {
                name: item.name,
                winning_standards: item.winning_standards || null,
                quantity: item.quantity,
                total_cash_amount: item.total_cash_amount,
                awards_sublist: item.awards_sublist || "[]",
                display_order: j,
              },
              { headers: authHeaders },
            );
          }
        } else if (section.section_type === "judging_criteria") {
          for (let j = 0; j < section.judging_criteria.length; j++) {
            const item = section.judging_criteria[j];
            await axios.post(
              `/api/v1/hackathons/${hackathonId}/sections/${sectionId}/judging-criteria`,
              {
                name: item.name,
                weight_percentage: item.weight_percentage,
                description: item.description || null,
                display_order: j,
              },
              { headers: authHeaders },
            );
          }
        }
      }

      // ==================================================================
      // STEP 3: CREATE HOSTS (logo_url field, NOT logo)
      // ==================================================================
      for (const h of hosts) {
        await axios.post(
          `/api/v1/hackathons/${hackathonId}/hosts`,
          { name: h.name, logo_url: h.logo_url || null },
          { headers: authHeaders },
        );
      }

      // ==================================================================
      // STEP 3: CREATE PARTNERS
      // ==================================================================
      for (const p of partners) {
        await axios.post(
          `/api/v1/hackathons/${hackathonId}/partners`,
          {
            name: p.name,
            logo_url: p.logo_url || null,
            category: p.category || null,
            website_url: p.website_url || null,
          },
          { headers: authHeaders },
        );
      }

      // Success – navigate to the events listing page
      navigate("/events");
    } catch (e: any) {
      console.error("Submit error:", e);
      console.error("Error response:", e.response?.data);
      const errorDetail = e.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        setError(
          errorDetail
            .map((err: any) => `${err.loc?.join(".")}: ${err.msg}`)
            .join("\n"),
        );
      } else {
        setError(errorDetail || e.message || "提交失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================================
  // RENDER GUARDS
  // ==========================================================================

  // Don't render anything if the user isn't logged in
  if (!isLoggedIn) return null;

  // Show a loading spinner while checking permissions
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200">
      {/* ================================================================ */}
      {/* HEADER: Back button, page title, and step indicator              */}
      {/* ================================================================ */}
      <header className="border-b border-zinc-800/50 backdrop-blur-md bg-[#050505]/80 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: back button and title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm flex items-center gap-2"
              >
                ← 返回
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-zinc-100">
                  {editId ? "编辑活动" : "创建活动"}
                </h1>
                <p className="text-xs text-zinc-500 font-mono tracking-wide">
                  AI-NATIVE HACKATHON PLATFORM
                </p>
              </div>
            </div>

            {/* Center: step indicator – three numbered steps */}
            <div className="hidden md:flex items-center gap-2">
              {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;
                return (
                  <button
                    key={stepNum}
                    onClick={() => setCurrentStep(stepNum)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? "bg-brand/20 border border-brand/30 text-brand"
                        : isCompleted
                          ? "bg-zinc-800 border border-zinc-700 text-zinc-300"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-500"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive
                          ? "bg-brand text-black"
                          : isCompleted
                            ? "bg-zinc-600 text-zinc-200"
                            : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {stepNum}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Right: organizer name */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 font-mono">
                {currentUser?.full_name || "Organizer"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* MAIN CONTENT AREA                                                */}
      {/* Two-column grid: left = step content (8 cols), right = sidebar   */}
      {/* ================================================================ */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* ============================================================ */}
          {/* LEFT COLUMN (8 cols) – Shows content for the current step     */}
          {/* ============================================================ */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* ----------------------------------------------------------
                AI COMMAND BAR
                Always visible at the top. The user types a topic and the
                AI auto-fills the form with sensible defaults.
            ---------------------------------------------------------- */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-[16px] p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    {aiCommand.isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-brand" />
                    )}
                    <span className="text-xs font-mono tracking-wider">
                      AI 闪电生成
                    </span>
                  </div>
                  <Input
                    ref={cmdInputRef}
                    value={aiCommand.query}
                    onChange={(e) =>
                      setAiCommand((prev) => ({
                        ...prev,
                        query: e.target.value,
                      }))
                    }
                    onKeyPress={(e) => e.key === "Enter" && handleAIGenerate()}
                    placeholder="描述您的黑客松想法，例如：'AI 驱动的可持续发展黑客松'"
                    className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 px-0"
                    disabled={aiCommand.isGenerating}
                  />
                  <Button
                    onClick={handleAIGenerate}
                    disabled={aiCommand.isGenerating || !aiCommand.query.trim()}
                    className="px-4 py-2 bg-brand/20 border border-brand/30 text-brand text-xs font-medium rounded-[12px] hover:bg-brand/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Wand2 className="w-3 h-3" />
                    Generate
                  </Button>
                </div>

                {/* Progress bar shown during AI generation */}
                <AnimatePresence>
                  {aiCommand.isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-zinc-800"
                    >
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                            className="h-full bg-gradient-to-r from-brand via-brand/70 to-brand"
                          />
                        </div>
                        <span className="font-mono">
                          AI 正在构建活动框架...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ========================================================== */}
            {/* STEP 1: CORE INFO                                          */}
            {/* Title, format, registration type, dates, location           */}
            {/* ========================================================== */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Title & Status */}
                <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-zinc-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                      基本信息 / Basic Info
                    </h2>
                  </div>

                  <div className="space-y-5">
                    {/* Hackathon title – the most prominent field */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        活动名称 / Title *
                      </label>
                      <Input
                        value={coreForm.title}
                        onChange={(e) =>
                          setCoreForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="例如：2026 AI 创新黑客松"
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Description textarea */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        简介 / Description
                      </label>
                      <Textarea
                        value={coreForm.description}
                        onChange={(e) =>
                          setCoreForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="一句话描述你的活动..."
                        rows={3}
                        className={INPUT_CLASS + " resize-none"}
                      />
                    </div>

                    {/* Tags input */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        标签 / Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {coreForm.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-[8px] bg-brand/10 border border-brand/20 px-2.5 py-1 text-xs text-brand"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                setCoreForm((prev) => ({
                                  ...prev,
                                  tags: prev.tags.filter((_, idx) => idx !== i),
                                }))
                              }
                              className="ml-0.5 hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {["AI", "Web3", "区块链", "IoT", "Cloud", "Data", "Security", "黑客松", "竞赛", "工作坊"].map(
                          (preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setCoreForm((prev) =>
                                  prev.tags.includes(preset)
                                    ? { ...prev, tags: prev.tags.filter((t) => t !== preset) }
                                    : { ...prev, tags: [...prev.tags, preset] }
                                );
                              }}
                              className={`rounded-[8px] px-2.5 py-1 text-[11px] font-medium transition-all border ${
                                coreForm.tags.includes(preset)
                                  ? "bg-brand/20 border-brand/30 text-brand"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                              }`}
                            >
                              {preset}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Status selector (draft vs published) */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        状态 / Status
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            setCoreForm((prev) => ({
                              ...prev,
                              status: "draft",
                            }))
                          }
                          className={`flex-1 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                            coreForm.status === "draft"
                              ? "bg-brand/20 border border-brand/30 text-brand"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <Save className="w-3 h-3 inline mr-1.5" />
                          草稿
                        </Button>
                        <Button
                          type="button"
                          onClick={() =>
                            setCoreForm((prev) => ({
                              ...prev,
                              status: "published",
                            }))
                          }
                          className={`flex-1 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                            coreForm.status === "published"
                              ? "bg-brand/20 border border-brand/30 text-brand"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <Rocket className="w-3 h-3 inline mr-1.5" />
                          发布
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Format & Registration Type */}
                <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-zinc-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                      活动形式 / Format
                    </h2>
                  </div>

                  <div className="space-y-5">
                    {/* Format toggle: online vs offline */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        举办方式 / Format *
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            setCoreForm((prev) => ({
                              ...prev,
                              format: "online",
                            }))
                          }
                          className={`flex-1 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                            coreForm.format === "online"
                              ? "bg-brand/20 border border-brand/30 text-brand"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <Globe className="w-3 h-3 inline mr-1.5" />
                          线上
                        </Button>
                        <Button
                          type="button"
                          onClick={() =>
                            setCoreForm((prev) => ({
                              ...prev,
                              format: "offline",
                            }))
                          }
                          className={`flex-1 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                            coreForm.format === "offline"
                              ? "bg-brand/20 border border-brand/30 text-brand"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <MapPin className="w-3 h-3 inline mr-1.5" />
                          线下
                        </Button>
                      </div>
                    </div>

                    {/* Registration type toggle: individual vs team */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        报名方式 / Registration Type *
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            setCoreForm((prev) => ({
                              ...prev,
                              registration_type: "individual",
                            }))
                          }
                          className={`flex-1 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                            coreForm.registration_type === "individual"
                              ? "bg-brand/20 border border-brand/30 text-brand"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <Users className="w-3 h-3 inline mr-1.5" />
                          个人报名
                        </Button>
                        <Button
                          type="button"
                          onClick={() =>
                            setCoreForm((prev) => ({
                              ...prev,
                              registration_type: "team",
                            }))
                          }
                          className={`flex-1 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                            coreForm.registration_type === "team"
                              ? "bg-brand/20 border border-brand/30 text-brand"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <Users className="w-3 h-3 inline mr-1.5" />
                          团队报名
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Dates */}
                <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                      活动时间 / Dates
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Start date – uses native HTML date picker */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        开始日期 / Start Date
                      </label>
                      <input
                        type="date"
                        value={coreForm.start_date}
                        onChange={(e) =>
                          setCoreForm((prev) => ({
                            ...prev,
                            start_date: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    {/* End date */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                        结束日期 / End Date
                      </label>
                      <input
                        type="date"
                        value={coreForm.end_date}
                        onChange={(e) =>
                          setCoreForm((prev) => ({
                            ...prev,
                            end_date: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                </section>

                {/* Location (only shown for offline events) */}
                {coreForm.format === "offline" && (
                  <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-zinc-500" />
                      </div>
                      <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                        活动地点 / Location
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {/* Province / City / District as separate text inputs */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                            省份 / Province
                          </label>
                          <Input
                            value={coreForm.province}
                            onChange={(e) =>
                              setCoreForm((prev) => ({
                                ...prev,
                                province: e.target.value,
                              }))
                            }
                            placeholder="如：北京市"
                            className={INPUT_SM_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                            城市 / City
                          </label>
                          <Input
                            value={coreForm.city}
                            onChange={(e) =>
                              setCoreForm((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            placeholder="如：北京市"
                            className={INPUT_SM_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                            区县 / District
                          </label>
                          <Input
                            value={coreForm.district}
                            onChange={(e) =>
                              setCoreForm((prev) => ({
                                ...prev,
                                district: e.target.value,
                              }))
                            }
                            placeholder="如：朝阳区"
                            className={INPUT_SM_CLASS}
                          />
                        </div>
                      </div>

                      {/* Detailed address */}
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                          详细地址 / Address
                        </label>
                        <Input
                          value={coreForm.address}
                          onChange={(e) =>
                            setCoreForm((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          placeholder="如：XX大厦3层会议厅"
                          className={INPUT_CLASS}
                        />
                      </div>

                      {/* Toggle: hide the detailed address from public view */}
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCoreForm((prev) => ({
                              ...prev,
                              is_address_hidden: !prev.is_address_hidden,
                            }))
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-[12px] text-xs transition-all ${
                            coreForm.is_address_hidden
                              ? "bg-amber-900/20 border border-amber-800/30 text-amber-400"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-500"
                          }`}
                        >
                          {coreForm.is_address_hidden ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          {coreForm.is_address_hidden
                            ? "详细地址已隐藏"
                            : "详细地址公开"}
                        </Button>
                        <span className="text-[10px] text-zinc-600">
                          隐藏后，报名者需确认后才能查看
                        </span>
                      </div>
                    </div>
                  </section>
                )}
              </motion.div>
            )}

            {/* ========================================================== */}
            {/* STEP 2: SECTION EDITOR                                      */}
            {/* Users add content sections (markdown, schedules, prizes,    */}
            {/* judging criteria) and fill in their child items.             */}
            {/* ========================================================== */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Add Section buttons – one for each section type */}
                <div className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-5">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                    添加内容板块 / Add Section
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(
                      [
                        "markdown",
                        "schedules",
                        "prizes",
                        "judging_criteria",
                      ] as SectionType[]
                    ).map((type) => {
                      const Icon = SECTION_TYPE_ICONS[type];
                      return (
                        <Button
                          key={type}
                          type="button"
                          onClick={() => addSection(type)}
                          className="flex items-center gap-2 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium rounded-[12px] hover:border-zinc-700 hover:text-zinc-300 transition-all"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <Plus className="w-3 h-3" />
                          {SECTION_TYPE_LABELS[type].split(" / ")[0]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Render each section card */}
                <AnimatePresence>
                  {sections.map((section, sIdx) => {
                    const Icon = SECTION_TYPE_ICONS[section.section_type];
                    return (
                      <motion.section
                        key={sIdx}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6"
                      >
                        {/* Section header: icon, type badge, title input, delete */}
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-zinc-500" />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 rounded">
                            {SECTION_TYPE_LABELS[section.section_type]}
                          </span>
                          <Input
                            value={section.title}
                            onChange={(e) =>
                              updateSectionTitle(sIdx, e.target.value)
                            }
                            placeholder="板块标题"
                            className={`flex-1 ${INPUT_SM_CLASS}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSection(sIdx)}
                            className="p-1.5 hover:bg-red-900/20 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>

                        {/* ------------------------------------------------
                            SECTION BODY: varies by section_type
                        ------------------------------------------------ */}

                        {/* MARKDOWN section: a textarea for rich text content */}
                        {section.section_type === "markdown" && (
                          <div>
                            <Textarea
                              value={section.content}
                              onChange={(e) =>
                                updateSectionContent(sIdx, e.target.value)
                              }
                              placeholder="支持 Markdown 语法..."
                              rows={8}
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[12px] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition-colors resize-none font-mono"
                            />
                            <p className="text-[10px] text-zinc-600 mt-2 font-mono">
                              提示：支持 Markdown 语法，可使用 #
                              标题、**粗体**、- 列表等
                            </p>
                          </div>
                        )}

                        {/* SCHEDULES section: list of schedule event items */}
                        {section.section_type === "schedules" && (
                          <div className="space-y-3">
                            {section.schedules.map((item, iIdx) => (
                              <div
                                key={iIdx}
                                className="bg-zinc-900/30 border border-zinc-800 rounded-[12px] p-4 group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 grid grid-cols-3 gap-3">
                                    {/* Event name */}
                                    <Input
                                      value={item.event_name}
                                      onChange={(e) =>
                                        updateScheduleItem(
                                          sIdx,
                                          iIdx,
                                          "event_name",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="事件名称"
                                      className={INPUT_SM_CLASS}
                                    />
                                    {/* Start time – native datetime-local picker */}
                                    <input
                                      type="datetime-local"
                                      value={item.start_time}
                                      onChange={(e) =>
                                        updateScheduleItem(
                                          sIdx,
                                          iIdx,
                                          "start_time",
                                          e.target.value,
                                        )
                                      }
                                      className={INPUT_SM_CLASS}
                                    />
                                    {/* End time */}
                                    <input
                                      type="datetime-local"
                                      value={item.end_time}
                                      onChange={(e) =>
                                        updateScheduleItem(
                                          sIdx,
                                          iIdx,
                                          "end_time",
                                          e.target.value,
                                        )
                                      }
                                      className={INPUT_SM_CLASS}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeScheduleItem(sIdx, iIdx)
                                    }
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/20 rounded transition-all"
                                  >
                                    <X className="w-3 h-3 text-red-400" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => addScheduleItem(sIdx)}
                              className="w-full py-2.5 border border-dashed border-zinc-800 rounded-[12px] text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3 h-3" />
                              添加日程项
                            </Button>
                          </div>
                        )}

                        {/* PRIZES section: list of prize tier items */}
                        {section.section_type === "prizes" && (
                          <div className="space-y-3">
                            {section.prizes.map((item, iIdx) => (
                              <div
                                key={iIdx}
                                className="bg-zinc-900/30 border border-zinc-800 rounded-[12px] p-4 group"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Prize name */}
                                  <Input
                                    value={item.name}
                                    onChange={(e) =>
                                      updatePrizeItem(
                                        sIdx,
                                        iIdx,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="奖项名称"
                                    className={`flex-1 ${INPUT_SM_CLASS}`}
                                  />
                                  {/* Winning standards */}
                                  <Input
                                    value={item.winning_standards}
                                    onChange={(e) =>
                                      updatePrizeItem(
                                        sIdx,
                                        iIdx,
                                        "winning_standards",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="获奖标准"
                                    className={`flex-1 ${INPUT_SM_CLASS}`}
                                  />
                                  {/* Quantity */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-zinc-500">
                                      名额
                                    </span>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updatePrizeItem(
                                          sIdx,
                                          iIdx,
                                          "quantity",
                                          parseInt(e.target.value) || 1,
                                        )
                                      }
                                      className={`w-16 text-center ${INPUT_SM_CLASS}`}
                                    />
                                  </div>
                                  {/* Total cash amount */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-zinc-500">
                                      奖金
                                    </span>
                                    <Input
                                      type="number"
                                      value={item.total_cash_amount}
                                      onChange={(e) =>
                                        updatePrizeItem(
                                          sIdx,
                                          iIdx,
                                          "total_cash_amount",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className={`w-24 text-right ${INPUT_SM_CLASS}`}
                                    />
                                    <span className="text-xs text-zinc-500">
                                      元
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePrizeItem(sIdx, iIdx)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/20 rounded transition-all"
                                  >
                                    <X className="w-3 h-3 text-red-400" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Add prize button */}
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => addPrizeItem(sIdx)}
                              className="w-full py-2.5 border border-dashed border-zinc-800 rounded-[12px] text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3 h-3" />
                              添加奖项
                            </Button>

                            {/* Total prize pool for this section */}
                            <div className="flex items-center justify-between text-xs pt-2">
                              <span className="text-zinc-500 font-mono">
                                本板块总奖金
                              </span>
                              <span className="text-brand font-mono">
                                ¥{" "}
                                {section.prizes
                                  .reduce(
                                    (sum, p) =>
                                      sum + p.total_cash_amount * p.quantity,
                                    0,
                                  )
                                  .toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* JUDGING CRITERIA section: list of scoring dimensions */}
                        {section.section_type === "judging_criteria" && (
                          <div className="space-y-3">
                            {section.judging_criteria.map((item, iIdx) => (
                              <div
                                key={iIdx}
                                className="bg-zinc-900/30 border border-zinc-800 rounded-[12px] p-4 group"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  {/* Criterion name */}
                                  <Input
                                    value={item.name}
                                    onChange={(e) =>
                                      updateCriterionItem(
                                        sIdx,
                                        iIdx,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="评审维度名称"
                                    className={`flex-1 ${INPUT_SM_CLASS}`}
                                  />
                                  {/* Weight percentage */}
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={item.weight_percentage}
                                      onChange={(e) =>
                                        updateCriterionItem(
                                          sIdx,
                                          iIdx,
                                          "weight_percentage",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      placeholder="权重"
                                      className={`w-16 text-center ${INPUT_SM_CLASS}`}
                                    />
                                    <span className="text-xs text-zinc-500">
                                      %
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeCriterionItem(sIdx, iIdx)
                                    }
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/20 rounded transition-all"
                                  >
                                    <X className="w-3 h-3 text-red-400" />
                                  </Button>
                                </div>
                                {/* Description textarea */}
                                <Textarea
                                  value={item.description}
                                  onChange={(e) =>
                                    updateCriterionItem(
                                      sIdx,
                                      iIdx,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="评审标准描述..."
                                  rows={2}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-[12px] px-3 py-2 text-xs text-zinc-400 placeholder-zinc-600 outline-none focus:border-zinc-700 resize-none"
                                />
                              </div>
                            ))}

                            {/* Add criterion button */}
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => addCriterionItem(sIdx)}
                              className="w-full py-2.5 border border-dashed border-zinc-800 rounded-[12px] text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3 h-3" />
                              添加评审维度
                            </Button>

                            {/* Weight percentage total for this section */}
                            <div className="flex items-center justify-between text-xs pt-2">
                              <span className="text-zinc-500 font-mono">
                                总权重
                              </span>
                              <span
                                className={`font-mono ${
                                  section.judging_criteria.reduce(
                                    (sum, c) => sum + c.weight_percentage,
                                    0,
                                  ) === 100
                                    ? "text-emerald-400"
                                    : "text-amber-400"
                                }`}
                              >
                                {section.judging_criteria.reduce(
                                  (sum, c) => sum + c.weight_percentage,
                                  0,
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.section>
                    );
                  })}
                </AnimatePresence>

                {/* Empty state when no sections have been added yet */}
                {sections.length === 0 && (
                  <div className="bg-[#0A0A0A] border border-dashed border-zinc-800 rounded-[16px] p-12 text-center">
                    <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">
                      还没有内容板块，点击上方按钮添加
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      可以添加富文本介绍、日程安排、奖项设置、评审标准等
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========================================================== */}
            {/* STEP 3: HOSTS & PARTNERS                                    */}
            {/* ========================================================== */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* ---------- Hosts Section ---------- */}
                <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Users className="w-4 h-4 text-zinc-500" />
                      </div>
                      <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                        主办方 / Hosts *
                      </h2>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingHostIndex(null);
                        setNewHostName("");
                        setNewHostLogo("");
                        setHostDialogOpen(true);
                      }}
                      className="p-2 hover:bg-zinc-900 rounded-[12px] transition-colors flex items-center gap-1.5 text-xs text-zinc-400"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      添加
                    </Button>
                  </div>

                  {hosts.length === 0 && (
                    <p className="text-xs text-amber-400/80 mb-3">
                      至少添加一个主办方才能提交
                    </p>
                  )}

                  {/* Draggable host list (same UI as the original) */}
                  <div className="space-y-2">
                    {hosts.map((h, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => handleHostDragStart(idx)}
                        onDragOver={(e) => handleHostDragOver(e, idx)}
                        onDragEnd={handleHostDragEnd}
                        className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-[12px] px-3 py-2.5 group cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                        {/* Host logo or initial avatar */}
                        {h.logo_url ? (
                          <img
                            src={h.logo_url}
                            alt={h.name}
                            className="w-10 h-10 rounded-[8px] object-contain bg-zinc-800 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-[8px] bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm text-zinc-500">
                              {h.name[0]}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-zinc-300 truncate flex-1">
                          {h.name}
                        </span>
                        {/* Edit button (appears on hover) */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditHostDialog(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded transition-all flex-shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        </Button>
                        {/* Remove button (appears on hover) */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHost(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/20 rounded transition-all flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ---------- Partners Section ---------- */}
                <section className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[12px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Link className="w-4 h-4 text-zinc-500" />
                      </div>
                      <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                        合作伙伴 / Partners
                      </h2>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPartnerIndex(null);
                        setNewPartnerName("");
                        setNewPartnerLogo("");
                        setNewPartnerCategory("");
                        setNewPartnerWebsite("");
                        setPartnerDialogOpen(true);
                      }}
                      className="p-2 hover:bg-zinc-900 rounded-[12px] transition-colors flex items-center gap-1.5 text-xs text-zinc-400"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      添加
                    </Button>
                  </div>

                  {partners.length === 0 && (
                    <div className="border border-dashed border-zinc-800 rounded-[12px] p-8 text-center">
                      <Link className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500">
                        暂无合作伙伴，点击上方按钮添加
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        可以添加赞助商、技术合作伙伴、媒体合作等
                      </p>
                    </div>
                  )}

                  {/* Draggable partner list */}
                  <div className="space-y-2">
                    {partners.map((p, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => handlePartnerDragStart(idx)}
                        onDragOver={(e) => handlePartnerDragOver(e, idx)}
                        onDragEnd={handlePartnerDragEnd}
                        className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-[12px] px-3 py-2.5 group cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                        {p.logo_url ? (
                          <img
                            src={p.logo_url}
                            alt={p.name}
                            className="w-10 h-10 rounded-[8px] object-contain bg-zinc-800 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-[8px] bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm text-zinc-500">
                              {p.name[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-zinc-300 truncate block">
                            {p.name}
                          </span>
                          {p.category && (
                            <span className="text-[10px] text-zinc-500">
                              {p.category}
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditPartnerDialog(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded transition-all flex-shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePartner(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/20 rounded transition-all flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN (4 cols) – Sidebar                               */}
          {/* Contains: cover image preview, stats, step navigation,        */}
          {/* and action buttons. Sticky so it stays visible while          */}
          {/* scrolling through long step content.                          */}
          {/* ============================================================ */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Cover Image Preview & Upload */}
              <div className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    封面图 / Cover
                  </h3>
                  <AIGenerateImageButton
                    buttonText="AI 生图"
                    scene="cover"
                    context={coreForm.title || "黑客松活动"}
                    onImageGenerated={(url) =>
                      setCoreForm((prev) => ({ ...prev, cover_image: url }))
                    }
                    className="text-xs px-3 py-1.5"
                  />
                </div>

                {/* Cover image area: supports drag-and-drop file upload */}
                <div
                  className="aspect-video bg-zinc-900 border border-zinc-800 rounded-[12px] overflow-hidden relative group"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {coreForm.cover_image ? (
                    <>
                      <img
                        src={coreForm.cover_image}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay with change/remove buttons */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2 bg-brand hover:bg-brand/90 text-black text-xs font-medium rounded-[12px] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <Upload className="w-3 h-3" />
                          {uploading ? "上传中..." : "更换图片"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setCoreForm((prev) => ({
                              ...prev,
                              cover_image: "",
                            }))
                          }
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-[12px] transition-colors flex items-center gap-2"
                        >
                          <X className="w-3 h-3" />
                          移除
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div
                      className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900/80 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center p-4">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-zinc-500" />
                        </div>
                        <p className="text-xs text-zinc-400 mb-1">
                          点击或拖拽上传封面图
                        </p>
                        <p className="text-[10px] text-zinc-600">
                          支持 JPG、PNG 格式，最大 5MB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hidden file input for the cover image upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                  />

                  {/* Upload progress overlay */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto mb-2" />
                        <p className="text-xs text-zinc-400">图片上传中...</p>
                      </div>
                    </div>
                  )}

                  {/* Title overlay at the bottom of the preview image */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <h4 className="text-xs font-semibold text-white line-clamp-1">
                      {coreForm.title || "活动名称"}
                    </h4>
                  </div>
                </div>

                {/* Summary stats showing counts for each data category */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/50 rounded-[12px] p-3">
                    <div className="text-[10px] text-zinc-500 mb-1">
                      内容板块
                    </div>
                    <div className="text-sm font-semibold text-zinc-300">
                      {sections.length} 个
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-[12px] p-3">
                    <div className="text-[10px] text-zinc-500 mb-1">主办方</div>
                    <div className="text-sm font-semibold text-zinc-300">
                      {hosts.length} 个
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-[12px] p-3">
                    <div className="text-[10px] text-zinc-500 mb-1">
                      合作伙伴
                    </div>
                    <div className="text-sm font-semibold text-zinc-300">
                      {partners.length} 个
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-[12px] p-3">
                    <div className="text-[10px] text-zinc-500 mb-1">
                      活动形式
                    </div>
                    <div className="text-sm font-semibold text-zinc-300">
                      {coreForm.format === "online" ? "线上" : "线下"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Navigation + Action Buttons */}
              <div className="bg-[#0A0A0A] border border-zinc-800/50 rounded-[16px] p-5 space-y-3">
                {/* Error message display */}
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-[12px] text-red-400 text-xs whitespace-pre-wrap">
                    {error}
                  </div>
                )}

                {/* Step navigation: Previous and Next buttons */}
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep((s) => s - 1)}
                      className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-sm font-medium rounded-[12px] transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一步
                    </Button>
                  )}
                  {currentStep < 3 && (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep((s) => s + 1)}
                      className="flex-1 py-3 bg-brand/20 border border-brand/30 text-brand text-sm font-medium rounded-[12px] hover:bg-brand/30 transition-all flex items-center justify-center gap-2"
                    >
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Submit button (visible on the last step or always accessible) */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 bg-brand hover:bg-brand/90 text-black text-sm font-medium rounded-[12px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                >
                  <Rocket className="w-4 h-4" />
                  {submitting ? "提交中..." : editId ? "保存修改" : "提交活动"}
                </Button>

                {/* Quick info about the current status setting */}
                <p className="text-[10px] text-zinc-600 text-center">
                  当前状态：
                  <span
                    className={
                      coreForm.status === "published"
                        ? "text-brand"
                        : "text-zinc-400"
                    }
                  >
                    {coreForm.status === "published" ? "发布" : "草稿"}
                  </span>
                  ，可在第一步修改
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================================================================ */}
      {/* HOST DIALOG                                                      */}
      {/* Modal for adding or editing a host (organizer). Supports name     */}
      {/* input and logo upload. The logo_url field name matches the        */}
      {/* backend HackathonHost schema.                                     */}
      {/* ================================================================ */}
      <Dialog
        open={hostDialogOpen}
        onOpenChange={(open) => {
          setHostDialogOpen(open);
          if (!open) {
            setEditingHostIndex(null);
            setNewHostName("");
            setNewHostLogo("");
          }
        }}
      >
        <DialogContent className="bg-[#0A0A0A] border border-zinc-800 text-zinc-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingHostIndex !== null ? "编辑主办方" : "添加主办方"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Host name input */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                名称 *
              </label>
              <Input
                value={newHostName}
                onChange={(e) => setNewHostName(e.target.value.slice(0, 25))}
                placeholder="主办方名称"
                maxLength={25}
                className={INPUT_CLASS}
              />
              <p className="text-[10px] text-zinc-600 mt-1 text-right">
                {newHostName.length}/25
              </p>
            </div>

            {/* Host logo upload (optional) */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                Logo（可选）
              </label>
              {newHostLogo ? (
                <div className="flex items-center gap-3">
                  <img
                    src={newHostLogo}
                    alt="logo preview"
                    className="w-16 h-16 rounded-[8px] object-contain bg-zinc-900 border border-zinc-800"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewHostLogo("")}
                    className="text-xs text-zinc-400 hover:text-red-400"
                  >
                    移除
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => hostLogoInputRef.current?.click()}
                  className="w-full h-20 bg-zinc-900 border border-dashed border-zinc-700 rounded-[12px] flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors"
                >
                  {hostLogoUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-zinc-500 mb-1" />
                      <p className="text-[10px] text-zinc-500">
                        点击上传 Logo（最大 500 KB）
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={hostLogoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleHostLogoUpload(file);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter className="bg-transparent border-t-0 p-0 m-0 flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setHostDialogOpen(false);
                setNewHostName("");
                setNewHostLogo("");
                setEditingHostIndex(null);
              }}
              className="bg-zinc-900 border-zinc-800 text-zinc-400 text-xs rounded-[12px]"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={confirmAddHost}
              disabled={!newHostName.trim()}
              className="bg-brand hover:bg-brand/90 text-black text-xs font-medium rounded-[12px] disabled:opacity-50"
            >
              {editingHostIndex !== null ? "保存修改" : "确认添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* PARTNER DIALOG                                                   */}
      {/* Modal for adding or editing a partner / sponsor. Includes name,   */}
      {/* logo, category (e.g. "赞助商"), and optional website URL.        */}
      {/* ================================================================ */}
      <Dialog
        open={partnerDialogOpen}
        onOpenChange={(open) => {
          setPartnerDialogOpen(open);
          if (!open) {
            setEditingPartnerIndex(null);
            setNewPartnerName("");
            setNewPartnerLogo("");
            setNewPartnerCategory("");
            setNewPartnerWebsite("");
          }
        }}
      >
        <DialogContent className="bg-[#0A0A0A] border border-zinc-800 text-zinc-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingPartnerIndex !== null ? "编辑合作伙伴" : "添加合作伙伴"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Partner name */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                名称 *
              </label>
              <Input
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value.slice(0, 30))}
                placeholder="合作伙伴名称"
                maxLength={30}
                className={INPUT_CLASS}
              />
            </div>

            {/* Category (e.g. "赞助商", "技术合作", "媒体合作") */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                类别 / Category
              </label>
              <Input
                value={newPartnerCategory}
                onChange={(e) => setNewPartnerCategory(e.target.value)}
                placeholder="如：赞助商、技术合作、媒体合作"
                className={INPUT_CLASS}
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                网站 / Website
              </label>
              <Input
                value={newPartnerWebsite}
                onChange={(e) => setNewPartnerWebsite(e.target.value)}
                placeholder="https://example.com"
                className={INPUT_CLASS}
              />
            </div>

            {/* Partner logo upload (optional) */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                Logo（可选）
              </label>
              {newPartnerLogo ? (
                <div className="flex items-center gap-3">
                  <img
                    src={newPartnerLogo}
                    alt="logo preview"
                    className="w-16 h-16 rounded-[8px] object-contain bg-zinc-900 border border-zinc-800"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewPartnerLogo("")}
                    className="text-xs text-zinc-400 hover:text-red-400"
                  >
                    移除
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => partnerLogoInputRef.current?.click()}
                  className="w-full h-20 bg-zinc-900 border border-dashed border-zinc-700 rounded-[12px] flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors"
                >
                  {partnerLogoUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-zinc-500 mb-1" />
                      <p className="text-[10px] text-zinc-500">
                        点击上传 Logo（最大 500 KB）
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={partnerLogoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePartnerLogoUpload(file);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter className="bg-transparent border-t-0 p-0 m-0 flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPartnerDialogOpen(false);
                setNewPartnerName("");
                setNewPartnerLogo("");
                setNewPartnerCategory("");
                setNewPartnerWebsite("");
                setEditingPartnerIndex(null);
              }}
              className="bg-zinc-900 border-zinc-800 text-zinc-400 text-xs rounded-[12px]"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={confirmAddPartner}
              disabled={!newPartnerName.trim()}
              className="bg-brand hover:bg-brand/90 text-black text-xs font-medium rounded-[12px] disabled:opacity-50"
            >
              {editingPartnerIndex !== null ? "保存修改" : "确认添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
