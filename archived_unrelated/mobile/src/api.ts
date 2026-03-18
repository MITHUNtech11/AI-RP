// Minimal API client for the React Native app
export type GenerateResponse = {
  status: string;
  data: any;
};

const API_BASE = "http://10.0.2.2:8000"; // use emulator host; change to your backend URL

export async function generate(prompt: string, apiKey?: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json;
}
