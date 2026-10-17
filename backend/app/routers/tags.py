from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("")
def list_tags(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.Tag, func.count(models.snippet_tags.c.snippet_id).label("cnt"))
        .join(models.snippet_tags, models.snippet_tags.c.tag_id == models.Tag.id)
        .group_by(models.Tag.id)
        .order_by(desc("cnt"))
        .limit(limit)
        .all()
    )
    return [{"id": t.id, "name": t.name, "slug": t.slug, "count": int(cnt)} for t, cnt in rows]
