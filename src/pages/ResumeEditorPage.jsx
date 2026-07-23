// src/pages/ResumeEditorPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Copy, Check, Sparkles, Download, X, Sliders, Maximize2,
  Trash2, LayoutGrid, CheckSquare, Plus, ArrowUp, ArrowDown, GripVertical,
  FileText, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Award, Globe, Briefcase, GraduationCap, ChevronRight, Undo2, Redo2, Type, Layers, Bot, Upload, Palette,
  Eye, EyeOff
} from "lucide-react";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { optimizeSection } from "../services/resumeOptimizationService";
import { generateResumePDF } from "../utils/pdfGenerator";
import { parseSections } from "../utils/resumeOptimizer";
import ScanCompletionModal from "../components/resume/ScanCompletionModal";
import "../components/resume/ScanCompletionModal.css";
import api from "../api/axiosConfig";
import "./ResumeEditorPage.css";

const PREMIUM_THEMES = [
  { name: "Royal Blue", hex: "#1761c7" },
  { name: "Emerald Teal", hex: "#0f9f6e" },
  { name: "Amethyst Violet", hex: "#7c3aed" },
  { name: "Amber Orange", hex: "#d97706" },
  { name: "Crimson Rose", hex: "#e02424" },
  { name: "Charcoal Slate", hex: "#475569" },
];

const PREMIUM_FONTS = [
  { name: "Outfit", family: "'Outfit', sans-serif" },
  { name: "Plus Jakarta", family: "'Plus Jakarta Sans', sans-serif" },
  { name: "Inter", family: "'Inter', sans-serif" },
];

const SECTION_ICONS = {
  Header: "👤",
  Summary: "📄",
  Experience: "💼",
  Projects: "⚡",
  Skills: "🎯",
  Education: "🎓",
  Certifications: "🏆",
};

const sanitizeSections = (sectionsObj) => {
  if (!sectionsObj || typeof sectionsObj !== 'object') return sectionsObj;
  const cleaned = { ...sectionsObj };

  const SECTION_HEADER_KEYWORDS = [
    'experience', 'work experience', 'professional experience', 'employment history', 'career history',
    'education', 'academic background', 'projects', 'personal projects', 'skills', 'technical skills',
    'certifications', 'languages', 'summary', 'professional summary'
  ];

  // Fix Education section if Experience or orphaned date/location lines got appended into Education
  if (cleaned.Education && typeof cleaned.Education === 'string') {
    const eduLines = cleaned.Education.split('\n');
    const validEduLines = [];
    let foundSectionBreak = false;

    for (const line of eduLines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase().replace(/[:#\-_*]/g, '').trim();

      if (SECTION_HEADER_KEYWORDS.includes(lower)) {
        foundSectionBreak = true;
        continue;
      }

      if (!foundSectionBreak) {
        validEduLines.push(line);
      }
    }

    cleaned.Education = validEduLines.join('\n').trim();
  }

  // Sanitize all section keys: remove standalone section headers and merge orphaned metric lines
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key] && typeof cleaned[key] === 'string') {
      let textVal = cleaned[key];
      // Merge standalone percentage lines (e.g., "\n 40%.") back onto preceding line
      textVal = textVal.replace(/\n\s*(\d+%\.?)\s*/g, ' $1\n')
                       .replace(/,\s*,/g, ',')
                       .replace(/,\s*\./g, '.');

      const lines = textVal.split('\n');
      const filteredLines = lines.filter(line => {
        const trimmedLower = line.trim().toLowerCase().replace(/[:#\-_*]/g, '');
        if (SECTION_HEADER_KEYWORDS.includes(trimmedLower)) {
          return false;
        }
        if (/^\s*\d+%\.?\s*$/.test(line.trim())) {
          return false;
        }
        return true;
      });
      cleaned[key] = filteredLines.join('\n').trim();
    }
  }

  return cleaned;
};

export default function ResumeEditorPage() {
  const navigate = useNavigate();
  const livePreviewRef = useRef(null);
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [selectedResume, setSelectedResume] = useState(() => localStorage.getItem("cl_selected_resume") || "");
  const [selectedJobDescription, setSelectedJobDescription] = useState(() => localStorage.getItem("cl_selected_jd") || "");
  
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem("cl_optimization_result");
    return saved ? JSON.parse(saved) : null;
  });

  const [editedSections, setEditedSections] = useState(() => {
    // Load sections keyed to the selected resume so different resumes don't share data
    const resumeId = localStorage.getItem("cl_selected_resume") || "default";
    const saved = localStorage.getItem(`cl_edited_sections_${resumeId}`);
    const parsed = saved ? JSON.parse(saved) : {
      Header: '',
      Summary: '',
      Experience: '',
      Projects: '',
      Skills: '',
      Education: '',
      Certifications: '',
    };
    return sanitizeSections(parsed);
  });

  const [selectedTemplate, setSelectedTemplate] = useState(() => localStorage.getItem("cl_selected_template") || 'two-column');
  const [selectedColor, setSelectedColor] = useState(() => localStorage.getItem("cl_selected_color") || '#1761c7');
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem("cl_selected_font") || 'Outfit');
  const [pageMargins, setPageMargins] = useState(() => Number(localStorage.getItem("cl_selected_margins")) || 1);
  const [sectionSpacing, setSectionSpacing] = useState(() => Number(localStorage.getItem("cl_selected_spacing")) || 3);
  const [baseFontSize, setBaseFontSize] = useState(() => Number(localStorage.getItem("cl_selected_font_size")) || 3);
  const [sectionFontSizes, setSectionFontSizes] = useState(() => JSON.parse(localStorage.getItem("cl_section_fonts")) || {});
  const [pageCount, setPageCount] = useState(1);

  // Drag and Drop Section Ordering State
  const DEFAULT_MAIN_SECTIONS = ['Summary', 'Experience', 'Projects'];
  const DEFAULT_SIDE_SECTIONS = ['Skills', 'Education', 'Certifications'];

  const [mainSectionOrder, setMainSectionOrder] = useState(() => {
    const saved = localStorage.getItem(`cl_main_order_${selectedResume}`);
    return saved ? JSON.parse(saved) : DEFAULT_MAIN_SECTIONS;
  });

  const [sideSectionOrder, setSideSectionOrder] = useState(() => {
    const saved = localStorage.getItem(`cl_side_order_${selectedResume}`);
    return saved ? JSON.parse(saved) : DEFAULT_SIDE_SECTIONS;
  });

  const [draggedSectionKey, setDraggedSectionKey] = useState(null);

  const handleDragStart = (e, sectionKey) => {
    e.dataTransfer.setData("text/plain", sectionKey);
    setDraggedSectionKey(sectionKey);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleSectionDrop = (e, targetSectionKey, isSidebar = false) => {
    e.preventDefault();
    if (!draggedSectionKey || draggedSectionKey === targetSectionKey) return;

    const orderArray = isSidebar ? [...sideSectionOrder] : [...mainSectionOrder];
    const setOrderFn = isSidebar ? setSideSectionOrder : setMainSectionOrder;
    const storageKey = isSidebar ? `cl_side_order_${selectedResume}` : `cl_main_order_${selectedResume}`;

    const fromIdx = orderArray.indexOf(draggedSectionKey);
    const toIdx = orderArray.indexOf(targetSectionKey);

    if (fromIdx !== -1 && toIdx !== -1) {
      orderArray.splice(fromIdx, 1);
      orderArray.splice(toIdx, 0, draggedSectionKey);
      setOrderFn(orderArray);
      localStorage.setItem(storageKey, JSON.stringify(orderArray));
    } else {
      // Cross-column movement (e.g. moving Skills from Sidebar to Main Body)
      const fromArray = isSidebar ? [...mainSectionOrder] : [...sideSectionOrder];
      const setFromArrayFn = isSidebar ? setMainSectionOrder : setSideSectionOrder;
      const fromStorageKey = isSidebar ? `cl_main_order_${selectedResume}` : `cl_side_order_${selectedResume}`;

      const remIdx = fromArray.indexOf(draggedSectionKey);
      if (remIdx !== -1) {
        fromArray.splice(remIdx, 1);
        orderArray.splice(toIdx >= 0 ? toIdx : orderArray.length, 0, draggedSectionKey);

        setFromArrayFn(fromArray);
        setOrderFn(orderArray);

        localStorage.setItem(fromStorageKey, JSON.stringify(fromArray));
        localStorage.setItem(storageKey, JSON.stringify(orderArray));
      }
    }
    setDraggedSectionKey(null);
  };

  const getSectionFontSize = (key) => ({
    fontSize: `${1 + (sectionFontSizes[key] || 0) * 0.1}em`
  });

  const [optimizingSections, setOptimizingSections] = useState({});
  const [sectionPrompts, setSectionPrompts] = useState({});
  const [showPromptInput, setShowPromptInput] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeSection, setActiveSection] = useState("Header");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [activeRailTab, setActiveRailTab] = useState("content");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [mobileSelectedSection, setMobileSelectedSection] = useState("Summary");

  // History stack for Undo / Redo
  const [history, setHistory] = useState([editedSections]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const updateSectionsWithHistory = (newSections) => {
    const updated = typeof newSections === 'function' ? newSections(editedSections) : newSections;
    const sanitized = sanitizeSections(updated);
    setEditedSections(sanitized);
    
    // Append to history
    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(sanitized);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setEditedSections(history[historyIdx - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setEditedSections(history[historyIdx + 1]);
    }
  };

  // Manipulate entry blocks inside timeline sections (Experience / Projects / Education)
  const addBlockToSection = (sectionKey) => {
    const existing = editedSections[sectionKey] || '';
    let newEntry = '';
    if (sectionKey === 'Experience') {
      newEntry = '\n\nNew Company | Software Engineer | 2026 - Present\n• Developed and delivered scalable cloud applications.';
    } else if (sectionKey === 'Projects') {
      newEntry = '\n\nNew Project | React, Node.js | 2026\n• Built an intuitive user web interface for automated analytics.';
    } else if (sectionKey === 'Education') {
      newEntry = '\n\nUniversity Name\nDegree / Specialization 2022 - 2026';
    } else {
      newEntry = '\n• New Item Detail';
    }
    updateSectionsWithHistory({ ...editedSections, [sectionKey]: existing + newEntry });
  };

  const deleteBlockFromSection = (sectionKey, blockIdx) => {
    const text = editedSections[sectionKey] || '';
    const rawBlocks = text.split('\n\n').filter(b => b.trim());
    if (blockIdx >= 0 && blockIdx < rawBlocks.length) {
      rawBlocks.splice(blockIdx, 1);
      updateSectionsWithHistory({ ...editedSections, [sectionKey]: rawBlocks.join('\n\n') });
    }
  };

  const moveBlockInSection = (sectionKey, blockIdx, direction) => {
    const text = editedSections[sectionKey] || '';
    const rawBlocks = text.split('\n\n').filter(b => b.trim());
    const targetIdx = blockIdx + direction;
    if (blockIdx >= 0 && targetIdx >= 0 && targetIdx < rawBlocks.length) {
      const temp = rawBlocks[blockIdx];
      rawBlocks[blockIdx] = rawBlocks[targetIdx];
      rawBlocks[targetIdx] = temp;
      updateSectionsWithHistory({ ...editedSections, [sectionKey]: rawBlocks.join('\n\n') });
    }
  };

  // Sync state values to localStorage
  useEffect(() => {
    localStorage.setItem("cl_selected_resume", selectedResume);
  }, [selectedResume]);

  useEffect(() => {
    localStorage.setItem("cl_selected_jd", selectedJobDescription);
  }, [selectedJobDescription]);

  useEffect(() => {
    localStorage.setItem("cl_selected_template", selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    localStorage.setItem("cl_selected_color", selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    localStorage.setItem("cl_selected_font", selectedFont);
  }, [selectedFont]);

  useEffect(() => {
    localStorage.setItem("cl_selected_margins", pageMargins);
  }, [pageMargins]);

  useEffect(() => {
    localStorage.setItem("cl_selected_spacing", sectionSpacing);
  }, [sectionSpacing]);

  useEffect(() => {
    localStorage.setItem("cl_selected_font_size", baseFontSize);
  }, [baseFontSize]);

  useEffect(() => {
    localStorage.setItem("cl_section_fonts", JSON.stringify(sectionFontSizes));
  }, [sectionFontSizes]);

  // Generalized smart page breaking: ensures no section or entry block gets cut across an A4 page boundary.
  useEffect(() => {
    const applySmartBreaks = () => {
      const canvas = livePreviewRef.current;
      if (!canvas) return;

      const A4_PAGE_PX = 842;

      // 1. Reset any previously applied margins and remove old visual page break indicators
      canvas.querySelectorAll('.pdf-auto-page-break-label').forEach(el => el.remove());
      const sections = canvas.querySelectorAll('.ecv-section');
      const items = canvas.querySelectorAll('.enhancv-entry-block, .ecv-body-text, .ecv-skill-group, .ecv-sidebar-line');
      
      [...sections, ...items].forEach(el => {
        el.style.marginTop = '0px';
      });

      const getOffsetTopToCanvas = (el) => {
        let anchorOffset = 0;
        let curr = el;
        while (curr && curr !== canvas) {
          anchorOffset += curr.offsetTop;
          curr = curr.offsetParent;
        }
        return anchorOffset;
      };

      const addBreakIndicator = (gapTopPx, gapPx, pageNum) => {
        const indicator = document.createElement('div');
        indicator.className = 'pdf-auto-page-break-label';
        indicator.style.top = `${gapTopPx}px`;
        indicator.style.height = `${gapPx}px`;
        indicator.setAttribute('data-html2canvas-ignore', 'true'); // Prevents html2canvas from rendering this into the PDF
        indicator.innerHTML = `
          <div class="pdf-page-break-divider">
            <div class="pdf-page-break-shadow-top"></div>
            <div class="pdf-page-break-gap">
              <span class="pdf-page-break-badge">PAGE ${pageNum} (A4 BREAK)</span>
            </div>
            <div class="pdf-page-break-shadow-bottom"></div>
          </div>
        `;
        canvas.appendChild(indicator);
      };

      // 2. Iterate .ecv-section elements first. 
      // Only push a whole section down if its own HEADER would be orphaned at the bottom of the page.
      sections.forEach(section => {
        const header = section.querySelector('.ecv-section-header');
        if (header) {
          const offsetTop = getOffsetTopToCanvas(header);
          const usedOnPage = offsetTop % A4_PAGE_PX;
          const remainingOnPage = A4_PAGE_PX - usedOnPage;
          
          // If there's very little space left for the header and first entry (e.g. < 70px)
          if (remainingOnPage < 70) {
            section.style.marginTop = `${remainingOnPage}px`;
            const pageNum = Math.floor((offsetTop + remainingOnPage) / A4_PAGE_PX) + 1;
            addBreakIndicator(offsetTop, remainingOnPage, pageNum);
          }
        }
      });

      // 3. Iterate all content items (.enhancv-entry-block, .ecv-body-text, .ecv-skill-group, .ecv-sidebar-line)
      items.forEach(el => {
        const offsetTop = getOffsetTopToCanvas(el);
        const usedOnPage = offsetTop % A4_PAGE_PX;
        const remainingOnPage = A4_PAGE_PX - usedOnPage;
        const elHeight = el.offsetHeight;

        // Push if element's height with buffer crosses the page boundary
        if ((elHeight + 8) > remainingOnPage && elHeight < A4_PAGE_PX) {
          el.style.marginTop = `${remainingOnPage}px`;
          const pageNum = Math.floor((offsetTop + remainingOnPage) / A4_PAGE_PX) + 1;
          addBreakIndicator(offsetTop, remainingOnPage, pageNum);
        }
      });

      // Calculate total A4 page count for live editor
      const totalPages = Math.max(1, Math.ceil((canvas.scrollHeight - 15) / A4_PAGE_PX));
      setPageCount(totalPages);
    };

    const raf = requestAnimationFrame(applySmartBreaks);
    return () => cancelAnimationFrame(raf);
  }, [editedSections, selectedTemplate, pageMargins, sectionSpacing, baseFontSize, sectionFontSizes]);


  useEffect(() => {
    if (result) {
      localStorage.setItem("cl_optimization_result", JSON.stringify(result));
    } else {
      localStorage.removeItem("cl_optimization_result");
    }
  }, [result]);

  useEffect(() => {
    if (!selectedResume) return;
    // Save sections under a per-resume key so switching resumes never leaks data
    localStorage.setItem(`cl_edited_sections_${selectedResume}`, JSON.stringify(editedSections));
  }, [editedSections, selectedResume]);

  // When the user picks a different resume, load (or parse) its sections
  useEffect(() => {
    if (!selectedResume || resumes.length === 0) return;
    const resumeId = String(selectedResume);
    const cached = localStorage.getItem(`cl_edited_sections_${resumeId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      const hasContent = Object.values(parsed).some(v => v && v.trim());
      if (hasContent) {
        setEditedSections(sanitizeSections(parsed));
        return;
      }
    }
    // No cache — parse from the resume's extracted_text
    const resume = resumes.find(r => String(r.id) === resumeId);
    if (resume && resume.extracted_text) {
      const parsed = parseSections(resume.extracted_text);
      setEditedSections(sanitizeSections(parsed));
    }
  }, [selectedResume, resumes]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const resumeResponse = await getResumes();
        const jdResponse = await getJobDescriptions();
        setResumes(resumeResponse);
        setJobDescriptions(jdResponse);

        // Determine the active resume
        const targetId = selectedResume || localStorage.getItem("cl_selected_resume") || String(resumeResponse[0]?.id);
        if (!selectedResume && targetId) setSelectedResume(targetId);

        // Only populate sections from raw text if there is no cached data for this resume
        const cached = localStorage.getItem(`cl_edited_sections_${targetId}`);
        const hasCachedContent = cached && Object.values(JSON.parse(cached)).some(v => v && v.trim());
        if (!hasCachedContent) {
          const targetResume = resumeResponse.find(r => String(r.id) === String(targetId)) || resumeResponse[0];
          if (targetResume && targetResume.extracted_text) {
            const parsed = parseSections(targetResume.extracted_text);
            setEditedSections(sanitizeSections(parsed));
          }
        }
      } catch (err) {
        console.error("Failed to load metadata inside full-page editor", err);
      }
    };
    fetchMetadata();
  }, []);

  const handleOptimizeSection = async (sectionName) => {
    setOptimizingSections(prev => ({ ...prev, [sectionName]: true }));
    try {
      const customPrompt = sectionPrompts[sectionName] || "";
      const currentSectionContent = editedSections[sectionName] || "";

      const resID = selectedResume || (resumes[0]?.id ? String(resumes[0].id) : "");
      const jdID = selectedJobDescription || (jobDescriptions[0]?.id ? String(jobDescriptions[0].id) : "");

      let effectivePrompt = customPrompt;
      if (sectionName === "Skills") {
        effectivePrompt = `${customPrompt} (IMPORTANT: Keep skills concise and relevant. Group into 3-5 clean categories like 'Languages: ...', 'Frameworks: ...', 'Tools: ...'. Limit to max 20 top relevant skills.)`;
      }

      const response = await optimizeSection(
        resID,
        sectionName,
        jdID,
        effectivePrompt,
        currentSectionContent
      );
      
      let optimizedText = "";
      if (typeof response === "string") {
        optimizedText = response;
      } else if (response) {
        optimizedText = response.optimizedText || response.optimized_text || response.text || response.content || response.optimizedSection || response.optimized_content || "";
      }
      
      if (optimizedText) {
        updateSectionsWithHistory({
          ...editedSections,
          [sectionName]: optimizedText
        });
        setSectionPrompts(prev => ({ ...prev, [sectionName]: "" }));
        setShowPromptInput(prev => ({ ...prev, [sectionName]: false }));
        
        // Auto-switch mobile view focus to show the updated section
        setMobileSelectedSection(sectionName);
        setActiveRailTab("content");
      }
    } catch (error) {
      console.error(`Error optimizing section ${sectionName}:`, error);
      alert(`Failed to personalize ${sectionName} section. Please try again.`);
    } finally {
      setOptimizingSections(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const reconstructResumeText = (sections) => {
    return Object.entries(sections)
      .filter(([_, content]) => content && content.trim())
      .map(([title, content]) => `${title}:\n${content}`)
      .join("\n\n");
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const docName = resumes.find(r => r.id === Number(selectedResume))?.file_name || "optimized_resume";
      const cleanedDocName = docName.replace(/\.[^/.]+$/, "");

      // Use the text-based PDF generator (pdfGenerator.js) which correctly
      // calculates block boundaries BEFORE rendering, ensuring no line is ever
      // split mid-content. The old html2canvas approach sliced the page at a
      // fixed 842px pixel boundary, cutting text wherever it happened to fall.
      await generateResumePDF({
        editedSections,                   // Pass sections directly — mirrors live editor exactly
        fileName: cleanedDocName,
        templateType: selectedTemplate,   // 'two-column' or 'single-column'
        primaryColor: selectedColor,
        pageMargins,
        sectionSpacing,
        baseFontSize,                     // Scale font size dynamically to fit 1 page
        mainSectionOrder,
        sideSectionOrder,
      });

      setShowCompletionModal(true);
    } catch (err) {
      console.error("Failed to download PDF in full-page editor:", err);
      alert("Failed to build PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      const fullText = Object.keys(editedSections)
        .map(key => `${key}:\n${editedSections[key]}`)
        .join("\n\n");
        
      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert("Failed to copy content to clipboard.");
    }
  };

  const handleResetSession = () => {
    if (window.confirm("Are you sure you want to reset this session? Your current edits will be cleared.")) {
      setResult(null);
      setEditedSections({
        Header: '',
        Summary: '',
        Experience: '',
        Projects: '',
        Skills: '',
        Education: '',
        Certifications: '',
        Languages: '',
      });
      setSelectedResume("");
      setSelectedJobDescription("");
      localStorage.removeItem("cl_selected_resume");
      localStorage.removeItem("cl_selected_jd");
      localStorage.removeItem("cl_optimization_result");
      localStorage.removeItem("cl_edited_sections");
      navigate("/resume-optimizer");
    }
  };

  // Parsing utilities for live preview template
  const parseBulletPoints = (text) => {
    if (!text) return [];
    return text.split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("•") || line.startsWith("-") || line.length > 0)
      .map(line => line.replace(/^[•\-\s]+/, ""));
  };

  const parseSkills = (text) => {
    if (!text) return [];
    return text.split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const renderSkillsSection = (text, themeColor) => {
    if (!text) return null;
    const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const validLines = rawLines.filter(l => l.toLowerCase() !== 'skills');

    // Parse categories (e.g. Category Name followed by items or Category: items)
    const categories = [];
    let currentCat = null;
    let currentItems = [];

    for (let i = 0; i < validLines.length; i++) {
      const line = validLines[i];
      if (line.includes(':')) {
        if (currentCat && currentItems.length > 0) {
          categories.push({ cat: currentCat, items: currentItems });
        }
        const [cat, val] = line.split(':');
        currentCat = cat.trim();
        currentItems = val.split(',').map(s => s.trim()).filter(Boolean);
      } else if (!line.includes(',') && line.length < 40 && i + 1 < validLines.length && validLines[i + 1].includes(',')) {
        if (currentCat && currentItems.length > 0) {
          categories.push({ cat: currentCat, items: currentItems });
        }
        currentCat = line;
        currentItems = [];
      } else {
        const items = line.split(',').map(s => s.trim()).filter(Boolean);
        currentItems.push(...items);
      }
    }
    if (currentCat && currentItems.length > 0) {
      categories.push({ cat: currentCat, items: currentItems });
    }

    // Render formatted category groups if found
    if (categories.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {categories.slice(0, 8).map((group, idx) => (
            <div key={idx} className="ecv-skill-group" style={{ fontSize: '0.62em', lineHeight: 1.4, color: themeColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : '#334155' }}>
              <strong style={{ color: themeColor === '#ffffff' ? '#ffffff' : '#0f172a', marginRight: '5px' }}>{group.cat}:</strong>
              <span>{group.items.join(', ')}</span>
            </div>
          ))}
        </div>
      );
    }

    // Fallback: render clean flex tags (max 24)
    const allSkills = text.split(/[,\n]/).map(s => s.trim()).filter(Boolean).filter(s => s.toLowerCase() !== 'skills');
    return (
      <div className="ecv-skills-wrap">
        {allSkills.slice(0, 24).map((skill, i) => (
          <div key={i} className="ecv-skill-item">
            <span className="ecv-skill-dot" style={{ backgroundColor: themeColor || 'currentColor' }} />
            <span className="ecv-skill-label" style={{ color: themeColor === '#ffffff' ? 'rgba(255,255,255,0.88)' : '#334155' }}>{skill}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTimelineEntries = (text, themeColor, sectionKey = 'Experience') => {
    if (!text) return null;
    const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const blocks = [];
    let currentHeader = null;
    let currentDate = null;
    let currentSubtitle = null;
    let currentBullets = [];

    const flush = () => {
      if (currentHeader || currentBullets.length > 0) {
        blocks.push({
          header: currentHeader || "",
          date: currentDate || "",
          subtitle: currentSubtitle || "",
          bullets: currentBullets,
        });
        currentHeader = null;
        currentDate = null;
        currentSubtitle = null;
        currentBullets = [];
      }
    };

    const DATE_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b.*[-–—].*\b(Present|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b/i;

    for (const line of rawLines) {
      if (/^\s*\d+%\.?\s*$/.test(line)) continue; // Ignore standalone orphaned metric lines
      const isBullet = line.startsWith('•') || line.startsWith('-');
      const dateMatch = line.match(DATE_RE);

      if (!isBullet && (line.includes('|') || dateMatch || line.length < 55)) {
        if (line.includes('|')) {
          flush();
          const parts = line.split('|').map(p => p.trim());
          currentHeader = parts[0];
          currentDate = parts.slice(1).join(' | ');
        } else if (dateMatch) {
          const dateStr = dateMatch[0].trim();
          const labelStr = line.replace(dateMatch[0], '').trim();
          if (labelStr && !currentHeader) {
            currentHeader = labelStr;
            currentDate = dateStr;
          } else if (currentHeader && !currentDate) {
            currentDate = dateStr;
          } else {
            flush();
            currentHeader = labelStr || line;
            currentDate = dateStr;
          }
        } else {
          if (currentHeader && !currentSubtitle && currentBullets.length === 0) {
            currentSubtitle = line;
          } else {
            flush();
            currentHeader = line;
          }
        }
      } else {
        currentBullets.push(line.replace(/^[•\-\s]+/, ''));
      }
    }
    flush();

    return blocks.map((blk, idx) => (
      <div key={idx} className="nvo-entry-block-wrapper enhancv-entry-block">
        {/* Novoresume Hover Action Handles */}
        <div className="nvo-block-action-bar">
          <button className="nvo-action-btn" title="Add entry block" onClick={() => addBlockToSection(sectionKey)}>
            <Plus size={12} />
          </button>
          {idx > 0 && (
            <button className="nvo-action-btn" title="Move entry up" onClick={() => moveBlockInSection(sectionKey, idx, -1)}>
              <ArrowUp size={12} />
            </button>
          )}
          {idx < blocks.length - 1 && (
            <button className="nvo-action-btn" title="Move entry down" onClick={() => moveBlockInSection(sectionKey, idx, 1)}>
              <ArrowDown size={12} />
            </button>
          )}
          <button className="nvo-action-btn btn-ai" title="AI Personalize entry" onClick={() => handleOptimizeSection(sectionKey)}>
            <Sparkles size={12} />
          </button>
          <button className="nvo-action-btn btn-del" title="Delete entry block" onClick={() => deleteBlockFromSection(sectionKey, idx)}>
            <Trash2 size={12} />
          </button>
        </div>

        {blk.header && (
          <div className="enhancv-entry-header">
            <span className="enhancv-entry-title nvo-editable-text" contentEditable suppressContentEditableWarning>{blk.header}</span>
            {blk.date && <span className="enhancv-entry-date nvo-editable-text" contentEditable suppressContentEditableWarning style={{ color: themeColor }}>{blk.date}</span>}
          </div>
        )}
        {blk.subtitle && (
          <div className="enhancv-entry-subtitle nvo-editable-text" contentEditable suppressContentEditableWarning style={{ color: '#475569', fontSize: '0.66rem', fontWeight: '600', marginBottom: '2px' }}>
            {blk.subtitle}
          </div>
        )}
        <div className="enhancv-bullet-list">
          {blk.bullets.map((bullet, bIdx) => (
            <div key={bIdx} className="red-tmpl-bullet-row">
              <span className="red-tmpl-bullet-dot" style={{ backgroundColor: themeColor }} />
              <span className="red-tmpl-bullet-text nvo-editable-text" contentEditable suppressContentEditableWarning>{bullet}</span>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const renderSectionByKey = (sectionKey, isSidebar = false) => {
    const content = editedSections[sectionKey];
    if (!content || !content.trim()) return null;

    const dragProps = {
      draggable: true,
      onDragStart: (e) => handleDragStart(e, sectionKey),
      onDragOver: handleDragOver,
      onDrop: (e) => handleSectionDrop(e, sectionKey, isSidebar),
      className: `${isSidebar ? 'ecv-sidebar-section' : 'ecv-section'} nvo-section-draggable ${draggedSectionKey === sectionKey ? 'dragging' : ''}`,
      style: getSectionFontSize(sectionKey),
    };

    if (sectionKey === 'Summary') {
      return (
        <div key={sectionKey} {...dragProps}>
          <div className="ecv-section-header" style={{ color: selectedColor }}>
            <span className="nvo-drag-handle" title="Drag & drop section"><GripVertical size={14} /></span>
            <span className="ecv-section-icon">◈</span>
            <span className="ecv-section-title">PROFESSIONAL SUMMARY</span>
            <div className="ecv-section-rule" style={{ backgroundColor: selectedColor }} />
          </div>
          <p 
            className="ecv-body-text nvo-editable-text"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateSectionsWithHistory({ ...editedSections, Summary: e.target.innerText })}
          >{editedSections.Summary}</p>
        </div>
      );
    }

    if (sectionKey === 'Experience') {
      return (
        <div key={sectionKey} {...dragProps}>
          <div className="ecv-section-header" style={{ color: selectedColor }}>
            <span className="nvo-drag-handle" title="Drag & drop section"><GripVertical size={14} /></span>
            <span className="ecv-section-icon">◈</span>
            <span className="ecv-section-title">WORK EXPERIENCE</span>
            <div className="ecv-section-rule" style={{ backgroundColor: selectedColor }} />
          </div>
          {renderTimelineEntries(editedSections.Experience, selectedColor, 'Experience')}
        </div>
      );
    }

    if (sectionKey === 'Projects') {
      return (
        <div key={sectionKey} {...dragProps}>
          <div className="ecv-section-header" style={{ color: selectedColor }}>
            <span className="nvo-drag-handle" title="Drag & drop section"><GripVertical size={14} /></span>
            <span className="ecv-section-icon">◈</span>
            <span className="ecv-section-title">PERSONAL PROJECTS</span>
            <div className="ecv-section-rule" style={{ backgroundColor: selectedColor }} />
          </div>
          {renderTimelineEntries(editedSections.Projects, selectedColor, 'Projects')}
        </div>
      );
    }

    if (sectionKey === 'Skills') {
      return (
        <div key={sectionKey} {...dragProps}>
          <div className={isSidebar ? "ecv-sidebar-heading" : "ecv-section-header"} style={isSidebar ? {} : { color: selectedColor }}>
            <span className="nvo-drag-handle" title="Drag & drop section"><GripVertical size={14} /></span>
            {isSidebar ? 'SKILLS' : (
              <>
                <span className="ecv-section-icon">◈</span>
                <span className="ecv-section-title">SKILLS</span>
                <div className="ecv-section-rule" style={{ backgroundColor: selectedColor }} />
              </>
            )}
          </div>
          <div 
            className="nvo-editable-text"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateSectionsWithHistory({ ...editedSections, Skills: e.target.innerText })}
          >
            {renderSkillsSection(editedSections.Skills, isSidebar ? '#ffffff' : selectedColor)}
          </div>
        </div>
      );
    }

    if (sectionKey === 'Education') {
      return (
        <div key={sectionKey} {...dragProps}>
          <div className={isSidebar ? "ecv-sidebar-heading" : "ecv-section-header"} style={isSidebar ? {} : { color: selectedColor }}>
            <span className="nvo-drag-handle" title="Drag & drop section"><GripVertical size={14} /></span>
            {isSidebar ? 'EDUCATION' : (
              <>
                <span className="ecv-section-icon">◈</span>
                <span className="ecv-section-title">EDUCATION</span>
                <div className="ecv-section-rule" style={{ backgroundColor: selectedColor }} />
              </>
            )}
          </div>
          <div 
            className="nvo-editable-text"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateSectionsWithHistory({ ...editedSections, Education: e.target.innerText })}
          >
            {parseBulletPoints(editedSections.Education).map((line, i) => (
              <p key={i} className={isSidebar ? "ecv-sidebar-line" : "ecv-body-text"}>{line}</p>
            ))}
          </div>
        </div>
      );
    }

    if (sectionKey === 'Certifications') {
      return (
        <div key={sectionKey} {...dragProps}>
          <div className={isSidebar ? "ecv-sidebar-heading" : "ecv-section-header"} style={isSidebar ? {} : { color: selectedColor }}>
            <span className="nvo-drag-handle" title="Drag & drop section"><GripVertical size={14} /></span>
            {isSidebar ? 'CERTIFICATIONS' : (
              <>
                <span className="ecv-section-icon">◈</span>
                <span className="ecv-section-title">CERTIFICATIONS</span>
                <div className="ecv-section-rule" style={{ backgroundColor: selectedColor }} />
              </>
            )}
          </div>
          <div 
            className="nvo-editable-text"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateSectionsWithHistory({ ...editedSections, Certifications: e.target.innerText })}
          >
            {parseBulletPoints(editedSections.Certifications).map((line, i) => (
              <p key={i} className={isSidebar ? "ecv-sidebar-line" : "ecv-body-text"}>{line}</p>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const activeFontFamily = PREMIUM_FONTS.find(f => f.name === selectedFont)?.family || "sans-serif";

  return (
    <div className={`nvo-editor-shell ${isPreviewMode ? 'is-preview' : ''}`} style={{ fontFamily: activeFontFamily }}>
      {/* ── NOVORESUME LEFT SIDEBAR RAIL ── */}
      <aside className="nvo-sidebar-rail">
        <div className="nvo-brand-logo" onClick={() => navigate("/resume-optimizer")} title="Back to Optimizer">
          <ArrowLeft size={16} />
          <span>CareerLens</span>
        </div>

        <button 
          className={`nvo-rail-btn ${activeRailTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveRailTab(activeRailTab === 'ai' ? null : 'ai')}
        >
          <Bot size={18} />
          <span>AI Assistant</span>
        </button>

        <button 
          className={`nvo-rail-btn ${activeRailTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveRailTab(activeRailTab === 'content' ? null : 'content')}
        >
          <FileText size={18} />
          <span>My Content</span>
        </button>

        <button 
          className={`nvo-rail-btn ${activeRailTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveRailTab(activeRailTab === 'templates' ? null : 'templates')}
        >
          <Layers size={18} />
          <span>Templates</span>
        </button>

        <button 
          className="nvo-rail-btn"
          onClick={() => navigate("/resume-optimizer")}
        >
          <Upload size={18} />
          <span>Import PDF</span>
        </button>
      </aside>

      {/* ── SIDE DRAWER PANELS ── */}
      <AnimatePresence>
        {activeRailTab === 'ai' && (
          <motion.div 
            className="nvo-drawer-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="nvo-drawer-header">
              <div className="nvo-drawer-title">
                <Bot size={18} />
                <span>AI Career Assistant</span>
              </div>
              <button className="nvo-drawer-close" onClick={() => setActiveRailTab(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="nvo-drawer-body">
              {/* ATS Score Card */}
              <div className="nvo-ai-card" style={{ background: 'rgba(56, 189, 248, 0.06)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="nvo-ai-card-title">ATS Match Score</span>
                  <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem', fontFamily: "'Fira Code', monospace" }}>
                    🎯 {result?.estimated_new_score || 88}%
                  </span>
                </div>
                <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Your resume is highly optimized for target tech roles.
                </p>
              </div>

              {/* Quick AI One-Click Personalize Prompts */}
              <div className="nvo-ai-card">
                <span className="nvo-ai-card-title">⚡ Quick AI Personalization</span>
                
                <button className="nvo-ai-action-btn" onClick={() => handleOptimizeSection('Experience')}>
                  <Sparkles size={14} style={{ color: '#a855f7' }} />
                  <span>Quantify Impact & Metrics (% & $)</span>
                </button>

                <button className="nvo-ai-action-btn" onClick={() => handleOptimizeSection('Summary')}>
                  <Sparkles size={14} style={{ color: '#38bdf8' }} />
                  <span>Tailor Summary for Target Role</span>
                </button>

                <button className="nvo-ai-action-btn" onClick={() => handleOptimizeSection('Projects')}>
                  <Sparkles size={14} style={{ color: '#0f9f6e' }} />
                  <span>Enhance Projects Tech Stack</span>
                </button>

                <button className="nvo-ai-action-btn" onClick={() => handleOptimizeSection('Skills')}>
                  <Sparkles size={14} style={{ color: '#d97706' }} />
                  <span>Group Skills into ATS Categories</span>
                </button>
              </div>

              {/* Custom AI Instruction Box */}
              <div className="nvo-ai-card">
                <span className="nvo-ai-card-title">📝 Custom AI Instructions</span>
                <select 
                  className="nvo-ai-input" 
                  value={activeSection} 
                  onChange={(e) => setActiveSection(e.target.value)}
                >
                  {Object.keys(editedSections).map(sec => (
                    <option key={sec} value={sec}>{sec} Section</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  className="nvo-ai-input" 
                  placeholder={`Instruct AI for ${activeSection}...`}
                  value={sectionPrompts[activeSection] || ''}
                  onChange={(e) => setSectionPrompts(prev => ({ ...prev, [activeSection]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOptimizeSection(activeSection);
                  }}
                />
                <button 
                  className="nvo-ai-action-btn" 
                  style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800, justifyContent: 'center' }}
                  onClick={() => handleOptimizeSection(activeSection)}
                  disabled={optimizingSections[activeSection]}
                >
                  <span>{optimizingSections[activeSection] ? 'Optimizing...' : 'Run AI Optimization'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeRailTab === 'content' && (
          <motion.div 
            className="nvo-drawer-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="nvo-drawer-header">
              <div className="nvo-drawer-title">
                <FileText size={18} />
                <span>My Content Sections</span>
              </div>
              <button className="nvo-drawer-close" onClick={() => setActiveRailTab(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="nvo-drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="nvo-ai-card">
                <span className="nvo-ai-card-title">Select Section to Edit</span>
                <select 
                  className="nvo-ai-input" 
                  value={mobileSelectedSection} 
                  onChange={(e) => {
                    setMobileSelectedSection(e.target.value);
                    document.getElementById(`editor-card-${e.target.value}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#fff' }}
                >
                  {Object.keys(editedSections).map(key => (
                    <option key={key} value={key}>{SECTION_ICONS[key] || "📝"} {key} Section</option>
                  ))}
                </select>
              </div>

              <div className="nvo-ai-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="nvo-ai-card-title">{mobileSelectedSection} Section Content</span>
                  <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>✍️ Live Edit Mode</span>
                </div>
                <textarea 
                  className="nvo-ai-input"
                  style={{ 
                    flex: 1, 
                    minHeight: '280px', 
                    fontFamily: "'Fira Code', monospace", 
                    fontSize: '0.8rem', 
                    lineHeight: 1.5,
                    resize: 'vertical',
                    background: 'rgba(10, 15, 30, 0.8)',
                    borderColor: 'rgba(255,255,255,0.08)'
                  }}
                  value={editedSections[mobileSelectedSection] || ''}
                  onChange={(e) => updateSectionsWithHistory({ ...editedSections, [mobileSelectedSection]: e.target.value })}
                  placeholder={`Write content for ${mobileSelectedSection} section...`}
                />
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: 1.4, textAlign: 'center' }}>
                  💡 Changes sync with the A4 preview instantly. Use lines/bullets format as needed.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeRailTab === 'templates' && (
          <motion.div 
            className="nvo-drawer-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="nvo-drawer-header">
              <div className="nvo-drawer-title">
                <Layers size={18} />
                <span>Templates & Layouts</span>
              </div>
              <button className="nvo-drawer-close" onClick={() => setActiveRailTab(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="nvo-drawer-body">
              <div className="nvo-ai-card">
                <span className="nvo-ai-card-title">Choose Layout</span>
                <button 
                  className={`nvo-ai-action-btn ${selectedTemplate === 'two-column' ? 'active' : ''}`}
                  onClick={() => setSelectedTemplate('two-column')}
                >
                  <LayoutGrid size={16} />
                  <span>Double Column (Modern Tech)</span>
                </button>
                <button 
                  className={`nvo-ai-action-btn ${selectedTemplate === 'single-column' ? 'active' : ''}`}
                  onClick={() => setSelectedTemplate('single-column')}
                >
                  <FileText size={16} />
                  <span>Single Column (Classic Executive)</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NOVORESUME WORKSPACE CANVAS ── */}
      <main className="nvo-workspace">
        {/* ── TOP FLOATING HEADER TOOLBAR ── */}
        <header className="nvo-top-floating-bar">
          {/* Undo / Redo */}
          <div className="nvo-bar-group">
            <button className="nvo-bar-btn" title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={historyIdx <= 0}>
              <Undo2 size={15} style={{ opacity: historyIdx <= 0 ? 0.4 : 1 }} />
            </button>
            <button className="nvo-bar-btn" title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={historyIdx >= history.length - 1}>
              <Redo2 size={15} style={{ opacity: historyIdx >= history.length - 1 ? 0.4 : 1 }} />
            </button>
          </div>

          <div className="nvo-bar-divider" />

          {/* Layout Selector */}
          <div className="nvo-bar-group">
            <LayoutGrid size={14} style={{ color: '#38bdf8' }} />
            <select 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)} 
              className="red-select"
            >
              <option value="two-column">Double Column</option>
              <option value="single-column">Single Column</option>
            </select>
          </div>

          {/* Fonts Dropdown */}
          <div className="nvo-bar-group">
            <Type size={14} style={{ color: '#38bdf8' }} />
            <select 
              value={selectedFont} 
              onChange={(e) => {
                setSelectedFont(e.target.value);
                localStorage.setItem("cl_selected_font", e.target.value);
              }} 
              className="red-select font-selector"
              title="Change Font Family"
            >
              {PREMIUM_FONTS.map(f => (
                <option key={f.name} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="nvo-bar-group">
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>A±</span>
            <select 
              value={baseFontSize} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setBaseFontSize(val);
                localStorage.setItem("cl_selected_font_size", val);
              }} 
              className="red-select"
              title="Adjust Font Size"
            >
              <option value={0.5}>Size: 6.5pt (Ultra Micro — Fits 1 Page)</option>
              <option value={0.7}>Size: 7.0pt (Micro — Single Page Guarantee)</option>
              <option value={0.85}>Size: 7.5pt (Very Compact)</option>
              <option value={1}>Size: 8.0pt (Compact)</option>
              <option value={1.5}>Size: 8.5pt (Small Compact)</option>
              <option value={2}>Size: 9.0pt (Small)</option>
              <option value={3}>Size: 10.0pt (Normal)</option>
              <option value={4}>Size: 11.0pt (Large)</option>
            </select>
          </div>

          {/* Page Margins Selector */}
          <div className="nvo-bar-group">
            <Maximize2 size={13} style={{ color: '#38bdf8' }} />
            <select 
              value={pageMargins} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setPageMargins(val);
                localStorage.setItem("cl_selected_margins", val);
              }} 
              className="red-select"
              title="Adjust Page Margins"
            >
              <option value={1}>Margin: Compact (0.3 in)</option>
              <option value={2}>Margin: Normal (0.5 in)</option>
              <option value={3}>Margin: Spacious (0.75 in)</option>
            </select>
          </div>

          {/* Section Spacing Selector */}
          <div className="nvo-bar-group">
            <Sliders size={13} style={{ color: '#38bdf8' }} />
            <select 
              value={sectionSpacing} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setSectionSpacing(val);
                localStorage.setItem("cl_selected_spacing", val);
              }} 
              className="red-select"
              title="Adjust Section Spacing"
            >
              <option value={1}>Spacing: Tight</option>
              <option value={3}>Spacing: Normal</option>
              <option value={5}>Spacing: Relaxed</option>
            </select>
          </div>

          {/* Color Themes */}
          <div className="nvo-bar-group">
            <Palette size={14} style={{ color: '#38bdf8' }} />
            <div className="red-color-circles">
              {PREMIUM_THEMES.map((theme) => (
                <button
                  key={theme.hex}
                  className={`red-color-dot ${selectedColor === theme.hex ? 'active' : ''}`}
                  style={{ backgroundColor: theme.hex }}
                  onClick={() => {
                    setSelectedColor(theme.hex);
                    localStorage.setItem("cl_selected_color", theme.hex);
                  }}
                  title={theme.name}
                />
              ))}
            </div>
          </div>

          <div className="nvo-bar-divider" />

          {/* Preview Toggle Button */}
          <button 
            className={`nvo-bar-btn ${isPreviewMode ? 'active' : ''}`} 
            title={isPreviewMode ? "Exit Preview Mode" : "Enter Preview Mode"} 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            style={{ 
              background: isPreviewMode ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: isPreviewMode ? '#38bdf8' : '#cbd5e1',
              border: isPreviewMode ? '1px solid rgba(56, 189, 248, 0.3)' : 'none'
            }}
          >
            {isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{isPreviewMode ? 'Edit Mode' : 'Preview'}</span>
          </button>

          {/* Download PDF Button */}
          <button className={`nvo-bar-btn nvo-btn-download ${downloading ? 'loading' : ''}`} onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <span className="red-spinner" /> : <Download size={14} />}
            <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
          </button>

          {/* Page Counter Badge */}
          <span style={{ 
            fontFamily: "'Fira Code', monospace", 
            fontSize: "0.7rem", 
            fontWeight: 700, 
            color: pageCount > 1 ? "#38bdf8" : "#94a3b8",
            background: pageCount > 1 ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.05)",
            border: pageCount > 1 ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
            padding: "3px 10px",
            borderRadius: "99px",
            marginLeft: "4px"
          }}>
            📄 {pageCount} {pageCount === 1 ? 'Page' : 'Pages'} (A4)
          </span>
        </header>

        {/* ── CENTERED CANVAS VIEWPORT ── */}
        <div className="nvo-canvas-viewport">
          <div className="red-canvas-container">
            <style>{`
              .red-page-canvas {
                padding: var(--page-padding) !important;
              }
              .red-tmpl-section {
                margin-bottom: var(--section-margin) !important;
              }
              .red-tmpl-experience-list {
                gap: var(--list-gap) !important;
              }
              .red-tmpl-bullet-row {
                margin-bottom: var(--bullet-margin) !important;
              }
            `}</style>
            <div 
              ref={livePreviewRef}
              className="red-page-canvas" 
              style={{ 
                fontFamily: activeFontFamily,
                fontSize: `${0.5 + (baseFontSize * 0.1)}rem`,
                '--page-padding': pageMargins === 1 ? '24px 20px' : pageMargins === 2 ? '36px 30px' : '48px 40px',
                '--section-margin': `${sectionSpacing * 6}px`,
                '--list-gap': `${sectionSpacing * 2.5}px`,
                '--bullet-margin': `${sectionSpacing * 1.2}px`,
              }}
            >
              {/* ENHANCV-STYLE TWO-COLUMN */}
              {selectedTemplate === 'two-column' ? (
                <div className="ecv-layout">

                  {/* ── DARK SIDEBAR ── */}
                  <div className="ecv-sidebar" style={{ backgroundColor: selectedColor }}>
                    {/* Avatar / initials */}
                    <div className="ecv-avatar" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
                      <span className="ecv-avatar-initials">
                        {(() => {
                          const headerLines = (editedSections.Header || '').split('\n');
                          const nameLine = headerLines.find(l => {
                            const t = l.trim();
                            return t && !t.startsWith('+') && !t.includes('@') && !t.includes('http') && !t.includes('linkedin') && !t.includes('github') && !/^\d/.test(t);
                          }) || 'U';
                          return nameLine.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        })()}
                      </span>
                    </div>

                    {/* Name + title in sidebar */}
                    <div className="ecv-sidebar-identity" style={getSectionFontSize('Header')}>
                      <h2 
                        className="ecv-sidebar-name nvo-editable-text" 
                        contentEditable 
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const lines = (editedSections.Header || '').split('\n');
                          lines[0] = e.target.innerText;
                          updateSectionsWithHistory({ ...editedSections, Header: lines.join('\n') });
                        }}
                      >{editedSections.Header.split('\n')[0] || 'Your Name'}</h2>
                      <p 
                        className="ecv-sidebar-role nvo-editable-text" 
                        contentEditable 
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const lines = (editedSections.Header || '').split('\n');
                          lines[1] = e.target.innerText;
                          updateSectionsWithHistory({ ...editedSections, Header: lines.join('\n') });
                        }}
                      >{editedSections.Header.split('\n')[1] || 'Professional Role'}</p>
                    </div>

                    {/* Contact */}
                    <div className="ecv-sidebar-section" style={getSectionFontSize('Header')}>
                      <div className="ecv-sidebar-heading">CONTACT</div>
                      <div 
                        className="nvo-editable-text"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const topLines = (editedSections.Header || '').split('\n').slice(0, 2);
                          const contactText = e.target.innerText;
                          updateSectionsWithHistory({ ...editedSections, Header: topLines.join('\n') + '\n' + contactText });
                        }}
                      >
                        {editedSections.Header.split('\n').slice(2).map((line, i) => (
                          <p key={i} className="ecv-sidebar-line">{line}</p>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Sidebar Sections (Drag & Drop Reorderable) */}
                    {sideSectionOrder.map(key => renderSectionByKey(key, true))}
                  </div>

                  {/* ── MAIN CONTENT ── */}
                  <div 
                    className="ecv-main"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleSectionDrop(e, mainSectionOrder[mainSectionOrder.length - 1], false)}
                  >
                    {/* Dynamic Main Body Sections (Drag & Drop Reorderable) */}
                    {mainSectionOrder.map(key => renderSectionByKey(key, false))}
                  </div>
                </div>

              ) : (
                /* ── ENHANCV-STYLE SINGLE COLUMN ── */
                <div className="ecv-single">

                  {/* Bold header band */}
                  <div className="ecv-single-header" style={{ backgroundColor: selectedColor, ...getSectionFontSize('Header') }}>
                    <div className="ecv-single-avatar">
                      <span className="ecv-avatar-initials" style={{ fontSize: '1.1rem' }}>
                        {(editedSections.Header.split('\n')[0] || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 
                        className="ecv-single-name nvo-editable-text"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const lines = (editedSections.Header || '').split('\n');
                          lines[0] = e.target.innerText;
                          updateSectionsWithHistory({ ...editedSections, Header: lines.join('\n') });
                        }}
                      >{editedSections.Header.split('\n')[0] || 'Your Name'}</h2>
                      <p 
                        className="ecv-single-role nvo-editable-text"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const lines = (editedSections.Header || '').split('\n');
                          lines[1] = e.target.innerText;
                          updateSectionsWithHistory({ ...editedSections, Header: lines.join('\n') });
                        }}
                      >{editedSections.Header.split('\n')[1] || 'Professional Role'}</p>
                      <p 
                        className="ecv-single-contacts nvo-editable-text"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const topLines = (editedSections.Header || '').split('\n').slice(0, 2);
                          updateSectionsWithHistory({ ...editedSections, Header: topLines.join('\n') + '\n' + e.target.innerText });
                        }}
                      >{editedSections.Header.split('\n').slice(2).join('  •  ')}</p>
                    </div>
                  </div>

                  <div className="ecv-single-body">
                    {/* Dynamic Single-Column Sections (Drag & Drop Reorderable) */}
                    {[...mainSectionOrder, ...sideSectionOrder].map(key => renderSectionByKey(key, false))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      <ScanCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="PDF Resume Compiled & Exported!"
        subtitle="Your ATS-optimized PDF resume has been formatted and saved."
        score={result?.estimated_new_score || 95}
      />
    </div>
  );
}
