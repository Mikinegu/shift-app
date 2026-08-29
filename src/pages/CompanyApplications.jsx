import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import { notify } from "@/lib/notify";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  FileText, MessageSquare, Video, CheckCircle2, XCircle, Star,
  Eye, Download, Loader2, User
} from "lucide-react";

const STATUSES = ["All", "applied", "under_review", "shortlisted", "interview", "accepted", "rejected"];

export default function CompanyApplications() {
  const { companyProfile } = useProfile();
  const [apps, setApps] = useState([]);
  const [students, setStudents] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [interviewApp, setInterviewApp] = useState(null);
  const [ivForm, setIvForm] = useState({ date: "", time: "", instructions: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!companyProfile) return;
    try {
      const [myApps, myJobs] = await Promise.all([
        base44.entities.Application.filter({ company_id: companyProfile.id }, "-created_date", 500),
        base44.entities.Job.filter({ company_id: companyProfile.id }, "-created_date", 200),
      ]);
      setApps(myApps || []);
      setJobs(myJobs || []);
      const ids = [...new Set((myApps || []).map((a) => a.student_id))];
      const profiles = await Promise.all(ids.map((sid) => base44.entities.StudentProfile.get(sid).catch(() => null)));
      const map = {};
      profiles.forEach((p) => { if (p) map[p.id] = p; });
      setStudents(map);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [companyProfile]);

  const filtered = useMemo(() => {
    let list = apps;
    if (jobFilter !== "All") list = list.filter((a) => a.job_id === jobFilter);
    if (statusFilter !== "All") list = list.filter((a) => a.status === statusFilter);
    return list;
  }, [apps, jobFilter, statusFilter]);

  if (!companyProfile) return null;

  const updateStatus = async (app, status, label) => {
    await base44.entities.Application.update(app.id, { status });
    const student = students[app.student_id];
    if (student?.user_id) {
      await notify(student.user_id, "Application status changed", `Your application for ${app.job_title} is now "${label}".`, "application_status", "/student/applications");
    }
    load();
  };

  const openInterview = (app) => {
    setInterviewApp(app);
    setIvForm({ date: "", time: "", instructions: "" });
  };

  const sendInterview = async () => {
    if (!ivForm.date || !ivForm.time) { alert("Pick a date and time."); return; }
    setBusy(true);
    try {
      await base44.entities.Interview.create({
        application_id: interviewApp.id,
        company_id: companyProfile.id,
        company_name: companyProfile.company_name,
        student_id: interviewApp.student_id,
        student_name: interviewApp.student_name,
        job_title: interviewApp.job_title,
        date: ivForm.date,
        time: ivForm.time,
        instructions: ivForm.instructions,
        status: "invitation_sent",
        room_id: "room-" + Math.random().toString(36).slice(2, 10)
      });
      await base44.entities.Application.update(interviewApp.id, { status: "interview" });
      const student = students[interviewApp.student_id];
      if (student?.user_id) {
        await notify(student.user_id, "Interview invitation", `${companyProfile.company_name} invited you to interview for ${interviewApp.job_title} on ${ivForm.date} at ${ivForm.time}.`, "interview_invitation", "/interviews");
      }
      setInterviewApp(null);
      load();
    } catch (e) {
      alert(e.message || "Failed to schedule interview");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <PageHeader title="Applications" subtitle="Review and manage students who applied to your jobs." />

      <div className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-6 flex flex-wrap gap-3">
        <div className="w-56">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger><SelectValue placeholder="All jobs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All jobs</SelectItem>
              {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All statuses" : s.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <span className="ml-auto text-sm text-muted-foreground self-center">{filtered.length} application(s)</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-10">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No applications" description="Applications to your jobs will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const student = students[a.student_id];
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{a.student_name}</h3>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{a.job_title}</p>
                    {student && <p className="text-xs text-muted-foreground mt-1">{student.university} · {student.major} · {student.year_of_study}</p>}
                    {a.cover_message && <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">"{a.cover_message}"</p>}
                    {student?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {student.skills.slice(0, 5).map((s) => <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">{s}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.cv_url && <a href={a.cv_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="View CV"><Download className="w-4 h-4" /></a>}
                    <Link to="/messages" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Message"><MessageSquare className="w-4 h-4" /></Link>
                    {a.status === "applied" && <Button size="sm" variant="outline" onClick={() => updateStatus(a, "under_review", "Under Review")}>Review</Button>}
                    {a.status !== "shortlisted" && a.status !== "accepted" && a.status !== "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(a, "shortlisted", "Shortlisted")}><Star className="w-4 h-4 mr-1" /> Shortlist</Button>
                    )}
                    {a.status !== "interview" && a.status !== "accepted" && a.status !== "rejected" && (
                      <Button size="sm" onClick={() => openInterview(a)}><Video className="w-4 h-4 mr-1" /> Interview</Button>
                    )}
                    {a.status !== "accepted" && a.status !== "rejected" && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(a, "accepted", "Accepted")}><CheckCircle2 className="w-4 h-4 mr-1" /> Accept</Button>
                    )}
                    {a.status !== "rejected" && a.status !== "accepted" && (
                      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => updateStatus(a, "rejected", "Rejected")}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {interviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setInterviewApp(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Invite to interview</h3>
            <p className="text-sm text-muted-foreground mt-1">{interviewApp.student_name} — {interviewApp.job_title}</p>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" className="mt-1.5" value={ivForm.date} onChange={(e) => setIvForm({ ...ivForm, date: e.target.value })} /></div>
                <div><Label>Time</Label><Input type="time" className="mt-1.5" value={ivForm.time} onChange={(e) => setIvForm({ ...ivForm, time: e.target.value })} /></div>
              </div>
              <div><Label>Instructions</Label><Textarea className="mt-1.5" rows={3} value={ivForm.instructions} onChange={(e) => setIvForm({ ...ivForm, instructions: e.target.value })} placeholder="What to prepare, meeting link details…" /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setInterviewApp(null)}>Cancel</Button>
                <Button onClick={sendInterview} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Send invitation</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
