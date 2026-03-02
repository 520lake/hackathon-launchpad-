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
        gsap.context(() => {
          gsap.set(modalRef.current, { x: '100%' });
          gsap.to(modalRef.current, {
              x: '0%',
              duration: 0.8,
              ease: "power4.out",
          });
        }, modalRef);
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
      const now = new Date().getTime();
      result = result.filter(h => {
        const regStart = h.registration_start_date ? new Date(h.registration_start_date).getTime() : 0;
        const regEnd = h.registration_end_date ? new Date(h.registration_end_date).getTime() : 0;
        const actStart = new Date(h.start_date).getTime();
        const actEnd = new Date(h.end_date).getTime();

        // 报名中 (Registering): reg_start <= now < reg_end
        if (statusFilter === 'registering') {
            return now >= regStart && now < regEnd;
        }
        // 即将开始 (Upcoming): now < reg_start
        if (statusFilter === 'upcoming') {
            return now < regStart;
        }
        // 进行中 (Ongoing): act_start <= now < act_end
        if (statusFilter === 'ongoing') {
            return now >= actStart && now < actEnd;
        }
        // 已结束 (Ended): now >= act_end
        if (statusFilter === 'ended') {
            return now >= actEnd;
        }
        // Fallback to strict status check if needed, but time-based is preferred for this requirement
        return h.status === statusFilter;
      });
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
      const response = await axios.get('/api/v1/hackathons');
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
        const res = await axios.post('/api/v1/ai/search-hackathons', { query: aiQuery }, {
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

  // Render (truncated for brevity in legacy file, but full content would be here)
  return <div>Legacy HackathonListModal</div>; 
}
