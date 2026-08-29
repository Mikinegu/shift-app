import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { notify } from "@/lib/notify";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Briefcase, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminJobs() {
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await base44.entities.Job.list("-created_date", 500);
      setJobs(list || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const audit = async (action, id, details) => {
    try { await base44.entities.AuditLog.create({ admin_id: user.id, admin_name: user.email, action, target_type: "Job", target_id: id, details }); } catch {}
  };

  const findCompany = async (companyId) => {
    try { const c = await base44.entities.CompanyProfile.filter({ id: companyId }); return c[0]; } catch { return null; }
  };

  const decide = async (job, status) => {
    await base44.entities.Job.update(job.id, { status });
    const comp = await findCompany(job.company_id);
    if (comp?.user_id) {
      await notify(comp.user_id,
        status === "approved" ? "Job approved" : "Job rejected",
        status === "approved" ? `Your job "${job.title}" is now published.` : `Your job "${job.title}" was rejected. Please review and update it.`,
        status === "approved" ? "job_approved" : "job_rejected",
        "/company/jobs"
      );
    }
    await audit(status === "approved" ? "approve_job" : "reject_job", job.id, `${job.title} by ${job.company_name}`);
    try {
      const notifs = await base44.entities.AdminNotification.filter({ target_id: job.id });
      await base44.entities.AdminNotification.bulkUpdate(notifs.map((n) => ({ id: n.id, status: "resolved" })));
    } catch {}
    load();
  };

  const pending = jobs.filter((j) => j.status === "pending");
  const approved = jobs.filter((j) => j.status === "approved");
  const list = tab === "pending" ? pending : approved;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Job Approvals" subtitle="Review jobs before they go live." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Published ({approved.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {loading ? <div className="py-10 text-sm text-muted-foreground">Loading…</div>
            : list.length === 0 ? <EmptyState icon={Briefcase} title={tab === "pending" ? "No jobs awaiting approval" : "No published jobs"} />
            : <div className="space-y-3">{list.map((j) => (
              <div key={j.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h3 className="font-semibold">{j.title}</h3><StatusBadge status={j.status} /></div>
                  <p className="text-sm text-muted-foreground">{j.company_name} · {j.employment_type} · {j.work_mode}</p>
                  {j.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{j.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/jobs/${j.id}`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Eye className="w-4 h-4" /></Link>
                  {j.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => decide(j, "approved")}><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200" onClick={() => decide(j, "rejected")}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                    </>
                  )}
                  {j.status === "approved" && <Button size="sm" variant="outline" className="text-rose-600 border-rose-200" onClick={() => decide(j, "closed")}>Unpublish</Button>}
                </div>
              </div>
            ))}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
