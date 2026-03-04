import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EcosystemWall from './EcosystemWall';

gsap.registerPlugin(ScrollTrigger);

// --- 1. Latest Events ---
interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  status: string;
}

export function LatestEvents({ hackathons, onDetailClick, onViewAll }: { hackathons: Hackathon[], onDetailClick: (id: number) => void, onViewAll: () => void }) {
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
                stagger: 0.2,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    if (hackathons.length === 0) return null;

    return (
        <section ref={containerRef} className="py-24 container mx-auto px-6 border-b border-border-base">
            <div className="flex justify-between items-end mb-12">
                <h2 className="text-4xl font-black text-ink uppercase tracking-tight">
                    <span className="text-brand mr-2">//</span>
                    最新_信号
                </h2>
                <button onClick={onViewAll} className="group flex items-center gap-2 px-4 py-2 border border-brand text-brand font-mono text-sm hover:bg-brand hover:text-void transition-all duration-300 rounded-sm">
                    查看_全部_日志
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {hackathons.map((h) => (
                    <div key={h.id} className="event-card card-brutal group relative overflow-hidden cursor-pointer bg-surface border border-border-base hover:border-brand/50 transition-colors duration-300" onClick={() => onDetailClick(h.id)}>
                        <div className="h-48 bg-ink/5 group-hover:bg-brand/10 transition-colors flex items-center justify-center relative overflow-hidden border-b border-border-base">
                             {/* Noise Texture on Card */}
                             <div className="absolute inset-0 opacity-10 bg-noise mix-blend-overlay" />
                             <span className="text-6xl font-black text-ink/5 group-hover:text-brand/20 transition-colors select-none">
                                {h.title.substring(0, 2).toUpperCase()}
                             </span>
                        </div>
                        <div className="p-6 relative">
                            <div className="absolute top-0 right-0 p-2">
                                <span className={`text-xs font-mono px-2 py-1 rounded-sm ${h.status === 'online' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-ink/5 text-ink-dim border border-border-base'}`}>
                                    {h.status.toUpperCase()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-brand transition-colors line-clamp-1">{h.title}</h3>
                            <p className="text-ink-dim text-sm mb-6 line-clamp-2 h-10 leading-relaxed">{h.description}</p>
                            <div className="flex justify-between items-center border-t border-border-base pt-4">
                                <span className="font-mono text-xs text-ink-dim">{new Date(h.start_date).toLocaleDateString()}</span>
                                <button onClick={() => onDetailClick(h.id)} className="text-brand text-sm font-bold hover:translate-x-1 transition-transform flex items-center gap-1">
                                    访问 &rarr;
                                </button>
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

    useEffect(() => {
        gsap.from(textRef.current, {
            scrollTrigger: {
                trigger: textRef.current,
                start: "top 75%",
            },
            x: -50,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    }, []);

    return (
        <section className="py-32 bg-void relative overflow-hidden flex flex-col gap-16">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
                <div className="md:col-span-8" ref={textRef}>
                    <h2 className="text-5xl font-black mb-8 text-ink leading-tight">
                        智能 <br />
                        <span className="text-brand">创新</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-6 leading-relaxed max-w-2xl">
                        {'Aurathon 不是另一个竞赛平台。它是思想的粒子加速器。我们通过 AI 消除技术壁垒，让每一行代码都成为改变现实的杠杆。'}
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
        <section className="py-24 container mx-auto px-6">
             <h2 className="text-3xl font-bold mb-16 text-center text-ink uppercase tracking-widest">
                活动_时间轴
            </h2>
            <div className="relative border-l border-brand/20 ml-6 md:ml-1/2 space-y-12">
                {[
                    { date: "PHASE_01", title: '开放注册', desc: '全球开放访问' },
                    { date: "PHASE_02", title: '组队阶段', desc: 'AI 智能匹配' },
                    { date: "PHASE_03", title: '开发冲刺', desc: '48小时极限编程' },
                    { date: "PHASE_04", title: '评审阶段', desc: '系统自动化评分' }
                ].map((item, idx) => (
                    <div key={idx} className="relative pl-8 md:pl-0">
                        <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 bg-brand rounded-none rotate-45" />
                        <div className={`md:flex items-center justify-between ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''} w-full`}>
                            <div className="hidden md:block w-5/12" />
                            <div className="md:w-5/12">
                                <span className="font-mono text-brand text-xs mb-2 block">{item.date}</span>
                                <h3 className="text-xl font-bold text-ink mb-2">{item.title}</h3>
                                <p className="text-gray-500 text-sm">{item.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}


