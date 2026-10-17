import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";
import CodeBlock from "../components/CodeBlock";
import Spinner from "../components/Spinner";

export default function SnippetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [snippet, setSnippet] = useState(null);
  const [comments, setComments] = useState([]);
  const [err, setErr] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .get(`/api/snippets/${id}`)
      .then((r) => setSnippet(r.data))
      .catch((e) => setErr(e.response?.data?.detail || "Erro ao carregar snippet."));
    api.get(`/api/snippets/${id}/comments`).then((r) => setComments(r.data));
  };

  useEffect(load, [id]);

  const toggleStar = async () => {
    if (!user) return nav("/login");
    try {
      if (snippet.starred) {
        await api.delete(`/api/snippets/${snippet.id}/star`);
        setSnippet({ ...snippet, starred: false, star_count: snippet.star_count - 1 });
      } else {
        await api.post(`/api/snippets/${snippet.id}/star`);
        setSnippet({ ...snippet, starred: true, star_count: snippet.star_count + 1 });
      }
    } catch {}
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!user) return nav("/login");
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const r = await api.post(`/api/snippets/${id}/comments`, { body: draft });
      setComments([...comments, r.data]);
      setDraft("");
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (cid) => {
    await api.delete(`/api/comments/${cid}`);
    setComments(comments.filter((c) => c.id !== cid));
  };

  const removeSnippet = async () => {
    if (!confirm("Excluir este snippet permanentemente?")) return;
    await api.delete(`/api/snippets/${snippet.id}`);
    nav("/browse");
  };

  if (err) return <div className="form-error">{err}</div>;
  if (!snippet) return <Spinner label="Carregando snippet..." />;

  const mine = user && user.username === snippet.author.username;

  return (
    <article className="detail">
      <header className="detail-head">
        <div>
          <Link to="/browse" className="back-link">← explorar</Link>
          <h1>{snippet.title}</h1>
          <div className="detail-meta">
            <Link to={`/u/${snippet.author.username}`} className="author-chip">
              <span className="avatar sm" style={{ background: snippet.author.avatar_color }}>
                {snippet.author.username[0]?.toUpperCase()}
              </span>
              <span>@{snippet.author.username}</span>
            </Link>
            <span>·</span>
            <span>{new Date(snippet.created_at).toLocaleDateString("pt-BR")}</span>
            <span>·</span>
            <span className="lang-badge">{snippet.language}</span>
          </div>
          {snippet.description && <p className="detail-desc">{snippet.description}</p>}
          <div className="tag-row">
            {snippet.tags.map((t) => (
              <Link key={t.id} to={`/browse?tag=${t.slug}`} className="tag-pill">
                #{t.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="detail-actions">
          <button className={`btn-star ${snippet.starred ? "on" : ""}`} onClick={toggleStar}>
            {snippet.starred ? "★" : "☆"} {snippet.star_count}
          </button>
          {mine && (
            <>
              <Link to={`/snippets/${snippet.id}/edit`} className="btn-secondary">Editar</Link>
              <button className="btn-danger" onClick={removeSnippet}>Excluir</button>
            </>
          )}
        </div>
      </header>

      <CodeBlock code={snippet.code} language={snippet.language} />

      <section className="comments">
        <h2>Comentários ({comments.length})</h2>
        {comments.length === 0 && (
          <p className="muted">Ainda não há comentários. Seja o primeiro.</p>
        )}
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <div className="comment-head">
                <Link to={`/u/${c.author.username}`} className="author-chip">
                  <span className="avatar sm" style={{ background: c.author.avatar_color }}>
                    {c.author.username[0]?.toUpperCase()}
                  </span>
                  <span>@{c.author.username}</span>
                </Link>
                <span className="muted small">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </span>
                {user && user.username === c.author.username && (
                  <button className="btn-mini" onClick={() => removeComment(c.id)}>
                    remover
                  </button>
                )}
              </div>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>

        <form className="comment-form" onSubmit={postComment}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={user ? "Escreva um comentário..." : "Entre para comentar"}
            disabled={!user || busy}
            rows={3}
          />
          <button className="btn-primary" disabled={!user || busy || !draft.trim()}>
            {user ? "Comentar" : "Entrar para comentar"}
          </button>
        </form>
      </section>
    </article>
  );
}
