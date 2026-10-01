/**
 * Lightweight, local (no API call) scoring for resume bullet points and
 * per-project JD-skill coverage. Used by the Projects step to give
 * instant feedback while the user types, instead of only after an AI
 * pass runs.
 */

const WEAK_OPENERS = [
  "worked on", "helped with", "responsible for", "involved in", "assisted",
  "was part of", "participated in", "handled", "in charge of", "worked with",
  "did", "helped", "tasked with",
];

// A rough but useful heuristic: resumes read well when the bullet opens with
// a strong past-tense action verb. This isn't exhaustive — it's a nudge, not
// a grammar checker.
const STRONG_VERB_PATTERN = /^[A-Za-z]+(ed|d)\b|^(Led|Built|Cut|Grew|Set|Ran|Sped|Drove)\b/i;

const METRIC_PATTERN = /\d/;

export const scoreBullet = (text) => {
  const trimmed = String(text || "").trim();
  const issues = [];

  if (!trimmed) {
    return { score: 0, issues: ["empty"], label: "empty" };
  }

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const firstWord = trimmed.split(/\s+/)[0] || "";
  const lower = trimmed.toLowerCase();

  const hasMetric = METRIC_PATTERN.test(trimmed);
  const hasWeakOpener = WEAK_OPENERS.some(w => lower.startsWith(w));
  const hasStrongVerb = !hasWeakOpener && STRONG_VERB_PATTERN.test(firstWord);
  const startsWithI = /^i\s|^i'm|^i've/i.test(trimmed);
  const tooShort = wordCount < 8;
  const tooLong = wordCount > 32;

  if (!hasMetric) issues.push("no metric — add a number (%, time saved, scale, count)");
  if (hasWeakOpener) issues.push(`weak opener "${WEAK_OPENERS.find(w => lower.startsWith(w))}" — start with a strong action verb`);
  else if (!hasStrongVerb) issues.push("doesn't clearly open with a past-tense action verb");
  if (startsWithI) issues.push('drop "I" — resumes use implied first person');
  if (tooShort) issues.push("too short — add impact or context");
  if (tooLong) issues.push("too long — tighten to one clear achievement");

  const score = Math.max(0, 5 - issues.length);
  const label = score >= 4 ? "strong" : score >= 2 ? "okay" : "weak";

  return { score, issues, label, hasMetric, wordCount };
};

/**
 * Which target-JD/skill keywords a project's tech + bullets already mention,
 * and which are still missing — the basis of the coverage meter.
 */
export const computeProjectCoverage = (project, targetSkills = []) => {
  const haystack = [
    project?.name,
    project?.tech,
    ...(project?.bullets || []),
  ].join(" ").toLowerCase();

  const covered = [];
  const missing = [];

  targetSkills.forEach((skill) => {
    const needle = String(skill || "").trim().toLowerCase();
    if (!needle) return;
    if (haystack.includes(needle)) covered.push(skill);
    else missing.push(skill);
  });

  return { covered, missing };
};

/** Coverage across every project combined, for the section-level summary bar. */
export const computeOverallCoverage = (projects = [], targetSkills = []) => {
  if (targetSkills.length === 0) return { covered: [], missing: [], percent: 100 };

  const coveredSet = new Set();
  projects.forEach((p) => {
    computeProjectCoverage(p, targetSkills).covered.forEach(s => coveredSet.add(s));
  });

  const covered = targetSkills.filter(s => coveredSet.has(s));
  const missing = targetSkills.filter(s => !coveredSet.has(s));
  const percent = Math.round((covered.length / targetSkills.length) * 100);

  return { covered, missing, percent };
};
