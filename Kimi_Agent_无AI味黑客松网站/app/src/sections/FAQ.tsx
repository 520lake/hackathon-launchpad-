import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: '谁可以参加这次黑客马拉松？',
    answer:
      '我们欢迎所有对技术充满热情的开发者、设计师、产品经理和学生参加。无论你是初学者还是资深专家，都可以在这里找到志同道合的伙伴。参赛者需年满18岁，或获得监护人同意。',
  },
  {
    question: '团队规模有限制吗？',
    answer:
      '每个团队由3-5人组成。你可以提前组建团队，也可以在开幕式后的团队组建环节寻找队友。我们鼓励跨学科组队，让不同背景的成员碰撞出创新火花。',
  },
  {
    question: '比赛主题是什么？',
    answer:
      '比赛主题将在开幕式当天揭晓。主题将围绕当前科技热点，如人工智能、可持续发展、数字化转型等方向。提前准备不会给你带来优势，因为评判标准更注重创意和执行力。',
  },
  {
    question: '需要提供什么作品？',
    answer:
      '最终提交需要包括：可运行的产品Demo、源代码（托管在GitHub等平台上）、5分钟演示视频，以及项目介绍文档。评委将综合评估技术难度、创新性、实用性和演示效果。',
  },
  {
    question: '有参赛费用吗？',
    answer:
      '完全免费！我们致力于为所有技术爱好者提供平等的竞技平台。不仅如此，所有参赛者还将获得参赛证书、赞助商提供的云资源礼包和技术培训课程。',
  },
  {
    question: '如何获得导师指导？',
    answer:
      '比赛期间，我们将安排20位行业专家作为导师。你可以在指定时间段预约一对一指导，也可以在Discord频道随时提问。导师涵盖技术架构、产品设计、商业模式等多个领域。',
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}

const FAQItem = ({ question, answer, isOpen, onClick }: Omit<FAQItemProps, 'index'>) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        height: isOpen ? 'auto' : 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    }
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: isOpen ? 135 : 0,
        duration: 0.3,
        ease: 'back.out(1.7)',
      });
    }
  }, [isOpen]);

  return (
    <div
      className={`border-b border-gray-200 transition-colors duration-300 ${
        isOpen ? 'border-[#0071ff]' : ''
      }`}
    >
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span
          className={`text-lg font-semibold transition-colors duration-300 pr-8 ${
            isOpen ? 'text-[#0071ff]' : 'text-gray-900 group-hover:text-[#0071ff]'
          }`}
        >
          {question}
        </span>
        <div
          ref={iconRef}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
            isOpen
              ? 'bg-[#0071ff] text-white'
              : 'bg-gray-100 text-gray-600 group-hover:bg-[#0071ff]/10 group-hover:text-[#0071ff]'
          }`}
        >
          <Plus className="w-5 h-5" />
        </div>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: 0 }}
      >
        <p className="pb-6 text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const FAQ = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      ref={sectionRef}
      className="w-full py-24 md:py-32 bg-[#f8f9fa] relative overflow-hidden"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2
          ref={titleRef}
          className="text-4xl md:text-5xl font-black text-center text-gray-900 mb-16"
        >
          常见<span className="gradient-text">问题</span>
        </h2>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => handleClick(index)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">还有其他问题？</p>
          <button className="px-6 py-3 border-2 border-[#0071ff] text-[#0071ff] font-semibold rounded-full hover:bg-[#0071ff] hover:text-white transition-colors duration-300">
            联系我们
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
