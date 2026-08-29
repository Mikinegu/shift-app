import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/profile";
import { adminNotify } from "@/lib/notify";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { GraduationCap, Building2, ArrowRight, ArrowLeft, Loader2, Upload, CheckCircle2 } from "lucide-react";

const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "Other", "Graduated"];
const EMP_TYPES = ["Part-time", "Full-time", "Internship"];
const ORG_TYPES = ["Private", "Public", "NGO", "Government", "Other"];

function SkillInput({ skills, setSkills }) {
  const [val, setVal] = useState("");
  const add = () => {
    const v = val.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setVal("");
  };
  return (
    <div>
      <Label>Skills</Label>
      <div className="flex gap-2 mt-1.5">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="e.g. AutoCAD, Python, Excel"
        />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm border border-indigo-100">
              {s}
              <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-indigo-400 hover:text-indigo-700">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FileUpload({ label, accept, onUpload, url, hint }) {
  const [busy, setBusy] = useState(false);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpload(file_url);
    } catch (err) {
      alert("Upload failed: " + (err.message || "try again"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-3">
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-sm font-medium cursor-pointer hover:bg-slate-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {url ? "Replace" : "Upload"}
          <input type="file" accept={accept} className="hidden" onChange={handle} />
        </label>
        {url && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Uploaded</span>}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

export default function Onboarding() {
  const { user } = useAuth();
  const { role, loading } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState("role");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // student form
  const [sForm, setSForm] = useState({
    full_name: user?.full_name || "", phone: "", university: "", student_id: "",
    major: "", year_of_study: "1st year", graduation_date: "", skills: [],
    experience: "", cv_url: "", employment_type: "Internship", job_field: "",
    location: "", photo_url: "", bio: "", verification_docs: []
  });
  // company form
  const [cForm, setCForm] = useState({
    company_name: "", email: user?.email || "", phone: "", website: "",
    org_type: "Private", industry: "", description: "", location: "",
    logo_url: "", contact_person: user?.full_name || "", contact_position: "",
    legal_info: ""
  });

  useEffect(() => {
    if (loading) return;
    if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "student") navigate("/student", { replace: true });
    else if (role === "company") navigate("/company", { replace: true });
  }, [role, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  }
  if (role) return null;

  const submitStudent = async () => {
    setError("");
    if (!sForm.full_name || !sForm.university || !sForm.major) {
      setError("Full name, university, and major are required.");
      return;
    }
    setSaving(true);
    try {
      const profile = await base44.entities.StudentProfile.create({
        ...sForm,
        user_id: user.id,
        verification_status: "pending"
      });
      await adminNotify("student_verification",
        "New student verification request",
        `${sForm.full_name} (${sForm.university}, ${sForm.major}) requested verification.`,
        "StudentProfile", profile.id);
      navigate("/student");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const submitCompany = async () => {
    setError("");
    if (!cForm.company_name || !cForm.industry || !cForm.location) {
      setError("Company name, industry, and location are required.");
      return;
    }
    setSaving(true);
    try {
      const profile = await base44.entities.CompanyProfile.create({
        ...cForm,
        user_id: user.id,
        verification_status: "pending"
      });
      await adminNotify("company_verification",
        "New company verification request",
        `${cForm.company_name} requested verification.`,
        "CompanyProfile", profile.id);
      navigate("/company");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const field = (form, setForm) => (key) => ({
    value: form[key] || "",
    onChange: (e) => setForm({ ...form, [key]: e.target.value })
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <span className="text-sm text-muted-foreground">Welcome to Shift</span>
        </div>

        {step === "role" && (
          <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">Choose your account type</h1>
            <p className="text-muted-foreground mt-2">You can complete this once. You'll be verified by our admin team before full access.</p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <button onClick={() => setStep("student")} className="text-left p-6 rounded-2xl border-2 border-border hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors group">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">I'm a Student</h3>
                <p className="mt-1 text-sm text-muted-foreground">Find jobs and internships that match your studies.</p>
              </button>
              <button onClick={() => setStep("company")} className="text-left p-6 rounded-2xl border-2 border-border hover:border-violet-500 hover:bg-violet-50/40 transition-colors group">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Building2 className="w-6 h-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">I'm a Company</h3>
                <p className="mt-1 text-sm text-muted-foreground">Hire verified students and post opportunities.</p>
              </button>
            </div>
          </div>
        )}

        {step === "student" && (
          <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep("role")} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Student profile</h1>
                <p className="text-sm text-muted-foreground">Tell us about your studies so we can verify and match you.</p>
              </div>
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-100">{error}</div>}
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Full name *</Label><Input className="mt-1.5" {...field(sForm, setSForm)("full_name")} placeholder="Jane Doe" /></div>
                <div><Label>Phone</Label><Input className="mt-1.5" {...field(sForm, setSForm)("phone")} placeholder="+251 ..." /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>University *</Label><Input className="mt-1.5" {...field(sForm, setSForm)("university")} placeholder="Addis Ababa University" /></div>
                <div><Label>Student ID</Label><Input className="mt-1.5" {...field(sForm, setSForm)("student_id")} placeholder="UR/1234/56" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Field of study / Major *</Label><Input className="mt-1.5" {...field(sForm, setSForm)("major")} placeholder="Architecture" /></div>
                <div>
                  <Label>Year of study</Label>
                  <Select value={sForm.year_of_study} onValueChange={(v) => setSForm({ ...sForm, year_of_study: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Expected graduation date</Label><Input type="date" className="mt-1.5" {...field(sForm, setSForm)("graduation_date")} /></div>
                <div><Label>Preferred job field</Label><Input className="mt-1.5" {...field(sForm, setSForm)("job_field")} placeholder="Architecture / Design" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred employment type</Label>
                  <Select value={sForm.employment_type} onValueChange={(v) => setSForm({ ...sForm, employment_type: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{EMP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Location preference</Label><Input className="mt-1.5" {...field(sForm, setSForm)("location")} placeholder="Addis Ababa" /></div>
              </div>
              <SkillInput skills={sForm.skills} setSkills={(skills) => setSForm({ ...sForm, skills })} />
              <div><Label>Experience</Label><Textarea className="mt-1.5" rows={3} {...field(sForm, setSForm)("experience")} placeholder="Internships, projects, part-time work..." /></div>
              <div><Label>Short bio</Label><Textarea className="mt-1.5" rows={2} {...field(sForm, setSForm)("bio")} placeholder="A line or two about you" /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <FileUpload label="CV / Resume (PDF)" accept=".pdf,.doc,.docx" url={sForm.cv_url} onUpload={(cv_url) => setSForm({ ...sForm, cv_url })} hint="Required for applications" />
                <FileUpload label="Profile photo (optional)" accept="image/*" url={sForm.photo_url} onUpload={(photo_url) => setSForm({ ...sForm, photo_url })} />
              </div>
              <FileUpload label="Enrollment proof (student ID card, letter)" accept="image/*,.pdf" url={sForm.verification_docs[0]} onUpload={(u) => setSForm({ ...sForm, verification_docs: [u] })} hint="Used by admins to verify your enrollment" />
              <Button className="w-full h-12" disabled={saving} onClick={submitStudent}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting for verification...</> : <>Submit for verification <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </div>
          </div>
        )}

        {step === "company" && (
          <div className="bg-white rounded-3xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep("role")} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Company profile</h1>
                <p className="text-sm text-muted-foreground">Tell us about your organization so we can verify you.</p>
              </div>
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-100">{error}</div>}
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Company name *</Label><Input className="mt-1.5" {...field(cForm, setCForm)("company_name")} placeholder="ABC Engineering" /></div>
                <div><Label>Company email</Label><Input className="mt-1.5" {...field(cForm, setCForm)("email")} placeholder="info@abc.com" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input className="mt-1.5" {...field(cForm, setCForm)("phone")} placeholder="+251 ..." /></div>
                <div><Label>Website (optional)</Label><Input className="mt-1.5" {...field(cForm, setCForm)("website")} placeholder="https://" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Organization type</Label>
                  <Select value={cForm.org_type} onValueChange={(v) => setCForm({ ...cForm, org_type: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Industry *</Label><Input className="mt-1.5" {...field(cForm, setCForm)("industry")} placeholder="Engineering / Construction" /></div>
              </div>
              <div><Label>Location *</Label><Input className="mt-1.5" {...field(cForm, setCForm)("location")} placeholder="Addis Ababa, Ethiopia" /></div>
              <div><Label>Company description</Label><Textarea className="mt-1.5" rows={3} {...field(cForm, setCForm)("description")} placeholder="What does your company do?" /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Contact person</Label><Input className="mt-1.5" {...field(cForm, setCForm)("contact_person")} placeholder="John Doe" /></div>
                <div><Label>Position of contact</Label><Input className="mt-1.5" {...field(cForm, setCForm)("contact_position")} placeholder="HR Manager" /></div>
              </div>
              <div><Label>Registration / legal information</Label><Textarea className="mt-1.5" rows={2} {...field(cForm, setCForm)("legal_info")} placeholder="Business registration number, license..." /></div>
              <FileUpload label="Company logo" accept="image/*" url={cForm.logo_url} onUpload={(logo_url) => setCForm({ ...cForm, logo_url })} />
              <Button className="w-full h-12" disabled={saving} onClick={submitCompany}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting for verification...</> : <>Submit for verification <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
