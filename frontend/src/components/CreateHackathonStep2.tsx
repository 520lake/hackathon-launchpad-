import { useState, useRef, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import CriteriaSection from './CriteriaSection'
import PrizesSection from './PrizesSection'
import AIGenerateImageButton from './AIGenerateImageButton'

// 步骤2的数据结构
interface Step2Data {
  organizerName: string
  organizerLogo: string
  criteria: Array<{
    id: string
    name: string
    percentage: number
    description?: string
  }>
  prizeTiers: Array<{
    id: string
    name: string
    count: number
    description?: string
    prizes: Array<{
      id: string
      type: 'cash' | 'item'
      amount?: number
      name?: string
      description?: string
    }>
  }>
  totalPrizePool: number
}

interface CreateHackathonStep2Props {
  initialData?: Partial<Step2Data>
  onNext: (data: Step2Data) => void
  onBack: () => void
}

export default function CreateHackathonStep2({ initialData, onNext, onBack }: CreateHackathonStep2Props) {
  // 状态管理
  const [organizerName, setOrganizerName] = useState(initialData?.organizerName || '')
  const [organizerLogo, setOrganizerLogo] = useState(initialData?.organizerLogo || '')
  const [criteria, setCriteria] = useState(initialData?.criteria || [])
  const [prizeTiers, setPrizeTiers] = useState(initialData?.prizeTiers || [])
  const [totalPrizePool, setTotalPrizePool] = useState(initialData?.totalPrizePool || 0)
  const [isCriteriaValid, setIsCriteriaValid] = useState(false)
  
  // 上传状态
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理 Logo 上传
  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setUploadError('请上传图片文件')
      return
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片大小不能超过 5MB')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/v1/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.url) {
        setOrganizerLogo(response.data.url)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError('上传失败，请重试')
    } finally {
      setIsUploading(false)
      // 清空 input 以便可以重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  // 删除 Logo
  const removeLogo = () => {
    setOrganizerLogo('')
    setUploadError('')
  }

  // 处理下一步
  const handleNext = () => {
    const data: Step2Data = {
      organizerName,
      organizerLogo,
      criteria,
      prizeTiers,
      totalPrizePool
    }
    onNext(data)
  }

  // 检查是否可以继续
  const canProceed = isCriteriaValid && prizeTiers.length > 0 && organizerName.trim() !== ''

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* 页面头部 */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">创建活动</h1>
              <p className="text-sm text-gray-500">步骤 2/4：评审与奖项设置</p>
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
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2">
          {['基本信息', '详细信息', '日程安排', '预览发布'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                index === 1 
                  ? 'bg-[#FBBF24] text-black' 
                  : index < 1 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-white/[0.06] text-gray-500'
              }`}>
                {index < 1 ? (
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
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：主要内容 */}
          <div className="col-span-8 space-y-6">
            {/* 主办方信息卡片 */}
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">主办方信息</h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* 主办方名称 */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">主办方名称</label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="请输入主办方名称"
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Logo 上传 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-gray-400">主办方 Logo</label>
                    {!organizerLogo && (
                      <AIGenerateImageButton
                        buttonText="AI 生成"
                        scene="logo"
                        context={organizerName || '主办方'}
                        onImageGenerated={(url) => setOrganizerLogo(url)}
                        className="text-xs px-2 py-1"
                      />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <AnimatePresence mode="wait">
                    {organizerLogo ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-4"
                      >
                        {/* Logo 预览 */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/[0.08]">
                          <img
                            src={organizerLogo}
                            alt="主办方 Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={triggerFileSelect}
                            disabled={isUploading}
                            className="px-3 py-1.5 text-xs text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                          >
                            {isUploading ? '上传中...' : '更换'}
                          </button>
                          <AIGenerateImageButton
                            buttonText="AI 生成"
                            scene="logo"
                            context={organizerName || '主办方'}
                            onImageGenerated={(url) => setOrganizerLogo(url)}
                            className="text-xs px-3 py-1.5"
                          />
                          <button
                            onClick={removeLogo}
                            className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="upload"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={triggerFileSelect}
                        disabled={isUploading}
                        className="w-full h-16 border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-300 hover:border-white/[0.15] transition-colors disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">上传中...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">点击上传 Logo</span>
                          </>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* 错误提示 */}
                  {uploadError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 mt-2"
                    >
                      {uploadError}
                    </motion.p>
                  )}

                  <p className="text-xs text-gray-600 mt-2">支持上传 JPG、PNG 格式（最大 5MB），或使用 AI 生成</p>
                </div>
              </div>
            </div>

            {/* 评审标准组件 */}
            <CriteriaSection
              value={criteria}
              onChange={setCriteria}
              onValidationChange={setIsCriteriaValid}
            />

            {/* 奖项设置组件 */}
            <PrizesSection
              value={prizeTiers}
              onChange={setPrizeTiers}
              onTotalPrizeChange={setTotalPrizePool}
            />
          </div>

          {/* 右侧：预览与统计 */}
          <div className="col-span-4 space-y-4">
            {/* 实时预览卡片 */}
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 sticky top-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">实时预览</h4>
              
              {/* 主办方预览 */}
              <div className="mb-6 pb-6 border-b border-white/[0.06]">
                <h5 className="text-xs text-gray-500 mb-3">主办方</h5>
                <div className="flex items-center gap-3">
                  {organizerLogo ? (
                    <img
                      src={organizerLogo}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg object-cover border border-white/[0.08]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <span className="text-sm text-white truncate">
                    {organizerName || '未设置主办方'}
                  </span>
                </div>
              </div>
              
              {/* 评审标准预览 */}
              <div className="mb-6">
                <h5 className="text-xs text-gray-500 mb-2">评审标准 ({criteria.length})</h5>
                {criteria.length > 0 ? (
                  <div className="space-y-1.5">
                    {criteria.map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 truncate flex-1">{i + 1}. {c.name || '未命名'}</span>
                        <span className="text-purple-400 ml-2">{c.percentage}%</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">总计</span>
                        <span className={`font-medium ${
                          criteria.reduce((s, c) => s + c.percentage, 0) === 100 
                            ? 'text-green-400' 
                            : 'text-orange-400'
                        }`}>
                          {criteria.reduce((s, c) => s + c.percentage, 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 italic">暂无评审标准</p>
                )}
              </div>

              {/* 奖项预览 */}
              <div>
                <h5 className="text-xs text-gray-500 mb-2">奖项设置 ({prizeTiers.length})</h5>
                {prizeTiers.length > 0 ? (
                  <div className="space-y-3">
                    {prizeTiers.map((tier, i) => (
                      <div key={tier.id} className="bg-black/20 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{tier.name || `奖项 ${i + 1}`}</span>
                          <span className="text-xs text-gray-500">×{tier.count} 名</span>
                        </div>
                        <div className="space-y-1">
                          {tier.prizes.map((prize, pi) => (
                            <div key={prize.id} className="flex items-center gap-2 text-xs">
                              {prize.type === 'cash' ? (
                                <>
                                  <span className="text-green-400">¥</span>
                                  <span className="text-gray-400">
                                    {(prize.amount || 0).toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-blue-400">🎁</span>
                                  <span className="text-gray-400">{prize.name || '物品'}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* 总奖金池 */}
                    {totalPrizePool > 0 && (
                      <div className="pt-3 mt-3 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">总奖金池</span>
                          <span className="text-lg font-bold text-green-400">
                            ¥{totalPrizePool >= 10000 
                              ? `${(totalPrizePool / 10000).toFixed(1)}万` 
                              : totalPrizePool.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 italic">暂无奖项设置</p>
                )}
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-blue-400 mb-1">提示</h5>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    • 评审标准总和必须等于 100%<br/>
                    • 建议设置 3-5 个评审维度<br/>
                    • 奖项层级建议包含金银铜奖<br/>
                    • Logo 建议尺寸 200×200 像素
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部固定栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="px-6 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              上一步
            </button>

            {/* 状态提示 */}
            <div className="flex items-center gap-4">
              {!organizerName.trim() && (
                <span className="text-sm text-orange-400">
                  请填写主办方名称
                </span>
              )}
              {!isCriteriaValid && criteria.length > 0 && (
                <span className="text-sm text-orange-400">
                  评审标准总和需等于 100%
                </span>
              )}
              {prizeTiers.length === 0 && (
                <span className="text-sm text-orange-400">
                  请至少设置一个奖项
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
