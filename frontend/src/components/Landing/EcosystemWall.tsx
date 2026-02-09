import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// Mock Data for Testimonials (Chinese)
const TESTIMONIALS_ROW_1 = [
    { id: 1, name: "Sarah Connor", role: "组织者", quote: "Aura的AI匹配功能为我们节省了数周的团队组建时间。", color: "#D4A373" },
    { id: 2, name: "David Lightman", role: "黑客", quote: "编程环境超现实。感觉就像直接接入了矩阵。", color: "#4CAF50" },
    { id: 3, name: "Judge Dredd", role: "裁判", quote: "自动评分维度精确且公正。终于等到了。", color: "#FF5F5F" },
    { id: 4, name: "Weyland Corp", role: "赞助商", quote: "我们在一个周末内就找到了接下来的10位核心员工。", color: "#9C27B0" },
    { id: 5, name: "Case", role: "黑客", quote: "光是这个界面就让我编码速度飞起。纯粹的赛博朋克享受。", color: "#03A9F4" },
];

const TESTIMONIALS_ROW_2 = [
    { id: 6, name: "Molly Millions", role: "导师", quote: "看着团队在48小时内从混乱进化出产品简直是魔法。", color: "#E040FB" },
    { id: 7, name: "Flynn", role: "开发者", quote: "我从未见过如此理解黑客思维的平台。", color: "#FFC107" },
    { id: 8, name: "Tyrell Inc", role: "赞助商", quote: "这里产出的项目质量超出了所有预期。", color: "#795548" },
    { id: 9, name: "Deckard", role: "裁判", quote: "深度推理AI帮助我发现了提交作品中真正的宝石。", color: "#607D8B" },
    { id: 10, name: "Major Kusanagi", role: "组织者", quote: "无缝的后勤管理。系统基本上在自动运行。", color: "#FF5722" },
];

export default function EcosystemWall() {
    const containerRef = useRef<HTMLDivElement>(null);
    const track1Ref = useRef<HTMLDivElement>(null);
    const track2Ref = useRef<HTMLDivElement>(null);
    const tl1 = useRef<gsap.core.Tween | null>(null);
    const tl2 = useRef<gsap.core.Tween | null>(null);

    // Setup scrolling animations
    useEffect(() => {
        const setupScroll = (track: HTMLDivElement, direction: 'left' | 'right') => {
            const totalWidth = track.scrollWidth / 2; // We double the content, so half is one full set
            
            const tween = gsap.to(track, {
                x: direction === 'left' ? -totalWidth : 0, // Left goes -width, Right starts at -width and goes to 0
                startAt: { x: direction === 'left' ? 0 : -totalWidth },
                duration: 60, // Much slower speed
                ease: "none",
                repeat: -1,
                paused: false,
                modifiers: {
                    x: gsap.utils.unitize(x => parseFloat(x) % totalWidth)
                }
            });
            return tween;
        };

        if (track1Ref.current) tl1.current = setupScroll(track1Ref.current, 'left');
        if (track2Ref.current) tl2.current = setupScroll(track2Ref.current, 'right');

        return () => {
            tl1.current?.kill();
            tl2.current?.kill();
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            className="w-full relative overflow-hidden bg-void/50 border-y border-brand/10 py-16 flex flex-col gap-8"
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(212,163,115,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,163,115,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none opacity-20"></div>

            {/* Row 1: Scrolling Left */}
            <div 
                className="relative w-full overflow-hidden"
                onMouseEnter={() => tl1.current?.pause()}
                onMouseLeave={() => tl1.current?.play()}
            >
                <div 
                    ref={track1Ref}
                    className="flex items-center gap-6 w-max pl-6"
                >
                    {[...TESTIMONIALS_ROW_1, ...TESTIMONIALS_ROW_1, ...TESTIMONIALS_ROW_1].map((item, idx) => (
                        <TestimonialCard key={`r1-${item.id}-${idx}`} item={item} />
                    ))}
                </div>
            </div>

            {/* Row 2: Scrolling Right */}
            <div 
                className="relative w-full overflow-hidden"
                onMouseEnter={() => tl2.current?.pause()}
                onMouseLeave={() => tl2.current?.play()}
            >
                <div 
                    ref={track2Ref}
                    className="flex items-center gap-6 w-max pl-6"
                >
                    {[...TESTIMONIALS_ROW_2, ...TESTIMONIALS_ROW_2, ...TESTIMONIALS_ROW_2].map((item, idx) => (
                        <TestimonialCard key={`r2-${item.id}-${idx}`} item={item} />
                    ))}
                </div>
            </div>

            {/* Overlay Gradients */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-void to-transparent z-20 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-void to-transparent z-20 pointer-events-none"></div>
        </div>
    );
}

function TestimonialCard({ item }: { item: typeof TESTIMONIALS_ROW_1[0] }) {
    return (
        <div className="w-[400px] h-[220px] bg-surface border border-white/5 p-8 flex flex-col justify-between group hover:border-brand/30 transition-all duration-300 relative overflow-hidden">
            
            {/* Quote Content */}
            <div className="relative z-10">
                <p className="text-lg text-gray-300 font-sans leading-relaxed group-hover:text-white transition-colors">
                    "{item.quote}"
                </p>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4 relative z-10 mt-6 pt-6 border-t border-white/5">
                {/* Avatar Placeholder */}
                <div className="w-10 h-10 bg-black border border-white/10 flex items-center justify-center">
                    <span className="font-mono text-xs text-brand">{item.name[0]}</span>
                </div>
                
                <div>
                    <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">{item.name}</h4>
                    <span 
                        className="text-[10px] font-mono uppercase px-2 py-0.5 mt-1 inline-block bg-white/5 text-gray-400 border border-white/5 rounded-none"
                        style={{ borderColor: `${item.color}30`, color: item.color }}
                    >
                        {item.role}
                    </span>
                </div>
            </div>

            {/* Decorational Elements */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-brand/0 group-hover:border-brand/50 transition-colors"></div>
        </div>
    );
}
