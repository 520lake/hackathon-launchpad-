import { motion } from 'framer-motion'

interface StartProjectButtonProps {
  /** 点击回调 */
  onClick?: () => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义文本 */
  text?: string
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否显示副标题 */
  showSubtitle?: boolean
}

export default function StartProjectButton({
  onClick,
  disabled = false,
  text = '立即开始',
  size = 'lg',
  showSubtitle = true
}: StartProjectButtonProps) {
  const sizeClasses = {
    sm: 'px-6 py-2 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-12 py-4 text-lg'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`
          ${sizeClasses[size]}
          w-full max-w-md
          bg-[#FBBF24] 
          text-black 
          font-semibold 
          rounded-xl
          transition-all duration-300
          hover:bg-[#F59E0B]
          hover:shadow-lg hover:shadow-[#FBBF24]/20
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {text}
      </motion.button>
      
      {showSubtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-sm text-gray-500"
        >
          开始创建项目，体验 AI 辅助开发
        </motion.p>
      )}
    </motion.div>
  )
}

// 使用示例
export function StartProjectButtonDemo() {
  return (
    <div className="p-8 bg-[#0A0A0A] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <StartProjectButton 
          onClick={() => console.log('开始项目')}
          text="立即开始"
          size="lg"
        />
        
        <StartProjectButton 
          onClick={() => console.log('创建团队')}
          text="创建团队"
          size="md"
          showSubtitle={false}
        />
        
        <StartProjectButton 
          disabled
          text="活动已结束"
          size="md"
        />
      </div>
    </div>
  )
}
