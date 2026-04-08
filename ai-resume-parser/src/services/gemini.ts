import { GoogleGenAI } from "@google/genai";
import { ResumeData } from "../types/resume";

export const parseResumeWithGemini = async (
  imageBase64: string, 
  apiKey: string,
  mimeType: string = "image/jpeg",
  jobDescription?: string
): Promise<ResumeData> => {
  const ai = new GoogleGenAI({ apiKey });

  let prompt = `
    You are an expert HR recruitment assistant and resume parser. Extract the following information from the candidate's resume document provided.
    Return ONLY a valid JSON object with this exact structure:
    {
      "personalInfo": {
        "fullName": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "linkedin": "string (optional)",
        "website": "string (optional)"
      },
      "summary": "string",
      "skills": ["string"],
      "experience": [
        {
          "id": "unique_id",
          "title": "string",
          "company": "string",
          "startDate": "string",
          "endDate": "string",
          "description": "string"
        }
      ],
      "education": [
        {
          "id": "unique_id",
          "degree": "string",
          "school": "string",
          "graduationDate": "string"
        }
      ],
      "languages": [
        {
          "language": "string",
          "proficiency": "Native | Fluent | Intermediate | Basic"
        }
      ]`;

  if (jobDescription && jobDescription.trim() !== '') {
    prompt += `,
      "hrEvaluation": {
        "matchScore": number (0-100 representing how well the candidate matches the job description),
        "recommendation": "Strong Hire" | "Hire" | "Hold" | "Reject",
        "evaluationSummary": "string (A brief 2-3 sentence summary of why they are or aren't a good fit)",
        "matchingSkills": ["string (skills from resume that match JD)"],
        "missingSkills": ["string (key skills in JD missing from resume)"]
      }
    `;
  }

  prompt += `
    }
    If a field is missing, use an empty string or empty array. Do not include markdown formatting like \`\`\`json.
  `;

  if (jobDescription && jobDescription.trim() !== '') {
    prompt += `\n\nEvaluate the candidate against the following Job Description:\n"""\n${jobDescription}\n"""`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);
    
    // Add metadata
    return {
      ...parsed,
      id: crypto.randomUUID(),
      fileName: "Scanned Resume",
      uploadDate: new Date().toISOString(),
      status: 'completed'
    };
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};
