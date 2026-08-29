import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Flag, CheckCircle2, XCircle } from "lucide-react";

export default function AdminReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await base44.entities.Report.list("-created_date", 200);
      setReports(list || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (r, status) => {
    await base44.entities.Report.update(r.id, { status, resolution: status === "resolved" ? "Action taken" : "Dismissed" });
    try { await base44.entities.AuditLog.create({ admin_id: user.id, admin_name: user.email, action: "resolve_report", target_type: r.reported_type, target_id: r.reported_id, details: `${r.reported_name}: ${status}` }); } catch {}
    load();
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Reports" subtitle="Review user-submitted reports and take action." />
      {loading ? <div className="py-10 text-sm text-muted-foreground">Loading…</div>
        : reports.length === 0 ? <EmptyState icon={Flag} title="No reports" description="User reports will appear here for review." />
        : <div className="space-y-3">{reports.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600"><Flag className="w-4 h-4" /></span><h3 className="font-semibold">{r.reported_name || r.reported_type}</h3><StatusBadge status={r.status} /></div>
                <p className="text-sm text-muted-foreground mt-1">Reported by {r.reporter_name} · {r.reason}</p>
                {r.description && <p className="text-sm text-muted-foreground mt-1 italic">"{r.description}"</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_date).toLocaleString()} · Type: {r.reported_type}</p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => resolve(r, "resolved")}><CheckCircle2 className="w-4 h-4 mr-1" /> Resolve</Button>
                  <Button size="sm" variant="outline" onClick={() => resolve(r, "dismissed")}><XCircle className="w-4 h-4 mr-1" /> Dismiss</Button>
                </div>
              )}
            </div>
          </div>
        ))}</div>}
    </div>
  );
}
