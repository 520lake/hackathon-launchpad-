import { useState, useEffect } from 'react';
import axios from 'axios';

interface Hackathon {
  id: number;
  title: string;
  description: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  start_date: string;
  end_date: string;
  status: string;
  organizer_id: number;
}

interface HackathonListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHackathonSelect: (id: number) => void;
}

export default function HackathonListModal({ isOpen, onClose, onHackathonSelect }: HackathonListModalProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [themeFilter, setThemeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('hot');

  useEffect(() => {
    if (isOpen) {
      fetchHackathons();
    }
  }, [isOpen]);

  useEffect(() => {
    let result = [...hackathons];
    
    // Filter
    if (statusFilter !== 'all') {
      result = result.filter(h => h.status === statusFilter);
    }
    if (themeFilter) {
      result = result.filter(h => h.theme_tags?.toLowerCase().includes(themeFilter.toLowerCase()));
    }
    if (levelFilter) {
      result = result.filter(h => h.professionalism_tags?.toLowerCase().includes(levelFilter.toLowerCase()));
    }
    
    // Sort
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    } else if (sortOrder === 'hot') {
        // Prioritize ONGOING, then PUBLISHED, then others
        // Within same status, sort by start_date newest
        const statusPriority: {[key: string]: number} = { 'ongoing': 3, 'published': 2, 'ended': 1, 'draft': 0 };
        result.sort((a, b) => {
            const pA = statusPriority[a.status] || 0;
            const pB = statusPriority[b.status] || 0;
            if (pA !== pB) return pB - pA;
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });
    }
    
    setFilteredHackathons(result);
  }, [hackathons, statusFilter, themeFilter, levelFilter, sortOrder]);

  const fetchHackathons = async () => {
    setLoading(true);
    // setError('');
    try {
      const response = await axios.get('/api/v1/hackathons/');
      setHackathons(response.data);
    } catch (err) {
      console.error(err);
      // setError('获取活动列表失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl p-0 relative transform transition-all h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-2xl z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">探索黑客松</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        
        {/* Filters */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
            <select 
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
            >
                <option value="all">所有状态</option>
                <option value="published">已发布</option>
                <option value="ongoing">进行中</option>
                <option value="ended">已结束</option>
            </select>
            
            <input 
                type="text" 
                placeholder="筛选主题 (如 Web3)" 
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 w-40"
                value={themeFilter}
                onChange={e => setThemeFilter(e.target.value)}
            />

            <input 
                type="text" 
                placeholder="筛选专业度" 
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 w-32"
                value={levelFilter}
                onChange={e => setLevelFilter(e.target.value)}
            />

            <select 
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 ml-auto"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
            >
                <option value="hot">热门推荐 (进行中优先)</option>
                <option value="newest">最新发布</option>
                <option value="oldest">最早发布</option>
            </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredHackathons.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-lg">暂无符合条件的活动。</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredHackathons.map((hackathon) => (
                        <div 
                            key={hackathon.id} 
                            className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition cursor-pointer flex flex-col"
                            onClick={() => {
                                onHackathonSelect(hackathon.id);
                                onClose();
                            }}
                        >
                            <div className="h-40 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                {hackathon.cover_image ? (
                                    <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-80 group-hover:opacity-100 transition" />
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full backdrop-blur-md ${
                                        hackathon.status === 'published' ? 'bg-green-500/80 text-white' : 
                                        hackathon.status === 'ongoing' ? 'bg-blue-500/80 text-white' : 'bg-gray-500/80 text-white'
                                    }`}>
                                        {hackathon.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {hackathon.theme_tags?.split(',').slice(0, 2).map(tag => (
                                        <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">{tag}</span>
                                    ))}
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{hackathon.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{hackathon.description}</p>
                                
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                        <span>📅 {new Date(hackathon.start_date).toLocaleDateString()}</span>
                                        <span>Host #{hackathon.organizer_id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
