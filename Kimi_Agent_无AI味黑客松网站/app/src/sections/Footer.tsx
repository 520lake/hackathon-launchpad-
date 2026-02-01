import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, Phone, MapPin, Github, Twitter, Linkedin, Instagram } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background warp effect
      gsap.to(bgRef.current, {
        scale: 1.1,
        rotation: 2,
        filter: 'blur(3px)',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
        },
      });

      // Content fade in
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={sectionRef}
      className="w-full relative overflow-hidden"
    >
      {/* CTA Section */}
      <div className="relative py-32 overflow-hidden">
        {/* Warp background */}
        <div
          ref={bgRef}
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-black/60 z-[1]" />

        {/* Content */}
        <div
          ref={contentRef}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        >
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            准备好挑战了吗？
          </h2>
          <p className="text-xl text-white/80 mb-10">
            加入数百名创新者，一起改变未来
          </p>
          <button className="px-12 py-5 bg-[#0071ff] text-white text-lg font-bold rounded-full hover:bg-[#0056cc] transition-colors shadow-lg shadow-[#0071ff]/30 hover:shadow-xl hover:shadow-[#0071ff]/40 transform hover:scale-105 transition-transform">
            立即报名
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-black mb-4">
                创新<span className="text-[#0071ff]">黑客马拉松</span>
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                激发创新潜能，连接技术人才，打造未来科技生态。
                我们致力于为全球开发者提供最优质的竞技平台。
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#0071ff] hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#0071ff] hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#0071ff] hover:text-white transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#0071ff] hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-lg font-bold mb-4">快速链接</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#0071ff] transition-colors"
                  >
                    赛事规则
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#0071ff] transition-colors"
                  >
                    奖项设置
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#0071ff] transition-colors"
                  >
                    评委阵容
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-[#0071ff] transition-colors"
                  >
                    常见问题
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-bold mb-4">联系我们</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5 text-[#0071ff]" />
                  <span>hello@hackathon.com</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5 text-[#0071ff]" />
                  <span>+86 400-123-4567</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-5 h-5 text-[#0071ff]" />
                  <span>北京市海淀区中关村</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 创新黑客马拉松. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="#"
                className="text-gray-500 hover:text-[#0071ff] transition-colors"
              >
                隐私政策
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-[#0071ff] transition-colors"
              >
                服务条款
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
