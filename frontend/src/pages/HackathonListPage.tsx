import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import type { Hackathon } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
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
      // Using relative URL assuming proxy is set up or base URL is configured
      // In development we might need full URL if proxy isn't set in Vite config
      const response = await axios.get('http://localhost:8000/api/hackathons/');
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
      const response = await axios.post('http://localhost:8000/api/hackathons/search/ai', {
        query: aiQuery,
        limit: 5
      });
      setAiResults(response.data);
    } catch (error) {
      console.error("AI Search failed", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-ink uppercase tracking-tighter mb-2">
              {lang === 'zh' ? '黑客松列表' : 'Hackathons'}
            </h1>
            <p className="text-ink/60 font-mono text-sm">
              {lang === 'zh' ? '// 探索全球顶尖黑客松赛事' : '// Explore Top Global Hackathons'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={!isAIMode ? 'primary' : 'outline'}
              onClick={() => setIsAIMode(false)}
            >
              {lang === 'zh' ? '列表模式' : 'List View'}
            </Button>
            <Button 
               variant={isAIMode ? 'primary' : 'outline'}
               onClick={() => setIsAIMode(true)}
               className="group"
            >
              <span className="mr-2 group-hover:animate-pulse">✨</span>
              {lang === 'zh' ? 'AI 匹配' : 'AI Match'}
            </Button>
          </div>
        </div>

        {/* AI Mode Content */}
        {isAIMode ? (
           <div className="animate-fade-in">
             <Card className="mb-8 p-8 border-brand/30 bg-void/50 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto text-center">
                  <h2 className="text-2xl font-bold text-brand mb-4 font-mono">
                    {lang === 'zh' ? 'AI 智能赛事匹配' : 'AI Smart Match'}
                  </h2>
                  <p className="text-ink/70 mb-6">
                    {lang === 'zh' 
                      ? '告诉我你的技能栈、感兴趣的领域或想要挑战的项目类型，AI 将为你推荐最适合的黑客松。' 
                      : 'Tell me your tech stack, interests, or project ideas. AI will find the perfect hackathon for you.'}
                  </p>
                  
                  <div className="relative">
                    <textarea 
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder={lang === 'zh' ? "例如：我擅长 React 和 Python，想参加一个关于 AI 代理或 Web3 的黑客松，最好是线上的..." : "e.g., I'm good at React and Python, looking for an AI Agent or Web3 hackathon, preferably online..."}
                      className="w-full h-32 bg-void border border-ink/20 p-4 text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all clip-path-slant resize-none font-mono text-sm"
                    />
                    <div className="absolute bottom-4 right-4">
                       <Button onClick={handleAISearch} disabled={aiLoading}>
                         {aiLoading ? (lang === 'zh' ? '分析中...' : 'Analyzing...') : (lang === 'zh' ? '开始匹配' : 'Start Match')}
                       </Button>
                    </div>
                  </div>
                </div>
             </Card>
             
             {aiResults && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Card className="p-4 border-brand/50 bg-brand/5">
                      <h3 className="text-brand font-bold mb-2 text-sm font-mono">:: AI ANALYSIS ::</h3>
                      <p className="text-ink/80">{aiResults.summary}</p>
                    </Card>
                  </div>
                  {aiResults.matches.map((match: any) => (
                    <Card 
                      key={match.id} 
                      className="hover:border-brand transition-colors cursor-pointer group"
                      onClick={() => navigate(`/hackathons/${match.id}`)}
                    >
                      <div className="p-6">
                         <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold group-hover:text-brand transition-colors">{match.title}</h3>
                            <span className="bg-brand/10 text-brand px-2 py-1 text-xs font-mono">{match.match_score}% MATCH</span>
                         </div>
                         <p className="text-ink/60 text-sm mb-4 line-clamp-2">{match.description}</p>
                         <div className="flex flex-wrap gap-2">
                            {match.reason && (
                              <span className="text-xs bg-ink/5 px-2 py-1 border border-ink/10 text-ink/70">
                                💡 {match.reason}
                              </span>
                            )}
                         </div>
                      </div>
                    </Card>
                  ))}
               </div>
             )}
           </div>
        ) : (
          /* List Mode Content */
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
               <div className="space-y-2">
                 <label className="text-xs font-mono text-ink/50 uppercase tracking-widest">{lang === 'zh' ? '搜索' : 'Search'}</label>
                 <Input 
                   placeholder={lang === 'zh' ? "关键词..." : "Keywords..."}
                   value={themeFilter}
                   onChange={(e) => setThemeFilter(e.target.value)}
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-mono text-ink/50 uppercase tracking-widest">{lang === 'zh' ? '状态' : 'Status'}</label>
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="w-full bg-void border border-ink/20 p-2 text-ink text-sm focus:border-brand outline-none"
                 >
                   <option value="all">{lang === 'zh' ? '全部状态' : 'All Status'}</option>
                   <option value="registering">{lang === 'zh' ? '报名中' : 'Registering'}</option>
                   <option value="ongoing">{lang === 'zh' ? '进行中' : 'Ongoing'}</option>
                   <option value="upcoming">{lang === 'zh' ? '即将开始' : 'Upcoming'}</option>
                   <option value="ended">{lang === 'zh' ? '已结束' : 'Ended'}</option>
                 </select>
               </div>
               
               <div className="space-y-2">
                 <label className="text-xs font-mono text-ink/50 uppercase tracking-widest">{lang === 'zh' ? '形式' : 'Format'}</label>
                 <div className="flex flex-col gap-2">
                   {['all', 'online', 'offline'].map(opt => (
                     <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                       <div className={`w-4 h-4 border ${formatFilter === opt ? 'bg-brand border-brand' : 'border-ink/30 group-hover:border-brand'} flex items-center justify-center transition-colors`}>
                         {formatFilter === opt && <div className="w-2 h-2 bg-void" />}
                       </div>
                       <input 
                         type="radio" 
                         name="format" 
                         value={opt}
                         checked={formatFilter === opt}
                         onChange={(e) => setFormatFilter(e.target.value)}
                         className="hidden" 
                       />
                       <span className={`text-sm ${formatFilter === opt ? 'text-brand' : 'text-ink/70 group-hover:text-ink'}`}>
                         {opt === 'all' ? (lang === 'zh' ? '全部' : 'All') : 
                          opt === 'online' ? (lang === 'zh' ? '线上' : 'Online') : 
                          (lang === 'zh' ? '线下' : 'Offline')}
                       </span>
                     </label>
                   ))}
                 </div>
               </div>
            </div>

            {/* Main List */}
            <div className="flex-1">
               {loading ? (
                 <div className="text-center py-20">
                   <div className="inline-block animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mb-4"></div>
                   <p className="text-ink/50 font-mono">LOADING DATA...</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {filteredHackathons.map(hackathon => (
                     <Card 
                       key={hackathon.id}
                       className="group cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                       onClick={() => navigate(`/hackathons/${hackathon.id}`)}
                     >
                       <div className="relative h-48 bg-ink/5 overflow-hidden border-b border-ink/10">
                         {hackathon.cover_image ? (
                           <img 
                             src={hackathon.cover_image} 
                             alt={hackathon.title}
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-void pattern-grid-lg">
                             <span className="text-4xl opacity-20 font-bold text-ink">AURATHON</span>
                           </div>
                         )}
                         <div className="absolute top-4 right-4">
                           <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border backdrop-blur-md
                             ${hackathon.status === 'registering' ? 'bg-brand/90 text-void border-brand' : 
                               hackathon.status === 'ongoing' ? 'bg-green-500/90 text-void border-green-500' :
                               'bg-ink/90 text-void border-ink'
                             }
                           `}>
                             {hackathon.status}
                           </span>
                         </div>
                       </div>
                       
                       <div className="p-6">
                         <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-brand transition-colors">
                           {hackathon.title}
                         </h3>
                         <p className="text-ink/60 text-sm mb-4 line-clamp-2 h-10">
                           {hackathon.description}
                         </p>
                         
                         <div className="flex items-center gap-4 text-xs font-mono text-ink/50 mb-4">
                           <div className="flex items-center gap-1">
                             <span>📅</span>
                             <span>{new Date(hackathon.start_date).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-1">
                             <span>📍</span>
                             <span>{hackathon.format === 'online' ? 'Online' : hackathon.location || 'TBD'}</span>
                           </div>
                         </div>
                         
                         <div className="flex flex-wrap gap-2">
                           {hackathon.theme_tags?.split(',').slice(0, 3).map(tag => (
                             <span key={tag} className="text-xs px-2 py-1 border border-ink/20 text-ink/60">
                               #{tag.trim()}
                             </span>
                           ))}
                         </div>
                       </div>
                     </Card>
                   ))}
                 </div>
               )}
               
               {!loading && filteredHackathons.length === 0 && (
                 <div className="text-center py-20 border border-dashed border-ink/20">
                   <p className="text-ink/40 font-mono">NO DATA FOUND</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
