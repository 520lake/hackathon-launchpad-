import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import axios from 'axios';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';

interface User {
  id: number;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  skills?: string | string[]; // Allow both for compatibility
  interests?: string | string[];
}

interface Hackathon {
  id: number;
  title: string;
  theme_tags?: string;
}

interface AIParticipantToolsProps {
  user: User;
  hackathon: Hackathon;
  activeTool?: 'idea' | 'pitch' | 'roadmap' | 'teammate';
  onToolChange?: (tool: 'idea' | 'pitch' | 'roadmap' | 'teammate') => void;
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

interface RoadmapItem {
    phase: string;
    tasks: string[];
    milestone: string;
}

interface MatchResult {
  user_id: number;
  name: string;
  skills: string;
  personality: string;
  bio: string;
  match_reason: string;
  match_score: number;
}

const AIParticipantTools: React.FC<AIParticipantToolsProps> = ({ user, hackathon, activeTool: controlledTool, onToolChange }) => {
  const [internalTool, setInternalTool] = useState<'idea' | 'pitch' | 'roadmap' | 'teammate'>('idea');
  const activeTool = controlledTool || internalTool;

  const handleToolSwitch = (tool: 'idea' | 'pitch' | 'roadmap' | 'teammate') => {
      setInternalTool(tool);
      if (onToolChange) onToolChange(tool);
  };

  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Idea Storm State
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  
  // Pitch Deck State
  const [projectDesc, setProjectDesc] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);

  // Roadmap State
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);

  // Teammate Match State
  const [teamRequirements, setTeamRequirements] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);

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
      // Helper to normalize array/string fields
      const normalize = (val?: string | string[]) => Array.isArray(val) ? val.join(', ') : (val || '');
      
      const skills = normalize(user.skills) || "General Programming, Web Development";
      const interests = normalize(user.interests) || "Innovation, Technology";
      
      // Mock API call if backend not ready, otherwise use real endpoint
      // Assuming endpoint exists based on legacy code
      const res = await axios.post('http://localhost:8000/api/v1/ai/brainstorm-ideas', {
        theme: hackathon.theme_tags || hackathon.title,
        skills: skills,
        interests: interests,
        lang: lang
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setIdeas(res.data.ideas || []);
    } catch (error) {
      console.error("Brainstorm failed", error);
      // Fallback Mock Data for demo purposes if API fails
      setIdeas([
          {
              title: "AI-Powered Eco Tracker",
              description: "A mobile app that uses computer vision to identify recyclable items and rewards users with crypto tokens.",
              tech_stack: "React Native, TensorFlow, Solidity",
              complexity: "Medium",
              impact_potential: { score: 85, reason: "High environmental impact with gamification." }
          },
          {
              title: "Decentralized Identity Vault",
              description: "A secure, self-sovereign identity management system using ZK-proofs for privacy-preserving verification.",
              tech_stack: "Rust, Circom, Next.js",
              complexity: "Hard",
              impact_potential: { score: 92, reason: "Critical privacy infrastructure needed for Web3." }
          }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIdea = (idea: Idea) => {
      setSelectedIdea(idea);
      setProjectDesc(idea.description);
      // Auto switch to pitch or roadmap? Maybe let user decide.
      // For now, just show a toast or indication.
  };

  const handlePitchDeck = async () => {
    if (!projectDesc) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8000/api/v1/ai/generate-pitch-deck', {
        project_name: selectedIdea?.title || "My Hackathon Project",
        project_description: projectDesc,
        lang: lang
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSlides(res.data.slides || []);
    } catch (error) {
      console.error("Pitch Deck failed", error);
      // Mock Data
      setSlides([
          { title: "Problem Statement", content: "Current recycling rates are low due to confusion about what is recyclable.", speaker_notes: "Start with the magnitude of the waste problem.", visual_idea: "Image of overflowing landfill vs clean park." },
          { title: "Solution", content: "AI-Eco Tracker: Point your camera at any item to instantly know if and how to recycle it.", speaker_notes: "Demo the core feature here.", visual_idea: "App screenshot showing scanning UI." }
      ]);
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
        const skills = Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || "General Programming");
        
        const res = await axios.post('http://localhost:8000/api/v1/ai/generate-roadmap', {
            project_description: desc,
            team_skills: skills,
            lang: lang
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setRoadmap(res.data.roadmap || []);
      } catch (error) {
          console.error("Roadmap failed", error);
          // Mock Data
          setRoadmap([
              { phase: "Phase 1: MVP Core", tasks: ["Setup Repo", "Basic UI Scaffold", "Integrate Camera API"], milestone: "Day 1 Evening: Working Camera View" },
              { phase: "Phase 2: AI Integration", tasks: ["Train/Connect Model", "Backend Setup", "Real-time recognition logic"], milestone: "Day 2 Noon: Successful Item ID" }
          ]);
      } finally {
          setLoading(false);
      }
  };

  const handleTeamMatch = async () => {
      if (!teamRequirements.trim()) return;
      setLoading(true);
      setMatches([]); 

      try {
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:8000/api/v1/ai/team-match', {
          hackathon_id: hackathon.id,
          requirements: teamRequirements
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMatches(res.data.matches || []);
      } catch (err) {
        console.error(err);
        // Mock Data
        setMatches([
            { user_id: 101, name: "Alice Chen", skills: "UI/UX, Figma", personality: "Creative", bio: "Passionate designer looking for devs.", match_reason: "Complementary skill set (Design + Dev).", match_score: 95 },
            { user_id: 102, name: "Bob Smith", skills: "Python, AI/ML", personality: "Analytical", bio: "AI researcher.", match_reason: "Strong backend support for your idea.", match_score: 88 }
        ]);
      } finally {
        setLoading(false);
      }
  };


  return (
    <div className="flex flex-col gap-8">
      {/* Tool Selector */}
      <div className="flex flex-wrap gap-4 border-b border-ink/10 pb-4">
        {[
            { id: 'idea', label: 'Idea Storm', icon: '⚡' },
            { id: 'pitch', label: 'Pitch Architect', icon: '🎤' },
            { id: 'roadmap', label: 'Project Roadmap', icon: '🗺️' },
            { id: 'teammate', label: 'Team Match', icon: '🤝' }
        ].map(tool => (
            <button
                key={tool.id}
                onClick={() => handleToolSwitch(tool.id as any)}
                className={`px-4 py-2 font-mono text-sm uppercase transition-all flex items-center gap-2 border ${
                    activeTool === tool.id 
                    ? 'bg-brand text-void border-brand font-bold' 
                    : 'bg-void text-ink/60 border-transparent hover:text-brand hover:border-brand/30'
                }`}
            >
                <span>{tool.icon}</span>
                [{tool.label}]
            </button>
        ))}
      </div>

      {/* Content Area */}
      <div ref={containerRef} className="min-h-[400px]">
        {activeTool === 'idea' && (
          <div className="space-y-6">
            <Card className="p-8 border-brand/20 bg-brand/5">
              <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-mono text-xl mb-2 text-brand font-bold flex items-center gap-2">
                        :: BRAINSTORM ENGINE ::
                    </h3>
                    <p className="text-sm text-ink/70 font-mono max-w-2xl">
                        Generate project ideas tailored to your skills and the hackathon theme.
                    </p>
                  </div>
                  <Button onClick={handleBrainstorm} disabled={loading} className="w-auto">
                    {loading ? 'ANALYZING...' : 'GENERATE CONCEPTS'}
                  </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-ink/50">
                  <div className="bg-void p-2 border border-ink/10">
                      SKILLS: {Array.isArray(user.skills) ? user.skills.join(', ') : user.skills || 'N/A'}
                  </div>
                  <div className="bg-void p-2 border border-ink/10">
                      THEME: {hackathon.theme_tags || hackathon.title}
                  </div>
              </div>
            </Card>

            {ideas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ideas.map((idea, idx) => (
                  <Card 
                    key={idx} 
                    className={`p-6 group cursor-pointer transition-all hover:-translate-y-1 ${selectedIdea === idea ? 'border-brand ring-1 ring-brand' : 'hover:border-brand/50'}`}
                    onClick={() => handleSelectIdea(idea)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-lg text-ink group-hover:text-brand transition-colors">
                        {idea.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 border font-mono uppercase ${
                        idea.complexity === 'Easy' ? 'border-green-500 text-green-500' :
                        idea.complexity === 'Medium' ? 'border-yellow-500 text-yellow-500' :
                        'border-red-500 text-red-500'
                      }`}>
                        {idea.complexity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-ink/70 mb-4 font-mono leading-relaxed h-20 overflow-hidden">
                      {idea.description}
                    </p>
                    
                    <div className="space-y-3">
                        <div className="text-xs font-mono text-ink/50">
                            <span className="text-brand mr-2">STACK &gt;</span> 
                            {idea.tech_stack}
                        </div>
                        
                        {idea.impact_potential && (
                        <div className="bg-ink/5 p-3 border-l-2 border-brand">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-brand">IMPACT SCORE:</span>
                                <span className="text-xs font-mono font-bold text-void bg-brand px-2">{idea.impact_potential.score}</span>
                            </div>
                            <p className="text-xs text-ink/60 italic">
                                {idea.impact_potential.reason}
                            </p>
                        </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-ink/10 flex justify-end">
                        <span className="text-xs font-mono text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                            {selectedIdea === idea ? '[ SELECTED ]' : 'CLICK TO SELECT'}
                        </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTool === 'pitch' && (
          <div className="space-y-6">
            <Card className="p-8 border-brand/20 bg-void">
              <h3 className="font-mono text-xl mb-4 text-brand font-bold">
                :: PITCH DECK ARCHITECT ::
              </h3>
              <p className="text-sm text-ink/70 mb-6 font-mono">
                Turn your project description into a structured presentation outline.
              </p>
              
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Describe your project: Problem, Solution, Tech Stack... (Tip: Select an idea from Idea Storm to auto-fill)"
                className="w-full bg-ink/5 border border-ink/20 p-4 text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all min-h-[120px] font-mono text-sm mb-4 resize-y"
              />

              <Button onClick={handlePitchDeck} disabled={loading || !projectDesc} className="w-full md:w-auto">
                {loading ? 'STRUCTURING NARRATIVE...' : 'GENERATE SLIDES'}
              </Button>
            </Card>

            {slides.length > 0 && (
              <div className="space-y-4">
                {slides.map((slide, idx) => (
                  <Card key={idx} className="p-6 relative overflow-hidden group hover:border-brand/50">
                    <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl select-none text-brand">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    
                    <h4 className="font-bold text-lg text-ink mb-4 border-b border-ink/10 pb-2 relative z-10">
                      <span className="text-brand mr-2">#{idx + 1}</span>
                      {slide.title}
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6 relative z-10">
                        <div>
                            <div className="text-xs text-brand/70 mb-1 font-mono uppercase">Slide Content</div>
                            <pre className="text-sm text-ink/80 font-mono whitespace-pre-wrap bg-ink/5 p-4 border-l-2 border-brand/30">
                                {slide.content}
                            </pre>
                        </div>
                        
                        <div className="space-y-4">
                            {slide.visual_idea && (
                            <div className="bg-brand/5 p-3 border border-brand/10">
                                <div className="text-xs text-brand/70 mb-1 font-mono uppercase">Visual Concept</div>
                                <p className="text-xs text-ink/60 italic">
                                {slide.visual_idea}
                                </p>
                            </div>
                            )}
                            
                            <div className="bg-ink/5 p-3 border-l-2 border-ink/20">
                                <div className="text-xs text-ink/40 mb-1 font-mono uppercase">Speaker Notes</div>
                                <p className="text-sm text-ink/70 italic">
                                    "{slide.speaker_notes}"
                                </p>
                            </div>
                        </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTool === 'roadmap' && (
            <div className="space-y-6">
                <Card className="p-8 border-brand/20 bg-void">
                    <h3 className="font-mono text-xl mb-4 text-brand font-bold">
                        :: PROJECT ROADMAP ::
                    </h3>
                    <p className="text-sm text-ink/70 mb-6 font-mono">
                        Generate a step-by-step execution plan based on your project description.
                    </p>
                    
                    {!projectDesc && (
                        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 text-xs font-mono">
                            ⚠ WARNING: No project description found. Please go to 'Idea Storm' or 'Pitch Architect' to set one up.
                        </div>
                    )}

                    <Button onClick={handleRoadmap} disabled={loading || !projectDesc} className="w-full md:w-auto">
                        {loading ? 'CALCULATING PATH...' : 'GENERATE ROADMAP'}
                    </Button>
                </Card>

                {roadmap.length > 0 && (
                    <div className="relative border-l-2 border-brand/20 ml-4 space-y-8 py-4">
                        {roadmap.map((item, idx) => (
                            <div key={idx} className="relative pl-8">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-void border-2 border-brand box-content" />
                                
                                <Card className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-lg text-brand">{item.phase}</h4>
                                        <span className="text-xs font-mono bg-brand/10 text-brand px-2 py-1">
                                            MILESTONE: {item.milestone}
                                        </span>
                                    </div>
                                    
                                    <ul className="space-y-2">
                                        {item.tasks.map((task, tIdx) => (
                                            <li key={tIdx} className="flex items-start gap-2 text-sm text-ink/80 font-mono">
                                                <span className="text-brand/50 mt-1">bw_</span>
                                                {task}
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTool === 'teammate' && (
            <div className="space-y-6">
                <Card className="p-8 border-brand/20 bg-void">
                    <h3 className="font-mono text-xl mb-4 text-brand font-bold">
                        :: AI TEAM MATCH ::
                    </h3>
                    <p className="text-sm text-ink/70 mb-6 font-mono">
                        Describe your ideal teammate or what you are looking for. AI will match you based on skills and personality.
                    </p>
                    
                    <textarea
                        value={teamRequirements}
                        onChange={(e) => setTeamRequirements(e.target.value)}
                        placeholder="e.g. I need a frontend developer who knows React and has a good design sense..."
                        className="w-full bg-ink/5 border border-ink/20 p-4 text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all min-h-[120px] font-mono text-sm mb-4 resize-y"
                    />

                    <Button onClick={handleTeamMatch} disabled={loading || !teamRequirements} className="w-full md:w-auto">
                        {loading ? 'SCANNING NETWORK...' : 'FIND TEAMMATES'}
                    </Button>
                </Card>

                {matches.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {matches.map((match) => (
                            <Card key={match.user_id} className="p-6 border-brand/20 hover:border-brand transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg text-ink">{match.name}</h4>
                                        <div className="text-xs text-ink/50 font-mono">{match.skills}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-brand">{match.match_score}%</div>
                                        <div className="text-xs text-brand/50 font-mono">MATCH</div>
                                    </div>
                                </div>
                                
                                <div className="bg-ink/5 p-3 mb-4 text-sm text-ink/70 italic border-l-2 border-brand/30">
                                    "{match.match_reason}"
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm">VIEW PROFILE</Button>
                                    <Button size="sm">CONNECT</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

export default AIParticipantTools;
