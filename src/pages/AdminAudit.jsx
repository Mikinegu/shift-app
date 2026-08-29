import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { ScrollText } from "lucide-react";

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 200)
      .then((l) => setLogs(l || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader title="Audit Log" subtitle="A record of every admin action on the platform." />
      {loading ? <div className="py-10 text-sm text-muted-foreground">Loading…</div>
        : logs.length === 0 ? <EmptyState icon={ScrollText} title="No audit entries" description="Admin actions will be logged here." />
        : <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {logs.map((l) => (
              <div key={l.id} className="p-4 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 shrink-0"><ScrollText className="w-4 h-4" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{l.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.details}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.admin_name} · {new Date(l.created_date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>}
    </div>
  );
}
