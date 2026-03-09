from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from app.api import deps
from app.db.session import get_session
from app.models.notification import Notification, NotificationCreate, NotificationRead, NotificationCount
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[NotificationRead])
def read_notifications(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = Query(None, description="Filter by category: activity, system, promotion, general"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
):
    query = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    
    if category:
        query = query.where(Notification.category == category)
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    
    notifications = session.exec(
        query.offset(skip).limit(limit)
    ).all()
    return notifications

@router.get("/unread-count", response_model=NotificationCount)
def get_unread_count(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
    category: Optional[str] = Query(None, description="Filter by category"),
):
    query = select(Notification).where(
        Notification.user_id == current_user.id, 
        Notification.is_read == False
    )
    
    if category:
        query = query.where(Notification.category == category)
    
    count = len(session.exec(query).all())
    return {"unread_count": count}

@router.post("", response_model=NotificationRead)
def create_notification(
    *,
    session: Session = Depends(get_session),
    notification_in: NotificationCreate,
    current_user: User = Depends(deps.get_current_user),
):
    notification = Notification(
        user_id=current_user.id,
        title=notification_in.title,
        content=notification_in.content,
        type=notification_in.type,
        category=notification_in.category,
        data=notification_in.data
    )
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification

@router.post("/{notification_id}/read")
def mark_as_read(
    *,
    session: Session = Depends(get_session),
    notification_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification.is_read = True
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification

@router.post("/read-all")
def mark_all_as_read(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
    category: Optional[str] = Query(None, description="Mark all as read for specific category"),
):
    query = select(Notification).where(
        Notification.user_id == current_user.id, 
        Notification.is_read == False
    )
    
    if category:
        query = query.where(Notification.category == category)
    
    notifications = session.exec(query).all()
    
    for notification in notifications:
        notification.is_read = True
        session.add(notification)
    
    session.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
def delete_notification(
    *,
    session: Session = Depends(get_session),
    notification_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(notification)
    session.commit()
    return {"message": "Notification deleted"}
