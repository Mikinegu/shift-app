import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import { adminNotify } from "@/lib/notify";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";

const EMP_TYPES = ["Part-time", "Full-time", "Internship"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const YEARS = ["Any", "1st year", "2nd year", "3rd year", "4th year", "Other", "Graduated"];

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companyProfile } = useProfile();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", required_major: "", required_education: "",
    year_preference: "Any", employment_type: "Full-time", salary: "", location: "",
    work_mode: "On-site", positions: 1, deadline: "", requirements: "", responsibilities: ""
  });

  useEffect(() => {
    if (!id) return;
    let active = true;
    base44.entities.Job.get(id).then((j) => {
      if (!active) return;
      setForm({
        title: j.title || "", description: j.description || "", required_major: j.required_major || "",
        required_education: j.required_education || "", year_preference: j.year_preference || "Any",
        employment_type: j.employment_type || "Full-time", salary: j.salary || "", location: j.location || "",
        work_mode: j.work_mode || "On-site", positions: j.positions || 1, deadline: j.deadline || "",
        requirements: j.requirements || "", responsibilities: j.responsibilities || ""
      });
      setSkills(j.required_skills || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (!companyProfile) return null;
  if (loading) return <div className="p-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillInput("");
  };

  const submit = async () => {
    setError("");
    if (!form.title) { setError("Job title is required."); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        positions: Number(form.positions) || 1,
        required_skills: skills,
        company_id: companyProfile.id,
        company_name: companyProfile.company_name,
        company_logo: companyProfile.logo_url || "",
        org_type: companyProfile.org_type
      };
      if (id) {
        await base44.entities.Job.update(id, payload);
      } else {
        payload.status = "pending";
        const job = await base44.entities.Job.create(payload);
        await adminNotify("job_approval", "New job awaiting approval", `${companyProfile.company_name} posted "${form.title}".`, "Job", job.id);
      }
      navigate("/company/jobs");
    } catch (e) {
      setError(e.message || "Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <PageHeader title={id ? "Edit job" : "Post a new job"} subtitle="Jobs are reviewed by our admin team before they go live." />

      {error && <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-100">{error}</div>}

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <div><Label>Job title *</Label><Input className="mt-1.5" {...f("title")} placeholder="Junior Architect Intern" /></div>
        <div><Label>Job description</Label><Textarea className="mt-1.5" rows={4} {...f("description")} placeholder="Describe the role and what the student will do…" /></div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Required major / field</Label><Input className="mt-1.5" {...f("required_major")} placeholder="Architecture" /></div>
          <div><Label>Required education level</Label><Input className="mt-1.5" {...f("required_education")} placeholder="Bachelor's (ongoing)" /></div>
        </div>

        <div>
          <Label>Required skills</Label>
          <div className="flex gap-2 mt-1.5">
            <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Add a skill and press Enter" />
            <Button type="button" variant="outline" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm border border-indigo-100">
                  {s}<button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Employment type</Label>
            <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{EMP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Work mode</Label>
            <Select value={form.work_mode} onValueChange={(v) => setForm({ ...form, work_mode: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{WORK_MODES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Year preference</Label>
            <Select value={form.year_preference} onValueChange={(v) => setForm({ ...form, year_preference: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div><Label>Salary / payment</Label><Input className="mt-1.5" {...f("salary")} placeholder="Negotiable / 15,000 ETB/mo" /></div>
          <div><Label>Location</Label><Input className="mt-1.5" {...f("location")} placeholder="Addis Ababa" /></div>
          <div><Label>Number of positions</Label><Input type="number" min="1" className="mt-1.5" {...f("positions")} /></div>
        </div>

        <div><Label>Application deadline</Label><Input type="date" className="mt-1.5" {...f("deadline")} /></div>

        <div><Label>Requirements</Label><Textarea className="mt-1.5" rows={3} {...f("requirements")} placeholder="What the student needs to have or demonstrate…" /></div>
        <div><Label>Responsibilities</Label><Textarea className="mt-1.5" rows={3} {...f("responsibilities")} placeholder="What the student will be responsible for…" /></div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => navigate("/company/jobs")}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : id ? "Save changes" : "Submit for approval"}
          </Button>
        </div>
      </div>
    </div>
  );
}
