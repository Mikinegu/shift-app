import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import Logo from "@/components/Logo";
import StatusBadge from "@/components/StatusBadge";
import { notify } from "@/lib/notify";
import {
  LayoutDashboard, Briefcase, FileText, Bookmark, MessageSquare, Video,
  Sparkles, User, ShieldCheck, ClipboardCheck, Flag, ScrollText, Bell,
  Menu, X, LogOut, Building2, GraduationCap, CheckCircle2
} from "lucide-react";

const NAV = {
  student: [
    { label: "Dashboard", to: "/student", icon: LayoutDashboard },
    { label: "Find Jobs", to: "/jobs", icon: Briefcase },
    { label: "Applications", to: "/student/applications", icon: FileText },
    { label: "Saved", to: "/student/saved", icon: Bookmark },
    { label: "Messages", to: "/messages", icon: MessageSquare },
    { label: "Interviews", to: "/interviews", icon: Video },
    { label: "Notifications", to: "/notifications", icon: Bell },
    { label: "Shift Bot", to: "/assistant", icon: Sparkles },
    { label: "My Profile", to: "/student/profile", icon: User },
  ],
  company: [
    { label: "Dashboard", to: "/company", icon: LayoutDashboard },
    { label: "My Jobs", to: "/company/jobs", icon: Briefcase },
    { label: "Applications", to: "/company/applications", icon: FileText },
    { label: "Messages", to: "/messages", icon: MessageSquare },
    { label: "Interviews", to: "/interviews", icon: Video },
    { label: "Notifications", to: "/notifications", icon: Bell },
    { label: "Shift Bot", to: "/assistant", icon: Sparkles },
    { label: "Company Profile", to: "/company/profile", icon: Building2 },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Verification", to: "/admin/verification", icon: ShieldCheck },
    { label: "Job Approvals", to: "/admin/jobs", icon: ClipboardCheck },
    { label: "Reports", to: "/admin/reports", icon: Flag },
    { label: "Audit Log", to: "/admin/audit", icon: ScrollText },
    { label: "Notifications", to: "/admin/notifications", icon: Bell },
  ],
};

export default function AppLayout() {
  const { user, role, studentProfile, companyProfile, loading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || role === "admin") return;
    let active = true;
    base44.entities.Notification.filter({ user_id: user.id, read: false })
      .then((n) => { if (active) setUnread((n || []).length); })
      .catch(() => {});
    return () => { active = false; };
  }, [user, role, location.pathname]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!role) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  const items = NAV[role] || [];
  const displayName = role === "student"
    ? studentProfile?.full_name
    : role === "company"
      ? companyProfile?.company_name
      : "Admin";
  const status = role === "student" ? studentProfile?.verification_status : role === "company" ? companyProfile?.verification_status : null;

  const handleLogout = () => {
    base44.auth.logout(role === "admin" ? "/admin/login" : "/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-border flex items-center justify-between px-4 h-16">
        <Logo />
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 bg-white border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <Logo />
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/student" && item.to !== "/company" && item.to !== "/admin" && location.pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.label === "Messages" && unread > 0 && (
                  <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
              {role === "admin" ? <ShieldCheck className="w-5 h-5" /> : (displayName || "U").charAt(0).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{displayName || user?.email}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground capitalize">{role}</span>
                {status && <StatusBadge status={status} className="!px-2 !py-0 !text-[10px]" />}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="lg:pl-72">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
