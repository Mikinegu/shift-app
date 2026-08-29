const STYLES = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  suspended: "bg-rose-100 text-rose-700 border-rose-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  applied: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-amber-100 text-amber-700 border-amber-200",
  shortlisted: "bg-violet-100 text-violet-700 border-violet-200",
  interview: "bg-indigo-100 text-indigo-700 border-indigo-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  invitation_sent: "bg-blue-100 text-blue-700 border-blue-200",
  scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
  confirmed: "bg-violet-100 text-violet-700 border-violet-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  dismissed: "bg-slate-100 text-slate-600 border-slate-200",
  reviewing: "bg-amber-100 text-amber-700 border-amber-200",
};

const LABELS = {
  under_review: "Under Review",
  in_progress: "In Progress",
  invitation_sent: "Invitation Sent",
  part_time: "Part-time",
  full_time: "Full-time",
};

export default function StatusBadge({ status, className = "" }) {
  const key = String(status || "").toLowerCase().replace(/[\s-]/g, "_");
  const style = STYLES[key] || "bg-slate-100 text-slate-600 border-slate-200";
  const label = LABELS[key] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "—");
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style} ${className}`}>
      {label}
    </span>
  );
}
