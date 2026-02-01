import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Linkedin, Twitter } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const judges = [
  {
    name: '张明远',
    title: 'CTO @ TechCorp',
    image: '/judge1.jpg',
    bio: '前谷歌高级工程师，15年技术架构经验',
    offset: 0,
  },
  {
    name: '李雪婷',
    title: '产品总监 @ InnovateLab',
    image: '/judge2.jpg',
    bio: '连续创业者，专注AI产品创新',
    offset: 60,
  },
  {
    name: '王浩然',
    title: '合伙人 @ AIVentures',
    image: '/judge3.jpg',
    bio: '资深投资人，孵化50+科技初创公司',
    offset: 30,
  },
  {
    name: '陈思琪',
    title: '设计总监 @ SparkHub',
    image: '/judge4.jpg',
    bio: '前苹果设计师，用户体验专家',
    offset: 90,
  },
];

const Judges = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
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

      // Cards reveal animation
      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        gsap.fromTo(
          card,
          {
            clipPath: 'inset(100% 0 0 0)',
            opacity: 0,
          },
          {
            clipPath: 'inset(0% 0 0 0)',
            opacity: 1,
            duration: 1,
            ease: 'power4.out',
            delay: i * 0.1,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full py-24 md:py-32 bg-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0071ff]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0071ff]/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2
          ref={titleRef}
          className="text-4xl md:text-5xl font-black text-center text-gray-900 mb-16"
        >
          评委<span className="gradient-text">阵容</span>
        </h2>

        {/* Masonry grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {judges.map((judge, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="group relative"
              style={{ marginTop: `${judge.offset}px` }}
            >
              <div className="scanline-effect relative bg-gray-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500">
                {/* Image */}
                <div className="aspect-square overflow-hidden">
                  <img
                    src={judge.image}
                    alt={judge.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {judge.name}
                  </h3>
                  <p className="text-[#0071ff] font-medium mb-2">
                    {judge.title}
                  </p>
                  <p className="text-white/70 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {judge.bio}
                  </p>

                  {/* Social links */}
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-[#0071ff] transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-[#0071ff] transition-colors">
                      <Twitter className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Name tag (visible when not hovered) */}
                <div className="absolute bottom-6 left-6 group-hover:opacity-0 transition-opacity duration-300">
                  <span className="px-4 py-2 bg-[#0071ff] text-white text-sm font-bold rounded-full">
                    {judge.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Judges;
