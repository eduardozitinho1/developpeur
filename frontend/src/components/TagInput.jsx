import { useState } from "react";

export default function TagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim().replace(/^#/, "").toLowerCase();
    if (!name) return;
    if (value.includes(name)) {
      setDraft("");
      return;
    }
    if (value.length >= 8) return;
    onChange([...value, name]);
    setDraft("");
  };

  const remove = (name) => onChange(value.filter((v) => v !== name));

  return (
    <div className="tag-input">
      <div className="tag-input-chips">
        {value.map((t) => (
          <span key={t} className="tag-pill">
            #{t}
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remover ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
            if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={placeholder || "adicionar tag + Enter"}
        />
      </div>
    </div>
  );
}
