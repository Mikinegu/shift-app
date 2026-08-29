import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { MapPin, Briefcase, Building2, Bookmark, Clock } from "lucide-react";

export default function JobCard({ job, score, saved, onSave, hideCompany }) {
  const deadline = job.deadline ? new Date(job.deadline) : null;
  const expired = deadline && deadline < new Date();
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {job.company_logo ? (
            <img src={job.company_logo} alt="" className="w-11 h-11 rounded-xl object-cover bg-slate-100" />
          ) : (
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600">
              <Building2 className="w-5 h-5" />
            </span>
          )}
          <div className="min-w-0">
            <Link to={`/jobs/${job.id}`} className="font-semibold text-foreground hover:text-indigo-600 line-clamp-1">{job.title}</Link>
            {!hideCompany && <p className="text-sm text-muted-foreground line-clamp-1">{job.company_name}</p>}
          </div>
        </div>
        {typeof score === "number" && (
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${
            score >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
          }`}>{score}% Match</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.employment_type}</span>
        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.work_mode === "Remote" ? "Remote" : job.location || "On-site"}</span>
        {job.salary && <span className="inline-flex items-center gap-1">· {job.salary}</span>}
      </div>

      {job.required_skills && job.required_skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.required_skills.slice(0, 4).map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">{s}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
        <span className={`text-xs inline-flex items-center gap-1 ${expired ? "text-rose-500" : "text-muted-foreground"}`}>
          <Clock className="w-3.5 h-3.5" /> {deadline ? (expired ? "Closed" : `Deadline ${deadline.toLocaleDateString()}`) : "Open"}
        </span>
        <div className="flex items-center gap-2">
          {onSave && (
            <button onClick={onSave} className={`p-2 rounded-lg ${saved ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:bg-slate-100"}`} title="Save job">
              <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
            </button>
          )}
          <Link to={`/jobs/${job.id}`} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">View</Link>
        </div>
      </div>
    </div>
  );
}
