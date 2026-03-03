import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import type { Hackathon } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import HackathonCard from '../components/HackathonCard'; // Import the new card
import { useUI } from '../contexts/UIContext';

export default function HackathonListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useUI();
  
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(false);
  
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
    const mode = searchParams.get('mode');
    if (mode === 'ai') {
      setIsAIMode(true);
    } else {
      setIsAIMode(false);
    }
    fetchHackathons();
  }, [searchParams]);

  useEffect(() => {
    let result = [...hackathons];
    
    // Filter
    if (statusFilter !== 'all') {
      const now = new Date().getTime();
      result = result.filter(h => {
        const regStart = h.registration_start_date ? new Date(h.registration_start_date).getTime() : 0;
        const regEnd = h.registration_end_date ? new Date(h.registration_end_date).getTime() : 0;
        const actStart = new Date(h.start_date).getTime();
        const actEnd = new Date(h.end_date).getTime();

        if (statusFilter === 'registering') {
          return now >= regStart && now <= regEnd;
        } else if (statusFilter === 'ongoing') {
           return now >= actStart && now <= actEnd;
        } else if (statusFilter === 'ended') {
          return now > actEnd;
        } else if (statusFilter === 'upcoming') {
           return now < regStart;
        }
        return true;
      });
    }

    if (themeFilter) {
      result = result.filter(h => 
        h.title.toLowerCase().includes(themeFilter.toLowerCase()) ||
        (h.theme_tags && h.theme_tags.toLowerCase().includes(themeFilter.toLowerCase()))
      );
    }

    if (formatFilter !== 'all') {
       result = result.filter(h => h.format === formatFilter);
    }

    // Sort
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    } else if (sortOrder === 'hot') {
      // Mock hot: random or based on ID
       result.sort((a, b) => b.id - a.id);
    }

    setFilteredHackathons(result);
  }, [hackathons, statusFilter, themeFilter, formatFilter, sortOrder]);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      // Use relative path via Vite proxy
      const response = await axios.get('/api/v1/hackathons/');
      setHackathons(response.data);
      setFilteredHackathons(response.data);
    } catch (error) {
      console.error("Failed to fetch hackathons", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const response = await axios.post('/api/v1/ai/search-hackathons', {
        query: aiQuery
      });
      setAiResults(response.data);
    } catch (error) {
      console.error("AI Search failed", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white uppercase tracking-tighter mb-2 flex items-center gap-2">
              <span className="text-[#D4A373]">//</span>
              {lang === 'zh' ? '探索网络' : 'Explore Network'}
            </h1>
            <p className="text-gray-500 font-mono text-sm ml-8">
              {lang === 'zh' ? '浏览并筛选所有黑客松活动。' : 'Browse and filter all hackathon events.'}
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="relative">
                 <input 
                    type="text" 
                    placeholder={lang === 'zh' ? "搜索黑客松..." : "Search hackathons..."}
                    className="bg-[#1A1A1A] border border-white/10 text-white px-4 py-2 rounded text-sm w-64 focus:border-[#D4A373] outline-none"
                    value={themeFilter}
                    onChange={(e) => setThemeFilter(e.target.value)}
                 />
                 <span className="absolute right-3 top-2.5 text-gray-500">🔍</span>
             </div>
             <div className="relative group">
                 <button className="bg-[#1A1A1A] border border-white/10 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:border-[#D4A373]">
                     {lang === 'zh' ? '为你推荐' : 'For You'}
                     <span className="text-[10px]">▼</span>
                 </button>
             </div>
          </div>
        </div>

        {/* AI Mode Content */}
        {isAIMode ? (
           <div className="animate-fade-in">
             {/* ... AI content remains same style or updated if needed ... */}
             <Card className="mb-8 p-8 border-brand/30 bg-void/50 backdrop-blur-sm">
                {/* Simplified AI Mode for brevity in this update, keeping logic */}
                <div className="max-w-2xl mx-auto text-center">
                  <h2 className="text-2xl font-bold text-brand mb-4 font-mono">
                    {lang === 'zh' ? 'AI 智能赛事匹配' : 'AI Smart Match'}
                  </h2>
                  <textarea 
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="w-full h-32 bg-black border border-white/20 p-4 text-white focus:border-[#D4A373] outline-none transition-all resize-none font-mono text-sm"
                  />
                   <Button onClick={handleAISearch} disabled={aiLoading} className="mt-4">
                         {aiLoading ? 'Analyzing...' : 'Start Match'}
                   </Button>
                </div>
             </Card>
           </div>
        ) : (
          /* List Mode Content */
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
               
               {/* Header */}
               <div className="flex justify-between items-center text-white border-b border-white/10 pb-4">
                   <span className="font-bold">{lang === 'zh' ? '筛选' : 'Filters'}</span>
                   <button className="text-xs text-gray-500 hover:text-white">✕</button>
               </div>

               {/* Status Filter */}
               <div className="space-y-3">
                 <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">{lang === 'zh' ? '状态' : 'Status'}</label>
                 <div className="space-y-2">
                    {[
                        { val: 'registering', label: lang === 'zh' ? '即将开始' : 'Registering', color: 'bg-[#007AFF]' },
                        { val: 'ongoing', label: lang === 'zh' ? '进行中' : 'Ongoing', color: 'bg-[#34C759]' },
                        { val: 'ended', label: lang === 'zh' ? '已结束' : 'Ended', color: 'bg-[#8E8E93]' }
                    ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center transition-colors ${statusFilter === opt.val ? 'bg-[#D4A373] border-[#D4A373] text-black' : 'bg-transparent'}`}>
                                {statusFilter === opt.val && <span className="text-xs font-bold">✓</span>}
                            </div>
                            <input 
                                type="radio" 
                                name="status" 
                                value={opt.val}
                                checked={statusFilter === opt.val}
                                onChange={(e) => setStatusFilter(statusFilter === opt.val ? 'all' : e.target.value)} // Toggle off
                                className="hidden"
                            />
                            <div className={`w-8 h-4 rounded-full ${opt.color} text-[10px] flex items-center justify-center text-black font-bold`}>
                                {opt.label.substring(0,1)}
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{opt.label}</span>
                        </label>
                    ))}
                 </div>
               </div>
               
               {/* Type Filter */}
               <div className="space-y-3">
                 <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">{lang === 'zh' ? '活动类型' : 'Activity Type'}</label>
                 <div className="space-y-2">
                   {['offline', 'online', 'hybrid'].map(opt => (
                     <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                       <div className={`w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center transition-colors ${formatFilter === opt ? 'bg-[#D4A373] border-[#D4A373] text-black' : 'bg-transparent'}`}>
                            {formatFilter === opt && <span className="text-xs font-bold">✓</span>}
                       </div>
                       <input 
                         type="radio" 
                         name="format" 
                         value={opt}
                         checked={formatFilter === opt}
                         onChange={(e) => setFormatFilter(formatFilter === opt ? 'all' : e.target.value)}
                         className="hidden" 
                       />
                       <span className="text-sm text-gray-400 group-hover:text-white transition-colors capitalize">
                         {opt === 'hybrid' ? (lang === 'zh' ? '混合' : 'Hybrid') : 
                          opt === 'online' ? (lang === 'zh' ? '线上' : 'Online') : 
                          (lang === 'zh' ? '线下' : 'Offline')}
                       </span>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Location (Mock Dropdown) */}
               <div className="space-y-3">
                   <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">{lang === 'zh' ? '地点' : 'Location'}</label>
                   <div className="bg-[#1A1A1A] border border-white/10 p-2 rounded flex justify-between items-center cursor-pointer hover:border-white/30">
                       <span className="text-sm text-gray-400">{lang === 'zh' ? '选择地点' : 'Select Location'}</span>
                       <span className="text-xs text-gray-600">▼</span>
                   </div>
               </div>

               {/* Tags (Mock Dropdown) */}
               <div className="space-y-3">
                   <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">{lang === 'zh' ? '标签' : 'Tags'}</label>
                   <div className="bg-[#1A1A1A] border border-white/10 p-2 rounded flex justify-between items-center cursor-pointer hover:border-white/30">
                       <span className="text-sm text-gray-400">{lang === 'zh' ? '选择标签' : 'Select Tags'}</span>
                       <span className="text-xs text-gray-600">▼</span>
                   </div>
               </div>

            </div>

            {/* Main List */}
            <div className="flex-1">
               <div className="flex justify-between items-center mb-4 text-xs text-gray-500">
                   <span>{lang === 'zh' ? `共 ${filteredHackathons.length} 个结果` : `${filteredHackathons.length} Results`}</span>
               </div>

               {loading ? (
                 <div className="text-center py-20">
                   <div className="inline-block animate-spin w-8 h-8 border-2 border-[#D4A373] border-t-transparent rounded-full mb-4"></div>
                   <p className="text-gray-500 font-mono">LOADING DATA...</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-4">
                   {filteredHackathons.map(hackathon => (
                     <HackathonCard 
                       key={hackathon.id}
                       hackathon={hackathon}
                     />
                   ))}
                 </div>
               )}
               
               {!loading && filteredHackathons.length === 0 && (
                 <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                   <p className="text-gray-500 font-mono">NO DATA FOUND</p>
                 </div>
               )}
               
               <div className="mt-8 text-center">
                   <button className="text-gray-500 hover:text-white text-sm transition-colors">
                       {lang === 'zh' ? '加载更多...' : 'Load More...'}
                   </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
