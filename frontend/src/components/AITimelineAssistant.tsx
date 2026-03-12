import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";

// ============================================
// 类型定义
// ============================================

type AIStepStatus = "pending" | "active" | "completed" | "error";

interface AIStep {
  id: string;
  label: string;
  date?: string;
  status: AIStepStatus;
  content?: string;
  icon?: string;
}

interface AITimelineAssistantProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 应用内容回调 */
  onApplyContent?: (content: string, stepId: string) => void;
  /** 初始上下文 */
  initialContext?: {
    title?: string;
    description?: string;
    theme?: string;
  };
}

// ============================================
// 图标组件
// ============================================

const SparkleIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// ============================================
// 主组件
// ============================================

export default function AITimelineAssistant({
  isOpen,
  onClose,
  onApplyContent,
  initialContext,
}: AITimelineAssistantProps) {
  const [steps, setSteps] = useState<AIStep[]>([
    { id: "brainstorm", label: "创意生成", status: "pending", icon: "💡" },
    { id: "polish", label: "描述润色", status: "pending", icon: "✨" },
    { id: "recruit", label: "招募文案", status: "pending", icon: "📢" },
  ]);

  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps, activeStep]);

  // 获取当前激活的步骤
  const getCurrentStepIndex = () => steps.findIndex((s) => s.id === activeStep);

  // 处理步骤点击
  const handleStepClick = (stepId: string) => {
    if (loading) return;
    setActiveStep(stepId);
    setInput("");
    setError("");
  };

  // 生成内容
  const handleGenerate = async () => {
    if (!input.trim() || !activeStep) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      let response;
      let content = "";

      switch (activeStep) {
        case "brainstorm":
          response = await axios.post(
            "/api/v1/ai/brainstorm-ideas",
            {
              theme: input,
              skills: initialContext?.title || "",
              interests: "",
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );

          // 格式化创意结果
          if (response.data.ideas) {
            content = response.data.ideas
              .map(
                (idea: any, idx: number) =>
                  `${idx + 1}. ${idea.title}\n   ${idea.description}\n   技术栈: ${idea.tech_stack}\n`,
              )
              .join("\n");
          }
          break;

        case "polish":
          response = await axios.post(
            "/api/v1/ai/generate",
            {
              prompt: `润色以下项目描述，使其更专业、更有吸引力：\n\n${input}`,
              type: "polish",
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          content = response.data.content || response.data.result;
          break;

        case "recruit":
          response = await axios.post(
            "/api/v1/ai/recruitment-copy",
            {
              role: input,
              project_name: initialContext?.title || "我们的项目",
              skills_needed: input,
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          content = response.data.content || response.data.result;
          break;
      }

      // 更新步骤状态
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === activeStep) {
            return {
              ...step,
              status: "completed",
              content,
              date: new Date().toLocaleDateString("zh-CN"),
            };
          }
          return step;
        }),
      );

      // 自动进入下一步
      const currentIndex = getCurrentStepIndex();
      if (currentIndex < steps.length - 1) {
        setTimeout(() => {
          setActiveStep(steps[currentIndex + 1].id);
          setInput("");
        }, 500);
      } else {
        setActiveStep(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "生成失败，请稍后重试");
      setSteps((prev) =>
        prev.map((step) =>
          step.id === activeStep ? { ...step, status: "error" } : step,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // 应用内容
  const handleApply = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (step?.content && onApplyContent) {
      onApplyContent(step.content, stepId);
    }
  };

  // 重新开始
  const handleRestart = () => {
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        status: "pending",
        content: undefined,
        date: undefined,
      })),
    );
    setActiveStep("brainstorm");
    setInput("");
    setError("");
  };

  if (!isOpen) return null;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* 主面板 */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-0 top-0 bottom-0 w-[480px] bg-[#0A0A0A] border-l border-white/[0.08] z-50 flex flex-col"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FBBF24]/20 to-[#FBBF24]/5 border border-[#FBBF24]/30 flex items-center justify-center">
                  <SparkleIcon />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI 助手</h3>
                  <p className="text-[11px] text-gray-500">三步完成项目创建</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {completedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleRestart}
                    className="h-7 px-3 text-[11px] text-gray-500 hover:text-white transition-colors"
                  >
                    重新开始
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <CloseIcon />
                </Button>
              </div>
            </div>

            {/* 进度条 */}
            <div className="px-6 py-3 border-b border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-500">完成进度</span>
                <span className="text-[11px] text-[#FBBF24]">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* 时间轴内容区 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
              <div className="relative">
                {/* 时间轴线 */}
                <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-white/5" />

                {/* 步骤列表 */}
                <div className="space-y-6">
                  {steps.map((step, index) => {
                    const isActive = activeStep === step.id;
                    const isCompleted = step.status === "completed";
                    const isError = step.status === "error";

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex gap-4"
                      >
                        {/* 节点 */}
                        <div className="relative z-10 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStepClick(step.id)}
                            disabled={loading && !isActive}
                            className={`
                              w-10 h-10 rounded-xl flex items-center justify-center text-lg
                              transition-all duration-300
                              ${
                                isCompleted
                                  ? "bg-[#FBBF24] text-black"
                                  : isActive
                                    ? "bg-[#FBBF24]/20 border-2 border-[#FBBF24] text-[#FBBF24]"
                                    : isError
                                      ? "bg-red-500/20 border-2 border-red-500 text-red-400"
                                      : "bg-white/5 border border-white/10 text-gray-500 hover:border-white/20"
                              }
                            `}
                          >
                            {isCompleted ? <CheckIcon /> : step.icon}
                          </Button>
                        </div>

                        {/* 内容卡片 */}
                        <div className="flex-1 min-w-0">
                          <div
                            onClick={() => handleStepClick(step.id)}
                            className={`
                              p-4 rounded-xl cursor-pointer transition-all duration-300
                              ${
                                isActive
                                  ? "bg-white/[0.05] border border-[#FBBF24]/30"
                                  : isCompleted
                                    ? "bg-white/[0.02] border border-white/[0.05]"
                                    : "bg-transparent border border-transparent hover:bg-white/[0.02]"
                              }
                            `}
                          >
                            {/* 标题行 */}
                            <div className="flex items-center justify-between mb-1">
                              <h4
                                className={`
                                font-medium transition-colors
                                ${isActive || isCompleted ? "text-white" : "text-gray-400"}
                              `}
                              >
                                {step.label}
                              </h4>
                              {step.date && (
                                <span className="text-[10px] text-gray-500">
                                  {step.date}
                                </span>
                              )}
                            </div>

                            {/* 输入区（激活状态） */}
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-3 space-y-3"
                              >
                                <textarea
                                  value={input}
                                  onChange={(e) => setInput(e.target.value)}
                                  placeholder={
                                    step.id === "brainstorm"
                                      ? "输入主题，例如：AI 教育应用"
                                      : step.id === "polish"
                                        ? "粘贴需要润色的内容..."
                                        : "描述招募需求，例如：寻找前端开发"
                                  }
                                  className="w-full h-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:border-[#FBBF24]/50 focus:outline-none resize-none"
                                />

                                {error && (
                                  <p className="text-[11px] text-red-400">
                                    {error}
                                  </p>
                                )}

                                <Button
                                  onClick={handleGenerate}
                                  disabled={loading || !input.trim()}
                                  className="w-full py-2.5 bg-[#FBBF24] text-black text-[12px] font-medium rounded-lg hover:bg-[#F59E0B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  {loading ? (
                                    <>
                                      <svg
                                        className="w-4 h-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
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
                                      </svg>
                                      生成中...
                                    </>
                                  ) : (
                                    <>
                                      <SparkleIcon />
                                      生成内容
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                            )}

                            {/* 完成内容展示 */}
                            {isCompleted && step.content && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3"
                              >
                                <div className="bg-black/40 rounded-lg p-3 max-h-32 overflow-y-auto">
                                  <p className="text-[11px] text-gray-400 whitespace-pre-wrap line-clamp-4">
                                    {step.content}
                                  </p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApply(step.id);
                                    }}
                                    className="flex-1 py-1.5 bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24] text-[11px] rounded hover:bg-[#FBBF24]/20 transition-colors"
                                  >
                                    应用内容
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStepClick(step.id);
                                    }}
                                    className="px-3 py-1.5 text-gray-500 text-[11px] hover:text-white transition-colors"
                                  >
                                    重新生成
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 底部提示 */}
            <div className="px-6 py-4 border-t border-white/[0.08]">
              <p className="text-[11px] text-gray-500 text-center">
                {completedCount === steps.length
                  ? "✨ 所有步骤已完成！可以关闭助手继续编辑项目"
                  : "点击步骤节点开始生成内容"}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// 使用示例
// ============================================

export function AITimelineAssistantDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [appliedContent, setAppliedContent] = useState<Record<string, string>>(
    {},
  );

  return (
    <div className="p-8 bg-[#0A0A0A] min-h-screen">
      <Button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-[#FBBF24] text-black font-medium rounded-lg hover:bg-[#F59E0B] transition-colors"
      >
        打开 AI 助手
      </Button>

      <div className="mt-8 space-y-4">
        <h3 className="text-white font-medium">已应用的内容：</h3>
        {Object.entries(appliedContent).map(([key, value]) => (
          <div key={key} className="p-4 bg-white/5 rounded-lg">
            <p className="text-[11px] text-gray-500 mb-2">{key}</p>
            <p className="text-[12px] text-gray-300 whitespace-pre-wrap">
              {value}
            </p>
          </div>
        ))}
      </div>

      <AITimelineAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onApplyContent={(content, stepId) => {
          setAppliedContent((prev) => ({ ...prev, [stepId]: content }));
        }}
        initialContext={{ title: "AI 创新项目" }}
      />
    </div>
  );
}
