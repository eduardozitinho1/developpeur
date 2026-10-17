import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import TagInput from "../components/TagInput";

const LANGUAGES = [
  "javascript", "typescript", "python", "java", "c", "cpp", "csharp",
  "go", "rust", "ruby", "php", "swift", "kotlin", "html", "css", "sql",
  "bash", "json", "yaml", "markdown",
];

export default function SnippetForm({ editMode = false }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    language: "javascript",
    is_public: true,
    tags: [],
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editMode) {
      api.get(`/api/snippets/${id}`).then((r) => {
        setForm({
          title: r.data.title,
          description: r.data.description || "",
          code: r.data.code,
          language: r.data.language,
          is_public: r.data.is_public,
          tags: r.data.tags.map((t) => t.name),
        });
      });
    }
  }, [editMode, id]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const payload = { ...form };
      const r = editMode
        ? await api.put(`/api/snippets/${id}`, payload)
        : await api.post("/api/snippets", payload);
      nav(`/snippets/${r.data.id}`);
    } catch (e) {
      const d = e.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Erro ao salvar snippet.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-page">
      <h1>{editMode ? "Editar snippet" : "Novo snippet"}</h1>
      <form className="snippet-form" onSubmit={submit}>
        <label>
          Título
          <input
            required
            minLength={3}
            maxLength={160}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex.: Hook para fetch com AbortController"
          />
        </label>

        <label>
          Descrição
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Explique o problema que esse snippet resolve."
          />
        </label>

        <div className="form-row">
          <label>
            Linguagem
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            />
            Snippet público
          </label>
        </div>

        <label>
          Tags
          <TagInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
        </label>

        <label>
          Código
          <textarea
            required
            rows={18}
            className="code-textarea"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Cole aqui o código do snippet"
            spellCheck={false}
          />
        </label>

        {err && <div className="form-error">{err}</div>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => nav(-1)}>
            Cancelar
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Salvando..." : editMode ? "Salvar alterações" : "Publicar snippet"}
          </button>
        </div>
      </form>
    </div>
  );
}
