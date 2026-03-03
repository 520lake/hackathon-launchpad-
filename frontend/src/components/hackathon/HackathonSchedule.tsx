import React from 'react';
import type { Hackathon } from '../../types';

interface HackathonScheduleProps {
  hackathon: Hackathon;
}

export default function HackathonSchedule({ hackathon }: HackathonScheduleProps) {
  // Map hackathon dates to timeline items
  const scheduleItems = [
    {
      date: hackathon.registration_start_date,
      title: 'Registration Opens',
      desc: 'Start forming your teams and registering for the event.',
      type: 'registration'
    },
    {
      date: hackathon.registration_end_date,
      title: 'Registration Deadline',
      desc: 'Last chance to join the hackathon.',
      type: 'registration'
    },
    {
      date: hackathon.start_date,
      title: 'Hackathon Kickoff',
      desc: 'Official start of the hacking period.',
      type: 'event'
    },
    {
      date: hackathon.submission_end_date,
      title: 'Submission Deadline',
      desc: 'All projects must be submitted by this time.',
      type: 'submission'
    },
    {
      date: hackathon.judging_start_date,
      title: 'Judging Begins',
      desc: 'Judges will review and score all submissions.',
      type: 'judging'
    },
    {
      date: hackathon.end_date,
      title: 'Winners Announced',
      desc: 'Closing ceremony and awards presentation.',
      type: 'event'
    }
  ];

  // Filter out null dates and sort by date
  const schedule = scheduleItems
    .filter(item => item.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .map(item => {
        const dateObj = new Date(item.date!);
        const now = new Date();
        let status = 'upcoming';
        if (now > dateObj) status = 'completed';
        // Simple logic for active: if it's the most recent past event and not too old?
        // Or just use upcoming/completed
        
        return {
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: item.title,
            desc: item.desc,
            status: status
        };
    });

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Event Schedule</h2>
        <span className="text-sm text-ink/60 font-mono bg-void/50 px-3 py-1 rounded border border-white/10">
            {hackathon.timezone || 'UTC+8'}
        </span>
      </div>

      <div className="relative border-l-2 border-white/10 ml-4 md:ml-8 space-y-12 pb-12">
        {schedule.length > 0 ? schedule.map((item, index) => (
          <div key={index} className="relative pl-8 md:pl-12 group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-colors duration-300
              ${item.status === 'completed' ? 'bg-brand border-brand' : 
                'bg-black border-white/20 group-hover:border-white/50'}
            `}></div>

            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
              {/* Time Column */}
              <div className="md:w-32 shrink-0">
                <span className="text-brand font-mono font-bold block">{item.time}</span>
                <span className="text-xs text-ink/40 uppercase tracking-wide">{item.date}</span>
              </div>

              {/* Content Card */}
              <div className="flex-1 bg-void/30 p-6 rounded-xl border border-white/5 hover:border-brand/30 transition-all duration-300 group-hover:bg-void/50">
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-ink/70 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </div>
        )) : (
            <p className="text-ink/40 italic ml-8">Schedule to be announced.</p>
        )}
      </div>
    </div>
  );
}
