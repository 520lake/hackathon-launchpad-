import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, UserPlus, MessageCircle, Loader2, Zap } from 'lucide-react';

interface MatchResult {
  user_id: number;
  name: string;
  avatar_url?: string;
  skills?: string;
  interests?: string;
  match_score: number;
  match_reason: string;
  key_skill: string;
  why_match: string;
}

interface AIMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember?: { id: number; name: string; avatar: string; skills: string; bio: string } | null;
}

export default function AIMatchModal({ isOpen, onClose, targetMember }: AIMatchModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [aiSource, setAiSource] = useState<'ai' | 'local' | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStreamContent('');
      setMatches([]);
      setSummary('');
      setError('');
      setShowResults(false);
      setHasStarted(false);
      setAiSource(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamContent]);

  // 自动开始匹配
  useEffect(() => {
    if (isOpen && !hasStarted && !isLoading) {
      setHasStarted(true);
      handleMatch();
    }
  }, [isOpen, hasStarted]);

  const handleMatch = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setStreamContent('正在连接服务器...');
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      console.log('[AI Match] Starting request...');
      const response = await fetch('/api/v1/ai/community-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requirements: targetMember ? `我想和 ${targetMember.name} 组队` : null
        })
      });

      console.log('[AI Match] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Match] HTTP Error:', response.status, errorText);
        throw new Error(`服务器错误 ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应数据');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let receivedResult = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[AI Match] Stream done');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('[AI Match] Received:', data.type);
              
              if (data.type === 'content') {
                setStreamContent(prev => prev + data.content);
              } else if (data.type === 'result') {
                receivedResult = true;
                setMatches(data.data.matches || []);
                setSummary(data.data.summary || '');
                setAiSource(data.data.source || 'local');
                setShowResults(true);
                console.log('[AI Match] Results:', data.data.matches?.length, 'matches, source:', data.data.source);
              } else if (data.type === 'error') {
                setError(data.error);
              } else if (data.type === 'done') {
                if (!receivedResult) {
                  setError('未收到匹配结果，请重试');
                }
              }
            } catch (e) {
              console.error('[AI Match] Parse error:', e, line);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[AI Match] Error:', err);
      setError(err.message || '匹配失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-[24px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-[16px]">
              <Sparkles className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {targetMember ? `与 ${targetMember.name} 的匹配分析` : 'AI智能匹配队友'}
              </h3>
              <p className="text-xs text-zinc-500">
                {targetMember ? '基于双方资料分析匹配度' : '基于你的资料智能推荐'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-zinc-800 rounded-[16px] transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]" ref={contentRef}>
          {/* 目标成员信息 */}
          {targetMember && (
            <div className="mb-6 p-4 bg-zinc-800/50 rounded-[16px] flex items-center gap-4">
              <img
                src={targetMember.avatar}
                alt={targetMember.name}
                className="w-14 h-14 rounded-[16px] bg-zinc-700"
              />
              <div className="flex-1">
                <h4 className="font-medium text-white">{targetMember.name}</h4>
                <p className="text-sm text-zinc-400 line-clamp-1">{targetMember.bio}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetMember.skills?.split(',').slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded-full">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isLoading && !showResults && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">AI 正在分析匹配中...</p>
                {streamContent && (
                  <div className="mt-4 max-w-md mx-auto">
                    <p className="text-xs text-zinc-500 text-left whitespace-pre-wrap">{streamContent}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-[16px]">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {showResults && matches.length > 0 && (
            <div className="space-y-6">
              {aiSource && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                  aiSource === 'ai' 
                    ? 'bg-brand/10 border-brand/30 text-brand' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}>
                  {aiSource === 'ai' ? (
                    <><Sparkles className="w-3 h-3" /> 魔搭AI分析</>
                  ) : (
                    <><Zap className="w-3 h-3" /> 本地算法匹配</>
                  )}
                </div>
              )}
              
              {summary && (
                <div className="p-4 bg-gradient-to-r from-brand/10 to-purple-500/10 border border-brand/30 rounded-[16px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span className="text-sm font-medium text-brand">分析结果</span>
                  </div>
                  <p className="text-sm text-zinc-300">{summary}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-400">
                  {targetMember ? '匹配结果' : '为你推荐的队友'}
                </h4>
                {matches.map((match, index) => (
                  <motion.div
                    key={match.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 bg-zinc-800/50 border rounded-[16px] transition-colors ${
                      targetMember && match.user_id === targetMember.id 
                        ? 'border-brand/50 bg-brand/5' 
                        : 'border-zinc-700 hover:border-brand/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={match.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.user_id}`}
                          alt={match.name}
                          className="w-12 h-12 rounded-[16px] bg-zinc-700"
                        />
                        <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-brand text-black text-xs font-bold rounded-full">
                          {match.match_score}%
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-white truncate">{match.name}</h5>
                          {targetMember && match.user_id === targetMember.id && (
                            <span className="px-2 py-0.5 bg-brand/20 text-brand text-xs rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              目标成员
                            </span>
                          )}
                          {match.key_skill && (
                            <span className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded-full">
                              {match.key_skill}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 mb-2">{match.match_reason}</p>
                        <p className="text-xs text-zinc-500">{match.why_match}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-zinc-700 rounded-[12px] transition-colors" title="发消息">
                          <MessageCircle className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button className="p-2 hover:bg-brand/20 rounded-[12px] transition-colors" title="邀请组队">
                          <UserPlus className="w-4 h-4 text-brand" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {showResults && matches.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-zinc-400">暂无匹配结果</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          {!showResults ? (
            <button
              onClick={handleMatch}
              disabled={isLoading}
              className="w-full py-3 bg-brand hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded-[16px] flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI 分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  开始AI匹配
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResults(false);
                  handleMatch();
                }}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-[16px] transition-colors"
              >
                重新分析
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-brand hover:bg-brand/90 text-black font-medium rounded-[16px] transition-colors"
              >
                完成
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
