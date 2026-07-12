// src/utils/pdfGenerator.js
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

const PAGE_WIDTH  = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X    = 50;
const MARGIN_TOP  = 40;
const MARGIN_BOTTOM = 46; // keeps text off the very bottom edge

// ====== COLOR PALETTE (Navy + warm gold accent — reads as premium, not corporate-beige) ======
const PRIMARY    = rgb(0.10, 0.16, 0.32);   // deep navy — headings, name
const ACCENT     = rgb(0.72, 0.55, 0.20);   // warm gold — small highlight touches only
const BLACK      = rgb(0.14, 0.16, 0.20);   // body ink
const DARK_GRAY  = rgb(0.32, 0.35, 0.42);   // secondary text
const GRAY       = rgb(0.50, 0.53, 0.60);   // dates / meta
const LIGHT_GRAY = rgb(0.86, 0.87, 0.90);   // hairlines
const RULE_FAINT = rgb(0.90, 0.91, 0.93);

// =====================================================================
// MARKDOWN STRIPPING – removes ALL markdown symbols before rendering
// =====================================================================
const stripMarkdown = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/___(.+?)___/g,       '$1')
    .replace(/\*\*(.+?)\*\*/g,     '$1')
    .replace(/__(.+?)__/g,         '$1')
    .replace(/\*(.+?)\*/g,         '$1')
    .replace(/_(.+?)_/g,           '$1')
    .replace(/^\*+\s*/gm, '')
    .replace(/^\#+\s*/gm, '')
    .replace(/\*+$/gm, '')
    .trim();
};

// =====================================================================
// SAFE TEXT
// =====================================================================
const safeText = (value) => {
  if (value === null || value === undefined || Number.isNaN(value) || value === 'NaN') return '';
  return stripMarkdown(String(value));
};

// Adds visual "tracking" (letter-spacing) for small-caps style headings —
// pdf-lib has no native letter-spacing, so we space the characters ourselves.
const trackedUpper = (text, spaced = true) => {
  const s = safeText(text).toUpperCase();
  return spaced ? s.split('').join('\u200a\u200a') : s;
};

// =====================================================================
// CONTACT EXTRACTORS
// =====================================================================
const extractPhoneNumber = (text) => {
  if (!text) return null;
  const patterns = [
    /\+91[\s-]?[6-9]\d{9}/,
    /\+91[\s-]?\d{10}/,
    /[6-9]\d{9}/,
    /\d{10}/,
    /Phone[:\s]*([+\d\s-]{10,15})/i,
    /Mobile[:\s]*([+\d\s-]{10,15})/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      let phone = (m[1] || m[0]).replace(/[^\d+]/g, '');
      if (phone.length === 10) phone = `+91${phone}`;
      return phone;
    }
  }
  return null;
};

const extractEmail = (text) => {
  if (!text) return null;
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
};

const extractLinkedIn = (text) => {
  if (!text) return null;
  const m = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  return m ? m[0] : null;
};

const extractGitHub = (text) => {
  if (!text) return null;
  const m = text.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  return m ? m[0] : null;
};

const extractName = (rawText) => {
  if (!rawText) return null;
  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = stripMarkdown(line).trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 50) continue;
    if (trimmed.includes('@')) continue;

    const lower = trimmed.toLowerCase();
    if (/(summary|objective|profile|experience|education|skills|projects|certif|language|technolog|contact|phone|email|linkedin|github)/i.test(lower)) continue;

    if (/^[A-Za-z][A-Za-z\s.'-]{2,}$/.test(trimmed)) return trimmed;
  }
  return null;
};

const extractJobTitle = (rawText) => {
  if (!rawText) return null;
  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = stripMarkdown(line).trim();
    if (!trimmed || trimmed.length > 65) continue;
    if (/(school|university|college|academy|institute|international)/i.test(trimmed)) continue;
    if (/\b(developer|engineer|analyst|architect|manager|designer|consultant|specialist|lead|intern|full[- ]?stack|backend|frontend|data\s*scientist|software|devops|cloud|ml\s*engineer|ai\s*engineer)\b/i.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
};

// =====================================================================
// SECTION HEADER DETECTION
// =====================================================================
const SECTION_ALIASES = {
  Summary:        ['Summary', 'Professional Summary', 'Objective', 'Profile', 'About'],
  Education:      ['Education', 'Academic Background'],
  Experience:     ['Experience', 'Work Experience', 'Professional Experience', 'Employment History', 'Career History'],
  Projects:       ['Projects', 'Personal Projects', 'Key Projects', 'Academic Projects'],
  Skills:         ['Skills', 'Technical Skills', 'Core Skills', 'Skills Summary', 'Technologies'],
  Certifications: ['Certifications', 'Certificates', 'Licenses & Certifications', 'Awards & Certifications'],
  Languages:      ['Languages', 'Language Proficiency'],
};
const CANONICAL_SECTIONS = Object.keys(SECTION_ALIASES);

const matchSectionHeader = (rawLine) => {
  const cleaned = stripMarkdown(rawLine).replace(/[:#\-_*]/g, '').trim();
  for (const canonical of CANONICAL_SECTIONS) {
    for (const alias of SECTION_ALIASES[canonical]) {
      if (new RegExp(`^${alias}\\s*$`, 'i').test(cleaned)) {
        return { section: canonical, inlineContent: '' };
      }
      const m = cleaned.match(new RegExp(`^${alias}:\\s*(.+)$`, 'i'));
      if (m) return { section: canonical, inlineContent: m[1].trim() };
    }
  }
  return null;
};

// =====================================================================
// PARSE RESUME TEXT INTO SECTIONS
// =====================================================================
const parseResumeSections = (text, userData = {}) => {
  if (!text) return [];

  const sections   = [];
  const rawLines   = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  const filters = [
    userData.userName,
    userData.email,
    userData.phone,
    userData.linkedin,
  ].filter(Boolean).map(s => s.toLowerCase());

  const isRedundantContactLine = (raw) => {
    const lower = stripMarkdown(raw).toLowerCase();
    if (lower.includes('envelope') || lower.includes('phone-alt') || lower.includes('map-marker')) return true;
    if (/^(email|phone|mobile|linkedin|contact|location|address)\s*:/i.test(lower)) return true;
    if (lower.includes('@') && lower.includes('|')) return true;
    if (filters.length > 0 && filters.some(f => lower === f)) return true;
    return false;
  };

  const SKIP_SCHOOLS_GLOBAL = ['amity international school'];

  const flush = () => {
    if (currentSection && currentContent.length > 0) {
      const existing = sections.find(s => s.title === currentSection);
      if (existing) existing.content.push(...currentContent);
      else          sections.push({ title: currentSection, content: [...currentContent] });
    }
  };

  for (const raw of rawLines) {
    const trimmed = stripMarkdown(raw).trim();
    if (!trimmed) continue;
    if (isRedundantContactLine(raw)) continue;

    const headerMatch = matchSectionHeader(trimmed);
    if (headerMatch) {
      flush();
      currentSection = headerMatch.section;
      currentContent = [];
      if (headerMatch.inlineContent) currentContent.push(headerMatch.inlineContent);
      continue;
    }

    if (!currentSection || currentSection !== 'Education') {
      if (SKIP_SCHOOLS_GLOBAL.some(s => trimmed.toLowerCase().includes(s))) continue;
    }

    if (!currentSection) {
      currentSection = 'Summary';
      currentContent = [];
    }

    const normLine = trimmed.replace(/^[\*\-]\s+/, '• ').replace(/^•\s*/, '• ');
    currentContent.push(normLine);
  }

  flush();
  return sections;
};

// =====================================================================
// DATE HELPER
// =====================================================================
const DATE_PATTERN = /((?:[A-Za-z]{3,9}\.?\s+)?\d{4})\s*(?:[-–—]\s*((?:[A-Za-z]{3,9}\.?\s+)?\d{4}|Present|Current))?/i;

const splitLabelAndDate = (text) => {
  const t = safeText(text).trim();
  const m = t.match(DATE_PATTERN);
  if (!m) return { label: t, date: '' };
  const date  = m[0].trim();
  let label = t.slice(0, m.index).trim();

  label = label
    .replace(/[-–—,|]\s*$/, '')
    .trim()
    .replace(/\(\s*$/, '')
    .replace(/\[\s*$/, '')
    .trim();

  return { label: label || t, date: label ? date : '' };
};

// =====================================================================
// MAIN PDF GENERATION
// =====================================================================
export async function generateResumePDF({
  resumeText,
  fileName = 'resume',
  score    = 0,
  jobTitle = null,
  email    = null,
  phone    = null,
  linkedin = null,
  userName = null,
}) {
  // --- Extract contact info. IMPORTANT: no hardcoded personal fallback data —
  // if nothing can be found/provided, the field is simply omitted rather than
  // silently stamping a stranger's name/email/phone onto someone else's resume.
  const finalName     = userName || extractName(resumeText) || 'Your Name';
  const finalEmail    = extractEmail(resumeText)     || email     || '';
  const finalPhone    = extractPhoneNumber(resumeText) || phone   || '';
  const finalLinkedIn = extractLinkedIn(resumeText)  || linkedin  || '';
  const finalGitHub   = extractGitHub(resumeText)    || '';

  // --- Fonts ---
  const pdf      = await PDFDocument.create();
  const font     = await pdf.embedFont(StandardFonts.Helvetica);
  const bold     = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic   = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const boldItal = await pdf.embedFont(StandardFonts.HelveticaBoldOblique);

  const pickFont = ({ bold: b, italic: i } = {}) => {
    if (b && i) return boldItal;
    if (b)      return bold;
    if (i)      return italic;
    return font;
  };

  const sections     = parseResumeSections(resumeText, { userName: finalName, email: finalEmail, phone: finalPhone, linkedin: finalLinkedIn });
  const cleanFile    = safeText(fileName).replace(/\.pdf$/i, '');
  const MAX_W        = PAGE_WIDTH - MARGIN_X * 2;

  // --- Helpers for text dimensions and wrap ---
  const tw = (text, size, opts = {}) =>
    pickFont(opts).widthOfTextAtSize(safeText(text), size);

  const wrapText = (text, maxWidth, size, opts = {}) => {
    const s = safeText(text);
    if (!s) return [];
    const useFont = pickFont(opts);
    const words   = s.split(' ');
    const lines   = [];
    let cur       = '';
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (useFont.widthOfTextAtSize(test, size) <= maxWidth) {
        cur = test;
      } else {
        if (cur) lines.push(cur);
        if (useFont.widthOfTextAtSize(word, size) > maxWidth) {
          lines.push(word);
          cur = '';
        } else {
          cur = word;
        }
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  // ====================================================================
  // SINGLE PAGE COMPRESSION ALGORITHM (AESTHETIC & LEGIBLE LIMITS)
  // ====================================================================
  const calculateTotalHeight = (sName, sContact, sSection, sEntryHeader, sSubtitle, sBody, lBody, lEntryHeader, lSubtitle, gSec) => {
    let heightNeeded = 0;

    heightNeeded += sName + 8;
    heightNeeded += sContact + 14;
    heightNeeded += 14; // divider rule + breathing room

    for (const section of sections) {
      heightNeeded += 16; // heading + tab spacing overhead
      const key = section.title.toLowerCase();

      for (const rawLine of section.content) {
        const trimmed = safeText(rawLine).trim();
        if (!trimmed) continue;

        const isBullet  = trimmed.startsWith('•');
        const bulletTxt = isBullet ? trimmed.replace(/^•\s*/, '') : '';

        if (key === 'summary') {
          const linesCount = wrapText(trimmed, MAX_W, sBody).length;
          heightNeeded += linesCount * lBody + 2;
          continue;
        }

        if (key.includes('experience')) {
          if (!isBullet && /\d{4}/.test(trimmed)) {
            const { label } = splitLabelAndDate(trimmed);
            const linesCount = wrapText(label, MAX_W - 100, sEntryHeader, { bold: true }).length;
            heightNeeded += linesCount * lEntryHeader + 2;
            continue;
          }
          if (!isBullet && /\b(developer|engineer|intern|analyst|consultant|lead|architect|manager|designer|specialist|devops|sde)\b/i.test(trimmed)) {
            const linesCount = wrapText(trimmed, MAX_W, sSubtitle, { italic: true }).length;
            heightNeeded += linesCount * lSubtitle + 2;
            continue;
          }
          if (isBullet) {
            const linesCount = wrapText(bulletTxt, MAX_W - 16, sBody).length;
            heightNeeded += linesCount * lBody + 2;
            continue;
          }
          const linesCount = wrapText(trimmed, MAX_W, sBody).length;
          heightNeeded += linesCount * lBody + 2;
          continue;
        }

        if (key.includes('project')) {
          if (!isBullet && trimmed.includes('|')) {
            const parts = trimmed.split('|').map(pt => safeText(pt).trim());
            const display = parts[0];
            const linesCount = wrapText(display, MAX_W - 100, sEntryHeader, { bold: true }).length;
            heightNeeded += linesCount * lEntryHeader + 2;
            continue;
          }
          if (!isBullet && /\d{4}/.test(trimmed)) {
            const { label } = splitLabelAndDate(trimmed);
            const linesCount = wrapText(label, MAX_W - 100, sEntryHeader, { bold: true }).length;
            heightNeeded += linesCount * lEntryHeader + 2;
            continue;
          }
          if (!isBullet && trimmed.length < 80) {
            const linesCount = wrapText(trimmed, MAX_W, sEntryHeader, { bold: true }).length;
            heightNeeded += linesCount * lEntryHeader + 2;
            continue;
          }
          if (isBullet) {
            const linesCount = wrapText(bulletTxt, MAX_W - 16, sBody).length;
            heightNeeded += linesCount * lBody + 2;
            continue;
          }
          const linesCount = wrapText(trimmed, MAX_W, sBody).length;
          heightNeeded += linesCount * lBody + 2;
          continue;
        }

        if (key.includes('education')) {
          if (/amity\s+international\s+school/i.test(trimmed)) continue;
          if (/\d{4}/.test(trimmed) && !/(gpa|cgpa|grade|score)/i.test(trimmed)) {
            const { label } = splitLabelAndDate(trimmed);
            const linesCount = wrapText(label, MAX_W - 100, sSubtitle, { italic: true }).length;
            heightNeeded += linesCount * lSubtitle;
            continue;
          }
          if (!isBullet) {
            const linesCount = wrapText(trimmed, MAX_W, sEntryHeader, { bold: true }).length;
            heightNeeded += linesCount * lEntryHeader + 2;
            continue;
          }
          const linesCount = wrapText(trimmed.replace(/^•\s*/, ''), MAX_W - 8, sBody).length;
          heightNeeded += linesCount * lBody + 2;
          continue;
        }

        if (key.includes('skill') || key.includes('technolog')) {
          if (trimmed.includes(':')) {
            const colon  = trimmed.indexOf(':');
            const value  = trimmed.slice(colon + 1).trim();
            const linesCount = wrapText(value, MAX_W - 80, sBody).length;
            heightNeeded += linesCount * lBody + 2;
            continue;
          }
          const linesCount = wrapText(trimmed, MAX_W, sBody).length;
          heightNeeded += linesCount * lBody + 2;
          continue;
        }

        const linesCount = wrapText(trimmed, MAX_W, sBody).length;
        heightNeeded += linesCount * lBody + 2;
      }
      heightNeeded += gSec;
    }

    return heightNeeded;
  };

  // --- Dynamic Layout Metrics ---
  let sizeName        = 23;
  let sizeContact     = 9.0;
  let sizeSection     = 10.6;
  let sizeEntryHeader = 10.2;
  let sizeSubtitle    = 9.6;
  let sizeBody        = 9.4;

  let lhBody        = 13.5;
  let lhEntryHeader = 14.5;
  let lhSubtitle    = 13.5;

  let gapSection = 10.0;
  let marginY = MARGIN_TOP;

  const availableHeight = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;
  let requiredHeight = calculateTotalHeight(sizeName, sizeContact, sizeSection, sizeEntryHeader, sizeSubtitle, sizeBody, lhBody, lhEntryHeader, lhSubtitle, gapSection);

  if (requiredHeight > availableHeight) {
    // Stage 1 compression
    sizeName        = 20;
    sizeContact     = 8.6;
    sizeSection     = 10.0;
    sizeEntryHeader = 9.6;
    sizeSubtitle    = 9.1;
    sizeBody        = 8.8;
    lhBody          = 12.2;
    lhEntryHeader   = 13.2;
    lhSubtitle      = 12.2;
    gapSection      = 7.5;
    requiredHeight = calculateTotalHeight(sizeName, sizeContact, sizeSection, sizeEntryHeader, sizeSubtitle, sizeBody, lhBody, lhEntryHeader, lhSubtitle, gapSection);
  }

  if (requiredHeight > availableHeight) {
    // Stage 2 compression (minimum threshold to stay readable)
    sizeName        = 18;
    sizeContact     = 8.2;
    sizeSection     = 9.4;
    sizeEntryHeader = 9.2;
    sizeSubtitle    = 8.6;
    sizeBody        = 8.2;
    lhBody          = 11.5;
    lhEntryHeader   = 12.2;
    lhSubtitle      = 11.5;
    gapSection      = 5.5;
  }

  // --- Rendering engine ---
  const p = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - marginY;

  const drawLine = (page, y, color = LIGHT_GRAY, thickness = 0.6, x1 = MARGIN_X, x2 = PAGE_WIDTH - MARGIN_X) =>
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });

  const drawRect = (page, x, y, w, h, color) =>
    page.drawRectangle({ x, y, width: w, height: h, color });

  const drawText = (page, text, x, y, size, opts = {}) => {
    const s = safeText(text);
    if (!s) return;
    page.drawText(s, { x, y, size, font: pickFont(opts), color: opts.color || BLACK });
  };

  const drawWrapped = (page, text, x, y, maxWidth, size, lineHeight, opts = {}) => {
    const lines = wrapText(text, maxWidth, size, opts);
    let cy = y;
    for (const ln of lines) {
      drawText(page, ln, x, cy, size, opts);
      cy -= lineHeight;
    }
    return cy;
  };

  // Accent-colored dash bullet (reads cleaner than a round dot at small sizes)
  const drawBullet = (page, text, x, y, maxWidth, size, lineHeight) => {
    const s = safeText(text);
    if (!s) return y;
    const indent = 13;
    drawText(page, '—', x, y, size, { color: ACCENT });
    return drawWrapped(page, s, x + indent, y, maxWidth - indent, size, lineHeight);
  };

  const drawEntryHeader = (page, label, date, x, y, maxWidth, size, lineHeight, opts = {}) => {
    const lOpts = { bold: true, color: opts.color || PRIMARY };
    const dOpts = { italic: true, color: GRAY };
    if (date) {
      const dw = tw(date, sizeSubtitle, dOpts);
      const labelMaxW = maxWidth - dw - 10;
      const lLines    = wrapText(label, labelMaxW, size, lOpts);
      let ly = y;
      for (const ll of lLines) { drawText(page, ll, x, ly, size, lOpts); ly -= lineHeight; }
      drawText(page, date, PAGE_WIDTH - MARGIN_X - dw, y, sizeSubtitle, dOpts);
      return y - (lLines.length * lineHeight);
    } else {
      const lLines = wrapText(label, maxWidth, size, lOpts);
      let ly = y;
      for (const ll of lLines) { drawText(page, ll, x, ly, size, lOpts); ly -= lineHeight; }
      return y - (lLines.length * lineHeight);
    }
  };

  // ====================================================================
  // WRITE HEADER
  // ====================================================================
  const nameW = tw(finalName, sizeName, { bold: true });
  drawText(p, finalName, (PAGE_WIDTH - nameW) / 2, cursorY, sizeName, { bold: true, color: PRIMARY });

  // Small gold accent tick centered under the name — a quiet signature touch
  const tickW = 26;
  drawRect(p, (PAGE_WIDTH - tickW) / 2, cursorY - sizeName + 2, tickW, 1.6, ACCENT);
  cursorY -= sizeName + 10;

  // Contact row — small gold dot separators instead of plain pipes
  const contactParts = [finalPhone, finalEmail, finalLinkedIn, finalGitHub].filter(Boolean);
  const cOpts = { color: DARK_GRAY };
  const dotGap = 14;

  let totalCW = contactParts.reduce((acc, part) => acc + tw(part, sizeContact, cOpts), 0)
              + dotGap * (contactParts.length - 1);
  let cx = (PAGE_WIDTH - totalCW) / 2;
  if (cx < MARGIN_X) cx = MARGIN_X;

  for (let i = 0; i < contactParts.length; i++) {
    const part = contactParts[i];
    drawText(p, part, cx, cursorY, sizeContact, cOpts);
    cx += tw(part, sizeContact, cOpts);
    if (i < contactParts.length - 1) {
      const midX = cx + dotGap / 2;
      p.drawCircle({ x: midX, y: cursorY + sizeContact * 0.32, size: 1.1, color: ACCENT });
      cx += dotGap;
    }
  }
  cursorY -= 14;

  // Header divider: short bold navy segment + long faint hairline (subtle asymmetry reads as designed, not templated)
  drawLine(p, cursorY, PRIMARY, 1.4, MARGIN_X, MARGIN_X + 46);
  drawLine(p, cursorY, RULE_FAINT, 0.75, MARGIN_X + 54, PAGE_WIDTH - MARGIN_X);
  cursorY -= 14;

  // ====================================================================
  // WRITE SECTIONS
  // ====================================================================
  for (const section of sections) {
    // Section heading with small accent tab + tracked-out caps for a premium, editorial feel
    const tabW = 3, tabH = sizeSection * 0.78;
    drawRect(p, MARGIN_X, cursorY - tabH + sizeSection * 0.16, tabW, tabH, ACCENT);
    drawText(p, trackedUpper(section.title), MARGIN_X + tabW + 7, cursorY, sizeSection, { bold: true, color: PRIMARY });
    cursorY -= 4;
    drawLine(p, cursorY, RULE_FAINT, 0.6);
    cursorY -= 9;

    const key = section.title.toLowerCase();

    for (const rawLine of section.content) {
      const trimmed = safeText(rawLine).trim();
      if (!trimmed) continue;

      const isBullet  = trimmed.startsWith('•');
      const bulletTxt = isBullet ? trimmed.replace(/^•\s*/, '') : '';

      // -------- SUMMARY --------
      if (key === 'summary') {
        if (isBullet) {
          cursorY = drawBullet(p, bulletTxt, MARGIN_X, cursorY, MAX_W, sizeBody, lhBody);
          cursorY -= 2;
        } else {
          cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeBody, lhBody, { color: DARK_GRAY });
          cursorY -= 3;
        }
        continue;
      }

      // -------- EXPERIENCE --------
      if (key.includes('experience')) {
        if (!isBullet && /\d{4}/.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          cursorY = drawEntryHeader(p, safeText(label), date, MARGIN_X, cursorY, MAX_W, sizeEntryHeader, lhEntryHeader, { color: PRIMARY });
          cursorY -= 2;
          continue;
        }
        if (!isBullet && /\b(developer|engineer|intern|analyst|consultant|lead|architect|manager|designer|specialist|devops|sde)\b/i.test(trimmed)) {
          cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeSubtitle, lhSubtitle, { italic: true, color: ACCENT });
          cursorY -= 2;
          continue;
        }
        if (isBullet) {
          cursorY = drawBullet(p, bulletTxt, MARGIN_X + 4, cursorY, MAX_W - 4, sizeBody, lhBody);
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeBody, lhBody);
        cursorY -= 2;
        continue;
      }

      // -------- PROJECTS --------
      if (key.includes('project')) {
        if (!isBullet && trimmed.includes('|')) {
          const parts = trimmed.split('|').map(pt => safeText(pt).trim());
          const name  = parts[0];
          const rest  = parts.slice(1).join(' | ');
          const { label: tech, date } = splitLabelAndDate(rest);
          const display = tech ? `${name}  |  ${tech}` : name;
          cursorY = drawEntryHeader(p, display, date, MARGIN_X, cursorY, MAX_W, sizeEntryHeader, lhEntryHeader, { color: PRIMARY });
          cursorY -= 2;
          continue;
        }
        if (!isBullet && /\d{4}/.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          cursorY = drawEntryHeader(p, safeText(label), date, MARGIN_X, cursorY, MAX_W, sizeEntryHeader, lhEntryHeader, { color: PRIMARY });
          cursorY -= 2;
          continue;
        }
        if (!isBullet && trimmed.length < 80) {
          cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeEntryHeader, lhEntryHeader, { bold: true, color: PRIMARY });
          cursorY -= 2;
          continue;
        }
        if (isBullet) {
          cursorY = drawBullet(p, bulletTxt, MARGIN_X + 4, cursorY, MAX_W - 4, sizeBody, lhBody);
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeBody, lhBody);
        cursorY -= 2;
        continue;
      }

      // -------- EDUCATION --------
      if (key.includes('education')) {
        if (/amity\s+international\s+school/i.test(trimmed)) continue;

        if (/\d{4}/.test(trimmed) && !/(gpa|cgpa|grade|score)/i.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          const lOpts = { italic: true, color: DARK_GRAY };
          const dOpts = { italic: true, color: GRAY };
          const lLines = wrapText(safeText(label), MAX_W - tw(date, sizeSubtitle, dOpts) - 10, sizeSubtitle, lOpts);
          let ly = cursorY;
          for (const ll of lLines) { drawText(p, ll, MARGIN_X + 8, ly, sizeSubtitle, lOpts); ly -= lhSubtitle; }
          if (date) { const dw = tw(date, sizeSubtitle, dOpts); drawText(p, date, PAGE_WIDTH - MARGIN_X - dw, cursorY, sizeSubtitle, dOpts); }
          cursorY = ly;
          continue;
        }
        if (!isBullet) {
          cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeEntryHeader, lhEntryHeader, { bold: true, color: PRIMARY });
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrapped(p, trimmed.replace(/^•\s*/, ''), MARGIN_X + 8, cursorY, MAX_W - 8, sizeBody, lhBody, { color: DARK_GRAY });
        cursorY -= 2;
        continue;
      }

      // -------- SKILLS --------
      if (key.includes('skill') || key.includes('technolog')) {
        if (trimmed.includes(':')) {
          const colon  = trimmed.indexOf(':');
          const label  = trimmed.slice(0, colon).trim();
          const value  = trimmed.slice(colon + 1).trim();
          const lStr   = `${label}: `;
          const lW     = tw(lStr, sizeBody, { bold: true });
          drawText(p, lStr, MARGIN_X, cursorY, sizeBody, { bold: true, color: PRIMARY });
          cursorY = drawWrapped(p, value, MARGIN_X + lW, cursorY, MAX_W - lW, sizeBody, lhBody, { color: DARK_GRAY });
          cursorY -= 2;
          continue;
        }
        if (isBullet) {
          cursorY = drawBullet(p, bulletTxt, MARGIN_X, cursorY, MAX_W, sizeBody, lhBody);
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeBody, lhBody, { color: DARK_GRAY });
        cursorY -= 2;
        continue;
      }

      // -------- DEFAULT --------
      if (isBullet) {
        cursorY = drawBullet(p, bulletTxt, MARGIN_X, cursorY, MAX_W, sizeBody, lhBody);
        cursorY -= 2;
      } else {
        cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeBody, lhBody);
        cursorY -= 2;
      }
    }

    cursorY -= gapSection;
  }

  // --- Output PDF bytes ---
  const pdfBytes = await pdf.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, `${cleanFile}_optimized.pdf`);
}