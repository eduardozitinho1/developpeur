CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    bio VARCHAR(240) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

CREATE TABLE IF NOT EXISTS snippets (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(140) NOT NULL,
    description VARCHAR(500) NOT NULL,
    language VARCHAR(40) NOT NULL,
    code TEXT NOT NULL,
    tags VARCHAR(40)[] NOT NULL DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    forks INTEGER NOT NULL DEFAULT 0 CHECK (forks >= 0),
    views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_snippets_author_id ON snippets(author_id);
CREATE INDEX IF NOT EXISTS ix_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS ix_snippets_is_public ON snippets(is_public);
CREATE INDEX IF NOT EXISTS ix_snippets_created_at ON snippets(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_snippets_public_created ON snippets(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_snippets_tags ON snippets USING GIN(tags);
CREATE INDEX IF NOT EXISTS ix_snippets_search ON snippets USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(code, '')));

CREATE TABLE IF NOT EXISTS snippet_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snippet_id INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_snippet_like UNIQUE(user_id, snippet_id)
);
CREATE INDEX IF NOT EXISTS ix_snippet_likes_user_id ON snippet_likes(user_id);
CREATE INDEX IF NOT EXISTS ix_snippet_likes_snippet_id ON snippet_likes(snippet_id);

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_snippets_updated_at ON snippets;
CREATE TRIGGER trg_snippets_updated_at BEFORE UPDATE ON snippets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippet_likes ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
    public.users,
    public.snippets,
    public.snippet_likes
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
