import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import { notify } from "@/lib/notify";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Video, Calendar, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function Interviews() {
  const { role, studentProfile, companyProfile } = useProfile();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const myId = role === "student" ? studentProfile?.id : companyProfile?.id;

  const load = async () => {
    if (!myId) return;
    try {
      const filter = role === "student" ? { student_id: myId } : { company_id: myId };
      const list = await base44.entities.Interview.filter(filter, "-created_date", 200);
      setInterviews(list || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [myId]);

  if (!myId) return null;

  const setStatus = async (iv, status, label, notifyUser) => {
    await base44.entities.Interview.update(iv.id, { status });
    if (notifyUser) {
      try {
        if (role === "student") {
          const comps = await base44.entities.CompanyProfile.filter({ id: iv.company_id });
          if (comps[0]?.user_id) await notify(comps[0].user_id, "Interview response", `${studentProfile.full_name} ${label} the interview for ${iv.job_title}.`, "interview_response", "/interviews");
        } else {
          const studs = await base44.entities.StudentProfile.filter({ id: iv.student_id });
          if (studs[0]?.user_id) await notify(studs[0].user_id, "Interview update", `${companyProfile.company_name} updated your interview for ${iv.job_title}: ${label}.`, "interview_update", "/interviews");
        }
      } catch {}
    }
    load();
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Interviews" subtitle="Schedule, join, and manage online interviews." />
      {loading ? (
        <div className="text-sm text-muted-foreground py-10">Loading…</div>
      ) : interviews.length === 0 ? (
        <EmptyState icon={Video} title="No interviews" description="Interview invitations and scheduled meetings will appear here." />
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => (
            <div key={iv.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{iv.job_title}</h3>
                    <StatusBadge status={iv.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{role === "student" ? iv.company_name : iv.student_name}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" /> {iv.date || "TBD"}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {iv.time || "TBD"}</span>
                  </div>
                  {iv.instructions && <p className="text-sm text-muted-foreground mt-2 italic">"{iv.instructions}"</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button asChild size="sm"><Link to={`/interviews/${iv.id}`}><Video className="w-4 h-4 mr-1" /> Join room</Link></Button>
                  {role === "student" && iv.status === "invitation_sent" && (
                    <>
                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200" onClick={() => setStatus(iv, "confirmed", "confirmed", true)}><CheckCircle2 className="w-4 h-4 mr-1" /> Accept</Button>
                      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200" onClick={() => setStatus(iv, "cancelled", "declined", true)}><XCircle className="w-4 h-4 mr-1" /> Decline</Button>
                    </>
                  )}
                  {role === "company" && iv.status !== "completed" && iv.status !== "cancelled" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setStatus(iv, "in_progress", "started", false)}>Start</Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setStatus(iv, "completed", "completed", true)}><CheckCircle2 className="w-4 h-4 mr-1" /> Complete</Button>
                      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200" onClick={() => setStatus(iv, "cancelled", "cancelled", true)}>Cancel</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
