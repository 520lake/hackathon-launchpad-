import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Trophy, Medal, Award, Star, Crown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const prizes = [
  {
    rank: '特等奖',
    amount: '¥50,000',
    icon: <Crown className="w-8 h-8" />,
    color: 'from-yellow-400 to-yellow-600',
    description: '冠军团队，获得最高荣誉',
  },
  {
    rank: '一等奖',
    amount: '¥30,000',
    icon: <Trophy className="w-8 h-8" />,
    color: 'from-gray-300 to-gray-500',
    description: '亚军团队，卓越表现',
  },
  {
    rank: '二等奖',
    amount: '¥20,000',
    icon: <Medal className="w-8 h-8" />,
    color: 'from-orange-400 to-orange-600',
    description: '季军团队，优秀创新',
  },
  {
    rank: '三等奖',
    amount: '¥10,000',
    icon: <Award className="w-8 h-8" />,
    color: 'from-[#0071ff] to-[#00ffff]',
    description: '第四名，值得鼓励',
  },
  {
    rank: '人气奖',
    amount: '¥5,000',
    icon: <Star className="w-8 h-8" />,
    color: 'from-pink-400 to-pink-600',
    description: '观众投票最高',
  },
];

const Prizes = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

      // Carousel scroll animation
      const cards = carouselRef.current?.querySelectorAll('.prize-card');
      if (cards) {
        cards.forEach((card, i) => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 50, rotateY: -30 },
            {
              opacity: 1,
              y: 0,
              rotateY: 0,
              duration: 0.8,
              ease: 'power3.out',
              delay: i * 0.1,
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full py-24 md:py-32 bg-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0071ff]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2
          ref={titleRef}
          className="text-4xl md:text-5xl font-black text-center text-gray-900 mb-16"
        >
          奖项<span className="gradient-text">设置</span>
        </h2>

        <div
          ref={carouselRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
          style={{ perspective: '2000px' }}
        >
          {prizes.map((prize, index) => (
            <div
              key={index}
              className={`prize-card relative bg-white rounded-2xl p-6 shadow-xl border border-gray-100 transition-all duration-500 cursor-pointer ${
                hoveredIndex === index
                  ? 'scale-110 z-10 shadow-2xl'
                  : hoveredIndex !== null
                  ? 'scale-95 opacity-70'
                  : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform:
                  hoveredIndex === index
                    ? 'rotateY(0deg) translateZ(50px)'
                    : `rotateY(${(index - 2) * 5}deg)`,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Glow effect */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${prize.color} opacity-0 transition-opacity duration-300 ${
                  hoveredIndex === index ? 'opacity-10' : ''
                }`}
              />

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${prize.color} flex items-center justify-center text-white mb-4 mx-auto`}
              >
                {prize.icon}
              </div>

              {/* Rank */}
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                {prize.rank}
              </h3>

              {/* Amount */}
              <div className="text-3xl font-black text-center gradient-text mb-3">
                {prize.amount}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 text-center">
                {prize.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional prizes info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            所有获奖者还将获得：
            <span className="font-semibold text-[#0071ff]">
              {' '}
              实习机会 · 投资对接 · 云资源礼包 · 技术培训课程
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Prizes;
