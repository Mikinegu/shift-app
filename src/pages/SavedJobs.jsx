import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import PageHeader from "@/components/PageHeader";
import JobCard from "@/components/JobCard";
import EmptyState from "@/components/EmptyState";
import { Bookmark, Briefcase } from "lucide-react";

export default function SavedJobs() {
  const { studentProfile } = useProfile();
  const [saved, setSaved] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentProfile) return;
    let active = true;
    async function load() {
      try {
        const savedJobs = await base44.entities.SavedJob.filter({ student_id: studentProfile.id });
        if (!active) return;
        setSaved(savedJobs || []);
        if (savedJobs.length) {
          const jobLists = await Promise.all(savedJobs.map((s) => base44.entities.Job.get(s.job_id).catch(() => null)));
          setJobs(jobLists.filter(Boolean));
        }
      } catch (e) {}
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [studentProfile]);

  if (!studentProfile) return null;

  const savedIds = new Set(saved.map((s) => s.job_id));
  const toggleSave = async (jobId) => {
    const existing = saved.find((s) => s.job_id === jobId);
    if (existing) {
      await base44.entities.SavedJob.delete(existing.id);
      setSaved(saved.filter((s) => s.id !== existing.id));
      setJobs(jobs.filter((j) => j.id !== jobId));
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader title="Saved Jobs" subtitle="Jobs you've bookmarked for later." />
      {loading ? (
        <div className="text-sm text-muted-foreground py-10">Loading…</div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved jobs" description="Tap the bookmark icon on any job to save it here." action={<Link to="/jobs" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">Browse jobs</Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((j) => <JobCard key={j.id} job={j} saved={savedIds.has(j.id)} onSave={() => toggleSave(j.id)} />)}
        </div>
      )}
    </div>
  );
}
