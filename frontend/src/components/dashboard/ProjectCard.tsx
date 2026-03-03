import React from 'react';
import type { Project } from '../../types';
import Button from '../ui/Button';

interface ProjectCardProps {
  project: Project;
  onView?: () => void;
}

export default function ProjectCard({ project, onView }: ProjectCardProps) {
  // Using a placeholder image if none exists, matching the Figma "Green Data Dashboard" card
  const coverImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"; 

  return (
    <div className="bg-[#1a1a1a] border border-[#333] flex flex-col items-start overflow-hidden relative rounded-[14px] w-full max-w-[280px] hover:border-brand/50 transition-colors group">
      {/* Image Aspect Ratio 1:1 roughly or 16:9 based on Figma */}
      <div className="aspect-video relative shrink-0 w-full overflow-hidden">
        <img 
          alt={project.title} 
          className="absolute inset-0 object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
          src={coverImage} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
      </div>
      
      <div className="flex flex-col gap-2 items-start p-4 relative w-full">
        <h3 className="font-bold leading-tight text-white tracking-tight line-clamp-1">
          {project.title}
        </h3>
        <p className="text-[#999] text-xs leading-relaxed line-clamp-2 min-h-[2.5em]">
          {project.description}
        </p>
        
        <div className="flex items-center gap-2 mt-2">
          {/* Team Icon Placeholder */}
          <div className="w-3 h-3 rounded-full bg-brand/50" />
          <span className="text-[#888] text-xs">
            {project.team?.name || 'Solo Project'}
          </span>
        </div>
      </div>
    </div>
  );
}
