import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { notify } from "@/lib/notify";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, Building2, CheckCircle2, XCircle, FileText, Eye, Loader2 } from "lucide-react";

export default function AdminVerification() {
  const { user } = useAuth();
  const [tab, setTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        base44.entities.StudentProfile.list("-created_date", 500),
        base44.entities.CompanyProfile.list("-created_date", 500),
      ]);
      setStudents(s || []);
      setCompanies(c || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const audit = async (action, targetType, targetId, details) => {
    try {
      await base44.entities.AuditLog.create({ admin_id: user.id, admin_name: user.email, action, target_type: targetType, target_id: targetId, details });
    } catch {}
  };

  const decide = async (type, profile, status) => {
    const note = notes[profile.id] || "";
    const entity = type === "student" ? "StudentProfile" : "CompanyProfile";
    await base44.entities[entity].update(profile.id, { verification_status: status, admin_notes: note });
    if (profile.user_id) {
      await notify(profile.user_id,
        status === "verified" ? "Account verified" : "Verification rejected",
        status === "verified"
          ? `Congratulations! Your ${type === "student" ? "student" : "company"} account is now verified.`
          : `Your verification was rejected. ${note ? "Reason: " + note : "Please update your information and resubmit."}`,
        status === "verified" ? "account_verified" : "verification_rejected",
        type === "student" ? "/student/profile" : "/company/profile"
      );
    }
    await audit(status === "verified" ? "approve_verification" : "reject_verification", entity, profile.id, `${profile.full_name || profile.company_name}: ${status}${note ? " — " + note : ""}`);
    try {
      const notifs = await base44.entities.AdminNotification.filter({ target_id: profile.id });
      await base44.entities.AdminNotification.bulkUpdate(notifs.map((n) => ({ id: n.id, status: "resolved" })));
    } catch {}
    load();
  };

  const pendingStudents = students.filter((s) => s.verification_status === "pending");
  const pendingCompanies = companies.filter((c) => c.verification_status === "pending");

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader title="Verification" subtitle="Review and approve students and companies." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="students"><GraduationCap className="w-4 h-4 mr-2" /> Students ({pendingStudents.length})</TabsTrigger>
          <TabsTrigger value="companies"><Building2 className="w-4 h-4 mr-2" /> Companies ({pendingCompanies.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          {loading ? <div className="py-10 text-sm text-muted-foreground">Loading…</div>
            : pendingStudents.length === 0 ? <EmptyState icon={CheckCircle2} title="No pending students" description="All student verifications are handled." />
            : <div className="space-y-3">{pendingStudents.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{s.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{s.university} · {s.major} · {s.year_of_study}</p>
                    {s.student_id && <p className="text-xs text-muted-foreground mt-1">Student ID: {s.student_id}</p>}
                    {s.phone && <p className="text-xs text-muted-foreground">Phone: {s.phone}</p>}
                    {s.skills?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{s.skills.slice(0, 6).map((sk) => <span key={sk} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">{sk}</span>)}</div>}
                    {(s.verification_docs || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">{s.verification_docs.map((d, i) => <a key={i} href={d} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"><FileText className="w-3.5 h-3.5" /> Document {i + 1}</a>)}</div>
                    )}
                    {s.cv_url && <a href={s.cv_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"><Eye className="w-3.5 h-3.5" /> View CV</a>}
                  </div>
                  <div className="lg:w-64 space-y-2">
                    <Textarea rows={2} placeholder="Admin notes (optional)…" value={notes[s.id] || ""} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} />
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => decide("student", s, "verified")}><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 flex-1" onClick={() => decide("student", s, "rejected")}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}</div>}
        </TabsContent>

        <TabsContent value="companies">
          {loading ? <div className="py-10 text-sm text-muted-foreground">Loading…</div>
            : pendingCompanies.length === 0 ? <EmptyState icon={CheckCircle2} title="No pending companies" description="All company verifications are handled." />
            : <div className="space-y-3">{pendingCompanies.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      {c.logo_url ? <img src={c.logo_url} className="w-12 h-12 rounded-xl object-cover" /> : <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600"><Building2 className="w-5 h-5" /></span>}
                      <div>
                        <h3 className="font-semibold">{c.company_name}</h3>
                        <p className="text-sm text-muted-foreground">{c.industry} · {c.org_type} · {c.location}</p>
                      </div>
                    </div>
                    {c.description && <p className="text-sm text-muted-foreground mt-2">{c.description}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Contact: {c.contact_person} ({c.contact_position}) · {c.phone || c.email}</p>
                    {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">{c.website}</a>}
                    {c.legal_info && <p className="text-xs text-muted-foreground mt-1">Legal: {c.legal_info}</p>}
                  </div>
                  <div className="lg:w-64 space-y-2">
                    <Textarea rows={2} placeholder="Admin notes (optional)…" value={notes[c.id] || ""} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} />
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => decide("company", c, "verified")}><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 flex-1" onClick={() => decide("company", c, "rejected")}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
