from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api", tags=["comments"])


@router.get("/snippets/{snippet_id}/comments", response_model=list[schemas.CommentOut])
def list_comments(snippet_id: int, db: Session = Depends(get_db)):
    snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id).first()
    if not snippet:
        raise HTTPException(404, "Snippet not found")
    return (
        db.query(models.Comment)
        .options(joinedload(models.Comment.author))
        .filter(models.Comment.snippet_id == snippet_id)
        .order_by(models.Comment.created_at.asc())
        .all()
    )


@router.post("/snippets/{snippet_id}/comments", response_model=schemas.CommentOut, status_code=201)
def create_comment(
    snippet_id: int,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id).first()
    if not snippet:
        raise HTTPException(404, "Snippet not found")
    comment = models.Comment(
        body=payload.body, snippet_id=snippet_id, author_id=current_user.id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(403, "Not your comment")
    db.delete(comment)
    db.commit()
