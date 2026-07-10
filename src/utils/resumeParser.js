const SECTION_HEADERS = [
  "Summary",
  "Professional Summary",
  "Objective",
  "Experience",
  "Professional Experience",
  "Projects",
  "Education",
  "Skills",
  "Technical Skills",
  "Certifications",
  "Languages",
  "Achievements",
  "Awards",
  "Interests",
];

function isSection(line) {
  return SECTION_HEADERS.some(
    (header) =>
      line.trim().toLowerCase() ===
        header.toLowerCase() ||
      line.trim().toLowerCase() ===
        `${header.toLowerCase()}:`
  );
}

export function parseResumeSections(text = "") {
  if (!text.trim()) {
    return [
      {
        title: "Resume",
        content: [],
      },
    ];
  }

  const sections = [];

  let current = {
    title: "Resume",
    content: [],
  };

  const lines = text.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) return;

    if (isSection(trimmed)) {
      if (current.content.length) {
        sections.push(current);
      }

      current = {
        title: trimmed.replace(":", ""),
        content: [],
      };

      return;
    }

    current.content.push(trimmed);
  });

  if (current.content.length) {
    sections.push(current);
  }

  return sections;
}