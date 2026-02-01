import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flag, Search, Upload, Trophy } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const events = [
  {
    date: '3月15日',
    day: 'Day 1',
    title: '开幕式与主题发布',
    description: '揭晓本届黑客马拉松主题，团队组建，头脑风暴',
    icon: <Flag className="w-6 h-6" />,
    side: 'left',
  },
  {
    date: '3月16日',
    day: 'Day 2',
    title: '中期检查与导师指导',
    description: '项目进度汇报，行业导师一对一指导，技术答疑',
    icon: <Search className="w-6 h-6" />,
    side: 'right',
  },
  {
    date: '3月17日',
    day: 'Day 3',
    title: '项目提交与初审',
    description: '代码提交，Demo演示，评委初审筛选',
    icon: <Upload className="w-6 h-6" />,
    side: 'left',
  },
  {
    date: '3月18日',
    day: 'Day 4',
    title: '决赛演示与颁奖典礼',
    description: '入围团队现场演示，评委打分，颁奖典礼',
    icon: <Trophy className="w-6 h-6" />,
    side: 'right',
  },
];

const Timeline = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

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

      // Path draw animation
      if (pathRef.current) {
        const pathLength = pathRef.current.getTotalLength();
        gsap.set(pathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      // Items animation
      itemsRef.current.forEach((item, i) => {
        if (!item) return;

        gsap.fromTo(
          item,
          {
            opacity: 0,
            x: events[i].side === 'left' ? -50 : 50,
          },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
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
      className="w-full py-24 md:py-32 bg-[#f8f9fa] relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2
          ref={titleRef}
          className="text-4xl md:text-5xl font-black text-center text-gray-900 mb-20"
        >
          赛程<span className="gradient-text">安排</span>
        </h2>

        <div className="relative">
          {/* SVG Path */}
          <svg
            className="absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 hidden md:block"
            viewBox="0 0 16 800"
            preserveAspectRatio="none"
          >
            <path
              ref={pathRef}
              d="M8 0 L8 200 Q8 220 28 220 L8 220 Q-12 220 -12 240 L-12 400 Q-12 420 8 420 L8 420 Q28 420 28 440 L28 600 Q28 620 8 620 L8 620 Q-12 620 -12 640 L-12 800"
              fill="none"
              stroke="#0071ff"
              strokeWidth="2"
              className="timeline-path"
              style={{ transform: 'translateX(8px)' }}
            />
          </svg>

          {/* Mobile line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#0071ff]/30 md:hidden" />

          {/* Events */}
          <div className="space-y-16">
            {events.map((event, index) => (
              <div
                key={index}
                ref={(el) => { itemsRef.current[index] = el; }}
                className={`relative flex items-center ${
                  event.side === 'left'
                    ? 'md:flex-row'
                    : 'md:flex-row-reverse'
                } flex-row`}
              >
                {/* Content card */}
                <div
                  className={`flex-1 ${
                    event.side === 'left' ? 'md:pr-16 md:text-right' : 'md:pl-16'
                  } pl-12 md:pl-0`}
                >
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 group">
                    <div
                      className={`flex items-center gap-3 mb-3 ${
                        event.side === 'left' ? 'md:justify-end' : ''
                      }`}
                    >
                      <span className="text-sm font-bold text-[#0071ff]">
                        {event.day}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">
                        {event.date}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#0071ff] transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{event.description}</p>
                  </div>
                </div>

                {/* Center node */}
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 z-10">
                  <div className="w-10 h-10 rounded-full bg-[#0071ff] flex items-center justify-center text-white shadow-lg shadow-[#0071ff]/30 pulse-node">
                    {event.icon}
                  </div>
                </div>

                {/* Empty space for other side */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
