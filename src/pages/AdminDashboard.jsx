import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  GraduationCap, Building2, Briefcase, FileText, Video, Award, ShieldAlert,
  Flag, ClipboardCheck, Bell, ArrowRight, TrendingUp
} from "lucide-react";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#f59e0b", "#3b82f6", "#10b981", "#f43f5e"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [students, companies, jobs, apps, interviews, reports, notifs] = await Promise.all([
          base44.entities.StudentProfile.list("-created_date", 1000),
          base44.entities.CompanyProfile.list("-created_date", 1000),
          base44.entities.Job.list("-created_date", 1000),
          base44.entities.Application.list("-created_date", 1000),
          base44.entities.Interview.list("-created_date", 1000),
          base44.entities.Report.list("-created_date", 1000),
          base44.entities.AdminNotification.filter({ status: "pending" }, "-created_date", 10),
        ]);
        if (!active) return;
        setData({ students, companies, jobs, apps, interviews, reports });
        setAdminNotifs(notifs || []);
      } catch (e) {}
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="p-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  }

  const students = data?.students || [];
  const companies = data?.companies || [];
  const jobs = data?.jobs || [];
  const apps = data?.apps || [];
  const interviews = data?.interviews || [];
  const reports = data?.reports || [];

  const verifiedStudents = students.filter((s) => s.verification_status === "verified").length;
  const pendingStudents = students.filter((s) => s.verification_status === "pending").length;
  const verifiedCompanies = companies.filter((c) => c.verification_status === "verified").length;
  const pendingCompanies = companies.filter((c) => c.verification_status === "pending").length;
  const activeJobs = jobs.filter((j) => j.status === "approved").length;
  const pendingJobs = jobs.filter((j) => j.status === "pending").length;
  const hires = apps.filter((a) => a.status === "accepted").length;
  const rejections = apps.filter((a) => a.status === "rejected").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;

  const statusData = [
    { name: "Applied", value: apps.filter((a) => a.status === "applied").length },
    { name: "Under Review", value: apps.filter((a) => a.status === "under_review").length },
    { name: "Shortlisted", value: apps.filter((a) => a.status === "shortlisted").length },
    { name: "Interview", value: apps.filter((a) => a.status === "interview").length },
    { name: "Accepted", value: hires },
    { name: "Rejected", value: rejections },
  ].filter((d) => d.value > 0);

  const overviewData = [
    { name: "Students", value: students.length },
    { name: "Companies", value: companies.length },
    { name: "Jobs", value: jobs.length },
    { name: "Apps", value: apps.length },
    { name: "Interviews", value: interviews.length },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Monitor and moderate the Shift platform."
        actions={
          <Link to="/admin/verification" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            <ClipboardCheck className="w-4 h-4" /> Review queue
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Total students" value={students.length} accent="indigo" />
        <StatCard icon={ShieldAlert} label="Pending students" value={pendingStudents} accent="amber" />
        <StatCard icon={Building2} label="Total companies" value={companies.length} accent="violet" />
        <StatCard icon={ShieldAlert} label="Pending companies" value={pendingCompanies} accent="amber" />
        <StatCard icon={Briefcase} label="Total jobs" value={jobs.length} accent="blue" />
        <StatCard icon={TrendingUp} label="Active jobs" value={activeJobs} accent="emerald" />
        <StatCard icon={FileText} label="Applications" value={apps.length} accent="indigo" />
        <StatCard icon={Video} label="Interviews" value={interviews.length} accent="violet" />
        <StatCard icon={Award} label="Hires" value={hires} accent="emerald" />
        <StatCard icon={Flag} label="Reports" value={pendingReports} accent="rose" />
        <StatCard icon={ClipboardCheck} label="Jobs pending" value={pendingJobs} accent="amber" />
        <StatCard icon={ShieldAlert} label="Rejections" value={rejections} accent="rose" />
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Platform overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Application statuses</h3>
          {statusData.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-600" /> Recent admin notifications</h2>
          <Link to="/admin/notifications" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        {adminNotifs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending notifications.</p>
        ) : (
          <div className="space-y-3">
            {adminNotifs.map((n) => (
              <div key={n.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                </div>
                <StatusBadge status={n.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
