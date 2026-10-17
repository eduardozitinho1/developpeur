export default function Spinner({ label }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      {label && <span>{label}</span>}
    </div>
  );
}
