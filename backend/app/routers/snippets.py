from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, desc
from typing import Optional
import re
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/snippets", tags=["snippets"])


def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    return s or "tag"


def get_or_create_tags(db: Session, names):
    result = []
    seen = set()
    for raw in names:
        name = (raw or "").strip()
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        slug = slugify(name)
        tag = db.query(models.Tag).filter(
            (models.Tag.slug == slug) | (models.Tag.name == name)
        ).first()
        if not tag:
            tag = models.Tag(name=name, slug=slug)
            db.add(tag)
            db.flush()
        result.append(tag)
    return result


def serialize_one(s, star_count, comment_count, starred):
    return {
        "id": s.id,
        "title": s.title,
        "description": s.description,
        "code": s.code,
        "language": s.language,
        "is_public": s.is_public,
        "views": s.views,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "author": {"id": s.author.id, "username": s.author.username, "avatar_color": s.author.avatar_color},
        "tags": [{"id": t.id, "name": t.name, "slug": t.slug} for t in s.tags],
        "star_count": star_count,
        "comment_count": comment_count,
        "starred": starred,
    }


def serialize_many(snippets, db, current_user):
    if not snippets:
        return []
    ids = [s.id for s in snippets]
    star_counts = dict(
        db.query(models.Star.snippet_id, func.count(models.Star.id))
        .filter(models.Star.snippet_id.in_(ids))
        .group_by(models.Star.snippet_id)
        .all()
    )
    comment_counts = dict(
        db.query(models.Comment.snippet_id, func.count(models.Comment.id))
        .filter(models.Comment.snippet_id.in_(ids))
        .group_by(models.Comment.snippet_id)
        .all()
    )
    starred_ids = set()
    if current_user:
        starred_ids = {
            r[0]
            for r in db.query(models.Star.snippet_id)
            .filter(models.Star.user_id == current_user.id, models.Star.snippet_id.in_(ids))
            .all()
        }
    return [
        serialize_one(s, star_counts.get(s.id, 0), comment_counts.get(s.id, 0), s.id in starred_ids)
        for s in snippets
    ]


@router.get("", response_model=schemas.SnippetListResponse)
def list_snippets(
    q: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    sort: str = Query("recent"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=48),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    query = db.query(models.Snippet).options(
        joinedload(models.Snippet.author),
        joinedload(models.Snippet.tags),
    )

    if author:
        owner = db.query(models.User).filter(models.User.username == author).first()
        if not owner:
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "pages": 0}
        query = query.filter(models.Snippet.author_id == owner.id)
        if not current_user or current_user.id != owner.id:
            query = query.filter(models.Snippet.is_public == True)
    else:
        query = query.filter(models.Snippet.is_public == True)

    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(
            models.Snippet.title.ilike(like),
            models.Snippet.description.ilike(like),
            models.Snippet.code.ilike(like),
            models.Snippet.language.ilike(like),
        ))

    if language:
        query = query.filter(models.Snippet.language.ilike(language))

    if tag:
        query = query.join(models.Snippet.tags).filter(models.Tag.slug == slugify(tag))

    total = query.order_by(None).with_entities(
        func.count(func.distinct(models.Snippet.id))
    ).scalar() or 0

    star_subq = db.query(
        models.Star.snippet_id.label("snippet_id"),
        func.count(models.Star.id).label("cnt"),
    ).group_by(models.Star.snippet_id).subquery()

    query = query.outerjoin(star_subq, star_subq.c.snippet_id == models.Snippet.id)

    if sort == "popular":
        query = query.order_by(desc(func.coalesce(star_subq.c.cnt, 0)), desc(models.Snippet.views))
    elif sort == "views":
        query = query.order_by(desc(models.Snippet.views))
    else:
        query = query.order_by(desc(models.Snippet.created_at))

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": serialize_many(items, db, current_user),
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total else 0,
    }


@router.get("/trending", response_model=list[schemas.SnippetOut])
def trending(
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    star_subq = db.query(
        models.Star.snippet_id.label("snippet_id"),
        func.count(models.Star.id).label("cnt"),
    ).group_by(models.Star.snippet_id).subquery()

    rows = (
        db.query(models.Snippet)
        .options(joinedload(models.Snippet.author), joinedload(models.Snippet.tags))
        .outerjoin(star_subq, star_subq.c.snippet_id == models.Snippet.id)
        .filter(models.Snippet.is_public == True)
        .order_by(desc(func.coalesce(star_subq.c.cnt, 0)), desc(models.Snippet.views))
        .limit(limit)
        .all()
    )
    return serialize_many(rows, db, current_user)


@router.get("/{snippet_id}", response_model=schemas.SnippetOut)
def get_snippet(
    snippet_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    snippet = db.query(models.Snippet).options(
        joinedload(models.Snippet.author),
        joinedload(models.Snippet.tags),
    ).filter(models.Snippet.id == snippet_id).first()
    if not snippet:
        raise HTTPException(404, "Snippet not found")
    if not snippet.is_public and (not current_user or current_user.id != snippet.author_id):
        raise HTTPException(403, "Snippet is private")

    snippet.views = (snippet.views or 0) + 1
    db.commit()
    db.refresh(snippet)
    return serialize_many([snippet], db, current_user)[0]


@router.post("", response_model=schemas.SnippetOut, status_code=201)
def create_snippet(
    payload: schemas.SnippetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    snippet = models.Snippet(
        title=payload.title,
        description=payload.description,
        code=payload.code,
        language=payload.language.lower(),
        is_public=payload.is_public,
        author_id=current_user.id,
    )
    snippet.tags = get_or_create_tags(db, payload.tags)
    db.add(snippet)
    db.commit()
    db.refresh(snippet)
    return serialize_many([snippet], db, current_user)[0]


@router.put("/{snippet_id}", response_model=schemas.SnippetOut)
def update_snippet(
    snippet_id: int,
    payload: schemas.SnippetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id).first()
    if not snippet:
        raise HTTPException(404, "Snippet not found")
    if snippet.author_id != current_user.id:
        raise HTTPException(403, "Not your snippet")

    snippet.title = payload.title
    snippet.description = payload.description
    snippet.code = payload.code
    snippet.language = payload.language.lower()
    snippet.is_public = payload.is_public
    snippet.tags = get_or_create_tags(db, payload.tags)
    db.commit()
    db.refresh(snippet)
    return serialize_many([snippet], db, current_user)[0]


@router.delete("/{snippet_id}", status_code=204)
def delete_snippet(
    snippet_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id).first()
    if not snippet:
        raise HTTPException(404, "Snippet not found")
    if snippet.author_id != current_user.id:
        raise HTTPException(403, "Not your snippet")
    db.delete(snippet)
    db.commit()


@router.post("/{snippet_id}/star", status_code=201)
def star(
    snippet_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    snippet = db.query(models.Snippet).filter(models.Snippet.id == snippet_id).first()
    if not snippet:
        raise HTTPException(404, "Snippet not found")
    existing = db.query(models.Star).filter(
        models.Star.user_id == current_user.id, models.Star.snippet_id == snippet_id
    ).first()
    if existing:
        return {"starred": True}
    db.add(models.Star(user_id=current_user.id, snippet_id=snippet_id))
    db.commit()
    return {"starred": True}


@router.delete("/{snippet_id}/star")
def unstar(
    snippet_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    star = db.query(models.Star).filter(
        models.Star.user_id == current_user.id, models.Star.snippet_id == snippet_id
    ).first()
    if star:
        db.delete(star)
        db.commit()
    return {"starred": False}
