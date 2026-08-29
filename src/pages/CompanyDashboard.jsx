import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Briefcase, FileText, Video, Plus, ShieldAlert, Users, TrendingUp
} from "lucide-react";

export default function CompanyDashboard() {
  const { companyProfile } = useProfile();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyProfile) return;
    let active = true;
    async function load() {
      try {
        const [myJobs, apps, ints] = await Promise.all([
          base44.entities.Job.filter({ company_id: companyProfile.id }, "-created_date", 100),
          base44.entities.Application.filter({ company_id: companyProfile.id }, "-created_date", 100),
          base44.entities.Interview.filter({ company_id: companyProfile.id }, "-created_date", 50),
        ]);
        if (!active) return;
        setJobs(myJobs || []);
        setApplications(apps || []);
        setInterviews(ints || []);
      } catch (e) {}
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [companyProfile]);

  if (!companyProfile) return null;

  const isVerified = companyProfile.verification_status === "verified";
  const activeJobs = jobs.filter((j) => j.status === "approved");
  const pendingJobs = jobs.filter((j) => j.status === "pending");
  const newApps = applications.filter((a) => a.status === "applied");
  const upcoming = interviews.filter((i) => ["invitation_sent", "scheduled", "confirmed"].includes(i.status));
  const hired = applications.filter((a) => a.status === "accepted");

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader
        title={companyProfile.company_name}
        subtitle={isVerified ? "Your company is verified — you can publish jobs." : "Your company is pending verification."}
        actions={isVerified && <Button asChild><Link to="/company/jobs/new"><Plus className="w-4 h-4 mr-2" /> Post a job</Link></Button>}
      />

      {!isVerified && (
        <div className="mb-8 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Verification in progress</p>
            <p className="text-amber-700">Our admin team is reviewing your company information. You can draft jobs now, but they'll only publish after you're verified and the job is approved.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Total jobs" value={jobs.length} accent="indigo" />
        <StatCard icon={TrendingUp} label="Active jobs" value={activeJobs.length} accent="emerald" />
        <StatCard icon={FileText} label="Applications" value={applications.length} accent="violet" />
        <StatCard icon={Users} label="Hires" value={hired.length} accent="amber" />
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Your jobs</h2>
            <Link to="/company/jobs" className="text-sm text-indigo-600 hover:underline">Manage</Link>
          </div>
          {jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No jobs yet" description={isVerified ? "Post your first job to start receiving applications." : "You'll be able to post jobs once verified."} />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((j) => (
                <div key={j.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground">{j.employment_type} · {j.positions} position(s)</p>
                  </div>
                  <StatusBadge status={j.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent applications</h2>
            <Link to="/company/applications" className="text-sm text-indigo-600 hover:underline">All</Link>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{a.student_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.job_title}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingJobs.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="font-semibold mb-3">Awaiting admin approval</h2>
          <div className="space-y-2">
            {pendingJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between text-sm py-1.5">
                <span>{j.title}</span>
                <StatusBadge status={j.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
