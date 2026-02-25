import { GoogleGenAI } from "@google/genai";
import { ResumeData } from "../types/resume";

export const parseResumeWithGemini = async (
  imageBase64: string, 
  apiKey: string,
  mimeType: string = "image/jpeg"
): Promise<ResumeData> => {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert resume parser. Extract the following information from the resume document provided.
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
      ]
    }
    If a field is missing, use an empty string or empty array. Do not include markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
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
