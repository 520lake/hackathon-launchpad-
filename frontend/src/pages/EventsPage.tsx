import { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import HackathonCard, {
  type HackathonCardData,
} from "../components/HackathonCardV2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, {
  type Option,
} from "@/components/ui/multiple-selector";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw } from "lucide-react";

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  format?: string;
  location?: string;
  organizer_name?: string;
  awards_detail?: string;
  organizer_id?: number;
  hosts?: Array<{
    id: number;
    name: string;
    logo?: string;
    display_order: number;
  }>;
}

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
}

// 格式化日期范围：同年 "YYYY.M.D - M.D"，跨年 "YYYY.M.D - YYYY.M.D"，无前导零
const formatDateRange = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return "待定";
  const start = new Date(startStr);
  const end = new Date(endStr);
  const sy = start.getFullYear();
  const sm = start.getMonth() + 1;
  const sd = start.getDate();
  const ey = end.getFullYear();
  const em = end.getMonth() + 1;
  const ed = end.getDate();

  if (sy === ey) {
    return `${sy}.${sm}.${sd} - ${em}.${ed}`;
  }
  return `${sy}.${sm}.${sd} - ${ey}.${em}.${ed}`;
};

// 解析奖金
const parseAwards = (awardsDetail?: string) => {
  if (!awardsDetail) return "暂无奖品信息";

  // 尝试解析 JSON 格式
  try {
    const awards = JSON.parse(awardsDetail);
    if (Array.isArray(awards) && awards.length > 0) {
      // 计算总奖金
      const totalCash = awards.reduce(
        (sum, award) => sum + (award.amount || 0),
        0,
      );
      if (totalCash >= 10000) {
        return `¥ ${(totalCash / 10000).toFixed(0)}万 + ${awards.length}个奖项`;
      } else if (totalCash > 0) {
        return `¥ ${totalCash.toLocaleString()} + ${awards.length}个奖项`;
      }
      return `${awards.length}个奖项`;
    }
  } catch (e) {
    // 如果不是 JSON，按原来的方式解析
  }

  // 兼容旧格式：简单字符串解析
  const cashMatch = awardsDetail.match(/(\d+)/);
  if (cashMatch) {
    const amount = parseInt(cashMatch[1]);
    if (amount >= 10000) {
      return `¥ ${(amount / 10000).toFixed(0)}万 + 非现金奖品`;
    }
    return `¥ ${amount.toLocaleString()} + 非现金奖品`;
  }
  return awardsDetail.length > 20
    ? awardsDetail.slice(0, 20) + "..."
    : awardsDetail;
};

// Mock 数据兜底
const MOCK_DATA: HackathonCardData[] = [
  {
    id: "1",
    title: "Aurathon AI 创新黑客松 2026",
    description:
      "探索人工智能的无限可能，与全球开发者一起创造未来。我们寻找最具创新性的 AI 应用解决方案。",
    hosts: [{ name: "Aurathon 官方", logo: "" }],
    tags: ["AI", "机器学习", "创新赛"],
    status: "ongoing",
    dateRange: "2026.1.15 - 3.1",
    location: "线上 + 上海市",
    prizeText: "¥ 50万 + GPU 算力支持 + 投资机会",
  },
  {
    id: "2",
    title: "Web3 开发者挑战赛",
    description:
      "聚焦区块链、DeFi、NFT 等前沿技术，连接开发者与资本，打造下一代 Web3 应用。",
    hosts: [{ name: "Blockchain Labs", logo: "" }],
    tags: ["Web3", "区块链", "DeFi"],
    status: "published",
    dateRange: "2026.3.1 - 3.15",
    location: "线上",
    prizeText: "¥ 20万 + 代币激励",
  },
];

export default function EventsPage() {
  const navigate = useNavigate();
  useOutletContext<OutletContextType>();

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");

  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [locationFilters, setLocationFilters] = useState<Option[]>([]);
  const [tagFilters, setTagFilters] = useState<Option[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);

      // 获取所有活动
      const response = await axios.get("/api/v1/hackathons");
      const allHackathons = response.data;

      // 显示所有已发布的活动
      setHackathons(allHackathons);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 将后端数据转换为 HackathonCard 格式
  const transformToCardData = (hackathon: Hackathon): HackathonCardData => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isOrganizer = hackathon.organizer_id === currentUser.id;

    return {
      id: String(hackathon.id),
      title: hackathon.title,
      description: hackathon.description,
      // 将后端的封面图字段传递给卡片组件，
      // 这样每个活动都可以展示自己的「应用图标 / banner」，
      // 避免页面上全部是文字导致“太白、太空”的感觉。
      coverImage: hackathon.cover_image,
      hosts:
        hackathon.hosts && hackathon.hosts.length > 0
          ? hackathon.hosts.map((h) => ({ name: h.name, logo: h.logo }))
          : [{ name: hackathon.organizer_name || "未知主办方" }],
      tags:
        hackathon.theme_tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3) || [],
      status: hackathon.status,
      dateRange: formatDateRange(hackathon.start_date, hackathon.end_date),
      location: hackathon.location || "线上",
      prizeText: parseAwards(hackathon.awards_detail),
      isOrganizer, // 添加标识，用于卡片显示
    };
  };

  // 处理卡片点击
  const handleCardClick = (data: HackathonCardData) => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(`/events/${data.id}`);
    }, 300);
  };

  // 从所有活动中提取唯一标签和地点
  const allTags: Option[] = useMemo(
    () =>
      Array.from(
        new Set(
          hackathons.flatMap(
            (h) =>
              h.theme_tags
                ?.split(",")
                .map((t) => t.trim())
                .filter(Boolean) || [],
          ),
        ),
      ).map((tag) => ({ value: tag, label: tag })),
    [hackathons],
  );

  const allLocations: Option[] = useMemo(
    () =>
      Array.from(
        new Set(hackathons.map((h) => h.location).filter(Boolean) as string[]),
      ).map((loc) => ({ value: loc, label: loc })),
    [hackathons],
  );

  // 筛选 + 排序逻辑：先按用户输入过滤，再根据排序选项调整顺序
  const filteredHackathons = useMemo(() => {
    const filtered = hackathons.filter((h) => {
      const matchesSearch =
        !searchQuery ||
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(h.status);
      const matchesType =
        typeFilters.length === 0 || typeFilters.includes(h.format || "offline");
      const matchesLocation =
        locationFilters.length === 0 ||
        locationFilters.some((f) => h.location?.includes(f.value));
      const matchesTag =
        tagFilters.length === 0 ||
        tagFilters.some((f) => h.theme_tags?.includes(f.value));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesLocation &&
        matchesTag
      );
    });

    const sorted = [...filtered];

    // 根据当前排序选项调整顺序，以贴近设计中“为你推荐 / 最新 / 即将截止”的体验
    if (sortBy === "latest") {
      sorted.sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      );
    } else if (sortBy === "deadline") {
      sorted.sort(
        (a, b) =>
          new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
      );
    } else if (sortBy === "recommended") {
      const statusWeight: Record<string, number> = {
        ongoing: 0,
        registration: 1,
        upcoming: 2,
        published: 3,
        ended: 4,
      };

      sorted.sort((a, b) => {
        const weightA = statusWeight[a.status] ?? 99;
        const weightB = statusWeight[b.status] ?? 99;
        if (weightA !== weightB) return weightA - weightB;
        return (
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
      });
    }

    return sorted;
  }, [
    hackathons,
    searchQuery,
    statusFilters,
    typeFilters,
    locationFilters,
    tagFilters,
    sortBy,
  ]);

  // 转换为卡片数据
  const cardDataList = useMemo(() => {
    if (filteredHackathons.length === 0 && !loading) {
      return MOCK_DATA;
    }
    return filteredHackathons.map(transformToCardData);
  }, [filteredHackathons, loading]);

  // 清除所有筛选
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilters([]);
    setTypeFilters([]);
    setLocationFilters([]);
    setTagFilters([]);
  };

  // 状态选项
  const statusOptions = [
    {
      value: "registration",
      label: "报名中",
      bgColor: "bg-amber-500",
      textColor: "text-amber-400",
      borderColor: "border-amber-500",
      bgLight: "bg-amber-500/10",
    },
    {
      value: "upcoming",
      label: "期待开始",
      bgColor: "bg-blue-500",
      textColor: "text-blue-400",
      borderColor: "border-blue-500",
      bgLight: "bg-blue-500/10",
    },
    {
      value: "ongoing",
      label: "进行中",
      bgColor: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500",
      bgLight: "bg-emerald-500/10",
    },
    {
      value: "ended",
      label: "已结束",
      bgColor: "bg-gray-500",
      textColor: "text-gray-400",
      borderColor: "border-gray-500",
      bgLight: "bg-gray-500/10",
    },
    {
      value: "published",
      label: "已发布",
      bgColor: "bg-purple-500",
      textColor: "text-purple-400",
      borderColor: "border-purple-500",
      bgLight: "bg-purple-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-foreground">
      {/* 页面头部：与 Figma 中的“// 探索网络”主标题区域对齐 */}
      <div className="px-8 pt-10 pb-6">
        <div className="max-w-6xl mx-auto">
          {/* 返回导航保持在左上角，便于用户回到首页 */}
          <div className="flex items-center gap-4 mb-5 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="px-2 py-1 h-7"
              onClick={() => navigate("/")}
            >
              <svg
                className="w-4 h-4 mr-1 flex-shrink-0"
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
              返回
            </Button>
            <span>/</span>
            <span>探索网络</span>
          </div>

          {/* 居中主标题块，模仿 Figma 中的标题排版 */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center justify-center mb-3">
              <span className="text-muted-foreground font-mono mr-2">//</span>
              <h1 className="text-4xl font-semibold tracking-tight text-white">
                探索网络
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              浏览并筛选所有黑客松活动。
            </p>
          </div>
        </div>
      </div>

      {/* 主视图结构：左侧筛选 + 右侧活动列表，与 Figma 中的两栏布局一致 */}
      <div className="px-8 pb-12">
        <div className="max-w-6xl mx-auto flex gap-10">
          {/* 左侧筛选侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8 rounded-2xl bg-[#050505] border border-[#262626] px-5 py-6">
              {/* 筛选标题 + 重置按钮（无筛选时隐藏但保留占位，避免布局跳动） */}
              <div className="flex items-center justify-between mb-6 text-sm">
                <span className="font-medium text-white">筛选</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-xs text-muted-foreground hover:text-white transition-opacity ${
                    searchQuery ||
                    statusFilters.length > 0 ||
                    typeFilters.length > 0 ||
                    locationFilters.length > 0 ||
                    tagFilters.length > 0
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                  onClick={clearFilters}
                >
                  <RotateCcw className="w-3 h-3 mr-1 flex-shrink-0" />
                  重置
                </Button>
              </div>

              {/* 状态筛选 */}
              <div className="mb-6">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  状态
                </h3>
                <div className="space-y-2">
                  {statusOptions.map((option) => {
                    const isChecked = statusFilters.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() =>
                          setStatusFilters((prev) =>
                            isChecked
                              ? prev.filter((v) => v !== option.value)
                              : [...prev, option.value],
                          )
                        }
                      >
                        {/* Shadcn Checkbox — Radix-based, fully accessible */}
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={isChecked}
                          onCheckedChange={() =>
                            setStatusFilters((prev) =>
                              isChecked
                                ? prev.filter((v) => v !== option.value)
                                : [...prev, option.value],
                            )
                          }
                          className="border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label
                          htmlFor={`status-${option.value}`}
                          className={`text-sm px-2 py-0.5 rounded-full cursor-pointer ${
                            isChecked
                              ? `${option.textColor} ${option.bgLight}`
                              : "text-gray-400"
                          }`}
                        >
                          {option.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 活动类型筛选 */}
              <div className="mb-6">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  活动类型
                </h3>
                <div className="space-y-2">
                  {["线下", "线上", "混合"].map((type) => {
                    const isChecked = typeFilters.includes(type);
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() =>
                          setTypeFilters((prev) =>
                            isChecked
                              ? prev.filter((v) => v !== type)
                              : [...prev, type],
                          )
                        }
                      >
                        {/* Shadcn Checkbox — Radix-based, fully accessible */}
                        <Checkbox
                          id={`type-${type}`}
                          checked={isChecked}
                          onCheckedChange={() =>
                            setTypeFilters((prev) =>
                              isChecked
                                ? prev.filter((v) => v !== type)
                                : [...prev, type],
                            )
                          }
                          className="border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm text-gray-400 cursor-pointer"
                        >
                          {type}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 地点下拉 - 多选 */}
              <div className="mb-6">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  地点
                </h3>
                <MultipleSelector
                  value={locationFilters}
                  onChange={setLocationFilters}
                  defaultOptions={allLocations}
                  options={allLocations}
                  placeholder="选择地点"
                  hidePlaceholderWhenSelected
                  emptyIndicator={
                    <p className="text-center text-sm text-muted-foreground">
                      无匹配地点
                    </p>
                  }
                  className="border-[#262626] bg-transparent text-sm"
                  badgeClassName="bg-[#2a2a2a] text-gray-300 border-none text-[10px]"
                />
              </div>

              {/* 标签下拉 - 多选 */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  标签
                </h3>
                <MultipleSelector
                  value={tagFilters}
                  onChange={setTagFilters}
                  defaultOptions={allTags}
                  options={allTags}
                  placeholder="选择标签"
                  hidePlaceholderWhenSelected
                  emptyIndicator={
                    <p className="text-center text-sm text-muted-foreground">
                      无匹配标签
                    </p>
                  }
                  className="border-[#262626] bg-transparent text-sm"
                  badgeClassName="bg-[#2a2a2a] text-gray-300 border-none text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* 右侧活动列表区 */}
          <div className="flex-1 min-w-0">
            {/* 顶部控制条：左侧结果数 + 右侧搜索和排序 */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                共 {cardDataList.length} 个结果
              </span>

              <div className="flex items-center gap-3">
                {/* 搜索框带图标 */}
                <div className="relative w-[260px]">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex-shrink-0 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                    />
                  </svg>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索黑客松活动..."
                    className="pl-9 h-8 bg-[#111111] border-[#262626] text-sm"
                  />
                </div>

                {/* 排序下拉 */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[120px] h-8 bg-[#111111] border-[#262626] text-sm text-muted-foreground">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">为你推荐</SelectItem>
                    <SelectItem value="latest">最新发布</SelectItem>
                    <SelectItem value="deadline">即将截止</SelectItem>
                    <SelectItem value="all">不过滤</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 页面切换加载遮罩 */}
            {isNavigating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    加载中...
                  </span>
                </div>
              </motion.div>
            )}

            {/* 活动卡片列表 - 使用新组件 */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-muted/30 border border-border rounded-3xl p-5 animate-pulse"
                  >
                    <div className="flex gap-5">
                      <div className="w-32 h-32 bg-muted rounded-2xl flex-shrink-0" />
                      <div className="flex-1 space-y-3 py-2">
                        <div className="flex gap-2">
                          <div className="w-16 h-5 bg-muted rounded" />
                          <div className="w-16 h-5 bg-muted rounded" />
                        </div>
                        <div className="w-2/3 h-6 bg-muted rounded" />
                        <div className="w-full h-4 bg-muted rounded" />
                      </div>
                      <div className="w-48 space-y-3 py-2">
                        <div className="w-20 h-6 bg-muted rounded-full ml-auto" />
                        <div className="w-full h-4 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full">
                {cardDataList.map((data, index) => (
                  <HackathonCard
                    key={data.id}
                    data={data}
                    index={index}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}

            {/* 空状态 */}
            {!loading && cardDataList.length === 0 && (
              <div className="text-center py-32 bg-muted/30 border border-border rounded-3xl">
                <div className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase mb-4">
                  暂无匹配的活动
                </div>
                <Button variant="link" onClick={clearFilters}>
                  清除筛选条件
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
