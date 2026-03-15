"""
Seed script: populates the database with 24 sample hackathons and related data.

Usage:
    cd backend
    DATABASE_URL="sqlite:///../vibebuild.db" .venv/bin/python3 scripts/seed_hackathons.py

Idempotent — skips seeding if hackathons already exist.
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import create_engine, Session, select, SQLModel
from app.models.user import User
from app.models.hackathon import Hackathon, HackathonStatus, HackathonFormat, RegistrationType
from app.models.hackathon_host import HackathonHost
from app.models.hackathon_organizer import HackathonOrganizer, OrganizerRole, OrganizerStatus
from app.models.section import Section, SectionType
from app.models.schedule import Schedule
from app.models.prize import Prize
from app.models.judging_criteria import JudgingCriteria
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.team_project import Team, TeamMember, Submission, SubmissionStatus
from app.models.recruitment import Recruitment
from app.core.config import settings

import random

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def dt(s: str) -> datetime:
    return datetime.fromisoformat(s)


HACKATHONS = [
    {
        "id": 1,
        "title": "AI 创新应用黑客松 2026",
        "description": "汇聚全国顶尖开发者，围绕人工智能技术开发创新应用",
        "tags": '["AI","LLM","计算机视觉","NLP"]',
        "cover_image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-03-10T09:00:00"),
        "end_date": dt("2026-04-10T18:00:00"),
        "status": HackathonStatus.ONGOING,
        "province": "上海市", "city": "上海市", "district": "浦东新区", "address": "张江高科技园区",
        "overview": """## 关于本次黑客松

本次 AI 创新应用黑客松旨在汇聚全国顶尖开发者，围绕人工智能技术，开发创新应用解决方案。我们相信 AI 将彻底改变人们的生活和工作方式。

### 赛题方向
- **智能助手**：基于大语言模型的创新应用
- **计算机视觉**：图像识别、视频分析等应用
- **AI + 教育**：利用 AI 技术革新教育体验
- **AI + 医疗**：医疗健康领域的 AI 应用

### 参赛要求
- 每队 2-5 人
- 需在活动期间完成项目开发
- 提交完整的项目演示和文档

### 特别福利
- 顶级 AI 导师一对一指导
- GPU 算力资源赞助
- 优秀项目可获得投资机构对接机会""",
        "schedules": [
            ("开幕式 & 赛题发布", "2026-03-10 09:00", "2026-03-10 11:00"),
            ("导师答疑 & 技术分享", "2026-03-15 14:00", "2026-03-15 17:00"),
            ("中期检查", "2026-03-25 10:00", "2026-03-25 16:00"),
            ("项目提交截止 & 路演评审", "2026-04-10 09:00", "2026-04-10 18:00"),
        ],
        "prizes": [
            ("一等奖", "技术创新性突出，产品完成度高", 1, 50000),
            ("二等奖", "技术方案优秀，产品体验良好", 2, 20000),
            ("三等奖", "完成度高，具有实用价值", 3, 10000),
            ("最佳创意奖", "创意新颖，解决方案独特", 1, 5000),
        ],
        "criteria": [
            ("技术创新", 30, "技术方案的创新性和先进性"),
            ("产品完成度", 25, "产品功能的完整性和稳定性"),
            ("用户体验", 20, "界面设计和交互体验"),
            ("商业价值", 15, "市场潜力和商业化可行性"),
            ("团队协作", 10, "团队分工和协作效率"),
        ],
        "hosts": ["创新科技基金会", "AI 研究院"],
    },
    {
        "id": 2,
        "title": "Web3 去中心化应用挑战赛",
        "description": "探索区块链与去中心化技术的无限可能",
        "tags": '["Web3","区块链","DeFi","NFT"]',
        "cover_image": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-04-15T09:00:00"),
        "end_date": dt("2026-04-17T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "北京市", "city": "北京市", "district": "海淀区", "address": "中关村创业大街",
        "overview": """## Web3 去中心化应用挑战赛

探索区块链与去中心化技术的无限可能！

### 赛题方向
- **DeFi 创新**：去中心化金融协议与应用
- **NFT & 数字藏品**：数字资产创新应用
- **DAO 治理工具**：去中心化组织管理工具
- **跨链互操作**：多链生态基础设施

### 参赛要求
- 每队 2-5 人，需有至少 1 名智能合约开发者
- 项目需部署在测试网
- 提交完整的技术文档和演示视频

### 技术支持
- 提供测试网 Gas 费补贴
- 链上开发工具套件
- 安全审计指导""",
        "schedules": [
            ("签到 & 破冰社交", "2026-04-15 09:00", "2026-04-15 10:00"),
            ("开幕式 & 赛题发布", "2026-04-15 10:00", "2026-04-15 12:00"),
            ("Hacking Time", "2026-04-15 13:00", "2026-04-16 18:00"),
            ("项目路演 & 评审", "2026-04-17 09:00", "2026-04-17 15:00"),
            ("颁奖典礼", "2026-04-17 16:00", "2026-04-17 18:00"),
        ],
        "prizes": [
            ("一等奖", "技术创新性突出，DApp 完成度高", 1, 80000),
            ("二等奖", "智能合约设计优秀", 2, 30000),
            ("三等奖", "项目完整可运行", 3, 15000),
            ("最佳 DeFi 创新奖", "在去中心化金融领域有突破性创新", 1, 10000),
        ],
        "criteria": [
            ("技术架构", 30, "智能合约安全性、链上/链下架构合理性"),
            ("产品体验", 25, "DApp 前端交互流畅度"),
            ("创新性", 20, "解决方案的独特性"),
            ("商业可行性", 15, "代币经济模型、可持续发展能力"),
            ("演示效果", 10, "路演表达清晰度"),
        ],
        "hosts": ["区块链协会", "以太坊基金会"],
    },
    {
        "id": 3,
        "title": "开源之夏 2026 编程马拉松",
        "description": "面向全球开发者的线上开源编程马拉松",
        "tags": '["开源","编程","全栈","后端"]',
        "cover_image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.INDIVIDUAL,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-01-15T09:00:00"),
        "end_date": dt("2026-02-28T18:00:00"),
        "status": HackathonStatus.ENDED,
        "overview": """## 开源之夏 2026

面向全球开发者的线上编程马拉松。选择感兴趣的开源项目，在导师指导下贡献代码。

### 参与方式
1. 浏览可选开源项目列表
2. 提交项目提案
3. 在导师指导下完成开发
4. 提交代码并参与评审

### 可选项目方向
- **前端框架**：React、Vue 生态贡献
- **后端基础设施**：数据库、消息队列优化
- **DevOps 工具**：CI/CD、容器编排改进
- **AI/ML 库**：机器学习框架功能扩展

### 特别说明
- 个人参赛，无需组队
- 全程线上，灵活安排时间
- 导师来自知名开源社区""",
        "schedules": [
            ("线上启动仪式", "2026-01-15 10:00", "2026-01-15 12:00"),
            ("项目提案提交", "2026-01-15 12:00", "2026-01-31 23:59"),
            ("导师配对 & 开发阶段", "2026-02-01 00:00", "2026-02-20 23:59"),
            ("成果提交截止", "2026-02-25 00:00", "2026-02-25 23:59"),
            ("线上评审 & 结果发布", "2026-02-26 10:00", "2026-02-28 18:00"),
        ],
        "prizes": [
            ("杰出贡献奖", "代码贡献量大且质量高", 3, 20000),
            ("最佳新人奖", "首次参与开源，表现突出", 5, 5000),
            ("社区人气奖", "获得社区投票最多的项目", 1, 8000),
        ],
        "criteria": [
            ("代码质量", 35, "代码规范性、测试覆盖率"),
            ("项目影响", 25, "对上游开源项目的实际贡献"),
            ("技术难度", 25, "解决问题的复杂度"),
            ("社区参与", 15, "与社区互动、Code Review 参与度"),
        ],
        "hosts": ["开源中国", "Linux 基金会"],
    },
    {
        "id": 4,
        "title": "智能硬件创客马拉松",
        "description": "结合软硬件技术，48小时内打造创新智能设备",
        "tags": '["IoT","硬件","嵌入式","Arduino"]',
        "cover_image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-05-01T09:00:00"),
        "end_date": dt("2026-05-03T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "广东省", "city": "深圳市", "district": "南山区", "address": "深圳湾科技生态园",
        "overview": """## 智能硬件创客马拉松

结合软硬件技术，打造创新智能设备！提供 Arduino、ESP32、树莓派等开发板和传感器套件。

### 赛题方向
- **智能家居**：家庭自动化与能源管理
- **健康监测**：可穿戴设备与健康数据分析
- **农业科技**：智能灌溉、环境监测
- **教育机器人**：STEM 教育互动设备

### 参赛要求
- 每队 3-5 人，需有硬件和软件开发者
- 48 小时内完成硬件原型和配套软件
- 需现场展示可运行的原型""",
        "schedules": [
            ("签到 & 硬件领取", "2026-05-01 09:00", "2026-05-01 10:00"),
            ("开幕式 & 技术分享", "2026-05-01 10:00", "2026-05-01 12:00"),
            ("48 小时极限开发", "2026-05-01 13:00", "2026-05-03 13:00"),
            ("项目展示 & Demo Day", "2026-05-03 14:00", "2026-05-03 17:00"),
            ("颁奖 & 闭幕", "2026-05-03 17:00", "2026-05-03 18:00"),
        ],
        "prizes": [
            ("一等奖", "硬件原型完成度高，创新性强", 1, 60000),
            ("二等奖", "技术方案可行，展示效果出色", 2, 25000),
            ("三等奖", "原型可运行，文档完整", 3, 10000),
            ("最佳工业设计奖", "产品外观设计精美", 1, 8000),
        ],
        "criteria": [
            ("硬件完成度", 30, "原型的功能完整性和稳定性"),
            ("创新性", 25, "方案的新颖程度和技术突破"),
            ("工业设计", 20, "外观设计、人机交互体验"),
            ("实用价值", 15, "解决的实际问题和市场需求"),
            ("团队表现", 10, "分工协作、现场调试能力"),
        ],
        "hosts": ["深圳创客中心", "华为开发者联盟"],
    },
    {
        "id": 5,
        "title": "全球气候科技黑客松",
        "description": "利用科技手段应对气候变化，构建可持续未来",
        "tags": '["气候","碳中和","可持续","绿色科技"]',
        "cover_image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-04-01T09:00:00"),
        "end_date": dt("2026-04-30T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "overview": """## 全球气候科技黑客松

用技术对抗气候变化！聚焦碳足迹追踪、清洁能源优化、气候模型预测等方向。

### 赛题方向
- **碳足迹追踪**：个人/企业碳排放监测与可视化
- **清洁能源**：太阳能、风能效率优化算法
- **气候建模**：基于 AI 的气候变化预测
- **绿色消费**：可持续生活方式工具

### 参赛要求
- 每队 2-5 人，支持跨国组队
- 全程线上，提交代码 + 演示视频
- 项目需有明确的环保影响评估""",
        "schedules": [
            ("线上启动仪式", "2026-04-01 10:00", "2026-04-01 12:00"),
            ("导师 Office Hour", "2026-04-10 14:00", "2026-04-10 17:00"),
            ("中期 Demo Day", "2026-04-15 10:00", "2026-04-15 16:00"),
            ("项目提交截止", "2026-04-28 00:00", "2026-04-28 23:59"),
            ("评审与颁奖", "2026-04-30 14:00", "2026-04-30 18:00"),
        ],
        "prizes": [
            ("一等奖", "环保影响显著，技术方案可行", 1, 40000),
            ("二等奖", "创新性强，数据分析深入", 2, 20000),
            ("三等奖", "项目完整，文档清晰", 3, 10000),
            ("最佳碳中和方案奖", "碳减排效果可量化", 1, 8000),
        ],
        "criteria": [
            ("环保影响", 30, "对碳减排的实际贡献"),
            ("技术可行性", 25, "技术方案的科学性"),
            ("创新性", 20, "解决方案的独特性"),
            ("数据驱动", 15, "数据分析的深度"),
            ("展示效果", 10, "演示的清晰度"),
        ],
        "hosts": ["联合国开发计划署", "清华大学环境学院"],
    },
    {
        "id": 6,
        "title": "FinTech 金融科技创新赛",
        "description": "探索金融科技前沿，重塑数字金融体验",
        "tags": '["FinTech","支付","风控","量化"]',
        "cover_image": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-04-20T09:00:00"),
        "end_date": dt("2026-04-22T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "上海市", "city": "上海市", "district": "黄浦区", "address": "外滩金融中心",
        "overview": """## FinTech 金融科技创新赛

在外滩金融中心，探索数字金融的未来。

### 赛题方向
- **智能风控**：基于 AI 的反欺诈与信用评估
- **数字支付**：跨境支付与数字货币结算
- **量化交易**：高频交易策略与回测系统
- **合规科技**：RegTech 监管合规自动化""",
        "schedules": [
            ("签到 & 破冰", "2026-04-20 08:30", "2026-04-20 10:00"),
            ("开幕 & 赛题发布", "2026-04-20 10:00", "2026-04-20 12:00"),
            ("48 小时开发", "2026-04-20 13:00", "2026-04-22 13:00"),
            ("路演评审", "2026-04-22 14:00", "2026-04-22 17:00"),
            ("颁奖晚宴", "2026-04-22 18:00", "2026-04-22 20:00"),
        ],
        "prizes": [
            ("一等奖", "风控模型效果优异，合规性强", 1, 100000),
            ("二等奖", "产品体验流畅，商业逻辑清晰", 2, 40000),
            ("三等奖", "技术实现完整", 3, 20000),
            ("最佳风控创新奖", "反欺诈方案突破性创新", 1, 15000),
        ],
        "criteria": [
            ("合规性", 25, "金融监管合规"),
            ("技术深度", 25, "算法与架构"),
            ("产品体验", 20, "用户体验"),
            ("商业价值", 20, "市场潜力"),
            ("演示效果", 10, "路演表现"),
        ],
        "hosts": ["蚂蚁金服", "上海金融科技联盟"],
    },
    {
        "id": 7,
        "title": "元宇宙创意开发大赛",
        "description": "打造沉浸式虚拟体验，探索元宇宙无限可能",
        "tags": '["元宇宙","VR","AR","3D"]',
        "cover_image": "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-05-10T09:00:00"),
        "end_date": dt("2026-05-12T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "浙江省", "city": "杭州市", "district": "滨江区", "address": "网易蜗牛读书馆",
        "overview": "## 元宇宙创意开发大赛\n\n用 VR/AR/3D 技术构建沉浸式虚拟世界。\n\n### 赛题方向\n- **虚拟社交**：元宇宙社交空间\n- **数字孪生**：物理空间的数字化映射\n- **沉浸式教育**：VR/AR 教育应用\n- **虚拟商业**：元宇宙电商与虚拟展厅",
        "schedules": [("签到 & 设备调试","2026-05-10 09:00","2026-05-10 10:00"),("开幕式","2026-05-10 10:00","2026-05-10 12:00"),("沉浸式开发","2026-05-10 13:00","2026-05-12 12:00"),("Demo 展示","2026-05-12 13:00","2026-05-12 16:00"),("颁奖","2026-05-12 16:30","2026-05-12 18:00")],
        "prizes": [("一等奖","沉浸感强，交互自然",1,70000),("二等奖","场景创意独特",2,30000),("三等奖","原型完整可体验",3,15000),("最佳视觉奖","3D 美术效果出色",1,10000)],
        "criteria": [("沉浸感",30,"用户的沉浸式体验"),("创意",25,"场景设计创新性"),("技术实现",20,"渲染与交互技术"),("流畅度",15,"帧率与加载性能"),("可玩性",10,"内容深度")],
        "hosts": ["网易伏羲", "Unity 中国"],
    },
    {
        "id": 8,
        "title": "智慧城市数据挑战赛",
        "description": "利用城市开放数据，构建智慧城市解决方案",
        "tags": '["智慧城市","大数据","GIS","交通"]',
        "cover_image": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-03-20T09:00:00"),
        "end_date": dt("2026-04-20T18:00:00"),
        "status": HackathonStatus.ONGOING,
        "province": "北京市", "city": "北京市", "district": "朝阳区", "address": "望京 SOHO",
        "overview": "## 智慧城市数据挑战赛\n\n利用北京市公开数据集，构建智慧交通、环保、民生等领域的创新解决方案。\n\n### 赛题方向\n- **智慧交通**：交通流量预测与信号灯优化\n- **环境监测**：空气质量预警与污染溯源\n- **公共服务**：政务服务智能化升级\n- **城市安全**：应急响应与灾害预警系统",
        "schedules": [("数据开放说明会","2026-03-20 10:00","2026-03-20 12:00"),("技术答疑","2026-03-28 14:00","2026-03-28 17:00"),("中期检查","2026-04-05 10:00","2026-04-05 16:00"),("成果提交","2026-04-18 00:00","2026-04-18 23:59"),("路演 & 颁奖","2026-04-20 09:00","2026-04-20 18:00")],
        "prizes": [("一等奖","数据应用深入，社会效益显著",1,60000),("二等奖","分析维度丰富",2,25000),("三等奖","可视化效果优秀",3,12000),("最佳数据洞察奖","从数据中发现独特洞察",1,8000)],
        "criteria": [("数据应用",30,"数据利用深度"),("社会价值",25,"对城市治理的贡献"),("技术水平",20,"算法与工程质量"),("可视化",15,"数据展示效果"),("可落地性",10,"方案实际可行性")],
        "hosts": ["北京市大数据中心", "百度智慧城市"],
    },
    {
        "id": 9,
        "title": "网络安全攻防大赛 CTF",
        "description": "以赛促学，提升网络安全实战能力",
        "tags": '["安全","CTF","渗透","逆向"]',
        "cover_image": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-05-15T09:00:00"),
        "end_date": dt("2026-05-17T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "overview": "## 网络安全攻防大赛 CTF\n\n以赛促学，通过 Web 渗透、逆向工程、密码学等多维度挑战提升安全实战能力。\n\n### 赛题类别\n- **Web 安全**：SQL 注入、XSS、CSRF\n- **逆向工程**：二进制分析与漏洞挖掘\n- **密码学**：加密算法破解\n- **Pwn**：内存安全与漏洞利用\n- **Misc**：隐写术、取证分析",
        "schedules": [("平台开放 & 签到","2026-05-15 09:00","2026-05-15 10:00"),("比赛开始","2026-05-15 10:00","2026-05-17 10:00"),("WriteUp 提交","2026-05-17 10:00","2026-05-17 14:00"),("解题分享","2026-05-17 15:00","2026-05-17 17:00"),("颁奖","2026-05-17 17:00","2026-05-17 18:00")],
        "prizes": [("冠军","综合得分最高",1,50000),("亚军","解题数量与速度优秀",1,25000),("季军","技术分析深入",1,15000),("最佳 WriteUp 奖","报告质量最高",1,5000)],
        "criteria": [("解题得分",50,"CTF 平台自动评分"),("解题速度",20,"首次解出时间"),("WriteUp 质量",20,"报告分析深度"),("团队协作",10,"分工与配合效率")],
        "hosts": ["360 安全", "看雪学院"],
    },
    {
        "id": 10,
        "title": "游戏开发 Game Jam 48H",
        "description": "48 小时极限游戏开发，从零到一做出可玩游戏",
        "tags": '["游戏","Unity","Godot","像素"]',
        "cover_image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.INDIVIDUAL,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-06-01T09:00:00"),
        "end_date": dt("2026-06-03T09:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "overview": "## 游戏开发 Game Jam 48H\n\n48 小时内从零开始制作一款完整可玩的游戏！\n\n### 规则\n- 开赛时公布主题关键词\n- 48 小时内独立完成游戏开发\n- 个人参赛，可使用任意引擎\n- 提交可运行的游戏构建包",
        "schedules": [("主题公布","2026-06-01 09:00","2026-06-01 09:30"),("开发阶段","2026-06-01 09:30","2026-06-03 09:00"),("游戏提交","2026-06-03 09:00","2026-06-03 09:30"),("互相试玩","2026-06-03 10:00","2026-06-03 14:00"),("评审 & 颁奖","2026-06-03 14:00","2026-06-03 16:00")],
        "prizes": [("金奖","游戏性出色，创意与主题契合",1,15000),("银奖","美术风格独特",2,8000),("铜奖","完成度高",3,5000),("最佳音效奖","游戏音效与配乐出色",1,3000)],
        "criteria": [("创意",30,"游戏创意与主题契合度"),("游戏性",25,"核心玩法趣味性"),("美术",20,"视觉风格与一致性"),("完成度",15,"功能完整性"),("音效",10,"音乐与音效")],
        "hosts": ["IndieNova", "Game Creator 社区"],
    },
    {
        "id": 11,
        "title": "医疗健康 AI 黑客松",
        "description": "用 AI 赋能医疗健康，让技术温暖生命",
        "tags": '["医疗","AI","健康","生物信息"]',
        "cover_image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-04-05T09:00:00"),
        "end_date": dt("2026-04-07T18:00:00"),
        "status": HackathonStatus.ONGOING,
        "province": "广东省", "city": "广州市", "district": "天河区", "address": "广州国际生物岛",
        "overview": "## 医疗健康 AI 黑客松\n\n用 AI 技术赋能医疗健康。\n\n### 赛题方向\n- **医学影像**：X光、CT、MRI 智能诊断\n- **电子病历**：NLP 驱动的病历结构化\n- **药物发现**：AI 辅助新药筛选\n- **健康管理**：慢性病风险预测与干预",
        "schedules": [("签到 & 数据领取","2026-04-05 09:00","2026-04-05 10:00"),("开幕 & 专家讲座","2026-04-05 10:00","2026-04-05 12:00"),("开发阶段","2026-04-05 13:00","2026-04-07 12:00"),("成果汇报","2026-04-07 13:00","2026-04-07 17:00"),("颁奖","2026-04-07 17:00","2026-04-07 18:00")],
        "prizes": [("一等奖","诊断准确率高，临床价值显著",1,80000),("二等奖","模型泛化性强",2,35000),("三等奖","方案完整可部署",3,15000),("最佳社会价值奖","对公共卫生贡献突出",1,10000)],
        "criteria": [("准确率",30,"模型诊断精度"),("临床价值",25,"实际医疗应用前景"),("技术创新",20,"算法与方法创新"),("数据处理",15,"数据清洗与特征工程"),("可解释性",10,"模型决策可解释性")],
        "hosts": ["中山大学医学院", "腾讯健康"],
    },
    {
        "id": 12,
        "title": "低代码平台创新赛",
        "description": "重新定义应用开发，让人人都是开发者",
        "tags": '["低代码","无代码","SaaS","效率"]',
        "cover_image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.INDIVIDUAL,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-03-01T09:00:00"),
        "end_date": dt("2026-03-31T18:00:00"),
        "status": HackathonStatus.ONGOING,
        "overview": "## 低代码平台创新赛\n\n用低代码/无代码平台构建完整应用。\n\n### 赛题方向\n- **企业 OA**：内部管理与审批流程\n- **CRM 系统**：客户关系管理\n- **数据看板**：业务数据可视化\n- **自动化流程**：工作流自动化编排",
        "schedules": [("线上启动","2026-03-01 10:00","2026-03-01 12:00"),("平台使用培训","2026-03-05 14:00","2026-03-05 16:00"),("中期展示","2026-03-15 10:00","2026-03-15 16:00"),("作品提交","2026-03-29 00:00","2026-03-29 23:59"),("评审颁奖","2026-03-31 14:00","2026-03-31 18:00")],
        "prizes": [("一等奖","应用功能完整，用户体验优秀",1,20000),("二等奖","业务逻辑清晰",2,10000),("三等奖","基本功能实现",3,5000),("最佳效率奖","开发效率最高",1,3000)],
        "criteria": [("功能完整性",30,"业务需求覆盖度"),("用户体验",25,"界面设计与交互"),("技术难度",20,"平台能力运用深度"),("文档质量",15,"说明文档清晰度"),("创意",10,"应用场景创新性")],
        "hosts": ["飞书", "钉钉低代码"],
    },
    {
        "id": 13,
        "title": "自动驾驶算法挑战赛",
        "description": "面向 L4 自动驾驶场景的感知与决策算法竞赛",
        "tags": '["自动驾驶","SLAM","点云","深度学习"]',
        "cover_image": "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-06-15T09:00:00"),
        "end_date": dt("2026-07-15T18:00:00"),
        "status": HackathonStatus.DRAFT,
        "overview": "## 自动驾驶算法挑战赛\n\n面向 L4 级别自动驾驶场景，挑战感知融合与决策规划算法极限。\n\n### 赛题方向\n- **3D 目标检测**：基于点云的车辆、行人检测\n- **语义分割**：道路场景理解\n- **轨迹预测**：交通参与者运动预测\n- **规划决策**：自动驾驶路径规划",
        "schedules": [("数据集发布","2026-06-15 10:00","2026-06-15 12:00"),("Baseline 发布","2026-06-20 10:00","2026-06-20 12:00"),("排行榜开放","2026-06-25 00:00","2026-07-10 23:59"),("最终提交","2026-07-12 00:00","2026-07-12 23:59"),("结果公布","2026-07-15 14:00","2026-07-15 18:00")],
        "prizes": [("冠军","mAP 最高且推理速度达标",1,100000),("亚军","综合指标第二",1,50000),("季军","综合指标第三",1,30000),("最佳创新算法奖","方法论创新突出",1,20000)],
        "criteria": [("mAP 精度",40,"目标检测平均精度"),("推理速度",25,"实时性满足要求"),("泛化能力",20,"跨场景鲁棒性"),("代码质量",15,"工程可读性与规范")],
        "hosts": ["小鹏汽车", "Waymo 中国"],
    },
    {
        "id": 14,
        "title": "教育科技 EdTech 黑客松",
        "description": "用技术革新教育体验，让学习更高效有趣",
        "tags": '["教育","EdTech","在线学习","自适应"]',
        "cover_image": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-05-20T09:00:00"),
        "end_date": dt("2026-05-22T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "四川省", "city": "成都市", "district": "高新区", "address": "天府软件园",
        "overview": "## 教育科技 EdTech 黑客松\n\n在天府之国成都，用技术让教育更公平、更高效。\n\n### 赛题方向\n- **自适应学习**：AI 驱动的个性化学习路径\n- **虚拟实验室**：在线实验模拟环境\n- **知识图谱**：学科知识结构化与智能推荐\n- **学情分析**：学习行为数据分析与预警",
        "schedules": [("签到 & 教育圆桌","2026-05-20 09:00","2026-05-20 11:00"),("开幕 & 赛题","2026-05-20 11:00","2026-05-20 12:00"),("开发阶段","2026-05-20 13:00","2026-05-22 12:00"),("Demo 展示","2026-05-22 13:00","2026-05-22 17:00"),("颁奖","2026-05-22 17:00","2026-05-22 18:00")],
        "prizes": [("一等奖","教育效果提升显著",1,50000),("二等奖","交互设计优秀",2,20000),("三等奖","产品完成度高",3,10000),("最佳公益奖","关注教育公平",1,8000)],
        "criteria": [("教育效果",30,"学习效果可量化提升"),("创新性",25,"教学方法创新"),("用户体验",20,"界面交互流畅"),("技术实现",15,"代码质量与架构"),("公平性",10,"是否关注教育公平")],
        "hosts": ["好未来", "成都教育局"],
    },
    {
        "id": 15,
        "title": "Rust 系统编程挑战赛",
        "description": "用 Rust 构建高性能系统级软件",
        "tags": '["Rust","系统编程","性能","安全"]',
        "cover_image": "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.INDIVIDUAL,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-02-01T09:00:00"),
        "end_date": dt("2026-02-28T18:00:00"),
        "status": HackathonStatus.ENDED,
        "overview": "## Rust 系统编程挑战赛\n\n用 Rust 构建高性能、内存安全的系统级软件。\n\n### 赛题方向\n- **高性能网络**：异步网络框架与代理\n- **嵌入式系统**：Rust on bare metal\n- **编译器/解释器**：DSL 设计与实现\n- **数据库引擎**：存储引擎与查询优化",
        "schedules": [("题目发布","2026-02-01 10:00","2026-02-01 12:00"),("Rust 入门工作坊","2026-02-05 14:00","2026-02-05 17:00"),("中期交流","2026-02-15 10:00","2026-02-15 16:00"),("代码提交","2026-02-26 00:00","2026-02-26 23:59"),("评审 & 颁奖","2026-02-28 14:00","2026-02-28 18:00")],
        "prizes": [("一等奖","性能极致，代码优雅",1,30000),("二等奖","架构合理，benchmark 优秀",2,15000),("三等奖","功能完整，测试充分",3,8000),("最佳 unsafe-free 奖","完全不使用 unsafe",1,5000)],
        "criteria": [("性能",35,"Benchmark 测试成绩"),("代码质量",25,"Rust 惯用写法与安全性"),("功能完整性",20,"需求覆盖度"),("测试覆盖",10,"单元测试与集成测试"),("文档",10,"API 文档与使用说明")],
        "hosts": ["Rust 中文社区", "字节跳动基础架构"],
    },
    {
        "id": 16,
        "title": "数字艺术与生成式 AI 赛",
        "description": "当艺术遇见 AI，探索数字创作的新边界",
        "tags": '["生成式AI","数字艺术","Stable Diffusion","创意"]',
        "cover_image": "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.INDIVIDUAL,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-04-10T09:00:00"),
        "end_date": dt("2026-05-10T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "overview": "## 数字艺术与生成式 AI 赛\n\n用 AI 工具创作数字艺术作品。\n\n### 赛题方向\n- **AI 绘画**：生成式 AI 艺术创作\n- **音乐生成**：AI 音乐作曲\n- **动画短片**：AI 辅助动画制作\n- **交互装置**：AI 驱动的互动艺术装置",
        "schedules": [("创作主题公布","2026-04-10 10:00","2026-04-10 12:00"),("AI 工具工作坊","2026-04-15 14:00","2026-04-15 17:00"),("作品初稿提交","2026-04-25 00:00","2026-04-25 23:59"),("社区投票","2026-04-26 00:00","2026-05-05 23:59"),("评审 & 颁奖","2026-05-10 14:00","2026-05-10 18:00")],
        "prizes": [("金奖","艺术性与技术性完美融合",1,25000),("银奖","创意独特",2,12000),("铜奖","AI 工具运用巧妙",3,6000),("社区人气奖","获得社区投票最多",1,5000)],
        "criteria": [("艺术性",30,"美学价值与表现力"),("创意",25,"作品创意独特性"),("AI 运用",20,"AI 工具的创造性使用"),("技术实现",15,"制作工艺"),("创作理念",10,"艺术理念阐述")],
        "hosts": ["中央美术学院", "Stability AI"],
    },
    {
        "id": 17,
        "title": "供应链数字化黑客松",
        "description": "用数字技术重塑供应链管理",
        "tags": '["供应链","物流","ERP","数字化"]',
        "cover_image": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-05-25T09:00:00"),
        "end_date": dt("2026-05-27T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "江苏省", "city": "苏州市", "district": "工业园区", "address": "苏州国际博览中心",
        "overview": "## 供应链数字化黑客松\n\n在制造业重镇苏州，用数字技术重塑供应链管理全流程。\n\n### 赛题方向\n- **智能仓储**：WMS 系统与机器人调度\n- **物流优化**：路径规划与运力调度\n- **需求预测**：基于 AI 的销量预测\n- **溯源系统**：区块链产品溯源",
        "schedules": [("工厂参观","2026-05-25 09:00","2026-05-25 12:00"),("开幕 & 需求对接","2026-05-25 13:00","2026-05-25 15:00"),("开发阶段","2026-05-25 15:00","2026-05-27 12:00"),("成果汇报","2026-05-27 13:00","2026-05-27 17:00"),("颁奖","2026-05-27 17:00","2026-05-27 18:00")],
        "prizes": [("一等奖","效率提升可量化",1,60000),("二等奖","方案系统性强",2,25000),("三等奖","原型完整",3,12000),("最佳落地奖","与企业需求匹配度最高",1,10000)],
        "criteria": [("业务价值",30,"对供应链效率的提升"),("技术深度",25,"算法与架构设计"),("落地性",20,"方案实际可行性"),("创新性",15,"解决方案独特性"),("演示效果",10,"路演清晰度")],
        "hosts": ["京东物流", "苏州工业园区管委会"],
    },
    {
        "id": 18,
        "title": "无障碍技术创新赛",
        "description": "用技术消除障碍，让科技惠及每一个人",
        "tags": '["无障碍","辅助技术","公益","包容设计"]',
        "cover_image": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-06-05T09:00:00"),
        "end_date": dt("2026-06-30T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "overview": "## 无障碍技术创新赛\n\n用技术消除障碍，让每个人都能平等地使用数字产品。\n\n### 赛题方向\n- **视觉辅助**：AI 图像描述与导航\n- **听觉辅助**：实时语音转文字与手语翻译\n- **运动辅助**：适配性输入设备与界面\n- **认知辅助**：简化交互与信息无障碍",
        "schedules": [("线上启动","2026-06-05 10:00","2026-06-05 12:00"),("无障碍设计工作坊","2026-06-10 14:00","2026-06-10 17:00"),("用户测试日","2026-06-20 10:00","2026-06-20 16:00"),("作品提交","2026-06-28 00:00","2026-06-28 23:59"),("颁奖典礼","2026-06-30 14:00","2026-06-30 18:00")],
        "prizes": [("一等奖","无障碍体验优秀",1,40000),("二等奖","用户反馈正面",2,18000),("三等奖","功能完整",3,8000),("最佳用户体验奖","残障用户测试评分最高",1,10000)],
        "criteria": [("无障碍性",35,"WCAG 合规与实际可用性"),("用户反馈",25,"目标用户测试评分"),("技术创新",20,"辅助技术创新程度"),("完成度",10,"功能完整性"),("社会影响",10,"对无障碍推广的贡献")],
        "hosts": ["中国残联信息中心", "微软亚洲研究院"],
    },
    {
        "id": 19,
        "title": "云原生应用开发大赛",
        "description": "基于 K8s 生态构建云原生应用",
        "tags": '["云原生","Kubernetes","微服务","DevOps"]',
        "cover_image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-01-01T09:00:00"),
        "end_date": dt("2026-01-31T18:00:00"),
        "status": HackathonStatus.ENDED,
        "overview": "## 云原生应用开发大赛\n\n基于 Kubernetes 生态构建高可用、可扩展的云原生应用。\n\n### 赛题方向\n- **微服务架构**：服务拆分与治理\n- **Serverless**：函数计算应用\n- **可观测性**：监控/日志/追踪\n- **混沌工程**：系统韧性测试工具",
        "schedules": [("K8s 集群分配","2026-01-01 10:00","2026-01-01 12:00"),("云原生入门讲座","2026-01-05 14:00","2026-01-05 17:00"),("中期检查","2026-01-15 10:00","2026-01-15 16:00"),("项目提交","2026-01-29 00:00","2026-01-29 23:59"),("评审颁奖","2026-01-31 14:00","2026-01-31 18:00")],
        "prizes": [("一等奖","架构优秀，弹性扩展能力强",1,50000),("二等奖","可观测性完善",2,22000),("三等奖","微服务拆分合理",3,10000),("最佳 SRE 实践奖","运维自动化最佳",1,8000)],
        "criteria": [("架构设计",30,"微服务拆分与治理"),("弹性扩展",25,"自动伸缩能力"),("可观测性",20,"监控/日志/追踪"),("安全性",15,"容器安全与网络策略"),("文档",10,"部署文档与 README")],
        "hosts": ["阿里云", "CNCF 中国"],
    },
    {
        "id": 20,
        "title": "智能机器人编程赛",
        "description": "编程控制机器人完成指定任务挑战",
        "tags": '["机器人","ROS","控制","编程"]',
        "cover_image": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-06-20T09:00:00"),
        "end_date": dt("2026-06-22T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "湖北省", "city": "武汉市", "district": "洪山区", "address": "华中科技大学",
        "overview": "## 智能机器人编程赛\n\n编程控制机器人完成迷宫导航、物品搬运等任务挑战。\n\n### 赛题类型\n- **迷宫导航**：自主路径规划与避障\n- **物品识别与抓取**：视觉引导的机械臂操作\n- **多机协作**：多机器人编队\n- **自由创意**：开放式机器人应用",
        "schedules": [("签到 & 机器人配发","2026-06-20 09:00","2026-06-20 10:00"),("开幕 & 规则说明","2026-06-20 10:00","2026-06-20 12:00"),("编程与调试","2026-06-20 13:00","2026-06-22 12:00"),("任务挑战赛","2026-06-22 13:00","2026-06-22 17:00"),("颁奖","2026-06-22 17:00","2026-06-22 18:00")],
        "prizes": [("一等奖","任务完成率最高",1,50000),("二等奖","算法优秀",2,22000),("三等奖","完成基础任务",3,10000),("最佳创意应用奖","机器人应用创意突出",1,8000)],
        "criteria": [("任务完成率",35,"指定任务的完成度"),("算法效率",25,"路径规划与决策效率"),("代码质量",20,"可读性与模块化"),("创意",10,"应用场景创新"),("团队协作",10,"分工与配合")],
        "hosts": ["华中科技大学", "大疆创新"],
    },
    {
        "id": 21,
        "title": "量子计算编程挑战赛",
        "description": "探索量子计算的应用前沿",
        "tags": '["量子计算","Qiskit","算法","前沿"]',
        "cover_image": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.INDIVIDUAL,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-07-01T09:00:00"),
        "end_date": dt("2026-07-31T18:00:00"),
        "status": HackathonStatus.DRAFT,
        "overview": "## 量子计算编程挑战赛\n\n探索量子计算在优化、模拟、密码学等领域的前沿应用。\n\n### 赛题方向\n- **量子优化**：组合优化问题的量子算法\n- **量子化学**：分子模拟与材料设计\n- **量子机器学习**：混合量子-经典 ML\n- **量子密码**：量子密钥分发协议",
        "schedules": [("量子入门讲座","2026-07-01 10:00","2026-07-01 12:00"),("真机配额分配","2026-07-05 10:00","2026-07-05 12:00"),("中期交流","2026-07-15 14:00","2026-07-15 17:00"),("论文/代码提交","2026-07-29 00:00","2026-07-29 23:59"),("评审颁奖","2026-07-31 14:00","2026-07-31 18:00")],
        "prizes": [("一等奖","量子优势验证成功",1,60000),("二等奖","算法设计巧妙",2,25000),("三等奖","实验完整",3,12000),("最佳论文奖","学术贡献突出",1,10000)],
        "criteria": [("量子优势",30,"相比经典算法的加速比"),("算法设计",25,"量子电路与算法创新"),("实验完整性",20,"实验设计与结果复现"),("论文质量",15,"报告学术水平"),("可扩展性",10,"量子比特扩展能力")],
        "hosts": ["IBM Quantum", "中科院量子信息实验室"],
    },
    {
        "id": 22,
        "title": "社交电商创新黑客松",
        "description": "构建下一代社交电商产品与工具",
        "tags": '["电商","社交","直播","推荐算法"]',
        "cover_image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-04-25T09:00:00"),
        "end_date": dt("2026-04-27T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "浙江省", "city": "杭州市", "district": "余杭区", "address": "阿里巴巴西溪园区",
        "overview": "## 社交电商创新黑客松\n\n在阿里巴巴西溪园区，构建下一代社交电商产品。\n\n### 赛题方向\n- **直播电商**：互动直播间与实时推荐\n- **社群运营**：私域流量工具\n- **内容种草**：AI 内容生成与分发\n- **供需匹配**：智能选品与库存优化",
        "schedules": [("签到 & 产品分享","2026-04-25 09:00","2026-04-25 11:00"),("开幕","2026-04-25 11:00","2026-04-25 12:00"),("48 小时开发","2026-04-25 13:00","2026-04-27 13:00"),("产品路演","2026-04-27 14:00","2026-04-27 17:00"),("颁奖","2026-04-27 17:00","2026-04-27 18:00")],
        "prizes": [("一等奖","商业模型清晰，GMV 增长可验证",1,80000),("二等奖","用户增长策略有效",2,30000),("三等奖","产品完整可用",3,15000),("最佳增长黑客奖","增长策略最有创意",1,10000)],
        "criteria": [("商业价值",30,"商业模式可行性"),("增长策略",25,"用户获取与留存"),("产品体验",20,"界面与交互设计"),("技术实现",15,"代码与架构质量"),("数据验证",10,"数据支撑说服力")],
        "hosts": ["阿里巴巴", "拼多多"],
    },
    {
        "id": 23,
        "title": "DevTools 开发者工具赛",
        "description": "为开发者打造更好用的工具和平台",
        "tags": '["开发工具","CLI","IDE插件","效率"]',
        "cover_image": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.INDIVIDUAL,
        "format": HackathonFormat.ONLINE,
        "start_date": dt("2026-02-15T09:00:00"),
        "end_date": dt("2026-03-15T18:00:00"),
        "status": HackathonStatus.ENDED,
        "overview": "## DevTools 开发者工具赛\n\n为开发者打造更好用的命令行工具、IDE 插件等。\n\n### 赛题方向\n- **CLI 工具**：命令行效率工具\n- **IDE 插件**：VS Code / JetBrains 插件\n- **代码分析**：静态分析与代码质量\n- **文档工具**：API 文档自动生成",
        "schedules": [("赛题公布","2026-02-15 10:00","2026-02-15 12:00"),("开发者访谈","2026-02-20 14:00","2026-02-20 16:00"),("中期分享","2026-03-01 10:00","2026-03-01 16:00"),("工具发布","2026-03-13 00:00","2026-03-13 23:59"),("评审颁奖","2026-03-15 14:00","2026-03-15 18:00")],
        "prizes": [("一等奖","工具实用性极高",1,25000),("二等奖","解决真实痛点",2,12000),("三等奖","功能完整可用",3,6000),("社区之星奖","GitHub Star 最多",1,5000)],
        "criteria": [("实用性",35,"解决真实开发痛点"),("代码质量",25,"开源代码规范"),("用户体验",20,"文档与上手难度"),("创新性",10,"独特解决方案"),("社区反响",10,"Star/下载量")],
        "hosts": ["GitHub", "VS Code 中文社区"],
    },
    {
        "id": 24,
        "title": "音视频技术创新赛",
        "description": "探索实时音视频与流媒体技术的新边界",
        "tags": '["音视频","WebRTC","编解码","直播"]',
        "cover_image": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=600&fit=crop",
        "registration_type": RegistrationType.TEAM,
        "format": HackathonFormat.OFFLINE,
        "start_date": dt("2026-05-05T09:00:00"),
        "end_date": dt("2026-05-07T18:00:00"),
        "status": HackathonStatus.PUBLISHED,
        "province": "广东省", "city": "深圳市", "district": "福田区", "address": "腾讯滨海大厦",
        "overview": "## 音视频技术创新赛\n\n在腾讯滨海大厦，探索实时音视频技术的新边界。\n\n### 赛题方向\n- **超低延迟直播**：端到端延迟 < 500ms\n- **AI 音频处理**：降噪、回声消除、声纹识别\n- **视频编解码**：新一代编解码器优化\n- **互动体验**：多人实时互动与虚拟场景",
        "schedules": [("签到 & 技术分享","2026-05-05 09:00","2026-05-05 11:00"),("开幕","2026-05-05 11:00","2026-05-05 12:00"),("开发阶段","2026-05-05 13:00","2026-05-07 12:00"),("Demo 展示","2026-05-07 13:00","2026-05-07 17:00"),("颁奖","2026-05-07 17:00","2026-05-07 18:00")],
        "prizes": [("一等奖","延迟指标业界领先",1,80000),("二等奖","音质/画质优化显著",2,35000),("三等奖","方案完整",3,15000),("最佳互动体验奖","实时互动创新突出",1,10000)],
        "criteria": [("技术指标",30,"延迟/码率/质量客观指标"),("创新性",25,"技术方案创新"),("体验质量",20,"主观音视频体验"),("工程质量",15,"代码架构与可维护性"),("演示效果",10,"Demo 展示效果")],
        "hosts": ["腾讯云", "声网 Agora"],
    },
]


def seed():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    db_path = os.path.join(project_root, "vibebuild.db")
    db_url = f"sqlite:///{db_path}"
    print(f"Using database: {db_path}")

    engine = create_engine(db_url)

    # Ensure tables exist
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Check if data already exists
        existing = session.exec(select(Hackathon)).first()
        if existing:
            print(f"Database already has hackathon data (found: {existing.title}). Skipping seed.")
            return

        # Ensure admin user exists
        admin = session.exec(select(User).where(User.email == "admin@example.com")).first()
        if not admin:
            admin = session.exec(select(User)).first()
        if not admin:
            admin = User(
                email="admin@example.com",
                full_name="Admin",
                nickname="Admin",
                hashed_password="$2b$12$LJ3a5M5v6F8K9Q7x0W1b0e8G4R2y6T4u8I0o2E4a6C8g0K2m4O6q",
                is_active=True,
                is_superuser=True,
            )
            session.add(admin)
            session.flush()
            print(f"Created admin user (id={admin.id})")

        now = datetime.utcnow()

        for h_data in HACKATHONS:
            created_at = h_data.get("start_date", now)

            # Create hackathon
            hackathon = Hackathon(
                title=h_data["title"],
                description=h_data["description"],
                tags=h_data["tags"],
                cover_image=h_data["cover_image"],
                registration_type=h_data["registration_type"],
                format=h_data["format"],
                start_date=h_data["start_date"],
                end_date=h_data["end_date"],
                status=h_data["status"],
                province=h_data.get("province"),
                city=h_data.get("city"),
                district=h_data.get("district"),
                address=h_data.get("address"),
                created_by=admin.id,
                created_at=created_at,
                updated_at=created_at,
            )
            session.add(hackathon)
            session.flush()

            hid = hackathon.id

            # Organizer
            session.add(HackathonOrganizer(
                hackathon_id=hid, user_id=admin.id,
                role=OrganizerRole.OWNER, status=OrganizerStatus.ACCEPTED,
                created_at=created_at, updated_at=created_at,
            ))

            # Hosts
            for i, host_name in enumerate(h_data["hosts"]):
                session.add(HackathonHost(
                    hackathon_id=hid, name=host_name, display_order=i,
                    created_at=created_at, updated_at=created_at,
                ))

            # Overview section
            overview_section = Section(
                hackathon_id=hid, section_type=SectionType.MARKDOWN,
                title="活动介绍", display_order=0, content=h_data["overview"],
                created_at=created_at, created_by=admin.id, updated_at=created_at,
            )
            session.add(overview_section)

            # Schedule section + items
            sched_section = Section(
                hackathon_id=hid, section_type=SectionType.SCHEDULES,
                title="活动日程", display_order=1,
                created_at=created_at, created_by=admin.id, updated_at=created_at,
            )
            session.add(sched_section)
            session.flush()

            for i, (name, start, end) in enumerate(h_data["schedules"]):
                session.add(Schedule(
                    hackathon_id=hid, section_id=sched_section.id,
                    event_name=name,
                    start_time=datetime.fromisoformat(start.replace(" ", "T")),
                    end_time=datetime.fromisoformat(end.replace(" ", "T")),
                    display_order=i,
                    created_at=created_at, updated_at=created_at,
                ))

            # Prize section + items
            prize_section = Section(
                hackathon_id=hid, section_type=SectionType.PRIZES,
                title="奖项设置", display_order=2,
                created_at=created_at, created_by=admin.id, updated_at=created_at,
            )
            session.add(prize_section)
            session.flush()

            for i, (name, standards, qty, amount) in enumerate(h_data["prizes"]):
                session.add(Prize(
                    hackathon_id=hid, section_id=prize_section.id,
                    name=name, winning_standards=standards,
                    quantity=qty, total_cash_amount=amount,
                    awards_sublist="[]", display_order=i,
                    created_at=created_at, updated_at=created_at,
                ))

            # Judging criteria section + items
            jc_section = Section(
                hackathon_id=hid, section_type=SectionType.JUDGING_CRITERIA,
                title="评审标准", display_order=3,
                created_at=created_at, created_by=admin.id, updated_at=created_at,
            )
            session.add(jc_section)
            session.flush()

            for i, (name, weight, desc) in enumerate(h_data["criteria"]):
                session.add(JudgingCriteria(
                    hackathon_id=hid, section_id=jc_section.id,
                    name=name, weight_percentage=weight, description=desc,
                    display_order=i,
                    created_at=created_at, updated_at=created_at,
                ))

            print(f"  Created hackathon {hid}: {h_data['title']}")

        session.commit()
        print(f"\nSeeded {len(HACKATHONS)} hackathons with full data.")

        # --- Seed participants ---
        _seed_participants(session, admin)


def _seed_participants(session: Session, admin: User):
    """Create 60 sample users with enrollments, teams, and recruitments."""

    existing_users = session.exec(select(User).where(User.id >= 2)).first()
    if existing_users:
        print("Participant data already exists. Skipping.")
        return

    NAMES = [
        ("张伟","zhangwei"),("李娜","lina"),("王强","wangqiang"),("刘洋","liuyang"),
        ("陈晨","chenchen"),("赵敏","zhaomin"),("孙磊","sunlei"),("周杰","zhoujie"),
        ("吴昊","wuhao"),("郑琳","zhenglin"),("马超","machao"),("林峰","linfeng"),
        ("黄蕾","huanglei"),("许哲","xuzhe"),("胡静","hujing"),("朱明","zhuming"),
        ("高远","gaoyuan"),("何雪","hexue"),("罗凯","luokai"),("谢婷","xieting"),
        ("韩冰","hanbing"),("唐豪","tanghao"),("冯雅","fengya"),("董鑫","dongxin"),
        ("萧然","xiaoran"),("曹宇","caoyu"),("袁芳","yuanfang"),("邓伟","dengwei"),
        ("彭磊","penglei"),("苏颖","suying"),("蒋涛","jiangtao"),("叶青","yeqing"),
        ("阎明","yanming"),("余婕","yujie"),("潘亮","panliang"),("杜瑶","duyao"),
        ("戴锋","daifeng"),("夏琪","xiaqi"),("钟文","zhongwen"),("姜欣","jiangxin"),
        ("汪洋","wangyang2"),("范志","fanzhi"),("方圆","fangyuan"),("石磊","shilei2"),
        ("任杰","renjie"),("廖芳","liaofang"),("邹强","zouqiang"),("熊伟","xiongwei"),
        ("金鑫","jinxin"),("陆佳","lujia"),("贺敏","hemin"),("白雪","baixue"),
        ("龙飞","longfei"),("万达","wanda"),("段宇","duanyu"),("雷鸣","leiming"),
        ("侯峰","houfeng"),("邵丽","shaoli"),("孟浩","menghao"),("秦风","qinfeng"),
    ]

    SKILLS_POOL = [
        '["Python","机器学习","TensorFlow"]', '["React","TypeScript","Node.js"]',
        '["Java","Spring Boot","微服务"]', '["Go","Kubernetes","Docker"]',
        '["Rust","系统编程","WebAssembly"]', '["Solidity","Web3","DeFi"]',
        '["Flutter","Dart","移动开发"]', '["C++","嵌入式","RTOS"]',
        '["数据分析","SQL","Tableau"]', '["UI/UX设计","Figma","原型"]',
        '["产品管理","敏捷","用户研究"]', '["区块链","智能合约","以太坊"]',
        '["深度学习","PyTorch","NLP"]', '["Vue.js","前端","CSS"]',
        '["Swift","iOS","ARKit"]', '["Unity","C#","游戏开发"]',
        '["ROS","机器人","SLAM"]', '["量子计算","Qiskit","算法"]',
        '["音视频","WebRTC","FFmpeg"]', '["安全","渗透测试","逆向"]',
    ]

    CITIES = ["北京","上海","深圳","杭州","广州","成都","武汉","南京","苏州","西安"]

    BIOS = [
        "全栈工程师，热爱开源","AI 研究员，专注 NLP","前端开发者，追求极致体验",
        "后端架构师，微服务爱好者","独立开发者，连续创业者","在读研究生，方向计算机视觉",
        "产品经理，关注用户体验","数据工程师，擅长数据管道","安全研究员，CTF 选手",
        "设计师兼开发者，跨界达人","嵌入式工程师，IoT 玩家","区块链开发者，DeFi Builder",
        "游戏开发者，独立游戏爱好者","云原生架构师","机器学习工程师，Kaggle Master",
    ]

    TEAM_NAMES = [
        "星际先锋","代码骑士","量子跃迁","数据飞轮","深蓝小队",
        "极客联盟","算法之光","创新工坊","未来实验室","赛博朋克",
        "像素猎人","云端行者","硅谷梦想","开源英雄","智能边界",
        "链上风暴","全栈突击","神经网络","编译之魂","比特旋风",
        "逻辑炸弹","模型工厂","容器先锋","量子纠缠","数据织梦",
    ]

    TEAM_DESCS = [
        "一支充满激情的全栈团队，擅长快速原型开发",
        "专注 AI 应用落地，成员均有大厂经验",
        "跨学科团队，融合技术与设计思维",
        "连续三次黑客松获奖团队，实力强劲",
        "来自高校的研究型团队，理论与实践并重",
    ]

    LOOKING_FOR = [
        "寻找前端开发者，熟悉 React/Vue",
        "需要 AI/ML 工程师，有模型部署经验",
        "招募产品设计师，擅长 Figma",
        "寻找后端开发者，熟悉微服务架构",
        "需要数据分析师，擅长可视化",
    ]

    RECRUIT_ROLES = [
        ("前端开发","React,TypeScript,CSS","负责产品前端界面开发"),
        ("后端开发","Python,Go,数据库","负责 API 和数据架构"),
        ("AI 工程师","PyTorch,TensorFlow,NLP","负责模型训练和部署"),
        ("产品设计","Figma,用户研究,原型","负责产品设计和用户体验"),
        ("数据分析","SQL,Python,可视化","负责数据清洗和分析"),
    ]

    pwd_hash = "$2b$12$LJ3a5M5v6F8K9Q7x0W1b0e8G4R2y6T4u8I0o2E4a6C8g0K2m4O6q"

    # Create 60 users
    users = []
    for i, (name, pinyin) in enumerate(NAMES):
        u = User(
            email=f"{pinyin}@example.com",
            full_name=name, nickname=name,
            hashed_password=pwd_hash,
            is_active=True, is_superuser=False,
            avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={i}",
            skills=SKILLS_POOL[i % len(SKILLS_POOL)],
            city=CITIES[i % len(CITIES)],
            bio=BIOS[i % len(BIOS)],
        )
        session.add(u)
        users.append(u)

    session.flush()
    print(f"  Created {len(users)} sample users")

    user_ids = [u.id for u in users]
    random.seed(42)

    hackathons = session.exec(select(Hackathon)).all()
    team_counter = 0

    for hackathon in hackathons:
        hid = hackathon.id
        reg_type = hackathon.registration_type
        base_date = hackathon.created_at or datetime.utcnow()

        num_participants = random.randint(8, 15)
        participants = random.sample(user_ids, min(num_participants, len(user_ids)))

        # Enrollments
        for uid in participants:
            offset_days = random.randint(0, 14)
            joined = base_date + timedelta(days=offset_days)
            session.add(Enrollment(
                user_id=uid, hackathon_id=hid,
                status=EnrollmentStatus.APPROVED, joined_at=joined,
            ))

        # Teams (only for TEAM hackathons)
        if reg_type == RegistrationType.TEAM:
            num_teams = random.randint(2, 4)
            remaining = list(participants)
            random.shuffle(remaining)

            for t_idx in range(num_teams):
                if len(remaining) < 2:
                    break
                team_counter += 1
                team_size = random.randint(2, min(4, len(remaining)))
                team_members = remaining[:team_size]
                remaining = remaining[team_size:]

                leader = team_members[0]
                joined = base_date + timedelta(days=random.randint(1, 10))

                team = Team(
                    hackathon_id=hid,
                    name=TEAM_NAMES[team_counter % len(TEAM_NAMES)],
                    description=TEAM_DESCS[team_counter % len(TEAM_DESCS)],
                    looking_for=LOOKING_FOR[team_counter % len(LOOKING_FOR)],
                    leader_id=leader, created_at=joined,
                )
                session.add(team)
                session.flush()

                for uid in team_members:
                    session.add(TeamMember(
                        team_id=team.id, user_id=uid, joined_at=joined,
                    ))

                # 50% chance of a recruitment post
                if random.random() < 0.5:
                    role, skills, desc = RECRUIT_ROLES[team_counter % len(RECRUIT_ROLES)]
                    session.add(Recruitment(
                        team_id=team.id, role=role, skills=skills,
                        count=random.randint(1, 2), description=desc,
                        status="OPEN", created_at=joined,
                    ))

    session.commit()

    total_enrollments = len(session.exec(select(Enrollment)).all())
    total_teams = len(session.exec(select(Team)).all())
    print(f"  Created {total_enrollments} enrollments, {total_teams} teams")

    # --- Seed aura admin with submissions ---
    _seed_aura_admin(session)


SUBMISSION_DATA = [
    (1,  "AI 智能写作助手", "基于大语言模型的智能写作辅助工具，支持多语言、多风格的文章生成与润色", '["Python","GPT-4","FastAPI","React"]', "https://images.unsplash.com/photo-1676299081847-824916de030a?w=800&h=400&fit=crop"),
    (2,  "ChainVote DAO", "去中心化投票治理平台，支持二次方投票和委托代理机制", '["Solidity","Hardhat","React","IPFS"]', "https://images.unsplash.com/photo-1644143379190-08a5f055de1d?w=800&h=400&fit=crop"),
    (3,  "GitFlow 自动化", "开源 Git 工作流自动化工具，智能合并冲突解决", '["Python","Git","AST","CLI"]', "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&h=400&fit=crop"),
    (4,  "AirSense 空气监测仪", "基于 ESP32 的便携式空气质量监测设备", '["ESP32","C++","MQTT","React Native"]', "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=400&fit=crop"),
    (5,  "CarbonTrack", "个人碳足迹追踪应用，通过消费数据自动计算碳排放", '["Python","Flask","ML","React"]', "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&h=400&fit=crop"),
    (6,  "RiskRadar 风控引擎", "实时交易反欺诈检测系统，基于图神经网络的异常检测", '["Python","GNN","Kafka","Redis"]', "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"),
    (7,  "MetaClass 虚拟教室", "元宇宙沉浸式在线教室，支持 3D 白板和虚拟实验", '["Unity","C#","WebRTC","Three.js"]', "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800&h=400&fit=crop"),
    (8,  "TrafficBrain 交通大脑", "城市交通流量预测与信号灯优化系统", '["Python","PyTorch","GIS","Vue.js"]', "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop"),
    (9,  "BugHunter 漏洞扫描器", "自动化 Web 漏洞扫描工具，支持 SQL 注入和 XSS 检测", '["Python","Selenium","Burp Suite","Go"]', "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&h=400&fit=crop"),
    (10, "PixelQuest 像素冒险", "复古像素风格 Roguelike 冒险游戏，随机生成地牢", '["Godot","GDScript","像素美术","Aseprite"]', "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop"),
    (11, "MedScan AI 影像诊断", "基于深度学习的医学影像辅助诊断系统", '["Python","PyTorch","DICOM","Streamlit"]', "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=400&fit=crop"),
    (12, "FlowBuilder 审批流引擎", "可视化拖拽式审批流程搭建平台", '["低代码","飞书","JavaScript","拖拽"]', "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop"),
    (13, "DriveNet 3D 检测", "基于点云的实时 3D 目标检测网络", '["Python","PyTorch","CUDA","PointCloud"]', "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=400&fit=crop"),
    (14, "LearnPath 自适应学习", "AI 驱动的个性化学习路径推荐系统", '["Python","知识图谱","Neo4j","React"]', "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=400&fit=crop"),
    (15, "TurboProxy 高性能代理", "用 Rust 编写的异步 HTTP/SOCKS5 代理服务器", '["Rust","Tokio","async","网络编程"]', "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=800&h=400&fit=crop"),
    (16, "DreamCanvas AI 画廊", "生成式 AI 艺术创作与展览平台", '["Stable Diffusion","ComfyUI","Python","Gallery"]', "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=400&fit=crop"),
    (17, "SmartWMS 智能仓储", "基于 RFID 和视觉识别的智能仓储管理系统", '["Python","YOLO","RFID","Vue.js"]', "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=400&fit=crop"),
    (18, "EyeNarrator 视觉叙述", "基于 AI 的实时图像描述工具，帮助视障人士理解环境", '["Python","GPT-4V","TTS","Flutter"]', "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop"),
    (19, "K8sShield 集群守护者", "Kubernetes 集群安全审计与策略管理工具", '["Go","Kubernetes","OPA","Helm"]', "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=400&fit=crop"),
    (20, "MazeRunner 迷宫导航", "基于 SLAM 的机器人自主迷宫导航与地图构建", '["ROS2","Python","LiDAR","SLAM"]', "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop"),
    (21, "QuantumOpt 量子优化", "量子退火算法求解组合优化问题的实验平台", '["Qiskit","Python","QAOA","量子电路"]', "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop"),
    (22, "LiveBuy 直播带货助手", "AI 驱动的直播间实时商品推荐与弹幕互动系统", '["Python","WebSocket","推荐算法","React"]', "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop"),
    (23, "CodeLens 代码分析器", "VS Code 插件：AI 驱动的代码复杂度分析与重构建议", '["TypeScript","VS Code API","AST","AI"]', "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop"),
    (24, "UltraStream 超低延迟", "基于 WebTransport 的超低延迟直播方案", '["WebTransport","Rust","QUIC","WebCodecs"]', "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=400&fit=crop"),
]


def _seed_aura_admin(session: Session):
    """Create aura admin user, enroll in all hackathons, create teams & submissions."""

    existing = session.exec(select(User).where(User.email == "admin@aura.com")).first()
    if existing:
        print("Aura admin already exists. Skipping.")
        return

    aura = User(
        email="admin@aura.com",
        full_name="Aura Admin",
        nickname="Aura Admin",
        hashed_password=pwd_context.hash("admin123"),
        is_active=True,
        is_superuser=True,
    )
    session.add(aura)
    session.flush()
    print(f"  Created aura admin (id={aura.id})")

    hackathons = session.exec(select(Hackathon)).all()
    sub_lookup = {s[0]: s for s in SUBMISSION_DATA}

    for hackathon in hackathons:
        hid = hackathon.id
        created_at = hackathon.created_at or datetime.utcnow()

        # Enroll
        session.add(Enrollment(
            user_id=aura.id, hackathon_id=hid,
            status=EnrollmentStatus.APPROVED, joined_at=created_at,
        ))

        # Organizer
        session.add(HackathonOrganizer(
            hackathon_id=hid, user_id=aura.id,
            role=OrganizerRole.OWNER, status=OrganizerStatus.ACCEPTED,
            created_at=created_at, updated_at=created_at,
        ))

        team_id = None
        if hackathon.registration_type == RegistrationType.TEAM:
            team = Team(
                hackathon_id=hid, name="Aura 战队",
                description="管理员的个人战队",
                looking_for="欢迎各路大神加入",
                leader_id=aura.id, created_at=created_at,
            )
            session.add(team)
            session.flush()
            team_id = team.id

            session.add(TeamMember(
                team_id=team.id, user_id=aura.id, joined_at=created_at,
            ))

        # Submission
        if hid in sub_lookup:
            _, title, desc, tech, cover = sub_lookup[hid]
            session.add(Submission(
                title=title, description=desc,
                tech_stack=tech, cover_image=cover,
                demo_url=f"https://demo.example.com/{hid}",
                repo_url=f"https://github.com/aura-admin/project-{hid}",
                hackathon_id=hid,
                team_id=team_id,
                user_id=aura.id if not team_id else None,
                status=SubmissionStatus.SUBMITTED,
                created_at=created_at,
            ))

    session.commit()
    print(f"  Enrolled in {len(hackathons)} hackathons with submissions")
    print("Done!")


if __name__ == "__main__":
    seed()
