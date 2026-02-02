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
  lang: 'zh' | 'en';
}

export default function HackathonListModal({ isOpen, onClose, onHackathonSelect, lang }: HackathonListModalProps) {
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
      const response = await axios.get('/api/v1/hackathons');
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-surface border border-brand/20 card-brutal w-full max-w-6xl p-0 relative transform transition-all h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-brand/20 flex justify-between items-center bg-surface/50 z-10">
            <h2 className="text-3xl font-black text-ink tracking-tighter uppercase">
                <span className="text-brand mr-2">//</span>
                {lang === 'zh' ? '探索网络' : 'EXPLORE NETWORK'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-brand text-xl">✕</button>
        </div>
        
        {/* Filters */}
        <div className="p-4 bg-void border-b border-brand/20 flex flex-wrap gap-4 items-center">
            <select 
                className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
            >
                <option value="all" className="bg-surface text-ink">所有状态</option>
                <option value="published" className="bg-surface text-ink">已发布</option>
                <option value="ongoing" className="bg-surface text-ink">进行中</option>
                <option value="ended" className="bg-surface text-ink">已结束</option>
            </select>
            
            <input 
                type="text" 
                placeholder="筛选主题 [例如: AI]" 
                className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm w-48 placeholder-gray-400"
                value={themeFilter}
                onChange={e => setThemeFilter(e.target.value)}
            />

            <input 
                type="text" 
                placeholder="筛选等级" 
                className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm w-40 placeholder-gray-400"
                value={levelFilter}
                onChange={e => setLevelFilter(e.target.value)}
            />

            <select 
                className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm ml-auto"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
            >
                <option value="hot" className="bg-surface text-ink">热度排序</option>
                <option value="newest" className="bg-surface text-ink">最新发布</option>
                <option value="oldest" className="bg-surface text-ink">最早发布</option>
            </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface/50">
            {loading ? (
                <div className="text-center py-20">
                    <div className="font-mono text-brand animate-pulse">正在加载数据...</div>
                </div>
            ) : filteredHackathons.length === 0 ? (
                <div className="text-center py-20 text-gray-500 font-mono">
                    <p className="text-lg">未发现活动信号。</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredHackathons.map((hackathon) => (
                        <div 
                            key={hackathon.id} 
                            className="group bg-void border border-brand/20 hover:border-brand transition-colors cursor-pointer flex flex-col relative overflow-hidden"
                            onClick={() => {
                                onHackathonSelect(hackathon.id);
                                onClose();
                            }}
                        >
                            <div className="h-40 bg-white/5 relative overflow-hidden flex items-center justify-center">
                                {hackathon.cover_image ? (
                                    <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-noise opacity-20" />
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                                        hackathon.status === 'published' ? 'border-green-500 text-green-500' :
                                        hackathon.status === 'ongoing' ? 'border-brand text-brand' :
                                        hackathon.status === 'ended' ? 'border-gray-500 text-gray-500' :
                                        'border-yellow-500 text-yellow-500'
                                    }`}>
                                        {hackathon.status === 'published' ? (lang === 'zh' ? '已发布' : 'PUBLISHED') : 
                                         hackathon.status === 'ongoing' ? (lang === 'zh' ? '进行中' : 'ONGOING') : 
                                         hackathon.status === 'ended' ? (lang === 'zh' ? '已结束' : 'ENDED') : (lang === 'zh' ? '草稿' : 'DRAFT')}
                                    </span>
                                </div>
                                {!hackathon.cover_image && (
                                    <span className="absolute text-6xl font-black text-white/5 group-hover:text-brand/20 transition-colors select-none">
                                        {hackathon.title.substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {hackathon.theme_tags?.split(',').slice(0, 2).map(tag => (
                                        <span key={tag} className="text-[10px] px-1 py-0.5 border border-brand/30 text-brand/80 font-mono uppercase">{tag}</span>
                                    ))}
                                </div>
                                
                                <h3 className="text-xl font-bold text-ink mb-2 line-clamp-1 group-hover:text-brand transition-colors">{hackathon.title}</h3>
                                <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-1 font-light">{hackathon.description}</p>
                                
                                <div className="pt-4 border-t border-white/5 mt-auto">
                                    <div className="flex justify-between items-center text-xs font-mono text-gray-500">
                                        <span>日期: {new Date(hackathon.start_date).toLocaleDateString()}</span>
                                        <span className="group-hover:text-brand transition-colors">访问终端 &gt;&gt;</span>
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
