import { useState } from 'react'
import { motion } from 'framer-motion'
import ScheduleSection from './ScheduleSection'

// 步骤3的数据结构
interface Step3Data {
  nodes: Array<{
    id: string
    type: 'spot' | 'range'
    name: string
    spotDate?: string
    spotTime?: string
    startDate?: string
    startTime?: string
    endDate?: string
    endTime?: string
  }>
  startDate: string | null
  endDate: string | null
}

interface CreateHackathonStep3Props {
  initialData?: Partial<Step3Data>
  onNext: (data: Step3Data) => void
  onBack: () => void
}

export default function CreateHackathonStep3({ initialData, onNext, onBack }: CreateHackathonStep3Props) {
  // 状态管理
  const [scheduleData, setScheduleData] = useState<Step3Data>({
    nodes: initialData?.nodes || [],
    startDate: initialData?.startDate || null,
    endDate: initialData?.endDate || null
  })

  // 处理日程变化
  const handleScheduleChange = (data: {
    nodes: Step3Data['nodes']
    startDate: string | null
    endDate: string | null
  }) => {
    setScheduleData(data)
  }

  // 处理下一步
  const handleNext = () => {
    onNext(scheduleData)
  }

  // 检查是否可以继续（至少有一个节点）
  const canProceed = scheduleData.nodes.length > 0

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* 页面头部 */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">创建活动</h1>
              <p className="text-sm text-gray-500">步骤 3/4：日程安排</p>
            </div>
            <button
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← 返回上一步
            </button>
          </div>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2">
          {['基本信息', '详细信息', '日程安排', '预览发布'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                index === 2 
                  ? 'bg-[#FBBF24] text-black' 
                  : index < 2 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-white/[0.06] text-gray-500'
              }`}>
                {index < 2 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center text-xs">{index + 1}</span>
                )}
                <span>{step}</span>
              </div>
              {index < 3 && (
                <div className="w-8 h-px bg-white/[0.08] mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-6 pb-32">
        <ScheduleSection
          value={scheduleData.nodes}
          onChange={handleScheduleChange}
        />
      </div>

      {/* 底部固定栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="px-6 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              上一步
            </button>

            {/* 状态提示 */}
            <div className="flex items-center gap-4">
              {scheduleData.nodes.length === 0 && (
                <span className="text-sm text-orange-400">
                  请至少添加一个日程节点
                </span>
              )}
              {scheduleData.startDate && scheduleData.endDate && (
                <span className="text-sm text-green-400">
                  活动时间：{new Date(scheduleData.startDate).toLocaleDateString('zh-CN')} ~ {new Date(scheduleData.endDate).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>

            <motion.button
              onClick={handleNext}
              disabled={!canProceed}
              whileHover={canProceed ? { scale: 1.02 } : {}}
              whileTap={canProceed ? { scale: 0.98 } : {}}
              className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                canProceed
                  ? 'bg-[#FBBF24] text-black hover:bg-[#F59E0B]'
                  : 'bg-white/[0.06] text-gray-500 cursor-not-allowed'
              }`}
            >
              下一步 →
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
