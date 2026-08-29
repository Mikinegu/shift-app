import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, XCircle } from "lucide-react";

const TYPE_LABELS = {
  student_verification: "Student verification",
  company_verification: "Company verification",
  job_approval: "Job approval",
  report: "Report",
  security_alert: "Security alert",
};

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const list = await base44.entities.AdminNotification.list("-created_date", 100); setItems(list || []); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (n, status) => {
    await base44.entities.AdminNotification.update(n.id, { status });
    load();
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader title="Admin Notifications" subtitle="Actions requiring admin attention." />
      {loading ? <div className="py-10 text-sm text-muted-foreground">Loading…</div>
        : items.length === 0 ? <EmptyState icon={Bell} title="No notifications" description="Important events will appear here." />
        : <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className="bg-white rounded-xl border border-border p-4 shadow-sm flex items-start gap-3">
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${n.status === "pending" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}><Bell className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-xs font-medium text-indigo-600">{TYPE_LABELS[n.type] || n.type}</span><StatusBadge status={n.status} /></div>
                <p className="font-medium text-sm mt-0.5">{n.title}</p>
                {n.description && <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_date).toLocaleString()}</p>
              </div>
              {n.status === "pending" && (
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" className="h-8 text-emerald-600 border-emerald-200" onClick={() => resolve(n, "resolved")}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-slate-500" onClick={() => resolve(n, "dismissed")}><XCircle className="w-3.5 h-3.5 mr-1" /> Dismiss</Button>
                </div>
              )}
            </div>
          ))}
        </div>}
    </div>
  );
}
