from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from typing import List
from datetime import datetime

from app.api import deps
from app.db.session import get_session
from app.models.discussion import (
    Discussion, DiscussionCreate, DiscussionUpdate, DiscussionRead,
    DiscussionReply, DiscussionReplyCreate, DiscussionReplyRead
)
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()

@router.get("", response_model=List[DiscussionRead])
def list_discussions(
    *,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 20,
    tag: str = None,
):
    """获取讨论列表"""
    query = select(Discussion).order_by(Discussion.is_pinned.desc(), Discussion.created_at.desc())
    
    if tag:
        query = query.where(Discussion.tags.contains(tag))
    
    discussions = session.exec(query.offset(skip).limit(limit)).all()
    
    result = []
    for d in discussions:
        # Get replies count
        replies_count = session.exec(
            select(func.count(DiscussionReply.id)).where(DiscussionReply.discussion_id == d.id)
        ).one()
        
        # Get author info
        author = session.get(User, d.author_id)
        
        result.append(DiscussionRead(
            **d.model_dump(),
            author_name=author.nickname or author.full_name if author else None,
            author_avatar=author.avatar_url if author else None,
            replies_count=replies_count
        ))
    
    return result

@router.post("", response_model=DiscussionRead)
def create_discussion(
    *,
    session: Session = Depends(get_session),
    discussion_in: DiscussionCreate,
    current_user: User = Depends(deps.get_current_user),
):
    """创建新讨论"""
    discussion = Discussion(
        title=discussion_in.title,
        content=discussion_in.content,
        tags=",".join(discussion_in.tags) if discussion_in.tags else None,
        author_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    session.add(discussion)
    session.commit()
    session.refresh(discussion)
    
    return DiscussionRead(
        **discussion.model_dump(),
        author_name=current_user.nickname or current_user.full_name,
        author_avatar=current_user.avatar_url,
        replies_count=0
    )

@router.get("/{discussion_id}", response_model=DiscussionRead)
def get_discussion(
    *,
    session: Session = Depends(get_session),
    discussion_id: int,
):
    """获取单个讨论详情"""
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    # Increment views
    discussion.views += 1
    session.add(discussion)
    session.commit()
    
    # Get replies count
    replies_count = session.exec(
        select(func.count(DiscussionReply.id)).where(DiscussionReply.discussion_id == discussion.id)
    ).one()
    
    # Get author info
    author = session.get(User, discussion.author_id)
    
    return DiscussionRead(
        **discussion.model_dump(),
        author_name=author.nickname or author.full_name if author else None,
        author_avatar=author.avatar_url if author else None,
        replies_count=replies_count
    )

@router.put("/{discussion_id}", response_model=DiscussionRead)
def update_discussion(
    *,
    session: Session = Depends(get_session),
    discussion_id: int,
    discussion_in: DiscussionUpdate,
    current_user: User = Depends(deps.get_current_user),
):
    """更新讨论"""
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    if discussion.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = discussion_in.model_dump(exclude_unset=True)
    if "tags" in update_data and update_data["tags"]:
        update_data["tags"] = ",".join(update_data["tags"])
    
    for key, value in update_data.items():
        setattr(discussion, key, value)
    
    discussion.updated_at = datetime.utcnow()
    session.add(discussion)
    session.commit()
    session.refresh(discussion)
    
    # Get replies count
    replies_count = session.exec(
        select(func.count(DiscussionReply.id)).where(DiscussionReply.discussion_id == discussion.id)
    ).one()
    
    # Get author info
    author = session.get(User, discussion.author_id)
    
    return DiscussionRead(
        **discussion.model_dump(),
        author_name=author.nickname or author.full_name if author else None,
        author_avatar=author.avatar_url if author else None,
        replies_count=replies_count
    )

@router.delete("/{discussion_id}")
def delete_discussion(
    *,
    session: Session = Depends(get_session),
    discussion_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """删除讨论"""
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    if discussion.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete all replies first
    replies = session.exec(
        select(DiscussionReply).where(DiscussionReply.discussion_id == discussion_id)
    ).all()
    for reply in replies:
        session.delete(reply)
    
    session.delete(discussion)
    session.commit()
    
    return {"message": "Discussion deleted successfully"}

@router.get("/{discussion_id}/replies", response_model=List[DiscussionReplyRead])
def list_replies(
    *,
    session: Session = Depends(get_session),
    discussion_id: int,
    skip: int = 0,
    limit: int = 50,
):
    """获取讨论的回复列表"""
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    replies = session.exec(
        select(DiscussionReply)
        .where(DiscussionReply.discussion_id == discussion_id)
        .order_by(DiscussionReply.created_at.asc())
        .offset(skip)
        .limit(limit)
    ).all()
    
    result = []
    for reply in replies:
        author = session.get(User, reply.author_id)
        result.append(DiscussionReplyRead(
            **reply.model_dump(),
            author_name=author.nickname or author.full_name if author else None,
            author_avatar=author.avatar_url if author else None
        ))
    
    return result

@router.post("/{discussion_id}/replies", response_model=DiscussionReplyRead)
def create_reply(
    *,
    session: Session = Depends(get_session),
    discussion_id: int,
    reply_in: DiscussionReplyCreate,
    current_user: User = Depends(deps.get_current_user),
):
    """创建回复"""
    discussion = session.get(Discussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    reply = DiscussionReply(
        discussion_id=discussion_id,
        author_id=current_user.id,
        content=reply_in.content,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    session.add(reply)
    session.commit()
    session.refresh(reply)
    
    # Update discussion updated_at
    discussion.updated_at = datetime.utcnow()
    session.add(discussion)
    session.commit()
    
    # 发送通知给帖子作者（如果不是自己回复自己）
    if discussion.author_id != current_user.id:
        author = session.get(User, discussion.author_id)
        if author:
            notification = Notification(
                user_id=discussion.author_id,
                title="收到新评论",
                content=f"{current_user.nickname or current_user.full_name} 回复了你的帖子「{discussion.title[:20]}...」",
                type="info",
                category="activity",
                data=f'{{"discussion_id": {discussion_id}, "reply_id": {reply.id}}}'
            )
            session.add(notification)
            session.commit()
    
    return DiscussionReplyRead(
        **reply.model_dump(),
        author_name=current_user.nickname or current_user.full_name,
        author_avatar=current_user.avatar_url
    )
