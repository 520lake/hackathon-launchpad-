import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Lightbulb, UserPlus, Wand2 } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AIProjectAssistantProps {
    onIdeaSelect?: (idea: any) => void;
    onRecruitmentGenerate?: (recruitments: any[]) => void;
    onRefineDescription?: (description: string) => void;
    currentDescription?: string;
    mode: 'idea' | 'recruitment' | 'refine';
}

const AIProjectAssistant: React.FC<AIProjectAssistantProps> = ({ 
    onIdeaSelect, 
    onRecruitmentGenerate, 
    onRefineDescription,
    currentDescription,
    mode 
}) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        if (!input && mode !== 'refine') return;
        if (mode === 'refine' && !currentDescription) return;

        setLoading(true);
        try {
            let endpoint = '';
            let payload = {};

            if (mode === 'idea') {
                endpoint = '/ai/generate-project-idea';
                payload = { keywords: input };
            } else if (mode === 'recruitment') {
                endpoint = '/ai/generate-recruitment';
                payload = { 
                    project_name: input, // User can input project name or we can pass it via props
                    project_description: currentDescription || input 
                };
            } else if (mode === 'refine') {
                endpoint = '/ai/refine-project';
                payload = { description: currentDescription };
            }

            const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setResult(response.data);

            if (mode === 'idea' && onIdeaSelect) {
                onIdeaSelect(response.data);
            }
            if (mode === 'recruitment' && onRecruitmentGenerate) {
                onRecruitmentGenerate(response.data);
            }
            if (mode === 'refine' && onRefineDescription) {
                onRefineDescription(response.data.refined_description);
            }

        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-black/40 border border-brand/20 p-4 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 text-brand">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                    {mode === 'idea' && 'AI Project Brainstorm'}
                    {mode === 'recruitment' && 'AI Role Scout'}
                    {mode === 'refine' && 'AI Content Polisher'}
                </h3>
            </div>

            <div className="flex gap-2 mb-4">
                {mode !== 'refine' && (
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            mode === 'idea' ? "Enter keywords (e.g., 'Eco-friendly, Blockchain')..." :
                            "Enter project name..."
                        }
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                    />
                )}
                
                <button
                    onClick={handleGenerate}
                    disabled={loading || (mode !== 'refine' && !input)}
                    className="bg-brand text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand/80 disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {mode === 'refine' ? 'Refine' : 'Generate'}
                </button>
            </div>

            {result && mode === 'idea' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-bold text-brand mb-1">{result.title}</h4>
                        <p className="text-sm text-gray-300 mb-2">{result.description}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {result.tech_stack?.map((tech: string, i: number) => (
                                <span key={i} className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded">
                                    {tech}
                                </span>
                            ))}
                        </div>
                        {onIdeaSelect && (
                            <button 
                                onClick={() => onIdeaSelect(result)}
                                className="w-full mt-2 text-xs bg-white/10 hover:bg-white/20 text-white py-1.5 rounded transition-colors"
                            >
                                Use This Idea
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            {result && mode === 'refine' && (
                 <div className="p-3 bg-white/5 rounded-lg border border-white/10 animate-in fade-in">
                    <p className="text-sm text-gray-300">{result.refined_description}</p>
                 </div>
            )}
        </div>
    );
};

export default AIProjectAssistant;
