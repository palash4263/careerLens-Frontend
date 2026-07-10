import { useEffect, useState } from "react";

import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { optimizeResume } from "../services/resumeOptimizationService";

import { generateResumePDF } from "../utils/pdfGenerator";
import { copyToClipboard } from "../utils/clipboard";

export default function useResumeOptimization() {
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);

  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJobDescription, setSelectedJobDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const resumeData = await getResumes();
      const jdData = await getJobDescriptions();

      setResumes(resumeData);
      setJobDescriptions(jdData);
    } catch (err) {
      console.error(err);
      setError("Unable to load resumes or job descriptions.");
    }
  }

  async function handleOptimize() {
    if (!selectedResume || !selectedJobDescription) {
      alert("Please select a resume and job description.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await optimizeResume(
        Number(selectedResume),
        Number(selectedJobDescription)
      );

      const normalized = {
        originalScore: response.current_score || 0,

        optimizedScore: response.estimated_new_score || 0,

        originalText: response.original_text || "",

        optimizedText: response.optimized_text || "",

        keywords:
          response.improvements?.matched_job_skills || [],

        changes:
          response.improvements?.added_skills?.map(skill => ({
            title: "Added Skill",
            description: `Added "${skill}"`,
          })) || [],

        recommendations:
          response.improvements?.added_skills?.length > 0
            ? [
                `Consider including ${response.improvements.added_skills.join(
                  ", "
                )}`
              ]
            : ["Resume already matches well."],

        raw: response,
      };

      setResult(normalized);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Resume optimization failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result?.optimizedText) return;

    const success = await copyToClipboard(
      result.optimizedText
    );

    if (success) {
      setCopySuccess(true);

      setTimeout(() => {
        setCopySuccess(false);
      }, 2500);
    }
  }

  async function handleDownload() {
    if (!result?.optimizedText) return;

    setDownloading(true);

    try {
      const fileName =
        resumes.find(
          r => r.id === Number(selectedResume)
        )?.file_name || "resume";

      const jobTitle =
        jobDescriptions.find(
          j => j.id === Number(selectedJobDescription)
        )?.title || "";

      await generateResumePDF({
        resumeText: result.optimizedText,
        fileName,
        score: result.optimizedScore,
        jobTitle,
      });
    } finally {
      setDownloading(false);
    }
  }

  return {
    resumes,
    jobDescriptions,

    selectedResume,
    selectedJobDescription,

    setSelectedResume,
    setSelectedJobDescription,

    loading,
    downloading,

    error,
    result,

    copySuccess,

    handleOptimize,
    handleCopy,
    handleDownload,
  };
}