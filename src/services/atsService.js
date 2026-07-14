import { optimizeResume } from "./resumeOptimizationService";

export const analyzeResume = async (resumeId, jobDescriptionId) => {
  return optimizeResume(resumeId, jobDescriptionId);
};
