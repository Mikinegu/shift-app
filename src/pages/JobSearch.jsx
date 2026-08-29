import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import { matchScore } from "@/lib/matching";
import PageHeader from "@/components/PageHeader";
import JobCard from "@/components/JobCard";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Search, Briefcase, SlidersHorizontal } from "lucide-react";

const EMP_TYPES = ["All", "Part-time", "Full-time", "Internship"];
const WORK_MODES = ["All", "Remote", "Hybrid", "On-site"];

export default function JobSearch() {
  const { studentProfile, role } = useProfile();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [emp, setEmp] = useState("All");
  const [mode, setMode] = useState("All");
  const [loc, setLoc] = useState("");
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [allJobs, savedJobs] = await Promise.all([
          base44.entities.Job.filter({ status: "approved" }, "-created_date", 200),
          studentProfile ? base44.entities.SavedJob.filter({ student_id: studentProfile.id }) : Promise.resolve([]),
        ]);
        if (!active) return;
        setJobs(allJobs || []);
        setSaved(savedJobs || []);
      } catch (e) {}
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [studentProfile]);

  const savedIds = new Set(saved.map((s) => s.job_id));

  const filtered = useMemo(() => {
    let list = jobs;
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter((j) =>
        j.title?.toLowerCase().includes(ql) ||
        j.company_name?.toLowerCase().includes(ql) ||
        j.required_major?.toLowerCase().includes(ql) ||
        (j.required_skills || []).some((s) => s.toLowerCase().includes(ql))
      );
    }
    if (emp !== "All") list = list.filter((j) => j.employment_type === emp);
    if (mode !== "All") list = list.filter((j) => j.work_mode === mode);
    if (loc) {
      const ll = loc.toLowerCase();
      list = list.filter((j) => j.location?.toLowerCase().includes(ll));
    }
    if (studentProfile) {
      list = list.map((j) => ({ ...j, _score: matchScore(studentProfile, j) }));
      list.sort((a, b) => b._score - a._score);
    }
    return list;
  }, [jobs, q, emp, mode, loc, studentProfile]);

  const toggleSave = async (jobId) => {
    if (!studentProfile) return;
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
      <PageHeader title="Find Jobs" subtitle="Browse verified opportunities matched to your profile." />

      <div className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-6">
        <div className="grid lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, company, major, skill…" className="pl-10" />
          </div>
          <div className="lg:col-span-3">
            <Select value={emp} onValueChange={setEmp}>
              <SelectTrigger><SelectValue placeholder="Employment" /></SelectTrigger>
              <SelectContent>{EMP_TYPES.map((t) => <SelectItem key={t} value={t}>{t === "All" ? "All types" : t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue placeholder="Work mode" /></SelectTrigger>
              <SelectContent>{WORK_MODES.map((t) => <SelectItem key={t} value={t}>{t === "All" ? "All modes" : t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Location" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{filtered.length} job{filtered.length !== 1 ? "s" : ""} found</p>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><SlidersHorizontal className="w-3.5 h-3.5" /> Sorted by match</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-10">Loading jobs…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs match your filters" description="Try broadening your search or check back later — companies post new jobs often." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((j) => (
            <JobCard key={j.id} job={j} score={studentProfile ? j._score : undefined} saved={savedIds.has(j.id)} onSave={studentProfile ? () => toggleSave(j.id) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
