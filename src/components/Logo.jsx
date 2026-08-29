import { Link } from "react-router-dom";

export default function Logo({ to = "/", className = "" }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-900 to-teal-500 text-white font-bold text-lg shadow-sm">
        S
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">
        SHIFT
      </span>
    </Link>
  );
}
