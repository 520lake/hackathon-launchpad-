import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import create_engine, Session, select
from app.models.user import User
from app.models.hackathon import Hackathon, HackathonStatus, HackathonFormat, RegistrationType
from app.core.config import settings

def create_sample_hackathons():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_path = os.path.join(project_root, "vibebuild.db")
    db_url = f"sqlite:///{db_path}"
    
    print(f"Using database: {db_path}")
    
    engine = create_engine(db_url)
    
    with Session(engine) as session:
        print("Creating sample hackathons...")
        
        admin = session.exec(select(User).where(User.email == "admin@aura.com")).first()
        if not admin:
            admin = session.exec(select(User)).first()
            if not admin:
                print("No users found. Please create a user first.")
                return

        hackathons_data = [
            {
                "title": "AI 创新黑客松 2026",
                "subtitle": "探索人工智能的无限可能",
                "description": "探索人工智能的无限可能，与全球开发者一起创造未来。我们寻找最具创新性的 AI 应用解决方案，包括但不限于：自然语言处理、计算机视觉、智能推荐、AI Agent 等方向。",
                "start_date": datetime.utcnow() + timedelta(days=15),
                "end_date": datetime.utcnow() + timedelta(days=30),
                "registration_start_date": datetime.utcnow(),
                "registration_end_date": datetime.utcnow() + timedelta(days=14),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.ONLINE,
                "location": "线上",
                "organizer_name": "Aurathon 官方",
                "organizer_id": admin.id,
                "theme_tags": "AI,机器学习,深度学习,创新赛",
                "professionalism_tags": "Python,TensorFlow,PyTorch",
                "awards_detail": "一等奖: ¥10万 + GPU算力支持\n二等奖: ¥5万 + 云服务器\n三等奖: ¥2万 + 技术支持",
                "cover_image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2070"
            },
            {
                "title": "Web3 开发者挑战赛",
                "subtitle": "构建去中心化未来",
                "description": "聚焦区块链、DeFi、NFT 等前沿技术，连接开发者与资本，打造下一代 Web3 应用。本次比赛将邀请顶级投资机构参与评审，优秀项目有机会获得投资。",
                "start_date": datetime.utcnow() + timedelta(days=30),
                "end_date": datetime.utcnow() + timedelta(days=45),
                "registration_start_date": datetime.utcnow() + timedelta(days=5),
                "registration_end_date": datetime.utcnow() + timedelta(days=28),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.ONLINE,
                "location": "线上",
                "organizer_name": "Blockchain Labs",
                "organizer_id": admin.id,
                "theme_tags": "Web3,区块链,DeFi,NFT",
                "professionalism_tags": "Solidity,Ethereum,Solana",
                "awards_detail": "冠军: ¥20万 + 代币激励\n亚军: ¥10万 + 孵化支持\n季军: ¥5万 + 社区推广",
                "cover_image": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2070"
            },
            {
                "title": "智能医疗创新大赛",
                "subtitle": "科技赋能健康",
                "description": "创新医疗科技解决方案，涵盖远程医疗、智能诊断、健康管理等方向。与顶级医疗机构合作，将创意转化为实际应用。",
                "start_date": datetime.utcnow() - timedelta(days=5),
                "end_date": datetime.utcnow() + timedelta(days=10),
                "registration_start_date": datetime.utcnow() - timedelta(days=20),
                "registration_end_date": datetime.utcnow() - timedelta(days=7),
                "status": HackathonStatus.ONGOING,
                "format": HackathonFormat.OFFLINE,
                "location": "上海市浦东新区",
                "organizer_name": "健康科技创新联盟",
                "organizer_id": admin.id,
                "theme_tags": "医疗,健康,智能诊断,远程医疗",
                "professionalism_tags": "Python,医学影像,数据分析",
                "awards_detail": "一等奖: ¥15万 + 医院合作机会\n二等奖: ¥8万 + 导师指导\n三等奖: ¥3万 + 实习机会",
                "cover_image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070"
            },
            {
                "title": "绿色能源黑客松",
                "subtitle": "可持续发展的未来",
                "description": "开发可持续能源解决方案，包括智能电网、碳足迹追踪、能源优化等。为碳中和目标贡献技术力量。",
                "start_date": datetime.utcnow() - timedelta(days=30),
                "end_date": datetime.utcnow() - timedelta(days=15),
                "registration_start_date": datetime.utcnow() - timedelta(days=50),
                "registration_end_date": datetime.utcnow() - timedelta(days=35),
                "status": HackathonStatus.ENDED,
                "format": HackathonFormat.OFFLINE,
                "location": "深圳市南山区",
                "organizer_name": "绿色科技基金会",
                "organizer_id": admin.id,
                "theme_tags": "能源,环保,可持续发展,碳中和",
                "professionalism_tags": "IoT,数据分析,智能硬件",
                "awards_detail": "冠军: ¥20万 + 项目孵化\n亚军: ¥10万 + 技术支持\n季军: ¥5万",
                "cover_image": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=2070"
            },
            {
                "title": "教育科技创新赛",
                "subtitle": "重塑学习体验",
                "description": "利用技术改变教育方式，包括在线学习平台、游戏化教育、AI 辅导等方向。让优质教育触手可及。",
                "start_date": datetime.utcnow() + timedelta(days=60),
                "end_date": datetime.utcnow() + timedelta(days=62),
                "registration_start_date": datetime.utcnow() + timedelta(days=30),
                "registration_end_date": datetime.utcnow() + timedelta(days=55),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.ONLINE,
                "location": "线上",
                "organizer_name": "教育创新实验室",
                "organizer_id": admin.id,
                "theme_tags": "教育,在线学习,游戏化,AI教育",
                "professionalism_tags": "React,Node.js,Unity",
                "awards_detail": "一等奖: ¥10万 + 教育机构合作\n二等奖: ¥5万 + 产品推广\n三等奖: ¥2万",
                "cover_image": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=2022"
            },
            {
                "title": "金融科技创新峰会",
                "subtitle": "数字化金融未来",
                "description": "探索金融科技前沿，涵盖数字支付、智能投顾、风险管理等方向。与顶级金融机构合作，打造下一代金融产品。",
                "start_date": datetime.utcnow() + timedelta(days=10),
                "end_date": datetime.utcnow() + timedelta(days=12),
                "registration_start_date": datetime.utcnow() + timedelta(days=2),
                "registration_end_date": datetime.utcnow() + timedelta(days=8),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.OFFLINE,
                "location": "北京市朝阳区",
                "organizer_name": "金融科技联盟",
                "organizer_id": admin.id,
                "theme_tags": "金融科技,支付,投资,风控",
                "professionalism_tags": "Java,Spring,微服务",
                "awards_detail": "冠军: ¥30万 + 投资对接\n亚军: ¥15万 + 银行合作\n季军: ¥8万 + 导师指导",
                "cover_image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070"
            },
            {
                "title": "元宇宙开发者大赛",
                "subtitle": "构建虚拟新世界",
                "description": "探索元宇宙技术，包括 VR/AR 应用、虚拟社交、数字孪生等方向。创造沉浸式体验，定义未来交互方式。",
                "start_date": datetime.utcnow() + timedelta(days=45),
                "end_date": datetime.utcnow() + timedelta(days=60),
                "registration_start_date": datetime.utcnow() + timedelta(days=15),
                "registration_end_date": datetime.utcnow() + timedelta(days=40),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.ONLINE,
                "location": "线上 + 上海",
                "organizer_name": "元宇宙创新中心",
                "organizer_id": admin.id,
                "theme_tags": "元宇宙,VR,AR,虚拟社交",
                "professionalism_tags": "Unity,Unreal,WebXR",
                "awards_detail": "一等奖: ¥25万 + 设备支持\n二等奖: ¥12万 + 云服务\n三等奖: ¥6万 + 技术培训",
                "cover_image": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=2070"
            },
            {
                "title": "物联网创新挑战赛",
                "subtitle": "万物互联新时代",
                "description": "开发物联网解决方案，涵盖智能家居、工业物联网、智慧城市等方向。连接物理世界与数字世界。",
                "start_date": datetime.utcnow() - timedelta(days=2),
                "end_date": datetime.utcnow() + timedelta(days=5),
                "registration_start_date": datetime.utcnow() - timedelta(days=15),
                "registration_end_date": datetime.utcnow() - timedelta(days=5),
                "status": HackathonStatus.ONGOING,
                "format": HackathonFormat.OFFLINE,
                "location": "杭州市西湖区",
                "organizer_name": "物联网产业联盟",
                "organizer_id": admin.id,
                "theme_tags": "物联网,智能家居,智慧城市,工业4.0",
                "professionalism_tags": "嵌入式,C++,MQTT",
                "awards_detail": "冠军: ¥15万 + 产业对接\n亚军: ¥8万 + 硬件支持\n季军: ¥4万 + 培训机会",
                "cover_image": "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=2070"
            }
        ]

        count = 0
        for h_data in hackathons_data:
            existing = session.exec(select(Hackathon).where(Hackathon.title == h_data["title"])).first()
            if not existing:
                hackathon = Hackathon(**h_data)
                session.add(hackathon)
                count += 1
                print(f"  + {h_data['title']}")
        
        session.commit()
        print(f"\nSuccessfully added {count} new hackathons!")

if __name__ == "__main__":
    create_sample_hackathons()
