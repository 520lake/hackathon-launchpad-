import { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

interface AIGenerateImageButtonProps {
  onImageGenerated: (url: string) => void
  buttonText?: string
  className?: string
  context?: string
  // 新增：场景类型，用于区分不同场景的描述
  scene?: 'avatar' | 'cover' | 'logo' | 'general'
}

export default function AIGenerateImageButton({
  onImageGenerated,
  buttonText = 'AI 生图',
  className = '',
  context = '',
  scene = 'general'
}: AIGenerateImageButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  const [error, setError] = useState('')

  // 根据场景获取默认提示词
  const getDefaultPrompt = () => {
    switch (scene) {
      case 'avatar':
        return '一个专业的个人头像，简洁现代风格，适合技术社区使用'
      case 'cover':
        return context || '黑客松活动海报，科技感设计，深色背景'
      case 'logo':
        return context || '简洁的组织Logo设计，现代风格，适合作为品牌标识'
      default:
        return context || ''
    }
  }

  // 根据场景获取标题和描述
  const getSceneInfo = () => {
    switch (scene) {
      case 'avatar':
        return {
          title: 'AI 生成头像',
          desc: '描述你想要的头像风格',
          placeholder: '例如：一个专业的程序员头像，戴着眼镜，微笑，蓝色背景...'
        }
      case 'cover':
        return {
          title: 'AI 生成封面',
          desc: '描述活动海报的风格',
          placeholder: '例如：科技感黑客松海报，深蓝色背景，有代码和电路板元素...'
        }
      case 'logo':
        return {
          title: 'AI 生成 Logo',
          desc: '描述 Logo 的设计风格',
          placeholder: '例如：简洁的几何图形Logo，现代科技感，适合技术社区...'
        }
      default:
        return {
          title: 'AI 生成图片',
          desc: '输入描述，AI 将为你生成图片',
          placeholder: '描述你想要的图片...'
        }
    }
  }

  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || getDefaultPrompt()

    setIsGenerating(true)
    setError('')

    try {
      const token = localStorage.getItem('token')

      const response = await axios.post(
        '/api/v1/ai/generate-image',
        {
          prompt: finalPrompt,
          style: 'vivid',
          size: '1024x1024'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.url) {
        setGeneratedImage(response.data.url)
      }
    } catch (err: any) {
      console.error('Image generation error:', err)
      setError(err.response?.data?.detail || '生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage)
      setIsOpen(false)
      setPrompt('')
      setGeneratedImage('')
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setPrompt('')
    setGeneratedImage('')
    setError('')
  }

  const sceneInfo = getSceneInfo()

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-brand text-black text-sm font-bold uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50 border-0 rounded-[16px] ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {buttonText}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-surface border border-brand/20 w-full max-w-lg overflow-hidden rounded-[24px]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header - 主题风格 */}
              <div className="p-4 border-b border-brand/20 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand text-black flex items-center justify-center rounded-[16px]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-brand uppercase tracking-wider">{sceneInfo.title}</h3>
                    <p className="text-xs text-gray-500 font-mono">{sceneInfo.desc}</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-brand text-xl transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Prompt Input - 主题风格 */}
                <div>
                  <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">
                    图片描述
                  </label>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={sceneInfo.placeholder}
                    className="w-full h-24 px-4 py-3 bg-black/60 border border-brand/30 text-white placeholder-gray-600 focus:border-brand focus:outline-none font-mono text-sm resize-none transition-all rounded-[16px]"
                    disabled={isGenerating}
                  />
                </div>

                {/* Generated Image Preview */}
                {generatedImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-video border border-brand/20 overflow-hidden bg-black/40 rounded-[16px]"
                  >
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-xs text-brand font-mono">AI 生成结果</span>
                      <button
                        onClick={() => setGeneratedImage('')}
                        className="px-3 py-1 bg-brand/20 hover:bg-brand/30 border border-brand/30 text-brand text-xs font-bold uppercase transition-colors"
                      >
                        重新生成
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-[16px]">
                    <p className="text-xs text-red-400 font-mono">{error}</p>
                  </div>
                )}

                {/* Actions - 主题风格 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 bg-black/60 border border-brand/30 text-gray-300 font-bold uppercase text-sm tracking-wider hover:border-brand hover:text-white transition-all rounded-[16px]"
                  >
                    取消
                  </button>
                  {!generatedImage ? (
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 px-4 py-3 bg-brand text-black font-black uppercase text-sm tracking-wider hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 rounded-[16px]"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                          开始生成
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirm}
                      className="flex-1 px-4 py-3 bg-brand text-black font-black uppercase text-sm tracking-wider hover:bg-white transition-all flex items-center justify-center gap-2 rounded-[16px]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      使用此图片
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
