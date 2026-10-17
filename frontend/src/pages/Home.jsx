import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import SnippetCard from "../components/SnippetCard";
import TagPill from "../components/TagPill";
import Spinner from "../components/Spinner";

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [tags, setTags] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/snippets/trending?limit=6"),
      api.get("/api/tags?limit=14"),
      api.get("/api/snippets?sort=recent&page_size=6"),
    ])
      .then(([t, tg, r]) => {
        setTrending(t.data);
        setTags(tg.data);
        setRecent(r.data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Carregando..." />;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">plataforma de snippets</span>
          <h1>
            Código útil. <span className="accent">Encontrado</span>.
            Reutilizado.
          </h1>
          <p>
            Publique, descubra e discuta trechos de código prontos para
            produção. Um acervo vivo, mantido por quem realmente escreve código.
          </p>
          <div className="hero-actions">
            <Link to="/browse" className="btn-primary">
              Explorar snippets
            </Link>
            <Link to="/snippets/new" className="btn-secondary">
              Publicar snippet
            </Link>
          </div>
        </div>
        <div className="hero-aside">
          <div className="stat-card">
            <span className="stat-value">
              {recent.length + trending.length}
            </span>
            <span className="stat-label">snippets em destaque</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{tags.length}</span>
            <span className="stat-label">tags ativas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">∞</span>
            <span className="stat-label">linguagens suportadas</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Em alta</h2>
          <Link to="/browse?sort=popular" className="link-more">
            ver tudo →
          </Link>
        </div>
        <div className="snippet-grid">
          {trending.map((s) => (
            <SnippetCard key={s.id} snippet={s} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Tags populares</h2>
          <Link to="/browse" className="link-more">
            explorar →
          </Link>
        </div>
        <div className="tag-cloud">
          {tags.map((t) => (
            <TagPill key={t.id} tag={t} count={t.count} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Recém publicados</h2>
          <Link to="/browse" className="link-more">
            ver tudo →
          </Link>
        </div>
        <div className="snippet-grid">
          {recent.map((s) => (
            <SnippetCard key={s.id} snippet={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
