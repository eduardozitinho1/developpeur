from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from .config import settings
from .database import Base, engine, get_db
from .models import Snippet, SnippetLike, User
from .schemas import AuthResponse, SnippetCreate, SnippetPage, SnippetPublic, SnippetUpdate, UserCreate, UserLogin, UserPublic
from .security import create_access_token, get_current_user, hash_password, verify_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("developpeur")

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment != "production" and settings.database_url.endswith("/developpeur"):
        Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title=settings.app_name, version="1.0.0", description="API da comunidade Développeur", lifespan=lifespan, docs_url="/docs" if settings.environment != "production" else None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=True, allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type"])

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "service": "developpeur-api", "database": "connected"}

@app.get("/api/health")
def api_health(db: Session = Depends(get_db)):
    return health(db)

@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(or_(User.email == payload.email.lower(), User.username == payload.username.lower())))
    if existing:
        detail = "Este e-mail já está cadastrado." if existing.email == payload.email.lower() else "Este nome de usuário já está em uso."
        raise HTTPException(status_code=409, detail=detail)
    user = User(username=payload.username.lower(), display_name=payload.display_name.strip(), email=payload.email.lower(), password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="E-mail ou nome de usuário já cadastrado.")
    return AuthResponse(access_token=create_access_token(user.id), user=UserPublic.model_validate(user))

@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.", headers={"WWW-Authenticate": "Bearer"})
    return AuthResponse(access_token=create_access_token(user.id), user=UserPublic.model_validate(user))

@app.get("/api/auth/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return user

@app.get("/api/snippets", response_model=SnippetPage)
def list_snippets(q: str | None = Query(default=None, max_length=120), language: str | None = Query(default=None, max_length=40), tag: str | None = Query(default=None, max_length=40), author: str | None = Query(default=None, max_length=30), sort: str = Query(default="trending", pattern="^(trending|newest|popular)$"), limit: int = Query(default=24, ge=1, le=100), offset: int = Query(default=0, ge=0), db: Session = Depends(get_db)):
    query = select(Snippet).options(joinedload(Snippet.author)).where(Snippet.is_public.is_(True))
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(or_(Snippet.title.ilike(term), Snippet.description.ilike(term), Snippet.code.ilike(term), Snippet.language.ilike(term), func.array_to_string(Snippet.tags, " ").ilike(term), Snippet.author.has(User.username.ilike(term))))
    if language:
        query = query.where(func.lower(Snippet.language) == language.lower())
    if tag:
        query = query.where(Snippet.tags.contains([tag.lower().lstrip("#")]))
    if author:
        query = query.join(Snippet.author).where(User.username == author.lower())
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    if sort == "newest":
        query = query.order_by(Snippet.created_at.desc(), Snippet.id.desc())
    elif sort == "popular":
        query = query.order_by(Snippet.likes.desc(), Snippet.views.desc())
    else:
        query = query.order_by((Snippet.likes * 2 + Snippet.views / 100).desc(), Snippet.created_at.desc())
    items = db.scalars(query.offset(offset).limit(limit)).unique().all()
    return SnippetPage(items=items, total=total, limit=limit, offset=offset)

@app.post("/api/snippets", response_model=SnippetPublic, status_code=status.HTTP_201_CREATED)
def create_snippet(payload: SnippetCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    snippet = Snippet(author_id=user.id, title=payload.title.strip(), description=payload.description.strip(), language=payload.language.strip(), code=payload.code, tags=payload.tags, is_public=payload.is_public)
    db.add(snippet)
    db.commit()
    db.refresh(snippet)
    return db.scalar(select(Snippet).options(joinedload(Snippet.author)).where(Snippet.id == snippet.id))

@app.get("/api/snippets/{snippet_id}", response_model=SnippetPublic)
def get_snippet(snippet_id: int, db: Session = Depends(get_db)):
    snippet = db.scalar(select(Snippet).options(joinedload(Snippet.author)).where(Snippet.id == snippet_id))
    if snippet is None or not snippet.is_public:
        raise HTTPException(status_code=404, detail="Snippet não encontrado.")
    snippet.views += 1
    db.commit()
    db.refresh(snippet)
    return snippet

@app.patch("/api/snippets/{snippet_id}", response_model=SnippetPublic)
def update_snippet(snippet_id: int, payload: SnippetUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    snippet = db.scalar(select(Snippet).options(joinedload(Snippet.author)).where(Snippet.id == snippet_id))
    if snippet is None:
        raise HTTPException(status_code=404, detail="Snippet não encontrado.")
    if snippet.author_id != user.id:
        raise HTTPException(status_code=403, detail="Você só pode editar seus próprios snippets.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(snippet, key, value)
    snippet.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(snippet)
    return db.scalar(select(Snippet).options(joinedload(Snippet.author)).where(Snippet.id == snippet.id))

@app.delete("/api/snippets/{snippet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_snippet(snippet_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    snippet = db.get(Snippet, snippet_id)
    if snippet is None:
        raise HTTPException(status_code=404, detail="Snippet não encontrado.")
    if snippet.author_id != user.id:
        raise HTTPException(status_code=403, detail="Você só pode excluir seus próprios snippets.")
    db.delete(snippet)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post("/api/snippets/{snippet_id}/like")
def toggle_like(snippet_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    snippet = db.get(Snippet, snippet_id)
    if snippet is None or not snippet.is_public:
        raise HTTPException(status_code=404, detail="Snippet não encontrado.")
    existing = db.scalar(select(SnippetLike).where(SnippetLike.user_id == user.id, SnippetLike.snippet_id == snippet_id))
    if existing:
        db.delete(existing)
        snippet.likes = max(0, snippet.likes - 1)
        liked = False
    else:
        db.add(SnippetLike(user_id=user.id, snippet_id=snippet_id))
        snippet.likes += 1
        liked = True
    db.commit()
    return {"liked": liked, "likes": snippet.likes}

@app.get("/api/users/{username}")
def public_profile(username: str, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == username.lower()))
    if user is None:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")
    count = db.scalar(select(func.count(Snippet.id)).where(Snippet.author_id == user.id, Snippet.is_public.is_(True))) or 0
    return {"user": UserPublic.model_validate(user), "public_snippets": count}
