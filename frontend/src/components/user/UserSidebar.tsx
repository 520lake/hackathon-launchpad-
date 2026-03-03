import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface UserSidebarProps {
  items: SidebarItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export default function UserSidebar({ items, activeTab, onTabChange, className = '' }: UserSidebarProps) {
  return (
    <div className={`flex flex-col gap-2 w-full md:w-64 shrink-0 ${className}`}>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left
              ${isActive 
                ? 'bg-void-light text-white border border-white/10 shadow-lg' 
                : 'text-ink-light hover:bg-void-light/50 hover:text-white'}
            `}
          >
            <Icon size={18} className={isActive ? 'text-brand' : 'text-current'} />
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
