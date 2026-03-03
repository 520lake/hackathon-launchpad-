import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../ui/Card';

interface HackathonParticipantsProps {
  hackathonId: number;
}

interface Participant {
  id: number;
  username: string;
  avatar_url?: string;
  role?: string;
  skills?: string[];
}

export default function HackathonParticipants({ hackathonId }: HackathonParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:8000/api/v1/enrollments/public/${hackathonId}`)
      .then(res => {
          // Map backend response to frontend interface
          const mapped = res.data.map((p: any) => ({
              id: p.user_id,
              username: p.nickname || 'User ' + p.user_id,
              avatar_url: p.avatar_url,
              role: p.bio ? p.bio.substring(0, 20) : 'Participant', // Fallback role
              skills: p.skills || []
          }));
          setParticipants(mapped);
      })
      .catch(err => {
          console.error("Failed to fetch participants", err);
          // Fallback to empty list or keep mock for demo if needed, but let's trust the API
          setParticipants([]);
      })
      .finally(() => setLoading(false));
  }, [hackathonId]);

  if (loading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 bg-void/50 rounded-xl border border-white/5"></div>
            ))}
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-bold text-white tracking-tight">Participants ({participants.length})</h2>
         {/* Filter/Search could go here */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {participants.map((user) => (
          <div key={user.id} className="group relative bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-brand/50 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/10">
            {/* Avatar Header */}
            <div className="h-24 bg-gradient-to-br from-brand/20 to-transparent relative">
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-[#09090b] bg-void overflow-hidden">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                        alt={user.username}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            <div className="pt-10 pb-6 px-6 text-center space-y-3">
                <h3 className="text-lg font-bold text-white group-hover:text-brand transition-colors">{user.username}</h3>
                <p className="text-xs text-ink/60 uppercase tracking-widest font-mono">{user.role}</p>
                
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {user.skills?.map(skill => (
                        <span key={skill} className="px-2 py-0.5 text-[10px] bg-white/5 rounded text-ink/80 border border-white/5">
                            {skill}
                        </span>
                    ))}
                </div>
                
                <button className="w-full mt-4 py-2 text-xs font-medium border border-white/10 rounded hover:bg-white/10 transition-colors text-ink/60 hover:text-white">
                    View Profile
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
