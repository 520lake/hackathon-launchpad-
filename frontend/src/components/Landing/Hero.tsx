import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface HeroProps {
    onCreateClick: () => void;
    onExploreClick: () => void;
    lang: 'zh' | 'en';
}

export default function Hero({ onCreateClick, onExploreClick, lang }: HeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);
    const subTextRef = useRef<HTMLParagraphElement>(null);
    const btnRef = useRef<HTMLDivElement>(null);

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
            .from(subTextRef.current, {
                y: 30,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
            }, "-=0.8")
            .from(btnRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
            }, "-=0.6");

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
                    ease: "power2.out"
                });
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden bg-void pt-20">
            {/* Background Texture Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand blur-[100px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-brand-dim blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="container mx-auto px-6 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Column: Content */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                    <div className="inline-block mb-6 px-4 py-1 border border-brand/30 text-brand text-xs font-mono tracking-[0.2em] uppercase bg-brand/5 backdrop-blur-sm">
                        System Online // v2.0.4
                    </div>
                    
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter glitch-text" data-text="BUILD THE FUTURE">
            BUILD THE FUTURE <span className="text-2xl text-brand">(v2.4 Logger Fix)</span>
          </h1>

                    <p ref={subTextRef} className="max-w-2xl text-xl md:text-2xl text-gray-400 font-light mb-12 leading-relaxed">
                        {lang === 'zh' ? (
                            <>
                                在 <span className="text-brand font-mono">噪音</span> 中寻找信号。<br/>
                                打造中国最大的开发者黑客松中心平台。
                            </>
                        ) : (
                            <>
                                Find the signal in the <span className="text-brand font-mono">NOISE</span>.<br/>
                                China's premier AI-driven hackathon platform.
                            </>
                        )}
                    </p>

                    <div ref={btnRef} className="flex flex-col sm:flex-row gap-6">
                        <button 
                            onClick={onCreateClick}
                            className="group relative px-8 py-4 bg-brand text-void font-bold text-lg overflow-hidden transition-all hover:bg-white clip-path-slant"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                [ {lang === 'zh' ? '发起行动' : 'INITIATE'} ]
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </span>
                        </button>
                        
                        <button 
                            onClick={onExploreClick}
                            className="group px-8 py-4 border border-white/20 text-ink font-mono text-lg hover:border-brand hover:text-brand transition-all"
                        >
                            {lang === 'zh' ? '探索网络' : 'EXPLORE_NETWORK'}
                        </button>
                    </div>

                    {/* Status Block (New Element) */}
                    <div className="mt-16 p-4 border-l-2 border-brand/30 bg-white/5 font-mono text-xs text-gray-500 max-w-md">
                        <div className="flex justify-between mb-2">
                            <span>NET_STATUS:</span>
                            <span className="text-green-500">ONLINE</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span>ACTIVE_NODES:</span>
                            <span>{Math.floor(Math.random() * 1000) + 400}</span>
                        </div>
                        <div className="text-brand/50 text-[10px]">
                            0x1f4a...8b2c &gt;&gt; NEW_BLOCK_FOUND
                        </div>
                    </div>
                </div>

                {/* Right Column: Visuals */}
                <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
                    <div className="relative w-full aspect-square max-w-lg">
                        {/* Decorative Rings - Enhanced */}
                        <div className="absolute inset-0 border border-brand/10 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-4 border border-brand/20 rounded-full animate-[spin_15s_linear_infinite_reverse] border-dashed" />
                        <div className="absolute inset-12 border border-white/5 rounded-full animate-[pulse_4s_ease-in-out_infinite]" />
                        <div className="absolute -inset-8 border border-brand/5 rounded-full animate-[spin_20s_linear_infinite]" />
                        
                        {/* Orbital Elements to fill space */}
                        <div className="absolute top-0 right-0 w-4 h-4 bg-brand/20 blur-sm animate-ping" style={{ animationDuration: '3s' }} />
                        <div className="absolute bottom-10 -right-4 w-2 h-24 bg-brand/10 rotate-45" />
                        <div className="absolute top-1/2 -right-12 w-24 h-24 border border-brand/10 rotate-12" />

                        {/* Center AI Text - Enhanced Background */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute -inset-8 bg-brand/5 blur-3xl rounded-full" />
                                <span className="relative text-9xl font-black text-white/10 select-none transform hover:scale-110 transition-transform duration-700 cursor-default tracking-tighter">
                                    AI
                                </span>
                                <div className="absolute top-0 -right-4 text-xs font-mono text-brand/40">v.NEXT</div>
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
