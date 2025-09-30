import type { JobDescriptionData, ResumeData } from "../services/llmService";

/**
 * Extract minimum years requirement from experience text
 */
function yearsMinFrom(texts?: string[]): number | undefined {
  if (!texts) return undefined;
  for (const t of texts) {
    const m = t.match(/(\d+)\+?\s*(years|yrs)/i);
    if (m) return parseInt(m[1], 10);
  }
  return undefined;
}

/**
 * Very rough placeholder: turn "YYYY-MM–YYYY-MM" into years
 * In production, you'd want proper date parsing
 */
function estimateYears(range?: string): number {
  if (!range) return 0;
  const m = range.match(/(\d{4})/g);
  if (!m || m.length === 0) return 0;
  const start = parseInt(m[0], 10);
  const end = parseInt(m[m.length - 1], 10);
  if (isNaN(start) || isNaN(end)) return 0;
  return Math.max(0, end - start + 0.0); // treat years as integers for now
}

/**
 * CUSTOM ADAPTER - Use only the most essential fields for LLM comparison
 * Optimized for performance with minimal data processing
 */
export function idpJDToJobDescriptionDataCustom(idpJD: any): JobDescriptionData {
  // Build comprehensive description including employment type, travel, and responsibilities
  let description = idpJD.Summary ?? "";
  
  if (idpJD.Employment_Type) {
    description += `\n\nEmployment Type: ${idpJD.Employment_Type}`;
  }
  if (idpJD.Travel && idpJD.Travel !== "Not Found") {
    description += `\nTravel Required: ${idpJD.Travel}`;
  }
  if (idpJD.Responsibilities?.Responsibility_Duties?.length > 0) {
    description += `\n\nKey Responsibilities:\n• ${idpJD.Responsibilities.Responsibility_Duties.join('\n• ')}`;
  }
  if (idpJD.Compliance?.Compliance_Regulatory?.length > 0) {
    description += `\n\nCompliance Requirements:\n• ${idpJD.Compliance.Compliance_Regulatory.join('\n• ')}`;
  }

  return {
    title: idpJD.Job_Title ?? "Unknown role",
    description: description,
    skills: idpJD.Skills?.Skills ?? [],
    experience_level: yearsMinFrom(idpJD.Experience?.Required_Experience)?.toString() ?? undefined,
    education: idpJD.Education?.Education ?? undefined,
    requirements: [
      ...(idpJD.Experience?.Required_Experience ?? []),
      ...(idpJD.Qualifications?.Qualifications_Required ?? []),
      ...(idpJD.Qualifications?.Qualifications_Preferred ?? []),
    ]
  };
}

export function idpResumeToResumeDataCustom(idpCV: any): ResumeData {
  // Parse total years experience
  const totalYears = idpCV.total_years_experience ? 
    (typeof idpCV.total_years_experience === 'string' ? 
      parseInt(idpCV.total_years_experience.replace(/\D/g, '')) || 0 : 
      idpCV.total_years_experience) : 0;

  return {
    name: idpCV.Full_Name,
    email: idpCV.email,
    phone: idpCV.phone,
    skills: [...new Set([...(idpCV.skills_core ?? []), ...(idpCV.tools_platforms ?? [])])],
    experience: (idpCV.Work_Experience ?? []).map((w: any) => ({
      company: w.Company,
      position: w.Job_Title,
      years: totalYears > 0 ? Math.floor(totalYears / (idpCV.Work_Experience?.length || 1)) : estimateYears(w.Employment_Dates),
      description: (w.Responsibilities ?? []).join(" • ")
    })),
    education: (idpCV.Education ?? []).map((edu: any) => ({
      degree: edu.Degree,
      field: edu.Degree.split(' in ')[1] || "",
      institution: edu.Institution || ""
    })),
    summary: `${idpCV.Full_Name} is a professional with ${idpCV.total_years_experience} years of experience in ${idpCV.skills_core?.slice(0, 3).join(', ') || 'relevant fields'}.`
  };
}

/**
 * Convert multiple IDP resumes to our ResumeData interface
 */
export function idpResumesToResumeDataCustom(idpResumes: any[]): ResumeData[] {
  return idpResumes.map(idpResumeToResumeDataCustom);
}

/**
 * Convert multiple IDP job descriptions to our JobDescriptionData interface
 */
export function idpJDsToJobDescriptionDataCustom(idpJDs: any[]): JobDescriptionData[] {
  return idpJDs.map(idpJDToJobDescriptionDataCustom);
}