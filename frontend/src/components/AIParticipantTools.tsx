import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import axios from 'axios';

interface User {
  id: number;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  skills?: string[];
  interests?: string[];
}

interface Hackathon {
  id: number;
  title: string;
  theme_tags?: string;
}

interface AIParticipantToolsProps {
  user: User;
  hackathon: Hackathon;
}

interface Idea {
  title: string;
  description: string;
  tech_stack: string;
  complexity: string;
  impact_potential?: {
    score: number;
    reason: string;
  };
}

interface Slide {
  title: string;
  content: string;
  speaker_notes: string;
  visual_idea?: string;
}

const AIParticipantTools: React.FC<AIParticipantToolsProps> = ({ user, hackathon }) => {
  const [activeTool, setActiveTool] = useState<'idea' | 'pitch' | 'roadmap'>('idea');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Idea Storm State
  const [ideas, setIdeas] = useState<Idea[]>([]);
  
  // Pitch Deck State
  const [projectDesc, setProjectDesc] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);

  // Roadmap State
  const [roadmap, setRoadmap] = useState<string[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [activeTool]);

  const lang = navigator.language.startsWith('zh') ? 'zh' : 'en';

  const handleBrainstorm = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Use generic fallback skills/interests if user profile is empty
      const skills = user.skills?.length ? user.skills.join(', ') : "General Programming, Web Development";
      const interests = user.interests?.length ? user.interests.join(', ') : "Innovation, Technology";
      
      const res = await axios.post('/api/v1/ai/brainstorm-ideas', {
        theme: hackathon.theme_tags || hackathon.title,
        skills: skills,
        interests: interests,
        lang: lang
      }, { headers: { Authorization: `Bearer ${token}` } });
      setIdeas(res.data.ideas || []);
    } catch (error) {
      console.error("Brainstorm failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePitchDeck = async () => {
    if (!projectDesc) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/ai/generate-pitch-deck', {
        project_name: "My Hackathon Project", // Could add input for this
        project_description: projectDesc,
        lang: lang
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSlides(res.data.slides || []);
    } catch (error) {
      console.error("Pitch Deck failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoadmap = async () => {
      if (!projectDesc && ideas.length === 0) {
          alert(lang === 'zh' ? '请先提供项目描述或生成一些想法' : 'Please provide a project description or generate some ideas first');
          return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const desc = projectDesc || (ideas.length > 0 ? ideas[0].description : "");
        const skills = user.skills?.length ? user.skills.join(', ') : "General Programming";
        
        const res = await axios.post('/api/v1/ai/generate-roadmap', {
            project_description: desc,
            team_skills: skills,
            lang: lang
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setRoadmap(res.data.roadmap || []);
      } catch (error) {
          console.error("Roadmap failed", error);
          alert(lang === 'zh' ? '路线图生成失败' : 'Roadmap generation failed');
      } finally {
          setLoading(false);
      }
  };


  return (
    <div ref={containerRef} className="h-full flex flex-col gap-6 text-[#D4A373]">
      {/* Tool Selector */}
      <div className="flex gap-4 border-b border-[#D4A373]/20 pb-4">
        <button
          onClick={() => setActiveTool('idea')}
          className={`px-4 py-2 font-mono text-sm uppercase transition-all ${
            activeTool === 'idea' 
              ? 'bg-[#D4A373] text-[#1a1a1a] font-bold' 
              : 'text-[#D4A373]/60 hover:text-[#D4A373]'
          }`}
        >
          [ Idea Storm ]
        </button>
        <button
          onClick={() => setActiveTool('pitch')}
          className={`px-4 py-2 font-mono text-sm uppercase transition-all ${
            activeTool === 'pitch' 
              ? 'bg-[#D4A373] text-[#1a1a1a] font-bold' 
              : 'text-[#D4A373]/60 hover:text-[#D4A373]'
          }`}
        >
          [ Pitch Architect ]
        </button>
        <button
          onClick={() => setActiveTool('roadmap')}
          className={`px-4 py-2 font-mono text-sm uppercase transition-all ${
            activeTool === 'roadmap' 
              ? 'bg-[#D4A373] text-[#1a1a1a] font-bold' 
              : 'text-[#D4A373]/60 hover:text-[#D4A373]'
          }`}
        >
          [ Project Roadmap ]
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTool === 'idea' && (
          <div className="space-y-6">
            <div className="bg-[#D4A373]/5 p-6 border border-[#D4A373]/20">
              <h3 className="font-mono text-xl mb-4 text-[#D4A373] flex items-center gap-2">
                <span className="animate-pulse">⚡</span> BRAINSTORM ENGINE
              </h3>
              <p className="text-sm opacity-70 mb-6 font-mono">
                Generate project ideas tailored to your skills ({user.skills?.length ? user.skills.join(', ') : 'General'}) and the hackathon theme ({hackathon.theme_tags || 'General'}).
              </p>
              
              <button
                onClick={handleBrainstorm}
                disabled={loading}
                className="w-full py-4 bg-[#D4A373]/10 border border-[#D4A373] hover:bg-[#D4A373] hover:text-[#1a1a1a] transition-all font-mono uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                    ANALYZING VECTORS...
                  </>
                ) : (
                  'GENERATE CONCEPTS'
                )}
              </button>
            </div>

            {ideas.length > 0 && (
              <div className="grid gap-4">
                {ideas.map((idea, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] border border-[#D4A373]/30 p-5 hover:border-[#D4A373] transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-[#D4A373] group-hover:text-white transition-colors">
                        {idea.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 border ${
                        idea.complexity === 'Easy' ? 'border-green-500 text-green-500' :
                        idea.complexity === 'Medium' ? 'border-yellow-500 text-yellow-500' :
                        'border-red-500 text-red-500'
                      } font-mono uppercase`}>
                        {idea.complexity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4 font-mono leading-relaxed">
                      {idea.description}
                    </p>
                    <div className="text-xs font-mono text-[#D4A373]/60 mb-2">
                      <span className="text-[#D4A373]">STACK:</span> {idea.tech_stack}
                    </div>
                    {idea.impact_potential && (
                      <div className="bg-[#D4A373]/10 p-3 border-l-2 border-[#D4A373] mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-[#D4A373]">IMPACT SCORE:</span>
                          <span className="text-xs font-mono font-bold text-white bg-[#D4A373] px-2 rounded">{idea.impact_potential.score}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono italic">
                          {idea.impact_potential.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTool === 'pitch' && (
          <div className="space-y-6">
            <div className="bg-[#D4A373]/5 p-6 border border-[#D4A373]/20">
              <h3 className="font-mono text-xl mb-4 text-[#D4A373] flex items-center gap-2">
                <span>🎤</span> PITCH DECK ARCHITECT
              </h3>
              <p className="text-sm opacity-70 mb-6 font-mono">
                Turn your project description into a structured presentation outline.
              </p>
              
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Describe your project: Problem, Solution, Tech Stack..."
                className="w-full bg-[#1a1a1a] border border-[#D4A373]/30 p-4 text-[#D4A373] focus:border-[#D4A373] outline-none h-32 mb-4 font-mono text-sm"
              />

              <button
                onClick={handlePitchDeck}
                disabled={loading || !projectDesc}
                className="w-full py-4 bg-[#D4A373]/10 border border-[#D4A373] hover:bg-[#D4A373] hover:text-[#1a1a1a] transition-all font-mono uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                    STRUCTURING NARRATIVE...
                  </>
                ) : (
                  'GENERATE SLIDES'
                )}
              </button>
            </div>

            {slides.length > 0 && (
              <div className="space-y-4">
                {slides.map((slide, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] border border-[#D4A373]/30 p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 font-black text-4xl select-none">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <h4 className="font-bold text-lg text-[#D4A373] mb-3 border-b border-[#D4A373]/10 pb-2">
                      {slide.title}
                    </h4>
                    <div className="mb-4">
                      <div className="text-xs text-[#D4A373]/50 mb-1 font-mono uppercase">Slide Content</div>
                      <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap font-sans">
                        {slide.content}
                      </pre>
                    </div>
                    {slide.visual_idea && (
                      <div className="mb-4 bg-[#D4A373]/5 p-3 border border-[#D4A373]/10 rounded">
                        <div className="text-xs text-[#D4A373]/50 mb-1 font-mono uppercase">Visual Concept</div>
                        <p className="text-xs text-gray-400 italic">
                          {slide.visual_idea}
                        </p>
                      </div>
                    )}
                    <div className="bg-[#D4A373]/5 p-3 border-l-2 border-[#D4A373]/30">
                      <div className="text-xs text-[#D4A373]/50 mb-1 font-mono uppercase">Speaker Notes</div>
                      <p className="text-sm text-[#D4A373]/80 italic">
                        "{slide.speaker_notes}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTool === 'roadmap' && (
             <div className="space-y-6">
                 <div className="bg-[#D4A373]/5 p-6 border border-[#D4A373]/20">
                     <h3 className="font-mono text-xl mb-4 text-[#D4A373] flex items-center gap-2">
                         <span>🗺️</span> PROJECT ROADMAP GENERATOR
                     </h3>
                     <p className="text-sm opacity-70 mb-6 font-mono">
                         Get a daily plan to finish your hackathon project on time.
                     </p>
                     
                     <button
                         onClick={handleRoadmap}
                         disabled={loading}
                         className="w-full py-4 bg-[#D4A373]/10 border border-[#D4A373] hover:bg-[#D4A373] hover:text-[#1a1a1a] transition-all font-mono uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         {loading ? (
                             <>
                                 <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                                 CALCULATING PATH...
                             </>
                         ) : (
                             'GENERATE TIMELINE'
                         )}
                     </button>
                 </div>

                 {roadmap.length > 0 && (
                     <div className="relative border-l-2 border-[#D4A373]/30 ml-4 space-y-8 py-4">
                         {roadmap.map((step, idx) => (
                             <div key={idx} className="relative pl-8">
                                 {/* Timeline Dot */}
                                 <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#1a1a1a] border-2 border-[#D4A373] flex items-center justify-center">
                                     <div className="w-1.5 h-1.5 bg-[#D4A373] rounded-full animate-pulse"></div>
                                 </div>
                                 
                                 <h4 className="text-[#D4A373] font-bold text-lg mb-1 font-mono">STEP {idx + 1}</h4>
                                 <div className="bg-[#1a1a1a] border border-[#D4A373]/20 p-4 text-gray-300 font-mono text-sm">
                                     {step}
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
        )}
      </div>
    </div>
  );
};

export default AIParticipantTools;
