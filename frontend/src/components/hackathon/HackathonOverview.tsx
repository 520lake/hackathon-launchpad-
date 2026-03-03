import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Hackathon } from '../../types';

interface HackathonOverviewProps {
  hackathon: Hackathon;
}

export default function HackathonOverview({ hackathon }: HackathonOverviewProps) {
  return (
    <div className="prose prose-invert max-w-none space-y-12">
      {/* Description Section */}
      <section className="bg-void/20 p-8 rounded-2xl border border-white/5">
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          <span className="text-brand">#</span> About The Hackathon
        </h2>
        <div className="text-ink/80 leading-relaxed">
          <ReactMarkdown>{hackathon.description}</ReactMarkdown>
        </div>
      </section>

      {/* Awards Section */}
      {hackathon.awards_detail && (
        <section className="bg-gradient-to-br from-brand/5 to-transparent p-8 rounded-2xl border border-brand/20">
          <h2 className="text-3xl font-bold mb-6 text-brand font-mono flex items-center gap-3">
            <span className="text-2xl">🏆</span> AWARDS & PRIZES
          </h2>
          <div className="text-ink/90">
             <ReactMarkdown>{hackathon.awards_detail}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Judging Criteria (Placeholder if not in DB) */}
      <section className="bg-void/20 p-8 rounded-2xl border border-white/5">
        <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
           <span className="text-brand">⚖️</span> Judging Criteria
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
            {[
                { title: 'Innovation', desc: 'How unique and creative is the solution?' },
                { title: 'Technical Complexity', desc: 'How challenging was the technical implementation?' },
                { title: 'Impact', desc: 'What is the potential real-world impact?' },
                { title: 'Design & UX', desc: 'How intuitive and well-designed is the interface?' }
            ].map((item, i) => (
                <div key={i} className="bg-black/40 p-4 rounded-lg border border-white/5">
                    <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-ink/60">{item.desc}</p>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}
