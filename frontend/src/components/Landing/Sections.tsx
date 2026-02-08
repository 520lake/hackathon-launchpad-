import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FluidCursor from '../ui/FluidCursor';

gsap.registerPlugin(ScrollTrigger);

// --- 1. Latest Events ---
interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  status: string;
}

export function LatestEvents({ hackathons, onDetailClick, onViewAll, lang }: { hackathons: Hackathon[], onDetailClick: (id: number) => void, onViewAll: () => void, lang: 'zh' | 'en' }) {
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
        <section ref={containerRef} className="py-24 container mx-auto px-6 border-b border-brand/10">
            <div className="flex justify-between items-end mb-12">
                <h2 className="text-4xl font-black text-ink uppercase tracking-tight">
                    <span className="text-brand mr-2">//</span>
                    {lang === 'zh' ? '最新_信号' : 'Latest_Signals'}
                </h2>
                <button onClick={onViewAll} className="text-brand font-mono text-sm hover:underline underline-offset-4">
                    {lang === 'zh' ? '查看_全部_日志' : 'VIEW_ALL_LOGS'} &rarr;
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {hackathons.map((h) => (
                    <div key={h.id} className="event-card card-brutal group relative overflow-hidden cursor-pointer" onClick={() => onDetailClick(h.id)}>
                        <div className="h-48 bg-white/5 group-hover:bg-brand/10 transition-colors flex items-center justify-center relative overflow-hidden">
                             {/* Noise Texture on Card */}
                             <div className="absolute inset-0 opacity-10 bg-noise mix-blend-overlay" />
                             <span className="text-6xl font-black text-white/5 group-hover:text-brand/20 transition-colors">
                                {h.title.substring(0, 2).toUpperCase()}
                             </span>
                        </div>
                        <div className="p-6 relative">
                            <div className="absolute top-0 right-0 p-2">
                                <span className={`text-xs font-mono px-2 py-1 ${h.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}`}>
                                    {h.status.toUpperCase()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-brand transition-colors line-clamp-1">{h.title}</h3>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{h.description}</p>
                            <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                <span className="font-mono text-xs text-gray-600">{new Date(h.start_date).toLocaleDateString()}</span>
                                <button onClick={() => onDetailClick(h.id)} className="text-brand text-sm font-bold hover:translate-x-1 transition-transform">
                                    {lang === 'zh' ? '访问' : 'ACCESS'} &rarr;
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
export function About({ lang }: { lang: 'zh' | 'en' }) {
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
        <section className="py-32 bg-void relative overflow-hidden">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                <div className="md:col-span-7" ref={textRef}>
                    <h2 className="text-5xl font-black mb-8 text-ink leading-tight">
                        {lang === 'zh' ? '智能' : 'INTELLIGENT'} <br />
                        <span className="text-brand">{lang === 'zh' ? '创新' : 'INNOVATION'}</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-6 leading-relaxed max-w-2xl">
                        {lang === 'zh' ? 
                            'Aura 不是另一个竞赛平台。它是思想的粒子加速器。我们通过 AI 消除技术壁垒，让每一行代码都成为改变现实的杠杆。' : 
                            'Aura is not just another hackathon platform. It is a particle accelerator for ideas. We remove technical barriers through AI, making every line of code a lever to change reality.'}
                    </p>
                    <p className="text-lg text-gray-500 font-mono">
                        &gt; 01. {lang === 'zh' ? '智能匹配队友' : 'AI Matchmaking'} <br />
                        &gt; 02. {lang === 'zh' ? 'AI 辅助开发' : 'AI-Assisted Dev'} <br />
                        &gt; 03. {lang === 'zh' ? '自动化评审' : 'Auto Evaluation'}
                    </p>
                </div>
                <div className="md:col-span-5 relative">
                    {/* Abstract Graphic */}
                    <div className="w-full aspect-square border border-brand/20 relative rotate-3 bg-black overflow-hidden group">
                        <FluidCursor />
                        <div className="absolute inset-0 border border-brand/20 -rotate-6 scale-90 pointer-events-none" />
                        <div className="absolute inset-0 border border-brand/20 rotate-6 scale-95 pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay">
                            <span className="font-mono text-brand text-9xl font-black tracking-tighter opacity-80">AI</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- 3. Partners (Ticker) ---
export function Partners() {
    return (
        <section className="py-12 border-y border-brand/10 bg-surface/50 overflow-hidden">
             <div className="container mx-auto px-6 mb-8">
                <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Strategic_Partners //</span>
             </div>
             <div className="flex overflow-hidden whitespace-nowrap">
                <div className="animate-marquee flex gap-16 items-center">
                    {/* Repeat logos twice for seamless loop (simplified with text for now) */}
                    {[1,2,3,4,5,6,7,8].map((i) => (
                        <span key={i} className="text-2xl font-black text-gray-700 uppercase tracking-tighter">
                            PARTNER_ORG_{i}
                        </span>
                    ))}
                    {[1,2,3,4,5,6,7,8].map((i) => (
                        <span key={`dup-${i}`} className="text-2xl font-black text-gray-700 uppercase tracking-tighter">
                            PARTNER_ORG_{i}
                        </span>
                    ))}
                </div>
             </div>
        </section>
    );
}

// --- 4. Schedule ---
export function Schedule({ lang }: { lang: 'zh' | 'en' }) {
    return (
        <section className="py-24 container mx-auto px-6">
             <h2 className="text-3xl font-bold mb-16 text-center text-ink uppercase tracking-widest">
                {lang === 'zh' ? '活动_时间轴' : 'Event_Timeline'}
            </h2>
            <div className="relative border-l border-brand/20 ml-6 md:ml-1/2 space-y-12">
                {[
                    { date: "PHASE_01", title: lang === 'zh' ? '开放注册' : 'Registration', desc: lang === 'zh' ? '全球开放访问' : 'Open global access.' },
                    { date: "PHASE_02", title: lang === 'zh' ? '组队阶段' : 'Team Formation', desc: lang === 'zh' ? 'AI 智能匹配' : 'AI-assisted matching.' },
                    { date: "PHASE_03", title: lang === 'zh' ? '开发冲刺' : 'Development', desc: lang === 'zh' ? '48小时极限编程' : '48h coding sprint.' },
                    { date: "PHASE_04", title: lang === 'zh' ? '评审阶段' : 'Evaluation', desc: lang === 'zh' ? '系统自动化评分' : 'System automated scoring.' }
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

// --- 5. Footer ---
export function Footer({ lang }: { lang: 'zh' | 'en' }) {
    return (
        <footer className="bg-surface border-t border-brand/10 py-20">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                    <h2 className="text-4xl font-black text-ink mb-6">AURA</h2>
                    <p className="text-gray-500 max-w-sm">
                        {lang === 'zh' 
                            ? '通过算法透明度和智能协作重新定义黑客松格局。' 
                            : 'Redefining the hackathon landscape through algorithmic transparency and intelligent collaboration.'}
                    </p>
                </div>
                <div>
                    <h4 className="font-mono text-brand text-sm mb-6">{lang === 'zh' ? '链接' : 'LINKS'}</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><a href="#" className="hover:text-brand transition-colors">{lang === 'zh' ? '文档' : 'Documentation'}</a></li>
                        <li><a href="#" className="hover:text-brand transition-colors">{lang === 'zh' ? 'API 状态' : 'API Status'}</a></li>
                        <li><a href="#" className="hover:text-brand transition-colors">{lang === 'zh' ? '源代码' : 'Source Code'}</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-mono text-brand text-sm mb-6">{lang === 'zh' ? '法律' : 'LEGAL'}</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><a href="#" className="hover:text-brand transition-colors">{lang === 'zh' ? '隐私协议' : 'Privacy Protocol'}</a></li>
                        <li><a href="#" className="hover:text-brand transition-colors">{lang === 'zh' ? '服务条款' : 'Terms of Service'}</a></li>
                    </ul>
                </div>
            </div>
            <div className="container mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-xs font-mono text-gray-600">
                <span>© 2026 AURA NETWORK</span>
                <span>SYSTEM_STATUS: ONLINE [v1.0.2-fix]</span>
            </div>
        </footer>
    );
}
