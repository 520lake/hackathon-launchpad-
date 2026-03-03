import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import gsap from 'gsap';

interface AIResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (bio: string, skills: string[]) => void;
  lang: 'zh' | 'en';
}

export default function AIResumeModal({ isOpen, onClose, onSave, lang }: AIResumeModalProps) {
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
  const [keywords, setKeywords] = useState('');
  const [role, setRole] = useState('');
  const [generatedBio, setGeneratedBio] = useState('');
  const [generatedSkills, setGeneratedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      gsap.set(containerRef.current, { opacity: 0, scale: 0.95 });
      gsap.to(containerRef.current, { 
        opacity: 1, 
        scale: 1, 
        duration: 0.4, 
        ease: "power3.out" 
      });
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!keywords.trim()) return;
    setLoading(true);
    setStep('generating');
    
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post('api/v1/ai/generate-resume', { 
            keywords, 
            role,
            lang 
        }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        setGeneratedBio(res.data.bio);
        setGeneratedSkills(res.data.skills);
        setStep('result');
    } catch (e) {
        console.error(e);
        setStep('input');
        alert('Failed to generate resume');
    } finally {
        setLoading(false);
    }
  };

  const handleSave = () => {
      if (onSave) {
          onSave(generatedBio, generatedSkills);
      } else {
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div 
        ref={containerRef}
        className="bg-surface border border-brand/30 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(212,163,115,0.15)]"
      >
        {/* Decorational Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand z-20 pointer-events-none"></div>

        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,163,115,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,163,115,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

        {/* Header */}
        <div className="p-6 border-b border-brand/20 flex justify-between items-center bg-black/40 relative z-10">
            <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-2">
                <span className="text-brand">⚡</span>
                <span className="text-glitch" data-text={lang === 'zh' ? 'AI 简历生成器' : 'AI RESUME GENERATOR'}>
                   {lang === 'zh' ? 'AI 简历生成器' : 'AI RESUME GENERATOR'}
                </span>
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar relative z-10">
            {step === 'input' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div>
                        <label className="block text-xs font-mono text-gray-500 uppercase mb-2">
                            {lang === 'zh' ? '目标角色' : 'TARGET ROLE'}
                        </label>
                        <input 
                            type="text" 
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            placeholder={lang === 'zh' ? "例如：前端开发、产品经理、UI设计师" : "e.g. Frontend Dev, PM, UI Designer"}
                            className="w-full bg-black/50 border border-white/20 p-4 text-white focus:border-brand outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-gray-500 uppercase mb-2">
                            {lang === 'zh' ? '关键词 / 经历' : 'KEYWORDS / EXPERIENCE'}
                        </label>
                        <textarea 
                            value={keywords}
                            onChange={e => setKeywords(e.target.value)}
                            placeholder={lang === 'zh' ? "输入你的技能、经历或兴趣，AI 将为你生成专业的个人简介..." : "Enter your skills, experience, or interests..."}
                            className="w-full h-32 bg-black/50 border border-white/20 p-4 text-white focus:border-brand outline-none font-mono resize-none"
                        />
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={!keywords.trim() || loading}
                        className="w-full bg-brand text-black font-black uppercase tracking-[0.2em] py-4 text-lg hover:bg-white transition-all disabled:opacity-50 relative overflow-hidden group clip-path-polygon"
                    >
                        <span className="relative z-10">{loading ? 'PROCESSING...' : (lang === 'zh' ? '开始生成' : 'GENERATE')}</span>
                        <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                    </button>
                </div>
            )}

            {step === 'generating' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="w-20 h-20 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-white mb-2">AI IS THINKING...</div>
                        <div className="text-sm text-gray-400 font-mono">Analyzing keywords • Structuring bio • Polishing tone</div>
                    </div>
                </div>
            )}

            {step === 'result' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white/5 border border-brand/20 p-6 relative group">
                        <div className="absolute top-0 right-0 bg-brand text-black text-xs font-bold px-2 py-1">AI GENERATED</div>
                        
                        <div className="mb-6">
                            <label className="text-xs text-gray-500 uppercase font-mono mb-2 block">{lang === 'zh' ? '个人简介' : 'BIO'}</label>
                            <div className="prose prose-invert max-w-none text-gray-200">
                                <ReactMarkdown>{generatedBio}</ReactMarkdown>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-mono mb-2 block">{lang === 'zh' ? '技能标签' : 'SKILLS'}</label>
                            <div className="flex flex-wrap gap-2">
                                {generatedSkills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-sm font-mono">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setStep('input')}
                            className="flex-1 py-3 border border-brand/30 text-brand hover:bg-brand/10 font-mono uppercase tracking-wider transition-all"
                        >
                            {lang === 'zh' ? '重新生成' : 'REGENERATE'}
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-1 bg-brand text-black font-bold uppercase tracking-wider py-3 hover:bg-white transition-all clip-path-polygon"
                        >
                            {lang === 'zh' ? '保存至个人资料' : 'SAVE TO PROFILE'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
