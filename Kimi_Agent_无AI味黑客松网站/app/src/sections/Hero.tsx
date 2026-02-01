import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Calendar, Clock, MapPin } from 'lucide-react';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isGlitching, setIsGlitching] = useState(false);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const particles: Particle[] = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 113, 255, 0.6)';
        ctx.fill();

        // Connect nearby particles
        particles.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 113, 255, ${0.2 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title decode animation
      const titleChars = titleRef.current?.querySelectorAll('.char');
      if (titleChars) {
        gsap.fromTo(
          titleChars,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.05,
            ease: 'power3.out',
            delay: 0.3,
          }
        );
      }

      // Subtitle animation
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.8 }
      );

      // Button animation
      gsap.fromTo(
        btnRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 1 }
      );

      // Background scale
      gsap.fromTo(
        '.hero-bg',
        { scale: 1.2 },
        { scale: 1, duration: 2, ease: 'power2.out' }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Glitch effect interval
  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Magnetic button effect
  const handleBtnMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
  };

  const handleBtnMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translate(0, 0) scale(1)';
  };

  const titleText = '创新黑客马拉松';

  return (
    <section
      ref={heroRef}
      className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      style={{ perspective: '1000px' }}
    >
      {/* Background image */}
      <div
        className="hero-bg absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translate(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px) scale(1.1)`,
          transition: 'transform 0.1s ease-out',
        }}
      />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="particle-canvas z-10" />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-[5]" />

      {/* Content */}
      <div
        className="relative z-20 text-center px-4"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <h1
          ref={titleRef}
          className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 glitch-text ${
            isGlitching ? 'active' : ''
          }`}
          data-text={titleText}
        >
          {titleText.split('').map((char, i) => (
            <span key={i} className="char inline-block">
              {char}
            </span>
          ))}
        </h1>

        <p
          ref={subtitleRef}
          className="text-xl sm:text-2xl md:text-3xl text-white/90 font-medium mb-10 tracking-wider"
        >
          代码。创造。征服。
        </p>

        {/* Event info badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-full text-white text-sm">
            <Calendar className="w-4 h-4" />
            <span>2024年3月15日</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-full text-white text-sm">
            <Clock className="w-4 h-4" />
            <span>48小时</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-full text-white text-sm">
            <MapPin className="w-4 h-4" />
            <span>线上活动</span>
          </div>
        </div>

        <button
          ref={btnRef}
          onMouseMove={handleBtnMouseMove}
          onMouseLeave={handleBtnMouseLeave}
          className="magnetic-btn px-10 py-4 bg-[#0071ff] text-white font-bold text-lg rounded-full hover:bg-[#0056cc] transition-colors shadow-lg shadow-[#0071ff]/30"
        >
          立即报名
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/80 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
