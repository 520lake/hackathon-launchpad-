import React from 'react';
import { MapPin, Briefcase, Edit2 } from 'lucide-react';
import type { User } from '../../types';
import Button from '../ui/Button';

interface UserProfileCardProps {
  user: User;
  onEdit: () => void;
}

export default function UserProfileCard({ user, onEdit }: UserProfileCardProps) {
  return (
    <div className="bg-void-light/50 border border-white/10 rounded-xl p-8 flex gap-8 shadow-lg backdrop-blur-sm w-full max-w-4xl">
      {/* Avatar */}
      <div className="relative shrink-0 w-[100px] h-[100px] rounded-full overflow-hidden border border-white/10 bg-void">
        {user.avatar_url ? (
          <img 
            src={user.avatar_url} 
            alt={user.full_name || user.nickname || 'User'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand/20 text-brand text-3xl font-bold">
            {(user.full_name || user.nickname || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-3">
            {/* Name & Org */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {user.full_name || user.nickname || 'Unknown User'}
              </h1>
              {user.organization && (
                <span className="bg-white text-void px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {user.organization}
                </span>
              )}
            </div>

            {/* Meta: Location & Role */}
            <div className="flex items-center gap-6 text-sm text-ink-light">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-brand" />
                <span>{user.city || 'Location not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-brand" />
                <span>{user.title || 'Role not set'}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
            className="flex items-center gap-2 text-xs"
          >
            <Edit2 size={14} />
            Edit Profile
          </Button>
        </div>

        {/* Bio */}
        <p className="text-ink-light/80 text-sm leading-relaxed max-w-2xl">
          {user.bio || 'No bio provided yet. Click "Edit Profile" to tell us about yourself.'}
        </p>

        {/* Skills (Optional addition matching design context if needed) */}
        {user.skills && (
            <div className="flex flex-wrap gap-2 mt-2">
                {(Array.isArray(user.skills) ? user.skills : user.skills.split(',')).map((skill, i) => (
                    <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded text-ink-light">
                        {skill.trim()}
                    </span>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
