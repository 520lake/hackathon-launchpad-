import React from 'react';
import type { Hackathon } from '../../types';
import Button from '../ui/Button';

interface HackathonHeroProps {
  hackathon: Hackathon;
  isOrganizer: boolean;
  enrollment: any;
  onRegister: () => void;
  onNavigateSubmit: () => void;
  onNavigateEdit: () => void;
  onAiTeammate: () => void;
}

export default function HackathonHero({
  hackathon,
  isOrganizer,
  enrollment,
  onRegister,
  onNavigateSubmit,
  onNavigateEdit,
  onAiTeammate
}: HackathonHeroProps) {
  const heroImage = hackathon.cover_image || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="relative h-[400px] w-full bg-[#09090b] overflow-hidden border-b border-white/10">
      <div className="absolute inset-0">
        <img src={heroImage} alt={hackathon.title} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-6 max-w-3xl">
            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-[4px] backdrop-blur-md
                ${hackathon.status === 'registering' 
                  ? 'bg-brand text-black' 
                  : 'bg-[#333] text-white'}
              `}>
                {hackathon.status}
              </span>
              
              {/* Mock Tags - In real app, parse hackathon.theme_tags */}
              {hackathon.theme_tags ? (
                 hackathon.theme_tags.split(',').map(tag => (
                    <span key={tag} className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium border border-[#666] rounded-[4px] text-white backdrop-blur-sm">
                        #{tag.trim()}
                    </span>
                 ))
              ) : (
                 ['#Sustainable', '#IoT', '#BigData'].map(tag => (
                    <span key={tag} className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium border border-[#666] rounded-[4px] text-white backdrop-blur-sm">
                        {tag}
                    </span>
                 ))
              )}
            </div>
            
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  {hackathon.title}
                </h1>
                
                <p className="text-lg text-[#ddd] max-w-2xl leading-relaxed line-clamp-2">
                  {hackathon.subtitle || hackathon.description.substring(0, 150)}
                </p>
            </div>
          </div>
          
          <div className="flex gap-4 shrink-0 items-center">
            {isOrganizer && (
                <Button variant="ghost" className="text-white/80 hover:text-white flex items-center gap-2" onClick={onNavigateEdit}>
                    <span>✏️</span> 编辑活动
                </Button>
            )}

            {/* Smart Team Up Button */}
            <button 
              onClick={onAiTeammate}
              className="bg-black/30 border border-[#d4af37] rounded-[10px] px-4 py-2 flex items-center gap-2 text-white hover:bg-[#d4af37]/10 transition-colors"
            >
                <span className="text-[#d4af37]">⚡</span>
                <span className="text-sm font-medium">智能组队</span>
            </button>

            {!enrollment ? (
               <Button 
                 size="lg" 
                 className="h-10 px-6 text-base bg-[#d4af37] hover:bg-[#bfa13a] text-black font-medium shadow-[0px_4px_6px_rgba(212,175,55,0.2)] rounded-[10px] border-none"
                 onClick={onRegister}
                 disabled={hackathon.status === 'ended'}
               >
                 立即报名
               </Button>
            ) : (
               <div className="flex gap-3">
                   <Button size="lg" variant="outline" className="h-10 border-green-500/50 text-green-500 bg-green-500/10 hover:bg-green-500/20 rounded-[10px]">
                      已报名
                   </Button>
                   <Button size="lg" onClick={onNavigateSubmit} className="h-10 rounded-[10px]">
                      提交项目
                   </Button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
