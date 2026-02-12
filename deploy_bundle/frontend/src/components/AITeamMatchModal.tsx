import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import gsap from 'gsap';

interface AITeamMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'zh' | 'en';
  hackathonId: number | null;
}

interface MatchResult {
  user_id: number;
  name: string;
  skills: string;
  personality: string;
  bio: string;
  match_reason: string;
  match_score: number;
}

export default function AITeamMatchModal({ isOpen, onClose, lang, hackathonId }: AITeamMatchModalProps) {
  const [requirements, setRequirements] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [availableHackathons, setAvailableHackathons] = useState<any[]>([]);
  const [fetchingHackathons, setFetchingHackathons] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (hackathonId) {
        setSelectedId(hackathonId);
      } else {
        fetchMyHackathons();
      }
      if (modalRef.current) {
        gsap.fromTo(modalRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    }
  }, [isOpen, hackathonId]);

  const fetchMyHackathons = async () => {
    setFetchingHackathons(true);
    try {
        const token = localStorage.getItem('token');
        const [enrollRes, hackRes] = await Promise.all([
            axios.get('api/v1/enrollments/me', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('api/v1/hackathons')
        ]);
        
        const enrolledIds = enrollRes.data.map((e: any) => e.hackathon_id);
        const myHackathons = hackRes.data.filter((h: any) => enrolledIds.includes(h.id) && h.status === 'ongoing');
        
        setAvailableHackathons(myHackathons);
        if (myHackathons.length > 0) {
            setSelectedId(myHackathons[0].id);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setFetchingHackathons(false);
    }
  };

  const handleMatch = async () => {
    if (!requirements.trim()) return;
    
    setLoading(true);
    setAnalyzing(true);
    setMatches([]); // Clear previous matches

    try {
      const token = localStorage.getItem('token');
      if (!selectedId) {
        alert(lang === 'zh' ? '未选择活动' : 'No hackathon selected');
        setLoading(false);
        setAnalyzing(false);
        return;
      }

      const res = await axios.post('api/v1/ai/team-match', {
        hackathon_id: selectedId,
        requirements
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMatches(res.data.matches);
    } catch (err) {
      console.error(err);
      alert(lang === 'zh' ? '匹配失败，请稍后重试' : 'Matching failed, please try again later');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer"
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-void border-2 border-brand shadow-[0_0_80px_rgba(212,163,115,0.3)] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative cursor-default"
      >
        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-brand bg-brand/10 z-10"></div>
        
        {/* Header */}
        <div className="p-4 lg:p-8 border-b-2 border-brand flex justify-between items-center bg-surface relative overflow-hidden">
          <div className="absolute inset-0 bg-brand/5 pattern-grid-lg opacity-20"></div>
          <div className="relative z-10">
            <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase italic">
              <span className="text-brand mr-2">⚡</span> 
              {lang === 'zh' ? 'AI 灵感组队' : 'AI TEAM MATCH'}
            </h2>
            <p className="text-brand/60 font-mono text-xs lg:text-sm mt-2 uppercase tracking-widest">
              {lang === 'zh' ? '基于深度思维模型的智能匹配系统' : 'Intelligent Matching System Powered by Deep Reasoning'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 lg:top-6 lg:right-6 text-gray-500 hover:text-brand hover:rotate-90 transition-all duration-300 text-2xl lg:text-3xl z-[60]"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Left Panel: Input */}
            <div className="w-full lg:w-1/3 border-r-0 lg:border-r border-b lg:border-b-0 border-brand/20 p-6 lg:p-8 flex flex-col bg-black/40 overflow-y-auto lg:overflow-hidden h-auto lg:h-full shrink-0">
                {/* Hackathon Selector (if not pre-selected) */}
                {!hackathonId && (
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-brand mb-2 uppercase tracking-widest font-mono">
                            {lang === 'zh' ? '选择活动' : 'SELECT HACKATHON'}
                        </label>
                        {fetchingHackathons ? (
                            <div className="text-gray-500 text-xs font-mono animate-pulse">Loading...</div>
                        ) : availableHackathons.length > 0 ? (
                            <select
                                value={selectedId || ''}
                                onChange={(e) => setSelectedId(Number(e.target.value))}
                                className="w-full bg-black/50 border border-brand/30 text-white p-3 font-mono text-sm focus:border-brand focus:outline-none"
                            >
                                {availableHackathons.map(h => (
                                    <option key={h.id} value={h.id}>{h.title}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                                {lang === 'zh' ? '未找到进行中的活动 (需先报名)' : 'NO ONGOING HACKATHONS FOUND (REGISTER FIRST)'}
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-bold text-brand mb-4 uppercase tracking-widest font-mono">
                        {lang === 'zh' ? '描述你的想法 / 需求' : 'DESCRIBE YOUR IDEA / NEEDS'}
                    </label>
                    <textarea
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder={lang === 'zh' 
                            ? "我想做一个基于AI的法律助手，需要懂法律的前端和擅长RAG的后端..." 
                            : "I want to build an AI legal assistant, need a frontend dev who knows law and a backend dev good at RAG..."}
                        className="w-full h-32 lg:h-64 bg-black/50 border border-brand/30 text-white p-4 font-mono text-sm focus:border-brand focus:outline-none transition-all resize-none mb-4"
                    />
                    <div className="text-xs text-gray-500 font-mono mb-6">
                        {lang === 'zh' ? '* AI 将分析你的语义并匹配最互补的队友' : '* AI will analyze semantics to match complementary teammates'}
                    </div>
                </div>

                <button
                    onClick={handleMatch}
                    disabled={loading || !requirements.trim()}
                    className={`group relative w-full py-5 bg-brand text-black font-black uppercase tracking-widest text-lg transition-all overflow-hidden ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:scale-[1.02]'
                    }`}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <span className="animate-spin">⟳</span> 
                                {lang === 'zh' ? '深度思考中...' : 'DEEP THINKING...'}
                            </>
                        ) : (
                            <>
                                <span>⚡</span> 
                                {lang === 'zh' ? '开始匹配' : 'INITIATE MATCH'}
                            </>
                        )}
                    </span>
                </button>

                {/* Model Info */}
                <div className="mt-auto pt-6 border-t border-brand/10">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>ModelScope Qwen-Max Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-600 mt-2">
                        <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                        <span>DeepSeek-R1 (Coming Soon)</span>
                    </div>
                </div>
            </div>

            {/* Right Panel: Results */}
            <div className="flex-1 bg-void p-4 lg:p-8 overflow-y-auto custom-scrollbar relative" ref={contentRef}>
                {analyzing && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="text-brand font-mono text-2xl animate-pulse mb-4">
                            {lang === 'zh' ? '正在分析性格与技能...' : 'ANALYZING PERSONALITY & SKILLS...'}
                        </div>
                        <div className="w-64 h-1 bg-gray-800 overflow-hidden">
                            <div className="h-full bg-brand animate-progress"></div>
                        </div>
                        <div className="mt-4 font-mono text-green-500 text-sm">
                            &gt; Parsing semantic vectors...<br/>
                            &gt; Calculating compatibility matrix...<br/>
                            &gt; Optimizing team structure...
                        </div>
                    </div>
                )}

                {!analyzing && matches.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <div className="text-6xl mb-4">🔮</div>
                        <p className="font-mono text-lg uppercase tracking-widest">
                            {lang === 'zh' ? '等待输入指令...' : 'AWAITING INPUT...'}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {matches.map((match, idx) => (
                        <div 
                            key={match.user_id}
                            className="bg-surface border border-brand/30 p-6 relative group hover:border-brand transition-all hover:-translate-y-1"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="absolute top-0 right-0 px-3 py-1 bg-brand text-black font-bold font-mono text-xs">
                                {match.match_score}% MATCH
                            </div>
                            
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-black border border-brand/50 rounded-full flex items-center justify-center font-bold text-xl text-brand">
                                    {match.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase">{match.name}</h3>
                                    <div className="text-xs font-mono text-brand/80 mt-1">
                                        {match.personality || 'Unknown Type'}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 space-y-2">
                                <div className="text-xs text-gray-400 font-mono uppercase">Skills</div>
                                <div className="flex flex-wrap gap-2">
                                    {(match.skills || '').split(',').filter(Boolean).map((skill, i) => (
                                        <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 text-xs text-gray-300">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6 p-3 bg-brand/5 border-l-2 border-brand text-sm text-gray-300 italic font-serif">
                                "{match.bio}"
                            </div>

                            <div className="mb-6">
                                <div className="text-xs text-brand font-mono uppercase mb-2">Why Match?</div>
                                <p className="text-sm text-gray-400 leading-relaxed border-t border-dashed border-gray-700 pt-2">
                                    {match.match_reason}
                                </p>
                            </div>

                            <button 
                                onClick={() => alert(lang === 'zh' ? '邀请已发送！' : 'Invitation Sent!')}
                                className="w-full py-3 border border-brand text-brand font-bold uppercase tracking-widest hover:bg-brand hover:text-black transition-colors text-sm"
                            >
                                {lang === 'zh' ? '发起邀请' : 'SEND INVITATION'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
