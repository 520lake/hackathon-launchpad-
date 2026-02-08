import { useState, useEffect } from 'react';
import axios from 'axios';

interface Hackathon {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  cover_image?: string;
  theme_tags?: string;
  professionalism_tags?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  status: string;
  organizer_id: number;
  organizer_name?: string;
  format?: 'online' | 'offline';
  registration_type?: 'individual' | 'team';
  awards_detail?: string;
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
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [themeFilter, setThemeFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
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
    if (formatFilter !== 'all') {
      result = result.filter(h => h.format === formatFilter);
    }
    if (themeFilter) {
      result = result.filter(h => h.theme_tags?.toLowerCase().includes(themeFilter.toLowerCase()));
    }
    
    // Sort
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    } else if (sortOrder === 'ending_soon') {
      const now = new Date().getTime();
      result = result.filter(h => new Date(h.end_date).getTime() > now);
      result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
    } else if (sortOrder === 'hot') {
        // Prioritize ONGOING, then PUBLISHED, then others
        const statusPriority: {[key: string]: number} = { 'ongoing': 3, 'published': 2, 'ended': 1, 'draft': 0 };
        result.sort((a, b) => {
            const pA = statusPriority[a.status] || 0;
            const pB = statusPriority[b.status] || 0;
            if (pA !== pB) return pB - pA;
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });
    }
    
    setFilteredHackathons(result);
  }, [hackathons, statusFilter, themeFilter, formatFilter, sortOrder]);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const response = await axios.get('api/v1/hackathons');
      setHackathons(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPrizeInfo = (detailStr?: string) => {
      if (!detailStr) return null;
      try {
          const awards = JSON.parse(detailStr);
          if (Array.isArray(awards) && awards.length > 0) {
              // Try to find cash awards
    const cashAwards = awards.filter((a: any) => a.type === 'cash' || (a.amount && a.amount > 0));
    if (cashAwards.length > 0) {
        const total = cashAwards.reduce((sum: number, a: any) => sum + (Number(a.amount) * Number(a.count)), 0);
        if (total > 0) return `¥${total.toLocaleString()}`;
    }
    // Fallback to first award name or count of awards
    if (awards[0]?.name) return awards[0].name;
    return `${awards.length} Awards`;
          }
      } catch (e) {
          // If string, return as is (truncated)
          return detailStr.length > 20 ? detailStr.substring(0, 20) + '...' : detailStr;
      }
      return null;
  };

  const getKeyTime = (h: Hackathon) => {
      const now = new Date();
      // If registration is open, show registration deadline
      if (h.registration_start_date && h.registration_end_date) {
          const regEnd = new Date(h.registration_end_date);
          if (now < regEnd) {
              return { label: lang === 'zh' ? '报名截止' : 'REG DEADLINE', time: regEnd.toLocaleDateString() };
          }
      }
      // Default to start date
      return { label: lang === 'zh' ? '开始时间' : 'START DATE', time: new Date(h.start_date).toLocaleDateString() };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-surface border border-brand/20 card-brutal w-full max-w-7xl p-0 relative transform transition-all h-[90vh] flex flex-col">
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
                <option value="all" className="bg-surface text-ink">{lang === 'zh' ? '所有状态' : 'All Status'}</option>
                <option value="published" className="bg-surface text-ink">{lang === 'zh' ? '即将开始' : 'Upcoming'}</option>
                <option value="ongoing" className="bg-surface text-ink">{lang === 'zh' ? '进行中' : 'Ongoing'}</option>
                <option value="ended" className="bg-surface text-ink">{lang === 'zh' ? '已结束' : 'Ended'}</option>
            </select>

            <select 
                className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm"
                value={formatFilter}
                onChange={e => setFormatFilter(e.target.value)}
            >
                <option value="all" className="bg-surface text-ink">{lang === 'zh' ? '所有形式' : 'All Formats'}</option>
                <option value="online" className="bg-surface text-ink">{lang === 'zh' ? '线上' : 'Online'}</option>
                <option value="offline" className="bg-surface text-ink">{lang === 'zh' ? '线下' : 'Offline'}</option>
            </select>
            
            <input 
                type="text" 
                placeholder={lang === 'zh' ? "筛选主题 [例如: AI]" : "Filter Theme [e.g. AI]"}
                className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm w-48 placeholder-gray-400"
                value={themeFilter}
                onChange={e => setThemeFilter(e.target.value)}
            />

            <select 
                className="px-3 py-2 bg-white/5 border border-white/10 text-ink rounded-none focus:border-brand outline-none font-mono text-sm ml-auto"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
            >
                <option value="hot" className="bg-surface text-ink">{lang === 'zh' ? '热度排序' : 'Hot'}</option>
                <option value="newest" className="bg-surface text-ink">{lang === 'zh' ? '最新发布' : 'Newest'}</option>
                <option value="ending_soon" className="bg-surface text-ink">{lang === 'zh' ? '即将截止' : 'Ending Soon'}</option>
                <option value="oldest" className="bg-surface text-ink">{lang === 'zh' ? '最早发布' : 'Oldest'}</option>
            </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface/50">
            {loading ? (
                <div className="text-center py-20">
                    <div className="font-mono text-brand animate-pulse">LOADING DATA_STREAM...</div>
                </div>
            ) : filteredHackathons.length === 0 ? (
                <div className="text-center py-20 text-gray-500 font-mono">
                    <p className="text-lg">NO SIGNALS FOUND.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredHackathons.map((hackathon) => {
                        const prizeInfo = getPrizeInfo(hackathon.awards_detail);
                        const keyTime = getKeyTime(hackathon);
                        
                        return (
                        <div 
                            key={hackathon.id} 
                            className="group bg-void border border-brand/20 hover:border-brand transition-colors cursor-pointer flex flex-col relative overflow-hidden h-[400px]"
                            onClick={() => {
                                onHackathonSelect(hackathon.id);
                                onClose();
                            }}
                        >
                            {/* Card Image */}
                            <div className="h-40 bg-white/5 relative overflow-hidden flex items-center justify-center border-b border-brand/10">
                                {hackathon.cover_image ? (
                                    <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-noise opacity-20" />
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {(() => {
                                        const now = new Date();
                                        const regStart = hackathon.registration_start_date ? new Date(hackathon.registration_start_date) : null;
                                        const regEnd = hackathon.registration_end_date ? new Date(hackathon.registration_end_date) : null;
                                        const isRegOpen = regStart && regEnd && now >= regStart && now <= regEnd;
                                        
                                        let statusLabel = '';
                                        let statusColor = '';
                                        
                                        if (hackathon.status === 'ended') {
                                            statusLabel = lang === 'zh' ? '已结束' : 'ENDED';
                                            statusColor = 'border-gray-500 text-gray-500';
                                        } else if (isRegOpen) {
                                            statusLabel = lang === 'zh' ? '正在报名' : 'REG OPEN';
                                            statusColor = 'border-green-500 text-green-500';
                                        } else if (hackathon.status === 'ongoing') {
                                            statusLabel = lang === 'zh' ? '进行中' : 'ONGOING';
                                            statusColor = 'border-brand text-brand';
                                        } else if (hackathon.status === 'published') {
                                            statusLabel = lang === 'zh' ? '即将开始' : 'UPCOMING';
                                            statusColor = 'border-blue-400 text-blue-400';
                                        } else {
                                            statusLabel = lang === 'zh' ? '草稿' : 'DRAFT';
                                            statusColor = 'border-yellow-500 text-yellow-500';
                                        }
                                        
                                        return (
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border bg-black/50 backdrop-blur-sm ${statusColor}`}>
                                                {statusLabel}
                                            </span>
                                        );
                                    })()}
                                </div>
                                {!hackathon.cover_image && (
                                    <span className="absolute text-6xl font-black text-white/5 group-hover:text-brand/20 transition-colors select-none">
                                        {hackathon.title.substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            
                            {/* Card Content */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-1 flex-wrap">
                                        {hackathon.format && (
                                            <span className="text-[9px] px-1 border border-gray-600 text-gray-400 font-mono uppercase">
                                                {hackathon.format === 'online' ? '🌐' : '📍'} {hackathon.format === 'online' ? (lang === 'zh' ? '线上' : 'ONLINE') : (lang === 'zh' ? '线下' : 'OFFLINE')}
                                            </span>
                                        )}
                                        {hackathon.professionalism_tags?.split(',').slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[9px] px-1 border border-brand/30 text-brand/60 font-mono uppercase">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    {prizeInfo && (
                                        <div className="text-xs text-brand font-bold font-mono bg-brand/10 px-2 py-0.5 rounded-sm">
                                            {prizeInfo.includes('¥') ? '💰 ' : '🏆 '}{prizeInfo}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-ink mb-1 line-clamp-1 group-hover:text-brand transition-colors">{hackathon.title}</h3>
                                {hackathon.subtitle && <p className="text-xs text-brand/80 mb-2 line-clamp-1 font-mono">{hackathon.subtitle}</p>}
                                
                                <div className="flex gap-1 mb-3 flex-wrap h-5 overflow-hidden">
                                    {hackathon.theme_tags?.split(',').slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[9px] px-1 bg-brand/5 text-brand/60 font-mono uppercase">#{tag}</span>
                                    ))}
                                </div>

                                <div className="mt-auto space-y-2 border-t border-white/5 pt-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500 font-mono">{lang === 'zh' ? '主办方' : 'HOST'}</span>
                                        <span className="text-ink truncate max-w-[120px]" title={hackathon.organizer_name}>{hackathon.organizer_name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500 font-mono">{keyTime.label}</span>
                                        <span className="text-gray-300 font-mono">{keyTime.time}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
