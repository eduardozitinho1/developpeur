import { Link } from "react-router-dom";

export default function SnippetCard({ snippet }) {
  const firstLine = (snippet.code || "").split("\n").slice(0, 4).join("\n");
  return (
    <article className="snippet-card">
      <header className="snippet-card-head">
        <Link to={`/snippets/${snippet.id}`} className="snippet-title">
          {snippet.title}
        </Link>
        <span className="lang-badge">{snippet.language}</span>
      </header>
      {snippet.description && (
        <p className="snippet-desc">{snippet.description}</p>
      )}
      <pre className="snippet-preview">{firstLine}</pre>
      <div className="tag-row">
        {snippet.tags.map((t) => (
          <Link key={t.id} to={`/browse?tag=${t.slug}`} className="tag-pill">
            #{t.name}
          </Link>
        ))}
      </div>
      <footer className="snippet-card-foot">
        <Link to={`/u/${snippet.author.username}`} className="author-chip">
          <span
            className="avatar sm"
            style={{ background: snippet.author.avatar_color }}
          >
            {snippet.author.username[0]?.toUpperCase()}
          </span>
          <span>{snippet.author.username}</span>
        </Link>
        <div className="metrics">
          <span>★ {snippet.star_count}</span>
          <span>💬 {snippet.comment_count}</span>
          <span>👁 {snippet.views}</span>
        </div>
      </footer>
    </article>
  );
}
