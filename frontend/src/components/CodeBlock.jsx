import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

const MAP = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  rust: "rust",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  html: "markup",
  css: "css",
  sql: "sql",
  bash: "bash",
  json: "json",
  yaml: "yaml",
  markdown: "markdown",
};

export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const lang = MAP[language?.toLowerCase()] || "text";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span>{language || "text"}</span>
        <button onClick={copy} className="btn-mini">
          {copied ? "copiado" : "copiar"}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={vscDarkPlus}
        showLineNumbers
        customStyle={{ margin: 0, background: "transparent", padding: "16px" }}
        lineNumberStyle={{ opacity: 0.35 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
