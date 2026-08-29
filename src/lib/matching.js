const FIELD_GROUPS = [
  ["architecture", "construction", "design", "cad", "architectural", "civil engineering", "urban planning"],
  ["computer science", "software", "programming", "it", "data", "ai", "machine learning", "cybersecurity"],
  ["business", "management", "marketing", "finance", "accounting", "economics", "commerce"],
  ["mechanical", "industrial", "manufacturing", "automotive", "mechatronics"],
  ["electrical", "electronics", "telecommunications", "power"],
  ["medicine", "nursing", "pharmacy", "public health", "biology", "biotechnology"],
  ["law", "political science", "international relations"],
  ["education", "teaching", "pedagogy"],
  ["graphic design", "multimedia", "communication", "journalism", "media"],
];

function sameField(a, b) {
  const la = (a || "").toLowerCase();
  const lb = (b || "").toLowerCase();
  if (!la || !lb) return false;
  if (la.includes(lb) || lb.includes(la)) return true;
  for (const group of FIELD_GROUPS) {
    if (group.some((g) => la.includes(g)) && group.some((g) => lb.includes(g))) return true;
  }
  return false;
}

// Returns a 0-100 match score between a student profile and a job.
export function matchScore(student, job) {
  if (!student || !job) return 0;
  let score = 0;
  let total = 0;

  // Field / major — heaviest weight (30)
  total += 30;
  if (job.required_major) {
    if (sameField(student.major, job.required_major)) score += 30;
  } else {
    score += 20;
  }

  // Skills overlap (30)
  total += 30;
  const reqSkills = (job.required_skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const stuSkills = (student.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  if (reqSkills.length) {
    const matched = reqSkills.filter((s) =>
      stuSkills.some((ss) => ss.includes(s) || s.includes(ss))
    ).length;
    score += Math.round(30 * (matched / reqSkills.length));
  } else {
    score += 30;
  }

  // Employment type preference (15)
  total += 15;
  if (student.employment_type && job.employment_type && student.employment_type === job.employment_type) {
    score += 15;
  } else if (!student.employment_type) {
    score += 7;
  }

  // Year preference (10)
  total += 10;
  if (!job.year_preference || job.year_preference === "Any") {
    score += 10;
  } else if (student.year_of_study === job.year_preference) {
    score += 10;
  }

  // Location / work mode (15)
  total += 15;
  if (job.work_mode === "Remote") {
    score += 15;
  } else if (student.location && job.location && sameField(student.location, job.location)) {
    score += 15;
  } else if (!student.location) {
    score += 5;
  }

  return Math.min(100, Math.round((score / total) * 100));
}

export function recommendedJobs(student, jobs) {
  return (jobs || [])
    .map((job) => ({ job, score: matchScore(student, job) }))
    .filter((r) => r.score >= 35)
    .sort((a, b) => b.score - a.score);
}
