export default function StatCard({ icon: Icon, label, value, accent = "indigo" }) {
  const accents = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        {Icon && (
          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${accents[accent] || accents.indigo}`}>
            <Icon className="w-5 h-5" />
          </span>
        )}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value ?? 0}</div>
    </div>
  );
}
