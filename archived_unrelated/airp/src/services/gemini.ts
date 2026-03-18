import { GoogleGenAI } from "@google/genai";
import { ResumeData } from "../types/resume";

// Environment-driven backend proxy (Vite env)
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "";
const USE_BACKEND = (import.meta as any).env?.VITE_USE_BACKEND !== 'false' && Boolean(API_BASE);

function base64ToBlob(base64: string, mimeType = 'image/jpeg') {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export const parseResumeWithGemini = async (
  imageBase64: string,
  apiKey?: string,
  mimeType: string = "image/jpeg"
): Promise<ResumeData> => {
  // If configured, proxy the upload to the backend instead of calling Gemini directly
  if (USE_BACKEND && API_BASE) {
    try {
      const blob = base64ToBlob(imageBase64, mimeType);
      const form = new FormData();
      // Provide a filename so backend can infer type
      form.append('file', blob, 'resume_upload.jpg');

      const headers: Record<string, string> = {};
      if (apiKey) headers['X-API-Key'] = apiKey;

      const res = await fetch(`${API_BASE.replace(/\/$/, '')}/parse_resume`, {
        method: 'POST',
        body: form,
        headers
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Backend error ${res.status}: ${txt}`);
      }

      const json = await res.json();
      // Expecting { status: 'success', data: {...} }
      if (json && json.status === 'success' && json.data) {
        return json.data as ResumeData;
      }

      throw new Error('Unexpected backend response');
    } catch (err) {
      console.error('Error proxying to backend:', err);
      throw err;
    }
  }

  // Fallback: call Gemini directly via GoogleGenAI
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
      id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now()),
      fileName: "Scanned Resume",
      uploadDate: new Date().toISOString(),
      status: 'completed'
    } as ResumeData;
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};
