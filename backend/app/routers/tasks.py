"""
Tasks router — kanban-style task management.
"""
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.schemas import TaskCreate, TaskOut, TaskUpdate, MessageResponse
from .auth import get_current_user_id as require_auth
from app.events import fire_event, EVENT_TASK_COMPLETED

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=List[TaskOut])
def list_tasks(
    user_id: str = Depends(require_auth),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: str = None,
    deal_id: str = None,
    db: Session = Depends(get_db),
):
    q = db.query(Task).filter(Task.user_id == user_id)
    if status:
        q = q.filter(Task.status == status)
    if deal_id:
        q = q.filter(Task.deal_id == deal_id)
    return q.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=TaskOut, status_code=201)
def create_task(body: TaskCreate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    task = Task(user_id=user_id, **body.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(task_id: str, body: TaskUpdate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(task, key, val)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(task_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "done"
    task.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    # Fire event for Viktor
    fire_event(EVENT_TASK_COMPLETED, {
        "task_id": task.id,
        "title": task.title,
        "deal_id": task.deal_id,
        "contact_id": task.contact_id,
        "user_id": user_id,
    })
    return task


@router.delete("/{task_id}", response_model=MessageResponse)
def delete_task(task_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return MessageResponse(message="Task deleted")