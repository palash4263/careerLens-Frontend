export function formatResumeForDisplay(text) {
  if (!text) return "";

  let formatted = text;

  const sections = [
    "Summary",
    "Experience",
    "Projects",
    "Education",
    "Skills",
    "Technical Skills",
    "Certifications",
    "Languages",
  ];

  sections.forEach((section) => {
    const regex = new RegExp(`(${section}:)`, "gi");

    formatted = formatted.replace(
      regex,
      `\n${section}:`
    );
  });

  formatted = formatted.replace(/•/g, "\n•");

  formatted = formatted.replace(/- /g, "\n• ");

  return formatted;
}