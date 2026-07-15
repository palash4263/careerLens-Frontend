// src/utils/pdfGenerator.js
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

const PAGE_WIDTH  = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X    = 36; // 0.5 inch professional margins
const MARGIN_TOP  = 24; // Optimized for strict single-page capacity
const MARGIN_BOTTOM = 24;

// ====== COLOR PALETTE (Marcus Hall Clean Theme) ======
const BLACK         = rgb(0.12, 0.14, 0.17);   // deep dark text
const DARK_GRAY    = rgb(0.33, 0.37, 0.43);   // body text gray
const GRAY         = rgb(0.50, 0.55, 0.62);
const LIGHT_GRAY   = rgb(0.93, 0.95, 0.97);   // ultra-clean soft gray badge background

const ROLE_REGEX = /\b(developer|engineer|intern|analyst|consultant|lead|architect|manager|designer|specialist|devops|sde)\b/i;

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
  let clean = fileName.replace(/\.pdf$/i, '').replace(/[_.\-]optimized/i, '').replace(/[_.\-]resume/i, '').replace(/resume/i, '');
  clean = clean.replace(/\d+/g, '').replace(/\(\s*\)/g, '');
  clean = clean.replace(/[_\-]+/g, ' ').trim();
  if (!clean.includes(' ')) clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
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

const SECTION_ALIASES = {
  Header:         ['Header', 'Contact', 'Contact Info', 'Personal Info', 'Personal Information'],
  Summary:        ['Summary', 'Professional Summary', 'Objective', 'Profile', 'About'],
  Education:      ['Education', 'Academic Background'],
  Experience:     ['Experience', 'Work Experience', 'Professional Experience', 'Employment History', 'Career History'],
  Projects:       ['Projects', 'Personal Projects', 'Key Projects', 'Academic Projects'],
  Skills:         ['Skills', 'Technical Skills', 'Core Skills', 'Skills Summary', 'Technologies', 'Additional Skills'],
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

const DATE_PATTERN = /((?:[A-Za-z]{3,9}\.?\s+)?\d{4})\s*(?:[-–—]\s*((?:[A-Za-z]{3,9}\.?\s+)?\d{4}|Present|Current))?/i;

const splitLabelAndDate = (text) => {
  const t = safeText(text).trim();
  const m = t.match(DATE_PATTERN);
  if (!m) return { label: t, date: '' };
  const date  = m[0].trim();
  let label = t.slice(0, m.index).trim();
  label = label.replace(/[-–—,|]\s*$/, '').trim().replace(/\(\s*$/, '').replace(/\[\s*$/, '').trim();
  return { label: label || t, date: label ? date : '' };
};

async function createFontKit(pdf) {
  const font     = await pdf.embedFont(StandardFonts.Helvetica);
  const bold     = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic   = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const boldItal = await pdf.embedFont(StandardFonts.HelveticaBoldOblique);

  const pickFont = ({ bold: b, italic: i } = {}) => (b && i) ? boldItal : b ? bold : i ? italic : font;
  const tw = (text, size, opts = {}) => pickFont(opts).widthOfTextAtSize(safeText(text), size);
  const drawText = (page, text, x, y, size, opts = {}) => {
    const s = safeText(text);
    if (!s) return;
    page.drawText(s, { x, y, size, font: pickFont(opts), color: opts.color || BLACK });
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
        cur = useFont.widthOfTextAtSize(word, size) > maxWidth ? (lines.push(word), '') : word;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  return { tw, drawText, wrapText };
}

class Column {
  constructor(pdf, dh, PRIMARY, { x, width, y, accentBar = false, pageMode = 'strict-one-page', minGap = 8, bulletIndent = 10, bulletSizeAdd = 0.5 }) {
    Object.assign(this, { pdf, dh, PRIMARY, x, width, y, accentBar, pageMode, minGap, bulletIndent, bulletSizeAdd });
    this.page = pdf.getPages()[0];
  }

  ensure(minGap = this.minGap) {
    if (this.y >= MARGIN_BOTTOM + minGap) return;
    
    if (this.pageMode === 'strict-one-page') {
      this.y = MARGIN_BOTTOM + 1; 
      return;
    }

    const pages = this.pdf.getPages();
    const curIdx = pages.indexOf(this.page);
    if (curIdx === pages.length - 1) {
      const newPage = this.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      if (this.accentBar) {
        newPage.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: this.PRIMARY });
      }
      this.page = newPage;
    } else {
      this.page = pages[curIdx + 1];
    }
    this.y = PAGE_HEIGHT - MARGIN_TOP;
  }

  text(str, x, size, opts = {}) {
    this.dh.drawText(this.page, str, x, this.y, size, opts);
  }

  wrapped(str, size, lineHeight, opts = {}, minGap = this.minGap) {
    for (const line of this.dh.wrapText(str, this.width, size, opts)) {
      this.ensure(minGap);
      this.dh.drawText(this.page, line, this.x, this.y, size, opts);
      this.y -= lineHeight;
    }
  }

  bullet(str, size, lineHeight) {
    this.ensure(this.minGap);
    this.dh.drawText(this.page, '•', this.x + 2, this.y, size + this.bulletSizeAdd, { color: this.PRIMARY });
    const savedX = this.x, savedW = this.width;
    this.x += this.bulletIndent;
    this.width -= this.bulletIndent;
    this.wrapped(str, size, lineHeight, { color: DARK_GRAY });
    this.x = savedX;
    this.width = savedW;
  }

  // Anti-Collision Text Wrapper Engine to completely solve header text/date overlap visual bugs
  entryHeader(label, date, { entrySpace = 2, sizeEntryHeader, sizeSubtitle, lhEntryHeader, minGap = 10 }) {
    this.y -= entrySpace;
    this.ensure(minGap);
    const dateW = date ? this.dh.tw(date, sizeSubtitle, { italic: true }) : 0;
    
    if (date) {
      this.text(date, this.x + this.width - dateW, sizeSubtitle, { italic: true, color: GRAY });
    }
    
    // Smoothly calculate available safe text real estate mapping area
    const maxLabelW = date ? (this.width - dateW - 12) : this.width;
    const lines = this.dh.wrapText(label, maxLabelW, sizeEntryHeader, { bold: true });
    
    if (lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
          this.y -= lhEntryHeader;
          this.ensure(minGap);
        }
        this.text(lines[i], this.x, sizeEntryHeader, { bold: true, color: BLACK });
      }
    }
    this.y -= lhEntryHeader;
  }

  sectionHeader(title, size, { gapBefore = 5, gapAfter = 6, minGap = 12, lineThickness = 0.75, lineColor = this.PRIMARY } = {}) {
    this.y -= gapBefore;
    this.ensure(minGap);
    this.text(title.toUpperCase(), this.x, size, { bold: true, color: this.PRIMARY });
    this.y -= 3; 
    this.page.drawLine({ start: { x: this.x, y: this.y }, end: { x: this.x + this.width, y: this.y }, thickness: lineThickness, color: lineColor });
    this.y -= gapAfter; 
  }
}

const renderTimelineSection = (col, content, sizes, splitPipe = false) => {
  const { sizeEntryHeader, sizeSubtitle, sizeBody, lhBody, lhSubtitle, lhEntryHeader, entrySpace } = sizes;
  for (const rawLine of content) {
    let trimmed = safeText(rawLine).trim();
    if (!trimmed) continue;

    // Prefilter interceptor: strip bullets from project headers so they match the bold path perfectly
    if (splitPipe && trimmed.includes('|')) {
      trimmed = trimmed.replace(/^•\s*/, '');
    }

    const isBullet = trimmed.startsWith('•');
    const bulletTxt = isBullet ? trimmed.replace(/^•\s*/, '') : '';

    if (splitPipe && trimmed.includes('|')) {
      const parts = trimmed.split('|').map(pt => safeText(pt).trim());
      const name = parts[0];
      const { label: tech, date } = splitLabelAndDate(parts.slice(1).join(' | '));
      col.entryHeader(tech ? `${name}  |  ${tech}` : name, date, { entrySpace, sizeEntryHeader, sizeSubtitle, lhEntryHeader });
      continue;
    }
    if (!isBullet && /\d{4}/.test(trimmed)) {
      const { label, date } = splitLabelAndDate(trimmed);
      col.entryHeader(safeText(label), date, { entrySpace, sizeEntryHeader, sizeSubtitle, lhEntryHeader });
      continue;
    }
    if (!isBullet && ROLE_REGEX.test(trimmed)) {
      col.wrapped(trimmed, sizeSubtitle, lhSubtitle, { bold: true, color: DARK_GRAY });
      col.y -= 1;
      continue;
    }
    if (isBullet) {
      col.bullet(bulletTxt, sizeBody, lhBody);
      continue;
    }
    col.wrapped(trimmed, sizeBody, lhBody, { color: DARK_GRAY });
  }
};

const renderEducationSection = (col, content, sizes) => {
  const { sizeSubtitle, sizeBody, lhSubtitle, lhBody } = sizes;
  for (const rawLine of content) {
    const trimmed = safeText(rawLine).trim();
    if (!trimmed) continue;

    if (/\b(university|college|school|institute|academy|vellore)\b/i.test(trimmed)) {
      col.y -= 2;
      col.wrapped(trimmed, sizeSubtitle, lhSubtitle, { bold: true, color: BLACK });
      continue;
    }
    if (/^[•+\-]/.test(trimmed)) {
      col.wrapped(`•  ${trimmed.replace(/^[•+\-]\s*/, '')}`, sizeBody, lhBody, { color: DARK_GRAY });
      continue;
    }
    col.wrapped(trimmed, sizeBody, lhBody, { color: DARK_GRAY });
  }
};

const renderSkillBadges = (col, dh, skillsList, sizeBody) => {
  let badgeX = col.x;
  const badgeHeight = sizeBody + 5;
  const rowGap = 4;
  
  for (const skill of skillsList) {
    if (!skill) continue;
    if (skill.length > 25 || (skill.match(/\s/g) || []).length > 3) continue;

    const badgeWidth = dh.tw(skill, sizeBody) + 10;
    
    if (badgeX + badgeWidth > col.x + col.width) {
      badgeX = col.x;
      col.y -= (badgeHeight + rowGap);
    }
    col.ensure(badgeHeight + 1);

    col.page.drawRectangle({ 
      x: badgeX, 
      y: col.y - 2, 
      width: badgeWidth, 
      height: badgeHeight, 
      color: LIGHT_GRAY 
    });
    
    dh.drawText(col.page, skill, badgeX + 5, col.y + 1, sizeBody, { color: BLACK });
    badgeX += badgeWidth + 5;
  }
  
  if (badgeX > col.x) {
    col.y -= (badgeHeight + rowGap);
  }
};

const renderSkillsSection = (col, dh, content, sizeSubtitle, sizeBody, lhSubtitle) => {
  for (const rawLine of content) {
    let trimmed = safeText(rawLine).trim();
    if (!trimmed) continue;

    trimmed = trimmed.replace(/^[\text{•}\-\*\s]+/, '');

    if (trimmed.includes(':')) {
      const colon = trimmed.indexOf(':');
      const category = trimmed.slice(0, colon).trim();
      const value = trimmed.slice(colon + 1).trim();
      
      const fragments = value.split(',').map(s => s.trim()).filter(Boolean);
      const validSkills = fragments.filter(f => !(f.length > 25 || (f.match(/\s/g) || []).length > 3));
      
      if (validSkills.length > 0) {
        col.y -= 6;
        col.ensure(14);
        col.text(category, col.x, sizeSubtitle, { bold: true, color: BLACK });
        col.y -= (lhSubtitle + 3);
        renderSkillBadges(col, dh, validSkills, sizeBody);
      }
    } else {
      const isHeading = /(tools|technolog|database|framework|devops|version|platform|cloud|languages)/i.test(trimmed) && trimmed.length < 30;
      
      if (isHeading) {
        col.y -= 6;
        col.ensure(14);
        col.text(trimmed, col.x, sizeSubtitle, { bold: true, color: BLACK });
        col.y -= (lhSubtitle + 3);
      } else {
        const fragments = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        const validSkills = fragments.filter(f => !(f.length > 25 || (f.match(/\s/g) || []).length > 3));
        
        if (validSkills.length > 0) {
          renderSkillBadges(col, dh, validSkills, sizeBody);
        }
      }
    }
  }
};

const resolveIdentity = (resumeText, fileName, opts) => ({
  name:     extractNameFromFilename(fileName) || extractName(resumeText) || opts.userName || 'Applicant Name',
  title:    extractJobTitle(resumeText) || opts.jobTitle || 'Software Engineer',
  email:    extractEmail(resumeText) || opts.email || '',
  phone:    extractPhoneNumber(resumeText) || opts.phone || '',
  linkedin: extractLinkedIn(resumeText) || opts.linkedin || '',
  github:   extractGitHub(resumeText) || '',
});

// =====================================================================
// SINGLE-COLUMN PDF GENERATION
// =====================================================================
async function generateSingleColumnPDF({
  resumeText,
  fileName = 'resume',
  jobTitle = null,
  email    = null,
  phone    = null,
  linkedin = null,
  userName = null,
  primaryColor = '#1761c7',
}) {
  const PRIMARY = hexToRgbColor(primaryColor);
  const id = resolveIdentity(resumeText, fileName, { jobTitle, email, phone, linkedin, userName });

  const pdf = await PDFDocument.create();
  const dh  = await createFontKit(pdf);
  pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const sections  = parseResumeSections(resumeText, { userName: id.name, email: id.email, phone: id.phone, linkedin: id.linkedin });
  const cleanFile = safeText(fileName).replace(/\.pdf$/i, '');
  const FULL_W    = PAGE_WIDTH - MARGIN_X * 2;

  const col = new Column(pdf, dh, PRIMARY, { x: MARGIN_X, width: FULL_W, y: PAGE_HEIGHT - MARGIN_TOP, pageMode: 'strict-one-page' });

  const nameSize = 16;
  col.text(id.name, (PAGE_WIDTH - dh.tw(id.name, nameSize, { bold: true })) / 2, nameSize, { bold: true, color: PRIMARY });
  col.y -= 22; 

  const contactStr = [id.phone, id.email, id.linkedin, id.github].filter(Boolean).join("  |  ");
  const contactSize = 7.5;
  col.text(contactStr, (PAGE_WIDTH - dh.tw(contactStr, contactSize)) / 2, contactSize, { color: DARK_GRAY });
  col.y -= 22; 

  const sizes = {
    sizeSectionTitle: 9.5, sizeEntryHeader: 9.0, sizeSubtitle: 8.0, sizeBody: 7.8,
    lhBody: 10.5, lhEntryHeader: 11.5, lhSubtitle: 11.0, entrySpace: 2,
  };

  for (const canonical of ['Summary', 'Experience', 'Projects', 'Skills', 'Education', 'Certifications', 'Languages']) {
    const sec = sections.find(s => s.title.toLowerCase().includes(canonical.toLowerCase()));
    if (!sec || sec.content.length === 0) continue;

    col.y -= 4;
    col.sectionHeader(canonical, sizes.sizeSectionTitle, { gapBefore: 3, gapAfter: 6, minGap: 12, lineColor: rgb(0.88, 0.90, 0.93), lineThickness: 0.6 });

    if (canonical === 'Summary') {
      for (const line of sec.content) { col.wrapped(line, sizes.sizeBody, sizes.lhBody, { color: DARK_GRAY }); }
    } else if (canonical === 'Experience') {
      renderTimelineSection(col, sec.content, sizes, false);
    } else if (canonical === 'Projects') {
      renderTimelineSection(col, sec.content, sizes, true);
    } else if (canonical === 'Skills') {
      renderSkillsSection(col, dh, sec.content, sizes.sizeSubtitle, sizes.sizeBody, sizes.lhSubtitle, sizes.lhBody);
    } else if (canonical === 'Education') {
      renderEducationSection(col, sec.content, sizes);
    } else {
      for (const line of sec.content) { col.wrapped(line, sizes.sizeBody, sizes.lhBody, { color: DARK_GRAY }); }
    }
  }

  const pdfBytes = await pdf.save();
  saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${cleanFile}_optimized.pdf`);
}

// =====================================================================
// MAIN TWO-COLUMN PDF GENERATION
// =====================================================================
export async function generateResumePDF({
  resumeText,
  fileName = 'resume',
  jobTitle = null,
  email    = null,
  phone    = null,
  linkedin = null,
  userName = null,
  templateType = 'two-column',
  primaryColor = '#1761c7',
}) {
  if (templateType === 'single-column') {
    return generateSingleColumnPDF({ resumeText, fileName, jobTitle, email, phone, linkedin, userName, primaryColor });
  }

  const PRIMARY = hexToRgbColor(primaryColor);
  const id = resolveIdentity(resumeText, fileName, { jobTitle, email, phone, linkedin, userName });

  const pdf = await PDFDocument.create();
  const dh  = await createFontKit(pdf);
  const p   = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const sections  = parseResumeSections(resumeText, { userName: id.name, email: id.email, phone: id.phone, linkedin: id.linkedin });
  const cleanFile = safeText(fileName).replace(/\.pdf$/i, '');

  const skillsSec = sections.find(s => s.title.toLowerCase().includes('skill') || s.title.toLowerCase().includes('technolog'));
  
  let hasSkills = false;
  if (skillsSec && skillsSec.content && skillsSec.content.length > 0) {
    const validFragments = skillsSec.content.some(line => {
      const cleanLine = safeText(line).replace(/^[\text{•}\-\*\s]+/, '');
      if (cleanLine.includes(':')) return true;
      const frags = cleanLine.split(',').map(s => s.trim()).filter(Boolean);
      return frags.length > 0 && frags.every(f => f.length < 25 && (f.match(/\s/g) || []).length <= 3);
    });
    if (validFragments) hasSkills = true;
  }

  const COL_GAP     = 16;
  const FULL_W      = PAGE_WIDTH - MARGIN_X * 2;
  
  const LEFT_COL_W  = hasSkills ? Math.floor(FULL_W * 0.58) : FULL_W;
  const RIGHT_COL_W = hasSkills ? (FULL_W - LEFT_COL_W - COL_GAP) : 0;
  const LEFT_COL_X  = MARGIN_X;
  const RIGHT_COL_X = MARGIN_X + LEFT_COL_W + COL_GAP;

  const sizes = {
    sizeName: 18, 
    sizeTitle: 9.5, 
    sizeContact: 7.5,
    sizeSection: 9.0, 
    sizeEntryHeader: 8.5, 
    sizeSubtitle: 8.0, 
    sizeBody: 7.8, 
    lhBody: 10.5, 
    lhEntryHeader: 11.5,
    lhSubtitle: 11.0, 
    secSpace: 5, 
    entrySpace: 2,
  };

  let cursorY = PAGE_HEIGHT - MARGIN_TOP;

  p.drawRectangle({ x: 0, y: PAGE_HEIGHT - 5, width: PAGE_WIDTH, height: 5, fill: PRIMARY });

  dh.drawText(p, id.name.toUpperCase(), MARGIN_X, cursorY, sizes.sizeName, { bold: true, color: BLACK });
  cursorY -= sizes.sizeName + 12; 

  const contactStr = [
    id.phone ? `Phone: ${id.phone}` : '',
    id.email ? `Email: ${id.email}` : '',
    id.linkedin ? `LinkedIn: ${id.linkedin.replace(/^https?:\/\/(www\.)?/, '')}` : '',
    id.github ? `GitHub: ${id.github.replace(/^https?:\/\/(www\.)?/, '')}` : '',
  ].filter(Boolean).join('   •   ');

  const bannerH = 18; 
  p.drawRectangle({ x: MARGIN_X, y: cursorY - 4, width: FULL_W, height: bannerH, color: rgb(0.95, 0.96, 0.98) });
  const contactW = dh.tw(contactStr, sizes.sizeContact);
  dh.drawText(p, contactStr, MARGIN_X + (FULL_W - contactW) / 2, cursorY - 1, sizes.sizeContact, { color: DARK_GRAY });
  cursorY -= bannerH + 18; 

  const colOpts = { pageMode: 'strict-one-page', accentBar: true, minGap: 10, bulletIndent: 10, bulletSizeAdd: 0 };
  const left  = new Column(pdf, dh, PRIMARY, { x: LEFT_COL_X,  width: LEFT_COL_W,  y: cursorY, ...colOpts });
  const right = new Column(pdf, dh, PRIMARY, { x: RIGHT_COL_X, width: RIGHT_COL_W, y: cursorY, ...colOpts });
  left.page = right.page = p;

  const summarySec = sections.find(s => s.title.toLowerCase() === 'summary');
  if (summarySec) {
    left.sectionHeader('Summary', sizes.sizeSection, { gapBefore: 3, gapAfter: 6 });
    for (const line of summarySec.content) { left.wrapped(safeText(line).trim(), sizes.sizeBody, sizes.lhBody, { color: DARK_GRAY }); }
    left.y -= sizes.secSpace;
  }

  const expSec = sections.find(s => s.title.toLowerCase().includes('experience'));
  if (expSec) {
    left.sectionHeader('Experience', sizes.sizeSection, { gapBefore: 3, gapAfter: 6 });
    renderTimelineSection(left, expSec.content, sizes, false);
    left.y -= sizes.secSpace;
  }

  const projSec = sections.find(s => s.title.toLowerCase().includes('project'));
  if (projSec) {
    left.sectionHeader('Projects', sizes.sizeSection, { gapBefore: 3, gapAfter: 6 });
    renderTimelineSection(left, projSec.content, sizes, true);
  }

  if (hasSkills) {
    right.sectionHeader('Skills', sizes.sizeSection, { gapBefore: 3, gapAfter: 6 });
    renderSkillsSection(right, dh, skillsSec.content, sizes.sizeSubtitle, sizes.sizeBody, sizes.lhSubtitle, sizes.lhBody);
    right.y -= 4;
  }

  const eduSec = sections.find(s => s.title.toLowerCase().includes('education'));
  if (eduSec) {
    const targetCol = hasSkills ? right : left;
    if (!hasSkills) left.y -= sizes.secSpace;
    
    targetCol.sectionHeader('Education', sizes.sizeSection, { gapBefore: 3, gapAfter: 6 });
    renderEducationSection(targetCol, eduSec.content, sizes);
  }

  const pdfBytes = await pdf.save();
  saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${cleanFile}_optimized.pdf`);
}