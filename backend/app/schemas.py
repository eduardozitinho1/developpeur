from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.-]+$")
    display_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.lower()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class UserPublic(BaseModel):
    id: int
    username: str
    display_name: str
    bio: str = ""
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class SnippetCreate(BaseModel):
    title: str = Field(min_length=4, max_length=140)
    description: str = Field(min_length=10, max_length=500)
    language: str = Field(min_length=1, max_length=40)
    code: str = Field(min_length=3, max_length=50000)
    tags: list[str] = Field(default_factory=list, max_length=10)
    is_public: bool = True

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, tags: list[str]) -> list[str]:
        clean = []
        for tag in tags:
            value = "".join(ch for ch in tag.strip().lower() if ch.isalnum() or ch in "-_#")[:40].lstrip("#")
            if value and value not in clean:
                clean.append(value)
        return clean[:10]

class SnippetUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=4, max_length=140)
    description: str | None = Field(default=None, min_length=10, max_length=500)
    language: str | None = Field(default=None, min_length=1, max_length=40)
    code: str | None = Field(default=None, min_length=3, max_length=50000)
    tags: list[str] | None = Field(default=None, max_length=10)
    is_public: bool | None = None

class SnippetAuthor(BaseModel):
    id: int
    username: str
    display_name: str
    model_config = ConfigDict(from_attributes=True)

class SnippetPublic(BaseModel):
    id: int
    title: str
    description: str
    language: str
    code: str
    tags: list[str]
    is_public: bool
    likes: int
    forks: int
    views: int
    created_at: datetime
    updated_at: datetime
    author: SnippetAuthor
    model_config = ConfigDict(from_attributes=True)

class SnippetPage(BaseModel):
    items: list[SnippetPublic]
    total: int
    limit: int
    offset: int
