import { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import HackathonCard from "../components/HackathonCard";
import type { HackathonListItem, HackathonCardData } from "@/types/hackathon";
import { toHackathonCardData, formatLocation } from "@/utils/hackathon";
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

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
}

// Mock data used as a fallback when the API returns an empty list
const MOCK_DATA: HackathonCardData[] = [
  {
    id: "1",
    title: "Aurathon AI 创新黑客松 2026",
    hosts: [{ name: "Aurathon 官方" }],
    tags: [],
    status: "ongoing",
    dateRange: "2026.1.15 - 3.1",
    location: "线上",
    prizeText: "¥50万 + 非现金奖品",
  },
  {
    id: "2",
    title: "Web3 开发者挑战赛",
    hosts: [{ name: "Blockchain Labs" }],
    tags: [],
    status: "published",
    dateRange: "2026.3.1 - 3.15",
    location: "线上",
    prizeText: "¥20万",
  },
];

// Map Chinese format labels to backend enum values for filtering
const FORMAT_LABEL_TO_VALUE: Record<string, string> = {
  线下: "offline",
  线上: "online",
};

export default function EventsPage() {
  const navigate = useNavigate();
  useOutletContext<OutletContextType>();

  const [hackathons, setHackathons] = useState<HackathonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");

  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [locationFilters, setLocationFilters] = useState<Option[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/hackathons");
      setHackathons(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (data: HackathonCardData) => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(`/events/${data.id}`);
    }, 300);
  };

  // Derive unique location options from province / city values
  const allLocations: Option[] = useMemo(() => {
    const locationSet = new Set<string>();
    hackathons.forEach((h) => {
      const loc = formatLocation(h.province, h.city, h.district);
      if (loc !== "线上") locationSet.add(loc);
    });
    return [
      { value: "线上", label: "线上" },
      ...Array.from(locationSet).map((loc) => ({ value: loc, label: loc })),
    ];
  }, [hackathons]);

  // Filter + sort logic
  const filteredHackathons = useMemo(() => {
    const filtered = hackathons.filter((h) => {
      const matchesSearch =
        !searchQuery ||
        h.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(h.status);

      // typeFilters stores Chinese labels; convert to backend enum for comparison
      const matchesType =
        typeFilters.length === 0 ||
        typeFilters.some((label) => FORMAT_LABEL_TO_VALUE[label] === h.format);

      const matchesLocation =
        locationFilters.length === 0 ||
        locationFilters.some((f) => {
          const loc = formatLocation(h.province, h.city, h.district);
          return loc.includes(f.value) || f.value === loc;
        });

      return matchesSearch && matchesStatus && matchesType && matchesLocation;
    });

    const sorted = [...filtered];

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
    sortBy,
  ]);

  // Transform filtered hackathons into card data
  const cardDataList = useMemo(() => {
    if (filteredHackathons.length === 0 && !loading) {
      return MOCK_DATA;
    }
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    return filteredHackathons.map((h) =>
      toHackathonCardData(h, currentUser.id),
    );
  }, [filteredHackathons, loading]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilters([]);
    setTypeFilters([]);
    setLocationFilters([]);
  };

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
      {/* 页面头部 */}
      <div className="px-6 pt-10 pb-6">
        <div className="max-w-7xl mx-auto">
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

      {/* 左侧筛选 + 右侧活动列表 */}
      <div className="px-6 pb-12">
        <div className="max-w-7xl mx-auto flex gap-10">
          {/* 筛选侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8 rounded-2xl bg-[#050505] border border-[#262626] px-5 py-6">
              <div className="flex items-center justify-between mb-6 text-sm">
                <span className="font-medium text-white">筛选</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-xs text-muted-foreground hover:text-white transition-opacity ${
                    searchQuery ||
                    statusFilters.length > 0 ||
                    typeFilters.length > 0 ||
                    locationFilters.length > 0
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

              {/* 活动类型筛选 (online / offline) */}
              <div className="mb-6">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  活动类型
                </h3>
                <div className="space-y-2">
                  {["线下", "线上"].map((type) => {
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

              {/* 地点筛选 */}
              <div>
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
            </div>
          </div>

          {/* 活动列表区 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 gap-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                共 {cardDataList.length} 个结果
              </span>

              <div className="flex items-center gap-3">
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

            {/* 活动卡片列表 */}
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
