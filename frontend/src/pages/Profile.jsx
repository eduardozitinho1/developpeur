import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";
import SnippetCard from "../components/SnippetCard";
import Spinner from "../components/Spinner";

export default function Profile() {
  const { username } = useParams();
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [color, setColor] = useState("#7c5cff");

  useEffect(() => {
    setErr("");
    setProfile(null);
    api
      .get(`/api/users/${username}`)
      .then((r) => {
        setProfile(r.data);
        setBio(r.data.bio || "");
        setColor(r.data.avatar_color);
      })
      .catch((e) => setErr(e.response?.data?.detail || "Usuário não encontrado."));
    api
      .get(`/api/snippets?author=${encodeURIComponent(username)}&page_size=24`)
      .then((r) => setSnippets(r.data.items));
  }, [username]);

  const saveProfile = async () => {
    await api.put("/api/users/me", { bio, avatar_color: color });
    await refresh();
    const r = await api.get(`/api/users/${username}`);
    setProfile(r.data);
    setEditing(false);
  };

  if (err) return <div className="form-error">{err}</div>;
  if (!profile) return <Spinner label="Carregando perfil..." />;

  const mine = user?.username === profile.username;
  const COLORS = ["#7c5cff", "#ff5c8a", "#5cd0ff", "#ffb85c", "#5cffb1", "#c45cff"];

  return (
    <div className="profile">
      <header className="profile-head">
        <span className="avatar xl" style={{ background: profile.avatar_color }}>
          {profile.username[0]?.toUpperCase()}
        </span>
        <div className="profile-info">
          <h1>@{profile.username}</h1>
          <p className="muted small">
            Membro desde {new Date(profile.created_at).toLocaleDateString("pt-BR")}
          </p>
          {!editing ? (
            <p className="profile-bio">{profile.bio || "Sem bio ainda."}</p>
          ) : (
            <div className="profile-edit">
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
              <div className="color-row">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${color === c ? "active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    type="button"
                  />
                ))}
              </div>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
                <button className="btn-primary" onClick={saveProfile}>Salvar</button>
              </div>
            </div>
          )}
          <div className="profile-stats">
            <div><strong>{profile.snippet_count}</strong><span>snippets</span></div>
            <div><strong>{profile.star_count}</strong><span>estrelas</span></div>
          </div>
        </div>
        {mine && !editing && (
          <button className="btn-secondary" onClick={() => setEditing(true)}>
            Editar perfil
          </button>
        )}
      </header>

      <section className="section">
        <div className="section-head">
          <h2>Snippets públicos</h2>
          <Link to={`/browse?author=${profile.username}`} className="link-more">ver em explorar →</Link>
        </div>
        {snippets.length === 0 ? (
          <p className="muted">Nenhum snippet público ainda.</p>
        ) : (
          <div className="snippet-grid">
            {snippets.map((s) => (
              <SnippetCard key={s.id} snippet={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
