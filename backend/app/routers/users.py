from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=schemas.UserProfile)
def me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    snippet_count = db.query(func.count(models.Snippet.id)).filter(
        models.Snippet.author_id == current_user.id
    ).scalar() or 0
    star_count = db.query(func.count(models.Star.id)).join(
        models.Snippet, models.Snippet.id == models.Star.snippet_id
    ).filter(models.Snippet.author_id == current_user.id).scalar() or 0
    return {
        "id": current_user.id,
        "username": current_user.username,
        "avatar_color": current_user.avatar_color,
        "bio": current_user.bio,
        "created_at": current_user.created_at,
        "snippet_count": snippet_count,
        "star_count": star_count,
    }


@router.put("/me", response_model=schemas.UserPublic)
def update_me(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.bio is not None:
        current_user.bio = payload.bio[:1000]
    if payload.avatar_color is not None:
        current_user.avatar_color = payload.avatar_color
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{username}", response_model=schemas.UserProfile)
def get_user(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(404, "User not found")
    snippet_count = db.query(func.count(models.Snippet.id)).filter(
        models.Snippet.author_id == user.id, models.Snippet.is_public == True
    ).scalar() or 0
    star_count = db.query(func.count(models.Star.id)).join(
        models.Snippet, models.Snippet.id == models.Star.snippet_id
    ).filter(models.Snippet.author_id == user.id).scalar() or 0
    return {
        "id": user.id,
        "username": user.username,
        "avatar_color": user.avatar_color,
        "bio": user.bio,
        "created_at": user.created_at,
        "snippet_count": snippet_count,
        "star_count": star_count,
    }
