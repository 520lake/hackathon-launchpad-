import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const partners = [
  { name: 'TechCorp', logo: 'TC' },
  { name: 'InnovateLab', logo: 'IL' },
  { name: 'CloudMax', logo: 'CM' },
  { name: 'DataFlow', logo: 'DF' },
  { name: 'AIVentures', logo: 'AI' },
  { name: 'CodeBase', logo: 'CB' },
  { name: 'NextGen', logo: 'NG' },
  { name: 'SparkHub', logo: 'SH' },
];

const Partners = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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

  return (
    <section
      ref={sectionRef}
      className="w-full py-20 bg-[#f8f9fa] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2
          ref={titleRef}
          className="text-3xl md:text-4xl font-black text-center text-gray-900"
        >
          我们的<span className="gradient-text">合作伙伴</span>
        </h2>
      </div>

      {/* Marquee container */}
      <div className="relative">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#f8f9fa] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#f8f9fa] to-transparent z-10" />

        {/* Marquee track */}
        <div
          ref={trackRef}
          className="flex overflow-hidden"
        >
          <div className="marquee-track flex gap-12 items-center">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={index}
                className="group flex-shrink-0 w-40 h-24 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-110 hover:border-[#0071ff]/30"
              >
                <div className="text-2xl font-black text-gray-300 group-hover:text-[#0071ff] transition-colors duration-300">
                  {partner.logo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row - reverse direction */}
      <div className="relative mt-8">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#f8f9fa] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#f8f9fa] to-transparent z-10" />

        <div className="flex overflow-hidden">
          <div
            className="flex gap-12 items-center"
            style={{
              animation: 'marquee 30s linear infinite reverse',
            }}
          >
            {[...partners.reverse(), ...partners].map((partner, index) => (
              <div
                key={index}
                className="group flex-shrink-0 w-40 h-24 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-110 hover:border-[#0071ff]/30"
              >
                <div className="text-2xl font-black text-gray-300 group-hover:text-[#0071ff] transition-colors duration-300">
                  {partner.logo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
