import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { Hackathon } from '../../types';

interface HackathonSidebarProps {
  hackathon: Hackathon;
  activeSection: string;
  onSectionChange: (section: string) => void;
  lang: 'zh' | 'en';
  onAiToolSelect: (tool: 'resume' | 'teammate' | 'idea' | 'pitch' | 'roadmap') => void;
}

export default function HackathonSidebar({
  hackathon,
  activeSection,
  onSectionChange,
  lang,
  onAiToolSelect
}: HackathonSidebarProps) {
  
  const sections = [
    { id: 'overview', label: lang === 'zh' ? '活动详情' : 'Overview', icon: '📄' },
    { id: 'schedule', label: lang === 'zh' ? '日程安排' : 'Schedule', icon: '📅' },
    { id: 'participants', label: lang === 'zh' ? '参赛人员' : 'Participants', icon: '👥' },
    { id: 'projects', label: lang === 'zh' ? '作品展示' : 'Projects', icon: '🚀' },
    { id: 'ai_toolkit', label: lang === 'zh' ? 'AI 工具箱' : 'AI Toolkit', icon: '🤖' },
  ];

  return (
    <div className="w-full lg:w-80 flex-shrink-0 space-y-8 lg:sticky lg:top-24 h-fit">
      {/* Navigation Menu */}
      <Card className="p-2 bg-void/50 border border-white/5 backdrop-blur-sm">
        <nav className="flex flex-col space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${activeSection === section.id 
                  ? 'bg-brand/10 text-brand border-l-2 border-brand' 
                  : 'text-ink/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}
              `}
            >
              <span className="text-lg opacity-80">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </Card>

      {/* Event Info */}
      <Card className="p-6 border-l-4 border-l-brand bg-void/30">
        <h3 className="text-xs font-mono uppercase text-ink/50 mb-4 tracking-widest">
          {lang === 'zh' ? '赛事信息' : 'EVENT INFO'}
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <label className="text-ink/40 text-xs block mb-1">Timeline</label>
            <p className="font-bold text-white">
              {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="text-ink/40 text-xs block mb-1">Format</label>
            <p className="capitalize text-white">{hackathon.format || 'Online'}</p>
          </div>
          <div>
             <label className="text-ink/40 text-xs block mb-1">Organizer</label>
             <p className="text-white">{hackathon.organizer_name || 'Unknown'}</p>
          </div>
          <div>
             <label className="text-ink/40 text-xs block mb-1">Prize Pool</label>
             <p className="text-brand font-bold text-lg">{hackathon.prize_pool || 'TBD'}</p>
          </div>
        </div>
      </Card>

      {/* AI Assistant Shortcuts */}
      <Card className="p-6 bg-gradient-to-br from-[#1a1a1a] to-black border-white/10">
        <h3 className="text-xs font-mono uppercase text-brand/80 mb-4 tracking-widest flex items-center gap-2">
          <span className="animate-pulse">✨</span>
          {lang === 'zh' ? 'AI 助手' : 'AI ASSISTANT'}
        </h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start text-xs border-white/10 hover:border-brand/50 hover:bg-brand/5" onClick={() => onAiToolSelect('resume')}>
            📝 {lang === 'zh' ? '简历优化' : 'Optimize Resume'}
          </Button>
          <Button variant="outline" className="w-full justify-start text-xs border-white/10 hover:border-brand/50 hover:bg-brand/5" onClick={() => onAiToolSelect('teammate')}>
            🤝 {lang === 'zh' ? '寻找队友' : 'Find Teammates'}
          </Button>
          <Button variant="outline" className="w-full justify-start text-xs border-white/10 hover:border-brand/50 hover:bg-brand/5" onClick={() => onAiToolSelect('idea')}>
            💡 {lang === 'zh' ? '创意生成' : 'Idea Storm'}
          </Button>
          <Button variant="outline" className="w-full justify-start text-xs border-white/10 hover:border-brand/50 hover:bg-brand/5" onClick={() => onAiToolSelect('pitch')}>
            🎤 {lang === 'zh' ? '路演设计' : 'Pitch Architect'}
          </Button>
          <Button variant="outline" className="w-full justify-start text-xs border-white/10 hover:border-brand/50 hover:bg-brand/5" onClick={() => onAiToolSelect('roadmap')}>
            🗺️ {lang === 'zh' ? '项目规划' : 'Roadmap'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
