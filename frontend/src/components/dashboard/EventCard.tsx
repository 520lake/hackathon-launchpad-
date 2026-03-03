import React from 'react';
import type { Hackathon, EnrollmentWithHackathon } from '../../types';
import Button from '../ui/Button';

interface EventCardProps {
  hackathon: Hackathon;
  enrollment?: EnrollmentWithHackathon;
  onView?: () => void;
}

export default function EventCard({ hackathon, enrollment, onView }: EventCardProps) {
  const status = enrollment?.status || 'upcoming';
  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    approved: 'bg-green-500/20 text-green-500',
    rejected: 'bg-red-500/20 text-red-500',
    upcoming: 'bg-blue-500/20 text-blue-500',
  };

  const coverImage = hackathon.cover_image || "https://images.unsplash.com/photo-1504384308090-c54be3855833?q=80&w=1920&auto=format&fit=crop";

  return (
    <div 
      onClick={onView}
      className="bg-[#1a1a1a] flex flex-col md:flex-row gap-5 items-stretch md:items-center p-5 relative rounded-[14px] w-full border border-white/5 hover:border-brand/50 transition-all cursor-pointer group"
    >
      {/* Date Block / Logo */}
      <div className="bg-[#2a2a2a] relative rounded-[8px] shrink-0 w-[100px] h-[100px] overflow-hidden flex items-center justify-center text-3xl font-bold text-white/20">
        {hackathon.cover_image ? (
            <img src={hackathon.cover_image} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
        ) : (
            <span>{hackathon.title.substring(0, 2).toUpperCase()}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {/* Tags */}
          <span className="bg-[#2a2a2a] text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
            {hackathon.format || 'Hybrid'}
          </span>
          <span className="bg-[#2a2a2a] text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
            {hackathon.status}
          </span>
        </div>

        <h3 className="text-xl text-white font-normal leading-tight group-hover:text-brand transition-colors">
          {hackathon.title}
        </h3>
        
        <p className="text-[#ccc] text-sm line-clamp-1">
          {hackathon.subtitle || hackathon.description}
        </p>

        <div className="flex items-center gap-4 mt-2 text-[#999] text-xs">
          <span>Organizer: {hackathon.organizer_name || 'Aurathon Network'}</span>
          <span className="w-px h-3 bg-white/10" />
          <span>{new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Right Action / Status */}
      <div className="hidden md:flex flex-col items-end gap-3 min-w-[140px] border-l border-white/5 pl-5">
        <div className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${statusColors[status as keyof typeof statusColors] || statusColors.upcoming}`}>
          {status}
        </div>
        
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end gap-2 text-[#ccc] text-sm">
            <span>{hackathon.location || 'Global'}</span>
          </div>
          <div className="text-[#ccc] text-xs">
            {/* Prize Pool Placeholder */}
            <span>$50,000 + Swag</span>
          </div>
        </div>
      </div>
    </div>
  );
}
