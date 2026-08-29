import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/profile";

export default function AdminProtectedRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, user } = useAuth();
  const { role, loading: profileLoading } = useProfile();

  if (isLoadingAuth || profileLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Strictly ensure user is authenticated AND has the admin role
  if (!isAuthenticated || !user || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
