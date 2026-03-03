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
        <section className="py-32 bg-void relative overflow-hidden flex flex-col gap-16">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
                <div className="md:col-span-8" ref={textRef}>
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
                        &gt; 01. {lang === 'zh' ? 'AI 社区洞察' : 'AI Community Insights'} <br />
                        &gt; 02. {lang === 'zh' ? 'AI 智能组队' : 'AI Team Matchmaking'} <br />
                        &gt; 03. {lang === 'zh' ? 'AI 项目副驾驶' : 'AI Project Copilot'} <br />
                        &gt; 04. {lang === 'zh' ? 'AI 活动架构师' : 'AI Event Architect'}
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

// --- 2.5 Features Section (Based on WhitePaper) ---
export function Features({ lang }: { lang: 'zh' | 'en' }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".feature-item", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                },
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const featureData = [
        {
            title: lang === 'zh' ? '🤖 AI 深度赋能' : 'AI-Empowered',
            items: [
                { icon: '🔮', label: lang === 'zh' ? 'AI 社区洞察' : 'Community Insights', desc: lang === 'zh' ? '实时生成技能分布与趋势报告' : 'Real-time skill distribution and trend reports.' },
                { icon: '⚡', label: lang === 'zh' ? 'AI 智能组队' : 'AI Team Match', desc: lang === 'zh' ? '基于性格与技能的智能推荐' : 'Smart recommendations based on personality and skills.' },
                { icon: '✨', label: lang === 'zh' ? 'AI 项目副驾驶' : 'AI Project Copilot', desc: lang === 'zh' ? '辅助生成商业计划书与项目亮点' : 'Assist in generating BP and project highlights.' },
                { icon: '🏗️', label: lang === 'zh' ? 'AI 活动架构师' : 'AI Event Architect', desc: lang === 'zh' ? '一句话生成完整的活动策划案' : 'One sentence to generate full event plan.' }
            ]
        },
        {
            title: lang === 'zh' ? '🎯 面向全人群' : 'Target Audience',
            items: [
                { icon: '🏢', label: lang === 'zh' ? '组织者 (Organizer)' : 'Organizer', desc: lang === 'zh' ? '从繁杂事务中解脱，专注于运营' : 'Free from tedious tasks, focus on operations.' },
                { icon: '👨‍💻', label: lang === 'zh' ? '参赛者 (Participant)' : 'Participant', desc: lang === 'zh' ? '找到神队友，专注于创新本身' : 'Find great teammates, focus on innovation.' },
                { icon: '⚖️', label: lang === 'zh' ? '评委 (Judge)' : 'Judge', desc: lang === 'zh' ? '沉浸式评审，AI 辅助客观评分' : 'Immersive judging with AI-assisted scoring.' }
            ]
        }
    ];

    return (
        <section ref={containerRef} className="py-24 bg-void relative border-y border-brand/5">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {featureData.map((group, idx) => (
                        <div key={idx} className="space-y-8">
                            <h3 className="text-3xl font-black text-ink flex items-center gap-4">
                                <span className="w-1.5 h-8 bg-brand"></span>
                                {group.title}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {group.items.map((item, i) => (
                                    <div key={i} className="feature-item p-6 border border-white/5 bg-white/[0.02] hover:border-brand/30 hover:bg-white/[0.04] transition-all group">
                                        <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                        <h4 className="text-lg font-bold text-ink mb-2">{item.label}</h4>
                                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
        <footer className="w-full flex flex-col items-start pt-0 pb-6 gap-6 bg-surface border-t border-brand/10">
            {/* Divider */}
            <div className="w-full h-px bg-[#333333] self-stretch flex-none order-0" />

            {/* Container: Main Content */}
            <div className="w-full max-w-[1200px] mx-auto flex flex-row items-start gap-20 border-b border-[rgba(0,0,0,0.02)] pb-4 flex-none order-1 self-center">
                
                {/* Left Column: Logo & Description */}
                <div className="flex flex-col items-start gap-4 w-[709px] h-[172px] flex-none order-0 grow">
                    {/* Logo */}
                    <div className="flex flex-row items-center gap-2 w-[107px] h-[22px] flex-none order-0">
                        <div className="w-5 h-5 bg-white rounded flex-none order-0" />
                        <span className="w-[79px] h-[22px] font-[Inter] font-normal text-lg leading-[22px] text-white flex-none order-1">AURA</span>
                    </div>

                    {/* Description Paragraph */}
                    <div className="flex flex-col justify-center items-start py-[1px] gap-[10px] w-full h-12 flex-none order-1">
                        <p className="w-full h-[46px] font-[Inter] font-normal text-sm leading-[23px] tracking-[-0.15px] text-[#717182]">
                            {lang === 'zh' 
                                ? 'AURA 是一个自 AI 驱动的赛事协作平台发展问题，用更强' 
                                : 'AURA is an AI-driven competition collaboration platform for development issues, with stronger capabilities.'}
                        </p>
                    </div>

                    {/* QR Codes Container */}
                    <div className="flex flex-row items-start gap-4 w-full h-[70px] flex-none order-2">
                        {/* QR Code 1 */}
                        <div className="flex flex-row justify-center items-center w-[70px] h-[70px] bg-[rgba(236,236,240,0.1)] border border-[rgba(0,0,0,0.02)] rounded flex-none order-0 relative">
                            <span className="absolute top-[1px] left-0 w-9 h-4 font-[Inter] font-normal text-xs leading-4 text-[rgba(113,113,130,0.5)] transform translate-x-4 translate-y-6">
                                二维码
                            </span>
                        </div>
                        {/* QR Code 2 */}
                        <div className="flex flex-row justify-center items-center w-[70px] h-[70px] bg-[rgba(236,236,240,0.1)] border border-[rgba(0,0,0,0.02)] rounded flex-none order-1 relative">
                            <span className="absolute top-[1px] left-0 w-9 h-4 font-[Inter] font-normal text-xs leading-4 text-[rgba(113,113,130,0.5)] transform translate-x-4 translate-y-6">
                                二维码
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Links */}
                <div className="flex flex-row items-start gap-20 w-[410px] h-[172px] flex-none order-1">
                    
                    {/* Column 1: I want to host */}
                    <div className="flex flex-col items-start gap-4 w-[94px] h-[172px] flex-none order-0">
                        <h3 className="w-[94px] h-6 font-[Inter] font-medium text-base leading-6 tracking-[-0.31px] text-white flex-none order-0">
                            {lang === 'zh' ? '我要举办' : 'Host'}
                        </h3>
                        <div className="flex flex-col items-start gap-3 w-[94px] h-[132px] flex-none order-1">
                            <a href="#" className="w-[94px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '创建黑客松' : 'Create Hackathon'}
                            </a>
                            <a href="#" className="w-[94px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '寻求资源' : 'Resources'}
                            </a>
                            <a href="#" className="w-[94px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '组织者手册' : 'Organizer Guide'}
                            </a>
                            <a href="#" className="w-[94px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '如何办好黑客松' : 'Best Practices'}
                            </a>
                        </div>
                    </div>

                    {/* Column 2: I want to join */}
                    <div className="flex flex-col items-start gap-4 w-[67px] h-[136px] flex-none order-1">
                        <h3 className="w-[67px] h-6 font-[Inter] font-medium text-base leading-6 tracking-[-0.31px] text-white flex-none order-0">
                            {lang === 'zh' ? '我要参加' : 'Join'}
                        </h3>
                        <div className="flex flex-col items-start gap-3 w-[67px] h-[96px] flex-none order-1">
                            <a href="#" className="w-[67px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '探索黑客松' : 'Explore'}
                            </a>
                            <a href="#" className="w-[67px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '寻找队友' : 'Find Team'}
                            </a>
                            <a href="#" className="w-[67px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '参赛者手册' : 'Hacker Guide'}
                            </a>
                        </div>
                    </div>

                    {/* Column 3: More */}
                    <div className="flex flex-col items-start gap-4 w-[90px] h-[172px] flex-none order-2">
                        <h3 className="w-[90px] h-6 font-[Inter] font-medium text-base leading-6 tracking-[-0.31px] text-white flex-none order-0">
                            {lang === 'zh' ? '更多' : 'More'}
                        </h3>
                        <div className="flex flex-col items-start gap-3 w-[90px] h-[132px] flex-none order-1">
                            <a href="#" className="w-[90px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '关于 Aurathon' : 'About Aura'}
                            </a>
                            <a href="#" className="w-[90px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '合作沟通' : 'Contact'}
                            </a>
                            <a href="#" className="w-[90px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '隐私协议' : 'Privacy'}
                            </a>
                            <a href="#" className="w-[90px] h-6 font-[Inter] font-normal text-sm leading-5 tracking-[-0.15px] text-[#717182] hover:text-brand transition-colors">
                                {lang === 'zh' ? '服务条款' : 'Terms'}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[#333333] self-stretch flex-none order-2" />

            {/* Bottom Bar: ICP & Security */}
            <div className="w-full max-w-[1200px] mx-auto flex flex-row justify-center items-center gap-4 h-4 flex-none order-3">
                <span className="w-[107px] h-4 font-[Inter] font-normal text-xs leading-4 text-[rgba(113,113,130,0.7)] flex-none order-0">
                    ICP备 1234567890
                </span>
                <div className="w-px h-4 bg-[#333333] flex-none order-1" />
                <span className="w-[122px] h-4 font-[Inter] font-normal text-xs leading-4 text-[rgba(113,113,130,0.7)] flex-none order-2">
                    公网安备 1234567890
                </span>
                <div className="w-px h-4 bg-[#333333] flex-none order-3" />
                <span className="w-[122px] h-4 font-[Inter] font-normal text-xs leading-4 text-[rgba(113,113,130,0.7)] flex-none order-4">
                    © 2026 AURA
                </span>
            </div>
        </footer>
    );
}
