import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import { Image } from "@/components/ui/image";
import {
  ArrowRight, GraduationCap, Building2, ShieldCheck, Target, Video,
  Sparkles, CheckCircle2, MessageSquare, Lock, Handshake, Flag
} from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";
const BENEFIT_IMG = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

const steps = [
  { icon: GraduationCap, title: "Create your profile", text: "Students build a verified profile with their university, major, skills, and CV." },
  { icon: ShieldCheck, title: "Get verified", text: "Our admin team reviews enrollment proof so companies can trust every student." },
  { icon: Target, title: "Get matched", text: "Shift recommends jobs that fit your field, skills, and year of study." },
  { icon: Handshake, title: "Apply & interview", text: "Apply in one click, chat with companies, and join online interviews." },
];

const studentBenefits = [
  "Gain real work experience before you graduate",
  "Get matched to jobs aligned with your major",
  "Build a verified, trusted profile employers respect",
  "Apply once, track every application in one place",
  "Practice with interview invitations and feedback",
  "Receive hiring decisions directly in the platform",
];

const companyBenefits = [
  "Reach verified students from real universities",
  "Post jobs that only go live after admin approval",
  "Filter applicants by major, year, skills, and experience",
  "Shortlist, message, and invite students to interview",
  "Run online interviews without leaving the platform",
  "Make final hiring decisions you fully control",
];

const safety = [
  { icon: ShieldCheck, title: "Identity verification", text: "Students submit enrollment proof; companies submit registration details. Admins review both." },
  { icon: Lock, title: "Secure by design", text: "Role-based access, password hashing, email verification, and audit logs for every admin action." },
  { icon: Flag, title: "Report & moderate", text: "Report fake jobs, suspicious users, or inappropriate messages. Admins review every report." },
];

const features = [
  { icon: Target, title: "Smart job matching", text: "Match scores combine your major, skills, employment type, year, and location into one clear percentage." },
  { icon: Video, title: "Online interviews", text: "Schedule and join video interviews between company and student — no external tools required." },
  { icon: MessageSquare, title: "Secure messaging", text: "Chat with the other party after an application, with read receipts and report/block controls." },
  { icon: Sparkles, title: "Shift Bot AI", text: "Ask for job recommendations, profile tips, interview prep, or help writing a job posting." },
];

function Section({ children, className = "" }) {
  return <section className={`px-6 lg:px-12 ${className}`}>{children}</section>;
}

export default function Landing() {
  const { isAuthenticated, authChecked, user } = useAuth();
  const dashboardPath = (() => {
    const role = user?.role;
    if (role === "admin") return "/admin";
    if (role === "company") return "/company";
    if (role === "student") return "/student";
    return "/onboarding";
  })();

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
        <Section className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#benefits" className="hover:text-foreground">Benefits</a>
            <a href="#safety" className="hover:text-foreground">Safety</a>
            <a href="#features" className="hover:text-foreground">Features</a>
          </nav>
          <div className="flex items-center gap-2">
            {authChecked && isAuthenticated ? (
              <Link to={dashboardPath} className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors inline-flex items-center gap-1.5">
                Go to dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-foreground">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors">Register</Link>
              </>
            )}
          </div>
        </Section>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl" aria-hidden />
        <div className="absolute top-40 -left-24 w-80 h-80 rounded-full bg-blue-900/5 blur-3xl" aria-hidden />
        <Section className="relative max-w-7xl mx-auto pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-sm font-medium border border-blue-100">
                <Sparkles className="w-4 h-4" /> Student-to-employment platform
              </span>
              <h1 className="mt-6 text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                From Surviving <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-teal-500 bg-clip-text text-transparent">to Thriving.</span>
              </h1>
              <p className="mt-6 text-lg lg:text-xl text-slate-600 max-w-xl leading-relaxed">
                Shift connects verified university students with companies looking for talent. Start building
                your career before you graduate — and let companies find students whose education and skills
                truly match the role.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/10">
                  Enter & Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-border text-foreground font-semibold hover:bg-slate-50 transition-colors">
                  <Building2 className="w-4 h-4" /> Hire Students
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-600" /> Verified students only</span>
                <span className="inline-flex items-center gap-2"><Lock className="w-4 h-4 text-teal-600" /> Admin-approved companies</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-blue-900/10 to-teal-400/20 blur-xl" aria-hidden />
              <div className="relative rounded-[2rem] overflow-hidden border border-border shadow-2xl shadow-blue-900/10 bg-white">
                <Image
                  src={HERO_IMG}
                  alt="A professional connecting with the Shift network"
                  fittingType="fill"
                  className="w-full h-[360px] sm:h-[460px] lg:h-[520px]"
                />
              </div>
              <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-border px-4 py-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-600">
                  <Handshake className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">Trusted connections</div>
                  <div className="text-xs text-slate-500">Campus → Career</div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* How it works */}
      <Section id="how" className="max-w-7xl mx-auto py-20 border-t border-border">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-teal-600 uppercase tracking-wider">How it works</span>
          <h2 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">A simple, trusted path from campus to career</h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900 text-white">
                <s.icon className="w-6 h-6" />
              </div>
              <div className="mt-4 text-xs font-semibold text-teal-600">STEP {i + 1}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Benefits */}
      <Section id="benefits" className="max-w-7xl mx-auto py-20 border-t border-border">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
            <div className="inline-flex items-center gap-2 text-blue-800 font-semibold">
              <GraduationCap className="w-5 h-5" /> For students
            </div>
            <h3 className="mt-3 text-2xl font-bold">Find work that fits what you study</h3>
            <ul className="mt-6 space-y-3">
              {studentBenefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-lg min-h-[320px]">
            <Image
              src={BENEFIT_IMG}
              alt="A student ready to connect with employers"
              fittingType="fill"
              className="w-full h-full min-h-[320px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-blue-900/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="inline-flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <Building2 className="w-5 h-5" /> For companies
              </div>
              <h3 className="mt-2 text-2xl font-bold">Hire verified students, faster</h3>
              <ul className="mt-4 space-y-2">
                {companyBenefits.slice(0, 4).map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-blue-50">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Safety */}
      <Section id="safety" className="max-w-7xl mx-auto py-20 border-t border-border">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Trust & safety</span>
          <h2 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">Verification & safety first</h2>
          <p className="mt-3 text-slate-600">Trust is the foundation of every connection on Shift.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {safety.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-600">
                <s.icon className="w-6 h-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section id="features" className="max-w-7xl mx-auto py-20 border-t border-border">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Features</span>
          <h2 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">Everything you need to hire and get hired</h2>
          <p className="mt-3 text-slate-600">Matching, interviews, messaging, and an AI assistant — all in one place.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <f.icon className="w-6 h-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-teal-600" aria-hidden />
        <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />
        <Section className="relative max-w-7xl mx-auto py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">Ready to make the Shift?</h2>
            <p className="mt-3 text-blue-100">Join thousands of students and companies building careers together.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {authChecked && isAuthenticated ? (
                <Link to={dashboardPath} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-900 font-semibold hover:bg-blue-50 transition-colors shadow-lg">
                  Go to dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-900 font-semibold hover:bg-blue-50 transition-colors shadow-lg">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white border border-white/30 font-semibold hover:bg-white/20 transition-colors">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-slate-50">
        <Section className="max-w-7xl mx-auto py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-sm text-slate-500">SHIFT — From Surviving to Thriving.</p>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Shift. All rights reserved.</p>
        </Section>
      </footer>
    </div>
  );
}
