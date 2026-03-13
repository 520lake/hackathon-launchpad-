import { useEffect, useRef } from "react";
import gsap from "gsap";

interface HeroProps {
  onCreateClick: () => void;
  onExploreClick: () => void;
  onAIGuideClick?: () => void;
  onCommunityClick?: () => void;
}

export default function Hero({
  onCreateClick,
  onExploreClick,
  onCommunityClick,
}: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const subTextRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(textRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        skewY: 7,
      })
        .from(
          subTextRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
          },
          "-=0.8",
        )
        .from(
          btnRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.6",
        )
        .from(
          (cardsRef.current as HTMLDivElement)?.children || [],
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
          },
          "-=0.4",
        );

      // Mouse Parallax
      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 20;
        const y = (clientY / window.innerHeight - 0.5) * 20;

        gsap.to(textRef.current, {
          x: x,
          y: y,
          duration: 1,
          ease: "power2.out",
        });
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden bg-void pt-24 lg:pt-20"
    >
      {/* Background Texture Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand blur-[100px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-brand-dim blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Content */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <h1
            ref={textRef}
            className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 lg:mb-6 tracking-tighter text-ink italic leading-tight"
          >
            AI <span className="text-brand">EMPOWERED</span> HACKATHONS
          </h1>

          <p
            ref={subTextRef}
            className="max-w-2xl text-sm sm:text-base lg:text-lg text-ink-dim font-mono mb-6 lg:mb-8 leading-relaxed"
          >
            {"为组织者、参与者、评委及赞助商打造的一站式全链路智能黑客松平台。"}
          </p>

          <div
            ref={btnRef}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 lg:mb-12 w-full sm:w-auto"
          >
            <button
              onClick={onCreateClick}
              className="group relative px-6 sm:px-8 py-3.5 sm:py-4 bg-brand text-void font-bold text-sm sm:text-base overflow-hidden transition-all hover:bg-ink hover:text-void rounded-[16px] flex justify-center items-center flex-1 sm:flex-none"
            >
              <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                发起活动
              </span>
            </button>

            <button
              onClick={onExploreClick}
              className="group px-6 sm:px-8 py-3.5 sm:py-4 border border-ink/20 text-ink font-mono text-sm sm:text-base hover:border-brand hover:text-brand transition-all flex justify-center items-center whitespace-nowrap bg-ink/5 backdrop-blur-sm rounded-[16px] flex-1 sm:flex-none"
            >
              <svg
                className="w-5 h-5 mr-2"
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
              探索活动
            </button>

            <button
              onClick={onCommunityClick}
              className="group px-6 sm:px-8 py-3.5 sm:py-4 border border-purple-500/30 text-purple-400 font-mono text-sm sm:text-base hover:border-purple-500 hover:text-purple-300 hover:bg-purple-500/10 transition-all flex justify-center items-center whitespace-nowrap bg-purple-500/5 backdrop-blur-sm rounded-[16px] flex-1 sm:flex-none"
            >
              <svg
                className="w-5 h-5 mr-2"
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
              社区大厅
            </button>
          </div>

          {/* Role Cards */}
          <div
            ref={cardsRef}
            className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl"
          >
            {/* Organizer */}
            <div className="group p-3 sm:p-4 border border-brand/20 bg-surface/60 backdrop-blur-sm hover:bg-brand hover:text-void transition-all duration-300 relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-xl sm:text-3xl group-hover:opacity-20 transition-opacity">
                🏗️
              </div>
              <h3 className="font-bold font-mono text-xs sm:text-sm mb-1 text-brand group-hover:text-void uppercase">
                组织者
              </h3>
              <p className="text-[10px] text-ink-dim group-hover:text-void/70 font-mono leading-tight">
                AI 辅助策划
                <br />
                一键发布
              </p>
            </div>

            {/* Participant */}
            <div className="group p-3 sm:p-4 border border-brand/20 bg-surface/60 backdrop-blur-sm hover:bg-brand hover:text-void transition-all duration-300 relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-xl sm:text-3xl group-hover:opacity-20 transition-opacity">
                🚀
              </div>
              <h3 className="font-bold font-mono text-xs sm:text-sm mb-1 text-brand group-hover:text-void uppercase">
                参与者
              </h3>
              <p className="text-[10px] text-ink-dim group-hover:text-void/70 font-mono leading-tight">
                AI 简历
                <br />
                智能组队
              </p>
            </div>

            {/* Judge */}
            <div className="group p-3 sm:p-4 border border-brand/20 bg-surface/60 backdrop-blur-sm hover:bg-brand hover:text-void transition-all duration-300 relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-xl sm:text-3xl group-hover:opacity-20 transition-opacity">
                ⚖️
              </div>
              <h3 className="font-bold font-mono text-xs sm:text-sm mb-1 text-brand group-hover:text-void uppercase">
                评委
              </h3>
              <p className="text-[10px] text-ink-dim group-hover:text-void/70 font-mono leading-tight">
                智能评分
                <br />
                公平公正
              </p>
            </div>

            {/* Sponsor */}
            <div className="group p-3 sm:p-4 border border-brand/20 bg-surface/60 backdrop-blur-sm hover:bg-brand hover:text-void transition-all duration-300 relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-xl sm:text-3xl group-hover:opacity-20 transition-opacity">
                💎
              </div>
              <h3 className="font-bold font-mono text-xs sm:text-sm mb-1 text-brand group-hover:text-void uppercase">
                赞助商
              </h3>
              <p className="text-[10px] text-ink-dim group-hover:text-void/70 font-mono leading-tight">
                品牌曝光
                <br />
                人才发掘
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Visuals - Mobile Hidden or Adjusted */}
        <div className="hidden lg:flex lg:col-span-5 relative justify-center lg:justify-end">
          <div className="relative w-full aspect-square max-w-lg">
            {/* Decorative Rings - Enhanced */}
            <div className="absolute inset-0 border border-brand/10 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-4 border border-brand/20 rounded-full animate-[spin_15s_linear_infinite_reverse] border-dashed" />
            <div className="absolute inset-12 border border-ink/5 rounded-full animate-[pulse_4s_ease-in-out_infinite]" />
            <div className="absolute -inset-8 border border-brand/5 rounded-full animate-[spin_20s_linear_infinite]" />

            {/* Orbital Elements to fill space */}
            <div
              className="absolute top-0 right-0 w-4 h-4 bg-brand/20 blur-sm animate-ping"
              style={{ animationDuration: "3s" }}
            />
            <div className="absolute bottom-10 -right-4 w-2 h-24 bg-brand/10 rotate-45" />
            <div className="absolute top-1/2 -right-12 w-24 h-24 border border-brand/10 rotate-12" />

            {/* Center AI Text - Enhanced Background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-8 bg-brand/5 blur-3xl rounded-full" />
                <span className="relative text-9xl font-black text-ink/10 select-none transform hover:scale-110 transition-transform duration-700 cursor-default tracking-tighter">
                  AI
                </span>
                <div className="absolute top-0 -right-4 text-xs font-mono text-brand/40">
                  v.NEXT
                </div>
              </div>
            </div>

            {/* Floating Elements - Asymmetric Data Stream */}
            <div className="absolute top-1/4 -right-8 w-48 h-px bg-gradient-to-l from-brand/50 to-transparent" />
            <div className="absolute bottom-1/3 -left-8 w-32 h-px bg-gradient-to-r from-brand/30 to-transparent" />

            {/* Code Block Decoration */}
            <div className="absolute bottom-0 right-0 p-4 font-mono text-[10px] text-brand/30 leading-tight hidden md:block">
              <div>01010011 01011001 01010011</div>
              <div>01010100 01000101 01001101</div>
              <div className="text-brand/50">&gt; INITIALIZING_CORE...</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
