from pydantic import ValidationError
import pytest
from app.schemas import SnippetCreate, UserCreate


def test_username_is_normalized():
    user = UserCreate(username="Dev.User", display_name="Dev User", email="DEV@example.com", password="strong-password")
    assert user.username == "dev.user"
    assert user.email == "dev@example.com"


def test_snippet_tags_are_normalized_and_deduplicated():
    snippet = SnippetCreate(title="Useful snippet", description="A useful description for testing.", language="Python", code="print('hello')", tags=["#API", "api", "Performance!"])
    assert snippet.tags == ["api", "performance"]


def test_short_password_is_rejected():
    with pytest.raises(ValidationError):
        UserCreate(username="developer", display_name="Developer", email="dev@example.com", password="short")
