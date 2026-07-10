// src/utils/pdfGenerator.js
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

const MARGIN_X = 46;
const MARGIN_TOP = 44;
const MARGIN_BOTTOM = 40;

// ====== COLOR PALETTE ======
const PRIMARY = rgb(0.1, 0.28, 0.58);
const BLACK = rgb(0.12, 0.12, 0.12);
const DARK_GRAY = rgb(0.32, 0.32, 0.32);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.82, 0.82, 0.85);

// ====== FONT SIZES ======
const SIZE_NAME = 19;
const SIZE_TITLE = 11.5;
const SIZE_CONTACT = 9;
const SIZE_SECTION = 11;
const SIZE_ENTRY_HEADER = 10.5;
const SIZE_SUBTITLE = 9.5;
const SIZE_BODY = 9;

// ====== LINE HEIGHTS ======
const LH_BODY = 12.5;
const LH_ENTRY_HEADER = 13.5;
const LH_SUBTITLE = 13;

// ====== SAFE TEXT HELPER ======
const safeText = (value) => {
  if (value === null || value === undefined || Number.isNaN(value) || value === 'NaN') {
    return '';
  }
  return String(value);
};

// =====================================================================
// EXTRACT CONTACT INFO FROM RESUME TEXT
// =====================================================================
const extractPhoneNumber = (text) => {
  if (!text) return null;
  const patterns = [
    /(?:\+91[\s-]?)?[6-9]\d{9}/g,
    /(?:\+91[\s-]?)?\d{10}/g,
    /Phone[:\s]*([+\d\s-]{10,15})/i,
    /Mobile[:\s]*([+\d\s-]{10,15})/i,
    /Contact[:\s]*([+\d\s-]{10,15})/i,
  ];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      let phone = matches[0].replace(/[^+\d]/g, '');
      if (phone.length === 10) {
        phone = `+91${phone}`;
      }
      return phone;
    }
  }
  return null;
};

const extractEmail = (text) => {
  if (!text) return null;
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
};

const extractLinkedIn = (text) => {
  if (!text) return null;
  const match = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/i);
  return match ? match[0] : null;
};

const extractName = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.length < 50 && !trimmed.includes('@')) {
      if (!trimmed.match(/^(summary|education|experience|skills|projects|contact|phone|email|linkedin|profile)/i)) {
        return trimmed;
      }
    }
  }
  return null;
};

const extractJobTitle = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.length < 60 && 
        /(developer|engineer|analyst|architect|manager|designer|consultant|specialist|lead|intern|full[- ]stack|backend|frontend|data|software|devops|cloud|ml|ai|machine learning)/i.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
};

// =====================================================================
// SECTION HEADER ALIASES
// =====================================================================
const SECTION_ALIASES = {
  Summary: ['Summary', 'Professional Summary', 'Objective', 'Profile'],
  Education: ['Education'],
  Experience: ['Experience', 'Work Experience', 'Professional Experience', 'Employment History'],
  Projects: ['Projects', 'Personal Projects', 'Key Projects'],
  Skills: ['Skills', 'Technical Skills', 'Core Skills', 'Skills Summary'],
  Certifications: ['Certifications', 'Certificates', 'Licenses & Certifications'],
};
const CANONICAL_SECTIONS = Object.keys(SECTION_ALIASES);

const matchSectionHeader = (trimmed) => {
  // Strip markdown formatting symbols like #, *, _
  const cleaned = trimmed.replace(/[\*#_]/g, '').trim();
  for (const canonical of CANONICAL_SECTIONS) {
    for (const alias of SECTION_ALIASES[canonical]) {
      if (new RegExp(`^${alias}:?\\s*$`, 'i').test(cleaned)) {
        return { section: canonical, inlineContent: '' };
      }
      const m = cleaned.match(new RegExp(`^${alias}:\\s*(.+)$`, 'i'));
      if (m) return { section: canonical, inlineContent: m[1].trim() };
    }
  }
  return null;
};

// =====================================================================
// PARSE RESUME SECTIONS
// =====================================================================
const parseResumeSections = (text, userData = {}) => {
  if (!text) return [{ title: 'Summary', content: [] }];

  const sections = [];
  const lines = safeText(text).split('\n');
  let currentSection = null;
  let currentContent = [];

  const filters = [
    userData.userName,
    userData.email,
    userData.phone,
    userData.linkedin,
    'palashmishra47@gmail.com',
    '+91-7428477219',
  ].filter(Boolean).map(s => s.toLowerCase());

  const isRedundant = (line) => {
    const lower = line.toLowerCase();
    
    // Filter out common raw contact row headers and symbols
    if (
      lower.includes('envelope') ||
      lower.includes('phone-alt') ||
      lower.includes('map-marker') ||
      lower.includes('email:') ||
      lower.includes('phone:') ||
      lower.includes('linkedin:') ||
      lower.includes('mobile:') ||
      (lower.includes('@') && lower.includes('|'))
    ) {
      return true;
    }

    if (filters.some(f => lower === f)) return true;
    if (lower.includes('|') && filters.some(f => lower.includes(f))) {
      const parts = lower.split('|').map(p => p.trim());
      if (parts.every(p => filters.some(f => p.includes(f) || f.includes(p) || p.includes('@') || p.includes('phone') || p.includes('envelope') || p.includes('map-marker') || p.includes('noida') || p.includes('india')))) return true;
    }
    return false;
  };

  const flush = () => {
    if (currentSection && currentContent.length > 0) {
      const existing = sections.find(s => s.title === currentSection);
      if (existing) {
        existing.content.push(...currentContent);
      } else {
        sections.push({ title: currentSection, content: [...currentContent] });
      }
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (isRedundant(trimmed)) return;

    const headerMatch = matchSectionHeader(trimmed);
    if (headerMatch) {
      flush();
      currentSection = headerMatch.section;
      currentContent = [];
      if (headerMatch.inlineContent && !isRedundant(headerMatch.inlineContent)) {
        currentContent.push(headerMatch.inlineContent);
      }
      return;
    }

    if (!currentSection) {
      currentSection = 'Summary';
      currentContent = [];
    }

    // Check if this line is a continuation of the previous bullet point
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
    const isHeader = !!matchSectionHeader(trimmed);
    const isDate = /\b(19|20)\d{2}\b/.test(trimmed) || /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(trimmed);
    const hasColon = trimmed.includes(':') && !trimmed.startsWith('•') && !trimmed.startsWith('-');

    if (!isBullet && !isHeader && !isDate && !hasColon && currentContent.length > 0) {
      const lastItem = currentContent[currentContent.length - 1];
      const lastIsBullet = lastItem.startsWith('•') || lastItem.startsWith('-') || lastItem.startsWith('*');
      
      if (lastIsBullet) {
        currentContent[currentContent.length - 1] = `${lastItem} ${trimmed}`;
        return;
      }
    }

    currentContent.push(trimmed);
  });

  flush();
  return sections.length > 0 ? sections : [{ title: 'Resume', content: lines.filter(Boolean) }];
};

// =====================================================================
// HELPER: Make crisp 2-sentence summary
// =====================================================================
const makeCrispSummary = (contentArray) => {
  const fullText = contentArray.join(' ').replace(/\s+/g, ' ').trim();
  if (!fullText) return '';
  
  // Split into sentences using punctuation markers
  const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
  
  // Take first 2 sentences
  const crispText = sentences.slice(0, 2).join(' ').trim();
  return crispText;
};

// =====================================================================
// HELPER: Split label and date
// =====================================================================
const DATE_PATTERN = /((?:[A-Za-z]{3,9}\.?\s+)?\d{4})\s*(?:[-–—]\s*((?:[A-Za-z]{3,9}\.?\s+)?\d{4}|Present))?/i;

const splitLabelAndDate = (text) => {
  const trimmed = safeText(text).trim();
  const match = trimmed.match(DATE_PATTERN);
  if (!match) return { label: trimmed, date: '' };
  const date = match[0].trim();
  const label = trimmed.slice(0, match.index).trim().replace(/[-–—,|]\s*$/, '').trim();
  return { label: label || trimmed, date: label ? date : '' };
};

// =====================================================================
// MAIN PDF GENERATION - ✅ EXPORTED PROPERLY
// =====================================================================
export async function generateResumePDF({
  resumeText,
  fileName = "resume",
  score = 0,
  jobTitle = null,
  email = null,
  phone = null,
  linkedin = null,
  userName = null
}) {
  // Extract contact info from resume text
  const extractedName = extractName(resumeText);
  const extractedJobTitle = extractJobTitle(resumeText);
  const extractedEmail = extractEmail(resumeText);
  const extractedPhone = extractPhoneNumber(resumeText);
  const extractedLinkedIn = extractLinkedIn(resumeText);

  // Use extracted values as priority
  const finalName = extractedName || userName || "Palash Mishra";
  const finalJobTitle = extractedJobTitle || jobTitle || "Full Stack Developer";
  const finalEmail = extractedEmail || email || "palashmishra47@gmail.com";
  const finalPhone = extractedPhone || phone || "+91-7428477219";
  const finalLinkedIn = extractedLinkedIn || linkedin || "linkedin.com/in/palash-mishra-6a68a71aa";

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const boldItalic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);

  const pickFont = (options = {}) => {
    if (options.bold && options.italic) return boldItalic;
    if (options.bold) return bold;
    if (options.italic) return italic;
    return font;
  };

  const sections = parseResumeSections(resumeText, { userName: finalName, email: finalEmail, phone: finalPhone, linkedin: finalLinkedIn });
  const cleanFileName = safeText(fileName).replace(/\.pdf$/i, '');
  const MAX_TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

  // ====== UTILITY METHODS ======
  function addNewPage() {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return { page, cursorY: PAGE_HEIGHT - MARGIN_TOP };
  }

  function drawLine(page, y, color = LIGHT_GRAY, thickness = 0.75) {
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_WIDTH - MARGIN_X, y },
      thickness,
      color,
    });
  }

  function drawText(page, text, x, y, options = {}) {
    const safe = safeText(text);
    if (!safe) return;
    page.drawText(safe, {
      x,
      y,
      size: options.size || SIZE_BODY,
      font: pickFont(options),
      color: options.color || BLACK,
    });
  }

  function textWidth(text, options = {}) {
    return pickFont(options).widthOfTextAtSize(safeText(text), options.size || SIZE_BODY);
  }

  function wrapText(text, maxWidth, options = {}) {
    const safe = safeText(text);
    if (!safe) return [];
    const size = options.size || SIZE_BODY;
    const useFont = pickFont(options);
    const words = safe.split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (useFont.widthOfTextAtSize(test, size) <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawWrappedText(page, text, x, y, maxWidth, options = {}) {
    const lines = wrapText(text, maxWidth, options);
    let currentY = y;
    for (const line of lines) {
      drawText(page, line, x, currentY, options);
      currentY -= options.lineHeight || LH_BODY;
    }
    return currentY;
  }

  function drawBullet(page, text, x, y, maxWidth) {
    const safe = safeText(text);
    if (!safe) return y;
    const bulletIndent = 13;
    drawText(page, '•', x, y, { bold: true, size: SIZE_BODY + 0.5, color: PRIMARY });
    return drawWrappedText(page, safe, x + bulletIndent, y, maxWidth - bulletIndent, {
      size: SIZE_BODY,
      lineHeight: LH_BODY,
    });
  }

  function drawEntryHeaderRow(page, label, date, x, y, maxWidth, options = {}) {
    const labelOptions = { bold: true, size: options.size || SIZE_ENTRY_HEADER, color: options.color || BLACK };
    const dateOptions = { italic: true, size: SIZE_SUBTITLE, color: GRAY };

    if (date) {
      const dateWidth = textWidth(date, dateOptions);
      drawText(page, label, x, y, labelOptions);
      drawText(page, date, PAGE_WIDTH - MARGIN_X - dateWidth, y, dateOptions);
    } else {
      drawText(page, label, x, y, labelOptions);
    }
  }

  function checkPageSpace(cursorY, neededSpace = 50) {
    return cursorY > MARGIN_BOTTOM + neededSpace;
  }

  function ensureSpace(page, cursorY, neededSpace) {
    if (!checkPageSpace(cursorY, neededSpace)) {
      const np = addNewPage();
      return { page: np.page, cursorY: np.cursorY };
    }
    return { page, cursorY };
  }

  // ====== FIRST PAGE ======
  let { page, cursorY } = addNewPage();

  // NAME
  drawText(page, finalName, MARGIN_X, cursorY, { size: SIZE_NAME, bold: true, color: PRIMARY });
  cursorY -= SIZE_NAME + 4;

  // JOB TITLE
  drawText(page, finalJobTitle, MARGIN_X, cursorY, { size: SIZE_TITLE, italic: true, color: PRIMARY });
  cursorY -= SIZE_TITLE + 6;

  // CONTACT INFO
  const contactOptions = { size: SIZE_CONTACT, color: DARK_GRAY };
  const sepOptions = { size: SIZE_CONTACT, color: LIGHT_GRAY };

  const emailW = textWidth(finalEmail, contactOptions);
  const phoneW = textWidth(finalPhone, contactOptions);
  const linkedinW = textWidth(finalLinkedIn, contactOptions);
  const sepW = textWidth('   |   ', sepOptions);
  const totalW = emailW + phoneW + linkedinW + sepW * 2;
  let cx = (PAGE_WIDTH - totalW) / 2;

  drawText(page, finalEmail, cx, cursorY, contactOptions); cx += emailW;
  drawText(page, '   |   ', cx, cursorY, sepOptions); cx += sepW;
  drawText(page, finalPhone, cx, cursorY, contactOptions); cx += phoneW;
  drawText(page, '   |   ', cx, cursorY, sepOptions); cx += sepW;
  drawText(page, finalLinkedIn, cx, cursorY, contactOptions);

  cursorY -= 14;
  drawLine(page, cursorY, PRIMARY, 1);
  cursorY -= 12;

  // ====== SUMMARY / PROFILE SECTION ======
  const summarySection = sections.find(s => s.title.toLowerCase() === 'summary');
  if (summarySection && summarySection.content.length > 0) {
    ({ page, cursorY } = ensureSpace(page, cursorY, 30));
    const crispSummaryText = makeCrispSummary(summarySection.content);
    if (crispSummaryText) {
      cursorY = drawWrappedText(page, crispSummaryText, MARGIN_X, cursorY, MAX_TEXT_WIDTH, {
        size: SIZE_BODY,
        lineHeight: LH_BODY + 1,
        italic: true,
        color: DARK_GRAY,
      });
      cursorY -= 8;
    }
  }

  // ====== SECTIONS (Skip Summary) ======
  for (const section of sections) {
    // Skip Summary section since it was printed above
    if (section.title.toLowerCase() === 'summary') {
      continue;
    }

    ({ page, cursorY } = ensureSpace(page, cursorY, 45));

    drawText(page, section.title.toUpperCase(), MARGIN_X, cursorY, { bold: true, size: SIZE_SECTION, color: PRIMARY });
    cursorY -= 6;
    drawLine(page, cursorY, LIGHT_GRAY, 0.75);
    cursorY -= 10;

    const sectionKey = section.title.toLowerCase();

    for (const rawLine of section.content) {
      const trimmed = safeText(rawLine).trim();
      if (!trimmed) continue;

      ({ page, cursorY } = ensureSpace(page, cursorY, 30));

      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
      const bulletText = isBullet ? trimmed.replace(/^[•-]\s*/, '') : '';

      // ---------- EXPERIENCE ----------
      if (sectionKey.includes('experience')) {
        if (!isBullet && /\d{4}/.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          drawEntryHeaderRow(page, label, date, MARGIN_X, cursorY, MAX_TEXT_WIDTH, { size: SIZE_ENTRY_HEADER, color: BLACK });
          cursorY -= LH_ENTRY_HEADER;
          continue;
        }
        if (!isBullet && /(developer|engineer|intern|analyst)/i.test(trimmed)) {
          drawText(page, trimmed, MARGIN_X, cursorY, { italic: true, size: SIZE_SUBTITLE, color: PRIMARY });
          cursorY -= LH_SUBTITLE;
          continue;
        }
        if (isBullet) {
          cursorY = drawBullet(page, bulletText, MARGIN_X, cursorY, MAX_TEXT_WIDTH);
          cursorY -= 2;
          continue;
        }
      }

      // ---------- PROJECTS ----------
      if (sectionKey.includes('project')) {
        if (trimmed.includes('|')) {
          const parts = trimmed.split('|').map((s) => safeText(s).trim());
          const projectName = parts[0] || '';
          const rest = parts.slice(1).join(' | ');
          const { label: techStack, date } = splitLabelAndDate(rest);
          const displayLabel = techStack ? `${projectName}  |  ${techStack}` : projectName;
          drawEntryHeaderRow(page, displayLabel, date, MARGIN_X, cursorY, MAX_TEXT_WIDTH, { size: SIZE_ENTRY_HEADER, color: PRIMARY, bold: true });
          cursorY -= LH_ENTRY_HEADER;
          continue;
        }
        if (isBullet) {
          cursorY = drawBullet(page, bulletText, MARGIN_X, cursorY, MAX_TEXT_WIDTH);
          cursorY -= 2;
          continue;
        }
      }

      // ---------- EDUCATION ----------
      if (sectionKey.includes('education')) {
        if (/\d{4}/.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          const labelOptions = { italic: true, size: SIZE_SUBTITLE, color: DARK_GRAY };
          const dateOptions = { italic: true, size: SIZE_SUBTITLE, color: GRAY };
          drawText(page, label, MARGIN_X + 10, cursorY, labelOptions);
          if (date) {
            const dw = textWidth(date, dateOptions);
            drawText(page, date, PAGE_WIDTH - MARGIN_X - dw, cursorY, dateOptions);
          }
          cursorY -= LH_SUBTITLE;
          continue;
        }
        if (!isBullet && /^[A-Za-z]/.test(trimmed)) {
          drawText(page, trimmed, MARGIN_X, cursorY, { bold: true, size: SIZE_ENTRY_HEADER });
          cursorY -= LH_ENTRY_HEADER;
          continue;
        }
        cursorY = drawWrappedText(page, trimmed, MARGIN_X + 10, cursorY, MAX_TEXT_WIDTH - 10, { size: SIZE_BODY, lineHeight: LH_BODY });
        cursorY -= 2;
        continue;
      }

      // ---------- SKILLS ----------
      if (sectionKey.includes('skill')) {
        if (trimmed.includes(':')) {
          const [rawLabel, ...restParts] = trimmed.split(':');
          const label = safeText(rawLabel).trim();
          const value = restParts.join(':').trim();
          const labelStr = `${label}: `;
          const labelW = textWidth(labelStr, { bold: true, size: SIZE_BODY });
          drawText(page, labelStr, MARGIN_X, cursorY, { bold: true, size: SIZE_BODY });
          cursorY = drawWrappedText(page, value, MARGIN_X + labelW, cursorY, MAX_TEXT_WIDTH - labelW, {
            size: SIZE_BODY,
            lineHeight: LH_BODY,
          });
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrappedText(page, trimmed, MARGIN_X, cursorY, MAX_TEXT_WIDTH, { size: SIZE_BODY, lineHeight: LH_BODY });
        cursorY -= 2;
        continue;
      }

      // ---------- DEFAULT ----------
      if (isBullet) {
        cursorY = drawBullet(page, bulletText, MARGIN_X, cursorY, MAX_TEXT_WIDTH);
        cursorY -= 2;
        continue;
      }
      cursorY = drawWrappedText(page, trimmed, MARGIN_X, cursorY, MAX_TEXT_WIDTH, { size: SIZE_BODY, lineHeight: LH_BODY });
      cursorY -= 2;
    }
    cursorY -= 6;
  }

  // ====== SAVE PDF ======
  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, `${cleanFileName}_optimized.pdf`);
}