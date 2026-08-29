import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Pencil, Trash2, FileText, Eye } from "lucide-react";

export default function CompanyJobs() {
  const { companyProfile } = useProfile();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!companyProfile) return;
    try {
      const [myJobs, myApps] = await Promise.all([
        base44.entities.Job.filter({ company_id: companyProfile.id }, "-created_date", 200),
        base44.entities.Application.filter({ company_id: companyProfile.id }, "-created_date", 500),
      ]);
      setJobs(myJobs || []);
      setApps(myApps || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [companyProfile]);

  if (!companyProfile) return null;

  const appCount = (jobId) => apps.filter((a) => a.job_id === jobId).length;
  const isVerified = companyProfile.verification_status === "verified";

  const closeJob = async (job) => {
    if (!confirm("Close this job? It will no longer accept applications.")) return;
    await base44.entities.Job.update(job.id, { status: "closed" });
    load();
  };
  const deleteJob = async (job) => {
    if (!confirm("Permanently delete this job and its applications?")) return;
    await base44.entities.Job.delete(job.id);
    load();
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="My Jobs"
        subtitle="Manage your job postings and applications."
        actions={isVerified && <Button asChild><Link to="/company/jobs/new"><Plus className="w-4 h-4 mr-2" /> Post a job</Link></Button>}
      />

      {loading ? (
        <div className="text-sm text-muted-foreground py-10">Loading…</div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs yet" description={isVerified ? "Post your first job to start receiving applications." : "You'll be able to post jobs once your company is verified."} action={isVerified && <Button asChild><Link to="/company/jobs/new"><Plus className="w-4 h-4 mr-2" /> Post a job</Link></Button>} />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div key={j.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{j.title}</h3>
                  <StatusBadge status={j.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{j.employment_type} · {j.work_mode} · {j.positions} position(s)</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1 mr-2"><FileText className="w-4 h-4" /> {appCount(j.id)}</span>
                <Link to={`/jobs/${j.id}`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="View"><Eye className="w-4 h-4" /></Link>
                <Link to={`/company/jobs/${j.id}/edit`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Edit"><Pencil className="w-4 h-4" /></Link>
                {j.status === "approved" && <Button variant="outline" size="sm" onClick={() => closeJob(j)}>Close</Button>}
                <button onClick={() => deleteJob(j)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
