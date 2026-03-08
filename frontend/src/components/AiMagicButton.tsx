import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

// AI 动作类型
export type AIActionType = 
  | 'refine'           // 润色文本
  | 'brainstorm'       // 头脑风暴
  | 'generate'         // 生成内容
  | 'analyze'          // 分析内容
  | 'summarize'        // 总结内容
  | 'team_match'       // 智能组队
  | 'recruit_write'    // 招募文案
  | 'project_idea'     // 项目创意

// 按钮尺寸
export type ButtonSize = 'sm' | 'md' | 'lg'

// 按钮变体
export type ButtonVariant = 'primary' | 'ghost' | 'outline'

interface AiMagicButtonProps {
  // 核心属性
  actionType: AIActionType
  currentData: Record<string, any>
  
  // 回调
  onComplete: (result: string) => void
  onError?: (error: string) => void
  
  // 外观配置
  size?: ButtonSize
  variant?: ButtonVariant
  className?: string
  
  // 自定义文本
  label?: string
  loadingText?: string
  
  // 禁用状态
  disabled?: boolean
}

// API 端点映射
const API_ENDPOINTS: Record<AIActionType, string> = {
  refine: '/api/v1/ai/refine',
  brainstorm: '/api/v1/ai/brainstorm',
  generate: '/api/v1/ai/generate',
  analyze: '/api/v1/ai/analyze',
  summarize: '/api/v1/ai/summarize',
  team_match: '/api/v1/ai/team-match',
  recruit_write: '/api/v1/ai/recruitment-copy',
  project_idea: '/api/v1/ai/project-ideas'
}

// 默认提示文本
const DEFAULT_LABELS: Record<AIActionType, string> = {
  refine: '✨ AI 润色',
  brainstorm: '💡 AI 头脑风暴',
  generate: '✨ AI 生成',
  analyze: '🔍 AI 分析',
  summarize: '📝 AI 总结',
  team_match: '🔮 智能匹配',
  recruit_write: '✍️ AI 写文案',
  project_idea: '💡 AI 创意'
}

// 尺寸配置
const SIZE_CONFIG: Record<ButtonSize, { padding: string; fontSize: string; iconSize: string }> = {
  sm: { padding: 'px-3 py-1.5', fontSize: 'text-xs', iconSize: 'w-3.5 h-3.5' },
  md: { padding: 'px-4 py-2', fontSize: 'text-sm', iconSize: 'w-4 h-4' },
  lg: { padding: 'px-6 py-3', fontSize: 'text-base', iconSize: 'w-5 h-5' }
}

// 变体配置
const VARIANT_CONFIG: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-purple-600 to-blue-600
    text-white
    border border-transparent
    hover:from-purple-500 hover:to-blue-500
    shadow-lg shadow-purple-500/20
  `,
  ghost: `
    bg-transparent
    text-purple-400
    border border-purple-500/30
    hover:bg-purple-500/10
  `,
  outline: `
    bg-white/[0.03]
    text-gray-300
    border border-white/[0.1]
    hover:border-purple-500/50 hover:text-purple-400
  `
}

/**
 * AiMagicButton - 场景化 AI 按钮组件 (Smart Component)
 * 
 * 职责：
 * - 根据 actionType 调用对应的 AI API
 * - 展示加载动画（流光边框 + 打字机效果）
 * - 通过 onComplete 回调将结果传给父组件
 * - 保持与父组件的数据解耦
 */
export default function AiMagicButton({
  actionType,
  currentData,
  onComplete,
  onError,
  size = 'md',
  variant = 'primary',
  className = '',
  label,
  loadingText = 'AI 思考中...',
  disabled = false
}: AiMagicButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingDots, setLoadingDots] = useState('')

  // 打字机效果
  const startTypingEffect = useCallback(() => {
    const dots = ['', '.', '..', '...']
    let index = 0
    const interval = setInterval(() => {
      setLoadingDots(dots[index % dots.length])
      index++
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // 处理点击
  const handleClick = useCallback(async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    const stopTyping = startTypingEffect()

    try {
      const endpoint = API_ENDPOINTS[actionType]
      
      // 构建请求体
      const requestBody = {
        context: currentData,
        action: actionType,
        timestamp: new Date().toISOString()
      }

      const response = await axios.post(endpoint, requestBody, {
        timeout: 30000 // 30秒超时
      })

      // 处理不同格式的响应
      let result = ''
      if (typeof response.data === 'string') {
        result = response.data
      } else if (response.data.result) {
        result = response.data.result
      } else if (response.data.content) {
        result = response.data.content
      } else if (response.data.suggestions) {
        result = Array.isArray(response.data.suggestions) 
          ? response.data.suggestions.join('\n')
          : response.data.suggestions
      } else {
        result = JSON.stringify(response.data, null, 2)
      }

      onComplete(result)
    } catch (err: any) {
      console.error('AI API Error:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'AI 服务暂时不可用'
      onError?.(errorMsg)
    } finally {
      stopTyping()
      setIsLoading(false)
      setLoadingDots('')
    }
  }, [actionType, currentData, isLoading, disabled, onComplete, onError, startTypingEffect])

  const sizeCfg = SIZE_CONFIG[size]
  const variantCfg = VARIANT_CONFIG[variant]
  const displayLabel = label || DEFAULT_LABELS[actionType]

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading || disabled}
      whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
      whileTap={!isLoading && !disabled ? { scale: 0.98 } : {}}
      className={`
        relative overflow-hidden
        ${sizeCfg.padding}
        ${sizeCfg.fontSize}
        ${variantCfg}
        rounded-lg
        font-medium
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* 流光边框动画 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-lg"
          >
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent)',
                backgroundSize: '200% 100%'
              }}
              animate={{
                backgroundPosition: ['200% 0%', '-200% 0%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 按钮内容 */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {/* 旋转动画 */}
              <motion.svg
                className={sizeCfg.iconSize}
                fill="none"
                viewBox="0 0 24 24"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </motion.svg>
              
              {/* 打字机效果文字 */}
              <span>
                {loadingText}{loadingDots}
              </span>
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {/* 魔法图标 */}
              <svg 
                className={sizeCfg.iconSize} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
              <span>{displayLabel}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {/* 悬停光效 */}
      {!isLoading && !disabled && variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-200%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.button>
  )
}

// 使用示例组件
export function AiMagicButtonDemo() {
  const [result, setResult] = useState('')

  return (
    <div className="p-8 space-y-4">
      <div className="flex flex-wrap gap-4">
        <AiMagicButton
          actionType="refine"
          currentData={{ text: '这是一个需要润色的文本' }}
          onComplete={setResult}
          size="sm"
        />
        <AiMagicButton
          actionType="brainstorm"
          currentData={{ topic: 'AI 黑客松项目' }}
          onComplete={setResult}
          variant="ghost"
        />
        <AiMagicButton
          actionType="team_match"
          currentData={{ skills: ['React', 'Python'], mbti: 'INTJ' }}
          onComplete={setResult}
          size="lg"
          variant="outline"
        />
      </div>
      
      {result && (
        <div className="mt-4 p-4 bg-white/[0.05] rounded-lg border border-white/[0.1]">
          <h4 className="text-sm text-gray-400 mb-2">AI 结果：</h4>
          <p className="text-white whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  )
}
