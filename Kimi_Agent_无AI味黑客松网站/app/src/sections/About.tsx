import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, Trophy, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay: number;
  offsetY: number;
}

const StatCard = ({ icon, value, label, delay, offsetY }: StatCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState('0');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      // Entry animation
      gsap.fromTo(
        card,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          delay,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Parallax effect
      gsap.to(card, {
        y: offsetY,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, card);

    return () => ctx.revert();
  }, [delay, offsetY]);

  // Number counter animation
  useEffect(() => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const suffix = value.replace(/[0-9]/g, '');
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const duration = 2000;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeProgress * numericValue);
            setDisplayValue(current + suffix);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [value]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) translateZ(20px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)';
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      className={`tilt-card glow-border relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100 transition-shadow duration-300 ${
        isHovered ? 'shadow-2xl shadow-[#0071ff]/20' : ''
      }`}
    >
      <div className="w-14 h-14 bg-[#0071ff]/10 rounded-xl flex items-center justify-center mb-6">
        <div className="text-[#0071ff]">{icon}</div>
      </div>
      <div className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
        {displayValue}
      </div>
      <div className="text-gray-500 font-medium">{label}</div>
    </div>
  );
};

const About = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    {
      icon: <Clock className="w-7 h-7" />,
      value: '48',
      label: '小时不间断黑客马拉松',
      delay: 0,
      offsetY: -100,
    },
    {
      icon: <Trophy className="w-7 h-7" />,
      value: '100000',
      label: '现金与奖品',
      delay: 0.2,
      offsetY: -50,
    },
    {
      icon: <Users className="w-7 h-7" />,
      value: '20',
      label: '行业导师专家指导',
      delay: 0.4,
      offsetY: -120,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="w-full py-24 md:py-32 bg-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0071ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0071ff]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2
          ref={titleRef}
          className="text-4xl md:text-5xl font-black text-center text-gray-900 mb-16"
        >
          关于<span className="gradient-text">赛事</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="mt-20 text-center max-w-3xl mx-auto">
          <p className="text-lg text-gray-600 leading-relaxed">
            创新黑客马拉松是一场为期48小时的编程马拉松，汇聚全国最优秀的开发者、设计师和产品经理。
            在这里，你将与志同道合的伙伴一起，从零开始构建创新的技术解决方案，
            赢取丰厚奖金，获得行业专家的指导，并有机会将你的创意转化为现实。
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
