import { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import HackathonCard, {
  type HackathonCardData,
} from "../components/HackathonCardV2";

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
  organizer_logo?: string;
  awards_detail?: string;
  organizer_id?: number;
}

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
}

// 图标组件
const SearchIcon = () => (
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
);

const ChevronDownIcon = () => (
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
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const XIcon = () => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return "待定";
  const date = new Date(dateStr);
  return date
    .toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace("/", ".");
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
    host: { name: "Aurathon 官方", logo: "" },
    tags: ["AI", "机器学习", "创新赛"],
    status: "ongoing",
    dateRange: "2026.01.15 - 2026.03.01",
    location: "线上 + 上海市",
    prizeText: "¥ 50万 + GPU 算力支持 + 投资机会",
  },
  {
    id: "2",
    title: "Web3 开发者挑战赛",
    description:
      "聚焦区块链、DeFi、NFT 等前沿技术，连接开发者与资本，打造下一代 Web3 应用。",
    host: { name: "Blockchain Labs", logo: "" },
    tags: ["Web3", "区块链", "DeFi"],
    status: "published",
    dateRange: "2026.03.01 - 2026.03.15",
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
  const [locationFilter, setLocationFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
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
      host: {
        name: hackathon.organizer_name || "未知主办方",
        logo: hackathon.organizer_logo,
      },
      tags:
        hackathon.theme_tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3) || [],
      status: hackathon.status,
      dateRange: `${formatDate(hackathon.start_date)} - ${formatDate(hackathon.end_date)}`,
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
  const allTags = useMemo(
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
      ),
    [hackathons],
  );

  const allLocations = useMemo(
    () =>
      Array.from(
        new Set(hackathons.map((h) => h.location).filter(Boolean) as string[]),
      ),
    [hackathons],
  );

  // 筛选逻辑
  const filteredHackathons = useMemo(() => {
    return hackathons.filter((h) => {
      const matchesSearch =
        !searchQuery ||
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(h.status);
      const matchesType =
        typeFilters.length === 0 || typeFilters.includes(h.format || "offline");
      const matchesLocation =
        !locationFilter || h.location?.includes(locationFilter);
      const matchesTag = !tagFilter || h.theme_tags?.includes(tagFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesLocation &&
        matchesTag
      );
    });
  }, [
    hackathons,
    searchQuery,
    statusFilters,
    typeFilters,
    locationFilter,
    tagFilter,
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
    setLocationFilter("");
    setTagFilter("");
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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* 页面头部 */}
      <div className="px-8 pt-8 pb-6">
        {/* 返回导航 */}
        <div className="flex items-center gap-4 mb-6">
          <button
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
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-[#FBBF24] text-sm font-bold tracking-wide px-2 py-1 bg-[#FBBF24]/5 rounded-md">
            探索网络
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-[#FBBF24] font-mono">//</span>
          探索网络
        </h1>
        <p className="text-gray-500">浏览并筛选所有黑客松活动</p>
      </div>

      {/* 主视图结构 */}
      <div className="flex gap-10 px-8 pb-12">
        {/* 左侧筛选侧边栏 */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-6">
            {/* 筛选标题 */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">筛选</span>
              {(statusFilters.length > 0 || locationFilter || tagFilter) && (
                <button
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* 状态筛选 */}
            <div className="mb-6">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                状态
              </h3>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        statusFilters.includes(option.value)
                          ? `${option.bgColor} ${option.borderColor}`
                          : "border-gray-600 group-hover:border-gray-500"
                      }`}
                    >
                      {statusFilters.includes(option.value) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm px-2 py-0.5 rounded-full ${
                        statusFilters.includes(option.value)
                          ? `${option.textColor} ${option.bgLight}`
                          : "text-gray-400"
                      }`}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 活动类型筛选 */}
            <div className="mb-6">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                活动类型
              </h3>
              <div className="space-y-2">
                {["线下", "线上", "混合"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        typeFilters.includes(type)
                          ? "bg-purple-500 border-purple-500"
                          : "border-gray-600 group-hover:border-gray-500"
                      }`}
                    >
                      {typeFilters.includes(type) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 地点下拉 */}
            <div className="mb-6">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                地点
              </h3>
              <div className="relative">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] rounded-lg px-4 py-2.5 text-sm text-white appearance-none focus:border-[#FBBF24]/50 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">选择地点</option>
                  {allLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            {/* 标签下拉 */}
            <div>
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                标签
              </h3>
              <div className="relative">
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full bg-[#111111] border border-[#222222] rounded-lg px-4 py-2.5 text-sm text-white appearance-none focus:border-[#FBBF24]/50 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">选择标签</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧活动列表区 */}
        <div className="flex-1 min-w-0">
          {/* 顶部控制条 */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-500 text-sm">
              {loading ? "加载中..." : `共 ${cardDataList.length} 个结果`}
            </span>
            <div className="flex items-center gap-4">
              {/* 搜索框 */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索黑客松..."
                  className="w-56 bg-[#111111] border border-[#222222] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#FBBF24]/50 focus:outline-none transition-colors"
                />
              </div>
              {/* 排序下拉 */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-32 bg-[#111111] border border-[#222222] rounded-lg px-4 py-2.5 text-sm text-white appearance-none focus:border-[#FBBF24]/50 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="all">全部活动</option>
                  <option value="recommended">为你推荐</option>
                  <option value="latest">最新发布</option>
                  <option value="deadline">即将截止</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
          </div>

          {/* 页面切换加载遮罩 */}
          {isNavigating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-3 border-[#FBBF24] border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400 text-sm">加载中...</span>
              </div>
            </motion.div>
          )}

          {/* 活动卡片列表 - 使用新组件 */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-5 animate-pulse"
                >
                  <div className="flex gap-5">
                    <div className="w-32 h-32 bg-white/[0.05] rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-3 py-2">
                      <div className="flex gap-2">
                        <div className="w-16 h-5 bg-white/[0.05] rounded" />
                        <div className="w-16 h-5 bg-white/[0.05] rounded" />
                      </div>
                      <div className="w-2/3 h-6 bg-white/[0.05] rounded" />
                      <div className="w-full h-4 bg-white/[0.05] rounded" />
                    </div>
                    <div className="w-48 space-y-3 py-2">
                      <div className="w-20 h-6 bg-white/[0.05] rounded-full ml-auto" />
                      <div className="w-full h-4 bg-white/[0.05] rounded" />
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
            <div className="text-center py-32 bg-white/[0.02] border border-white/[0.08] rounded-3xl">
              <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase mb-4">
                暂无匹配的活动
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-[#FBBF24] hover:text-white transition-colors duration-200"
              >
                清除筛选条件
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
