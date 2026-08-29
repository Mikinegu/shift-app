import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import { recommendedJobs } from "@/lib/matching";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import JobCard from "@/components/JobCard";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Briefcase, FileText, Bookmark, Video, MessageSquare, CheckCircle2,
  ShieldAlert, ArrowRight, TrendingUp, User
} from "lucide-react";

const PROFILE_FIELDS = ["full_name", "phone", "university", "student_id", "major", "graduation_date", "skills", "experience", "cv_url", "employment_type", "job_field", "location", "bio", "photo_url"];

export default function StudentDashboard() {
  const { studentProfile, user, loading: profileLoading } = useProfile();
  const [jobs, setJobs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile) {
      if (!profileLoading) setLoading(false);
      return;
    }
    let active = true;
    async function load() {
      try {
        const [allJobs, savedJobs, apps, ints] = await Promise.all([
          base44.entities.Job.filter({ status: "approved" }, "-created_date", 100),
          base44.entities.SavedJob.filter({ student_id: studentProfile.id }),
          base44.entities.Application.filter({ student_id: studentProfile.id }, "-created_date", 50),
          base44.entities.Interview.filter({ student_id: studentProfile.id }, "-created_date", 50),
        ]);
        if (!active) return;
        setJobs(allJobs || []);
        setSaved(savedJobs || []);
        setApplications(apps || []);
        setInterviews(ints || []);
      } catch (e) {}
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [studentProfile, profileLoading]);

  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!studentProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  const filled = PROFILE_FIELDS.filter((f) => {
    const v = studentProfile[f];
    return Array.isArray(v) ? v.length > 0 : v;
  }).length;
  const completion = Math.round((filled / PROFILE_FIELDS.length) * 100);
  const recs = recommendedJobs(studentProfile, jobs).slice(0, 6);
  const savedIds = new Set(saved.map((s) => s.job_id));
  const upcoming = interviews.filter((i) => ["invitation_sent", "scheduled", "confirmed"].includes(i.status));
  const isVerified = studentProfile.verification_status === "verified";

  const toggleSave = async (jobId) => {
    const existing = saved.find((s) => s.job_id === jobId);
    if (existing) {
      await base44.entities.SavedJob.delete(existing.id);
      setSaved(saved.filter((s) => s.id !== existing.id));
    } else {
      const rec = await base44.entities.SavedJob.create({ student_id: studentProfile.id, job_id: jobId });
      setSaved([...saved, rec]);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader
        title={`Welcome, ${studentProfile.full_name?.split(" ")[0] || "Student"}`}
        subtitle={isVerified ? "Your profile is verified — you can apply for jobs." : "Your profile is pending verification."}
        actions={<Button asChild><Link to="/jobs"><Briefcase className="w-4 h-4 mr-2" /> Find Jobs</Link></Button>}
      />

      {!isVerified && (
        <div className="mb-8 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Verification in progress</p>
            <p className="text-amber-700">Our admin team is reviewing your enrollment proof. You'll be able to apply once verified.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Profile completion" value={`${completion}%`} accent="indigo" />
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="text-sm text-muted-foreground font-medium">Verification</div>
          <div className="mt-3"><StatusBadge status={studentProfile.verification_status} /></div>
        </div>
        <StatCard icon={FileText} label="Applications" value={applications.length} accent="violet" />
        <StatCard icon={Video} label="Upcoming interviews" value={upcoming.length} accent="blue" />
      </div>

      {/* Profile completion bar */}
      <div className="mt-6 bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Profile completion</h3>
          <Link to="/student/profile" className="text-sm text-indigo-600 hover:underline">Complete profile</Link>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${completion}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">A complete profile improves your match score and chances of being shortlisted.</p>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Recommended for you</h2>
          <Link to="/jobs" className="text-sm text-indigo-600 hover:underline">View all jobs</Link>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground py-8">Loading recommendations…</div>
        ) : recs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No recommendations yet" description="Complete your profile and check back for jobs matched to your studies." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map(({ job, score }) => (
              <JobCard key={job.id} job={job} score={score} saved={savedIds.has(job.id)} onSave={() => toggleSave(job.id)} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-violet-600" /> Recent applications</h2>
            <Link to="/student/applications" className="text-sm text-indigo-600 hover:underline">All</Link>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{a.job_title}</p>
                    <p className="text-xs text-muted-foreground">{a.company_name}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Video className="w-5 h-5 text-blue-600" /> Upcoming interviews</h2>
            <Link to="/interviews" className="text-sm text-indigo-600 hover:underline">All</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No interviews scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{i.job_title}</p>
                    <p className="text-xs text-muted-foreground">{i.company_name} · {i.date} {i.time}</p>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
