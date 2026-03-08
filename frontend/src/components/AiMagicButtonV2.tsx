import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

// ============================================
// 类型定义
// ============================================

export type AIActionType = 
  | 'brainstorm'           // 头脑风暴
  | 'refine'               // 润色项目
  | 'generate_criteria'    // 生成评审标准
  | 'generate_recruitment' // 生成招募帖
  | 'generate_ideas'       // 生成创意
  | 'summarize'            // 总结内容
  | 'expand'               // 扩写内容

interface AiMagicButtonProps {
  /** AI 动作类型 */
  actionType: AIActionType
  /** 传递给 AI 的上下文数据 */
  inputData?: any
  /** 成功回调，接收 AI 返回结果 */
  onSuccess: (result: string) => void
  /** 失败回调（可选） */
  onError?: (error: string) => void
  /** 按钮文字 */
  buttonText?: string
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 圆角风格 */
  rounded?: 'full' | 'xl'
  /** 自定义类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
}

// ============================================
// API 端点映射
// ============================================

const API_ENDPOINTS: Record<AIActionType, string> = {
  brainstorm: '/api/v1/ai/brainstorm-ideas',
  refine: '/api/v1/ai/refine-project',
  generate_criteria: '/api/v1/ai/generate-criteria',
  generate_recruitment: '/api/v1/ai/recruitment-copy',
  generate_ideas: '/api/v1/ai/project-ideas',
  summarize: '/api/v1/ai/summarize',
  expand: '/api/v1/ai/expand'
}

// ============================================
// 默认提示文本
// ============================================

const DEFAULT_BUTTON_TEXT = '✨ AI 魔法'

const LOADING_TEXTS = [
  'AI 正在施展魔法',
  'AI 正在施展魔法.',
  'AI 正在施展魔法..',
  'AI 正在施展魔法...'
]

// ============================================
// 尺寸配置
// ============================================

const SIZE_CONFIG = {
  sm: {
    padding: 'px-4 py-2',
    fontSize: 'text-xs',
    iconSize: 'w-3.5 h-3.5',
    spinnerSize: 'w-4 h-4'
  },
  md: {
    padding: 'px-6 py-2.5',
    fontSize: 'text-sm',
    iconSize: 'w-4 h-4',
    spinnerSize: 'w-5 h-5'
  },
  lg: {
    padding: 'px-8 py-3',
    fontSize: 'text-base',
    iconSize: 'w-5 h-5',
    spinnerSize: 'w-6 h-6'
  }
} as const

// ============================================
// Toast 组件
// ============================================

interface ToastProps {
  message: string
  type: 'error' | 'success'
  onClose: () => void
}

function SoftToast({ message, type, onClose }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`
        fixed top-6 left-1/2 -translate-x-1/2 z-50
        px-6 py-3 rounded-2xl
        backdrop-blur-xl
        border
        shadow-2xl
        flex items-center gap-3
        ${type === 'error' 
          ? 'bg-red-500/10 border-red-500/30 text-red-400' 
          : 'bg-green-500/10 border-green-500/30 text-green-400'
        }
      `}
    >
      {type === 'error' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}

// ============================================
// 流光边框动画组件
// ============================================

function FlowingBorder({ isActive }: { isActive: boolean }) {
  if (!isActive) return null

  return (
    <>
      {/* 外层流光 */}
      <motion.div
        className="absolute -inset-[1px] rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'conic-gradient(from 0deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        {/* 内层遮罩，创建边框效果 */}
        <div className="absolute inset-[1px] bg-[#0A0A0A] rounded-full" />
      </motion.div>
      
      {/* 光晕效果 */}
      <motion.div
        className="absolute -inset-2 rounded-full blur-xl"
        style={{
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))',
          backgroundSize: '200% 100%'
        }}
        animate={{
          backgroundPosition: ['0% 50%', '200% 50%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </>
  )
}

// ============================================
// 主组件
// ============================================

export default function AiMagicButton({
  actionType,
  inputData,
  onSuccess,
  onError,
  buttonText = DEFAULT_BUTTON_TEXT,
  size = 'md',
  rounded = 'full',
  className = '',
  disabled = false
}: AiMagicButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingTextIndex, setLoadingTextIndex] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const sizeCfg = SIZE_CONFIG[size]
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-xl'

  // 打字机效果
  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setLoadingTextIndex(prev => (prev + 1) % LOADING_TEXTS.length)
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  // 自动关闭 Toast
  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      setToast(null)
    }, 4000)

    return () => clearTimeout(timer)
  }, [toast])

  // 处理魔法点击
  const handleMagicClick = useCallback(async () => {
    if (isLoading || disabled) return

    setIsLoading(true)

    try {
      const endpoint = API_ENDPOINTS[actionType]
      
      // 构建请求体
      const requestBody = {
        input: inputData,
        context: {
          actionType,
          timestamp: new Date().toISOString()
        }
      }

      const response = await axios.post(endpoint, requestBody, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      // 处理响应
      let result = ''
      if (typeof response.data === 'string') {
        result = response.data
      } else if (response.data.result) {
        result = response.data.result
      } else if (response.data.content) {
        result = response.data.content
      } else if (response.data.suggestions) {
        result = Array.isArray(response.data.suggestions)
          ? response.data.suggestions.join('\n\n')
          : response.data.suggestions
      } else if (response.data.ideas) {
        result = Array.isArray(response.data.ideas)
          ? response.data.ideas.join('\n\n')
          : response.data.ideas
      } else {
        result = JSON.stringify(response.data, null, 2)
      }

      // 成功回调
      onSuccess(result)
      
      // 显示成功提示
      setToast({ message: 'AI 魔法施展成功！', type: 'success' })
      
    } catch (err: any) {
      console.error('AI Magic Error:', err)
      
      const errorMessage = err.response?.data?.detail 
        || err.message 
        || '魔法网络连接失败'
      
      // 失败回调
      onError?.(errorMessage)
      
      // 显示错误提示
      setToast({ message: errorMessage, type: 'error' })
      
    } finally {
      setIsLoading(false)
      setLoadingTextIndex(0)
    }
  }, [actionType, inputData, isLoading, disabled, onSuccess, onError])

  return (
    <>
      {/* Toast 提示 */}
      <AnimatePresence>
        {toast && (
          <SoftToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* 按钮 */}
      <motion.button
        onClick={handleMagicClick}
        disabled={isLoading || disabled}
        whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !disabled ? { scale: 0.98 } : {}}
        className={`
          relative
          ${sizeCfg.padding}
          ${sizeCfg.fontSize}
          ${roundedClass}
          font-medium
          transition-all duration-300
          disabled:cursor-not-allowed
          ${className}
        `}
      >
        {/* 流光边框（加载时显示） */}
        <FlowingBorder isActive={isLoading} />

        {/* 按钮背景和内容 */}
        <div
          className={`
            relative z-10
            flex items-center justify-center gap-2
            ${isLoading 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400' 
              : 'text-white'
            }
          `}
        >
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
                  className={sizeCfg.spinnerSize}
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
                    stroke="url(#gradient)"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="url(#gradient)"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </motion.svg>
                
                {/* 打字机效果文字 */}
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {LOADING_TEXTS[loadingTextIndex]}
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
                {/* 星星图标 */}
                <motion.svg
                  className={sizeCfg.iconSize}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinecap="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </motion.svg>
                
                {/* 渐变文字 */}
                <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  {buttonText}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* 默认背景（非加载状态） */}
        {!isLoading && (
          <div
            className={`
              absolute inset-0 
              ${roundedClass}
              bg-white/5 
              backdrop-blur-md
              border border-white/10
              group-hover:border-white/20
              transition-colors duration-300
            `}
          />
        )}

        {/* 加载时的深色背景 */}
        {isLoading && (
          <div
            className={`
              absolute inset-[1px]
              ${roundedClass}
              bg-[#0A0A0A]
            `}
          />
        )}

        {/* 悬停光效 */}
        {!isLoading && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)'
            }}
          />
        )}
      </motion.button>
    </>
  )
}

// ============================================
// 使用示例
// ============================================

export function AiMagicButtonDemo() {
  const [result, setResult] = useState('')

  return (
    <div className="p-8 space-y-6 bg-[#0A0A0A] min-h-screen">
      <h2 className="text-white text-xl font-bold mb-6">AiMagicButton 组件演示</h2>
      
      <div className="flex flex-wrap gap-4">
        {/* 头脑风暴 */}
        <AiMagicButton
          actionType="brainstorm"
          inputData={{ topic: 'AI 教育应用', context: '针对中小学生的AI学习工具' }}
          onSuccess={setResult}
          size="sm"
        />

        {/* 润色项目 */}
        <AiMagicButton
          actionType="refine"
          inputData="这是一个帮助学生学习编程的平台"
          onSuccess={setResult}
          buttonText="✨ AI 润色"
        />

        {/* 生成评审标准 */}
        <AiMagicButton
          actionType="generate_criteria"
          inputData={{ type: 'AI 创新赛', focus: '技术实现和商业模式' }}
          onSuccess={setResult}
          size="lg"
          buttonText="✨ 生成评审标准"
        />

        {/* 生成招募帖 */}
        <AiMagicButton
          actionType="generate_recruitment"
          inputData={{ role: '前端开发', skills: ['React', 'TypeScript'], project: 'AI 助手平台' }}
          onSuccess={setResult}
          rounded="xl"
          buttonText="✨ 写招募帖"
        />
      </div>

      {/* 结果展示 */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl"
        >
          <h3 className="text-sm font-medium text-gray-400 mb-3">AI 返回结果：</h3>
          <pre className="text-white whitespace-pre-wrap text-sm leading-relaxed">{result}</pre>
        </motion.div>
      )}
    </div>
  )
}
