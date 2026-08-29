import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

// Determines the active role (student | company | admin) and loads the
// matching profile record for the current user.
export function useProfile() {
  const { user, isAuthenticated, authChecked } = useAuth();
  const [studentProfile, setStudentProfile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      if (user.role === "admin") {
        setLoading(false);
        return;
      }
      try {
        const students = await base44.entities.StudentProfile.filter({ user_id: user.id });
        if (active && students && students.length) {
          setStudentProfile(students[0]);
          setLoading(false);
          return;
        }
        const companies = await base44.entities.CompanyProfile.filter({ user_id: user.id });
        if (active && companies && companies.length) {
          setCompanyProfile(companies[0]);
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore — treat as no profile yet
      }
      if (active) setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [user, authChecked]);

  const role = user?.role === "admin"
    ? "admin"
    : studentProfile
      ? "student"
      : companyProfile
        ? "company"
        : null;

  return { user, studentProfile, companyProfile, role, loading, isAuthenticated, authChecked };
}
