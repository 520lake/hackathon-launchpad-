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
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/insights")
def get_community_insights(
    hackathon_id: int,
    session: Session = Depends(get_session)
):
    # 1. Hot Topics (Mocked based on post titles or real aggregation)
    # In a real scenario, we would use NLP to extract keywords from post content
    hot_topics = [
        {"text": "AI Models", "value": 45},
        {"text": "Team Formation", "value": 30},
        {"text": "Dataset", "value": 25},
        {"text": "Deployment", "value": 20},
        {"text": "GPU", "value": 15},
        {"text": "Frontend", "value": 10},
    ]

    # 2. Skill Distribution (Aggregated from enrolled users)
    # Joining Enrollment and User tables would be ideal here
    # For now, we mock it to guarantee data for visualization
    skill_distribution = [
        {"name": "Python", "count": 35},
        {"name": "React", "count": 20},
        {"name": "Design", "count": 15},
        {"name": "Product", "count": 10},
        {"name": "Marketing", "count": 5},
    ]

    # 3. Activity Trend (Posts per day for the last 7 days)
    activity_trend = []
    today = datetime.now().date()
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        # Randomize for demo effect
        count = random.randint(2, 15)
        activity_trend.append({"date": date.strftime("%m-%d"), "count": count})

    # 4. Participant Portraits (AI Summary)
    participant_portraits = [
        "Most participants are full-stack developers interested in GenAI.",
        "High interest in healthcare and finance domains.",
        "30% of teams are looking for a designer."
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
