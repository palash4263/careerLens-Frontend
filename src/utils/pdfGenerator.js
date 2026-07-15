// src/utils/pdfGenerator.js
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

const PAGE_WIDTH = 595, PAGE_HEIGHT = 842, MARGIN_X = 36, MARGIN_TOP = 36, MARGIN_BOTTOM = 36;
const BLACK = rgb(0.12, 0.14, 0.17), DARK_GRAY = rgb(0.33, 0.37, 0.43), GRAY = rgb(0.50, 0.55, 0.62), LIGHT_GRAY = rgb(0.88, 0.90, 0.94);

const hexToRgbColor = (hex) => {
  if (!hex || typeof hex !== 'string') return rgb(0.09, 0.38, 0.78);
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255, g = parseInt(clean.substring(2, 4), 16) / 255, b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(Number.isNaN(r) ? 0.09 : r, Number.isNaN(g) ? 0.38 : g, Number.isNaN(b) ? 0.78 : b);
};

const safeText = (v) => !v || Number.isNaN(v) || v === 'NaN' ? '' : String(v).replace(/\*\*\*|\_\_\_|\*\*|\_\_|\*|\_/g, '').replace(/^\*+\s*|^\#+\s*|\*+$/gm, '').trim();

// =====================================================================
// EXTRACTORS & PARSERS
// =====================================================================
const extractPattern = (text, patterns, cleanFn = (x) => x) => {
  if (!text) return null;
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return cleanFn(m[1] || m[0]);
  }
  return null;
};

const extractPhoneNumber = (t) => extractPattern(t, [/\+91[\s-]?[6-9]\d{9}/, /\+91[\s-]?\d{10}/, /[6-9]\d{9}/, /\d{10}/], (p) => p.replace(/[^\d+]/g, '').length === 10 ? `+91${p}` : p);
const extractEmail = (t) => extractPattern(t, [/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/]);
const extractLinkedIn = (t) => extractPattern(t, [/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i]);
const extractGitHub = (t) => extractPattern(t, [/github\.com\/[a-zA-Z0-9_-]+/i]) || '';

const extractName = (rawText) => {
  if (!rawText) return null;
  return rawText.split('\n').map(l => safeText(l)).find(l => 
    l.length >= 3 && l.length <= 50 && !l.includes('@') &&
    !/(summary|objective|profile|experience|education|skills|projects|certif|language|technolog|contact|phone|email|linkedin|github)/i.test(l) &&
    /^[A-Za-z][A-Za-z\s.'-]{2,}$/.test(l)
  ) || null;
};

const extractNameFromFilename = (fileName) => {
  if (!fileName || fileName.toLowerCase() === 'resume') return null;
  let clean = fileName.replace(/\.pdf$/i, '').replace(/([_.\-](optimized|resume))|resume/ig, '').replace(/\d+|\(\s*\)/g, '').replace(/[_\-]+/g, ' ').trim();
  if (!clean.includes(' ')) clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
  return clean.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || null;
};

const extractJobTitle = (rawText) => {
  if (!rawText) return null;
  return rawText.split('\n').map(l => safeText(l)).find(l => 
    l.length <= 65 && !/(school|university|college|academy|institute|international)/i.test(l) &&
    /\b(developer|engineer|analyst|architect|manager|designer|consultant|specialist|lead|intern|full[- ]?stack|backend|frontend|data\s*scientist|software|devops|cloud|ml\s*engineer|ai\s*engineer)\b/i.test(l)
  ) || null;
};

const SECTION_ALIASES = {
  Summary: ['Summary', 'Professional Summary', 'Objective', 'Profile', 'About'],
  Education: ['Education', 'Academic Background'],
  Experience: ['Experience', 'Work Experience', 'Professional Experience', 'Employment History', 'Career History'],
  Projects: ['Projects', 'Personal Projects', 'Key Projects', 'Academic Projects'],
  Skills: ['Skills', 'Technical Skills', 'Core Skills', 'Skills Summary', 'Technologies'],
  Certifications: ['Certifications', 'Certificates', 'Licenses & Certifications', 'Awards & Certifications'],
  Languages: ['Languages', 'Language Proficiency'],
};

const parseResumeSections = (text, userData = {}) => {
  if (!text) return [];
  const sections = [], filters = [userData.userName, userData.email, userData.phone, userData.linkedin].filter(Boolean).map(s => s.toLowerCase());
  let curSec = null, curContent = [];

  const flush = () => {
    if (!curSec || curContent.length === 0) return;
    const match = sections.find(s => s.title === curSec);
    if (match) match.content.push(...curContent);
    else sections.push({ title: curSec, content: [...curContent] });
  };

  for (const raw of text.split('\n')) {
    const trimmed = safeText(raw);
    if (!trimmed || trimmed.toLowerCase().includes('envelope') || trimmed.toLowerCase().includes('phone-alt') || filters.some(f => trimmed.toLowerCase() === f)) continue;

    let headerMatch = null;
    const cleanLine = trimmed.replace(/[:#\-_*]/g, '').trim();
    for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
      if (aliases.some(a => new RegExp(`^${a}\\s*$`, 'i').test(cleanLine))) { headerMatch = { section: key, inline: '' }; break; }
      const m = cleanLine.match(new RegExp(`^(${aliases.join('|')}):\\s*(.+)$`, 'i'));
      if (m) { headerMatch = { section: key, inline: m[2].trim() }; break; }
    }

    if (headerMatch) {
      flush();
      curSec = headerMatch.section;
      curContent = headerMatch.inline ? [headerMatch.inline] : [];
      continue;
    }
    if (curSec === 'Education' || !['amity international school'].some(s => trimmed.toLowerCase().includes(s))) {
      if (!curSec) curSec = 'Summary';
      curContent.push(trimmed.replace(/^[\*\-]\s*|^•\s*/, '• '));
    }
  }
  flush();
  return sections;
};

const splitLabelAndDate = (text) => {
  const t = safeText(text), m = t.match(/((?:[A-Za-z]{3,9}\.?\s+)?\d{4})\s*(?:[-–—]\s*((?:[A-Za-z]{3,9}\.?\s+)?\d{4}|Present|Current))?/i);
  return m ? { label: t.slice(0, m.index).replace(/[-–—,|(\[]\s*$/, '').trim() || t, date: m[0].trim() } : { label: t, date: '' };
};

// =====================================================================
// CORE PDF RENDER ENGINE (DYNAMIC PAGINATION)
// =====================================================================
const getFont = (opts, fonts) => opts.bold && opts.italic ? fonts.boldItal : opts.bold ? fonts.bold : opts.italic ? fonts.italic : fonts.font;

const wrapText = (text, maxWidth, size, font) => {
  const s = safeText(text), words = s.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
};

const getOrAddPage = (pdf, pageIdx, primaryColor) => {
  const pages = pdf.getPages();
  if (pages[pageIdx]) return pages[pageIdx];
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, fill: primaryColor });
  return page;
};

const flowText = (ctx, text, x, maxWidth, size, lineHeight, opts = {}) => {
  const font = getFont(opts, ctx.fonts);
  const lines = wrapText(text, maxWidth, size, font);
  
  for (const line of lines) {
    if (ctx.y[ctx.col] < MARGIN_BOTTOM + 12) {
      ctx.pageIdx[ctx.col]++;
      ctx.y[ctx.col] = PAGE_HEIGHT - MARGIN_TOP;
    }
    const page = getOrAddPage(ctx.pdf, ctx.pageIdx[ctx.col], ctx.primaryColor);
    page.drawText(line, { x, y: ctx.y[ctx.col], size, font, color: opts.color || BLACK });
    ctx.y[ctx.col] -= lineHeight;
  }
};

const processCommonSections = (ctx, canonical, sec, fullW, sizeBody, lhBody, sizeSubtitle, lhSubtitle, sizeEntryHeader, lhEntryHeader, entrySpace) => {
  if (canonical === 'Summary') {
    sec.content.forEach(line => { flowText(ctx, line, ctx.x, fullW, sizeBody, lhBody, { color: DARK_GRAY }); ctx.y[ctx.col] -= 2; });
  } else if (['Experience', 'Projects'].includes(canonical)) {
    sec.content.forEach(rawLine => {
      const trimmed = safeText(rawLine);
      const isBullet = trimmed.startsWith('•');
      if (!isBullet && (/\d{4}/.test(trimmed) || trimmed.includes('|'))) {
        let display = trimmed, date = '';
        if (canonical === 'Projects' && trimmed.includes('|')) {
          const parts = trimmed.split('|').map(pt => safeText(pt).trim());
          const parsed = splitLabelAndDate(parts.slice(1).join(' | '));
          display = parsed.label ? `${parts[0]}  |  ${parsed.label}` : parts[0];
          date = parsed.date;
        } else {
          const parsed = splitLabelAndDate(trimmed);
          display = parsed.label;
          date = parsed.date;
        }
        ctx.y[ctx.col] -= entrySpace;
        const page = getOrAddPage(ctx.pdf, ctx.pageIdx[ctx.col], ctx.primaryColor);
        page.drawText(display, { x: ctx.x, y: ctx.y[ctx.col], size: sizeEntryHeader, font: ctx.fonts.bold, color: BLACK });
        if (date) {
          const fontItalic = ctx.fonts.italic;
          page.drawText(date, { x: ctx.x + fullW - fontItalic.widthOfTextAtSize(date, sizeSubtitle), y: ctx.y[ctx.col], size: sizeSubtitle, font: fontItalic, color: GRAY });
        }
        ctx.y[ctx.col] -= lhEntryHeader;
      } else if (!isBullet && canonical === 'Experience' && /\b(developer|engineer|intern|analyst|consultant|lead|architect|manager|designer|specialist|devops|sde)\b/i.test(trimmed)) {
        flowText(ctx, trimmed, ctx.x, fullW, sizeSubtitle, lhSubtitle, { bold: true, color: DARK_GRAY });
      } else {
        const text = isBullet ? trimmed.replace(/^•\s*/, '') : trimmed;
        if (isBullet) {
          const p = getOrAddPage(ctx.pdf, ctx.pageIdx[ctx.col], ctx.primaryColor);
          p.drawText('•', { x: ctx.x + 2, y: ctx.y[ctx.col], size: sizeBody, font: ctx.fonts.bold, color: ctx.primaryColor });
          flowText(ctx, text, ctx.x + 12, fullW - 12, sizeBody, lhBody, { color: DARK_GRAY });
        } else {
          flowText(ctx, text, ctx.x, fullW, sizeBody, lhBody, { color: DARK_GRAY });
        }
      }
    });
  }
};

// =====================================================================
// GENERATOR ROUTINES
// =====================================================================
export async function generateResumePDF(options) {
  const { resumeText, fileName = 'resume', templateType = 'two-column', primaryColor = '#1761c7' } = options;
  const PRIMARY = hexToRgbColor(primaryColor);
  const data = {
    userName: extractNameFromFilename(fileName) || extractName(resumeText) || options.userName || 'Palash Mishra',
    jobTitle: extractJobTitle(resumeText) || options.jobTitle || 'Full Stack Developer',
    email: extractEmail(resumeText) || options.email || 'palashmishra47@gmail.com',
    phone: extractPhoneNumber(resumeText) || options.phone || '+91-7428477219',
    linkedin: extractLinkedIn(resumeText) || options.linkedin || 'linkedin.com/in/palash-mishra-6a68a71aa',
    github: extractGitHub(resumeText)
  };

  const pdf = await PDFDocument.create();
  const ctx = {
    pdf, primaryColor: PRIMARY, col: 'left', pageIdx: { left: 0, right: 0 }, y: { left: PAGE_HEIGHT - MARGIN_TOP, right: PAGE_HEIGHT - MARGIN_TOP },
    fonts: { font: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold), italic: await pdf.embedFont(StandardFonts.HelveticaOblique), boldItal: await pdf.embedFont(StandardFonts.HelveticaBoldOblique) }
  };
  
  const sections = parseResumeSections(resumeText, data);
  const isLong = resumeText.length > 2500;
  const p = getOrAddPage(pdf, 0, PRIMARY);

  if (templateType === 'single-column') {
    let y = PAGE_HEIGHT - MARGIN_TOP;
    ctx.col = 'left'; ctx.x = MARGIN_X;
    
    // Header setup
    p.drawText(data.userName, { x: (PAGE_WIDTH - ctx.fonts.bold.widthOfTextAtSize(data.userName, 20)) / 2, y, size: 20, font: ctx.fonts.bold, color: PRIMARY });
    y -= 18;
    p.drawText(data.jobTitle.toUpperCase(), { x: (PAGE_WIDTH - ctx.fonts.bold.widthOfTextAtSize(data.jobTitle, 10)) / 2, y, size: 10, font: ctx.fonts.bold, color: GRAY });
    y -= 14;
    const info = [data.phone, data.email, data.linkedin, data.github].filter(Boolean).join("  |  ");
    p.drawText(info, { x: (PAGE_WIDTH - ctx.fonts.font.widthOfTextAtSize(info, 8.5)) / 2, y, size: 8.5, font: ctx.fonts.font, color: DARK_GRAY });
    ctx.y.left = y - 20;

    ['Summary', 'Experience', 'Projects', 'Skills', 'Education', 'Certifications', 'Languages'].forEach(canonical => {
      const sec = sections.find(s => s.title.toLowerCase().includes(canonical.toLowerCase()));
      if (!sec || sec.content.length === 0) return;

      if (ctx.y.left < MARGIN_BOTTOM + 35) { ctx.pageIdx.left++; ctx.y.left = PAGE_HEIGHT - MARGIN_TOP; }
      ctx.y.left -= 10;
      const page = getOrAddPage(pdf, ctx.pageIdx.left, PRIMARY);
      page.drawText(canonical.toUpperCase(), { x: MARGIN_X, y: ctx.y.left, size: 10.5, font: ctx.fonts.bold, color: PRIMARY });
      ctx.y.left -= 4;
      page.drawLine({ start: { x: MARGIN_X, y: ctx.y.left }, end: { x: PAGE_WIDTH - MARGIN_X, y: ctx.y.left }, thickness: 0.75, color: LIGHT_GRAY });
      ctx.y.left -= 8;

      if (['Summary', 'Experience', 'Projects'].includes(canonical)) {
        processCommonSections(ctx, canonical, sec, PAGE_WIDTH - MARGIN_X * 2, 9, 12.5, 9.5, 11.5, 10, 12, 4);
      } else {
        sec.content.forEach(line => {
          flowText(ctx, line.replace(/^[•+\-]\s*/, '•  '), MARGIN_X, PAGE_WIDTH - MARGIN_X * 2, 9, 12.5, { color: DARK_GRAY });
          ctx.y.left -= 2;
        });
      }
    });
  } else {
    // Two Column layout configuration calculations
    const FULL_W = PAGE_WIDTH - MARGIN_X * 2, LEFT_W = Math.floor(FULL_W * 0.58), RIGHT_W = FULL_W - LEFT_W - 20;
    let cursorY = PAGE_HEIGHT - MARGIN_TOP;
    
    p.drawText(data.userName.toUpperCase(), { x: MARGIN_X, y: cursorY, size: isLong ? 20 : 24, font: ctx.fonts.bold, color: BLACK });
    cursorY -= (isLong ? 22 : 28);
    p.drawText(data.jobTitle.toUpperCase(), { x: MARGIN_X, y: cursorY, size: isLong ? 10 : 11.5, font: ctx.fonts.bold, color: PRIMARY });
    cursorY -= (isLong ? 16 : 20);

    const row = [data.phone && `Phone: ${data.phone}`, data.email && `Email: ${data.email}`, data.linkedin && `LinkedIn: ${data.linkedin.replace(/^https?:\/\/(www\.)?/, '')}`, data.github && `GitHub: ${data.github.replace(/^https?:\/\/(www\.)?/, '')}`].filter(Boolean).join('   •   ');
    p.drawRectangle({ x: MARGIN_X, y: cursorY - 2, width: FULL_W, height: isLong ? 15 : 18, color: rgb(0.93, 0.96, 0.98) });
    p.drawText(row, { x: MARGIN_X + (FULL_W - ctx.fonts.font.widthOfTextAtSize(row, isLong ? 7.8 : 8.2)) / 2, y: cursorY, size: isLong ? 7.8 : 8.2, font: ctx.fonts.font, color: DARK_GRAY });
    
    const topY = cursorY - (isLong ? 25 : 33);
    ctx.y = { left: topY, right: topY };

    const drawTwoColHeader = (column, title, x, w) => {
      ctx.y[column] -= (isLong ? 3 : 5);
      if (ctx.y[column] < MARGIN_BOTTOM + 25) { ctx.pageIdx[column]++; ctx.y[column] = PAGE_HEIGHT - MARGIN_TOP; }
      const page = getOrAddPage(pdf, ctx.pageIdx[column], PRIMARY);
      page.drawText(title.toUpperCase(), { x, y: ctx.y[column], size: isLong ? 8.8 : 9.5, font: ctx.fonts.bold, color: PRIMARY });
      ctx.y[column] -= 2;
      page.drawLine({ start: { x, y: ctx.y[column] }, end: { x: x + w, y: ctx.y[column] }, thickness: 1.0, color: PRIMARY });
      ctx.y[column] -= (isLong ? 4 : 8);
    };

    // Left Column logic
    ctx.col = 'left'; ctx.x = MARGIN_X;
    ['Summary', 'Experience', 'Projects'].forEach(canonical => {
      const sec = sections.find(s => s.title.toLowerCase().includes(canonical.toLowerCase().replace(/s$/, '')));
      if (!sec) return;
      drawTwoColHeader('left', canonical, MARGIN_X, LEFT_W);
      processCommonSections(ctx, canonical, sec, LEFT_W, isLong ? 7.2 : 8.0, isLong ? 9.8 : 11.0, isLong ? 7.5 : 8.2, isLong ? 9.8 : 11.0, isLong ? 8.2 : 9.0, isLong ? 11.0 : 12.0, isLong ? 3 : 6);
      ctx.y.left -= (isLong ? 8 : 14);
    });

    // Right Column logic
    ctx.col = 'right'; ctx.x = MARGIN_X + LEFT_W + 20;
    ['Skills', 'Education'].forEach(canonical => {
      const sec = sections.find(s => s.title.toLowerCase().includes(canonical.toLowerCase().replace(/s$/, '')));
      if (!sec) return;
      drawTwoColHeader('right', canonical, ctx.x, RIGHT_W);

      if (canonical === 'Skills') {
        sec.content.forEach(rawLine => {
          const trimmed = safeText(rawLine);
          let list = trimmed.split(','), cat = "";
          if (trimmed.includes(':')) {
            const idx = trimmed.indexOf(':');
            cat = trimmed.slice(0, idx).trim();
            ctx.y.right -= 4;
            const page = getOrAddPage(pdf, ctx.pageIdx.right, PRIMARY);
            page.drawText(cat, { x: ctx.x, y: ctx.y.right, size: isLong ? 7.5 : 8.2, font: ctx.fonts.bold, color: BLACK });
            ctx.y.right -= (isLong ? 9.8 : 11.0);
            list = trimmed.slice(idx + 1).split(',');
          }
          let bx = ctx.x;
          list.map(s => s.trim()).filter(Boolean).forEach(skill => {
            const tw = ctx.fonts.font.widthOfTextAtSize(skill, isLong ? 7.2 : 8.0) + 10;
            if (bx + tw > ctx.x + RIGHT_W) { bx = ctx.x; ctx.y.right -= (isLong ? 7.2 : 8.0) + 10; }
            if (ctx.y.right < MARGIN_BOTTOM + 15) { ctx.pageIdx.right++; ctx.y.right = PAGE_HEIGHT - MARGIN_TOP; bx = ctx.x; }
            const page = getOrAddPage(pdf, ctx.pageIdx.right, PRIMARY);
            page.drawRectangle({ x: bx, y: ctx.y.right - 2, width: tw, height: (isLong ? 7.2 : 8.0) + 6, fill: PRIMARY });
            page.drawText(skill, { x: bx + 5, y: ctx.y.right + 1, size: isLong ? 7.2 : 8.0, font: ctx.fonts.font, color: rgb(1, 1, 1) });
            bx += tw + 4;
          });
          ctx.y.right -= ((isLong ? 7.2 : 8.0) + 14);
        });
      } else {
        sec.content.forEach(rawLine => {
          const trimmed = safeText(rawLine);
          const isInst = /\b(university|college|school|institute|academy|vellore)\b/i.test(trimmed);
          if (isInst) ctx.y.right -= 4;
          flowText(ctx, trimmed.replace(/^[•+\-]\s*/, '•  '), ctx.x, RIGHT_W, isLong ? 7.2 : 8.0, isLong ? 9.8 : 11.0, { bold: isInst, color: isInst ? BLACK : DARK_GRAY });
        });
      }
    });
  }

  saveAs(new Blob([await pdf.save()], { type: 'application/pdf' }), `${safeText(fileName).replace(/\.pdf$/i, '')}_optimized.pdf`);
}