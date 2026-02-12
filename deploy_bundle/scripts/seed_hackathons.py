import os
import sys
import json
from datetime import datetime, timedelta
from sqlmodel import Session, select, delete

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from aura_server.core.config import settings
from aura_server.db.session import engine
from aura_server.models.hackathon import Hackathon, HackathonStatus, RegistrationType, HackathonFormat
from aura_server.models.user import User

def seed_hackathons():
    print("Seeding hackathon data...")
    with Session(engine) as session:
        # Check if admin exists (needed for organizer_id)
        admin = session.exec(select(User).where(User.email == "admin@aura.com")).first()
        if not admin:
            print("Admin user not found! Creating default admin...")
            # Ideally we should run initial_data.py, but let's just pick the first user or create one
            admin = session.exec(select(User)).first()
            if not admin:
                print("No users found. Please register a user first.")
                return

        # Optional: Clear existing hackathons to ensure clean state for testing
        # session.exec(delete(Hackathon))
        # session.commit()
        # print("Cleared existing hackathons.")
        
        now = datetime.utcnow()
        
        # Helper to create hackathon
        def create_hackathon(title, status, reg_start_delta, reg_end_delta, act_start_delta, act_end_delta, tags, desc="Demo Hackathon"):
            h = Hackathon(
                title=title,
                subtitle=f"{status} - {title}",
                description=desc,
                cover_image="https://img.alicdn.com/imgextra/i4/O1CN01Z5PaLz1O793rLwB_!!6000000001644-0-tps-1024-1024.jpg",
                theme_tags=tags,
                professionalism_tags="Intermediate",
                registration_type=RegistrationType.TEAM,
                format=HackathonFormat.ONLINE,
                organizer_id=admin.id,
                organizer_name="Aura Foundation",
                
                registration_start_date=now + timedelta(days=reg_start_delta),
                registration_end_date=now + timedelta(days=reg_end_delta),
                start_date=now + timedelta(days=act_start_delta),
                end_date=now + timedelta(days=act_end_delta),
                
                # Submission/Judging dates inferred
                submission_start_date=now + timedelta(days=act_start_delta),
                submission_end_date=now + timedelta(days=act_end_delta - 1),
                judging_start_date=now + timedelta(days=act_end_delta - 1),
                judging_end_date=now + timedelta(days=act_end_delta),
                
                status=HackathonStatus.PUBLISHED, # Default to published, frontend calculates actual status
                max_participants=100,
                
                contact_info=json.dumps({"text": "contact@aura.com", "image": ""}),
                awards_detail=json.dumps([{"title": "Gold", "count": 1, "reward": "$1000"}]),
                scoring_dimensions=json.dumps([{"name": "Tech", "weight": 1.0, "description": "Tech"}])
            )
            
            # Adjust explicit status enum if needed (though frontend logic should handle it)
            if "已结束" in status:
                h.status = HackathonStatus.ENDED
            elif "进行中" in status:
                h.status = HackathonStatus.ONGOING
            
            session.add(h)
            return h

        hackathons = []

        # 1. 报名中 | 立即报名 | 报名已开始，还剩7天截止
        # Reg Start: -2 days, Reg End: +7 days, Act Start: +10 days, Act End: +20 days
        hackathons.append(create_hackathon("AI创新大赛2024", "报名中", -2, 7, 10, 20, "AI,Innovation"))

        # 2. 黑客松春季赛 | 报名中 | 立即报名 | 报名已开始，还剩3天截止
        # Reg Start: -5 days, Reg End: +3 days, Act Start: +5 days, Act End: +15 days
        hackathons.append(create_hackathon("黑客松春季赛", "报名中", -5, 3, 5, 15, "Hackathon,Spring"))

        # 3. 数据挖掘挑战赛 | 报名中 | 立即报名 | 报名已开始，今天截止
        # Reg Start: -10 days, Reg End: 0.5 (12 hours left), Act Start: +2 days, Act End: +12 days
        hackathons.append(create_hackathon("数据挖掘挑战赛", "报名中", -10, 0.5, 2, 12, "Data,Mining"))

        # 4. 暑期编程营 | 即将开始 | 报名未开始 | 报名3天后开始，持续5天
        # Reg Start: +3 days, Reg End: +8 days, Act Start: +10 days, Act End: +20 days
        hackathons.append(create_hackathon("暑期编程营", "即将开始", 3, 8, 10, 20, "Coding,Summer"))

        # 5. 秋季算法赛 | 即将开始 | 报名未开始 | 报名1周后开始
        # Reg Start: +7 days, Reg End: +14 days, Act Start: +15 days, Act End: +25 days
        hackathons.append(create_hackathon("秋季算法赛", "即将开始", 7, 14, 15, 25, "Algorithm,Fall"))

        # 6. 冬季AI峰会 | 即将开始 | 报名未开始 | 报名2周后开始
        # Reg Start: +14 days, Reg End: +21 days, Act Start: +22 days, Act End: +30 days
        hackathons.append(create_hackathon("冬季AI峰会", "即将开始", 14, 21, 22, 30, "AI,Summit"))

        # 7. 前端开发大赛 | 进行中 | 活动进行中，报名已截止 | 报名已结束，活动已开始，还剩10天
        # Reg Start: -20 days, Reg End: -5 days, Act Start: -2 days, Act End: +10 days
        hackathons.append(create_hackathon("前端开发大赛", "进行中", -20, -5, -2, 10, "Frontend,Web"))

        # 8. 区块链应用赛 | 进行中 | 活动进行中，报名已截止 | 报名已结束，活动已开始，还剩5天
        # Reg Start: -20 days, Reg End: -10 days, Act Start: -5 days, Act End: +5 days
        hackathons.append(create_hackathon("区块链应用赛", "进行中", -20, -10, -5, 5, "Blockchain,Web3"))

        # 9. 云计算挑战赛 | 进行中 | 活动进行中，报名已截止 | 报名已结束，活动已开始，今天结束
        # Reg Start: -30 days, Reg End: -15 days, Act Start: -10 days, Act End: 0.5, "Cloud,AWS"))
        hackathons.append(create_hackathon("云计算挑战赛", "进行中", -30, -15, -10, 0.5, "Cloud,AWS"))

        # 10. 2023机器学习赛 | 已结束 | 活动已结束 | 全部时间已过
        # Reg Start: -60 days, Reg End: -50 days, Act Start: -40 days, Act End: -30 days
        hackathons.append(create_hackathon("2023机器学习赛", "已结束", -60, -50, -40, -30, "ML,2023"))

        # 11. 旧版编程马拉松 | 已结束 | 活动已结束 | 全部时间已过
        # Reg Start: -100 days, Reg End: -90 days, Act Start: -80 days, Act End: -70 days
        hackathons.append(create_hackathon("旧版编程马拉松", "已结束", -100, -90, -80, -70, "Legacy,Code"))

        # 12. 历史数据竞赛 | 已结束 | 活动已结束 | 全部时间已过
        # Reg Start: -365 days, Reg End: -360 days, Act Start: -350 days, Act End: -340 days
        hackathons.append(create_hackathon("历史数据竞赛", "已结束", -365, -360, -350, -340, "History,Data"))

        session.commit()
        print(f"Successfully seeded {len(hackathons)} hackathons.")

if __name__ == "__main__":
    seed_hackathons()
