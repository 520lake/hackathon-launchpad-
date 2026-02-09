import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';

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
  initialMode?: 'list' | 'ai';
}

export default function HackathonListModal({ isOpen, onClose, onHackathonSelect, lang, initialMode = 'list' }: HackathonListModalProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [themeFilter, setThemeFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('hot');

  // AI Search
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState<{matches: any[], summary: string} | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHackathons();
      if (initialMode === 'ai') {
        setIsAIMode(true);
      } else {
        setIsAIMode(false);
      }
      
      // Global Modal Slide-In
      if (modalRef.current) {
        gsap.set(modalRef.current, { x: '100%' });
        gsap.to(modalRef.current, {
            x: '0%',
            duration: 0.8,
            ease: "power4.out",
        });
      }
    }
  }, [isOpen, initialMode]);

  // Mode Switch Animation
  useEffect(() => {
      if (!isOpen || !containerRef.current) return;
      
      // Animate content when mode changes
      const ctx = gsap.context(() => {
          gsap.fromTo(containerRef.current!.children,
              { opacity: 0, y: 15, filter: 'blur(5px)' },
              { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, delay: 0.2, ease: "power2.out", stagger: 0.1 }
          );
      }, containerRef);
      
      return () => ctx.revert();
  }, [isAIMode, isOpen]);

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

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResults(null);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post('api/v1/ai/search-hackathons', { query: aiQuery }, {
             headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setAiResults(res.data);
    } catch (e) {
        console.error(e);
    } finally {
        setAiLoading(false);
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

  const handleClose = () => {
      // Exit Animation
      if (modalRef.current) {
          gsap.to(modalRef.current, {
              x: '100%',
              duration: 0.5,
              ease: "power3.in",
              onComplete: onClose
          });
      } else {
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div ref={modalRef} className="fixed inset-0 z-[200] bg-void overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="h-20 border-b border-brand/20 bg-surface/90 backdrop-blur-md flex items-center px-4 md:px-8 justify-between z-20 sticky top-0">
          <div className="flex items-center gap-4">
              <button 
                  onClick={handleClose} 
                  className="w-10 h-10 border border-brand/30 flex items-center justify-center text-brand hover:bg-brand hover:text-black transition-colors"
              >
                  ←
              </button>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic hidden md:block">
                  <span className="text-brand mr-2">◈</span>
                  {lang === 'zh' ? '全域活动网络' : 'GLOBAL EVENT NETWORK'}
              </h2>
          </div>
          
          {/* AI Toggle */}
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsAIMode(!isAIMode)}
                className={`px-4 py-2 font-mono text-sm font-bold border transition-all flex items-center gap-2 ${
                    isAIMode 
                    ? 'bg-brand text-black border-brand' 
                    : 'bg-transparent text-brand border-brand/30 hover:border-brand'
                }`}
            >
                <span>🤖</span>
                {lang === 'zh' ? 'AI 导览' : 'AI GUIDE'}
            </button>
            <div className="font-mono text-brand/50 text-xs hidden lg:block border-l border-brand/20 pl-4">
                SYSTEM STATUS: ONLINE
            </div>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Filters - Hide in AI Mode */}
          {!isAIMode && (
          <div className="w-80 border-r border-brand/20 bg-black/40 p-6 flex flex-col gap-8 overflow-y-auto hidden md:flex shrink-0 animate-in slide-in-from-left duration-500">
              <div>
                  <h3 className="text-brand font-bold font-mono text-xs uppercase tracking-widest mb-4">
                      {lang === 'zh' ? '状态筛选' : 'FILTER BY STATUS'}
                  </h3>
                  <div className="space-y-1">
                      {['all', 'published', 'ongoing', 'ended'].map(status => (
                          <button
                              key={status}
                              onClick={() => setStatusFilter(status)}
                              className={`w-full text-left px-4 py-3 font-mono text-sm tracking-wider transition-all duration-300 border-l-2 relative overflow-hidden group ${
                                  statusFilter === status 
                                  ? 'border-brand bg-brand/10 text-white pl-6' 
                                  : 'border-transparent text-gray-500 hover:text-white hover:pl-6 hover:border-brand/50'
                              }`}
                          >
                              <span className="relative z-10 group-hover:tracking-widest transition-all duration-300 font-bold">
                                  {statusFilter === status && '> '}
                                  {status === 'all' && (lang === 'zh' ? '全部' : 'ALL')}
                                  {status === 'published' && (lang === 'zh' ? '即将开始' : 'UPCOMING')}
                                  {status === 'ongoing' && (lang === 'zh' ? '进行中' : 'ONGOING')}
                                  {status === 'ended' && (lang === 'zh' ? '已结束' : 'ENDED')}
                              </span>
                              {statusFilter === status && <div className="absolute inset-0 bg-brand/5 z-0 animate-pulse"></div>}
                          </button>
                      ))}
                  </div>
              </div>

              <div>
                  <h3 className="text-brand font-bold font-mono text-xs uppercase tracking-widest mb-4">
                      {lang === 'zh' ? '形式筛选' : 'FILTER BY FORMAT'}
                  </h3>
                  <div className="space-y-1">
                      {['all', 'online', 'offline'].map(format => (
                          <button
                              key={format}
                              onClick={() => setFormatFilter(format)}
                              className={`w-full text-left px-4 py-3 font-mono text-sm tracking-wider transition-all duration-300 border-l-2 relative overflow-hidden group ${
                                  formatFilter === format 
                                  ? 'border-brand bg-brand/10 text-white pl-6' 
                                  : 'border-transparent text-gray-500 hover:text-white hover:pl-6 hover:border-brand/50'
                              }`}
                          >
                              <span className="relative z-10 group-hover:tracking-widest transition-all duration-300 font-bold">
                                  {formatFilter === format && '> '}
                                  {format === 'all' && (lang === 'zh' ? '全部' : 'ALL')}
                                  {format === 'online' && (lang === 'zh' ? '线上' : 'ONLINE')}
                                  {format === 'offline' && (lang === 'zh' ? '线下' : 'OFFLINE')}
                              </span>
                              {formatFilter === format && <div className="absolute inset-0 bg-brand/5 z-0 animate-pulse"></div>}
                          </button>
                      ))}
                  </div>
              </div>

              <div>
                  <h3 className="text-brand font-bold font-mono text-xs uppercase tracking-widest mb-4">
                      {lang === 'zh' ? '搜索主题' : 'SEARCH THEME'}
                  </h3>
                  <input 
                      type="text" 
                      placeholder="AI, Web3, DeFi..."
                      className="w-full bg-black/50 border border-brand/30 px-4 py-3 text-white font-mono text-sm focus:border-brand focus:outline-none transition-colors hover:border-brand/50"
                      value={themeFilter}
                      onChange={e => setThemeFilter(e.target.value)}
                  />
              </div>
          </div>
          )}

          {/* Main Content */}
          <div 
            className="flex-1 bg-void overflow-y-auto p-4 md:p-8 custom-scrollbar relative cursor-default" 
            ref={containerRef}
            onClick={() => isAIMode && setIsAIMode(false)}
          >
               
               {isAIMode ? (
                   <div 
                    className="max-w-4xl mx-auto h-full flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                   >
                       <div className="text-center mb-8 animate-in fade-in zoom-in duration-500">
                           <h3 className="text-4xl font-black text-white italic mb-2">
                               AI <span className="text-brand">NEXUS</span>
                           </h3>
                           <p className="text-gray-400 font-mono text-sm">
                               {lang === 'zh' ? '告诉我你感兴趣的方向，AI 将为你推荐最适合的挑战赛。' : 'Tell me your interests, and AI will guide you to the perfect challenge.'}
                           </p>
                       </div>

                       {/* Search Input */}
                       <div className="mb-8 relative group">
                           <div className="absolute -inset-1 bg-gradient-to-r from-brand to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                           <div className="relative flex">
                               <input 
                                   type="text"
                                   value={aiQuery}
                                   onChange={e => setAiQuery(e.target.value)}
                                   onKeyDown={e => e.key === 'Enter' && handleAISearch()}
                                   placeholder={lang === 'zh' ? "例如：我想参加一个在上海举办的AI相关的比赛..." : "e.g. I want to join an AI hackathon in Shanghai..."}
                                   className="w-full bg-black border border-brand/50 text-white px-6 py-4 text-lg font-mono focus:outline-none focus:border-brand placeholder-gray-600"
                               />
                               <button 
                                   onClick={handleAISearch}
                                   disabled={aiLoading}
                                   className="bg-brand text-black px-8 font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                   {aiLoading ? '...' : 'SEND'}
                               </button>
                           </div>
                       </div>

                       {/* Results */}
                       {aiResults && (
                           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                               {/* Summary Bubble */}
                               <div className="flex gap-4">
                                   <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand border border-brand/50 shrink-0">🤖</div>
                                   <div className="bg-white/5 border border-white/10 p-6 rounded-r-xl rounded-bl-xl text-gray-200 leading-relaxed">
                                       {aiResults.summary}
                                   </div>
                               </div>

                               {/* Matches Grid */}
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
                                   {aiResults.matches.map((match: any) => {
                                       const h = hackathons.find(h => h.id === match.id);
                                       if (!h) return null;
                                       return (
                                           <div key={h.id} 
                                                onClick={() => onHackathonSelect(h.id)}
                                                className="bg-black/40 border border-brand/30 hover:border-brand p-4 cursor-pointer group transition-all hover:-translate-y-1">
                                               <div className="flex justify-between items-start mb-2">
                                                   <h4 className="font-bold text-white group-hover:text-brand truncate pr-2">{h.title}</h4>
                                                   <span className="text-xs font-mono text-brand border border-brand/30 px-1">{h.format}</span>
                                               </div>
                                               <p className="text-xs text-gray-500 mb-3 line-clamp-2">{match.reason}</p>
                                               <div className="text-xs font-mono text-gray-600">
                                                   {new Date(h.start_date).toLocaleDateString()}
                                               </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       )}
                   </div>
               ) : (
                   <div className="max-w-full">
                       {/* Standard List View */}
                       {/* Mobile Filters (Simplified) */}
                       <div className="md:hidden mb-6 flex flex-col gap-4">
                           <div className="flex gap-2 overflow-x-auto pb-2">
                               {/* Status Select */}
                               <div className="relative">
                                    <select 
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="appearance-none bg-black border border-brand/30 text-white pl-3 pr-8 py-2 text-xs font-mono uppercase focus:border-brand focus:outline-none"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="published">Upcoming</option>
                                        <option value="ended">Ended</option>
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-brand pointer-events-none text-xs">▼</div>
                               </div>
                               {/* Format Select */}
                               <div className="relative">
                                    <select 
                                        value={formatFilter}
                                        onChange={e => setFormatFilter(e.target.value)}
                                        className="appearance-none bg-black border border-brand/30 text-white pl-3 pr-8 py-2 text-xs font-mono uppercase focus:border-brand focus:outline-none"
                                    >
                                        <option value="all">All Format</option>
                                        <option value="online">Online</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-brand pointer-events-none text-xs">▼</div>
                               </div>
                           </div>
                           {/* Mobile Search */}
                           <input 
                               type="text" 
                               placeholder={lang === 'zh' ? "搜索..." : "Search..."}
                               className="w-full bg-black/50 border border-brand/30 px-3 py-2 text-white font-mono text-xs focus:border-brand focus:outline-none"
                               value={themeFilter}
                               onChange={e => setThemeFilter(e.target.value)}
                           />
                       </div>

                       {/* Sort Bar */}
                       <div className="flex justify-end mb-6">
                           <div className="flex items-center gap-2">
                               <span className="text-gray-500 text-xs font-mono uppercase">{lang === 'zh' ? '排序:' : 'SORT:'}</span>
                               <select 
                                   value={sortOrder}
                                   onChange={e => setSortOrder(e.target.value)}
                                   className="bg-transparent text-brand border-none font-bold text-sm focus:ring-0 cursor-pointer"
                               >
                                   <option value="hot">HOT 🔥</option>
                                   <option value="newest">NEWEST</option>
                                   <option value="ending_soon">ENDING SOON</option>
                               </select>
                           </div>
                       </div>

                      {loading ? (
                        <div className="text-center py-32">
                          <div className="inline-block w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                          <div className="mt-4 font-mono text-brand animate-pulse">LOADING DATA_STREAM...</div>
                        </div>
                      ) : filteredHackathons.length === 0 ? (
                        <div className="text-center py-32 border border-dashed border-gray-800 rounded-lg">
                            <div className="text-6xl mb-4">📡</div>
                            <p className="text-xl text-gray-500 font-mono">NO SIGNALS FOUND.</p>
                        </div>
                      ) : (
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                          {filteredHackathons.map((hackathon, idx) => {
                            const prizeInfo = getPrizeInfo(hackathon.awards_detail);
                            const keyTime = getKeyTime(hackathon);
                            
                            return (
                              <div 
                                key={hackathon.id} 
                                className="group bg-surface border border-gray-800 hover:border-brand transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden h-[450px] hover:shadow-[0_0_30px_rgba(212,163,115,0.1)] hover:-translate-y-2"
                                style={{ animationDelay: `${idx * 50}ms` }}
                                onClick={() => {
                                    onHackathonSelect(hackathon.id);
                                }}
                              >
                                {/* Status Badge */}
                                <div className="absolute top-4 left-4 z-10">
                                    {(() => {
                                        const now = new Date();
                                        const regStart = hackathon.registration_start_date ? new Date(hackathon.registration_start_date) : null;
                                        const regEnd = hackathon.registration_end_date ? new Date(hackathon.registration_end_date) : null;
                                        const isRegOpen = regStart && regEnd && now >= regStart && now <= regEnd;
                                        
                                        let statusLabel = '';
                                        let statusColor = '';
                                
                                if (hackathon.status === 'ended') {
                                    statusLabel = lang === 'zh' ? '已结束' : 'ENDED';
                                    statusColor = 'bg-gray-800 text-gray-400';
                                } else if (isRegOpen) {
                                    statusLabel = lang === 'zh' ? '正在报名' : 'REG OPEN';
                                    statusColor = 'bg-green-600 text-white';
                                } else if (hackathon.status === 'ongoing') {
                                    statusLabel = lang === 'zh' ? '进行中' : 'ONGOING';
                                    statusColor = 'bg-brand text-black';
                                } else if (hackathon.status === 'published') {
                                    statusLabel = lang === 'zh' ? '即将开始' : 'UPCOMING';
                                    statusColor = 'bg-blue-600 text-white';
                                } else {
                                    statusLabel = lang === 'zh' ? '草稿' : 'DRAFT';
                                    statusColor = 'bg-yellow-600 text-white';
                                }
                                
                                return (
                                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 shadow-lg ${statusColor}`}>
                                        {statusLabel}
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Image */}
                        <div className="h-56 bg-black relative overflow-hidden">
                            {hackathon.cover_image ? (
                                <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-noise opacity-20" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-80"></div>
                            
                            {/* Format Badge */}
                            <div className="absolute bottom-4 left-4 flex gap-2">
                                {hackathon.format && (
                                    <span className="text-xs px-2 py-1 bg-black/50 backdrop-blur border border-white/20 text-white font-mono uppercase">
                                        {hackathon.format === 'online' ? '🌐' : '📍'} {hackathon.format === 'online' ? (lang === 'zh' ? '线上' : 'ONLINE') : (lang === 'zh' ? '线下' : 'OFFLINE')}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col relative bg-surface">
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-brand transition-colors">
                                {hackathon.title}
                            </h3>
                            
                            <div className="flex gap-2 mb-4 flex-wrap">
                                {hackathon.theme_tags?.split(',').slice(0, 3).map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 font-mono uppercase border border-white/10">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-auto space-y-3 pt-4 border-t border-dashed border-gray-800">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-mono text-xs uppercase">{keyTime.label}</span>
                                    <span className="text-brand font-mono font-bold">{keyTime.time}</span>
                                </div>
                                {prizeInfo && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-mono text-xs uppercase">{lang === 'zh' ? '奖池' : 'PRIZE POOL'}</span>
                                        <span className="text-white font-bold">{prizeInfo}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Hover Overlay Line */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-brand transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      </div>
                            );
                          })}
                        </div>
                      )}
                   </div>
               )}
          </div>
      </div>
    </div>
  );
}
