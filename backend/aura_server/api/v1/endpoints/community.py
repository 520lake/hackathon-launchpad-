from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from aura_server.db.session import get_session
from aura_server.api.deps import get_current_user
from aura_server.models.user import User
from aura_server.models.community import CommunityPost, CommunityComment, CommunityPostBase, CommunityCommentBase
from aura_server.models.enrollment import Enrollment
import requests
import random
import json
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/insights")
def get_community_insights(
    hackathon_id: int,
    session: Session = Depends(get_session)
):
    # 1. Hot Topics (Aggregated from real post titles)
    posts = session.exec(
        select(CommunityPost).where(CommunityPost.hackathon_id == hackathon_id)
    ).all()
    
    topic_map = {}
    for p in posts:
        # Simple keyword extraction from titles
        words = p.title.split()
        for w in words:
            if len(w) > 3:
                topic_map[w] = topic_map.get(w, 0) + 1
    
    hot_topics = [{"text": k, "value": v * 10} for k, v in sorted(topic_map.items(), key=lambda x: x[1], reverse=True)[:6]]
    if not hot_topics:
        hot_topics = [
            {"text": "AI Models", "value": 45},
            {"text": "Team Formation", "value": 30},
            {"text": "Dataset", "value": 25},
        ]

    # 2. Skill Distribution (Aggregated from real enrolled users)
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.hackathon_id == hackathon_id)
    ).all()
    user_ids = [e.user_id for e in enrollments]
    users = session.exec(
        select(User).where(User.id.in_(user_ids))
    ).all() if user_ids else []
    
    skill_map = {}
    for u in users:
        if u.skills:
            # skills is stored as a string, might be comma-separated or JSON
            try:
                # Try JSON first
                skills_list = json.loads(u.skills)
                if isinstance(skills_list, list):
                    for s in skills_list:
                        skill_map[s] = skill_map.get(s, 0) + 1
                else:
                    skill_map[u.skills] = skill_map.get(u.skills, 0) + 1
            except:
                # Fallback to comma-separated
                skills_list = [s.strip() for s in u.skills.split(',')]
                for s in skills_list:
                    if s:
                        skill_map[s] = skill_map.get(s, 0) + 1
    
    skill_distribution = [{"name": k, "count": v} for k, v in sorted(skill_map.items(), key=lambda x: x[1], reverse=True)[:5]]
    if not skill_distribution:
        skill_distribution = [
            {"name": "Python", "count": 35},
            {"name": "React", "count": 20},
            {"name": "Design", "count": 15},
        ]

    # 3. Activity Trend (Real posts per day for the last 7 days)
    activity_trend = []
    today = datetime.now().date()
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        start_dt = datetime.combine(date, datetime.min.time())
        end_dt = datetime.combine(date, datetime.max.time())
        
        count = session.exec(
            select(CommunityPost)
            .where(CommunityPost.hackathon_id == hackathon_id)
            .where(CommunityPost.created_at >= start_dt)
            .where(CommunityPost.created_at <= end_dt)
        ).all()
        activity_trend.append({"date": date.strftime("%m-%d"), "count": len(count)})

    # 4. Participant Portraits (AI Summary)
    # These will be enriched by AI if requested, for now we provide a base summary from skills
    top_skills = [s["name"] for s in skill_distribution[:3]]
    
    # Check if there's real data
    if len(users) > 0:
        participant_portraits = [
            f"社区规模正在扩大，目前已有 {len(users)} 位参赛者加入。",
            f"核心技能栈涵盖了 {', '.join(top_skills)} 等热门领域。" if top_skills else "正在等待更多拥有多元背景的参赛者加入。",
            f"社区氛围活跃，已发起 {len(posts)} 场深度技术讨论。"
        ]
    else:
        # Better mock data for empty state
        participant_portraits = [
            "黑客松火热报名中，虚位以待。",
            "期待看到更多关于 AI、Web3 和可持续发展的创新想法。",
            "加入社区，寻找志同道合的队友，共同开启创新之旅。"
        ]

    return {
        "hot_topics": hot_topics,
        "skill_distribution": skill_distribution,
        "activity_trend": activity_trend,
        "participant_portraits": participant_portraits
    }

@router.get("/posts", response_model=List[CommunityPost])
def read_posts(
    hackathon_id: int,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100
):
    posts = session.exec(
        select(CommunityPost)
        .where(CommunityPost.hackathon_id == hackathon_id)
        .offset(skip)
        .limit(limit)
        .order_by(CommunityPost.created_at.desc())
    ).all()
    return posts

@router.post("/posts", response_model=CommunityPost)
def create_post(
    post: CommunityPostBase,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_post = CommunityPost.from_orm(post)
    db_post.author_id = current_user.id
    session.add(db_post)
    session.commit()
    session.refresh(db_post)
    return db_post

@router.post("/posts/{post_id}/comments", response_model=CommunityComment)
def create_comment(
    post_id: int,
    comment: CommunityCommentBase,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_comment = CommunityComment.from_orm(comment)
    db_comment.post_id = post_id
    db_comment.author_id = current_user.id
    session.add(db_comment)
    session.commit()
    session.refresh(db_comment)
    return db_comment

@router.post("/posts/{post_id}/like", response_model=CommunityPost)
def like_post(
    post_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    post = session.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Ideally we should track likes in a separate table to prevent double liking
    # For now, just increment
    post.likes += 1
    session.add(post)
    session.commit()
    session.refresh(post)
    return post

@router.get("/posts/{post_id}/comments", response_model=List[CommunityComment])
def read_comments(
    post_id: int,
    session: Session = Depends(get_session)
):
    comments = session.exec(
        select(CommunityComment)
        .where(CommunityComment.post_id == post_id)
        .order_by(CommunityComment.created_at)
    ).all()
    return comments

@router.post("/generate")
def generate_community_content(
    hackathon_id: int,
    topic_type: str = "discussion",
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # This would ideally call the AI service
    # For now, we'll create a mock AI generated post
    
    # Check for existing posts to avoid duplicates if needed
    
    titles = {
        "discussion": ["How to get started with this hackathon?", "Best tools for this theme"],
        "question": ["Looking for teammates", "Clarification on rules"],
        "sharing": ["My previous project experience", "Useful resources list"]
    }
    
    import random
    selected_title = random.choice(titles.get(topic_type, titles["discussion"]))
    
    content = f"This is an AI generated {topic_type} to spark conversation about {selected_title}."
    
    post = CommunityPost(
        title=selected_title,
        content=content,
        type=topic_type,
        hackathon_id=hackathon_id,
        author_id=current_user.id
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    return post
