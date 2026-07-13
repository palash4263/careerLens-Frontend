// src/utils/pdfGenerator.js
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

const PAGE_WIDTH  = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X    = 36; // 0.5 inch margins as in professional resumes
const MARGIN_TOP  = 36;
const MARGIN_BOTTOM = 36;

// ====== COLOR PALETTE (Marcus Hall Clean Theme) ======
const PRIMARY      = rgb(0.09, 0.38, 0.78);   // professional blue accent
const BLACK        = rgb(0.12, 0.14, 0.17);   // deep dark text
const DARK_GRAY    = rgb(0.33, 0.37, 0.43);   // body text gray
const GRAY         = rgb(0.50, 0.55, 0.62);
const LIGHT_GRAY   = rgb(0.88, 0.90, 0.94);   // badge borders
const BADGE_BG     = rgb(0.96, 0.97, 0.98);   // light gray badge background

// Helper to convert HEX colors to pdf-lib rgb values
const hexToRgbColor = (hex) => {
  if (!hex || typeof hex !== 'string') return rgb(0.09, 0.38, 0.78);
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(
    Number.isNaN(r) ? 0.09 : r,
    Number.isNaN(g) ? 0.38 : g,
    Number.isNaN(b) ? 0.78 : b
  );
};

// =====================================================================
// MARKDOWN STRIPPING & SAFE TEXT
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
    const trimmed = stripMarkdown(line).trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 50) continue;
    if (trimmed.includes('@')) continue;
    const lower = trimmed.toLowerCase();
    if (/(summary|objective|profile|experience|education|skills|projects|certif|language|technolog|contact|phone|email|linkedin|github)/i.test(lower)) continue;
    if (/^[A-Za-z][A-Za-z\s.'-]{2,}$/.test(trimmed)) return trimmed;
  }
  return null;
};

const extractNameFromFilename = (fileName) => {
  if (!fileName || typeof fileName !== 'string' || fileName.toLowerCase() === 'resume') return null;
  
  // Strip extension
  let clean = fileName.replace(/\.pdf$/i, '');
  
  // Strip common suffixes
  clean = clean
    .replace(/[_.\-]optimized/i, '')
    .replace(/[_.\-]resume/i, '')
    .replace(/resume/i, '');
    
  // Strip trailing numbers (e.g. 2026, 2025, (2), etc.)
  clean = clean.replace(/\d+/g, '').replace(/\(\s*\)/g, '');
  
  // Replace underscores and hyphens with spaces
  clean = clean.replace(/[_\-]+/g, ' ').trim();
  
  // Insert spaces before capital letters (CamelCase split) if no spaces exist
  if (!clean.includes(' ')) {
    clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  
  // Capitalize each word
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  
  const formatted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return formatted || null;
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
// PARSE RESUME TEXT INTO SECTIONS
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
// ELEGANT SINGLE-COLUMN PDF GENERATION
// =====================================================================
async function generateSingleColumnPDF({
  resumeText,
  fileName = 'resume',
  score    = 0,
  jobTitle = null,
  email    = null,
  phone    = null,
  linkedin = null,
  userName = null,
  primaryColor = '#1761c7',
  fontFamily = 'Rubik',
}) {
  const PRIMARY = primaryColor ? hexToRgbColor(primaryColor) : rgb(0.09, 0.38, 0.78);
  const finalName     = extractNameFromFilename(fileName) || extractName(resumeText) || userName || 'Palash Mishra';
  const finalJobTitle = extractJobTitle(resumeText) || jobTitle || 'Full Stack Developer';
  const finalEmail    = extractEmail(resumeText) || email || 'palashmishra47@gmail.com';
  const finalPhone    = extractPhoneNumber(resumeText) || phone || '+91-7428477219';
  const finalLinkedIn = extractLinkedIn(resumeText) || linkedin || 'linkedin.com/in/palash-mishra-6a68a71aa';
  const finalGitHub   = extractGitHub(resumeText)    || '';

  // Initialize Document
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

  const sections  = parseResumeSections(resumeText, { userName: finalName, email: finalEmail, phone: finalPhone, linkedin: finalLinkedIn });
  const cleanFile = safeText(fileName).replace(/\.pdf$/i, '');

  const FULL_W   = PAGE_WIDTH - MARGIN_X * 2;
  let p = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;

  const tw = (text, size, opts = {}) =>
    pickFont(opts).widthOfTextAtSize(safeText(text), size);

  const drawText = (page, text, x, yVal, size, opts = {}) => {
    const f = pickFont(opts);
    const color = opts.color || BLACK;
    page.drawText(safeText(text), { x, y: yVal, size, font: f, color });
  };

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

  const drawWrapped = (page, text, x, yVal, maxWidth, size, lineHeight, opts = {}) => {
    const lines = wrapText(text, maxWidth, size, opts);
    let curY = yVal;
    for (const line of lines) {
      if (curY < MARGIN_BOTTOM + 15) {
        page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        curY = PAGE_HEIGHT - MARGIN_TOP;
        p = page; // update current page ref
      }
      drawText(page, line, x, curY, size, opts);
      curY -= lineHeight;
    }
    return curY;
  };

  const drawBullet = (page, text, x, yVal, maxWidth, size, lineHeight) => {
    if (yVal < MARGIN_BOTTOM + 15) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yVal = PAGE_HEIGHT - MARGIN_TOP;
      p = page;
    }
    drawText(page, "•", x, yVal, size + 2, { color: PRIMARY });
    return drawWrapped(page, text, x + 10, yVal, maxWidth - 10, size, lineHeight, { color: DARK_GRAY });
  };

  // --- Render Header (Centered) ---
  const nameSize = 20;
  const nameW = tw(finalName, nameSize, { bold: true });
  drawText(p, finalName, (PAGE_WIDTH - nameW) / 2, y, nameSize, { bold: true, color: PRIMARY });
  y -= 18;

  if (finalJobTitle) {
    const titleSize = 10;
    const titleW = tw(finalJobTitle, titleSize, { bold: true });
    drawText(p, finalJobTitle.toUpperCase(), (PAGE_WIDTH - titleW) / 2, y, titleSize, { bold: true, color: GRAY });
    y -= 14;
  }

  const contactParts = [];
  if (finalPhone) contactParts.push(finalPhone);
  if (finalEmail) contactParts.push(finalEmail);
  if (finalLinkedIn) contactParts.push(finalLinkedIn);
  if (finalGitHub) contactParts.push(finalGitHub);

  const contactStr = contactParts.join("  |  ");
  const contactSize = 8.5;
  const contactW = tw(contactStr, contactSize);
  drawText(p, contactStr, (PAGE_WIDTH - contactW) / 2, y, contactSize, { color: DARK_GRAY });
  y -= 16;

  // --- Render Sections (Full Width) ---
  const sizeSectionTitle = 10.5;
  const sizeEntryHeader = 10;
  const sizeSubtitle = 9.5;
  const sizeBody = 9;
  const lhBody = 12.5;
  const lhEntryHeader = 12;
  const lhSubtitle = 11.5;

  const drawSectionHeader = (title) => {
    if (y < MARGIN_BOTTOM + 35) {
      p = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN_TOP;
    }
    y -= 10;
    drawText(p, title.toUpperCase(), MARGIN_X, y, sizeSectionTitle, { bold: true, color: PRIMARY });
    y -= 4;
    p.drawLine({
      start: { x: MARGIN_X, y: y },
      end: { x: PAGE_WIDTH - MARGIN_X, y: y },
      thickness: 0.75,
      color: LIGHT_GRAY,
    });
    y -= 8;
  };

  const sectionsToRender = ['Summary', 'Experience', 'Projects', 'Skills', 'Education', 'Certifications', 'Languages'];
  for (const canonical of sectionsToRender) {
    const sec = sections.find(s => s.title.toLowerCase().includes(canonical.toLowerCase()));
    if (!sec || sec.content.length === 0) continue;

    drawSectionHeader(canonical);

    if (canonical === 'Summary') {
      for (const line of sec.content) {
        y = drawWrapped(p, line, MARGIN_X, y, FULL_W, sizeBody, lhBody, { color: DARK_GRAY });
        y -= 2;
      }
    } 
    else if (canonical === 'Experience') {
      for (const rawLine of sec.content) {
        const trimmed = safeText(rawLine).trim();
        if (!trimmed) continue;

        const isBullet = trimmed.startsWith('•');
        const bulletTxt = isBullet ? trimmed.replace(/^•\s*/, '') : '';

        if (!isBullet && /\d{4}/.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          y -= 4;
          const dateW = tw(date, sizeSubtitle, { italic: true });
          drawText(p, safeText(label), MARGIN_X, y, sizeEntryHeader, { bold: true, color: BLACK });
          if (date) {
            drawText(p, date, PAGE_WIDTH - MARGIN_X - dateW, y, sizeSubtitle, { italic: true, color: GRAY });
          }
          y -= lhEntryHeader;
          continue;
        }
        if (!isBullet && /\b(developer|engineer|intern|analyst|consultant|lead|architect|manager|designer|specialist|devops|sde)\b/i.test(trimmed)) {
          y = drawWrapped(p, trimmed, MARGIN_X, y, FULL_W, sizeSubtitle, lhSubtitle, { bold: true, color: DARK_GRAY });
          y -= 2;
          continue;
        }
        if (isBullet) {
          y = drawBullet(p, bulletTxt, MARGIN_X + 2, y, FULL_W - 2, sizeBody, lhBody);
          y -= 1;
          continue;
        }
        y = drawWrapped(p, trimmed, MARGIN_X, y, FULL_W, sizeBody, lhBody, { color: DARK_GRAY });
        y -= 2;
      }
    }
    else if (canonical === 'Projects') {
      for (const rawLine of sec.content) {
        const trimmed = safeText(rawLine).trim();
        if (!trimmed) continue;

        const isBullet = trimmed.startsWith('•');
        const bulletTxt = isBullet ? trimmed.replace(/^•\s*/, '') : '';

        if (!isBullet && trimmed.includes('|')) {
          const parts = trimmed.split('|').map(pt => safeText(pt).trim());
          const name  = parts[0];
          const rest  = parts.slice(1).join(' | ');
          const { label: tech, date } = splitLabelAndDate(rest);
          const display = tech ? `${name}  |  ${tech}` : name;
          y -= 4;
          const dateW = tw(date, sizeSubtitle, { italic: true });
          drawText(p, display, MARGIN_X, y, sizeEntryHeader, { bold: true, color: BLACK });
          if (date) {
            drawText(p, date, PAGE_WIDTH - MARGIN_X - dateW, y, sizeSubtitle, { italic: true, color: GRAY });
          }
          y -= lhEntryHeader;
          continue;
        }
        if (!isBullet && /\d{4}/.test(trimmed)) {
          const { label, date } = splitLabelAndDate(trimmed);
          y -= 4;
          const dateW = tw(date, sizeSubtitle, { italic: true });
          drawText(p, safeText(label), MARGIN_X, y, sizeEntryHeader, { bold: true, color: BLACK });
          if (date) {
            drawText(p, date, PAGE_WIDTH - MARGIN_X - dateW, y, sizeSubtitle, { italic: true, color: GRAY });
          }
          y -= lhEntryHeader;
          continue;
        }
        if (isBullet) {
          y = drawBullet(p, bulletTxt, MARGIN_X + 2, y, FULL_W - 2, sizeBody, lhBody);
          y -= 1;
          continue;
        }
        y = drawWrapped(p, trimmed, MARGIN_X, y, FULL_W, sizeBody, lhBody, { color: DARK_GRAY });
        y -= 2;
      }
    }
    else if (canonical === 'Skills') {
      for (const rawLine of sec.content) {
        const trimmed = safeText(rawLine).trim();
        if (!trimmed) continue;
        
        if (trimmed.includes(':')) {
          const parts = trimmed.split(':');
          const category = parts[0].trim();
          const skillsList = parts[1].split(',').map(s => s.trim()).join(', ');
          const display = `${category}: ${skillsList}`;
          y = drawWrapped(p, display, MARGIN_X, y, FULL_W, sizeBody, lhBody, { color: DARK_GRAY });
          y -= 3;
        } else {
          y = drawWrapped(p, trimmed, MARGIN_X, y, FULL_W, sizeBody, lhBody, { color: DARK_GRAY });
          y -= 2;
        }
      }
    }
    else if (canonical === 'Education') {
      for (const rawLine of sec.content) {
        const trimmed = safeText(rawLine).trim();
        if (!trimmed) continue;

        const isInst = /\b(university|college|school|institute|academy|vellore)\b/i.test(trimmed);

        if (isInst) {
          y -= 4;
          y = drawWrapped(p, trimmed, MARGIN_X, y, FULL_W, sizeSubtitle, lhSubtitle, { bold: true, color: BLACK });
          continue;
        }
        if (trimmed.startsWith('•') || trimmed.startsWith('+') || trimmed.startsWith('-')) {
          const bulletTxt = trimmed.replace(/^[•+\-]\s*/, '');
          y = drawWrapped(p, `•  ${bulletTxt}`, MARGIN_X, y, FULL_W, sizeBody, lhBody, { color: DARK_GRAY });
          continue;
        }
        y = drawWrapped(p, trimmed, MARGIN_X, y, FULL_W, sizeBody, lhBody, { color: DARK_GRAY });
      }
    }
    else {
      for (const line of sec.content) {
        y = drawWrapped(p, line, MARGIN_X, y, FULL_W, sizeBody, lhBody, { color: DARK_GRAY });
        y -= 2;
      }
    }
    y -= 5;
  }

  const pdfBytes = await pdf.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, `${cleanFile}_optimized.pdf`);
}

// =====================================================================
// MAIN TWO-COLUMN PDF GENERATION
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
  templateType = 'two-column',
  primaryColor = '#1761c7',
  fontFamily = 'Rubik',
}) {
  if (templateType === 'single-column') {
    return await generateSingleColumnPDF({
      resumeText,
      fileName,
      score,
      jobTitle,
      email,
      phone,
      linkedin,
      userName,
      primaryColor,
      fontFamily,
    });
  }
  const PRIMARY = primaryColor ? hexToRgbColor(primaryColor) : rgb(0.09, 0.38, 0.78);
  // --- Extract contact info ---
  const finalName     = extractNameFromFilename(fileName) || extractName(resumeText) || userName || 'Palash Mishra';
  const finalJobTitle = extractJobTitle(resumeText) || jobTitle || 'Full Stack Developer';
  const finalEmail    = extractEmail(resumeText) || email || 'palashmishra47@gmail.com';
  const finalPhone    = extractPhoneNumber(resumeText) || phone || '+91-7428477219';
  const finalLinkedIn = extractLinkedIn(resumeText) || linkedin || 'linkedin.com/in/palash-mishra-6a68a71aa';
  const finalGitHub   = extractGitHub(resumeText)    || '';

  // --- Initialize Document ---
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

  const sections  = parseResumeSections(resumeText, { userName: finalName, email: finalEmail, phone: finalPhone, linkedin: finalLinkedIn });
  const cleanFile = safeText(fileName).replace(/\.pdf$/i, '');

  // --- Dimension Parameters (Two Column Layout) ---
  const COL_GAP        = 20;
  const FULL_W         = PAGE_WIDTH - MARGIN_X * 2;
  const LEFT_COL_W     = Math.floor(FULL_W * 0.58); // Left column gets ~58% width (Summary, Experience, Projects)
  const RIGHT_COL_W    = FULL_W - LEFT_COL_W - COL_GAP; // Right column gets ~39% width (Skills, Education)
  const LEFT_COL_X     = MARGIN_X;
  const RIGHT_COL_X    = MARGIN_X + LEFT_COL_W + COL_GAP;

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

  // --- Font sizes & leading (with dynamic auto-fit for long resumes) ---
  const isLong = resumeText.length > 2500;
  
  const sizeName        = isLong ? 20 : 24;
  const sizeTitle       = isLong ? 10 : 11.5;
  const sizeContact     = isLong ? 7.8 : 8.2;
  const sizeSection     = isLong ? 8.8 : 9.5;
  const sizeEntryHeader = isLong ? 8.2 : 9.0;
  const sizeSubtitle    = isLong ? 7.5 : 8.2;
  const sizeBody        = isLong ? 7.2 : 8.0;

  const lhBody         = isLong ? 9.8 : 11.0;
  const lhEntryHeader = isLong ? 11.0 : 12.0;
  const lhSubtitle     = isLong ? 9.8 : 11.0;
  
  const secSpace       = isLong ? 8 : 14;
  const entrySpace     = isLong ? 3 : 6;

  // Create page
  const p = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN_TOP;

  // Active page trackers for left/right column page break rollovers
  let activeLeftPage = p;
  let activeRightPage = p;

  // Draw Helpers
  const drawText = (page, text, x, y, size, opts = {}) => {
    const s = safeText(text);
    if (!s) return;
    page.drawText(s, { x, y, size, font: pickFont(opts), color: opts.color || BLACK });
  };

  const drawLeftWrapped = (text, x, yVal, maxWidth, size, lineHeight, opts = {}) => {
    const lines = wrapText(text, maxWidth, size, opts);
    let cy = yVal;
    for (const ln of lines) {
      if (cy < MARGIN_BOTTOM + 12) {
        let pageList = pdf.getPages();
        let page2;
        if (pageList.length < 2) {
          page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
        } else {
          page2 = pageList[1];
        }
        activeLeftPage = page2;
        cy = PAGE_HEIGHT - MARGIN_TOP;
      }
      drawText(activeLeftPage, ln, x, cy, size, opts);
      cy -= lineHeight;
    }
    return cy;
  };

  const drawLeftBullet = (text, yVal, size, lineHeight) => {
    if (yVal < MARGIN_BOTTOM + 12) {
      let pageList = pdf.getPages();
      let page2;
      if (pageList.length < 2) {
        page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
      } else {
        page2 = pageList[1];
      }
      activeLeftPage = page2;
      yVal = PAGE_HEIGHT - MARGIN_TOP;
    }
    drawText(activeLeftPage, '•', LEFT_COL_X + 2, yVal, size, { color: PRIMARY });
    return drawLeftWrapped(text, LEFT_COL_X + 12, yVal, LEFT_COL_W - 12, size, lineHeight, { color: DARK_GRAY });
  };

  const drawRightWrapped = (text, x, yVal, maxWidth, size, lineHeight, opts = {}) => {
    const lines = wrapText(text, maxWidth, size, opts);
    let cy = yVal;
    for (const ln of lines) {
      if (cy < MARGIN_BOTTOM + 12) {
        let pageList = pdf.getPages();
        let page2;
        if (pageList.length < 2) {
          page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
        } else {
          page2 = pageList[1];
        }
        activeRightPage = page2;
        cy = PAGE_HEIGHT - MARGIN_TOP;
      }
      drawText(activeRightPage, ln, x, cy, size, opts);
      cy -= lineHeight;
    }
    return cy;
  };

  // --- Render Header (Centered) ---
  // Top page accent bar
  p.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 6,
    width: PAGE_WIDTH,
    height: 6,
    fill: PRIMARY
  });
  
  // Name
  drawText(p, finalName.toUpperCase(), MARGIN_X, cursorY, sizeName, { bold: true, color: BLACK });
  cursorY -= sizeName + (isLong ? 2 : 4);

  // Job Title
  if (finalJobTitle) {
    drawText(p, finalJobTitle.toUpperCase(), MARGIN_X, cursorY, sizeTitle, { bold: true, color: PRIMARY });
    cursorY -= sizeTitle + (isLong ? 6 : 8);
  }

  // Contact Info Row in colored Banner
  const contactParts = [
    finalPhone ? `Phone: ${finalPhone}` : '',
    finalEmail ? `Email: ${finalEmail}` : '',
    finalLinkedIn ? `LinkedIn: ${finalLinkedIn.replace(/^https?:\/\/(www\.)?/, '')}` : '',
    finalGitHub ? `GitHub: ${finalGitHub.replace(/^https?:\/\/(www\.)?/, '')}` : ''
  ].filter(Boolean);

  const sep = '   •   ';
  const contactStr = contactParts.join(sep);
  const bannerH = isLong ? 15 : 18;
  
  // Draw light-teal banner background
  p.drawRectangle({
    x: MARGIN_X,
    y: cursorY - (isLong ? 4 : 2),
    width: FULL_W,
    height: bannerH,
    color: rgb(0.93, 0.96, 0.98),
  });

  // Center contact text inside the banner
  const contactW = tw(contactStr, sizeContact);
  drawText(p, contactStr, MARGIN_X + (FULL_W - contactW) / 2, cursorY - (isLong ? 1 : 0), sizeContact, { color: DARK_GRAY });
  cursorY -= bannerH + (isLong ? 10 : 15);

  const topColumnsY = cursorY; // Keep columns synchronized at this top level

  // ====================================================================
  // DRAW LEFT COLUMN (Summary, Experience, Projects)
  // ====================================================================
  let leftY = topColumnsY;

  const drawLeftSectionHeader = (title) => {
    leftY -= (isLong ? 3 : 5);
    if (leftY < MARGIN_BOTTOM + 25) {
      let pageList = pdf.getPages();
      let page2;
      if (pageList.length < 2) {
        page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
      } else {
        page2 = pageList[1];
      }
      activeLeftPage = page2;
      leftY = PAGE_HEIGHT - MARGIN_TOP;
    }
    drawText(activeLeftPage, title.toUpperCase(), LEFT_COL_X, leftY, sizeSection, { bold: true, color: PRIMARY });
    leftY -= 2;
    activeLeftPage.drawLine({
      start: { x: LEFT_COL_X, y: leftY },
      end: { x: LEFT_COL_X + LEFT_COL_W, y: leftY },
      thickness: 1.0,
      color: PRIMARY
    });
    leftY -= (isLong ? 4 : 8);
  };

  // Summary
  const summarySec = sections.find(s => s.title.toLowerCase() === 'summary');
  if (summarySec) {
    drawLeftSectionHeader('Summary');
    for (const rawLine of summarySec.content) {
      const trimmed = safeText(rawLine).trim();
      if (!trimmed) continue;
      leftY = drawLeftWrapped(trimmed, LEFT_COL_X, leftY, LEFT_COL_W, sizeBody, lhBody, { color: DARK_GRAY });
      leftY -= (isLong ? 1 : 2);
    }
    leftY -= secSpace;
  }

  // Experience
  const expSec = sections.find(s => s.title.toLowerCase().includes('experience'));
  if (expSec) {
    drawLeftSectionHeader('Experience');
    for (const rawLine of expSec.content) {
      const trimmed = safeText(rawLine).trim();
      if (!trimmed) continue;

      const isBullet = trimmed.startsWith('•');
      const bulletTxt = isBullet ? trimmed.replace(/^•\s*/, '') : '';

      if (!isBullet && /\d{4}/.test(trimmed)) {
        const { label, date } = splitLabelAndDate(trimmed);
        leftY -= entrySpace;
        
        if (leftY < MARGIN_BOTTOM + 20) {
          let pageList = pdf.getPages();
          let page2;
          if (pageList.length < 2) {
            page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
          } else {
            page2 = pageList[1];
          }
          activeLeftPage = page2;
          leftY = PAGE_HEIGHT - MARGIN_TOP;
        }

        const dateW = tw(date, sizeSubtitle, { italic: true });
        drawText(activeLeftPage, safeText(label), LEFT_COL_X, leftY, sizeEntryHeader, { bold: true, color: BLACK });
        if (date) {
          drawText(activeLeftPage, date, LEFT_COL_X + LEFT_COL_W - dateW, leftY, sizeSubtitle, { italic: true, color: GRAY });
        }
        leftY -= lhEntryHeader;
        continue;
      }
      if (!isBullet && /\b(developer|engineer|intern|analyst|consultant|lead|architect|manager|designer|specialist|devops|sde)\b/i.test(trimmed)) {
        leftY = drawLeftWrapped(trimmed, LEFT_COL_X, leftY, LEFT_COL_W, sizeSubtitle, lhSubtitle, { bold: true, color: DARK_GRAY });
        leftY -= (isLong ? 0.5 : 2);
        continue;
      }
      if (isBullet) {
        leftY = drawLeftBullet(bulletTxt, leftY, sizeBody, lhBody);
        leftY -= (isLong ? 0.5 : 1);
        continue;
      }
      leftY = drawLeftWrapped(trimmed, LEFT_COL_X, leftY, LEFT_COL_W, sizeBody, lhBody, { color: DARK_GRAY });
      leftY -= (isLong ? 1 : 2);
    }
    leftY -= secSpace;
  }

  // Projects
  const projSec = sections.find(s => s.title.toLowerCase().includes('project'));
  if (projSec) {
    drawLeftSectionHeader('Projects');
    for (const rawLine of projSec.content) {
      const trimmed = safeText(rawLine).trim();
      if (!trimmed) continue;

      const isBullet = trimmed.startsWith('•');
      const bulletTxt = isBullet ? trimmed.replace(/^•\s*/, '') : '';

      if (!isBullet && trimmed.includes('|')) {
        const parts = trimmed.split('|').map(pt => safeText(pt).trim());
        const name  = parts[0];
        const rest  = parts.slice(1).join(' | ');
        const { label: tech, date } = splitLabelAndDate(rest);
        const display = tech ? `${name}  |  ${tech}` : name;
        leftY -= entrySpace;

        if (leftY < MARGIN_BOTTOM + 20) {
          let pageList = pdf.getPages();
          let page2;
          if (pageList.length < 2) {
            page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
          } else {
            page2 = pageList[1];
          }
          activeLeftPage = page2;
          leftY = PAGE_HEIGHT - MARGIN_TOP;
        }

        const dateW = tw(date, sizeSubtitle, { italic: true });
        drawText(activeLeftPage, display, LEFT_COL_X, leftY, sizeEntryHeader, { bold: true, color: BLACK });
        if (date) {
          drawText(activeLeftPage, date, LEFT_COL_X + LEFT_COL_W - dateW, leftY, sizeSubtitle, { italic: true, color: GRAY });
        }
        leftY -= lhEntryHeader;
        continue;
      }
      if (!isBullet && /\d{4}/.test(trimmed)) {
        const { label, date } = splitLabelAndDate(trimmed);
        leftY -= entrySpace;

        if (leftY < MARGIN_BOTTOM + 20) {
          let pageList = pdf.getPages();
          let page2;
          if (pageList.length < 2) {
            page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
          } else {
            page2 = pageList[1];
          }
          activeLeftPage = page2;
          leftY = PAGE_HEIGHT - MARGIN_TOP;
        }

        const dateW = tw(date, sizeSubtitle, { italic: true });
        drawText(activeLeftPage, safeText(label), LEFT_COL_X, leftY, sizeEntryHeader, { bold: true, color: BLACK });
        if (date) {
          drawText(activeLeftPage, date, LEFT_COL_X + LEFT_COL_W - dateW, leftY, sizeSubtitle, { italic: true, color: GRAY });
        }
        leftY -= lhEntryHeader;
        continue;
      }
      if (isBullet) {
        leftY = drawLeftBullet(bulletTxt, leftY, sizeBody, lhBody);
        leftY -= (isLong ? 0.5 : 1);
        continue;
      }
      leftY = drawLeftWrapped(trimmed, LEFT_COL_X, leftY, LEFT_COL_W, sizeBody, lhBody, { color: DARK_GRAY });
      leftY -= (isLong ? 1 : 2);
    }
  }

  // ====================================================================
  // DRAW RIGHT COLUMN (Skills with Rounded Badges, Education)
  // ====================================================================
  let rightY = topColumnsY;

  const drawRightSectionHeader = (title) => {
    rightY -= (isLong ? 3 : 5);
    if (rightY < MARGIN_BOTTOM + 25) {
      let pageList = pdf.getPages();
      let page2;
      if (pageList.length < 2) {
        page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
      } else {
        page2 = pageList[1];
      }
      activeRightPage = page2;
      rightY = PAGE_HEIGHT - MARGIN_TOP;
    }
    drawText(activeRightPage, title.toUpperCase(), RIGHT_COL_X, rightY, sizeSection, { bold: true, color: PRIMARY });
    rightY -= 2;
    activeRightPage.drawLine({
      start: { x: RIGHT_COL_X, y: rightY },
      end: { x: RIGHT_COL_X + RIGHT_COL_W, y: rightY },
      thickness: 1.0,
      color: PRIMARY
    });
    rightY -= (isLong ? 4 : 8);
  };

  // Skills Section
  const skillsSec = sections.find(s => s.title.toLowerCase().includes('skill') || s.title.toLowerCase().includes('technolog'));
  if (skillsSec) {
    drawRightSectionHeader('Skills');
    for (const rawLine of skillsSec.content) {
      const trimmed = safeText(rawLine).trim();
      if (!trimmed) continue;

      if (trimmed.includes(':')) {
        const colon = trimmed.indexOf(':');
        const category = trimmed.slice(0, colon).trim();
        const value = trimmed.slice(colon + 1).trim();

        // Draw Category Subheading
        rightY -= 4;
        if (rightY < MARGIN_BOTTOM + 20) {
          let pageList = pdf.getPages();
          let page2;
          if (pageList.length < 2) {
            page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
          } else {
            page2 = pageList[1];
          }
          activeRightPage = page2;
          rightY = PAGE_HEIGHT - MARGIN_TOP;
        }
        drawText(activeRightPage, category, RIGHT_COL_X, rightY, sizeSubtitle, { bold: true, color: BLACK });
        rightY -= lhSubtitle;

        // Parse individual comma-separated skills and draw them as premium badges
        const skillsList = value.split(',').map(s => s.trim()).filter(Boolean);
        let badgeX = RIGHT_COL_X;
        const badgeHeight = sizeBody + 6;

        for (const skill of skillsList) {
          const textW = tw(skill, sizeBody);
          const badgeWidth = textW + 10;

          // Wrap badges to next row if they exceed the column width boundary
          if (badgeX + badgeWidth > RIGHT_COL_X + RIGHT_COL_W) {
            badgeX = RIGHT_COL_X;
            rightY -= (badgeHeight + 4);
          }

          if (rightY < MARGIN_BOTTOM + 15) {
            let pageList = pdf.getPages();
            let page2;
            if (pageList.length < 2) {
              page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
            } else {
              page2 = pageList[1];
            }
            activeRightPage = page2;
            rightY = PAGE_HEIGHT - MARGIN_TOP;
            badgeX = RIGHT_COL_X;
          }

          // Draw Badge Background
          activeRightPage.drawRectangle({
            x: badgeX,
            y: rightY - 2,
            width: badgeWidth,
            height: badgeHeight,
            color: PRIMARY,
          });

          // Draw Skill Text
          drawText(activeRightPage, skill, badgeX + 5, rightY + 1, sizeBody, { color: rgb(1, 1, 1) });
          badgeX += badgeWidth + 4; // space between badges
        }
        rightY -= (badgeHeight + 8);
      } else {
        // Flat skills without category: render as simple badge line wrapping
        const skillsList = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        let badgeX = RIGHT_COL_X;
        const badgeHeight = sizeBody + 6;

        for (const skill of skillsList) {
          const textW = tw(skill, sizeBody);
          const badgeWidth = textW + 10;

          if (badgeX + badgeWidth > RIGHT_COL_X + RIGHT_COL_W) {
            badgeX = RIGHT_COL_X;
            rightY -= (badgeHeight + 4);
          }

          if (rightY < MARGIN_BOTTOM + 15) {
            let pageList = pdf.getPages();
            let page2;
            if (pageList.length < 2) {
              page2 = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              page2.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: PRIMARY });
            } else {
              page2 = pageList[1];
            }
            activeRightPage = page2;
            rightY = PAGE_HEIGHT - MARGIN_TOP;
            badgeX = RIGHT_COL_X;
          }

          activeRightPage.drawRectangle({
            x: badgeX,
            y: rightY - 2,
            width: badgeWidth,
            height: badgeHeight,
            color: PRIMARY,
          });

          drawText(activeRightPage, skill, badgeX + 5, rightY + 1, sizeBody, { color: rgb(1, 1, 1) });
          badgeX += badgeWidth + 4;
        }
        rightY -= (badgeHeight + 8);
      }
    }
    rightY -= 5;
  }

  // Education Section
  const eduSec = sections.find(s => s.title.toLowerCase().includes('education'));
  if (eduSec) {
    drawRightSectionHeader('Education');
    for (const rawLine of eduSec.content) {
      const trimmed = safeText(rawLine).trim();
      if (!trimmed) continue;

      const isInst = /\b(university|college|school|institute|academy|vellore)\b/i.test(trimmed);

      if (isInst) {
        rightY -= 4;
        rightY = drawRightWrapped(trimmed, RIGHT_COL_X, rightY, RIGHT_COL_W, sizeSubtitle, lhSubtitle, { bold: true, color: BLACK });
        continue;
      }

      if (trimmed.startsWith('•') || trimmed.startsWith('+') || trimmed.startsWith('-')) {
        const bulletTxt = trimmed.replace(/^[•+\-]\s*/, '');
        rightY = drawRightWrapped(`•  ${bulletTxt}`, RIGHT_COL_X, rightY, RIGHT_COL_W, sizeBody, lhBody, { color: DARK_GRAY });
        continue;
      }

      // Default draw wrapped
      rightY = drawRightWrapped(trimmed, RIGHT_COL_X, rightY, RIGHT_COL_W, sizeBody, lhBody, { color: DARK_GRAY });
    }
  }

  // --- Save ---
  const pdfBytes = await pdf.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, `${cleanFile}_optimized.pdf`);
}