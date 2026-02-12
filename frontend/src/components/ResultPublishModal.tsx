import { useState, useEffect } from 'react';
import axios from 'axios';

interface ResultPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  lang: 'zh' | 'en';
}

interface Project {
  id: number;
  name: string;
  description: string;
  total_score?: number; 
}

interface Winner {
  project_id: number;
  project_name: string;
  award_name: string;
  comment?: string;
}

export default function ResultPublishModal({ isOpen, onClose, hackathonId, lang }: ResultPublishModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Selection state
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [awardName, setAwardName] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen && hackathonId) {
      fetchData();
    }
  }, [isOpen, hackathonId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch projects
      const resProjects = await axios.get(`/api/v1/projects?hackathon_id=${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch existing results if any
      const resHackathon = await axios.get(`/api/v1/hackathons/${hackathonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resHackathon.data.results_detail) {
          try {
              setWinners(JSON.parse(resHackathon.data.results_detail));
          } catch (e) {
              console.error("Failed to parse results", e);
          }
      }

      setProjects(resProjects.data);
      
    } catch (err) {
      console.error(err);
    } 
  };

  const addWinner = () => {
      if (!selectedProjectId || !awardName) return;
      
      const project = projects.find(p => p.id === Number(selectedProjectId));
      if (!project) return;

      const newWinner: Winner = {
          project_id: project.id,
          project_name: project.name,
          award_name: awardName,
          comment: comment
      };

      setWinners([...winners, newWinner]);
      setSelectedProjectId(null);
      setAwardName('');
      setComment('');
  };

  const removeWinner = (index: number) => {
      setWinners(winners.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
      if (winners.length === 0 && !window.confirm(lang === 'zh' ? "确定不设置任何奖项直接发布结果吗？" : "Publish results without any awards?")) {
          return;
      }
      
      setSubmitting(true);
      try {
          const token = localStorage.getItem('token');
          await axios.patch(`/api/v1/hackathons/${hackathonId}`, {
              results_detail: JSON.stringify(winners),
              status: 'ended' // Auto set to ended
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          alert(lang === 'zh' ? '结果发布成功！活动已结束。' : 'Results published! Hackathon ended.');
          onClose();
      } catch (err) {
          console.error(err);
          alert(lang === 'zh' ? '发布失败' : 'Publish failed');
      } finally {
          setSubmitting(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-4xl border-2 border-brand shadow-[8px_8px_0px_0px_#000] relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-brand bg-black">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {lang === 'zh' ? '发布活动结果' : 'PUBLISH RESULTS'}
          </h2>
          <button onClick={onClose} className="text-brand hover:text-white font-mono font-bold text-xl">[X]</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-8">
                {/* Add Winner Form */}
                <div className="bg-black/20 border border-gray-800 p-6">
                    <h3 className="font-mono font-bold text-brand uppercase mb-4 tracking-widest border-b border-gray-800 pb-2">
                        {lang === 'zh' ? '添加获奖名单' : 'ADD WINNERS'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-mono text-gray-500 mb-1 uppercase">{lang === 'zh' ? '选择作品' : 'SELECT PROJECT'}</label>
                            <select 
                                className="w-full bg-black border border-gray-700 text-white px-4 py-2 focus:border-brand focus:outline-none font-mono"
                                value={selectedProjectId || ''}
                                onChange={e => setSelectedProjectId(Number(e.target.value))}
                            >
                                <option value="">{lang === 'zh' ? '请选择...' : 'Select...'}</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-mono text-gray-500 mb-1 uppercase">{lang === 'zh' ? '奖项名称' : 'AWARD NAME'}</label>
                            <input 
                                type="text" 
                                className="w-full bg-black border border-gray-700 text-white px-4 py-2 focus:border-brand focus:outline-none font-mono"
                                placeholder={lang === 'zh' ? "例如：一等奖" : "e.g., First Place"}
                                value={awardName}
                                onChange={e => setAwardName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-mono text-gray-500 mb-1 uppercase">{lang === 'zh' ? '评语 (可选)' : 'COMMENTS (OPTIONAL)'}</label>
                            <textarea 
                                className="w-full bg-black border border-gray-700 text-white px-4 py-2 focus:border-brand focus:outline-none font-mono h-20"
                                placeholder={lang === 'zh' ? "获奖理由..." : "Reason..."}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={addWinner}
                            disabled={!selectedProjectId || !awardName}
                            className="w-full py-3 bg-white/5 border border-white/20 text-white font-mono uppercase hover:bg-brand hover:text-black hover:border-brand transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {lang === 'zh' ? '添加至名单' : 'ADD TO LIST'}
                        </button>
                    </div>
                </div>

                {/* Winners List */}
                {winners.length > 0 && (
                    <div>
                        <h3 className="font-mono font-bold text-white uppercase mb-4 tracking-widest">
                            {lang === 'zh' ? '已添加名单' : 'WINNERS LIST'} ({winners.length})
                        </h3>
                        <div className="space-y-3">
                            {winners.map((w, idx) => (
                                <div key={idx} className="bg-brand/10 border border-brand/30 p-4 flex justify-between items-center group hover:bg-brand/20 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-brand text-black text-xs font-mono font-bold px-2 py-1 uppercase">{w.award_name}</span>
                                            <span className="font-bold text-white uppercase tracking-tight">{w.project_name}</span>
                                        </div>
                                        {w.comment && <p className="text-sm text-gray-400 mt-2 font-mono border-l-2 border-brand/20 pl-2">{w.comment}</p>}
                                    </div>
                                    <button 
                                        onClick={() => removeWinner(idx)} 
                                        className="text-red-500 hover:text-red-400 font-mono text-sm uppercase opacity-50 group-hover:opacity-100 transition-opacity"
                                    >
                                        [DELETE]
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="p-6 border-t-2 border-brand bg-black flex justify-end gap-4">
            <button 
                onClick={onClose} 
                className="px-6 py-3 bg-white/10 text-white font-mono uppercase hover:bg-white hover:text-black transition-all"
            >
                {lang === 'zh' ? '取消' : 'CANCEL'}
            </button>
            <button 
                onClick={handlePublish} 
                disabled={submitting}
                className="px-8 py-3 bg-brand text-black font-black uppercase tracking-wider hover:bg-white border-2 border-brand shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50"
            >
                {submitting ? (lang === 'zh' ? '发布中...' : 'PUBLISHING...') : (lang === 'zh' ? '确认发布结果' : 'CONFIRM & PUBLISH')}
            </button>
        </div>
      </div>
    </div>
  );
}