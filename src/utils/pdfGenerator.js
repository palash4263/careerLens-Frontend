// src/utils/pdfGenerator.js
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

const PAGE_WIDTH  = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X    = 50;
const MARGIN_TOP  = 48;
const MARGIN_BOTTOM = 44;

// ====== COLOR PALETTE ======
const PRIMARY    = rgb(0.09, 0.26, 0.55);   // deep navy blue
const BLACK      = rgb(0.10, 0.10, 0.10);
const DARK_GRAY  = rgb(0.30, 0.30, 0.30);
const GRAY       = rgb(0.48, 0.48, 0.48);
const LIGHT_GRAY = rgb(0.80, 0.80, 0.83);

// ====== FONT SIZES ======
const SIZE_NAME         = 20;
const SIZE_TITLE        = 11;
const SIZE_CONTACT      = 8.5;
const SIZE_SECTION      = 10.5;
const SIZE_ENTRY_HEADER = 10;
const SIZE_SUBTITLE     = 9.5;
const SIZE_BODY         = 9;

// ====== LINE HEIGHTS ======
const LH_BODY         = 13;
const LH_ENTRY_HEADER = 14;
const LH_SUBTITLE     = 13;

// =====================================================================
// MARKDOWN STRIPPING – removes ALL markdown symbols before rendering
// =====================================================================
const stripMarkdown = (text) => {
  if (!text) return '';
  return String(text)
    // Remove bold/italic markers  ** __ * _
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/___(.+?)___/g,       '$1')
    .replace(/\*\*(.+?)\*\*/g,     '$1')
    .replace(/__(.+?)__/g,         '$1')
    .replace(/\*(.+?)\*/g,         '$1')
    .replace(/_(.+?)_/g,           '$1')
    // Loose remaining asterisks/underscores at line boundaries
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
    // Strip markdown before testing
    const trimmed = stripMarkdown(line).trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 50) continue;
    if (trimmed.includes('@')) continue;
    // Skip lines that look like section headers or contact info
    if (/^(summary|education|experience|skills|projects|contact|phone|email|linkedin|profile|certif|objective|languages)/i.test(trimmed)) continue;
    // Must look like a name: mostly alpha + spaces
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
    // Skip educational institutions
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

  // Build a filter list to remove redundant contact lines
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

  // Lines to always skip (school lines in global header area only — not inside Education)
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

    // Skip schools outside the Education section
    if (!currentSection || currentSection !== 'Education') {
      if (SKIP_SCHOOLS_GLOBAL.some(s => trimmed.toLowerCase().includes(s))) continue;
    }

    if (!currentSection) {
      currentSection = 'Summary';
      currentContent = [];
    }

    // Normalise bullet characters
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
  const label = t.slice(0, m.index).trim().replace(/[-–—,|]\s*$/, '').trim();
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
  // --- Extract contact info ---
  const finalName     = extractName(resumeText)     || userName  || 'Palash Mishra';
  const finalJobTitle = extractJobTitle(resumeText)  || jobTitle  || 'Full Stack Developer';
  const finalEmail    = extractEmail(resumeText)     || email     || 'palashmishra47@gmail.com';
  const finalPhone    = extractPhoneNumber(resumeText) || phone   || '+91-7428477219';
  const finalLinkedIn = extractLinkedIn(resumeText)  || linkedin  || 'linkedin.com/in/palash-mishra-6a68a71aa';
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

  // --- Helpers ---
  const addPage = () => {
    const p = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return { page: p, cursorY: PAGE_HEIGHT - MARGIN_TOP };
  };

  const drawLine = (page, y, color = LIGHT_GRAY, thickness = 0.6) =>
    page.drawLine({ start: { x: MARGIN_X, y }, end: { x: PAGE_WIDTH - MARGIN_X, y }, thickness, color });

  const tw = (text, opts = {}) =>
    pickFont(opts).widthOfTextAtSize(safeText(text), opts.size || SIZE_BODY);

  const drawText = (page, text, x, y, opts = {}) => {
    const s = safeText(text);
    if (!s) return;
    page.drawText(s, { x, y, size: opts.size || SIZE_BODY, font: pickFont(opts), color: opts.color || BLACK });
  };

  const wrapText = (text, maxWidth, opts = {}) => {
    const s = safeText(text);
    if (!s) return [];
    const sz      = opts.size || SIZE_BODY;
    const useFont = pickFont(opts);
    const words   = s.split(' ');
    const lines   = [];
    let cur       = '';
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (useFont.widthOfTextAtSize(test, sz) <= maxWidth) {
        cur = test;
      } else {
        if (cur) lines.push(cur);
        // If a single word is still too wide, force it
        if (useFont.widthOfTextAtSize(word, sz) > maxWidth) {
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

  const drawWrapped = (page, text, x, y, maxWidth, opts = {}) => {
    const lines = wrapText(text, maxWidth, opts);
    let cy = y;
    for (const ln of lines) {
      drawText(page, ln, x, cy, opts);
      cy -= opts.lineHeight || LH_BODY;
    }
    return cy;
  };

  const drawBullet = (page, text, x, y, maxWidth) => {
    const s = safeText(text);
    if (!s) return y;
    const indent = 12;
    drawText(page, '•', x, y, { size: SIZE_BODY, color: PRIMARY });
    return drawWrapped(page, s, x + indent, y, maxWidth - indent, { size: SIZE_BODY, lineHeight: LH_BODY });
  };

  const drawEntryHeader = (page, label, date, x, y, maxWidth, opts = {}) => {
    const lOpts = { bold: true,   size: opts.size  || SIZE_ENTRY_HEADER, color: opts.color || BLACK };
    const dOpts = { italic: true, size: SIZE_SUBTITLE, color: GRAY };
    if (date) {
      const dw = tw(date, dOpts);
      // Wrap label if needed so it doesn't overlap date
      const labelMaxW = maxWidth - dw - 10;
      const lLines    = wrapText(label, labelMaxW, lOpts);
      let ly = y;
      for (const ll of lLines) { drawText(page, ll, x, ly, lOpts); ly -= LH_ENTRY_HEADER; }
      drawText(page, date, PAGE_WIDTH - MARGIN_X - dw, y, dOpts);
      return y - (lLines.length * LH_ENTRY_HEADER);
    } else {
      const lLines = wrapText(label, maxWidth, lOpts);
      let ly = y;
      for (const ll of lLines) { drawText(page, ll, x, ly, lOpts); ly -= LH_ENTRY_HEADER; }
      return y - (lLines.length * LH_ENTRY_HEADER);
    }
  };

  const ensureSpace = (page, cursorY, needed) => {
    if (cursorY > MARGIN_BOTTOM + needed) return { page, cursorY };
    const np = addPage();
    return { page: np.page, cursorY: np.cursorY };
  };

  // ====================================================================
  // HEADER
  // ====================================================================
  let { page, cursorY } = addPage();

  // Candidate name — large, centred, bold
  const nameW = tw(finalName, { bold: true, size: SIZE_NAME });
  drawText(page, finalName, (PAGE_WIDTH - nameW) / 2, cursorY, { bold: true, size: SIZE_NAME, color: PRIMARY });
  cursorY -= SIZE_NAME + 5;

  // Job title — centred, italic
  const jtW = tw(finalJobTitle, { italic: true, size: SIZE_TITLE });
  drawText(page, finalJobTitle, (PAGE_WIDTH - jtW) / 2, cursorY, { italic: true, size: SIZE_TITLE, color: DARK_GRAY });
  cursorY -= SIZE_TITLE + 7;

  // Contact bar — centred, all on one line or split
  const contactParts = [finalEmail, finalPhone, finalLinkedIn];
  if (finalGitHub) contactParts.push(finalGitHub);
  const sep   = '  |  ';
  const cOpts = { size: SIZE_CONTACT, color: DARK_GRAY };
  const sOpts = { size: SIZE_CONTACT, color: LIGHT_GRAY };
  const sepW  = tw(sep, sOpts);

  let totalCW = contactParts.reduce((acc, p) => acc + tw(p, cOpts), 0) + sepW * (contactParts.length - 1);
  let cx = (PAGE_WIDTH - totalCW) / 2;
  if (cx < MARGIN_X) cx = MARGIN_X; // fallback if too wide

  for (let i = 0; i < contactParts.length; i++) {
    const p = contactParts[i];
    drawText(page, p, cx, cursorY, cOpts);
    cx += tw(p, cOpts);
    if (i < contactParts.length - 1) {
      drawText(page, sep, cx, cursorY, sOpts);
      cx += sepW;
    }
  }
  cursorY -= 12;

  // Full-width primary rule
  drawLine(page, cursorY, PRIMARY, 1.2);
  cursorY -= 12;

  // ====================================================================
  // SECTIONS
  // ====================================================================
  for (const section of sections) {
    ({ page, cursorY } = ensureSpace(page, cursorY, 50));

    // Section heading
    drawText(page, section.title.toUpperCase(), MARGIN_X, cursorY, { bold: true, size: SIZE_SECTION, color: PRIMARY });
    cursorY -= 5;
    drawLine(page, cursorY, LIGHT_GRAY, 0.6);
    cursorY -= 10;

    const key = section.title.toLowerCase();

    for (const rawLine of section.content) {
      const trimmed = safeText(rawLine).trim();
      if (!trimmed) continue;
      ({ page, cursorY } = ensureSpace(page, cursorY, 24));

      const isBullet  = trimmed.startsWith('•');
      const bulletTxt = isBullet ? trimmed.replace(/^•\s*/, '') : '';

      // -------- SUMMARY --------
      if (key === 'summary') {
        if (isBullet) {
          cursorY = drawBullet(page, bulletTxt, MARGIN_X, cursorY, MAX_W);
          cursorY -= 2;
        } else {
          cursorY = drawWrapped(page, trimmed, MARGIN_X, cursorY, MAX_W, { size: SIZE_BODY, lineHeight: LH_BODY, color: DARK_GRAY });
          cursorY -= 3;
        }
        continue;
      }

      // -------- EXPERIENCE --------
      if (key.includes('experience')) {
        if (!isBullet && /\d{4}/.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          // Clean up any leftover bold markers in label
          const cleanLabel = safeText(label);
          cursorY = drawEntryHeader(page, cleanLabel, date, MARGIN_X, cursorY, MAX_W, { size: SIZE_ENTRY_HEADER, color: BLACK });
          cursorY -= 2;
          continue;
        }
        if (!isBullet && /\b(developer|engineer|intern|analyst|consultant|lead|architect|manager|designer|specialist|devops|sde)\b/i.test(trimmed)) {
          cursorY = drawWrapped(page, trimmed, MARGIN_X, cursorY, MAX_W, { italic: true, size: SIZE_SUBTITLE, color: PRIMARY, lineHeight: LH_SUBTITLE });
          cursorY -= 2;
          continue;
        }
        if (isBullet) {
          cursorY = drawBullet(page, bulletTxt, MARGIN_X + 4, cursorY, MAX_W - 4);
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrapped(page, trimmed, MARGIN_X, cursorY, MAX_W, { size: SIZE_BODY, lineHeight: LH_BODY });
        cursorY -= 2;
        continue;
      }

      // -------- PROJECTS --------
      if (key.includes('project')) {
        if (!isBullet && trimmed.includes('|')) {
          const parts = trimmed.split('|').map(p => safeText(p).trim());
          const name  = parts[0];
          const rest  = parts.slice(1).join(' | ');
          const { label: tech, date } = splitLabelAndDate(rest);
          const display = tech ? `${name}  |  ${tech}` : name;
          cursorY = drawEntryHeader(page, display, date, MARGIN_X, cursorY, MAX_W, { size: SIZE_ENTRY_HEADER, color: PRIMARY });
          cursorY -= 2;
          continue;
        }
        if (!isBullet && /\d{4}/.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          cursorY = drawEntryHeader(page, safeText(label), date, MARGIN_X, cursorY, MAX_W, { size: SIZE_ENTRY_HEADER, color: PRIMARY });
          cursorY -= 2;
          continue;
        }
        if (!isBullet && trimmed.length < 80) {
          cursorY = drawWrapped(page, trimmed, MARGIN_X, cursorY, MAX_W, { bold: true, size: SIZE_ENTRY_HEADER, color: PRIMARY, lineHeight: LH_ENTRY_HEADER });
          cursorY -= 2;
          continue;
        }
        if (isBullet) {
          cursorY = drawBullet(page, bulletTxt, MARGIN_X + 4, cursorY, MAX_W - 4);
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrapped(page, trimmed, MARGIN_X, cursorY, MAX_W, { size: SIZE_BODY, lineHeight: LH_BODY });
        cursorY -= 2;
        continue;
      }

      // -------- EDUCATION --------
      if (key.includes('education')) {
        // Skip Amity International School entirely
        if (/amity\s+international\s+school/i.test(trimmed)) continue;

        if (/\d{4}/.test(trimmed) && !/(gpa|cgpa|grade|score)/i.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          const lOpts = { italic: true, size: SIZE_SUBTITLE, color: DARK_GRAY };
          const dOpts = { italic: true, size: SIZE_SUBTITLE, color: GRAY };
          const lLines = wrapText(safeText(label), MAX_W - tw(date, dOpts) - 10, lOpts);
          let ly = cursorY;
          for (const ll of lLines) { drawText(page, ll, MARGIN_X + 8, ly, lOpts); ly -= LH_SUBTITLE; }
          if (date) { const dw = tw(date, dOpts); drawText(page, date, PAGE_WIDTH - MARGIN_X - dw, cursorY, dOpts); }
          cursorY = ly;
          continue;
        }
        if (!isBullet) {
          cursorY = drawWrapped(page, trimmed, MARGIN_X, cursorY, MAX_W, { bold: true, size: SIZE_ENTRY_HEADER, lineHeight: LH_ENTRY_HEADER });
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrapped(page, trimmed.replace(/^•\s*/, ''), MARGIN_X + 8, cursorY, MAX_W - 8, { size: SIZE_BODY, lineHeight: LH_BODY, color: DARK_GRAY });
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
          const lW     = tw(lStr, { bold: true, size: SIZE_BODY });
          drawText(page, lStr, MARGIN_X, cursorY, { bold: true, size: SIZE_BODY, color: BLACK });
          cursorY = drawWrapped(page, value, MARGIN_X + lW, cursorY, MAX_W - lW, { size: SIZE_BODY, lineHeight: LH_BODY, color: DARK_GRAY });
          cursorY -= 2;
          continue;
        }
        if (isBullet) {
          cursorY = drawBullet(page, bulletTxt, MARGIN_X, cursorY, MAX_W);
          cursorY -= 2;
          continue;
        }
        cursorY = drawWrapped(page, trimmed, MARGIN_X, cursorY, MAX_W, { size: SIZE_BODY, lineHeight: LH_BODY, color: DARK_GRAY });
        cursorY -= 2;
        continue;
      }

      // -------- CERTIFICATIONS / LANGUAGES / DEFAULT --------
      if (isBullet) {
        cursorY = drawBullet(page, bulletTxt, MARGIN_X, cursorY, MAX_W);
        cursorY -= 2;
      } else {
        cursorY = drawWrapped(page, trimmed, MARGIN_X, cursorY, MAX_W, { size: SIZE_BODY, lineHeight: LH_BODY });
        cursorY -= 2;
      }
    }

    cursorY -= 8; // gap between sections
  }

  // ====================================================================
  // SAVE
  // ====================================================================
  const pdfBytes = await pdf.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, `${cleanFile}_optimized.pdf`);
}