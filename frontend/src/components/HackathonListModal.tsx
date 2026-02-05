import { useState, useEffect } from "react";
import axios from "axios";

interface Hackathon {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  start_date: string;
  end_date: string;
  status: string;
  organizer_id: number;
}

interface HackathonListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHackathonSelect: (id: number) => void;
  lang: "zh" | "en";
  /** When true, renders as a full page (no overlay) with a back link. Used for /explore route. */
  asPage?: boolean;
}

export default function HackathonListModal({
  isOpen,
  onClose,
  onHackathonSelect,
  lang,
  asPage,
}: HackathonListModalProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("hot");

  useEffect(() => {
    if (isOpen || asPage) {
      fetchHackathons();
    }
  }, [isOpen, asPage]);

  useEffect(() => {
    let result = [...hackathons];

    // Filter
    if (statusFilter !== "all") {
      result = result.filter((h) => h.status === statusFilter);
    }
    if (themeFilter) {
      result = result.filter((h) =>
        h.theme_tags?.toLowerCase().includes(themeFilter.toLowerCase())
      );
    }
    if (levelFilter) {
      result = result.filter((h) =>
        h.professionalism_tags
          ?.toLowerCase()
          .includes(levelFilter.toLowerCase())
      );
    }

    // Sort
    if (sortOrder === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
    } else if (sortOrder === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    } else if (sortOrder === "hot") {
      // Prioritize ONGOING, then PUBLISHED, then others
      // Within same status, sort by start_date newest
      const statusPriority: { [key: string]: number } = {
        ongoing: 3,
        published: 2,
        ended: 1,
        draft: 0,
      };
      result.sort((a, b) => {
        const pA = statusPriority[a.status] || 0;
        const pB = statusPriority[b.status] || 0;
        if (pA !== pB) return pB - pA;
        return (
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      });
    }

    setFilteredHackathons(result);
  }, [hackathons, statusFilter, themeFilter, levelFilter, sortOrder]);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/hackathons");
      setHackathons(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !asPage) return null;

  // Page layout: no card/modal chrome; content constrained to 1200px like Hackathon Detail and SiteFooter.
  if (asPage) {
    return (
      <main className="min-h-screen bg-void pt-20 pb-16">
        <div className="max-w-[1200px] mx-auto w-full">
          {/* Page header: title (same style as other site sections) */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-ink tracking-tighter">
              <span className="text-brand font-mono">//</span>{" "}
              {lang === "zh" ? "探索网络" : "EXPLORE NETWORK"}
            </h1>
            <p className="mt-2 text-gray-400 font-light max-w-2xl">
              {lang === "zh"
                ? "浏览并筛选所有黑客松活动。"
                : "Browse and filter all hackathon events."}
            </p>
          </div>

          {/* Filters: toolbar style, no card border */}
          <div className="flex flex-wrap gap-4 items-center mb-10 pb-6 divider-b">
            <select
              className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all" className="bg-surface text-ink">
                {lang === "zh" ? "所有状态" : "ALL STATUS"}
              </option>
              <option value="published" className="bg-surface text-ink">
                {lang === "zh" ? "已发布" : "PUBLISHED"}
              </option>
              <option value="ongoing" className="bg-surface text-ink">
                {lang === "zh" ? "进行中" : "ONGOING"}
              </option>
              <option value="ended" className="bg-surface text-ink">
                {lang === "zh" ? "已结束" : "ENDED"}
              </option>
            </select>
            <input
              type="text"
              placeholder={
                lang === "zh" ? "筛选主题 [例如: AI]" : "Filter theme [e.g. AI]"
              }
              className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm w-48 placeholder-gray-400"
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder={lang === "zh" ? "筛选等级" : "Filter level"}
              className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm w-40 placeholder-gray-400"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            />
            <select
              className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm ml-auto"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="hot" className="bg-surface text-ink">
                {lang === "zh" ? "热度排序" : "HOT"}
              </option>
              <option value="newest" className="bg-surface text-ink">
                {lang === "zh" ? "最新发布" : "NEWEST"}
              </option>
              <option value="oldest" className="bg-surface text-ink">
                {lang === "zh" ? "最早发布" : "OLDEST"}
              </option>
            </select>
          </div>

          {/* Content: grid only, no card wrapper */}
          {loading ? (
            <div className="text-center py-24">
              <div className="font-mono text-brand animate-pulse">
                {lang === "zh" ? "正在加载数据..." : "Loading..."}
              </div>
            </div>
          ) : filteredHackathons.length === 0 ? (
            <div className="text-center py-24 text-gray-500 font-mono">
              <p className="text-lg">
                {lang === "zh" ? "未发现活动信号。" : "No events found."}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredHackathons.map((hackathon) => (
                <article
                  key={hackathon.id}
                  role="button"
                  tabIndex={0}
                  className="group bg-white/[0.02] border border-white/10 hover:border-brand/50 transition-colors cursor-pointer flex flex-col relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={() => {
                    onHackathonSelect(hackathon.id);
                    // When asPage, we navigate to /hackathon/:id — do not call onClose() or we'd go to homepage.
                    if (!asPage) onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onHackathonSelect(hackathon.id);
                      if (!asPage) onClose();
                    }
                  }}
                >
                  <div className="h-44 bg-white/5 relative overflow-hidden flex items-center justify-center">
                    {hackathon.cover_image ? (
                      <img
                        src={hackathon.cover_image}
                        alt=""
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-noise opacity-20" />
                    )}
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                        hackathon.status === "published"
                          ? "border-green-500 text-green-500"
                          : hackathon.status === "ongoing"
                          ? "border-brand text-brand"
                          : hackathon.status === "ended"
                          ? "border-gray-500 text-gray-500"
                          : "border-yellow-500 text-yellow-500"
                      }`}
                    >
                      {hackathon.status === "published"
                        ? lang === "zh"
                          ? "已发布"
                          : "PUBLISHED"
                        : hackathon.status === "ongoing"
                        ? lang === "zh"
                          ? "进行中"
                          : "ONGOING"
                        : hackathon.status === "ended"
                        ? lang === "zh"
                          ? "已结束"
                          : "ENDED"
                        : lang === "zh"
                        ? "草稿"
                        : "DRAFT"}
                    </span>
                    {!hackathon.cover_image && (
                      <span
                        className="absolute text-6xl font-black text-white/5 group-hover:text-brand/20 transition-colors select-none"
                        aria-hidden
                      >
                        {hackathon.title.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {hackathon.theme_tags
                        ?.split(",")
                        .slice(0, 2)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1 py-0.5 border border-brand/30 text-brand/80 font-mono uppercase"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                    <h2 className="text-xl font-bold text-ink mb-2 line-clamp-1 group-hover:text-brand transition-colors">
                      {hackathon.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1 font-light">
                      {hackathon.description}
                    </p>
                    <div className="pt-4 divider-t mt-auto flex justify-between items-center text-xs font-mono text-gray-500">
                      <span>
                        {new Date(hackathon.start_date).toLocaleDateString()}
                      </span>
                      <span className="group-hover:text-brand transition-colors">
                        {lang === "zh" ? "查看详情 →" : "View details →"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Modal layout: overlay + card (unchanged)
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="flex items-center justify-center p-4 w-full">
        <div className="bg-surface border border-brand/20 card-brutal w-full max-w-6xl p-0 relative transform transition-all h-[90vh] flex flex-col">
          <div className="p-6 divider-b flex justify-between items-center bg-surface/50 z-10">
            <h2 className="text-3xl font-black text-ink tracking-tighter uppercase">
              <span className="text-brand mr-2">//</span>
              {lang === "zh" ? "探索网络" : "EXPLORE NETWORK"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-brand text-xl"
              type="button"
            >
              ✕
            </button>
          </div>
          <div className="p-4 bg-void divider-b flex flex-wrap gap-4 items-center">
            <select
              className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all" className="bg-surface text-ink">
                所有状态
              </option>
              <option value="published" className="bg-surface text-ink">
                已发布
              </option>
              <option value="ongoing" className="bg-surface text-ink">
                进行中
              </option>
              <option value="ended" className="bg-surface text-ink">
                已结束
              </option>
            </select>
            <input
              type="text"
              placeholder="筛选主题 [例如: AI]"
              className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm w-48 placeholder-gray-400"
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder="筛选等级"
              className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm w-40 placeholder-gray-400"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            />
            <select
              className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm ml-auto"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="hot" className="bg-surface text-ink">
                热度排序
              </option>
              <option value="newest" className="bg-surface text-ink">
                最新发布
              </option>
              <option value="oldest" className="bg-surface text-ink">
                最早发布
              </option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-surface/50">
            {loading ? (
              <div className="text-center py-20">
                <div className="font-mono text-brand animate-pulse">
                  正在加载数据...
                </div>
              </div>
            ) : filteredHackathons.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-mono">
                <p className="text-lg">未发现活动信号。</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredHackathons.map((hackathon) => (
                  <div
                    key={hackathon.id}
                    className="group bg-void border border-brand/20 hover:border-brand transition-colors cursor-pointer flex flex-col relative overflow-hidden"
                    onClick={() => {
                      onHackathonSelect(hackathon.id);
                      onClose();
                    }}
                  >
                    <div className="h-40 bg-white/5 relative overflow-hidden flex items-center justify-center">
                      {hackathon.cover_image ? (
                        <img
                          src={hackathon.cover_image}
                          alt={hackathon.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-noise opacity-20" />
                      )}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                            hackathon.status === "published"
                              ? "border-green-500 text-green-500"
                              : hackathon.status === "ongoing"
                              ? "border-brand text-brand"
                              : hackathon.status === "ended"
                              ? "border-gray-500 text-gray-500"
                              : "border-yellow-500 text-yellow-500"
                          }`}
                        >
                          {hackathon.status === "published"
                            ? lang === "zh"
                              ? "已发布"
                              : "PUBLISHED"
                            : hackathon.status === "ongoing"
                            ? lang === "zh"
                              ? "进行中"
                              : "ONGOING"
                            : hackathon.status === "ended"
                            ? lang === "zh"
                              ? "已结束"
                              : "ENDED"
                            : lang === "zh"
                            ? "草稿"
                            : "DRAFT"}
                        </span>
                      </div>
                      {!hackathon.cover_image && (
                        <span className="absolute text-6xl font-black text-white/5 group-hover:text-brand/20 transition-colors select-none">
                          {hackathon.title.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {hackathon.theme_tags
                          ?.split(",")
                          .slice(0, 2)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1 py-0.5 border border-brand/30 text-brand/80 font-mono uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                      <h3 className="text-xl font-bold text-ink mb-2 line-clamp-1 group-hover:text-brand transition-colors">
                        {hackathon.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-1 font-light">
                        {hackathon.description}
                      </p>
                      <div className="pt-4 divider-t mt-auto">
                        <div className="flex justify-between items-center text-xs font-mono text-gray-500">
                          <span>
                            日期:{" "}
                            {new Date(
                              hackathon.start_date
                            ).toLocaleDateString()}
                          </span>
                          <span className="group-hover:text-brand transition-colors">
                            访问终端 &gt;&gt;
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
