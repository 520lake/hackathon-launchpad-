import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import EcosystemWall from "./EcosystemWall";

// Shared hackathon types and utilities from the new section-based data model
import type { HackathonListItem } from "@/types/hackathon";
import { formatLocation } from "@/utils/hackathon";

gsap.registerPlugin(ScrollTrigger);

// --- 1. Latest Events (Bento Grid Layout) ---

export function LatestEvents({
  hackathons,
  onDetailClick,
  onViewAll,
}: {
  /** Array of hackathon list items from the list endpoint */
  hackathons: HackathonListItem[];
  onDetailClick: (id: number) => void;
  onViewAll: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".event-card", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  if (hackathons.length === 0) return null;

  const featured = hackathons[0];
  const others = hackathons.slice(1, 5);

  return (
    <section
      ref={containerRef}
      className="py-20 max-w-7xl mx-auto px-6 border-b border-border-base"
    >
      <div className="flex justify-between items-end mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-ink uppercase tracking-tight">
          <span className="text-brand mr-2">//</span>
          最新_信号
        </h2>
        <button
          onClick={onViewAll}
          className="group flex items-center gap-2 px-4 py-2 border border-brand text-brand font-mono text-sm hover:bg-brand hover:text-void transition-all duration-300 rounded-sm"
        >
          查看_全部_日志
          <span className="group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 md:gap-6 min-h-[500px]">
        {/* Featured Card - Spans 2 columns and 2 rows */}
        <div
          className="event-card md:col-span-2 md:row-span-2 card-brutal group relative overflow-hidden cursor-pointer bg-surface border border-border-base hover:border-brand/50 transition-all duration-300"
          onClick={() => onDetailClick(featured.id)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="h-full flex flex-col justify-end p-6 relative z-10">
            <div className="absolute top-4 left-4">
              <span className="bg-brand text-void text-xs font-bold px-3 py-1 rounded-sm">
                FEATURED
              </span>
            </div>
            <div className="mt-auto">
              <h3 className="text-2xl md:text-3xl font-bold text-ink mb-3 group-hover:text-brand transition-colors line-clamp-2">
                {featured.title}
              </h3>
              {/* Meta row: date, location, and status */}
              <div className="flex items-center gap-4 text-sm text-gray-500 font-mono">
                <span>
                  {new Date(featured.start_date).toLocaleDateString()}
                </span>
                <span>•</span>
                {/* Build a human-readable location from province/city/district,
                    falls back to "线上" when all are null */}
                <span>{formatLocation(featured.province, featured.city, featured.district)}</span>
                <span>•</span>
                <span
                  className={`${featured.status === "published" ? "text-green-400" : "text-gray-400"}`}
                >
                  {featured.status === "published"
                    ? "报名中"
                    : featured.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Cards */}
        {others.map((h) => (
          <div
            key={h.id}
            className="event-card card-brutal group relative overflow-hidden cursor-pointer bg-surface border border-border-base hover:border-brand/50 transition-colors duration-300"
            onClick={() => onDetailClick(h.id)}
          >
            <div className="h-full flex flex-col justify-between p-4">
              <div className="flex justify-between items-start">
                <span
                  className={`text-[10px] font-mono px-2 py-1 rounded-sm ${
                    h.status === "registration"
                      ? "bg-green-500/10 text-green-500"
                      : h.status === "ongoing"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {h.status.toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink mb-2 group-hover:text-brand transition-colors line-clamp-1">
                  {h.title}
                </h3>
                {/* Location line built from the new province/city/district fields */}
                <p className="text-gray-500 text-xs">
                  {formatLocation(h.province, h.city, h.district)}
                </p>
                <div className="mt-3 text-xs text-gray-600 font-mono">
                  {new Date(h.start_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- 2. About Section ---
export function About() {
  const textRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.from(textRef.current, {
      scrollTrigger: {
        trigger: textRef.current,
        start: "top 75%",
      },
      x: -50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });
  }, []);

  return (
    <section className="py-32 bg-void relative overflow-hidden flex flex-col gap-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
        <div className="md:col-span-8" ref={textRef}>
          <h2 className="text-5xl font-black mb-8 text-ink leading-tight">
            智能 <br />
            <span className="text-brand">创新</span>
          </h2>
          <p
            className="text-xl text-gray-400 mb-6 leading-relaxed max-w-2xl cursor-pointer hover:text-brand transition-colors"
            onClick={() => navigate("/")}
          >
            {
              "Aurathon 不是另一个竞赛平台。它是思想的粒子加速器。我们通过 AI 消除技术壁垒，让每一行代码都成为改变现实的杠杆。"
            }
          </p>
          <p className="text-lg text-gray-500 font-mono">
            &gt; 01. 智能匹配队友 <br />
            &gt; 02. AI 辅助开发 <br />
            &gt; 03. 自动化评审
          </p>
        </div>
      </div>

      {/* Full-width Ecosystem Wall - Replacing the static box */}
      <div className="w-full relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent"></div>
        <EcosystemWall />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent"></div>
      </div>
    </section>
  );
}

// --- 4. Schedule ---
export function Schedule() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <h2 className="text-3xl font-bold mb-16 text-center text-ink uppercase tracking-widest">
        活动_时间轴
      </h2>
      <div className="relative border-l border-brand/20 ml-6 md:ml-1/2 space-y-12">
        {[
          { date: "PHASE_01", title: "开放注册", desc: "全球开放访问" },
          { date: "PHASE_02", title: "组队阶段", desc: "AI 智能匹配" },
          { date: "PHASE_03", title: "开发冲刺", desc: "48小时极限编程" },
          { date: "PHASE_04", title: "评审阶段", desc: "系统自动化评分" },
        ].map((item, idx) => (
          <div key={idx} className="relative pl-8 md:pl-0">
            <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 bg-brand rounded-none rotate-45" />
            <div
              className={`md:flex items-center justify-between ${idx % 2 === 0 ? "md:flex-row-reverse" : ""} w-full`}
            >
              <div className="hidden md:block w-5/12" />
              <div className="md:w-5/12">
                <span className="font-mono text-brand text-xs mb-2 block">
                  {item.date}
                </span>
                <h3 className="text-xl font-bold text-ink mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
