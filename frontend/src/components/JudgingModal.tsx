import { useState, useEffect } from 'react';
import axios from 'axios';

interface JudgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  hackathonTitle: string;
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

export default function JudgingModal({ isOpen, onClose, hackathonId, hackathonTitle }: JudgingModalProps) {
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
      const hackathonRes = await axios.get(`/api/v1/hackathons/${hackathonId}`, {
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
      // TODO: Filter only projects that submitted? Or all? Usually only submitted ones.
      // Current API might return all. 
      const projectsRes = await axios.get(`/api/v1/projects/?hackathon_id=${hackathonId}`, {
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
        total += score * (dim.weight / 100); // Assuming weight is percentage
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
        
        await axios.post('/api/v1/scores/', {
            project_id: selectedProject.id,
            score_value: Math.round(totalScore), // Backend expects int currently, might need to change to float or scale up
            comment: comment,
            details: JSON.stringify(scores) // Store detailed breakdown if backend supports it (need to check Score model)
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        alert('评分提交成功');
        setSelectedProject(null);
        setScores({});
        setComment('');
    } catch (err) {
        console.error(err);
        alert('评分提交失败');
    } finally {
        setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl p-0 relative h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">评审: {hackathonTitle}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Project List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">待评审项目</h3>
                {loading ? (
                    <div>加载中...</div>
                ) : (
                    <div className="space-y-3">
                        {projects.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedProject(p)}
                                className={`p-4 rounded-lg cursor-pointer border transition ${selectedProject?.id === p.id ? 'bg-white border-blue-500 shadow-md dark:bg-gray-800' : 'bg-white border-gray-200 hover:border-blue-300 dark:bg-gray-800 dark:border-gray-700'}`}
                            >
                                <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                                <div className="text-xs text-gray-500 mt-1 truncate">{p.description}</div>
                            </div>
                        ))}
                        {projects.length === 0 && <div className="text-gray-500 text-center py-4">暂无项目</div>}
                    </div>
                )}
            </div>

            {/* Scoring Area */}
            <div className="w-2/3 overflow-y-auto p-6 bg-white dark:bg-gray-800">
                {selectedProject ? (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold mb-2">{selectedProject.name}</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedProject.description}</p>
                            <div className="flex space-x-4 text-sm">
                                {selectedProject.repository_url && <a href={selectedProject.repository_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">代码仓库 ↗</a>}
                                {selectedProject.demo_url && <a href={selectedProject.demo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">演示 Demo ↗</a>}
                                {selectedProject.video_url && <a href={selectedProject.video_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">演示视频 ↗</a>}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h4 className="font-bold mb-4">评分</h4>
                            {dimensions.length > 0 ? (
                                <div className="space-y-4">
                                    {dimensions.map((dim, idx) => (
                                        <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-medium">{dim.name} <span className="text-xs text-gray-500 font-normal">({dim.weight}%)</span></span>
                                                <span className="font-bold text-blue-600">{scores[dim.name] || 0}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">{dim.description}</p>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={scores[dim.name] || 0} 
                                                onChange={e => handleScoreChange(dim.name, parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                                        <span>总分 (加权)</span>
                                        <span className="text-blue-600 text-2xl">{calculateTotal()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-50 text-yellow-800 rounded">该活动未设置详细评分维度，请直接打总分 (0-100)。</div>
                            )}
                            
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">评语</label>
                                <textarea 
                                    className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700 h-24" 
                                    value={comment} 
                                    onChange={e => setComment(e.target.value)} 
                                    placeholder="写下你的评价..."
                                />
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={submitScore} 
                                    disabled={submitting}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-medium"
                                >
                                    {submitting ? '提交中...' : '提交评分'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        <p>请从左侧选择一个项目开始评审</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
