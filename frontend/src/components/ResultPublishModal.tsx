import { useState, useEffect } from 'react';
import axios from 'axios';

interface ResultPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
  total_score?: number; // Need to fetch scores
}

interface Winner {
  project_id: number;
  project_name: string;
  award_name: string;
  comment?: string;
}

export default function ResultPublishModal({ isOpen, onClose, hackathonId }: ResultPublishModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  // const [loading, setLoading] = useState(false);
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
    // setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch projects
      const resProjects = await axios.get(`/api/v1/projects/?hackathon_id=${hackathonId}`, {
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

      // TODO: Fetch scores for ranking (Simulated for now or need endpoint)
      // For now just list projects. 
      setProjects(resProjects.data);
      
    } catch (err) {
      console.error(err);
    } finally {
      // setLoading(false);
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
      if (winners.length === 0 && !window.confirm("确定不设置任何奖项直接发布结果吗？")) {
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
          
          alert('结果发布成功！活动已结束。');
          onClose();
      } catch (err) {
          console.error(err);
          alert('发布失败');
      } finally {
          setSubmitting(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl p-0 relative transform transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">发布活动结果</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Add Winner Form */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">添加获奖名单</h3>
                <div>
                    <label className="block text-sm font-medium mb-1">选择作品</label>
                    <select 
                        className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
                        value={selectedProjectId || ''}
                        onChange={e => setSelectedProjectId(Number(e.target.value))}
                    >
                        <option value="">请选择获奖作品...</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">奖项名称</label>
                    <input 
                        type="text" 
                        className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
                        placeholder="例如：一等奖、最具创意奖"
                        value={awardName}
                        onChange={e => setAwardName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">评语 (可选)</label>
                    <textarea 
                        className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700 h-20"
                        placeholder="获奖理由..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </div>
                <button 
                    onClick={addWinner}
                    disabled={!selectedProjectId || !awardName}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    添加至名单
                </button>
            </div>

            {/* Winners List */}
            {winners.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">已添加名单 ({winners.length})</h3>
                    <div className="space-y-3">
                        {winners.map((w, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex justify-between items-center shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">{w.award_name}</span>
                                        <span className="font-bold">{w.project_name}</span>
                                    </div>
                                    {w.comment && <p className="text-sm text-gray-500 mt-1">{w.comment}</p>}
                                </div>
                                <button onClick={() => removeWinner(idx)} className="text-red-500 hover:text-red-700 text-sm">删除</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
            <button 
                onClick={handlePublish} 
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md flex items-center gap-2"
            >
                {submitting ? '发布中...' : '确认发布结果'}
            </button>
        </div>
      </div>
    </div>
  );
}
