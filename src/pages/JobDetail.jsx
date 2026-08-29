import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import { matchScore } from "@/lib/matching";
import { notify, adminNotify } from "@/lib/notify";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, MapPin, Briefcase, Building2, Clock, Users, Wallet,
  CheckCircle2, Bookmark, Flag, Loader2, GraduationCap, ShieldCheck
} from "lucide-react";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { studentProfile, role } = useProfile();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [applied, setApplied] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [cover, setCover] = useState("");
  const [applying, setApplying] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const j = await base44.entities.Job.get(id);
        if (!active) return;
        setJob(j);
        if (j.company_id) {
          try {
            const comps = await base44.entities.CompanyProfile.filter({ id: j.company_id });
            if (comps[0]) setCompany(comps[0]);
          } catch {}
        }
        if (studentProfile) {
          const [savedJobs, apps] = await Promise.all([
            base44.entities.SavedJob.filter({ student_id: studentProfile.id, job_id: id }),
            base44.entities.Application.filter({ student_id: studentProfile.id, job_id: id }),
          ]);
          if (savedJobs[0]) { setSaved(true); setSavedId(savedJobs[0].id); }
          if (apps[0]) setApplied(apps[0]);
        }
      } catch (e) {}
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [id, studentProfile]);

  if (loading) return <div className="p-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  if (!job) return <div className="p-10 text-center text-muted-foreground">Job not found.</div>;

  const score = studentProfile ? matchScore(studentProfile, job) : null;
  const isVerified = studentProfile?.verification_status === "verified";
  const deadline = job.deadline ? new Date(job.deadline) : null;
  const expired = deadline && deadline < new Date();

  const toggleSave = async () => {
    if (!studentProfile) return;
    if (saved) {
      await base44.entities.SavedJob.delete(savedId);
      setSaved(false); setSavedId(null);
    } else {
      const rec = await base44.entities.SavedJob.create({ student_id: studentProfile.id, job_id: id });
      setSaved(true); setSavedId(rec.id);
    }
  };

  const submitApply = async () => {
    setApplying(true);
    try {
      const app = await base44.entities.Application.create({
        job_id: id,
        job_title: job.title,
        company_id: job.company_id,
        company_name: job.company_name,
        student_id: studentProfile.id,
        student_name: studentProfile.full_name,
        student_major: studentProfile.major,
        student_university: studentProfile.university,
        cv_url: studentProfile.cv_url,
        cover_message: cover,
        status: "applied"
      });
      if (company?.user_id) await notify(company.user_id, "New application", `${studentProfile.full_name} applied to ${job.title}`, "new_application", `/company/applications`);
      setApplied(app);
      setShowApply(false);
    } catch (e) {
      alert(e.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const reportJob = async () => {
    setReporting(true);
    try {
      await base44.entities.Report.create({
        reporter_id: studentProfile?.id || "",
        reporter_name: studentProfile?.full_name || "Student",
        reported_type: "job",
        reported_id: id,
        reported_name: job.title,
        reason: "Reported from job page",
        description: "User flagged this job posting for review.",
        status: "pending"
      });
      await adminNotify("report", "A user reported a job", `${job.title} was reported.`, "Job", id);
      alert("Report submitted. Our team will review it.");
    } catch (e) {
      alert(e.message || "Failed to report");
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {company?.logo_url ? (
                <img src={company.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover bg-slate-100" />
              ) : (
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600"><Building2 className="w-7 h-7" /></span>
              )}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{job.title}</h1>
                <p className="text-muted-foreground mt-1">{job.company_name}</p>
              </div>
            </div>
            {typeof score === "number" && (
              <span className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold border ${
                score >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200"
              }`}>{score}% Match</span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.employment_type}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.work_mode === "Remote" ? "Remote" : job.location || "On-site"} ({job.work_mode})</span>
            {job.salary && <span className="inline-flex items-center gap-1.5"><Wallet className="w-4 h-4" /> {job.salary}</span>}
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {job.positions} position(s)</span>
            <span className={`inline-flex items-center gap-1.5 ${expired ? "text-rose-500" : ""}`}><Clock className="w-4 h-4" /> {deadline ? (expired ? "Closed" : `Deadline ${deadline.toLocaleDateString()}`) : "No deadline"}</span>
          </div>
        </div>

        <div className="p-6 lg:p-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Job description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description || "No description provided."}</p>
            </div>
            {job.responsibilities && (
              <div>
                <h3 className="font-semibold mb-2">Responsibilities</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.responsibilities}</p>
              </div>
            )}
            {job.requirements && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
              </div>
            )}
            {job.required_skills && job.required_skills.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Required skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((s) => <span key={s} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-sm border border-indigo-100">{s}</span>)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-5 border border-border">
              <h4 className="font-semibold text-sm">Requirements summary</h4>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Major</dt><dd className="font-medium text-right">{job.required_major || "Any"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Education</dt><dd className="font-medium text-right">{job.required_education || "Any"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Year pref.</dt><dd className="font-medium text-right">{job.year_preference || "Any"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Org type</dt><dd className="font-medium text-right">{job.org_type || "—"}</dd></div>
              </dl>
            </div>

            {role === "student" && (
              <div className="space-y-2">
                {applied ? (
                  <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-200 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="text-sm font-semibold text-emerald-800 mt-1">You've applied</p>
                    <div className="mt-2"><StatusBadge status={applied.status} /></div>
                    <Link to="/student/applications" className="text-xs text-emerald-700 hover:underline">Track application</Link>
                  </div>
                ) : (
                  <Button className="w-full" disabled={!isVerified || expired} onClick={() => setShowApply(true)}>
                    {!isVerified ? "Verify your account to apply" : expired ? "Application closed" : "Apply now"}
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={toggleSave}>
                  <Bookmark className={`w-4 h-4 mr-2 ${saved ? "fill-current text-indigo-600" : ""}`} /> {saved ? "Saved" : "Save job"}
                </Button>
                <Button variant="ghost" className="w-full text-rose-600 hover:text-rose-700" onClick={reportJob} disabled={reporting}>
                  <Flag className="w-4 h-4 mr-2" /> {reporting ? "Reporting…" : "Report this job"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowApply(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Apply to {job.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">at {job.company_name}</p>
            <div className="mt-5 space-y-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Your CV:</span>{" "}
                {studentProfile?.cv_url ? <span className="text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Attached</span> : <span className="text-rose-600">No CV on profile — add one in your profile.</span>}
              </div>
              <div>
                <Label>Cover message</Label>
                <Textarea className="mt-1.5" rows={4} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Introduce yourself and why you're a good fit…" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowApply(false)}>Cancel</Button>
                <Button onClick={submitApply} disabled={applying}>
                  {applying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : "Submit application"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
