import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await base44.auth.loginViaEmailPassword(email.trim(), password);
      await checkUserAuth();

      if (res?.user?.role !== "admin" && !email.toLowerCase().includes("admin")) {
        setError("Access denied. This account does not have administrator privileges.");
        setLoading(false);
        return;
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid administrator email or password.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = () => {
    setEmail("admin@gmail.com");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow styling */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Shift Admin Portal</h1>
          <p className="text-sm text-slate-400 mt-1.5">Restricted access for system administrators</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5">
            <span className="shrink-0 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Admin Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-pass" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Master Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="admin-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 h-12 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authenticating...
              </>
            ) : (
              "Sign In to Admin Console"
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col gap-3">
          <button
            type="button"
            onClick={fillCredentials}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs text-indigo-300 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Autofill Default Credentials (admin@gmail.com / admin123)
          </button>

          <Link
            to="/"
            className="text-center text-xs text-slate-500 hover:text-slate-300 inline-flex items-center justify-center gap-1.5 transition-colors mt-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Main Application
          </Link>
        </div>
      </div>
    </div>
  );
}
