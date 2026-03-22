"""
Seed script: populates the database with 5 sample hackathons and related data.

Usage:
    cd backend
    .venv/bin/python3 scripts/seed_hackathons.py

Idempotent — skips seeding if hackathons already exist.
"""

import sys
import os
import json
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
from app.core.config import settings

import random

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

EMPTY_PROFILE_USER = {
    "email": "empty@aura.com",
    "password": "empty123",
    "full_name": "新朋友",
    "nickname": "新朋友",
    "city": "上海",
    "bio": "刚加入 Aura，准备寻找第一场黑客松。",
}


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
]


def seed():
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "", 1)
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        print(f"Using database: {db_path}")
    else:
        print(f"Using database URL: {db_url}")

    engine = create_engine(db_url)

    # Ensure tables exist
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Check if data already exists
        existing = session.exec(select(Hackathon)).first()
        if existing:
            print(f"Database already has hackathon data (found: {existing.title}). Skipping seed.")
            _ensure_empty_profile_user(session)
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
        _ensure_empty_profile_user(session)


def _ensure_empty_profile_user(session: Session):
    """Ensure a demo user exists with no enrollments or organized hackathons."""

    user = session.exec(
        select(User).where(User.email == EMPTY_PROFILE_USER["email"])
    ).first()

    if user:
        user.hashed_password = pwd_context.hash(EMPTY_PROFILE_USER["password"])
        user.is_active = True
        user.is_superuser = False
        user.full_name = EMPTY_PROFILE_USER["full_name"]
        user.nickname = EMPTY_PROFILE_USER["nickname"]
        user.city = EMPTY_PROFILE_USER["city"]
        user.bio = EMPTY_PROFILE_USER["bio"]
        session.add(user)
        session.commit()
        print(
            f"  Empty profile demo user already exists: "
            f"{EMPTY_PROFILE_USER['email']} / {EMPTY_PROFILE_USER['password']}"
        )
        return

    user = User(
        email=EMPTY_PROFILE_USER["email"],
        full_name=EMPTY_PROFILE_USER["full_name"],
        nickname=EMPTY_PROFILE_USER["nickname"],
        hashed_password=pwd_context.hash(EMPTY_PROFILE_USER["password"]),
        is_active=True,
        is_superuser=False,
        city=EMPTY_PROFILE_USER["city"],
        bio=EMPTY_PROFILE_USER["bio"],
    )
    session.add(user)
    session.commit()
    print(
        f"  Created empty profile demo user: "
        f"{EMPTY_PROFILE_USER['email']} / {EMPTY_PROFILE_USER['password']}"
    )


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
                    recruitment_roles=json.dumps([
                        {"role": r, "skills": s, "description": d}
                        for r, s, d in [RECRUIT_ROLES[team_counter % len(RECRUIT_ROLES)]]
                    ]) if random.random() < 0.5 else None,
                    recruitment_status="open" if random.random() < 0.5 else "closed",
                    leader_id=leader, created_at=joined,
                )
                session.add(team)
                session.flush()

                for uid in team_members:
                    session.add(TeamMember(
                        team_id=team.id, user_id=uid, joined_at=joined,
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
