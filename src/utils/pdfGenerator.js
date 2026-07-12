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
    
    // Skip if it contains any common section keywords
    const lower = trimmed.toLowerCase();
    if (/(summary|objective|profile|experience|education|skills|projects|certif|language|technolog|contact|phone|email|linkedin|github)/i.test(lower)) continue;

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
  // SINGLE PAGE COMPRESSION ALGORITHM
  // ====================================================================
  const calculateTotalHeight = (sName, sTitle, sContact, sSection, sEntryHeader, sSubtitle, sBody, lBody, lEntryHeader, lSubtitle, gSec) => {
    let heightNeeded = 0;
    
    // Header heights
    heightNeeded += sName + 5;
    heightNeeded += sTitle + 7;
    heightNeeded += sContact + 12;
    heightNeeded += 12; // divider rule
    
    for (const section of sections) {
      heightNeeded += 18; // Heading spacing overhead
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
            const parts = trimmed.split('|').map(p => safeText(p).trim());
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
  let sizeName        = 19;
  let sizeTitle       = 10.5;
  let sizeContact     = 8.2;
  let sizeSection     = 10.2;
  let sizeEntryHeader = 9.5;
  let sizeSubtitle    = 9.0;
  let sizeBody        = 8.8;

  let lhBody         = 12.0;
  let lhEntryHeader = 13.0;
  let lhSubtitle     = 12.0;
  
  let gapSection = 6.0;
  let marginY = MARGIN_TOP;

  // Pre-flight check & scale loop (target: 746 available vertical pixels)
  const availableHeight = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 842 - 48 - 44 = 750
  let requiredHeight = calculateTotalHeight(sizeName, sizeTitle, sizeContact, sizeSection, sizeEntryHeader, sizeSubtitle, sizeBody, lhBody, lhEntryHeader, lhSubtitle, gapSection);

  if (requiredHeight > availableHeight) {
    // Stage 1 compression
    sizeBody = 8.2;
    lhBody = 11.2;
    sizeEntryHeader = 9.0;
    lhEntryHeader = 12.0;
    sizeSubtitle = 8.5;
    lhSubtitle = 11.2;
    gapSection = 4.0;
    requiredHeight = calculateTotalHeight(sizeName, sizeTitle, sizeContact, sizeSection, sizeEntryHeader, sizeSubtitle, sizeBody, lhBody, lhEntryHeader, lhSubtitle, gapSection);
  }

  if (requiredHeight > availableHeight) {
    // Stage 2 compression (compact layout)
    sizeBody = 7.8;
    lhBody = 10.5;
    sizeEntryHeader = 8.5;
    lhEntryHeader = 11.0;
    sizeSubtitle = 8.0;
    lhSubtitle = 10.5;
    sizeSection = 9.5;
    sizeName = 17;
    gapSection = 3.0;
    requiredHeight = calculateTotalHeight(sizeName, sizeTitle, sizeContact, sizeSection, sizeEntryHeader, sizeSubtitle, sizeBody, lhBody, lhEntryHeader, lhSubtitle, gapSection);
  }

  if (requiredHeight > availableHeight) {
    // Stage 3 compression (absolute minimums to force fit on single page)
    sizeBody = 7.3;
    lhBody = 9.6;
    sizeEntryHeader = 8.0;
    lhEntryHeader = 10.2;
    sizeSubtitle = 7.6;
    lhSubtitle = 9.8;
    sizeSection = 9.0;
    sizeName = 15;
    gapSection = 1.5;
  }

  // --- Rendering engine ---
  const p = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - marginY;

  const drawLine = (page, y, color = LIGHT_GRAY, thickness = 0.6) =>
    page.drawLine({ start: { x: MARGIN_X, y }, end: { x: PAGE_WIDTH - MARGIN_X, y }, thickness, color });

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

  const drawBullet = (page, text, x, y, maxWidth, size, lineHeight) => {
    const s = safeText(text);
    if (!s) return y;
    const indent = 12;
    drawText(page, '•', x, y, size, { color: PRIMARY });
    return drawWrapped(page, s, x + indent, y, maxWidth - indent, size, lineHeight);
  };

  const drawEntryHeader = (page, label, date, x, y, maxWidth, size, lineHeight, opts = {}) => {
    const lOpts = { bold: true, color: opts.color || BLACK };
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
  cursorY -= sizeName + 5;

  const jtW = tw(finalJobTitle, sizeTitle, { italic: true });
  drawText(p, finalJobTitle, (PAGE_WIDTH - jtW) / 2, cursorY, sizeTitle, { italic: true, color: DARK_GRAY });
  cursorY -= sizeTitle + 7;

  const contactParts = [finalEmail, finalPhone, finalLinkedIn];
  if (finalGitHub) contactParts.push(finalGitHub);
  const sep   = '  |  ';
  const cOpts = { color: DARK_GRAY };
  const sOpts = { color: LIGHT_GRAY };
  const sepW  = tw(sep, sizeContact, sOpts);

  let totalCW = contactParts.reduce((acc, part) => acc + tw(part, sizeContact, cOpts), 0) + sepW * (contactParts.length - 1);
  let cx = (PAGE_WIDTH - totalCW) / 2;
  if (cx < MARGIN_X) cx = MARGIN_X;

  for (let i = 0; i < contactParts.length; i++) {
    const part = contactParts[i];
    drawText(p, part, cx, cursorY, sizeContact, cOpts);
    cx += tw(part, sizeContact, cOpts);
    if (i < contactParts.length - 1) {
      drawText(p, sep, cx, cursorY, sizeContact, sOpts);
      cx += sepW;
    }
  }
  cursorY -= 12;

  drawLine(p, cursorY, PRIMARY, 1.2);
  cursorY -= 12;

  // ====================================================================
  // WRITE SECTIONS
  // ====================================================================
  for (const section of sections) {
    drawText(p, section.title.toUpperCase(), MARGIN_X, cursorY, sizeSection, { bold: true, color: PRIMARY });
    cursorY -= 4;
    drawLine(p, cursorY, LIGHT_GRAY, 0.6);
    cursorY -= 8;

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
          cursorY = drawEntryHeader(p, safeText(label), date, MARGIN_X, cursorY, MAX_W, sizeEntryHeader, lhEntryHeader, { color: BLACK });
          cursorY -= 2;
          continue;
        }
        if (!isBullet && /\b(developer|engineer|intern|analyst|consultant|lead|architect|manager|designer|specialist|devops|sde)\b/i.test(trimmed)) {
          cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeSubtitle, lhSubtitle, { italic: true, color: PRIMARY });
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
          cursorY = drawWrapped(p, trimmed, MARGIN_X, cursorY, MAX_W, sizeEntryHeader, lhEntryHeader, { bold: true });
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
          drawText(p, lStr, MARGIN_X, cursorY, sizeBody, { bold: true, color: BLACK });
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