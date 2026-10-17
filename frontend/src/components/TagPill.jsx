import { Link } from "react-router-dom";

export default function TagPill({ tag, count }) {
  return (
    <Link to={`/browse?tag=${tag.slug}`} className="tag-pill lg">
      #{tag.name}
      {typeof count === "number" && <span className="tag-count">{count}</span>}
    </Link>
  );
}
