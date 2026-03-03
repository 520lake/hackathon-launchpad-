import { useNavigate } from 'react-router-dom';
import type { Hackathon } from '../types';

interface HackathonCardProps {
  hackathon: Hackathon;
}

export default function HackathonCard({ hackathon }: HackathonCardProps) {
  const navigate = useNavigate();

  // Helper to format date range
  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.getFullYear()}.${(s.getMonth()+1).toString().padStart(2, '0')}.${s.getDate().toString().padStart(2, '0')} - ${e.getFullYear()}.${(e.getMonth()+1).toString().padStart(2, '0')}.${e.getDate().toString().padStart(2, '0')}`;
  };

  // Helper to calculate status
  const getStatus = () => {
    const now = new Date();
    const regEnd = hackathon.registration_end_date ? new Date(hackathon.registration_end_date) : null;
    
    if (regEnd) {
      const diffTime = regEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays <= 7) {
        return { label: `${diffDays}天后截止报名`, color: 'bg-[#007AFF] text-white' };
      }
      if (diffDays <= 0) {
         return { label: '报名已截止', color: 'bg-[#8E8E93] text-white' };
      }
    }
    
    if (hackathon.status === 'published') return { label: '即将开始', color: 'bg-[#007AFF] text-white' };
    if (hackathon.status === 'ongoing') return { label: '进行中', color: 'bg-[#34C759] text-white' };
    return { label: '已结束', color: 'bg-[#8E8E93] text-white' };
  };

  const status = getStatus();

  return (
    <div 
      className="group bg-[#1A1A1A] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#D4A373]/50 transition-all duration-300 flex h-40"
      onClick={() => navigate(`/hackathons/${hackathon.id}`)}
    >
      {/* Left: Thumbnail */}
      <div className="w-40 h-40 bg-[#222] flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity">
        {hackathon.cover_image ? (
          <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover" />
        ) : (
            <div className="flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white/10 select-none tracking-tighter">
                    TE
                </span>
            </div>
        )}
      </div>

      {/* Middle: Content */}
      <div className="flex-1 p-5 flex flex-col justify-between border-r border-white/5 relative">
          <div>
              <div className="flex gap-2 mb-2">
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 font-mono">测试</span>
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 font-mono">备用</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 group-hover:text-[#D4A373] transition-colors">
                  {hackathon.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-1 mb-3 font-mono opacity-80">
                  {hackathon.description || "AI服务不可用。生成离线测试模板。"}
              </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-[10px] opacity-70">主办方:</span>
              <div className="bg-[#222] px-1.5 py-0.5 rounded text-gray-400 text-[10px] border border-white/5">
                  标志
              </div>
              <span className="text-gray-500">{hackathon.organizer_name || "公司名称"}</span>
          </div>
      </div>

      {/* Right: Meta & Status */}
      <div className="w-64 p-5 flex flex-col justify-between">
          <div className="flex justify-end">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-sm ${status.color}`}>
                  {status.label}
              </span>
          </div>
          
          <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="opacity-50">📅</span>
                  <span className="font-mono">{formatDateRange(hackathon.start_date, hackathon.end_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="opacity-50">📍</span>
                  <span>{hackathon.location || "上海市浦东新区"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="opacity-50">🏆</span>
                  <span>¥ 1,234,567 + 非现金奖品</span>
              </div>
          </div>
      </div>
    </div>
  );
}
