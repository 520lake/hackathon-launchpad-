import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

interface AIProjectAssistantProps {
  isOpen: boolean
  onClose: () => void
  hackathonId?: number
  onApplyContent?: (content: string) => void
  mode?: string
  currentDescription?: string
  onIdeaSelect?: (idea: any) => void
  onRecruitmentGenerate?: (recruitments: any) => void
  onRefineDescription?: (refined: any) => void
}

type AssistantMode = 'brainstorm' | 'recruitment' | 'polish'

export default function AIProjectAssistant({ isOpen, onClose, hackathonId, onApplyContent }: AIProjectAssistantProps) {
  const [mode, setMode] = useState<AssistantMode>('brainstorm')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const modes = [
    {
      id: 'brainstorm' as AssistantMode,
      label: '创意生成',
      icon: '💡',
      description: '基于主题和技能生成项目创意',
      placeholder: '输入活动主题、您的技能和兴趣，例如：AI主题，熟悉Python和React，对NLP感兴趣...'
    },
    {
      id: 'recruitment' as AssistantMode,
      label: '招募文案',
      icon: '📢',
      description: '生成吸引人的招募文案',
      placeholder: '输入团队信息和招募需求，例如：寻找前端开发，团队已有3人，项目是关于...'
    },
    {
      id: 'polish' as AssistantMode,
      label: '描述润色',
      icon: '✨',
      description: '优化项目描述和介绍',
      placeholder: '粘贴您需要润色的内容...'
    }
  ]

  const handleGenerate = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const token = localStorage.getItem('token')
      let res
      
      switch (mode) {
        case 'brainstorm':
          res = await axios.post('/api/v1/ai/brainstorm-ideas', {
            theme: input,
            skills: '',
            interests: ''
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setResult({ type: 'brainstorm', data: res.data.ideas })
          break
          
        case 'recruitment':
          // 使用通用的AI生成端点
          res = await axios.post('/api/v1/ai/generate', {
            prompt: `生成一段招募文案：${input}`,
            type: 'recruitment'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setResult({ type: 'recruitment', data: res.data.content })
          break
          
        case 'polish':
          res = await axios.post('/api/v1/ai/generate', {
            prompt: `润色以下文本，使其更专业、更有吸引力：${input}`,
            type: 'polish'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setResult({ type: 'polish', data: res.data.content })
          break
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || '生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (content: string) => {
    if (onApplyContent) {
      onApplyContent(content)
      onClose()
    }
  }

  const currentMode = modes.find(m => m.id === mode)!

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-[24px] z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[20px] bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/30 flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI 项目助手</h3>
                  <p className="text-[11px] text-zinc-500">智能生成创意、文案和润色内容</p>
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mode Selection */}
            <div className="px-6 py-4 border-b border-zinc-800">
              <div className="flex gap-2">
                {modes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id)
                      setInput('')
                      setResult(null)
                      setError('')
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[24px] text-sm transition-all ${
                      mode === m.id
                        ? 'bg-brand/10 border border-brand/50 text-brand'
                        : 'border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">{currentMode.description}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Input */}
              <div className="mb-6">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentMode.placeholder}
                  className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-[13px] text-white placeholder-zinc-600 focus:border-brand/50 focus:outline-none resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !input.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-brand text-black text-[13px] font-medium rounded-[24px] hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        生成中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        生成内容
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                  <p className="text-[12px] text-red-400">{error}</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Brainstorm Results */}
                  {result.type === 'brainstorm' && (
                    <div className="space-y-3">
                      {result.data.map((idea: any, idx: number) => (
                        <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-white font-medium">{idea.title}</h4>
                            <span className={`px-2 py-0.5 text-[10px] rounded-[24px] ${
                              idea.complexity === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                              idea.complexity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {idea.complexity}
                            </span>
                          </div>
                          <p className="text-[12px] text-zinc-400 mb-3">{idea.description}</p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {idea.tech_stack?.split(',').map((tech: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-zinc-900 text-zinc-500 text-[10px] rounded-[24px] border border-zinc-800">
                                {tech.trim()}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-500">
                              影响力: <span className="text-brand">{idea.impact_potential?.score || '--'}</span>/100
                            </span>
                            <button
                              onClick={() => handleApply(`${idea.title}\n\n${idea.description}\n\n技术栈: ${idea.tech_stack}`)}
                              className="text-[11px] text-brand hover:text-white transition-colors"
                            >
                              使用此创意 →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recruitment/Polish Results */}
                  {(result.type === 'recruitment' || result.type === 'polish') && (
                    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">
                      <pre className="text-[13px] text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                      </pre>
                      <div className="flex justify-end mt-4 pt-4 border-t border-zinc-700">
                        <button
                          onClick={() => handleApply(typeof result.data === 'string' ? result.data : JSON.stringify(result.data))}
                          className="flex items-center gap-2 px-4 py-2 bg-brand text-black text-[12px] font-medium rounded-[24px] hover:bg-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          应用内容
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Empty State */}
              {!result && !loading && !error && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-[24px] bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <span className="text-3xl">{currentMode.icon}</span>
                  </div>
                  <p className="text-zinc-500 text-[13px]">输入内容并点击生成</p>
                  <p className="text-zinc-600 text-[11px] mt-1">AI 将为您生成专业的{currentMode.label}内容</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
