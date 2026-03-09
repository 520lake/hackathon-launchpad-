#!/usr/bin/env python3
"""
创建虚拟参赛者用户脚本
用于展示参赛者视角的功能
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User
from app.core.security import get_password_hash

# 虚拟参赛者数据 - 多样化的背景
VIRTUAL_USERS = [
    {
        "email": "virtual.ai.researcher@example.com",
        "full_name": "李明远",
        "nickname": "AI探索者_李明",
        "github_id": "virtual_li_ming",
        "skills": "Python, PyTorch, TensorFlow, 计算机视觉, NLP",
        "interests": "大语言模型, 多模态AI, AI for Science",
        "personality": "INTJ",
        "bio": "清华大学计算机系博士生，专注于大语言模型的研究。曾参与多个开源项目，热爱黑客松文化，享受在限时挑战中创造价值的快感。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=liming&backgroundColor=b6e3f4",
        "is_virtual": True,
    },
    {
        "email": "virtual.fullstack.dev@example.com",
        "full_name": "王小雨",
        "nickname": "全栈小王",
        "github_id": "virtual_wang_xy",
        "skills": "React, Node.js, TypeScript, Go, Docker, Kubernetes",
        "interests": "Web3, 云原生, DevOps, 开源贡献",
        "personality": "ENFP",
        "bio": "前字节跳动工程师，现自由开发者。全栈技术栈，从前端到后端再到部署运维都能搞定。参加过20+场黑客松，拿过5次冠军。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu&backgroundColor=c0aede",
        "is_virtual": True,
    },
    {
        "email": "virtual.product.designer@example.com",
        "full_name": "张思琪",
        "nickname": "设计琪",
        "github_id": "virtual_zhang_sq",
        "skills": "Figma, UI/UX, 用户研究, 产品设计, 前端开发",
        "interests": "设计系统, 无障碍设计, AI辅助设计",
        "personality": "INFJ",
        "bio": "资深产品设计师，曾在Apple和Figma实习。相信好的设计能改变世界，热衷于将设计思维应用到技术创新中。擅长将复杂的技术概念转化为用户友好的产品。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=siqi&backgroundColor=ffdfbf",
        "is_virtual": True,
    },
    {
        "email": "virtual.blockchain.dev@example.com",
        "full_name": "陈浩然",
        "nickname": "链上陈",
        "github_id": "virtual_chen_hr",
        "skills": "Solidity, Rust, 智能合约, DeFi协议, 零知识证明",
        "interests": "Web3基础设施, DAO治理, 去中心化身份",
        "personality": "INTP",
        "bio": "区块链安全研究员，白帽黑客。发现过多个DeFi协议的漏洞，获得超过50万美元的漏洞赏金。相信去中心化技术能构建更公平的互联网。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=haoran&backgroundColor=d1d4f9",
        "is_virtual": True,
    },
    {
        "email": "virtual.data.scientist@example.com",
        "full_name": "刘芳",
        "nickname": "数据女王",
        "github_id": "virtual_liu_fang",
        "skills": "Python, R, SQL, 机器学习, 数据可视化, 统计学",
        "interests": "数据驱动决策, 商业智能, 因果推断",
        "personality": "ENTJ",
        "bio": "前麦肯锡数据科学家，现创业中。擅长从数据中发现商业洞察，将复杂的分析结果转化为可执行的商业策略。相信数据能讲述最动人的故事。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=liufang&backgroundColor=ffd5dc",
        "is_virtual": True,
    },
    {
        "email": "virtual.mobile.dev@example.com",
        "full_name": "赵阳",
        "nickname": "移动开发赵",
        "github_id": "virtual_zhao_yang",
        "skills": "Swift, Kotlin, Flutter, React Native, iOS, Android",
        "interests": "移动AI应用, AR/VR, 跨平台开发",
        "personality": "ESTP",
        "bio": "独立App开发者，开发了3款百万级下载量的应用。相信移动端是技术普惠的最佳载体，热衷于创造让用户惊喜的移动体验。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoyang&backgroundColor=c0aede",
        "is_virtual": True,
    },
    {
        "email": "virtual.game.dev@example.com",
        "full_name": "周游戏",
        "nickname": "游戏创客",
        "github_id": "virtual_zhou_game",
        "skills": "Unity, Unreal Engine, C#, C++, 游戏设计, 3D建模",
        "interests": "独立游戏, 严肃游戏, AI生成内容, 元宇宙",
        "personality": "ENFP",
        "bio": "独立游戏开发者，作品在Steam获得好评如潮。相信游戏是最有感染力的媒介，能让复杂的技术概念变得有趣易懂。正在探索AI与游戏的结合。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=youxi&backgroundColor=b6e3f4",
        "is_virtual": True,
    },
    {
        "email": "virtual.security.expert@example.com",
        "full_name": "吴安全",
        "nickname": "安全卫士",
        "github_id": "virtual_wu_sec",
        "skills": "渗透测试, 逆向工程, 密码学, 安全审计, 威胁情报",
        "interests": "AI安全, 供应链安全, 隐私保护技术",
        "personality": "ISTJ",
        "bio": "网络安全专家，曾协助多家Fortune 500公司提升安全 posture。相信安全是技术创新的基石，在黑客松中经常帮助团队发现并修复安全漏洞。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=security&backgroundColor=ffdfbf",
        "is_virtual": True,
    },
    {
        "email": "virtual.student.innovator@example.com",
        "full_name": "孙晓晓",
        "nickname": "创新少女",
        "github_id": "virtual_sun_xx",
        "skills": "Python, JavaScript, Arduino, 硬件开发, 快速原型",
        "interests": "教育科技, 社会创新, 可持续发展, 创客文化",
        "personality": "ENFJ",
        "bio": "上海交通大学大二学生，已获得Y Combinator面试邀请。虽然是黑客松新手，但充满热情和创造力，擅长将不同领域的想法跨界融合。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoxiao&backgroundColor=ffd5dc",
        "is_virtual": True,
    },
    {
        "email": "virtual.cto.startup@example.com",
        "full_name": "马超",
        "nickname": "CTO老马",
        "github_id": "virtual_ma_cto",
        "skills": "系统架构, 技术管理, Go, Java, 微服务, 高并发",
        "interests": "技术领导力, 工程文化, 创业, 开源生态",
        "personality": "ENTJ",
        "bio": "连续创业者，前独角兽公司CTO。在黑客松中寻找技术合伙人和下一个创业想法。相信优秀的技术团队能创造奇迹，乐于指导和帮助年轻开发者。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=machao&backgroundColor=d1d4f9",
        "is_virtual": True,
    },
    {
        "email": "virtual.ux.writer@example.com",
        "full_name": "林文案",
        "nickname": "UX写手",
        "github_id": "virtual_lin_writer",
        "skills": "UX写作, 内容策略, 品牌文案, 用户研究, SEO",
        "interests": "内容设计, 语音交互, AI写作工具, 无障碍内容",
        "personality": "INFP",
        "bio": "前Notion内容设计师，专注于创造清晰、有用、有温度的产品文案。相信好的文字能让技术产品更有温度，在黑客松中帮助团队打磨产品故事。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=wenan&backgroundColor=c0aede",
        "is_virtual": True,
    },
    {
        "email": "virtual.ml.ops@example.com",
        "full_name": "黄运维",
        "nickname": "MLOps黄",
        "github_id": "virtual_huang_mlops",
        "skills": "MLOps, 模型部署, 特征工程, A/B测试, 监控告警",
        "interests": "LLMOps, 模型压缩, 边缘AI, 实时推理",
        "personality": "ISTP",
        "bio": "机器学习平台工程师，曾搭建支撑亿级用户的推荐系统。相信模型的价值在于落地，擅长将研究原型转化为生产级应用。在黑客松中帮助团队快速部署AI功能。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=mlops&backgroundColor=b6e3f4",
        "is_virtual": True,
    },
    # 新增多元化背景虚拟人物
    {
        "email": "virtual.bioinformatician@example.com",
        "full_name": "徐基因",
        "nickname": "生物信息徐博士",
        "github_id": "virtual_xu_bio",
        "skills": "Python, R, 生物信息学, 基因组学, 深度学习, 数据分析",
        "interests": "AI for Science, 精准医疗, 药物发现, 合成生物学",
        "personality": "INTJ",
        "bio": "中科院生物信息学博士，专注于用AI加速科学发现。曾参与人类基因组计划后续项目，相信交叉学科的力量。在黑客松中寻找生物与技术的碰撞点。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=bioinfo&backgroundColor=ffdfbf",
        "is_virtual": True,
    },
    {
        "email": "virtual.fintech.analyst@example.com",
        "full_name": "钱金融",
        "nickname": "量化小钱",
        "github_id": "virtual_qian_fin",
        "skills": "Python, 量化交易, 风险管理, 金融建模, 机器学习, SQL",
        "interests": "DeFi, 算法交易, 金融AI, 监管科技",
        "personality": "ENTJ",
        "bio": "前高盛量化分析师，现Web3创业者。对金融科技充满热情，相信技术能让金融服务更普惠。在黑客松中寻找改变金融行业的创新想法。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=fintech&backgroundColor=d1d4f9",
        "is_virtual": True,
    },
    {
        "email": "virtual.robotics.engineer@example.com",
        "full_name": "罗机器人",
        "nickname": "机器人罗工",
        "github_id": "virtual_luo_robot",
        "skills": "ROS, C++, Python, 计算机视觉, 运动控制, 嵌入式系统",
        "interests": "人形机器人, 自动驾驶, 工业4.0, 机器人学习",
        "personality": "ISTP",
        "bio": "机器人工程师，参与过多个工业机器人项目。相信机器人将改变人类的工作和生活方式。在黑客松中探索机器人与AI的结合应用。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=robotics&backgroundColor=c0aede",
        "is_virtual": True,
    },
    {
        "email": "virtual.climate.tech@example.com",
        "full_name": "绿环保",
        "nickname": "气候科技绿",
        "github_id": "virtual_lv_climate",
        "skills": "Python, 数据分析, 遥感技术, 气候建模, 可持续发展",
        "interests": "碳中和, 清洁能源, 气候AI, 环境正义",
        "personality": "INFJ",
        "bio": "气候科技创业者，致力于用技术应对气候变化。相信科技创新能为地球带来希望。在黑客松中寻找志同道合的伙伴一起创造绿色未来。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=climate&backgroundColor=b6e3f4",
        "is_virtual": True,
    },
    {
        "email": "virtual.edtech@example.com",
        "full_name": "教未来",
        "nickname": "教育科技教老师",
        "github_id": "virtual_jiao_edu",
        "skills": "教育心理学, 课程设计, React, Node.js, AI教育应用",
        "interests": "个性化学习, 教育公平, AI导师, 游戏化学习",
        "personality": "ENFJ",
        "bio": "前新东方名师，现教育科技产品经理。相信技术能让优质教育触达每个人。在黑客松中寻找让学习更有趣、更有效的创新方案。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=edtech&backgroundColor=ffd5dc",
        "is_virtual": True,
    },
    {
        "email": "virtual.healthcare@example.com",
        "full_name": "医健康",
        "nickname": "数字医疗医博士",
        "github_id": "virtual_yi_health",
        "skills": "医学知识, 临床数据分析, Python, 医疗AI, 远程医疗",
        "interests": "数字疗法, 医疗影像AI, 慢病管理, 健康科技",
        "personality": "ISFJ",
        "bio": "医学博士转行的产品经理，曾在三甲医院工作5年。深刻理解医疗行业的痛点，致力于用技术改善患者体验。在黑客松中寻找医疗创新的机会。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=health&backgroundColor=ffdfbf",
        "is_virtual": True,
    },
    {
        "email": "virtual.creative.coder@example.com",
        "full_name": "艺代码",
        "nickname": "创意编程艺艺术家",
        "github_id": "virtual_yi_art",
        "skills": "Processing, p5.js, TouchDesigner, GLSL, 生成艺术, 音画互动",
        "interests": "生成艺术, 算法艺术, 音画互动, AI艺术, 新媒体艺术",
        "personality": "INFP",
        "bio": "新媒体艺术家，作品曾在多个国际艺术节展出。相信代码也是一种艺术表达形式，热衷于探索技术与艺术的边界。在黑客松中创造美的体验。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=artcode&backgroundColor=c0aede",
        "is_virtual": True,
    },
    {
        "email": "virtual.social.entrepreneur@example.com",
        "full_name": "社企业",
        "nickname": "社会创新社",
        "github_id": "virtual_she_social",
        "skills": "商业策略, 社会创新, 项目管理, 数据分析, 影响力评估",
        "interests": "社会企业, 影响力投资, 乡村振兴, 无障碍技术",
        "personality": "ENFP",
        "bio": "社会企业家，创办过两家社会企业。相信商业可以成为解决社会问题的力量。在黑客松中寻找用技术创造社会价值的项目。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=social&backgroundColor=ffd5dc",
        "is_virtual": True,
    },
    {
        "email": "virtual.vr.ar@example.com",
        "full_name": "虚现实",
        "nickname": "XR开发者虚",
        "github_id": "virtual_xu_xr",
        "skills": "Unity, Unreal, C#, 3D建模, 空间计算, 手势识别",
        "interests": "空间计算, 元宇宙, 数字孪生, 沉浸式体验",
        "personality": "ENTP",
        "bio": "XR开发者，参与过Vision Pro应用开发。相信空间计算是下一代计算平台，热衷于创造沉浸式的数字体验。在黑客松中探索XR的无限可能。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=xrdev&backgroundColor=d1d4f9",
        "is_virtual": True,
    },
    {
        "email": "virtual.iot.engineer@example.com",
        "full_name": "物互联",
        "nickname": "物联网物工",
        "github_id": "virtual_wu_iot",
        "skills": "嵌入式开发, MQTT, 边缘计算, 传感器, 硬件设计, C/C++",
        "interests": "智能家居, 工业物联网, 智慧城市, 数字农业",
        "personality": "ISTJ",
        "bio": "物联网架构师，设计过百万级设备的IoT平台。相信万物互联将重塑我们的生活方式。在黑客松中寻找软硬件结合的创新项目。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=iot&backgroundColor=b6e3f4",
        "is_virtual": True,
    },
    {
        "email": "virtual.nlp.linguist@example.com",
        "full_name": "语自然",
        "nickname": "NLP语言学家语博士",
        "github_id": "virtual_yu_nlp",
        "skills": "计算语言学, Python, 深度学习, 语料库构建, 多语言处理",
        "interests": "大语言模型, 低资源语言, 语言保护, 跨语言理解",
        "personality": "INTP",
        "bio": "计算语言学博士，掌握8门语言。致力于让AI理解人类语言的微妙之处。在黑客松中探索语言技术的创新应用，特别关注多语言和方言保护。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=nlp&backgroundColor=ffdfbf",
        "is_virtual": True,
    },
    {
        "email": "virtual.cloud.architect@example.com",
        "full_name": "云架构",
        "nickname": "云原生云架构师",
        "github_id": "virtual_yun_cloud",
        "skills": "AWS, Azure, GCP, Kubernetes, Terraform, 微服务, Serverless",
        "interests": "多云架构, FinOps, 云安全, 绿色计算",
        "personality": "ESTJ",
        "bio": "云架构师，帮助上百家企业完成云原生转型。相信优秀的架构是系统稳定的基石。在黑客松中帮助团队设计可扩展的技术架构。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=cloud&backgroundColor=c0aede",
        "is_virtual": True,
    },
    {
        "email": "virtual.pm.growth@example.com",
        "full_name": "增长张",
        "nickname": "增长黑客张经理",
        "github_id": "virtual_zhang_growth",
        "skills": "增长策略, 数据分析, A/B测试, 用户研究, 产品运营, SQL",
        "interests": "PLG, 病毒式增长, 用户留存, 数据驱动决策",
        "personality": "ENTP",
        "bio": "增长产品经理，曾帮助产品从0到100万用户。相信数据能揭示用户行为的真相。在黑客松中寻找有增长潜力的创新项目。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=growth&backgroundColor=ffd5dc",
        "is_virtual": True,
    },
    {
        "email": "virtual.open.source@example.com",
        "full_name": "开源李",
        "nickname": "开源贡献者李",
        "github_id": "virtual_li_oss",
        "skills": "Rust, Go, 分布式系统, 开源治理, 社区运营, 文档写作",
        "interests": "开源生态, 去中心化协议, 开发者工具, 技术写作",
        "personality": "INTJ",
        "bio": "开源布道者，多个知名开源项目的核心贡献者。相信开放协作能创造更好的软件。在黑客松中推广开源精神，帮助项目建立开源社区。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=opensource&backgroundColor=d1d4f9",
        "is_virtual": True,
    },
    {
        "email": "virtual.audio.engineer@example.com",
        "full_name": "音音频",
        "nickname": "音频工程师音老师",
        "github_id": "virtual_yin_audio",
        "skills": "音频处理, DSP, Python, C++, 音乐制作, 语音识别",
        "interests": "AI音乐, 空间音频, 语音合成, 实时音频处理",
        "personality": "ISFP",
        "bio": "音频算法工程师，同时也是独立音乐人。相信声音是连接技术与艺术的桥梁。在黑客松中创造独特的音频体验，探索AI与音乐的结合。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=audio&backgroundColor=b6e3f4",
        "is_virtual": True,
    },
    {
        "email": "virtual.legal.tech@example.com",
        "full_name": "法科技",
        "nickname": "法律科技法律师",
        "github_id": "virtual_fa_legal",
        "skills": "法律知识, 合同审查, NLP, 合规科技, 智能合约, 数据隐私",
        "interests": "LegalTech, 智能合约, 数据合规, 法律AI",
        "personality": "ISTJ",
        "bio": "律师转行的产品经理，深刻理解法律行业的数字化转型需求。致力于用技术让法律服务更高效、更普惠。在黑客松中寻找法律科技的创新机会。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=legal&backgroundColor=ffdfbf",
        "is_virtual": True,
    },
    {
        "email": "virtual.agritech@example.com",
        "full_name": "农科技",
        "nickname": "农业科技农户",
        "github_id": "virtual_nong_agri",
        "skills": "农业知识, 物联网, 数据分析, 无人机, 精准农业, Python",
        "interests": "智慧农业, 食品安全, 可持续农业, 农业AI",
        "personality": "ESFJ",
        "bio": "农业科技创业者，出身农村，致力于用技术助力乡村振兴。相信科技能让农业更智能、更环保。在黑客松中寻找改善农民生活的创新方案。【虚拟人物】",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=agri&backgroundColor=c0aede",
        "is_virtual": True,
    },
]


def create_virtual_users():
    """创建虚拟用户"""
    with Session(engine) as session:
        created_count = 0
        skipped_count = 0
        
        for user_data in VIRTUAL_USERS:
            # 检查用户是否已存在
            existing = session.exec(
                select(User).where(User.email == user_data["email"])
            ).first()
            
            if existing:
                print(f"用户已存在: {user_data['full_name']} ({user_data['email']})")
                skipped_count += 1
                continue
            
            # 创建新用户
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash("virtual_user_password_2024"),
                full_name=user_data["full_name"],
                nickname=user_data["nickname"],
                github_id=user_data["github_id"],
                skills=user_data["skills"],
                interests=user_data["interests"],
                personality=user_data["personality"],
                bio=user_data["bio"],
                avatar=user_data["avatar"],
                is_active=True,
                is_virtual=True,  # 标记为虚拟用户
                can_create_hackathon=False,  # 虚拟用户只有参赛者权限
            )
            
            session.add(user)
            created_count += 1
            print(f"创建用户: {user_data['full_name']} ({user_data['email']})")
        
        session.commit()
        print(f"\n完成! 创建: {created_count}, 跳过: {skipped_count}")


if __name__ == "__main__":
    print("开始创建虚拟参赛者用户...")
    print("=" * 60)
    create_virtual_users()
