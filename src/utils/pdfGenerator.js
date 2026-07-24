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
    .replace(/^\#+\s*/gm, '')
    .replace(/\*+$/gm, '')
    .trim();
};

const sanitizeWinAnsi = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
};

const safeText = (value) => {
  if (value === null || value === undefined || Number.isNaN(value) || value === 'NaN') return '';
  return sanitizeWinAnsi(stripMarkdown(String(value)));
};

const parseBulletPoints = (text) => {
  if (!text) return [];
  if (Array.isArray(text)) return text;
  return String(text).split('\n').map(l => l.trim()).filter(Boolean);
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

const cleanCandidateName = (nameStr) => {
  if (!nameStr || typeof nameStr !== 'string') return '';
  let clean = stripMarkdown(nameStr).trim();

  // Handle delimiters e.g. "Palash - Fullstack", "Palash | Fullstack Developer", "Palash : Full Stack"
  if (clean.includes('|')) clean = clean.split('|')[0].trim();
  if (clean.includes(' - ')) clean = clean.split(' - ')[0].trim();
  if (clean.includes(':')) clean = clean.split(':')[0].trim();

  // Regex for role / designation keywords
  const ROLE_PATTERN = /\b(full\s*stack|fullstack|full-stack|software|backend|frontend|web|mobile|devops|data|cloud|ml|ai|qa|ui\/ux|lead|senior|junior|principal|staff)?\s*(developer|engineer|intern|analyst|consultant|architect|manager|designer|specialist|sde|coder|programmer|technologist|administrator)\b/gi;
  clean = clean.replace(ROLE_PATTERN, '').trim();

  // Remove standalone designation terms if present e.g. "FULLSTACK", "DEVELOPER"
  const STANDALONE_ROLE = /\b(fullstack|full-stack|full\s+stack|developer|engineer|sde|backend|frontend|architect|analyst|consultant|intern|manager|designer|devops)\b/gi;
  clean = clean.replace(STANDALONE_ROLE, '').trim();

  // Clean trailing delimiters & spaces
  clean = clean.replace(/\s+/g, ' ').replace(/^[\s,\-_|]+|[\s,\-_|]+$/g, '').trim();
  return clean;
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
    if (/^[A-Za-z][A-Za-z\s.'-]{2,}$/.test(trimmed)) {
      const cleaned = cleanCandidateName(trimmed);
      if (cleaned) return cleaned;
    }
  }
  return null;
};

const extractNameFromFilename = (fileName) => {
  if (!fileName || typeof fileName !== 'string' || fileName.toLowerCase() === 'resume') return null;
  let clean = fileName.replace(/\.pdf$/i, '').replace(/[_.\-]optimized/i, '').replace(/[_.\-]resume/i, '').replace(/resume/i, '');
  clean = clean.replace(/\d+/g, '').replace(/\(\s*\)/g, '');
  clean = clean.replace(/([a-zA-Z]{3,})s$/i, '$1'); // Strip possessive 's' e.g. Palashs -> Palash
  clean = clean.replace(/[_\-]+/g, ' ').trim();
  if (!clean.includes(' ')) clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const fullNameStr = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return cleanCandidateName(fullNameStr);
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

const resolveIdentity = (resumeText, fileName, opts = {}) => {
  const headerText = opts.headerText || '';
  const headerLines = headerText.split('\n').map(l => l.trim()).filter(Boolean);

  const rawHeaderName = headerLines[0] && !headerLines[0].includes('@') && !headerLines[0].includes('+') && headerLines[0].length <= 60
    ? headerLines[0]
    : null;

  const headerNameClean = cleanCandidateName(rawHeaderName);
  const userNameOptClean = cleanCandidateName(opts.userName);

  // If header line gave a single word (e.g., "PALASH") after stripping designation, but opts.userName has full name (e.g. "Palash Mishra"), prefer opts.userName!
  let name = headerNameClean;
  if (!name || (name.split(' ').length === 1 && userNameOptClean && userNameOptClean.split(' ').length > 1)) {
    name = userNameOptClean || name;
  }

  if (!name) {
    name = extractName(resumeText || headerText) || extractNameFromFilename(fileName) || userNameOptClean || 'Applicant Name';
  }

  name = cleanCandidateName(name) || 'Applicant Name';

  const src = resumeText || headerText;
  return {
    name: name,
    role: '', // User explicitly requested designation to be omitted
    email: extractEmail(src) || opts.email || '',
    phone: extractPhoneNumber(src) || opts.phone || '',
    linkedin: extractLinkedIn(src) || opts.linkedin || '',
    github: extractGitHub(src) || '',
    contactLines: headerLines.slice(1),
  };
};

const SECTION_ALIASES = {
  Header:         ['Header', 'Contact', 'Contact Info', 'Personal Info', 'Personal Information'],
  Summary:        ['Summary', 'Professional Summary', 'Objective', 'Profile', 'About'],
  Education:      ['Education', 'Academic Background'],
  Experience:     ['Experience', 'Work Experience', 'Professional Experience', 'Employment History', 'Career History'],
  Projects:       ['Projects', 'Personal Projects', 'Key Projects', 'Academic Projects'],
  Skills:         ['Skills', 'Technical Skills', 'Core Skills', 'Skills Summary', 'Technologies', 'Additional Skills'],
  Certifications: ['Certifications', 'Certificates', 'Licenses & Certifications', 'Awards & Certifications'],
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
  
  const cleanLineForPdf = (t) => safeText(t).replace(/[\r\n\t]/g, ' ').trim();

  const tw = (text, size, opts = {}) => {
    const s = cleanLineForPdf(text);
    if (!s) return 0;
    return pickFont(opts).widthOfTextAtSize(s, size);
  };

  const drawText = (page, text, x, y, size, opts = {}) => {
    const s = cleanLineForPdf(text);
    if (!s) return;
    page.drawText(s, { x, y, size, font: pickFont(opts), color: opts.color || BLACK });
  };

  const wrapText = (text, maxWidth, size, opts = {}) => {
    const raw = safeText(text);
    if (!raw) return [];
    const useFont = pickFont(opts);
    
    // Split multi-line strings (such as Summary section) by newline first
    const paragraphs = raw.split(/\r?\n/);
    const lines = [];

    for (const para of paragraphs) {
      const trimmedPara = para.replace(/[\r\n\t]/g, ' ').trim();
      if (!trimmedPara) continue;

      const words = trimmedPara.split(/\s+/);
      let cur = '';
      for (const word of words) {
        if (!word) continue;
        const test = cur ? `${cur} ${word}` : word;
        if (useFont.widthOfTextAtSize(test, size) <= maxWidth) {
          cur = test;
        } else {
          if (cur) lines.push(cur);
          cur = useFont.widthOfTextAtSize(word, size) > maxWidth ? (lines.push(word), '') : word;
        }
      }
      if (cur) {
        lines.push(cur);
        cur = '';
      }
    }
    return lines;
  };

  return { tw, drawText, wrapText };
}

class Column {
  constructor(pdf, dh, PRIMARY, { x, width, y, accentBar = false, pageMode = 'multi-page', minGap = 8, bulletIndent = 10, bulletSizeAdd = 0.5 }) {
    Object.assign(this, { pdf, dh, PRIMARY, x, width, y, accentBar, pageMode, minGap, bulletIndent, bulletSizeAdd });
    this.page = pdf.getPages()[0];
  }

  // Ensure at least `neededPx` of vertical space remains. If not, move to a new page.
  ensure(neededPx = this.minGap) {
    if (this.y >= MARGIN_BOTTOM + neededPx) return;

    // Always paginate — never silently clamp
    const pages = this.pdf.getPages();
    const curIdx = pages.indexOf(this.page);
    if (curIdx === pages.length - 1) {
      const newPage = this.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      if (this.accentBar) {
        newPage.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, color: this.PRIMARY });
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

  // Pre-measure the entire wrapped block and ensure it fits atomically before drawing.
  wrapped(str, size, lineHeight, opts = {}, minGap = this.minGap) {
    const lines = this.dh.wrapText(str, this.width, size, opts);
    if (lines.length === 0) return;
    // Pre-check: if the whole block fits in remaining space, keep it together.
    const blockH = lines.length * lineHeight;
    if (blockH <= this.y - MARGIN_BOTTOM && blockH < PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM) {
      // It fits — draw without page break mid-block
      for (const line of lines) {
        this.dh.drawText(this.page, line, this.x, this.y, size, opts);
        this.y -= lineHeight;
      }
    } else {
      // Too tall or near boundary — draw line-by-line with individual ensure checks
      for (const line of lines) {
        this.ensure(lineHeight + minGap);
        this.dh.drawText(this.page, line, this.x, this.y, size, opts);
        this.y -= lineHeight;
      }
    }
  }

  // Truncate text to fit within maxWidth, appending '…' if needed
  truncateToWidth(str, size, maxWidth, opts = {}) {
    const s = str.trim();
    const full = this.dh.wrapText(s, maxWidth, size, opts);
    if (full.length === 0) return s;
    if (full.length > 1) return `${full[0].trimEnd()}…`;
    return full[0];
  }

  // Render a bullet point — pre-checks that enough space exists BEFORE writing dot+text.
  bullet(str, size, lineHeight) {
    // Ensure space for the bullet line BEFORE drawing (not after)
    this.ensure(lineHeight + this.minGap);
    this.dh.drawText(this.page, '•', this.x + 2, this.y, size + this.bulletSizeAdd, { color: this.PRIMARY });
    const availW = this.width - this.bulletIndent;
    const oneLine = this.truncateToWidth(str, size, availW, { color: DARK_GRAY });
    this.dh.drawText(this.page, oneLine, this.x + this.bulletIndent, this.y, size, { color: DARK_GRAY });
    this.y -= lineHeight;
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

  sectionHeader(title, size, { gapBefore = 6, gapAfter = 12, minGap = 14, lineThickness = 0.75, lineColor = this.PRIMARY } = {}) {
    this.y -= gapBefore;
    this.ensure(minGap);
    this.text(title.toUpperCase(), this.x, size, { bold: true, color: this.PRIMARY });
    this.y -= 5; 
    this.page.drawLine({ start: { x: this.x, y: this.y }, end: { x: this.x + this.width, y: this.y }, thickness: lineThickness, color: lineColor });
    this.y -= (gapAfter + 4); 
  }
}

const DATE_REGEX = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b.*?(?:[-–—].*?\b(?:Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}))?|\b\d{4}\b)/i;

const parseEntryBlocks = (contentLines) => {
  const blocks = [];
  let currentHeader = null;
  let currentDate = '';
  let currentSubtitle = '';
  let currentBullets = [];

  const flush = () => {
    if (currentHeader || currentBullets.length > 0) {
      blocks.push({
        header: currentHeader || '',
        date: currentDate || '',
        subtitle: currentSubtitle || '',
        bullets: currentBullets,
      });
      currentHeader = null;
      currentDate = '';
      currentSubtitle = '';
      currentBullets = [];
    }
  };

  for (let i = 0; i < contentLines.length; i++) {
    const raw = contentLines[i];
    const trimmed = safeText(raw).trim();
    if (!trimmed) continue;
    if (/^\s*\d+%\.?\s*$/.test(trimmed)) continue;

    const isBulletChar = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('+');
    const cleanLine = trimmed.replace(/^[•+\-\*]\s*/, '').trim();

    const dateMatch = trimmed.match(DATE_REGEX);
    const hasHeaderSeparator = /—|\||-/.test(trimmed) && trimmed.length < 90;

    const isNewHeader = !currentHeader || 
      (dateMatch && currentBullets.length > 0) || 
      (hasHeaderSeparator && !isBulletChar && currentBullets.length > 0 && trimmed.length < 80);

    if (isNewHeader) {
      if (currentHeader) flush();

      if (dateMatch) {
        currentDate = dateMatch[0].trim();
        const nonDatePart = trimmed.replace(dateMatch[0], '').replace(/[-–—,|]\s*$/, '').replace(/^[-–—,|]\s*/, '').trim();
        currentHeader = nonDatePart || trimmed;
      } else {
        currentHeader = cleanLine;
      }
      continue;
    }

    if (currentHeader && !currentSubtitle && !currentDate && currentBullets.length === 0 && !isBulletChar) {
      if (dateMatch) {
        currentDate = dateMatch[0].trim();
        const nonDatePart = trimmed.replace(dateMatch[0], '').replace(/[-–—,|]\s*$/, '').replace(/^[-–—,|]\s*/, '').trim();
        if (nonDatePart) currentSubtitle = nonDatePart;
        continue;
      } else if (trimmed.length < 90 && !/^(architected|designed|developed|built|engineered|utilized|containerized|improved|tuned|worked|created|lead|managed)\b/i.test(trimmed)) {
        currentSubtitle = cleanLine;
        continue;
      }
    }

    currentBullets.push(cleanLine);
  }

  flush();
  return blocks;
};

const renderTimelineSection = (col, content, sizes) => {
  const { sizeEntryHeader, sizeSubtitle, sizeBody, lhBody, lhSubtitle, lhEntryHeader } = sizes;
  const blocks = parseEntryBlocks(content);

  for (const blk of blocks) {
    if (blk.header) {
      col.wrapped(blk.header, sizeEntryHeader, lhEntryHeader, { bold: true, color: BLACK });
      col.y -= 1;
    }
    const subParts = [blk.subtitle, blk.date].filter(Boolean);
    if (subParts.length > 0) {
      const subLine = subParts.join(' | ');
      col.wrapped(subLine, sizeSubtitle, lhSubtitle, { italic: true, color: DARK_GRAY });
      col.y -= 2;
    }
    for (const b of blk.bullets) {
      col.bullet(b, sizeBody, lhBody);
    }
    col.y -= 4;
  }
};

const renderEducationSection = (col, content, sizes) => {
  const { sizeEntryHeader, sizeSubtitle, sizeBody, lhBody, lhSubtitle, lhEntryHeader } = sizes;
  const blocks = parseEntryBlocks(content);

  for (const blk of blocks) {
    if (blk.header) {
      col.wrapped(blk.header, sizeEntryHeader, lhEntryHeader, { bold: true, color: BLACK });
      col.y -= 1;
    }
    const subParts = [blk.subtitle, blk.date].filter(Boolean);
    if (subParts.length > 0) {
      const subLine = subParts.join(' | ');
      col.wrapped(subLine, sizeSubtitle, lhSubtitle, { italic: true, color: DARK_GRAY });
      col.y -= 2;
    }
    for (const b of blk.bullets) {
      col.bullet(b, sizeBody, lhBody);
    }
    col.y -= 4;
  }
};

const renderSkillBadges = (col, dh, skillsList, sizeBody) => {
  const badgeHeight = sizeBody + 5;
  const rowGap = 4;

  const validSkills = skillsList.filter(s => s && s.length <= 25 && (s.match(/\s/g) || []).length <= 3);
  if (validSkills.length === 0) return;

  const rows = [];
  let curRow = [];
  let curRowW = 0;
  for (const skill of validSkills) {
    const bw = dh.tw(skill, sizeBody) + 10 + 5;
    if (curRowW + bw > col.width && curRow.length > 0) {
      rows.push(curRow);
      curRow = [skill];
      curRowW = bw;
    } else {
      curRow.push(skill);
      curRowW += bw;
    }
  }
  if (curRow.length > 0) rows.push(curRow);

  for (const row of rows) {
    col.ensure(badgeHeight + rowGap + col.minGap);
    let badgeX = col.x;
    for (const skill of row) {
      const badgeWidth = dh.tw(skill, sizeBody) + 10;
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
    col.y -= (badgeHeight + rowGap);
  }
};

// Render skills using grouped text style matching live preview
const renderSkillsSection = (col, dh, content, sizeSubtitle, sizeBody, lhSubtitle, lhBody) => {
  for (const rawLine of content) {
    let trimmed = safeText(rawLine).trim();
    if (!trimmed) continue;
    trimmed = trimmed.replace(/^[•\-\*\s]+/, '').trim();
    if (!trimmed) continue;

    // Category lines with colon, e.g., "Languages: Java, Python..."
    if (trimmed.includes(':')) {
      const colonIdx = trimmed.indexOf(':');
      const category = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      const fragments = value.split(',').map(s => s.trim()).filter(Boolean);
      if (fragments.length > 0) {
        col.ensure(lhSubtitle + 4);
        const fullLine = `${category}: ${fragments.join(', ')}`;
        const lines = dh.wrapText(fullLine, col.width, sizeBody, {});
        for (let i = 0; i < lines.length; i++) {
          col.ensure(lhBody + col.minGap);
          if (i === 0 && lines[i].startsWith(`${category}:`)) {
            const catPrefix = `${category}:`;
            const catW = dh.tw(catPrefix, sizeBody, { bold: true });
            dh.drawText(col.page, catPrefix, col.x, col.y, sizeBody, { bold: true, color: BLACK });
            const rest = lines[i].slice(catPrefix.length);
            dh.drawText(col.page, rest, col.x + catW, col.y, sizeBody, { color: DARK_GRAY });
          } else {
            dh.drawText(col.page, lines[i], col.x, col.y, sizeBody, { color: DARK_GRAY });
          }
          col.y -= lhBody;
        }
        col.y -= 2;
      }
      continue;
    }

    const fragments = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    if (fragments.length > 0) {
      const line = fragments.join(', ');
      col.wrapped(line, sizeBody, lhBody, { color: DARK_GRAY });
      col.y -= 2;
    }
  }
};

const editedSectionsToSections = (editedSections) => {
  const ORDER = ['Header', 'Summary', 'Skills', 'Experience', 'Projects', 'Education', 'Certifications', 'Languages'];
  return ORDER
    .filter(k => editedSections[k] && editedSections[k].trim())
    .map(k => ({
      title: k,
      content: editedSections[k].split('\n').map(l => {
        let txt = safeText(l);
        if (/^[*\-]\s+/.test(txt)) {
          txt = txt.replace(/^[*\-]\s+/, '• ');
        }
        return txt;
      }).filter(Boolean),
    }));
};

// =====================================================================
// SINGLE-COLUMN PDF GENERATION
// =====================================================================
async function generateSingleColumnPDF({
  resumeText,
  editedSections = null,   // <-- direct sections object from live editor
  fileName = 'resume',
  jobTitle = null,
  email    = null,
  phone    = null,
  linkedin = null,
  userName = null,
  primaryColor = '#1761c7',
  pageMargins = 1,
  sectionSpacing = 3,
}) {
  const PRIMARY = hexToRgbColor(primaryColor);
  const headerText = editedSections?.Header || resumeText || '';
  const id = resolveIdentity(resumeText || '', fileName, { jobTitle, email, phone, linkedin, userName, headerText });

  const marginX = Number(pageMargins) === 1 ? 24 : Number(pageMargins) === 2 ? 36 : 48;
  const marginTop = Number(pageMargins) === 1 ? 18 : Number(pageMargins) === 2 ? 24 : 32;

  const pdf = await PDFDocument.create();
  const dh  = await createFontKit(pdf);
  pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Use editedSections directly if provided, otherwise fall back to text parsing
  const sections = editedSections
    ? editedSectionsToSections(editedSections)
    : parseResumeSections(resumeText, { userName: id.name, email: id.email, phone: id.phone, linkedin: id.linkedin });

  const cleanFile = safeText(fileName).replace(/\.pdf$/i, '');
  const FULL_W    = PAGE_WIDTH - marginX * 2;

  const col = new Column(pdf, dh, PRIMARY, { x: marginX, width: FULL_W, y: PAGE_HEIGHT - marginTop, pageMode: 'multi-page' });

  const nameSize = 16;
  col.text(id.name, (PAGE_WIDTH - dh.tw(id.name, nameSize, { bold: true })) / 2, nameSize, { bold: true, color: PRIMARY });
  col.y -= 18;

  // Role omitted from PDF output

  // Use raw header contact lines (matching preview) with fallback to regex-extracted fields
  const contactParts = (id.contactLines && id.contactLines.length > 0)
    ? id.contactLines
    : [id.phone, id.email, id.linkedin, id.github].filter(Boolean);
  const contactStr = contactParts.map(l => safeText(l).replace(/^https?:\/\/(www\.)?/, '').trim()).filter(Boolean).join(' | ');
  const contactSize = 7.5;
  if (contactStr) {
    col.text(contactStr, (PAGE_WIDTH - dh.tw(contactStr, contactSize)) / 2, contactSize, { color: DARK_GRAY });
    col.y -= 12;
  }

  // Draw header divider line matching live editor preview
  col.page.drawLine({
    start: { x: marginX, y: col.y },
    end: { x: PAGE_WIDTH - marginX, y: col.y },
    thickness: 1.5,
    color: PRIMARY,
  });
  col.y -= 18; 

  const sizes = {
    sizeSectionTitle: 9.5, sizeEntryHeader: 9.0, sizeSubtitle: 8.0, sizeBody: 7.8,
    lhBody: 10.5, lhEntryHeader: 11.5, lhSubtitle: 11.0, 
    entrySpace: Number(sectionSpacing) * 0.6,
    secSpace: Number(sectionSpacing) * 1.5,
  };

  for (const canonical of ['Summary', 'Skills', 'Experience', 'Projects', 'Education', 'Certifications', 'Languages']) {
    const sec = sections.find(s => s.title.toLowerCase().includes(canonical.toLowerCase()));
    if (!sec || sec.content.length === 0) continue;

    col.y -= (Number(sectionSpacing) * 1.2);
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
// MAIN TWO-COLUMN & SINGLE-COLUMN PDF GENERATION
// =====================================================================
export async function generateResumePDF({
  resumeText,
  editedSections = null,   // <-- direct sections object from live editor
  fileName = 'resume',
  jobTitle = null,
  email    = null,
  phone    = null,
  linkedin = null,
  userName = null,
  templateType = 'single-column',
  primaryColor = '#1761c7',
  pageMargins = 1,
  sectionSpacing = 3,
  baseFontSize = 10,
  mainSectionOrder = ['Summary', 'Experience', 'Projects'],
  sideSectionOrder = ['Skills', 'Education', 'Certifications'],
}) {
  const PRIMARY = hexToRgbColor(primaryColor);
  const WHITE   = rgb(1, 1, 1);
  const LIGHT_TEXT = rgb(0.92, 0.94, 0.97);

  const headerText = editedSections?.Header || resumeText || '';
  const id = resolveIdentity(resumeText || '', fileName, { jobTitle, email, phone, linkedin, userName, headerText });

  const pdf = await PDFDocument.create();
  const dh  = await createFontKit(pdf);
  const p   = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const cleanFile = safeText(fileName).replace(/\.pdf$/i, '');

  const fontScale = Number(baseFontSize) > 0 ? (Number(baseFontSize) / 10.0) : 1.0;

  const sizes = {
    sizeName: Math.max(12, 16 * fontScale), 
    sizeTitle: Math.max(7.5, 9.0 * fontScale), 
    sizeContact: Math.max(5.8, 7.2 * fontScale),
    sizeSection: Math.max(7.2, 9.0 * fontScale), 
    sizeEntryHeader: Math.max(6.8, 8.5 * fontScale), 
    sizeSubtitle: Math.max(6.2, 8.0 * fontScale), 
    sizeBody: Math.max(5.8, 7.6 * fontScale), 
    lhBody: Math.max(7.6, 10.5 * fontScale), 
    lhEntryHeader: Math.max(8.8, 11.5 * fontScale),
    lhSubtitle: Math.max(8.2, 11.0 * fontScale), 
    secSpace: Math.max(5, Number(sectionSpacing) * 1.5 * fontScale), 
    entrySpace: Number(sectionSpacing) * 0.6 * fontScale,
  };

  if (templateType === 'two-column') {
    const SIDEBAR_W = 165;
    const MAIN_X = 182;
    const MAIN_W = PAGE_WIDTH - MAIN_X - 20;

    // Dark sleek sidebar background (#121722)
    const SIDEBAR_BG = rgb(0.07, 0.09, 0.13);
    p.drawRectangle({ x: 0, y: 0, width: SIDEBAR_W, height: PAGE_HEIGHT, color: SIDEBAR_BG });

    // Accent line on sidebar right border
    p.drawLine({ start: { x: SIDEBAR_W, y: 0 }, end: { x: SIDEBAR_W, y: PAGE_HEIGHT }, thickness: 1, color: PRIMARY });

    let sideY = PAGE_HEIGHT - 32;

    // Compact Avatar Badge [ PM ]
    const initials = (id.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarBoxW = 42;
    const avatarBoxH = 26;
    const avatarX = (SIDEBAR_W - avatarBoxW) / 2;

    p.drawRectangle({
      x: avatarX,
      y: sideY - avatarBoxH,
      width: avatarBoxW,
      height: avatarBoxH,
      color: PRIMARY,
    });

    const initW = dh.tw(initials, 11);
    dh.drawText(p, initials, avatarX + (avatarBoxW - initW) / 2, sideY - 17, 11, { bold: true, color: WHITE });
    sideY -= avatarBoxH + 20;

    // Sidebar Name — render exactly as preview: full name inline (not split by first/last)
    // Preview: ecv-sidebar-name = Header.split('\n')[0]
    const fullName = safeText(id.name).trim();
    // Word-wrap the name if it's long (sidebar max width ≈ SIDEBAR_W - 28)
    const nameMaxW = SIDEBAR_W - 20;
    const nameSize = 11;
    const nameLines = dh.wrapText(fullName, nameMaxW, nameSize, { bold: true });
    for (const nl of nameLines) {
      const nlW = dh.tw(nl, nameSize, { bold: true });
      dh.drawText(p, nl, (SIDEBAR_W - nlW) / 2, sideY, nameSize, { bold: true, color: WHITE });
      sideY -= 14;
    }

    // Role/Title — render as preview: ecv-sidebar-role = Header.split('\n')[1]
    // Role omitted from PDF output

    // Sidebar Contact — mirror preview ecv-sidebar-line (Header lines 2+)
    // Prefer raw contactLines from header (same data as preview), fallback to extracted fields
    const rawContactLines = (id.contactLines && id.contactLines.length > 0)
      ? id.contactLines
      : [id.phone, id.email, id.linkedin, id.github].filter(Boolean);

    if (rawContactLines.length > 0) {
      dh.drawText(p, 'CONTACT', 14, sideY, 8.0, { bold: true, color: PRIMARY });
      p.drawLine({ start: { x: 14, y: sideY - 3 }, end: { x: SIDEBAR_W - 14, y: sideY - 3 }, thickness: 0.6, color: PRIMARY });
      sideY -= 14;

      for (const line of rawContactLines) {
        const clean = safeText(line).replace(/^https?:\/\/(www\.)?/, '').trim();
        if (!clean) continue;
        // Wrap long contact lines to sidebar width
        const cLines = dh.wrapText(clean, SIDEBAR_W - 28, 6.5, {});
        for (const cl of cLines) {
          dh.drawText(p, cl, 14, sideY, 6.5, { color: LIGHT_TEXT });
          sideY -= 10;
        }
      }
      sideY -= 8;
    }

    // Left Sidebar Column for Skills, Education, Certifications
    const sideCol = new Column(pdf, dh, WHITE, { x: 14, width: SIDEBAR_W - 28, y: sideY, pageMode: 'multi-page' });
    sideCol.page = p;

    // Render Side Sections
    for (const secKey of sideSectionOrder) {
      const secText = editedSections?.[secKey];
      if (!secText || !secText.trim()) continue;

      sideCol.sectionHeader(secKey.toUpperCase(), 8.5, { gapBefore: 6, gapAfter: 10 });

      if (secKey === 'Skills') {
        const lines = secText.split('\n').filter(Boolean);
        for (const line of lines) {
          const cleanLine = safeText(line).trim();
          if (!cleanLine) continue;
          if (cleanLine.includes(':')) {
            const [cat, val] = cleanLine.split(':');
            sideCol.wrapped(cat.trim() + ':', 7.0, 9.5, { color: PRIMARY });
            sideCol.wrapped(val.trim(), 6.5, 9.0, { color: LIGHT_TEXT });
          } else {
            sideCol.wrapped(`• ${cleanLine}`, 6.5, 9.0, { color: LIGHT_TEXT });
          }
        }
      } else {
        const lines = parseBulletPoints(secText);
        for (const line of lines) {
          const trimmed = safeText(line).trim();
          if (!trimmed) continue;
          sideCol.wrapped(`• ${trimmed.replace(/^[•+\-]\s*/, '')}`, 6.5, 9.0, { color: LIGHT_TEXT });
        }
      }
      sideCol.y -= sizes.secSpace;
    }

    // Main Right Column for Summary, Experience, Projects
    let mainY = PAGE_HEIGHT - 36;
    const mainCol = new Column(pdf, dh, PRIMARY, { x: MAIN_X, width: MAIN_W, y: mainY, pageMode: 'multi-page', accentBar: true });
    mainCol.page = p;

    for (const secKey of mainSectionOrder) {
      const secText = editedSections?.[secKey];
      if (!secText || !secText.trim()) continue;

      mainCol.sectionHeader(secKey === 'Summary' ? 'PROFESSIONAL SUMMARY' : secKey === 'Experience' ? 'WORK EXPERIENCE' : secKey.toUpperCase(), sizes.sizeSection, { gapBefore: 6, gapAfter: 10 });

      if (secKey === 'Summary') {
        mainCol.wrapped(safeText(secText).trim(), sizes.sizeBody, sizes.lhBody, { color: DARK_GRAY });
      } else {
        const lines = secText.split('\n').filter(Boolean);
        renderTimelineSection(mainCol, lines, sizes, secKey === 'Projects');
      }
      mainCol.y -= sizes.secSpace;
    }

  } else {
    // SINGLE-COLUMN ELEGANT EXECUTIVE LAYOUT
    let cursorY = PAGE_HEIGHT - 32;

    const nameStr = id.name.toUpperCase();
    const nameW = dh.tw(nameStr, sizes.sizeName, { bold: true });
    dh.drawText(p, nameStr, (PAGE_WIDTH - nameW) / 2, cursorY, sizes.sizeName, { bold: true, color: PRIMARY });
    cursorY -= 16;

    const contactParts = (id.contactLines && id.contactLines.length > 0)
      ? id.contactLines
      : [id.phone, id.email, id.linkedin, id.github].filter(Boolean);
    const contactStr = contactParts.map(l => safeText(l).replace(/^https?:\/\/(www\.)?/, '').trim()).filter(Boolean).join(' | ');
    if (contactStr) {
      const contactW = dh.tw(contactStr, sizes.sizeContact);
      dh.drawText(p, contactStr, (PAGE_WIDTH - contactW) / 2, cursorY, sizes.sizeContact, { color: DARK_GRAY });
      cursorY -= 12;
    }

    p.drawLine({
      start: { x: 36, y: cursorY },
      end: { x: PAGE_WIDTH - 36, y: cursorY },
      thickness: 1.5,
      color: PRIMARY,
    });
    cursorY -= 18;

    const singleCol = new Column(pdf, dh, PRIMARY, { x: 36, width: PAGE_WIDTH - 72, y: cursorY, pageMode: 'multi-page', accentBar: true });
    singleCol.page = p;

    const allSectionsOrder = [...mainSectionOrder, ...sideSectionOrder];
    for (const secKey of allSectionsOrder) {
      const secText = editedSections?.[secKey];
      if (!secText || !secText.trim()) continue;

      singleCol.sectionHeader(secKey.toUpperCase(), sizes.sizeSection, { gapBefore: 4, gapAfter: 6 });

      if (secKey === 'Summary') {
        singleCol.wrapped(safeText(secText).trim(), sizes.sizeBody, sizes.lhBody, { color: DARK_GRAY });
      } else if (secKey === 'Skills') {
        const skillsLines = secText.split('\n').filter(Boolean);
        renderSkillsSection(singleCol, dh, skillsLines, sizes.sizeSubtitle, sizes.sizeBody, sizes.lhSubtitle, sizes.lhBody);
      } else if (secKey === 'Experience' || secKey === 'Projects') {
        const lines = secText.split('\n').filter(Boolean);
        renderTimelineSection(singleCol, lines, sizes, secKey === 'Projects');
      } else {
        const lines = parseBulletPoints(secText);
        for (const line of lines) {
          singleCol.wrapped(`•  ${safeText(line).replace(/^[•+\-]\s*/, '')}`, sizes.sizeBody, sizes.lhBody, { color: DARK_GRAY });
        }
      }
      singleCol.y -= sizes.secSpace;
    }
  }

  const pdfBytes = await pdf.save();
  saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${cleanFile}_optimized.pdf`);
}