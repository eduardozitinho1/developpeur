import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import Editor from "@monaco-editor/react";
import toast, { Toaster } from "react-hot-toast";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Compass,
  Copy,
  FileCode2,
  Filter,
  Flame,
  GitFork,
  Globe2,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { api, getError } from "./api";

const languages = [
  "Python",
  "JavaScript",
  "TypeScript",
  "C#",
  "Java",
  "Go",
  "Rust",
  "SQL",
  "HTML",
  "CSS",
  "Bash",
  "PHP",
  "Ruby",
  "Kotlin",
  "Swift",
  "JSON",
  "YAML",
];
const languageColors = {
  Python: "#f4c45e",
  JavaScript: "#f2d34f",
  TypeScript: "#6ba9f6",
  "C#": "#b69af7",
  Java: "#ed8a62",
  Go: "#72d4e8",
  Rust: "#e6a16b",
  SQL: "#a2a6ff",
  HTML: "#f28b67",
  CSS: "#7e9cff",
  Bash: "#9bd7a5",
  PHP: "#a8a8ed",
  Ruby: "#f28b9d",
  Kotlin: "#c49cff",
  Swift: "#ff9b70",
  JSON: "#b5bac7",
  YAML: "#92cdb7",
};
const initialSnippets = [
  {
    id: "sample-1",
    title: "Retry com backoff exponencial",
    description:
      "Uma estratégia resiliente para repetir operações instáveis sem derrubar sua API.",
    language: "Python",
    code: "import time\nimport random\n\ndef retry(operation, attempts=5, base_delay=0.25):\n    for attempt in range(attempts):\n        try:\n            return operation()\n        except Exception:\n            if attempt == attempts - 1:\n                raise\n            delay = base_delay * (2 ** attempt)\n            time.sleep(delay + random.uniform(0, delay * 0.15))",
    tags: ["resiliência", "backend", "api"],
    likes: 284,
    forks: 63,
    views: 4210,
    author: { username: "marina.codes", display_name: "Marina Costa" },
    created_at: "2026-10-12T12:00:00Z",
    featured: true,
  },
  {
    id: "sample-2",
    title: "Debounce sem dependências",
    description:
      "Controle eventos de alta frequência com uma função pequena e previsível.",
    language: "JavaScript",
    code: "export function debounce(fn, delay = 250) {\n  let timer\n  return (...args) => {\n    clearTimeout(timer)\n    timer = setTimeout(() => fn(...args), delay)\n  }\n}",
    tags: ["frontend", "performance", "utils"],
    likes: 197,
    forks: 41,
    views: 3052,
    author: { username: "leo.dev", display_name: "Leonardo Alves" },
    created_at: "2026-10-11T12:00:00Z",
  },
  {
    id: "sample-3",
    title: "Paginação eficiente com SQL",
    description:
      "Consulta paginada com ordenação estável e parâmetros seguros.",
    language: "SQL",
    code: "SELECT id, title, created_at\nFROM snippets\nWHERE is_public = TRUE\n  AND (:cursor IS NULL OR created_at < :cursor)\nORDER BY created_at DESC, id DESC\nLIMIT :page_size;",
    tags: ["database", "sql", "performance"],
    likes: 156,
    forks: 28,
    views: 2100,
    author: { username: "db.ninja", display_name: "Rafael Nunes" },
    created_at: "2026-10-10T12:00:00Z",
  },
  {
    id: "sample-4",
    title: "Resultado tipado com sucesso ou erro",
    description:
      "Um tipo Result enxuto para evitar exceções como fluxo normal de controle.",
    language: "C#",
    code: "public readonly record struct Result<T>(T? Value, string? Error)\n{\n    public bool IsSuccess => Error is null;\n\n    public static Result<T> Success(T value) => new(value, null);\n    public static Result<T> Failure(string error) => new(default, error);\n}",
    tags: ["dotnet", "arquitetura", "types"],
    likes: 143,
    forks: 19,
    views: 1876,
    author: { username: "eduardo.dev", display_name: "Eduardo Martins" },
    created_at: "2026-10-09T12:00:00Z",
  },
  {
    id: "sample-5",
    title: "Validar variáveis de ambiente",
    description:
      "Falhe cedo e com mensagens úteis quando a configuração obrigatória estiver ausente.",
    language: "Go",
    code: 'func requiredEnv(key string) (string, error) {\n    value := strings.TrimSpace(os.Getenv(key))\n    if value == "" {\n        return "", fmt.Errorf("missing required environment variable %s", key)\n    }\n    return value, nil\n}',
    tags: ["configuration", "backend", "go"],
    likes: 119,
    forks: 24,
    views: 1460,
    author: { username: "bruno.builds", display_name: "Bruno Lima" },
    created_at: "2026-10-08T12:00:00Z",
  },
  {
    id: "sample-6",
    title: "Grid responsivo sem breakpoints",
    description:
      "CSS Grid que adapta o número de colunas conforme o espaço disponível.",
    language: "CSS",
    code: ".snippet-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr));\n  gap: 1.15rem;\n  align-items: stretch;\n}",
    tags: ["css", "responsive", "ui"],
    likes: 96,
    forks: 15,
    views: 1218,
    author: { username: "bia.ui", display_name: "Beatriz Rocha" },
    created_at: "2026-10-07T12:00:00Z",
  },
];

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("developpeur_user"));
    } catch {
      return null;
    }
  });
  const [snippets, setSnippets] = useState(initialSnippets);
  const [saved, setSaved] = useState(() =>
    JSON.parse(localStorage.getItem("developpeur_saved") || "[]"),
  );
  const [liked, setLiked] = useState(() =>
    JSON.parse(localStorage.getItem("developpeur_liked") || "[]"),
  );
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [language, setLanguage] = useState(
    searchParams.get("language") || "Todas as linguagens",
  );
  const [sort, setSort] = useState("trending");
  const [activeTab, setActiveTab] = useState("explore");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [editorOpen, setEditorOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const refreshSnippets = useCallback(async () => {
    try {
      const response = await api.get("/snippets", { params: { limit: 100 } });
      const remote = response.data.items || response.data;
      if (Array.isArray(remote) && remote.length)
        setSnippets([
          ...remote,
          ...initialSnippets.filter((s) => !remote.some((r) => r.id === s.id)),
        ]);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => {
    refreshSnippets();
  }, [refreshSnippets]);
  useEffect(() => {
    localStorage.setItem("developpeur_saved", JSON.stringify(saved));
  }, [saved]);
  useEffect(() => {
    localStorage.setItem("developpeur_liked", JSON.stringify(liked));
  }, [liked]);
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setLanguage(searchParams.get("language") || "Todas as linguagens");
  }, [searchParams]);
  useEffect(() => {
    const handler = (event) => updateSearch(event.detail || "");
    window.addEventListener("snippet-search", handler);
    return () => window.removeEventListener("snippet-search", handler);
  }, []);

  const filtered = useMemo(() => {
    let items = [...snippets];
    if (activeTab === "saved")
      items = items.filter((s) => saved.includes(String(s.id)));
    if (activeTab === "mine")
      items = items.filter(
        (s) =>
          user &&
          (s.author?.username === user.username || s.author?.id === user.id),
      );
    if (language !== "Todas as linguagens")
      items = items.filter(
        (s) => s.language?.toLowerCase() === language.toLowerCase(),
      );
    const query = search.trim().toLowerCase();
    if (query)
      items = items.filter((s) =>
        [
          s.title,
          s.description,
          s.language,
          ...(s.tags || []),
          s.author?.username,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    if (sort === "popular")
      items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    else if (sort === "newest")
      items.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );
    else
      items.sort(
        (a, b) =>
          (b.likes || 0) * 2 +
          (b.views || 0) / 100 -
          ((a.likes || 0) * 2 + (a.views || 0) / 100),
      );
    return items;
  }, [snippets, activeTab, saved, user, language, search, sort]);

  const signOut = () => {
    localStorage.removeItem("developpeur_token");
    localStorage.removeItem("developpeur_user");
    setUser(null);
    setProfileOpen(false);
    toast.success("Sessão encerrada. Até logo!");
  };
  const toggleSave = (item) =>
    setSaved((current) =>
      current.includes(String(item.id))
        ? current.filter((id) => id !== String(item.id))
        : [...current, String(item.id)],
    );
  const toggleLike = async (item) => {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      toast("Entre para curtir snippets");
      return;
    }
    const isLiked = liked.includes(String(item.id));
    setLiked((current) =>
      isLiked
        ? current.filter((id) => id !== String(item.id))
        : [...current, String(item.id)],
    );
    setSnippets((current) =>
      current.map((s) =>
        s.id === item.id
          ? { ...s, likes: Math.max(0, (s.likes || 0) + (isLiked ? -1 : 1)) }
          : s,
      ),
    );
    try {
      await api.post(`/snippets/${item.id}/like`);
    } catch {}
  };
  const submitAuth = async (data) => {
    try {
      const response = await api.post(
        `/auth/${authMode === "login" ? "login" : "register"}`,
        data,
      );
      const token = response.data.access_token;
      const nextUser = response.data.user;
      localStorage.setItem("developpeur_token", token);
      localStorage.setItem("developpeur_user", JSON.stringify(nextUser));
      setUser(nextUser);
      setAuthOpen(false);
      toast.success(
        authMode === "login"
          ? "Bem-vindo de volta!"
          : "Conta criada. Bora codar!",
      );
      refreshSnippets();
    } catch (error) {
      toast.error(getError(error));
    }
  };
  const submitSnippet = async (data) => {
    if (!user) {
      setAuthOpen(true);
      setAuthMode("login");
      return;
    }
    try {
      const response = await api.post("/snippets", data);
      setSnippets((current) => [response.data, ...current]);
      setEditorOpen(false);
      setActiveTab("explore");
      setSearch("");
      setLanguage("Todas as linguagens");
      toast.success("Snippet publicado! A comunidade agradece.");
      refreshSnippets();
    } catch (error) {
      toast.error(getError(error));
    }
  };
  const updateSearch = (value) => {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    value ? next.set("q", value) : next.delete("q");
    setSearchParams(next, { replace: true });
  };
  const selectLanguage = (value) => {
    setLanguage(value);
    const next = new URLSearchParams(searchParams);
    value !== "Todas as linguagens"
      ? next.set("language", value)
      : next.delete("language");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="app-shell">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#202127",
            color: "#f5f5f7",
            border: "1px solid #35363f",
          },
        }}
      />
      <header className="topbar">
        <Link
          to="/"
          className="brand"
          onClick={() => {
            setActiveTab("explore");
            setSearch("");
          }}
        >
          <span className="brand-mark">
            <Code2 size={21} strokeWidth={2.5} />
          </span>
          <span>
            développeur<span className="brand-period">.</span>
          </span>
        </Link>
        <div className="top-search">
          <Search size={17} />
          <input
            aria-label="Buscar snippets"
            placeholder="Buscar snippets, linguagens, tags..."
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
          />
          <kbd>⌘ K</kbd>
        </div>
        <nav className={`top-actions ${mobileNav ? "mobile-open" : ""}`}>
          <button
            className="nav-link"
            onClick={() => {
              setActiveTab("explore");
              setMobileNav(false);
            }}
          >
            <Compass size={16} /> Explorar
          </button>
          <button
            className="nav-link"
            onClick={() => {
              setActiveTab("saved");
              setMobileNav(false);
            }}
          >
            <Bookmark size={16} /> Salvos
          </button>
          <button
            className="button-primary create-top"
            onClick={() =>
              user
                ? setEditorOpen(true)
                : (setAuthOpen(true), setAuthMode("login"))
            }
          >
            <Plus size={17} /> Criar snippet
          </button>
          {user ? (
            <div className="profile-wrap">
              <button
                className="avatar-button"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <span className="avatar">
                  {(user.display_name || user.username || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-info">
                    <strong>{user.display_name || user.username}</strong>
                    <span>@{user.username}</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("mine");
                      setProfileOpen(false);
                    }}
                  >
                    <FileCode2 size={16} /> Meus snippets
                  </button>
                  <button onClick={signOut}>
                    <LogOut size={16} /> Sair da conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="button-quiet login-top"
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            >
              Entrar <ArrowRight size={15} />
            </button>
          )}
        </nav>
        <button
          className="mobile-menu"
          aria-label="Abrir menu"
          onClick={() => setMobileNav(!mobileNav)}
        >
          {mobileNav ? <X /> : <Menu />}
        </button>
      </header>
      <div className="page-layout">
        <aside className="sidebar">
          <div className="sidebar-label">WORKSPACE</div>
          <button
            className={`side-link ${activeTab === "explore" ? "active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            <Compass size={17} /> Explorar{" "}
            <span className="side-count">{snippets.length}</span>
          </button>
          <button
            className={`side-link ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            <Bookmark size={17} /> Coleção salva{" "}
            <span className="side-count">{saved.length}</span>
          </button>
          <button
            className={`side-link ${activeTab === "mine" ? "active" : ""}`}
            onClick={() =>
              user
                ? setActiveTab("mine")
                : (setAuthOpen(true), setAuthMode("login"))
            }
          >
            <FileCode2 size={17} /> Meus snippets
          </button>
          <div className="sidebar-divider" />
          <div className="sidebar-label">LINGUAGENS</div>
          <div className="language-list">
            <button
              className={`language-link ${language === "Todas as linguagens" ? "selected" : ""}`}
              onClick={() => selectLanguage("Todas as linguagens")}
            >
              <span className="language-dot all-dot">
                <Code2 size={12} />
              </span>
              Todas <span>{snippets.length}</span>
            </button>
            {languages.slice(0, 11).map((lang) => (
              <button
                key={lang}
                className={`language-link ${language === lang ? "selected" : ""}`}
                onClick={() =>
                  selectLanguage(
                    language === lang ? "Todas as linguagens" : lang,
                  )
                }
              >
                <span
                  className="language-dot"
                  style={{ background: languageColors[lang] }}
                />
                {lang}
                <span>
                  {snippets.filter(
                    (s) => s.language?.toLowerCase() === lang.toLowerCase(),
                  ).length || ""}
                </span>
              </button>
            ))}
          </div>
          <button
            className="show-more"
            onClick={() =>
              toast(
                "Use o filtro de linguagem para encontrar qualquer uma das 17 linguagens disponíveis.",
              )
            }
          >
            Ver todas as linguagens <ArrowRight size={13} />
          </button>
          <div className="sidebar-divider" />
          <div className="sidebar-label">EM ALTA AGORA</div>
          <div className="trending-tags">
            <button onClick={() => updateSearch("api")}>
              # api <span>+18%</span>
            </button>
            <button onClick={() => updateSearch("performance")}>
              # performance <span>+12%</span>
            </button>
            <button onClick={() => updateSearch("typescript")}>
              # typescript <span>+9%</span>
            </button>
            <button onClick={() => updateSearch("automation")}>
              # automation <span>+7%</span>
            </button>
          </div>
          <div className="sidebar-bottom">
            <div className="mini-terminal">
              <div className="terminal-lights">
                <i />
                <i />
                <i />
              </div>
              <p>
                <span>~/</span> code together
              </p>
              <div className="terminal-line">
                <span>❯</span> ship something great
                <span className="cursor">_</span>
              </div>
            </div>
            <div className="sidebar-foot">
              <span>Feito para quem constrói.</span>
              <span>© 2026 Développeur</span>
            </div>
          </div>
        </aside>
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <section className="hero">
                    <div className="hero-glow" />
                    <div className="hero-copy">
                      <div className="eyebrow">
                        <span className="eyebrow-dot" />
                        <Sparkles size={13} /> O playground da comunidade dev
                      </div>
                      <h1>
                        Seu próximo <span>snippet favorito</span>
                        <br className="desktop-break" /> está aqui.
                      </h1>
                      <p>
                        Descubra soluções prontas, compartilhe o que você sabe e
                        pare de reinventar a roda. Uma linha de código pode
                        mudar tudo.
                      </p>
                      <div className="hero-buttons">
                        <button
                          className="button-primary"
                          onClick={() => {
                            document
                              .getElementById("snippet-feed")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          Explorar snippets <ArrowRight size={16} />
                        </button>
                        <button
                          className="button-outline"
                          onClick={() =>
                            user
                              ? setEditorOpen(true)
                              : (setAuthOpen(true), setAuthMode("register"))
                          }
                        >
                          <Plus size={16} /> Publicar código
                        </button>
                      </div>
                      <div className="hero-proof">
                        <div className="proof-avatars">
                          <span>M</span>
                          <span>L</span>
                          <span>R</span>
                          <span>B</span>
                        </div>
                        <span>
                          <strong>
                            {(snippets.length * 124 + 1280).toLocaleString(
                              "pt-BR",
                            )}
                            +
                          </strong>{" "}
                          snippets e contando
                        </span>
                        <span className="proof-separator" />
                        <span>
                          <span className="live-dot" /> comunidade ativa
                        </span>
                      </div>
                    </div>
                    <div className="hero-art">
                      <div className="floating-chip chip-top">
                        <Zap size={14} /> Built by devs
                      </div>
                      <div className="editor-window">
                        <div className="editor-titlebar">
                          <div className="window-dots">
                            <i />
                            <i />
                            <i />
                          </div>
                          <span>useful-snippet.ts</span>
                          <span className="editor-badge">TS</span>
                        </div>
                        <div className="hero-code">
                          <div>
                            <span className="line-no">01</span>
                            <span className="code-purple">
                              export async function
                            </span>{" "}
                            <span className="code-blue">fetchData</span>() {"{"}
                          </div>
                          <div>
                            <span className="line-no">02</span>{" "}
                            <span className="code-purple">try</span> {"{"}
                          </div>
                          <div>
                            <span className="line-no">03</span>{" "}
                            <span className="code-purple">const</span> data ={" "}
                            <span className="code-purple">await</span> api.
                            <span className="code-blue">get</span>(
                            <span className="code-green">'/v1/data'</span>)
                          </div>
                          <div>
                            <span className="line-no">04</span>{" "}
                            <span className="code-purple">return</span> data.
                            <span className="code-blue">json</span>()
                          </div>
                          <div>
                            <span className="line-no">05</span> {"}"}{" "}
                            <span className="code-purple">catch</span> (error){" "}
                            {"{"}
                          </div>
                          <div>
                            <span className="line-no">06</span> logger.
                            <span className="code-blue">error</span>(error)
                          </div>
                          <div>
                            <span className="line-no">07</span>{" "}
                            <span className="code-purple">throw</span> error
                          </div>
                          <div>
                            <span className="line-no">08</span> {"}"}
                          </div>
                          <div>
                            <span className="line-no">09</span>
                            {"}"}
                          </div>
                        </div>
                        <div className="editor-footer">
                          <span>
                            <span className="green-status" /> 0 erros, 0 drama
                          </span>
                          <span>UTF-8 · LF</span>
                        </div>
                      </div>
                      <div className="floating-chip chip-bottom">
                        <span className="chip-star">✦</span> Código que conecta.
                      </div>
                      <div className="art-orbit orbit-one" />
                      <div className="art-orbit orbit-two" />
                    </div>
                  </section>
                  <section className="stats-row">
                    <div className="stat-item">
                      <div className="stat-icon purple">
                        <Code2 size={18} />
                      </div>
                      <div>
                        <strong>
                          {(snippets.length * 124 + 1280).toLocaleString(
                            "pt-BR",
                          )}
                          +
                        </strong>
                        <span>snippets compartilhados</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon orange">
                        <Flame size={18} />
                      </div>
                      <div>
                        <strong>17</strong>
                        <span>linguagens populares</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon green">
                        <Globe2 size={18} />
                      </div>
                      <div>
                        <strong>Open community</strong>
                        <span>conhecimento sem fronteiras</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon blue">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <strong>Feito por devs</strong>
                        <span>para devs, de verdade</span>
                      </div>
                    </div>
                  </section>
                  <section className="feed-section" id="snippet-feed">
                    <div className="section-heading">
                      <div>
                        <div className="section-kicker">
                          A COMUNIDADE ESCOLHEU
                        </div>
                        <h2>
                          {activeTab === "saved"
                            ? "Sua coleção"
                            : activeTab === "mine"
                              ? "Seus snippets"
                              : search
                                ? "Resultados da busca"
                                : language !== "Todas as linguagens"
                                  ? `Snippets em ${language}`
                                  : "Descubra algo incrível"}
                        </h2>
                        <p>
                          {activeTab === "saved"
                            ? "Tudo o que você guardou para usar depois."
                            : activeTab === "mine"
                              ? "Seus snippets publicados pela comunidade."
                              : "Código útil, ideias boas e soluções que merecem ser compartilhadas."}
                        </p>
                      </div>
                      <div className="feed-controls">
                        <div className="filter-select">
                          <ArrowDownUp size={14} />
                          <select
                            aria-label="Ordenar snippets"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                          >
                            <option value="trending">Em alta</option>
                            <option value="newest">Mais recentes</option>
                            <option value="popular">Mais curtidos</option>
                          </select>
                          <ChevronDown size={13} />
                        </div>
                        <button
                          className="filter-button"
                          onClick={() =>
                            toast(
                              "Selecione uma linguagem no menu lateral para filtrar o feed.",
                            )
                          }
                        >
                          <Filter size={15} /> Filtros
                        </button>
                      </div>
                    </div>
                    <div className="feed-meta">
                      <span>
                        {filtered.length}{" "}
                        {filtered.length === 1
                          ? "snippet encontrado"
                          : "snippets encontrados"}
                      </span>
                      <span className="feed-meta-right">
                        <span className="live-dot" /> Atualizado agora
                      </span>
                    </div>
                    {loading && (
                      <div className="loading-strip">
                        <span /> Sincronizando a comunidade…
                      </div>
                    )}
                    {filtered.length ? (
                      <div className="snippet-grid">
                        {filtered.map((item) => (
                          <SnippetCard
                            key={item.id}
                            item={item}
                            saved={saved.includes(String(item.id))}
                            liked={liked.includes(String(item.id))}
                            onSave={() => toggleSave(item)}
                            onLike={() => toggleLike(item)}
                            onAuth={() => {
                              setAuthOpen(true);
                              setAuthMode("login");
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <Search size={25} />
                        </div>
                        <h3>Nenhum snippet por aqui.</h3>
                        <p>
                          {activeTab === "saved"
                            ? "Salve snippets interessantes para encontrá-los aqui depois."
                            : activeTab === "mine"
                              ? "Seus próximos snippets vão aparecer nesta coleção."
                              : "Tente outra busca ou remova alguns filtros."}
                        </p>
                        <button
                          className="button-outline"
                          onClick={() => {
                            updateSearch("");
                            selectLanguage("Todas as linguagens");
                            setActiveTab("explore");
                          }}
                        >
                          Limpar filtros
                        </button>
                      </div>
                    )}
                    <div className="load-more-row">
                      <span>Você chegou ao fim desta seleção.</span>
                      <button
                        onClick={() => {
                          setSearch("");
                          selectLanguage("Todas as linguagens");
                          setSort("newest");
                        }}
                      >
                        Ver os mais recentes <ArrowRight size={14} />
                      </button>
                    </div>
                  </section>
                  <section className="bottom-cta">
                    <div className="cta-icon">
                      <Terminal size={24} />
                    </div>
                    <div>
                      <div className="section-kicker">
                        SEU CONHECIMENTO VALE MUITO
                      </div>
                      <h2>Escreveu algo útil? Compartilha.</h2>
                      <p>
                        O snippet que economiza 10 minutos de alguém pode valer
                        ouro.
                      </p>
                    </div>
                    <button
                      className="button-primary"
                      onClick={() =>
                        user
                          ? setEditorOpen(true)
                          : (setAuthOpen(true), setAuthMode("register"))
                      }
                    >
                      Publicar meu primeiro snippet <ArrowRight size={16} />
                    </button>
                  </section>
                  <footer className="main-footer">
                    <Link to="/" className="footer-brand">
                      <Code2 size={16} /> développeur<span>.</span>
                    </Link>
                    <span>Feito com curiosidade e café. ☕</span>
                    <div>
                      <a
                        href="https://github.com"
                        target="_blank"
                        rel="noreferrer"
                      >
                        GitHub
                      </a>
                      <a href="mailto:hello@developpeur.dev">Contato</a>
                      <button
                        onClick={() =>
                          toast(
                            "A política de privacidade será publicada em developpeur.dev/privacy.",
                          )
                        }
                      >
                        Privacidade
                      </button>
                    </div>
                  </footer>
                </>
              }
            />
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h2>Essa rota não existe.</h2>
                  <Link to="/">Voltar para explorar</Link>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
      {authOpen && (
        <AuthModal
          mode={authMode}
          onMode={setAuthMode}
          onClose={() => setAuthOpen(false)}
          onSubmit={submitAuth}
        />
      )}
      {editorOpen && (
        <SnippetModal
          onClose={() => setEditorOpen(false)}
          onSubmit={submitSnippet}
        />
      )}
    </div>
  );
}

function SnippetCard({ item, saved, liked, onSave, onLike, onAuth }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = item.code || "";
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Seu navegador bloqueou a cópia.");
    }
  };
  return (
    <article className="snippet-card">
      <div className="snippet-card-top">
        <span className="language-pill">
          <span
            style={{ background: languageColors[item.language] || "#a5a8b7" }}
          />
          {item.language || "Código"}
        </span>
        <button
          className={`icon-button ${saved ? "is-saved" : ""}`}
          aria-label={saved ? "Remover dos salvos" : "Salvar snippet"}
          onClick={onSave}
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <h3>{item.title}</h3>
      <p className="snippet-description">
        {item.description || "Um snippet útil compartilhado pela comunidade."}
      </p>
      <div className={`code-preview ${expanded ? "expanded" : ""}`}>
        <div className="code-preview-bar">
          <span>
            <span className="code-file-dot" />{" "}
            {item.language === "JavaScript"
              ? "snippet.js"
              : item.language === "TypeScript"
                ? "snippet.ts"
                : item.language === "Python"
                  ? "snippet.py"
                  : item.language === "C#"
                    ? "Snippet.cs"
                    : "snippet." + (item.language || "txt").toLowerCase()}
          </span>
          <button onClick={copyCode} aria-label="Copiar código">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <pre>
          <code>
            {expanded ? code : code.split("\n").slice(0, 5).join("\n")}
            {!expanded && code.split("\n").length > 5 ? "\n…" : ""}
          </code>
        </pre>
        {code.split("\n").length > 5 && (
          <button
            className="expand-code"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Recolher código" : "Ver código completo"}{" "}
            <ChevronDown size={13} className={expanded ? "rotate" : ""} />
          </button>
        )}
      </div>
      <div className="snippet-tags">
        {(item.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("snippet-search", { detail: tag }),
              )
            }
          >
            #{tag}
          </span>
        ))}
      </div>
      <div className="snippet-card-footer">
        <div className="snippet-author">
          <span className="author-avatar">
            {(item.author?.display_name || item.author?.username || "D")
              .slice(0, 1)
              .toUpperCase()}
          </span>
          <div>
            <strong>
              {item.author?.display_name ||
                item.author?.username ||
                "Comunidade"}
            </strong>
            <span>@{item.author?.username || "dev"}</span>
          </div>
        </div>
        <div className="snippet-engagement">
          <button
            className={liked ? "liked" : ""}
            onClick={onLike}
            aria-label="Curtir snippet"
          >
            <Heart size={15} fill={liked ? "currentColor" : "none"} />
            {item.likes || 0}
          </button>
          <span>
            <GitFork size={14} />
            {item.forks || 0}
          </span>
        </div>
      </div>
    </article>
  );
}

function AuthModal({ mode, onMode, onClose, onSubmit }) {
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const update = (e) =>
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onSubmit(form);
    setBusy(false);
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="modal auth-modal">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={19} />
        </button>
        <div className="modal-brand">
          <span className="brand-mark">
            <Code2 size={20} />
          </span>{" "}
          développeur<span className="brand-period">.</span>
        </div>
        <div className="modal-icon">
          <UserRound size={22} />
        </div>
        <h2>
          {mode === "login"
            ? "Que bom te ver de novo."
            : "Seu espaço começa aqui."}
        </h2>
        <p>
          {mode === "login"
            ? "Entre na sua conta e continue construindo."
            : "Crie sua conta e compartilhe seu conhecimento."}
        </p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Nome de exibição
                <input
                  name="display_name"
                  value={form.display_name}
                  onChange={update}
                  placeholder="Como vamos te chamar?"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </label>
              <label>
                Nome de usuário
                <input
                  name="username"
                  value={form.username}
                  onChange={update}
                  placeholder="seu-usuario"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_.-]+"
                />
              </label>
            </>
          )}
          <label>
            E-mail
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              placeholder="Mínimo de 8 caracteres"
              required
              minLength={8}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
          <button className="button-primary modal-submit" disabled={busy}>
            {busy ? (
              "Só um instante…"
            ) : mode === "login" ? (
              <>
                Entrar na plataforma <ArrowRight size={16} />
              </>
            ) : (
              <>
                Criar minha conta <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
        <div className="auth-switch">
          {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
          <button
            onClick={() => onMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Criar conta" : "Fazer login"}
          </button>
        </div>
        <div className="auth-secure">
          <ShieldCheck size={14} /> Sua conta, seus códigos. Seus dados
          protegidos.
        </div>
      </section>
    </div>
  );
}

function SnippetModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    language: "JavaScript",
    code: "",
    tags: "",
    is_public: true,
  });
  const [busy, setBusy] = useState(false);
  const update = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onSubmit({
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean),
    });
    setBusy(false);
  };
  return (
    <div
      className="modal-backdrop editor-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="modal snippet-modal">
        <div className="editor-modal-header">
          <div>
            <div className="section-kicker">COMPARTILHE CONHECIMENTO</div>
            <h2>Novo snippet</h2>
            <p>Um bom snippet resolve um problema e explica o porquê.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit} className="snippet-form">
          <div className="form-two-col">
            <label>
              Título do snippet
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Ex.: Cache simples com TTL"
                required
                minLength={4}
                maxLength={140}
              />
            </label>
            <label>
              Linguagem
              <select
                value={form.language}
                onChange={(e) => update("language", e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang}>{lang}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Descrição
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="O que resolve? Quando usar?"
              required
              minLength={10}
              maxLength={500}
              rows={2}
            />
          </label>
          <label>
            Tags <span className="field-optional">separadas por vírgula</span>
            <input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="api, performance, utils"
            />
          </label>
          <div className="editor-label-row">
            <label>Código-fonte</label>
            <span>
              <span className="live-dot" /> Editor com syntax highlighting
            </span>
          </div>
          <div className="monaco-wrap">
            <Editor
              height="300px"
              language={
                {
                  JavaScript: "javascript",
                  TypeScript: "typescript",
                  Python: "python",
                  "C#": "csharp",
                  SQL: "sql",
                  HTML: "html",
                  CSS: "css",
                  Bash: "shell",
                  JSON: "json",
                  YAML: "yaml",
                }[form.language] || form.language.toLowerCase()
              }
              theme="vs-dark"
              value={form.code}
              onChange={(value) => update("code", value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "DM Mono, monospace",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 14 },
                roundedSelection: false,
              }}
            />
          </div>
          <label className="visibility-toggle">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => update("is_public", e.target.checked)}
            />
            <span>
              <strong>Publicar para a comunidade</strong>
              <small>
                Outros desenvolvedores poderão encontrar este snippet.
              </small>
            </span>
          </label>
          <div className="snippet-form-actions">
            <button type="button" className="button-outline" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="button-primary"
              disabled={busy || form.code.trim().length < 3}
            >
              {busy ? (
                "Publicando…"
              ) : (
                <>
                  <Plus size={16} /> Publicar snippet
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default App;

export default App;
