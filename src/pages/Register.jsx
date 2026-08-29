import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, GraduationCap, Building2, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

// Step 1 — role picker
function RolePicker({ onSelect }) {
  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Choose your account type to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <button
          onClick={() => onSelect("student")}
          className="text-left p-5 rounded-2xl border-2 border-border hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <GraduationCap className="w-5 h-5" />
          </span>
          <h3 className="mt-3 text-base font-semibold">I'm a Student</h3>
          <p className="mt-1 text-sm text-muted-foreground">Find jobs and internships that match your studies.</p>
        </button>

        <button
          onClick={() => onSelect("company")}
          className="text-left p-5 rounded-2xl border-2 border-border hover:border-violet-500 hover:bg-violet-50/40 transition-colors group focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
            <Building2 className="w-5 h-5" />
          </span>
          <h3 className="mt-3 text-base font-semibold">I'm a Company</h3>
          <p className="mt-1 text-sm text-muted-foreground">Hire verified students and post opportunities.</p>
        </button>
      </div>
    </AuthLayout>
  );
}

export default function Register() {
  // step: "role" | "credentials" | "otp"
  const [step, setStep] = useState("role");
  const [role, setRole] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const roleLabel = role === "student" ? "Student" : "Company";
  const roleColor = role === "student" ? "indigo" : "violet";
  const RoleIcon = role === "student" ? GraduationCap : Building2;

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    setStep("credentials");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password, role });
      setStep("otp");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Send to onboarding to fill in profile details
      window.location.href = "/onboarding";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    // Pass the selected role as a query param so the OAuth callback can store it
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  // ── Step 1: Role picker ──────────────────────────────────────────────────
  if (step === "role") {
    return <RolePicker onSelect={handleSelectRole} />;
  }

  // ── Step 2: OTP verification ─────────────────────────────────────────────
  if (step === "otp") {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle={`We sent a 6-digit code to ${email}`}>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & continue"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Resend
          </button>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          <button
            onClick={() => { setStep("credentials"); setOtpCode(""); setError(""); }}
            className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </p>
      </AuthLayout>
    );
  }

  // ── Step 2: Credentials form (role already chosen) ───────────────────────
  return (
    <AuthLayout
      icon={RoleIcon}
      title={`Create your ${roleLabel} account`}
      subtitle={role === "student" ? "Sign up to find jobs and internships" : "Sign up to post jobs and hire students"}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {/* Role badge + back */}
      <div className="flex items-center justify-between mb-5">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            role === "student"
              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
              : "bg-violet-50 text-violet-700 border border-violet-100"
          }`}
        >
          <RoleIcon className="w-3.5 h-3.5" />
          {roleLabel} account
        </span>
        <button
          onClick={() => { setStep("role"); setError(""); }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Change
        </button>
      </div>

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
