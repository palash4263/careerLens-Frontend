/**
 * Local skill library.
 *
 * Every skill the user adds — typed by hand, quick-added, AI recommended or
 * pulled out of a Job Description — is remembered in localStorage so the next
 * time they build a resume for any JD the app already knows the skill and can
 * suggest / autocomplete it instead of treating it as brand new.
 *
 * Stored shape: { "react": { name: "React", count: 3, lastUsed: 1690000000000 }, ... }
 * The key is the normalized (lowercased, whitespace-collapsed) skill so "aws",
 * "AWS" and "Aws" all resolve to the same remembered entry.
 */

const STORAGE_KEY = "careerlens_skill_library";

export const normalizeSkill = (skill) =>
  String(skill || "").trim().replace(/\s+/g, " ").toLowerCase();

// A real skill is a handful of words at most. Anything longer is a pasted blob
// that was stored whole by mistake — keeping it would let the phrase matcher
// swallow an entire paste as one "skill".
const MAX_SKILL_WORDS = 5;

export const isPlausibleSkill = (skill) => {
  const clean = String(skill || "").trim();
  if (!clean) return false;
  return clean.split(/\s+/).length <= MAX_SKILL_WORDS && clean.length <= 60;
};

export const loadSkillLibrary = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return {};

    // Drop any oversized entries left behind by an earlier paste.
    const cleaned = {};
    let dropped = false;
    Object.entries(parsed).forEach(([key, entry]) => {
      if (entry?.name && isPlausibleSkill(entry.name)) cleaned[key] = entry;
      else dropped = true;
    });
    if (dropped) persist(cleaned);

    return cleaned;
  } catch (e) {
    console.warn("Skill library unreadable, starting fresh:", e);
    return {};
  }
};

const persist = (library) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  } catch (e) {
    console.warn("Could not persist skill library:", e);
  }
};

/** True when this skill has been seen before (case-insensitive). */
export const isKnownSkill = (skill, library = loadSkillLibrary()) =>
  Boolean(library[normalizeSkill(skill)]);

/** The remembered spelling of a skill, or the input unchanged if it's new. */
export const canonicalizeSkill = (skill, library = loadSkillLibrary()) =>
  library[normalizeSkill(skill)]?.name || String(skill || "").trim();

/**
 * Register skills, bumping usage counts for ones already known.
 * Returns the updated library so callers can drop it straight into state.
 */
export const registerSkills = (skillsToAdd) => {
  const list = (Array.isArray(skillsToAdd) ? skillsToAdd : [skillsToAdd])
    .filter(Boolean)
    .filter(isPlausibleSkill);
  if (list.length === 0) return loadSkillLibrary();

  const library = loadSkillLibrary();
  const now = Date.now();

  list.forEach((skill) => {
    const key = normalizeSkill(skill);
    if (!key) return;
    const existing = library[key];
    library[key] = {
      name: existing?.name || String(skill).trim(),
      count: (existing?.count || 0) + 1,
      lastUsed: now,
    };
  });

  persist(library);
  return library;
};

/** Remembered skills, most-used first, for suggestions and autocomplete. */
export const getKnownSkills = (library = loadSkillLibrary()) =>
  Object.values(library)
    .sort((a, b) => (b.count || 0) - (a.count || 0) || (b.lastUsed || 0) - (a.lastUsed || 0))
    .map((entry) => entry.name);

/**
 * Split a pasted blob of skills into individual candidates.
 *
 * Commas, newlines, semicolons, pipes, slashes, bullets and runs of 2+ spaces
 * are treated as separators. A chunk that is still several words long (the
 * common case when a JD is pasted as one space-separated run, e.g.
 * "Spring Boot PostgreSQL Apache Kafka Docker") is then broken up by greedily
 * matching the longest known skill at each position — first against the user's
 * own remembered skills, then a built-in vocabulary of common multi-word ones.
 * Anything left over is kept as-is rather than dropped, so nothing is lost.
 */
const COMMON_MULTIWORD_SKILLS = [
  "Java Concurrency", "System Design", "REST APIs", "Relational Databases", "Schema Design",
  "Query Tuning", "Spring Boot", "Apache Kafka", "GitHub Copilot", "Code Review",
  "High Availability", "Load Testing", "Capacity Planning", "Latency Optimization",
  "Distributed Systems", "Consistency Models", "Distributed Locking", "Eventual Consistency",
  "Delivery Semantics", "JVM Tuning", "Cache Optimization", "Distributed Tracing",
  "SLO Alerting", "Reactive Stacks", "Logistics Routing", "Geospatial Scheduling",
  "Marketplace Allocation", "Machine Learning", "Data Analysis", "Unit Testing",
  "Integration Testing", "API Testing", "Performance Testing", "Test Automation",
  "Object Oriented Programming", "Design Patterns", "Message Queues", "Event Driven Architecture",
  "Microservices Architecture", "Cloud Architecture", "Cloud Security", "Hybrid Cloud",
  "Networking Concepts", "OSI Model", "Problem Solving", "Analytical Thinking",
  "Cross Functional Collaboration", "Stakeholder Management", "Product Strategy",
  "User Research", "Attention to Detail", "Bug Tracking", "Continuous Integration",
  "Continuous Deployment", "Google Cloud", "Node.js", "Next.js", "Vue.js",
  "CI/CD Pipelines", "UI/UX Design",
];

const HARD_SEPARATORS = /[,;|\n\r\t•·]+|\s{2,}|\s+\/\s+/;

export const parseSkillBlob = (text, library = loadSkillLibrary()) => {
  const raw = String(text || "").trim();
  if (!raw) return [];

  // Longest first so "Spring Boot" wins over "Spring".
  // Only short phrases are eligible: a 2-4 word skill is real, a 40-word one is a paste.
  const vocabulary = [...getKnownSkills(library), ...COMMON_MULTIWORD_SKILLS]
    .filter(v => {
      const wordCount = String(v).trim().split(/\s+/).length;
      return wordCount > 1 && wordCount <= 4;
    })
    .sort((a, b) => b.length - a.length);

  const splitRun = (chunk) => {
    const words = chunk.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return words.length ? [chunk] : [];

    const out = [];
    let i = 0;
    while (i < words.length) {
      const match = vocabulary.find((phrase) => {
        const phraseWords = phrase.split(/\s+/);
        if (i + phraseWords.length > words.length) return false;
        return phraseWords.every(
          (pw, k) => normalizeSkill(pw) === normalizeSkill(words[i + k])
        );
      });

      if (match) {
        out.push(match);
        i += match.split(/\s+/).length;
      } else {
        out.push(words[i]);
        i += 1;
      }
    }
    return out;
  };

  const seen = new Set();
  return raw
    .split(HARD_SEPARATORS)
    .map(c => c.trim())
    .filter(Boolean)
    .flatMap(splitRun)
    .map(s => canonicalizeSkill(s.replace(/^[-–—*+\s]+|[.\s]+$/g, ""), library))
    .filter(Boolean)
    .filter((s) => {
      const key = normalizeSkill(s);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const clearSkillLibrary = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Could not clear skill library:", e);
  }
  return {};
};
