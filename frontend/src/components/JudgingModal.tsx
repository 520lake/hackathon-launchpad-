import { useState, useEffect } from 'react';
import axios from 'axios';

interface JudgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  hackathonTitle: string;
  lang: 'zh' | 'en';
}

interface Project {
  id: number;
  name: string;
  description: string;
  repository_url?: string;
  demo_url?: string;
  video_url?: string;
}

interface ScoringDimension {
  name: string;
  description: string;
  weight: number;
}

export default function JudgingModal({ isOpen, onClose, hackathonId, hackathonTitle, lang }: JudgingModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Scoring state
  const [dimensions, setDimensions] = useState<ScoringDimension[]>([]);
  const [scores, setScores] = useState<{[key: string]: number}>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && hackathonId) {
      fetchData();
    }
  }, [isOpen, hackathonId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch hackathon details for dimensions
      const hackathonRes = await axios.get(`api/v1/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (hackathonRes.data.scoring_dimensions) {
        try {
            setDimensions(JSON.parse(hackathonRes.data.scoring_dimensions));
        } catch (e) {
            console.error("Failed to parse scoring dimensions", e);
        }
      }

      // Fetch projects
      const projectsRes = await axios.get(`api/v1/projects/?hackathon_id=${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (dimName: string, value: number) => {
    setScores(prev => ({
        ...prev,
        [dimName]: value
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    let totalWeight = 0;
    dimensions.forEach(dim => {
        const score = scores[dim.name] || 0;
        total += score * (dim.weight / 100);
        totalWeight += dim.weight;
    });
    return total.toFixed(2);
  };

  const submitScore = async () => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
        const token = localStorage.getItem('token');
        const totalScore = parseFloat(calculateTotal());
        
        // Use project-specific score endpoint
        // Payload must match ScoreCreate (requires judge_id/project_id, though backend overrides)
        await axios.post(`api/v1/projects/${selectedProject.id}/score`, {
            project_id: selectedProject.id,
            judge_id: 0, // Dummy, backend uses current_user.id
            score_value: Math.round(totalScore), 
            comment: comment
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        alert(lang === 'zh' ? '评分提交成功' : 'Score submitted successfully');
        setSelectedProject(null);
        setScores({});
        setComment('');
    } catch (err) {
        console.error(err);
        alert(lang === 'zh' ? '评分提交失败' : 'Submission failed');
    } finally {
        setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-6xl h-[90vh] flex flex-col border-2 border-brand shadow-[8px_8px_0px_0px_#000]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-brand bg-black">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {lang === 'zh' ? '评审终端' : 'JUDGING TERMINAL'}: <span className="text-brand">{hackathonTitle}</span>
          </h2>
          <button onClick={onClose} className="text-brand hover:text-white font-mono font-bold text-xl">[X]</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Project List */}
            <div className="w-1/3 border-r-2 border-brand overflow-y-auto p-4 bg-black/20 custom-scrollbar">
                <h3 className="font-mono font-bold text-brand mb-4 uppercase tracking-widest border-b border-brand/20 pb-2">
                    {lang === 'zh' ? '待评审项目' : 'PENDING PROJECTS'}
                </h3>
                {loading ? (
                    <div className="font-mono text-gray-500 animate-pulse">{lang === 'zh' ? '加载数据中...' : 'LOADING DATA...'}</div>
                ) : (
                    <div className="space-y-3">
                        {projects.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedProject(p)}
                                className={`p-4 border-2 transition-all cursor-pointer font-mono ${
                                    selectedProject?.id === p.id 
                                    ? 'bg-brand text-black border-brand shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]' 
                                    : 'bg-black/40 text-gray-400 border-gray-700 hover:border-brand hover:text-white'
                                }`}
                            >
                                <div className="font-bold uppercase truncate">{p.name}</div>
                                <div className="text-xs opacity-70 mt-2 truncate">{p.description}</div>
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <div className="text-gray-500 font-mono text-sm border border-dashed border-gray-700 p-4 text-center">
                                {lang === 'zh' ? '暂无项目提交' : 'NO PROJECTS SUBMITTED'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Scoring Area */}
            <div className="w-2/3 overflow-y-auto p-8 bg-surface custom-scrollbar relative">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none"></div>
                
                {selectedProject ? (
                    <div className="space-y-8 relative z-10">
                        <div>
                            <h3 className="text-3xl font-black text-white uppercase mb-4 tracking-tight">{selectedProject.name}</h3>
                            <div className="p-4 bg-black/30 border border-brand/20 text-gray-300 font-mono text-sm leading-relaxed mb-6">
                                {selectedProject.description}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm font-mono">
                                {selectedProject.repository_url && (
                                    <a href={selectedProject.repository_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand hover:text-white border border-brand px-3 py-1 hover:bg-brand/10 transition-colors">
                                        [CODE REPO] ↗
                                    </a>
                                )}
                                {selectedProject.demo_url && (
                                    <a href={selectedProject.demo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand hover:text-white border border-brand px-3 py-1 hover:bg-brand/10 transition-colors">
                                        [LIVE DEMO] ↗
                                    </a>
                                )}
                                {selectedProject.video_url && (
                                    <a href={selectedProject.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand hover:text-white border border-brand px-3 py-1 hover:bg-brand/10 transition-colors">
                                        [VIDEO] ↗
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="border-t-2 border-brand/20 pt-8">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-mono font-bold text-brand uppercase tracking-widest text-lg">
                                    {lang === 'zh' ? '评分系统' : 'SCORING SYSTEM'}
                                </h4>
                                <button
                                    onClick={handleAIReview}
                                    disabled={loading}
                                    className="bg-brand/10 hover:bg-brand/20 text-brand border border-brand px-4 py-2 text-sm font-mono uppercase transition-colors flex items-center gap-2"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">Analyzing...</span>
                                    ) : (
                                        <>
                                            <span>⚡</span>
                                            {lang === 'zh' ? 'AI 辅助评审' : 'AI ASSISTANT'}
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {dimensions.length > 0 ? (
                                <div className="space-y-6">
                                    {dimensions.map((dim, idx) => (
                                        <div key={idx} className="bg-black/20 border border-gray-800 p-6 hover:border-brand/50 transition-colors">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <span className="font-bold text-white uppercase tracking-wider block mb-1">{dim.name}</span>
                                                    <span className="text-xs text-gray-500 font-mono">{dim.description}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-3xl font-black text-brand">{scores[dim.name] || 0}</span>
                                                    <span className="text-xs text-gray-500 font-mono ml-2">/ 100 (Weight: {dim.weight}%)</span>
                                                </div>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={scores[dim.name] || 0} 
                                                onChange={e => handleScoreChange(dim.name, parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-800 rounded-none appearance-none cursor-pointer accent-brand"
                                            />
                                        </div>
                                    ))}
                                    
                                    <div className="flex justify-between items-center p-6 bg-brand/10 border border-brand/30 mt-8">
                                        <span className="font-mono font-bold text-brand uppercase text-xl">{lang === 'zh' ? '总分 (加权)' : 'TOTAL SCORE (WEIGHTED)'}</span>
                                        <span className="text-4xl font-black text-white">{calculateTotal()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 font-mono">
                                    WARNING: {lang === 'zh' ? '未配置评分维度，请直接打分 (0-100)' : 'No scoring dimensions configured.'}
                                </div>
                            )}
                            
                            <div className="mt-8">
                                <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                                    {lang === 'zh' ? '评委意见' : 'JUDGE COMMENTS'}
                                </label>
                                <textarea 
                                    className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700 h-32" 
                                    value={comment} 
                                    onChange={e => setComment(e.target.value)} 
                                    placeholder={lang === 'zh' ? "写下你的评价..." : "Enter your comments..."}
                                />
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button 
                                    onClick={submitScore} 
                                    disabled={submitting}
                                    className="px-10 py-4 bg-brand text-black font-black uppercase tracking-wider hover:bg-white border-2 border-brand shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50"
                                >
                                    {submitting ? (lang === 'zh' ? '提交中...' : 'SUBMITTING...') : (lang === 'zh' ? '提交评分' : 'SUBMIT SCORE')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 font-mono">
                        <div className="text-6xl mb-4 opacity-20">←</div>
                        <p className="uppercase tracking-widest">{lang === 'zh' ? '请选择一个项目开始评审' : 'SELECT A PROJECT TO BEGIN'}</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}