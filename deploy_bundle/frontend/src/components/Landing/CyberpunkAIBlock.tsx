import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CyberpunkAIBlock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [randomChars, setRandomChars] = useState('');

  // Generate random data stream
  useEffect(() => {
    const chars = 'ABCDEF0123456789';
    const interval = setInterval(() => {
      let str = '';
      for (let i = 0; i < 4; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
        str += ' ';
      }
      setRandomChars(str);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(container, {
        rotationX: rotateX,
        rotationY: rotateY,
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 1000,
        transformStyle: "preserve-3d"
      });

      // Move grid opposite to mouse for depth
      gsap.to(gridRef.current, {
        x: (x - centerX) * -0.05,
        y: (y - centerY) * -0.05,
        duration: 0.5
      });
    };

    const handleMouseLeave = () => {
      gsap.to(container, {
        rotationX: 0,
        rotationY: 0,
        duration: 1,
        ease: 'elastic.out(1, 0.5)'
      });
      gsap.to(gridRef.current, { x: 0, y: 0, duration: 1 });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="w-full aspect-square relative flex items-center justify-center p-8 group perspective-1000">
        {/* Main Card Container */}
        <div 
            ref={containerRef}
            className="w-full h-full relative bg-black border border-brand/30 shadow-[0_0_30px_rgba(212,163,115,0.1)] overflow-hidden flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* 1. Animated Grid Background */}
            <div 
                ref={gridRef}
                className="absolute inset-[-50%] w-[200%] h-[200%] opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(212,163,115,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(212,163,115,0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
                    animation: 'grid-scroll 20s linear infinite'
                }}
            />

            {/* 2. Scanning Beam */}
            <div className="absolute top-0 left-0 w-full h-1 bg-brand/50 shadow-[0_0_15px_#D4A373] animate-scan z-10 opacity-50"></div>

            {/* 3. Corner Decorations */}
            <div className="absolute top-4 left-4 w-2 h-2 bg-brand z-20"></div>
            <div className="absolute top-4 right-4 w-2 h-2 bg-brand z-20"></div>
            <div className="absolute bottom-4 left-4 w-2 h-2 bg-brand z-20"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-brand z-20"></div>
            
            <div className="absolute top-4 left-8 text-[10px] font-mono text-brand/70 tracking-widest">SYS.OVR</div>
            <div className="absolute bottom-4 right-8 text-[10px] font-mono text-brand/70 tracking-widest">{randomChars}</div>

            {/* 4. Central "AI" Core */}
            <div className="relative z-30 transform-style-3d group-hover:scale-110 transition-transform duration-500">
                {/* Glitch Effect Layers */}
                <h1 
                    ref={textRef}
                    className="text-9xl font-black text-white select-none relative mix-blend-difference"
                    style={{ textShadow: '4px 4px 0px rgba(212,163,115,0.3)' }}
                >
                    AI
                    <span className="absolute top-0 left-0 -ml-1 text-red-500 opacity-0 group-hover:opacity-70 animate-glitch-1">AI</span>
                    <span className="absolute top-0 left-0 ml-1 text-blue-500 opacity-0 group-hover:opacity-70 animate-glitch-2">AI</span>
                </h1>
                
                {/* Circle Ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-brand/30 rounded-full animate-spin-slow pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-brand/10 rounded-full animate-pulse pointer-events-none"></div>
            </div>

            {/* 5. Vignette & Noise Overlay */}
            <div className="absolute inset-0 bg-radial-gradient-center opacity-50 pointer-events-none"></div>
            <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none mix-blend-overlay"></div>
        </div>

        <style>{`
            @keyframes grid-scroll {
                0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
                100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
            }
            @keyframes scan {
                0% { top: -10%; opacity: 0; }
                50% { opacity: 1; }
                100% { top: 110%; opacity: 0; }
            }
            @keyframes spin-slow {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            @keyframes glitch-1 {
                0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
                20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
                40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
                60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
                80% { clip-path: inset(10% 0 60% 0); transform: translate(-1px, 1px); }
                100% { clip-path: inset(30% 0 70% 0); transform: translate(1px, -1px); }
            }
            @keyframes glitch-2 {
                0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, -1px); }
                20% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 2px); }
                40% { clip-path: inset(30% 0 20% 0); transform: translate(2px, 1px); }
                60% { clip-path: inset(10% 0 80% 0); transform: translate(-1px, -2px); }
                80% { clip-path: inset(50% 0 30% 0); transform: translate(1px, 2px); }
                100% { clip-path: inset(20% 0 70% 0); transform: translate(-2px, 1px); }
            }
            .bg-radial-gradient-center {
                background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%);
            }
            .perspective-1000 {
                perspective: 1000px;
            }
        `}</style>
    </div>
  );
}
