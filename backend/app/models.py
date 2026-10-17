from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    bio: Mapped[str] = mapped_column(String(240), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    snippets: Mapped[list["Snippet"]] = relationship(back_populates="author", cascade="all, delete-orphan")

class Snippet(Base):
    __tablename__ = "snippets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(140), index=True)
    description: Mapped[str] = mapped_column(String(500))
    language: Mapped[str] = mapped_column(String(40), index=True)
    code: Mapped[str] = mapped_column(Text)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(40)), default=list)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    views: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    author: Mapped[User] = relationship(back_populates="snippets")
    likes_rel: Mapped[list["SnippetLike"]] = relationship(back_populates="snippet", cascade="all, delete-orphan")
    __table_args__ = (Index("ix_snippets_public_created", "is_public", "created_at"),)

class SnippetLike(Base):
    __tablename__ = "snippet_likes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    snippet_id: Mapped[int] = mapped_column(ForeignKey("snippets.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    snippet: Mapped[Snippet] = relationship(back_populates="likes_rel")
    __table_args__ = (UniqueConstraint("user_id", "snippet_id", name="uq_user_snippet_like"),)
