import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  MessageSquare,
  Zap,
  UserPlus,
  X,
  Send,
  Edit3,
  Github,
  Globe,
  Award,
  Code2,
  Palette,
  Boxes,
  Lightbulb,
  Briefcase,
  MapPin,
  Calendar,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react'
import AIMatchModal from '../components/AIMatchModal'

// 扩展的成员数据接口
interface MemberDetail {
  id: number
  full_name: string
  nickname: string
  avatar: string
  skills: string
  bio: string
  personality: string
  interests: string
  is_virtual: boolean
  community_title?: string
  community_bio?: string
  community_skills?: string
  status: 'open' | 'busy' | 'hacking' | 'reviewing'
  github?: string
  portfolio?: string
  extendedBio: string
  location?: string
  pastProjects: {
    name: string
    tech: string[]
    award?: string
    year: string
  }[]
  radar: {
    frontend: number
    backend: number
    product: number
    design: number
    ai: number
    devops: number
  }
}

// interface VirtualUser {
//   id: number
//   full_name: string
//   nickname: string
//   avatar: string
//   skills: string
//   bio: string
//   personality: string
//   interests: string
//   is_virtual: boolean
//   community_title?: string
//   community_bio?: string
//   community_skills?: string
}

interface Discussion {
  id: number
  title: string
  content: string
  author: string
  avatar: string
  replies: number
  views: number
  tags: string[]
  isVirtual: boolean
  time: string
  author_id?: number
}

interface CommunityProfile {
  show_in_community: boolean
  community_bio: string
  community_skills: string
  community_title: string
  status: 'open' | 'busy' | 'hacking' | 'reviewing'
  github: string
  portfolio: string
  extendedBio: string
  location: string
  pastProjects: {
    name: string
    tech: string[]
    award?: string
    year: string
  }[]
  radar: {
    frontend: number
    backend: number
    product: number
    design: number
    ai: number
    devops: number
  }
}

// 状态映射
const STATUS_MAP = {
  open: { label: 'Open to team', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: UserPlus },
  busy: { label: 'Busy', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Briefcase },
  hacking: { label: 'In a hackathon', color: 'bg-brand/20 text-brand border-brand/30', icon: Zap },
  reviewing: { label: 'Reviewing offers', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Eye }
}

// 雷达图组件
function RadarChart({ data, size = 120 }: { data: MemberDetail['radar']; size?: number }) {
  const center = size / 2
  const radius = size * 0.35
  const angles = [0, 60, 120, 180, 240, 300].map(a => (a - 90) * Math.PI / 180)
  const labels = ['前端', '后端', '产品', '设计', 'AI', 'DevOps']
  const values = [data.frontend, data.backend, data.product, data.design, data.ai, data.devops]
  
  const points = angles.map((angle, i) => ({
    x: center + radius * (values[i] / 100) * Math.cos(angle),
    y: center + radius * (values[i] / 100) * Math.sin(angle)
  }))
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  
  return (
    <svg width={size} height={size} className="overflow-visible">
      {[20, 40, 60, 80, 100].map(level => (
        <polygon
          key={level}
          points={angles.map(a => `${center + radius * (level/100) * Math.cos(a)},${center + radius * (level/100) * Math.sin(a)}`).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      {angles.map((angle, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={center + radius * Math.cos(angle)}
          y2={center + radius * Math.sin(angle)}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      <path
        d={pathD}
        fill="rgba(234, 255, 0, 0.3)"
        stroke="#EAFF00"
        strokeWidth="2"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#EAFF00" />
      ))}
      {angles.map((angle, i) => (
        <text
          key={i}
          x={center + (radius + 15) * Math.cos(angle)}
          y={center + (radius + 15) * Math.sin(angle)}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-zinc-400 text-[8px]"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  )
}

// Mock discussions data
const MOCK_DISCUSSIONS: Discussion[] = [
  {
    id: 1,
    title: '【经验分享】第一次参加黑客松，我是如何拿到冠军的？',
    content: '分享我的第一次黑客松经历...',
    author: '全栈小王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu&backgroundColor=c0aede',
    replies: 45,
    views: 1203,
    tags: ['经验分享', '新手入门'],
    isVirtual: true,
    time: '2小时前'
  },
  {
    id: 2,
    title: '寻找队友：AI + 医疗方向，缺前端和设计',
    content: '我们团队有后端和算法，寻找前端和设计小伙伴...',
    author: 'AI探索者_李明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liming&backgroundColor=b6e3f4',
    replies: 12,
    views: 356,
    tags: ['组队', 'AI', '医疗'],
    isVirtual: true,
    time: '4小时前'
  },
  {
    id: 3,
    title: '【技术讨论】LLM在黑客松项目中的最佳实践',
    content: '总结了一些使用LLM的经验...',
    author: 'CTO老马',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=machao&backgroundColor=d1d4f9',
    replies: 28,
    views: 892,
    tags: ['技术讨论', 'LLM'],
    isVirtual: true,
    time: '6小时前'
  },
  {
    id: 4,
    title: 'Web3黑客松常见陷阱和避坑指南',
    content: '整理了一些Web3开发的常见问题...',
    author: '链上陈',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=haoran&backgroundColor=d1d4f9',
    replies: 33,
    views: 1024,
    tags: ['Web3', '经验分享'],
    isVirtual: true,
    time: '8小时前'
  },
  {
    id: 5,
    title: '设计师在黑客松中的价值 - 不只是画UI',
    content: '设计师在团队中扮演的重要角色...',
    author: '设计琪',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=siqi&backgroundColor=ffdfbf',
    replies: 19,
    views: 567,
    tags: ['设计', '团队协作'],
    isVirtual: true,
    time: '12小时前'
  },
  {
    id: 6,
    title: '【招募】下周六线下黑客松，坐标上海',
    content: '上海线下黑客松活动招募中...',
    author: '创新少女',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoxiao&backgroundColor=ffd5dc',
    replies: 56,
    views: 1589,
    tags: ['线下活动', '上海', '组队'],
    isVirtual: true,
    time: '1天前'
  }
]

// 扩充的 Mock 成员数据
const MOCK_MEMBERS: MemberDetail[] = [
  {
    id: 1,
    full_name: '李明远',
    nickname: 'AI探索者_李明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liming&backgroundColor=b6e3f4',
    skills: 'Python, PyTorch, TensorFlow, LLM, Computer Vision',
    bio: '清华AI博士，专注大模型研究。相信AI能改变世界，在黑客松中寻找志同道合的伙伴。【虚拟人物】',
    personality: 'INTP',
    interests: 'AGI, 多模态学习, AI安全',
    is_virtual: true,
    community_title: 'AI研究员',
    status: 'open',
    github: 'https://github.com/ai-explorer-li',
    portfolio: 'https://liming-ai.dev',
    extendedBio: '清华大学人工智能博士，曾在Google DeepMind实习。专注于大语言模型和计算机视觉的交叉研究。发表过5篇顶会论文，开源项目获得3k+ stars。热爱黑客松文化，享受在48小时内将想法变为现实的快感。',
    location: '北京',
    pastProjects: [
      { name: 'SmartDiagnosis', tech: ['Python', 'PyTorch', 'React'], award: '🥇 冠军', year: '2024' },
      { name: 'VisionTranslate', tech: ['OpenCV', 'Transformers', 'FastAPI'], award: '🥈 亚军', year: '2023' }
    ],
    radar: { frontend: 40, backend: 85, product: 60, design: 30, ai: 95, devops: 50 }
  },
  {
    id: 2,
    full_name: '王小雨',
    nickname: '全栈小王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu&backgroundColor=c0aede',
    skills: 'React, Node.js, TypeScript, PostgreSQL, AWS',
    bio: '5年全栈经验，从0到1构建过3个产品。寻找设计搭档一起搞事情！【虚拟人物】',
    personality: 'ENTJ',
    interests: 'SaaS, 开发者工具, 开源',
    is_virtual: true,
    community_title: '全栈工程师',
    status: 'hacking',
    github: 'https://github.com/fullstack-wang',
    portfolio: 'https://wangyu.dev',
    extendedBio: '前字节跳动高级工程师，参与过飞书早期开发。全栈技术栈，擅长快速原型开发。独立开发过3个SaaS产品，累计服务10万+用户。相信好的产品是技术和设计的完美结合。',
    location: '上海',
    pastProjects: [
      { name: 'DevFlow', tech: ['Next.js', 'Prisma', 'Tailwind'], award: '🥇 冠军', year: '2024' },
      { name: 'CodeBuddy', tech: ['React', 'Node.js', 'MongoDB'], award: '最佳技术奖', year: '2023' },
      { name: 'APIHub', tech: ['Express', 'Redis', 'Docker'], award: '🥉 季军', year: '2023' }
    ],
    radar: { frontend: 90, backend: 85, product: 75, design: 50, ai: 40, devops: 80 }
  },
  {
    id: 3,
    full_name: '张思琪',
    nickname: '设计琪',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=siqi&backgroundColor=ffdfbf',
    skills: 'Figma, UI/UX, Motion Design, Blender, Three.js',
    bio: '前阿里高级设计师，热爱创造有温度的产品体验。寻找技术合伙人！【虚拟人物】',
    personality: 'ENFP',
    interests: '设计系统, 3D设计, 创意编程',
    is_virtual: true,
    community_title: '产品设计师',
    status: 'open',
    github: 'https://github.com/design-qi',
    portfolio: 'https://siqi.design',
    extendedBio: '阿里巴巴前高级体验设计师，5年互联网产品设计经验。擅长设计系统构建和交互动效设计。对创意编程和生成式设计有浓厚兴趣，正在学习Three.js和WebGL。相信好的设计能让复杂的技术变得平易近人。',
    location: '杭州',
    pastProjects: [
      { name: 'EcoVisual', tech: ['Figma', 'After Effects', 'Lottie'], award: '🥇 冠军', year: '2024' },
      { name: 'MotionUI', tech: ['Framer', 'React', 'GSAP'], award: '最佳设计奖', year: '2023' }
    ],
    radar: { frontend: 60, backend: 20, product: 85, design: 95, ai: 30, devops: 15 }
  },
  {
    id: 4,
    full_name: '陈浩然',
    nickname: '链上陈',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=haoran&backgroundColor=d1d4f9',
    skills: 'Solidity, Rust, DeFi, Smart Contract, Web3.js',
    bio: 'Web3开发者，参与过3个知名DeFi项目。相信去中心化的未来。【虚拟人物】',
    personality: 'INTJ',
    interests: 'DeFi, DAO, 零知识证明',
    is_virtual: true,
    community_title: 'Web3开发者',
    status: 'busy',
    github: 'https://github.com/chain-chen',
    portfolio: 'https://haoran.web3',
    extendedBio: '区块链开发者，3年Web3开发经验。曾参与知名DeFi协议的核心开发，合约审计经验丰富。对零知识证明和Layer2扩容方案有深入研究。相信区块链技术将重塑金融和协作方式。',
    location: '新加坡',
    pastProjects: [
      { name: 'DeFiDashboard', tech: ['Solidity', 'React', 'TheGraph'], award: '🥇 冠军', year: '2024' },
      { name: 'DAOTools', tech: ['Rust', 'Anchor', 'Next.js'], award: '最佳创新奖', year: '2023' }
    ],
    radar: { frontend: 70, backend: 90, product: 60, design: 40, ai: 30, devops: 75 }
  },
  {
    id: 5,
    full_name: '刘芳',
    nickname: '数据女王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufang&backgroundColor=c0aede',
    skills: 'Python, SQL, Tableau, Spark, Machine Learning',
    bio: '数据科学家，擅长从数据中发现洞察。让数据讲故事。【虚拟人物】',
    personality: 'ISTJ',
    interests: '数据可视化, 商业智能, 预测分析',
    is_virtual: true,
    community_title: '数据科学家',
    status: 'open',
    github: 'https://github.com/data-queen',
    portfolio: 'https://liufang.data',
    extendedBio: '前腾讯数据科学家，5年数据分析经验。擅长构建端到端的数据 pipeline，从数据采集到可视化展示。热爱数据可视化，相信好的可视化能让复杂数据一目了然。',
    location: '深圳',
    pastProjects: [
      { name: 'InsightFlow', tech: ['Python', 'D3.js', 'FastAPI'], award: '🥈 亚军', year: '2024' },
      { name: 'PredictX', tech: ['TensorFlow', 'Pandas', 'Streamlit'], award: '最佳数据奖', year: '2023' }
    ],
    radar: { frontend: 50, backend: 75, product: 70, design: 60, ai: 85, devops: 40 }
  },
  {
    id: 6,
    full_name: '赵阳',
    nickname: '移动开发赵',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoyang&backgroundColor=b6e3f4',
    skills: 'Flutter, Swift, Kotlin, Firebase, Mobile UI',
    bio: '移动端专家，iOS和Android双栈。追求极致的用户体验。【虚拟人物】',
    personality: 'ESTP',
    interests: '跨平台开发, 性能优化, AR应用',
    is_virtual: true,
    community_title: '移动端工程师',
    status: 'reviewing',
    github: 'https://github.com/mobile-zhao',
    portfolio: 'https://zhaoyang.app',
    extendedBio: '8年移动开发经验，前美团高级移动端工程师。精通iOS和Android原生开发，也擅长Flutter跨平台开发。对移动端性能优化和动画效果有深入研究。',
    location: '北京',
    pastProjects: [
      { name: 'ARShop', tech: ['Swift', 'ARKit', 'CoreML'], award: '🥇 冠军', year: '2024' },
      { name: 'FitTrack', tech: ['Flutter', 'Firebase', 'Bluetooth'], award: '最佳应用奖', year: '2023' }
    ],
    radar: { frontend: 85, backend: 60, product: 65, design: 70, ai: 40, devops: 35 }
  },
  {
    id: 7,
    full_name: '周游戏',
    nickname: '游戏创客',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhougame&backgroundColor=ffdfbf',
    skills: 'Unity, Unreal, C#, Shader, Game Design',
    bio: '独立游戏开发者，Steam上架过2款游戏。用游戏改变世界。【虚拟人物】',
    personality: 'INFP',
    interests: '独立游戏, 游戏叙事, 程序化生成',
    is_virtual: true,
    community_title: '游戏开发者',
    status: 'hacking',
    github: 'https://github.com/game-zhou',
    portfolio: 'https://zhougame.itch.io',
    extendedBio: '独立游戏开发者，Unity和Unreal双引擎开发者。在Steam上架过2款独立游戏，累计销量5万份。热爱游戏叙事和程序化生成技术，相信游戏是最有力的表达方式。',
    location: '成都',
    pastProjects: [
      { name: 'CyberQuest', tech: ['Unity', 'C#', 'Shader Graph'], award: '🥇 冠军', year: '2024' },
      { name: 'DreamScape', tech: ['Unreal', 'Blueprints', 'Niagara'], award: '最佳创意奖', year: '2023' }
    ],
    radar: { frontend: 70, backend: 65, product: 75, design: 85, ai: 30, devops: 25 }
  },
  {
    id: 8,
    full_name: '吴安全',
    nickname: '安全卫士',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wusecurity&backgroundColor=d1d4f9',
    skills: 'Penetration Testing, Rust, Blockchain Security, Smart Contract Audit',
    bio: '白帽黑客，Web3安全研究员。守护代码的安全底线。【虚拟人物】',
    personality: 'ISTP',
    interests: '区块链安全, 密码学, CTF',
    is_virtual: true,
    community_title: '安全工程师',
    status: 'open',
    github: 'https://github.com/security-wu',
    portfolio: 'https://wusec.io',
    extendedBio: '网络安全专家，白帽黑客，Web3安全研究员。曾发现多个知名DeFi协议的漏洞，获得百万美元漏洞赏金。热爱CTF比赛，多次获得国际赛事奖项。',
    location: '上海',
    pastProjects: [
      { name: 'SecureDAO', tech: ['Rust', 'Move', 'Foundry'], award: '最佳安全奖', year: '2024' },
      { name: 'AuditBot', tech: ['Python', 'Slither', 'ML'], award: '🥈 亚军', year: '2023' }
    ],
    radar: { frontend: 45, backend: 90, product: 40, design: 20, ai: 60, devops: 85 }
  },
  {
    id: 9,
    full_name: '孙晓晓',
    nickname: '创新少女',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoxiao&backgroundColor=ffd5dc',
    skills: 'Python, Arduino, IoT, Product Design, Pitching',
    bio: 'CS大二学生，充满创意和热情。寻找导师和队友一起成长！【虚拟人物】',
    personality: 'ENFP',
    interests: '教育科技, 可持续创新, 社会企业',
    is_virtual: true,
    community_title: '学生创新者',
    status: 'open',
    github: 'https://github.com/innovator-sun',
    portfolio: 'https://xiaoxiao.innovation',
    extendedBio: '计算机科学专业大二学生，虽然技术还在学习中，但充满创意和执行力。擅长产品构思和演讲展示。参加过5次黑客松，获得2次奖项。相信年轻人的创造力能改变世界。',
    location: '杭州',
    pastProjects: [
      { name: 'EcoTrack', tech: ['Arduino', 'Python', 'Flask'], award: '🥉 季军', year: '2024' },
      { name: 'StudyBuddy', tech: ['React Native', 'Firebase'], award: '最佳学生奖', year: '2023' }
    ],
    radar: { frontend: 55, backend: 40, product: 80, design: 70, ai: 35, devops: 20 }
  },
  {
    id: 10,
    full_name: '马超',
    nickname: 'CTO老马',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=machao&backgroundColor=d1d4f9',
    skills: 'System Design, Go, Kubernetes, Microservices, Leadership',
    bio: '连续创业者，前大厂技术总监。寻找靠谱合伙人一起搞大事！【虚拟人物】',
    personality: 'ENTJ',
    interests: '创业, 技术管理, 系统架构',
    is_virtual: true,
    community_title: '技术总监',
    status: 'busy',
    github: 'https://github.com/cto-ma',
    portfolio: 'https://machao.tech',
    extendedBio: '15年技术管理经验，前阿里巴巴技术总监，连续创业者。主导过日活千万级产品的技术架构。擅长团队建设和技术战略规划。正在寻找下一个创业机会。',
    location: '北京',
    pastProjects: [
      { name: 'CloudNative', tech: ['Go', 'K8s', 'Istio'], award: '🥇 冠军', year: '2024' },
      { name: 'ScaleUp', tech: ['Microservices', 'Kafka', 'Redis'], award: '最佳架构奖', year: '2023' }
    ],
    radar: { frontend: 50, backend: 95, product: 85, design: 30, ai: 60, devops: 95 }
  },
  {
    id: 11,
    full_name: '林文案',
    nickname: 'UX写手',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linwriter&backgroundColor=ffdfbf',
    skills: 'UX Writing, Content Strategy, User Research, Copywriting',
    bio: 'UX写作者，相信文字的力量。让产品会说话。【虚拟人物】',
    personality: 'INFJ',
    interests: '内容策略, 用户体验, 品牌叙事',
    is_virtual: true,
    community_title: 'UX写作者',
    status: 'open',
    github: 'https://github.com/ux-lin',
    portfolio: 'https://linwriting.ux',
    extendedBio: 'UX写作者和内容策略师，5年互联网产品文案经验。擅长将复杂的技术概念转化为用户友好的语言。相信好的文案是用户体验的重要组成部分。',
    location: '上海',
    pastProjects: [
      { name: 'VoiceFirst', tech: ['NLP', 'Voice UI', 'Content Design'], award: '最佳文案奖', year: '2024' },
      { name: 'ClearChat', tech: ['Conversational UI', 'UX Writing'], award: '🥉 季军', year: '2023' }
    ],
    radar: { frontend: 40, backend: 20, product: 90, design: 75, ai: 50, devops: 10 }
  },
  {
    id: 12,
    full_name: '黄运维',
    nickname: 'MLOps黄',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huangops&backgroundColor=c0aede',
    skills: 'MLOps, Kubernetes, Terraform, CI/CD, Monitoring',
    bio: 'MLOps工程师，让AI模型从实验室走向生产。寻找AI团队合作。【虚拟人物】',
    personality: 'ISTJ',
    interests: 'AI工程化, 自动化, 可观测性',
    is_virtual: true,
    community_title: 'MLOps工程师',
    status: 'open',
    github: 'https://github.com/mlops-huang',
    portfolio: 'https://huangmlops.dev',
    extendedBio: 'MLOps工程师，专注于机器学习模型的工程化和部署。精通Kubernetes和云原生技术栈。帮助多个AI团队将模型从实验室部署到生产环境，服务千万级用户。',
    location: '深圳',
    pastProjects: [
      { name: 'AIOps', tech: ['Kubeflow', 'MLflow', 'Prometheus'], award: '🥈 亚军', year: '2024' },
      { name: 'ModelMesh', tech: ['KServe', 'Istio', 'GPU'], award: '最佳工程奖', year: '2023' }
    ],
    radar: { frontend: 30, backend: 85, product: 50, design: 20, ai: 75, devops: 95 }
  },
  {
    id: 13,
    full_name: '徐基因',
    nickname: '生物信息徐博士',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bioinfo&backgroundColor=ffdfbf',
    skills: 'Python, R, Bioinformatics, Genomics, Deep Learning',
    bio: '中科院生物信息学博士，用AI加速科学发现。寻找生物与技术的碰撞点。【虚拟人物】',
    personality: 'INTJ',
    interests: 'AI for Science, 精准医疗, 药物发现',
    is_virtual: true,
    community_title: '生物信息学家',
    status: 'open',
    github: 'https://github.com/bio-xu',
    portfolio: 'https://xugene.bio',
    extendedBio: '中科院生物信息学博士，专注于用AI加速科学发现。曾参与人类基因组计划后续项目，发表多篇Nature子刊论文。相信交叉学科的力量，正在探索AI在生物医药领域的应用。',
    location: '北京',
    pastProjects: [
      { name: 'GeneAI', tech: ['PyTorch', 'AlphaFold', 'BioPython'], award: '🥇 冠军', year: '2024' },
      { name: 'DrugDiscovery', tech: ['RDKit', 'GNN', 'AWS'], award: '最佳科学奖', year: '2023' }
    ],
    radar: { frontend: 35, backend: 80, product: 55, design: 30, ai: 90, devops: 45 }
  },
  {
    id: 14,
    full_name: '钱金融',
    nickname: '量化小钱',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fintech&backgroundColor=d1d4f9',
    skills: 'Python, Quant Trading, Risk Management, Financial Modeling',
    bio: '前高盛量化分析师，现Web3创业者。在黑客松中寻找改变金融行业的创新想法。【虚拟人物】',
    personality: 'ENTJ',
    interests: 'DeFi, 算法交易, 金融AI',
    is_virtual: true,
    community_title: '量化分析师',
    status: 'hacking',
    github: 'https://github.com/quant-qian',
    portfolio: 'https://qianfintech.io',
    extendedBio: '前高盛量化分析师，现Web3创业者。精通传统金融和区块链技术，对金融科技充满热情。相信技术能让金融服务更普惠、更高效。',
    location: '香港',
    pastProjects: [
      { name: 'QuantDeFi', tech: ['Solidity', 'Python', 'Pandas'], award: '🥇 冠军', year: '2024' },
      { name: 'RiskGuard', tech: ['TensorFlow', 'Risk Models', 'React'], award: '最佳金融奖', year: '2023' }
    ],
    radar: { frontend: 55, backend: 85, product: 75, design: 40, ai: 80, devops: 50 }
  },
  {
    id: 15,
    full_name: '罗机器人',
    nickname: '机器人罗工',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robotics&backgroundColor=b6e3f4',
    skills: 'ROS, C++, Computer Vision, SLAM, Embedded Systems',
    bio: '机器人工程师，让机器理解世界。寻找AI和硬件小伙伴。【虚拟人物】',
    personality: 'ISTP',
    interests: '自主导航, 机械臂, 人机交互',
    is_virtual: true,
    community_title: '机器人工程师',
    status: 'open',
    github: 'https://github.com/robotics-luo',
    portfolio: 'https://luorobot.tech',
    extendedBio: '机器人工程师，5年ROS开发经验。参与过多个服务机器人和工业机器人项目。精通计算机视觉和SLAM算法，对具身智能有浓厚兴趣。',
    location: '深圳',
    pastProjects: [
      { name: 'AutoNav', tech: ['ROS2', 'SLAM', 'Depth Camera'], award: '🥈 亚军', year: '2024' },
      { name: 'RoboArm', tech: ['MoveIt', 'C++', 'CAD'], award: '最佳硬件奖', year: '2023' }
    ],
    radar: { frontend: 30, backend: 75, product: 50, design: 40, ai: 70, devops: 35 }
  },
  {
    id: 16,
    full_name: '绿环保',
    nickname: '气候科技绿',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=climate&backgroundColor=c0aede',
    skills: 'IoT, Data Analytics, Sustainability, Climate Modeling',
    bio: '气候科技创业者，用技术对抗气候变化。寻找志同道合的伙伴。【虚拟人物】',
    personality: 'ENFJ',
    interests: '清洁能源, 碳中和, 可持续农业',
    is_virtual: true,
    community_title: '气候科技创业者',
    status: 'open',
    github: 'https://github.com/climate-lv',
    portfolio: 'https://lvclimate.green',
    extendedBio: '气候科技创业者，环境科学背景。致力于用技术解决气候变化问题，开发过多个碳足迹追踪和能源管理项目。相信科技能让地球更可持续。',
    location: '上海',
    pastProjects: [
      { name: 'CarbonTrack', tech: ['IoT', 'Blockchain', 'React'], award: '🥇 冠军', year: '2024' },
      { name: 'EcoSmart', tech: ['Python', 'ML', 'Sensor Networks'], award: '最佳环保奖', year: '2023' }
    ],
    radar: { frontend: 50, backend: 70, product: 80, design: 60, ai: 65, devops: 45 }
  },
  {
    id: 17,
    full_name: '教未来',
    nickname: '教育科技教老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=edtech&backgroundColor=ffdfbf',
    skills: 'EdTech, Gamification, Adaptive Learning, Content Creation',
    bio: '前新东方名师，现教育科技创业者。用AI让教育更个性化。【虚拟人物】',
    personality: 'ENFJ',
    interests: '个性化学习, 教育公平, 知识图谱',
    is_virtual: true,
    community_title: '教育科技创业者',
    status: 'busy',
    github: 'https://github.com/edtech-jiao',
    portfolio: 'https://jiaofuture.edu',
    extendedBio: '前新东方名师，10年教育行业经验，现教育科技创业者。专注于AI赋能教育，开发自适应学习系统。相信技术能让优质教育触手可及。',
    location: '北京',
    pastProjects: [
      { name: 'AI Tutor', tech: ['NLP', 'Python', 'React'], award: '🥇 冠军', year: '2024' },
      { name: 'LearnPath', tech: ['Knowledge Graph', 'Vue.js', 'Django'], award: '最佳教育奖', year: '2023' }
    ],
    radar: { frontend: 60, backend: 65, product: 90, design: 70, ai: 75, devops: 30 }
  },
  {
    id: 18,
    full_name: '医健康',
    nickname: '数字医疗医博士',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=healthcare&backgroundColor=d1d4f9',
    skills: 'Medical AI, Clinical Data, Healthcare IT, Regulatory',
    bio: '医学博士转行，数字医疗产品经理。懂医学也懂技术。【虚拟人物】',
    personality: 'INTJ',
    interests: '数字疗法, 远程医疗, 医疗AI',
    is_virtual: true,
    community_title: '数字医疗产品经理',
    status: 'open',
    github: 'https://github.com/health-yi',
    portfolio: 'https://yihealth.digital',
    extendedBio: '医学博士，3年临床经验转行科技。现数字医疗产品经理，既懂医学也懂技术。致力于用技术改善医疗服务，让患者获得更好的诊疗体验。',
    location: '上海',
    pastProjects: [
      { name: 'MediAI', tech: ['Computer Vision', 'PyTorch', 'React'], award: '🥈 亚军', year: '2024' },
      { name: 'TeleCare', tech: ['WebRTC', 'Node.js', 'MongoDB'], award: '最佳医疗奖', year: '2023' }
    ],
    radar: { frontend: 55, backend: 60, product: 85, design: 50, ai: 80, devops: 35 }
  },
  {
    id: 19,
    full_name: '艺代码',
    nickname: '创意编程艺艺术家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creative&backgroundColor=ffd5dc',
    skills: 'Generative Art, p5.js, TouchDesigner, Processing, WebGL',
    bio: '新媒体艺术家，用代码创作艺术。技术和美学的融合者。【虚拟人物】',
    personality: 'INFP',
    interests: '生成艺术, 互动装置, 视听表演',
    is_virtual: true,
    community_title: '新媒体艺术家',
    status: 'hacking',
    github: 'https://github.com/art-yi',
    portfolio: 'https://yicode.art',
    extendedBio: '新媒体艺术家，创意编程教育者。作品在国际数字艺术节展出。相信代码是一种创作媒介，技术和美学的融合能创造独特的体验。',
    location: '杭州',
    pastProjects: [
      { name: 'Generative Dreams', tech: ['p5.js', 'WebGL', 'MIDI'], award: '🥇 冠军', year: '2024' },
      { name: 'Interactive Flow', tech: ['TouchDesigner', 'Python', 'Sensors'], award: '最佳艺术奖', year: '2023' }
    ],
    radar: { frontend: 85, backend: 40, product: 60, design: 95, ai: 50, devops: 20 }
  },
  {
    id: 20,
    full_name: '社企业',
    nickname: '社会创新社',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=social&backgroundColor=c0aede',
    skills: 'Social Innovation, Impact Measurement, Community Building',
    bio: '社会企业家，用商业手段解决社会问题。寻找技术合伙人。【虚拟人物】',
    personality: 'ENFJ',
    interests: '社会企业, 影响力投资, 社区营造',
    is_virtual: true,
    community_title: '社会企业家',
    status: 'open',
    github: 'https://github.com/social-she',
    portfolio: 'https://sheenterprise.org',
    extendedBio: '社会企业家，用商业手段解决社会问题。关注教育公平、环境保护和社区发展。相信技术应该服务于社会福祉，而不仅仅是商业利益。',
    location: '成都',
    pastProjects: [
      { name: 'ImpactMap', tech: ['React', 'GIS', 'Data Viz'], award: '🥉 季军', year: '2024' },
      { name: 'CommunityLink', tech: ['Flutter', 'Firebase', 'Maps'], award: '最佳社会奖', year: '2023' }
    ],
    radar: { frontend: 55, backend: 45, product: 90, design: 65, ai: 35, devops: 25 }
  },
  {
    id: 21,
    full_name: '虚现实',
    nickname: 'XR开发者虚',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xrdev&backgroundColor=b6e3f4',
    skills: 'Vision Pro, Unity, ARKit, Spatial Computing, 3D Design',
    bio: 'Vision Pro开发者，空间计算先驱。探索下一代交互方式。【虚拟人物】',
    personality: 'ENTP',
    interests: '空间计算, 混合现实, 3D交互',
    is_virtual: true,
    community_title: 'XR开发者',
    status: 'busy',
    github: 'https://github.com/xr-xu',
    portfolio: 'https://xuxr.space',
    extendedBio: 'XR开发者，Vision Pro早期开发者。专注于空间计算和混合现实应用开发。相信空间计算将重新定义人机交互，正在探索下一代计算平台的可能性。',
    location: '上海',
    pastProjects: [
      { name: 'Spatial Workspace', tech: ['VisionOS', 'SwiftUI', 'RealityKit'], award: '🥇 冠军', year: '2024' },
      { name: 'AR Museum', tech: ['ARKit', 'Unity', '3D Modeling'], award: '最佳XR奖', year: '2023' }
    ],
    radar: { frontend: 80, backend: 50, product: 70, design: 90, ai: 40, devops: 30 }
  },
  {
    id: 22,
    full_name: '物互联',
    nickname: '物联网物工',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=iot&backgroundColor=c0aede',
    skills: 'IoT, Embedded Systems, MQTT, Edge Computing, Hardware',
    bio: 'IoT架构师，连接物理世界和数字世界。硬件软件通吃。【虚拟人物】',
    personality: 'ISTJ',
    interests: '智能家居, 工业物联网, 边缘计算',
    is_virtual: true,
    community_title: '物联网架构师',
    status: 'open',
    github: 'https://github.com/iot-wu',
    portfolio: 'https://wuiot.link',
    extendedBio: 'IoT架构师，10年物联网开发经验。从传感器到云平台，全栈IoT技术专家。参与过多个大型智慧城市和工业4.0项目。',
    location: '深圳',
    pastProjects: [
      { name: 'SmartFactory', tech: ['MQTT', 'Kubernetes', 'Go'], award: '🥈 亚军', year: '2024' },
      { name: 'EdgeAI', tech: ['TensorFlow Lite', 'ESP32', 'C++'], award: '最佳IoT奖', year: '2023' }
    ],
    radar: { frontend: 40, backend: 85, product: 60, design: 30, ai: 55, devops: 70 }
  },
  {
    id: 23,
    full_name: '语自然',
    nickname: 'NLP语言学家语博士',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nlp&backgroundColor=ffdfbf',
    skills: 'NLP, Computational Linguistics, Python, Transformer, Annotation',
    bio: '计算语言学博士，让机器理解人类语言。NLP技术布道者。【虚拟人物】',
    personality: 'INTP',
    interests: '大语言模型, 语义理解, 多语言NLP',
    is_virtual: true,
    community_title: '计算语言学家',
    status: 'reviewing',
    github: 'https://github.com/nlp-yu',
    portfolio: 'https://yunlp.org',
    extendedBio: '计算语言学博士，NLP技术专家。专注于语义理解和多语言处理。参与过多个大语言模型的训练和优化。相信语言是智能的核心，致力于让机器真正理解人类。',
    location: '北京',
    pastProjects: [
      { name: 'Polyglot AI', tech: ['Transformers', 'PyTorch', 'FastAPI'], award: '🥇 冠军', year: '2024' },
      { name: 'Semantic Search', tech: ['BERT', 'Elasticsearch', 'React'], award: '最佳NLP奖', year: '2023' }
    ],
    radar: { frontend: 45, backend: 80, product: 55, design: 30, ai: 95, devops: 40 }
  },
  {
    id: 24,
    full_name: '云架构',
    nickname: '云原生云架构师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cloud&backgroundColor=d1d4f9',
    skills: 'Kubernetes, Terraform, AWS, Microservices, Service Mesh',
    bio: '云原生架构师，构建高可用系统。让应用在云端自由飞翔。【虚拟人物】',
    personality: 'ISTJ',
    interests: '云原生, 可观测性, 平台工程',
    is_virtual: true,
    community_title: '云架构师',
    status: 'busy',
    github: 'https://github.com/cloud-yun',
    portfolio: 'https://yunarch.cloud',
    extendedBio: '云原生架构师，CNCF项目贡献者。帮助企业构建云原生应用平台，实现数字化转型。精通Kubernetes生态和云原生最佳实践。',
    location: '杭州',
    pastProjects: [
      { name: 'CloudMesh', tech: ['Istio', 'K8s', 'Prometheus'], award: '🥇 冠军', year: '2024' },
      { name: 'GitOpsFlow', tech: ['ArgoCD', 'Terraform', 'AWS'], award: '最佳DevOps奖', year: '2023' }
    ],
    radar: { frontend: 30, backend: 90, product: 50, design: 20, ai: 35, devops: 95 }
  },
  {
    id: 25,
    full_name: '增长张',
    nickname: '增长黑客张经理',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=growth&backgroundColor=c0aede',
    skills: 'Growth Hacking, Data Analytics, A/B Testing, Product Strategy',
    bio: '增长产品经理，数据驱动的增长专家。寻找优秀的产品和技术团队。【虚拟人物】',
    personality: 'ENTJ',
    interests: '用户增长, 产品策略, 数据分析',
    is_virtual: true,
    community_title: '增长产品经理',
    status: 'open',
    github: 'https://github.com/growth-zhang',
    portfolio: 'https://zhanggrowth.io',
    extendedBio: '增长产品经理，8年互联网产品经验。擅长数据驱动的增长策略，曾帮助多个产品实现用户10倍增长。相信好的产品需要技术和增长的完美结合。',
    location: '上海',
    pastProjects: [
      { name: 'GrowthEngine', tech: ['Python', 'SQL', 'React'], award: '🥈 亚军', year: '2024' },
      { name: 'ViralLoop', tech: ['Node.js', 'Redis', 'Analytics'], award: '最佳增长奖', year: '2023' }
    ],
    radar: { frontend: 55, backend: 50, product: 95, design: 60, ai: 45, devops: 30 }
  },
  {
    id: 26,
    full_name: '开源李',
    nickname: '开源贡献者李',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=opensource&backgroundColor=b6e3f4',
    skills: 'Open Source, Community Building, Documentation, Mentoring',
    bio: '开源布道者，多个知名项目维护者。相信开源改变世界。【虚拟人物】',
    personality: 'ENFP',
    interests: '开源社区, 技术布道, 开发者体验',
    is_virtual: true,
    community_title: '开源贡献者',
    status: 'hacking',
    github: 'https://github.com/oss-li',
    portfolio: 'https://liopensource.dev',
    extendedBio: '开源布道者，多个知名开源项目的核心维护者。热衷于技术社区建设和开发者教育。相信开源不仅是一种开发模式，更是一种协作文化。',
    location: '北京',
    pastProjects: [
      { name: 'OpenDevTools', tech: ['Rust', 'CLI', 'Documentation'], award: '🥇 冠军', year: '2024' },
      { name: 'CommunityHub', tech: ['Next.js', 'Prisma', 'OpenAPI'], award: '最佳社区奖', year: '2023' }
    ],
    radar: { frontend: 65, backend: 75, product: 70, design: 50, ai: 30, devops: 60 }
  },
  {
    id: 27,
    full_name: '音音频',
    nickname: '音频工程师音老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=audio&backgroundColor=ffdfbf',
    skills: 'Audio Processing, DSP, Python, C++, Music Production',
    bio: '音频算法工程师，同时也是独立音乐人。探索AI与音乐的结合。【虚拟人物】',
    personality: 'ISFP',
    interests: 'AI音乐, 空间音频, 语音合成',
    is_virtual: true,
    community_title: '音频工程师',
    status: 'open',
    github: 'https://github.com/audio-yin',
    portfolio: 'https://yinaudio.art',
    extendedBio: '音频算法工程师，同时也是独立音乐人。相信声音是连接技术与艺术的桥梁。专注于AI音乐生成和空间音频技术，在黑客松中创造独特的音频体验。',
    location: '上海',
    pastProjects: [
      { name: 'AI Composer', tech: ['Python', 'Magenta', 'Web Audio'], award: '🥉 季军', year: '2024' },
      { name: 'SpatialSound', tech: ['C++', 'JUCE', 'HRTF'], award: '最佳音频奖', year: '2023' }
    ],
    radar: { frontend: 50, backend: 70, product: 55, design: 75, ai: 60, devops: 25 }
  },
  {
    id: 28,
    full_name: '法科技',
    nickname: '法律科技法律师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=legal&backgroundColor=d1d4f9',
    skills: 'Legal Tech, Smart Contract, Compliance, NLP, Legal Knowledge',
    bio: '律师转行的产品经理，致力于用技术让法律服务更高效。【虚拟人物】',
    personality: 'ISTJ',
    interests: 'LegalTech, 智能合约, 数据合规',
    is_virtual: true,
    community_title: '法律科技产品经理',
    status: 'busy',
    github: 'https://github.com/legal-fa',
    portfolio: 'https://falegal.tech',
    extendedBio: '律师转行的产品经理，深刻理解法律行业的数字化转型需求。致力于用技术让法律服务更高效、更普惠。在黑客松中寻找法律科技的创新机会。',
    location: '北京',
    pastProjects: [
      { name: 'SmartContract Audit', tech: ['Solidity', 'Python', 'ML'], award: '🥈 亚军', year: '2024' },
      { name: 'LegalDoc AI', tech: ['NLP', 'React', 'FastAPI'], award: '最佳法律科技奖', year: '2023' }
    ],
    radar: { frontend: 50, backend: 65, product: 85, design: 40, ai: 70, devops: 35 }
  },
  {
    id: 29,
    full_name: '农科技',
    nickname: '农业科技农户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=agritech&backgroundColor=c0aede',
    skills: 'AgriTech, IoT, Drones, Data Analysis, Sustainable Farming',
    bio: '农业科技创业者，出身农村，致力于用技术助力乡村振兴。【虚拟人物】',
    personality: 'ESFJ',
    interests: '智慧农业, 食品安全, 可持续农业',
    is_virtual: true,
    community_title: '农业科技创业者',
    status: 'open',
    github: 'https://github.com/agri-nong',
    portfolio: 'https://nongagri.farm',
    extendedBio: '农业科技创业者，出身农村，致力于用技术助力乡村振兴。相信科技能让农业更智能、更环保。在黑客松中寻找改善农民生活的创新方案。',
    location: '成都',
    pastProjects: [
      { name: 'SmartFarm', tech: ['IoT', 'Python', 'React'], award: '🥇 冠军', year: '2024' },
      { name: 'CropAI', tech: ['Computer Vision', 'TensorFlow', 'Flutter'], award: '最佳农业奖', year: '2023' }
    ],
    radar: { frontend: 45, backend: 60, product: 75, design: 50, ai: 65, devops: 40 }
  }
]

// 发布讨论弹窗组件
function CreateDiscussionModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; content: string; tags: string[] }) => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  if (!isOpen) return null

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = () => {
    if (title.trim() && content.trim()) {
      onSubmit({ title: title.trim(), content: content.trim(), tags })
      setTitle('')
      setContent('')
      setTags([])
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">发布讨论</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入讨论标题..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的想法、经验或问题..."
              rows={6}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">标签</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="添加标签，按回车确认"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-zinc-800 text-white rounded-[24px] hover:bg-zinc-700 transition-colors"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-brand/20 text-brand rounded-full text-sm"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-6 py-2 text-zinc-400 hover:text-white transition-colors rounded-[24px]"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
            className="px-6 py-2 bg-brand text-black font-medium rounded-[24px] hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            发布
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// 成员详情模态框
function MemberDetailModal({
  isOpen,
  onClose,
  member
}: {
  isOpen: boolean
  onClose: () => void
  member: MemberDetail | null
}) {
  if (!isOpen || !member) return null

  const statusConfig = STATUS_MAP[member.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-[24px] w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-brand/20 via-brand/10 to-transparent" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute -bottom-12 left-6">
            <img
              src={member.avatar}
              alt={member.nickname}
              className="w-24 h-24 rounded-[20px] bg-zinc-800 border-4 border-zinc-900"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Basic Info */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{member.nickname}</h2>
                {member.is_virtual && (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                    虚拟
                  </span>
                )}
                <span className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1.5 ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-zinc-400">{member.community_title || member.full_name}</p>
              {member.location && (
                <div className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {member.location}
                </div>
              )}
            </div>
            
            {/* Radar Chart */}
            <div className="flex flex-col items-center">
              <RadarChart data={member.radar} size={140} />
              <span className="text-xs text-zinc-500 mt-2">能力雷达</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-3 mb-6">
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {member.portfolio && (
              <a
                href={member.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Globe className="w-4 h-4" />
                个人主页
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Extended Bio */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-brand" />
              关于我
            </h3>
            <p className="text-zinc-300 leading-relaxed text-sm">
              {member.extendedBio}
            </p>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand" />
              技能
            </h3>
            <div className="flex flex-wrap gap-2">
              {member.skills?.split(',').map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Interests & Personality */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h4 className="text-xs text-zinc-500 mb-2">兴趣领域</h4>
              <p className="text-zinc-300 text-sm">{member.interests}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h4 className="text-xs text-zinc-500 mb-2">MBTI</h4>
              <p className="text-zinc-300 text-sm">{member.personality}</p>
            </div>
          </div>

          {/* Past Projects */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand" />
              黑客松经历
            </h3>
            <div className="space-y-3">
              {member.pastProjects.map((project, i) => (
                <div key={i} className="bg-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium">{project.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        {project.year}
                      </div>
                    </div>
                    {project.award && (
                      <span className="px-2 py-1 bg-brand/20 text-brand text-xs rounded-lg">
                        {project.award}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tech.map((t, j) => (
                      <span key={j} className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// 社区资料设置弹窗
function CommunityProfileModal({
  isOpen,
  onClose,
  profile,
  onSave
}: {
  isOpen: boolean
  onClose: () => void
  profile: CommunityProfile
  onSave: (data: CommunityProfile) => void
}) {
  const [showInCommunity, setShowInCommunity] = useState(profile.show_in_community)
  const [communityBio, setCommunityBio] = useState(profile.community_bio)
  const [communitySkills, setCommunitySkills] = useState(profile.community_skills)
  const [communityTitle, setCommunityTitle] = useState(profile.community_title)
  const [status, setStatus] = useState(profile.status)
  const [github, setGithub] = useState(profile.github)
  const [portfolio, setPortfolio] = useState(profile.portfolio)
  const [extendedBio, setExtendedBio] = useState(profile.extendedBio)
  const [location, setLocation] = useState(profile.location)
  const [pastProjects, setPastProjects] = useState(profile.pastProjects)
  const [radar, setRadar] = useState(profile.radar)
  const [activeTab, setActiveTab] = useState<'basic' | 'skills' | 'projects'>('basic')

  if (!isOpen) return null

  const handleSave = () => {
    onSave({
      show_in_community: showInCommunity,
      community_bio: communityBio,
      community_skills: communitySkills,
      community_title: communityTitle,
      status,
      github,
      portfolio,
      extendedBio,
      location,
      pastProjects,
      radar
    })
    onClose()
  }

  const handleAddProject = () => {
    setPastProjects([...pastProjects, { name: '', tech: [], year: new Date().getFullYear().toString() }])
  }

  const handleRemoveProject = (index: number) => {
    setPastProjects(pastProjects.filter((_, i) => i !== index))
  }

  const handleUpdateProject = (index: number, field: string, value: string | string[]) => {
    const updated = [...pastProjects]
    updated[index] = { ...updated[index], [field]: value }
    setPastProjects(updated)
  }

  const handleRadarChange = (field: keyof typeof radar, value: number) => {
    setRadar({ ...radar, [field]: Math.min(100, Math.max(0, value)) })
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-[24px] w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-white">社区资料设置</h2>
            <p className="text-sm text-zinc-500 mt-1">完善你的社区展示信息，让更多人了解你</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {[
            { id: 'basic', label: '基本信息', icon: UserPlus },
            { id: 'skills', label: '技能雷达', icon: Code2 },
            { id: 'projects', label: '黑客松经历', icon: Award }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-brand border-b-2 border-brand'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-[24px]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${showInCommunity ? 'bg-brand/20' : 'bg-zinc-700'}`}>
                    {showInCommunity ? <Eye className="w-5 h-5 text-brand" /> : <EyeOff className="w-5 h-5 text-zinc-400" />}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">在社区大厅展示</h3>
                    <p className="text-sm text-zinc-500">开启后其他用户可以在社区大厅看到你的资料</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInCommunity(!showInCommunity)}
                  className={`relative w-14 h-8 rounded-[24px] transition-colors ${
                    showInCommunity ? 'bg-brand' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 rounded-[20px] bg-white transition-transform ${
                      showInCommunity ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">当前状态</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-brand cursor-pointer"
                  >
                    {Object.entries(STATUS_MAP).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  当前选择: <span className="text-brand">{STATUS_MAP[status].label}</span>
                </p>
              </div>

              {/* Title & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">职位/头衔</label>
                  <input
                    type="text"
                    value={communityTitle}
                    onChange={(e) => setCommunityTitle(e.target.value)}
                    placeholder="例如：全栈工程师"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">所在城市</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="例如：北京"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">GitHub</label>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">个人主页</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Short Bio */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">简短介绍</label>
                <textarea
                  value={communityBio}
                  onChange={(e) => setCommunityBio(e.target.value)}
                  placeholder="用一句话介绍自己..."
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand resize-none"
                />
              </div>

              {/* Extended Bio */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">详细介绍</label>
                <textarea
                  value={extendedBio}
                  onChange={(e) => setExtendedBio(e.target.value)}
                  placeholder="详细介绍你的技术背景、经验和兴趣..."
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand resize-none"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">技能标签（用逗号分隔）</label>
                <input
                  type="text"
                  value={communitySkills}
                  onChange={(e) => setCommunitySkills(e.target.value)}
                  placeholder="React, Node.js, Python, AI..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          )}

          {/* Skills Radar Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center py-8">
                <div className="bg-zinc-800/50 rounded-[24px] p-8">
                  <RadarChart data={radar} size={200} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'frontend', label: '前端开发', icon: Code2 },
                  { key: 'backend', label: '后端开发', icon: Boxes },
                  { key: 'product', label: '产品思维', icon: Lightbulb },
                  { key: 'design', label: '设计能力', icon: Palette },
                  { key: 'ai', label: 'AI/ML', icon: Zap },
                  { key: 'devops', label: 'DevOps', icon: Briefcase }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="bg-zinc-800/50 rounded-[24px] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-brand" />
                      <span className="text-white text-sm">{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={radar[key as keyof typeof radar]}
                        onChange={(e) => handleRadarChange(key as keyof typeof radar, parseInt(e.target.value))}
                        className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand"
                      />
                      <span className="text-brand font-mono w-10 text-right">
                        {radar[key as keyof typeof radar]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">黑客松经历</h3>
                <button
                  onClick={handleAddProject}
                  className="flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-[24px] hover:bg-brand/20 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加经历
                </button>
              </div>

              <div className="space-y-4">
                {pastProjects.map((project, index) => (
                  <div key={index} className="bg-zinc-800/50 rounded-[24px] p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={project.name}
                          onChange={(e) => handleUpdateProject(index, 'name', e.target.value)}
                          placeholder="项目名称"
                          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-brand text-sm"
                        />
                        <input
                          type="text"
                          value={project.year}
                          onChange={(e) => handleUpdateProject(index, 'year', e.target.value)}
                          placeholder="年份"
                          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-brand text-sm"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveProject(index)}
                        className="ml-3 p-2 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={project.award || ''}
                      onChange={(e) => handleUpdateProject(index, 'award', e.target.value)}
                      placeholder="获奖情况（可选）"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-brand text-sm"
                    />

                    <input
                      type="text"
                      value={project.tech.join(', ')}
                      onChange={(e) => handleUpdateProject(index, 'tech', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                      placeholder="技术栈（用逗号分隔）"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-brand text-sm"
                    />
                  </div>
                ))}

                {pastProjects.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>还没有添加黑客松经历</p>
                    <p className="text-sm mt-1">点击上方按钮添加你的参赛经历</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-6 py-2 text-zinc-400 hover:text-white transition-colors rounded-[24px]"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-brand text-black font-medium rounded-[24px] hover:bg-white transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            保存设置
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// 主组件
// 导航图标组件
const MembersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const DiscussionsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const SettingsNavIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function CommunityPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'members' | 'discussions'>('members')
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null)
  const [selectedMemberForMatch, setSelectedMemberForMatch] = useState<{ id: number; name: string; avatar: string; skills: string; bio: string } | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false)
  const [isAIMatchOpen, setIsAIMatchOpen] = useState(false)
  const [members] = useState<MemberDetail[]>(MOCK_MEMBERS)
  const [discussions, setDiscussions] = useState<Discussion[]>(MOCK_DISCUSSIONS)
  
  const [myProfile, setMyProfile] = useState<CommunityProfile>({
    show_in_community: true,
    community_bio: '热爱黑客松的全栈开发者',
    community_skills: 'React, Node.js, Python',
    community_title: '全栈工程师',
    status: 'open',
    github: 'https://github.com/myusername',
    portfolio: 'https://myportfolio.com',
    extendedBio: '我是一名充满热情的全栈开发者，专注于构建用户友好的Web应用。参加过多次黑客松，享受在有限时间内创造有价值产品的挑战。',
    location: '北京',
    pastProjects: [
      { name: 'MyFirstHack', tech: ['React', 'Firebase'], award: '🥉 季军', year: '2023' }
    ],
    radar: { frontend: 80, backend: 70, product: 60, design: 50, ai: 40, devops: 45 }
  })

  const handleSaveProfile = (data: CommunityProfile) => {
    setMyProfile(data)
  }

  const handleCreateDiscussion = (data: { title: string; content: string; tags: string[] }) => {
    const newDiscussion: Discussion = {
      id: discussions.length + 1,
      title: data.title,
      content: data.content,
      author: '我',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me&backgroundColor=c0aede',
      replies: 0,
      views: 0,
      tags: data.tags,
      isVirtual: false,
      time: '刚刚',
      author_id: 999
    }
    setDiscussions([newDiscussion, ...discussions])
  }

  const menuItems = [
    { id: 'members', label: '社区成员', icon: <MembersIcon /> },
    { id: 'discussions', label: '热门讨论', icon: <DiscussionsIcon /> },
  ]

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6 py-2">
            <button 
              onClick={() => navigate('/')}
              className="text-ink-dim hover:text-ink transition-colors duration-200 text-sm font-medium tracking-wide flex items-center gap-2 px-4 py-2 hover:bg-surface rounded-[16px]"
            >
              <span>←</span> 返回大厅
            </button>
            <span className="text-ink-dim/30">/</span>
            <span className="text-brand text-sm font-bold tracking-wide px-4 py-2 bg-brand/5 rounded-[16px]">社区大厅</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-[#FBBF24] font-mono">//</span>
            社区大厅
          </h1>
          <p className="text-gray-500 mt-2">发现志同道合的伙伴，分享你的黑客松经历</p>
        </motion.div>

        {/* Main Layout - Left 20% / Right 80% */}
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <nav className="sticky top-24 space-y-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-all rounded-[16px] ${
                    activeTab === item.id 
                      ? 'bg-white/[0.08] text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              <div className="pt-4 mt-4 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setSelectedMemberForMatch(null);
                    setIsAIMatchOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-all rounded-[16px] text-brand hover:bg-brand/10"
                >
                  <Sparkles className="w-4 h-4" />
                  AI智能匹配
                </button>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-all rounded-[16px] text-gray-400 hover:text-white hover:bg-white/[0.03]`}
                >
                  <SettingsNavIcon />
                  资料设置
                </button>
              </div>
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* Members Tab */}
              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => {
                      const statusConfig = STATUS_MAP[member.status]
                      const StatusIcon = statusConfig.icon
                      
                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -4 }}
                          className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 cursor-pointer hover:border-zinc-700 transition-all group relative"
                        >
                          {/* AI匹配按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMemberForMatch({
                                id: member.id,
                                name: member.nickname,
                                avatar: member.avatar,
                                skills: member.skills,
                                bio: member.bio
                              });
                              setIsAIMatchOpen(true);
                            }}
                            className="absolute top-4 right-4 p-2 bg-brand/10 hover:bg-brand/20 rounded-[12px] transition-colors opacity-0 group-hover:opacity-100"
                            title="AI匹配分析"
                          >
                            <Sparkles className="w-4 h-4 text-brand" />
                          </button>

                          <div onClick={() => setSelectedMember(member)}>
                            <div className="flex items-start justify-between mb-4">
                              <img
                                src={member.avatar}
                                alt={member.nickname}
                                className="w-16 h-16 rounded-[24px] bg-zinc-800"
                              />
                              {member.is_virtual && (
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                                  虚拟
                                </span>
                              )}
                            </div>

                            <h3 className="text-white font-semibold mb-1 group-hover:text-brand transition-colors">
                              {member.nickname}
                            </h3>
                            <p className="text-zinc-500 text-sm mb-3">{member.community_title || member.full_name}</p>
                            
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border mb-3 ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </div>

                            <p className="text-zinc-400 text-sm line-clamp-2 mb-4">{member.bio}</p>

                            <div className="flex flex-wrap gap-1.5">
                              {member.skills?.split(',').slice(0, 3).map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded"
                                >
                                  {skill.trim()}
                                </span>
                              ))}
                              {member.skills?.split(',').length > 3 && (
                                <span className="px-2 py-0.5 text-zinc-500 text-xs">
                                  +{member.skills.split(',').length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Discussions Tab */}
              {activeTab === 'discussions' && (
                <motion.div
                  key="discussions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* New Discussion Button */}
                  <div className="flex justify-end mb-6">
                    <button
                      onClick={() => setIsDiscussionModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand text-black font-medium rounded-[24px] hover:bg-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      发布讨论
                    </button>
                  </div>

                  {discussions.map((discussion) => (
                    <motion.div
                      key={discussion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 hover:border-zinc-700 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={discussion.avatar}
                          alt={discussion.author}
                          className="w-12 h-12 rounded-[24px] bg-zinc-800"
                        />
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-2 hover:text-brand transition-colors">
                            {discussion.title}
                          </h3>
                          <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{discussion.content}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-zinc-500">
                            <span>{discussion.author}</span>
                            <span>·</span>
                            <span>{discussion.time}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {discussion.replies}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {discussion.views}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {discussion.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 bg-brand/10 text-brand text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MemberDetailModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />

      <CommunityProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={myProfile}
        onSave={handleSaveProfile}
      />

      <CreateDiscussionModal
        isOpen={isDiscussionModalOpen}
        onClose={() => setIsDiscussionModalOpen(false)}
        onSubmit={handleCreateDiscussion}
      />

      <AIMatchModal
        isOpen={isAIMatchOpen}
        onClose={() => {
          setIsAIMatchOpen(false);
          setSelectedMemberForMatch(null);
        }}
        targetMember={selectedMemberForMatch}
      />
    </div>
  )
}
