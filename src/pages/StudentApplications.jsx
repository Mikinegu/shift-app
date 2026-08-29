import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { FileText, MessageSquare, Video, Trash2 } from "lucide-react";

export default function StudentApplications() {
  const { studentProfile } = useProfile();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!studentProfile) return;
    try {
      const list = await base44.entities.Application.filter({ student_id: studentProfile.id }, "-created_date", 200);
      setApps(list || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [studentProfile]);

  if (!studentProfile) return null;

  const withdraw = async (app) => {
    if (!confirm("Withdraw this application?")) return;
    await base44.entities.Application.delete(app.id);
    load();
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="My Applications" subtitle="Track the status of every job you've applied to." />
      {loading ? (
        <div className="text-sm text-muted-foreground py-10">Loading…</div>
      ) : apps.length === 0 ? (
        <EmptyState icon={FileText} title="No applications yet" description="Find jobs that match your studies and apply — they'll show up here." action={<Link to="/jobs" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">Find jobs</Link>} />
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/jobs/${a.job_id}`} className="font-semibold hover:text-indigo-600">{a.job_title}</Link>
                  <p className="text-sm text-muted-foreground">{a.company_name}</p>
                  {a.cover_message && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 italic">"{a.cover_message}"</p>}
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-muted-foreground">{new Date(a.created_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                <Link to="/messages" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"><MessageSquare className="w-4 h-4" /> Message</Link>
                <Link to="/interviews" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"><Video className="w-4 h-4" /> Interviews</Link>
                {a.status === "applied" && (
                  <button onClick={() => withdraw(a)} className="ml-auto inline-flex items-center gap-1.5 text-sm text-rose-600 hover:underline"><Trash2 className="w-4 h-4" /> Withdraw</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
