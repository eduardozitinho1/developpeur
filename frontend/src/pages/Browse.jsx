import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import SnippetCard from "../components/SnippetCard";
import Spinner from "../components/Spinner";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "html",
  "css",
  "sql",
  "bash",
  "json",
  "yaml",
  "markdown",
];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);

  const q = params.get("q") || "";
  const language = params.get("language") || "";
  const tag = params.get("tag") || "";
  const author = params.get("author") || "";
  const sort = params.get("sort") || "recent";
  const page = parseInt(params.get("page") || "1", 10);

  const [searchDraft, setSearchDraft] = useState(q);
  useEffect(() => setSearchDraft(q), [q]);

  useEffect(() => {
    api.get("/api/tags?limit=30").then((r) => setTags(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (language) query.set("language", language);
    if (tag) query.set("tag", tag);
    if (author) query.set("author", author);
    query.set("sort", sort);
    query.set("page", page);
    query.set("page_size", "12");
    api
      .get(`/api/snippets?${query.toString()}`)
      .then((r) => {
        setItems(r.data.items);
        setMeta({ total: r.data.total, pages: r.data.pages });
      })
      .finally(() => setLoading(false));
  }, [q, language, tag, author, sort, page]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === null || v === undefined) next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in patch)) next.set("page", "1");
    setParams(next, { replace: true });
  };

  const languagesToShow = useMemo(() => {
    const set = new Set(LANGUAGES);
    items.forEach((s) => set.add(s.language));
    return Array.from(set).sort();
  }, [items]);

  return (
    <div className="browse">
      <header className="browse-head">
        <h1>Explorar snippets</h1>
        <p>
          {meta.total} resultados {author && `de @${author}`}
        </p>
      </header>

      <form
        className="browse-search"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: searchDraft });
        }}
      >
        <input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Buscar por título, código, tag..."
        />
        <button className="btn-primary">Buscar</button>
      </form>

      <div className="filters">
        <div className="filter">
          <span className="filter-label">Linguagem</span>
          <select
            value={language}
            onChange={(e) => update({ language: e.target.value })}
          >
            <option value="">todas</option>
            {languagesToShow.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="filter">
          <span className="filter-label">Ordenar</span>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
          >
            <option value="recent">mais recentes</option>
            <option value="popular">mais estrelas</option>
            <option value="views">mais vistos</option>
          </select>
        </div>
        {tag && (
          <div className="filter">
            <span className="filter-label">Tag</span>
            <button className="filter-chip" onClick={() => update({ tag: "" })}>
              #{tag} ×
            </button>
          </div>
        )}
        {author && (
          <div className="filter">
            <span className="filter-label">Autor</span>
            <button
              className="filter-chip"
              onClick={() => update({ author: "" })}
            >
              @{author} ×
            </button>
          </div>
        )}
      </div>

      <div className="tags-filter-row">
        {tags.slice(0, 18).map((t) => (
          <button
            key={t.id}
            className={`tag-pill ${tag === t.slug ? "active" : ""}`}
            onClick={() => update({ tag: tag === t.slug ? "" : t.slug })}
          >
            #{t.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Buscando..." />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>Nada encontrado</h3>
          <p>Tente outros termos ou remova filtros.</p>
        </div>
      ) : (
        <>
          <div className="snippet-grid">
            {items.map((s) => (
              <SnippetCard key={s.id} snippet={s} />
            ))}
          </div>

          {meta.pages > 1 && (
            <div className="pagination">
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                ← anterior
              </button>
              <span>
                página {page} de {meta.pages}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= meta.pages}
                onClick={() => update({ page: String(page + 1) })}
              >
                próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
