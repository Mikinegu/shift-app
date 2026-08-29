import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import { adminNotify } from "@/lib/notify";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2, Upload, CheckCircle2, Save, RefreshCw } from "lucide-react";

const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "Other", "Graduated"];
const EMP_TYPES = ["Part-time", "Full-time", "Internship"];

export default function StudentProfilePage() {
  const { studentProfile } = useProfile();
  const [form, setForm] = useState(null);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (studentProfile) {
      setForm({ ...studentProfile });
      setSkills(studentProfile.skills || []);
    }
  }, [studentProfile]);

  if (!studentProfile) return null;
  if (!form) return null;

  const f = (key) => ({ value: form[key] || "", onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  const upload = async (key, file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, [key]: file_url });
  };
  const uploadDoc = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, verification_docs: [...(form.verification_docs || []), file_url] });
  };

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillInput("");
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.StudentProfile.update(studentProfile.id, { ...form, skills });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resubmit = async () => {
    setResubmitting(true);
    try {
      await base44.entities.StudentProfile.update(studentProfile.id, { verification_status: "pending" });
      await adminNotify("student_verification", "Student resubmitted for verification", `${form.full_name} resubmitted their profile for review.`, "StudentProfile", studentProfile.id);
      setForm({ ...form, verification_status: "pending" });
    } catch (e) {
      alert(e.message || "Failed");
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Keep your profile up to date to improve your matches."
        actions={<div className="flex items-center gap-2"><StatusBadge status={form.verification_status} />{saved && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}</div>}
      />

      {form.verification_status === "rejected" && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
          <p className="text-sm text-rose-700">Your verification was rejected. Update your information and resubmit for review.</p>
          <Button size="sm" onClick={resubmit} disabled={resubmitting}>{resubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />} Resubmit</Button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input className="mt-1.5" {...f("full_name")} /></div>
          <div><Label>Phone</Label><Input className="mt-1.5" {...f("phone")} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>University</Label><Input className="mt-1.5" {...f("university")} /></div>
          <div><Label>Student ID</Label><Input className="mt-1.5" {...f("student_id")} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Major</Label><Input className="mt-1.5" {...f("major")} /></div>
          <div>
            <Label>Year of study</Label>
            <Select value={form.year_of_study} onValueChange={(v) => setForm({ ...form, year_of_study: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Expected graduation</Label><Input type="date" className="mt-1.5" {...f("graduation_date")} /></div>
          <div><Label>Preferred job field</Label><Input className="mt-1.5" {...f("job_field")} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Preferred employment type</Label>
            <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{EMP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Location</Label><Input className="mt-1.5" {...f("location")} /></div>
        </div>

        <div>
          <Label>Skills</Label>
          <div className="flex gap-2 mt-1.5">
            <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Add skill" />
            <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm border border-indigo-100">{s}<button onClick={() => setSkills(skills.filter((x) => x !== s))}>×</button></span>
              ))}
            </div>
          )}
        </div>

        <div><Label>Experience</Label><Textarea className="mt-1.5" rows={3} {...f("experience")} /></div>
        <div><Label>Bio</Label><Textarea className="mt-1.5" rows={2} {...f("bio")} /></div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>CV / Resume</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm cursor-pointer hover:bg-slate-50"><Upload className="w-4 h-4" /> {form.cv_url ? "Replace" : "Upload"}<input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files[0] && upload("cv_url", e.target.files[0])} /></label>
              {form.cv_url && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /></span>}
            </div>
          </div>
          <div>
            <Label>Profile photo</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm cursor-pointer hover:bg-slate-50"><Upload className="w-4 h-4" /> {form.photo_url ? "Replace" : "Upload"}<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && upload("photo_url", e.target.files[0])} /></label>
              {form.photo_url && <img src={form.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />}
            </div>
          </div>
        </div>

        <div>
          <Label>Enrollment proof documents</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm cursor-pointer hover:bg-slate-50"><Upload className="w-4 h-4" /> Add document<input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files[0] && uploadDoc(e.target.files[0])} /></label>
            <span className="text-sm text-muted-foreground">{(form.verification_docs || []).length} file(s)</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save profile</Button>
        </div>
      </div>
    </div>
  );
}
