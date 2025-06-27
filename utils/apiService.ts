import { WHISPER_API_KEY, GEMINI_API_KEY } from '@env';

// ---------- ENDPOINTS ----------
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const GEMINI_API_URL =
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ------------- FETCH WRAPPER ------------- //
async function fetchWithTimeout(
  resource: RequestInfo,
  options: RequestInit = {},
  timeout = 30000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(`API ${res.status}: ${JSON.stringify(body)}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

// ------------- SERVICE ------------- //
export const apiService = {
  /** Transcribe audio with Whisper */
  async transcribeAudio(uri: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', { uri, name: 'recording.m4a', type: 'audio/m4a' } as any);
    formData.append('model', 'whisper-1');
    //formData.append('language', 'en');
    formData.append('response_format', 'json');

    const data = await fetchWithTimeout(
      WHISPER_API_URL,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${WHISPER_API_KEY}` },
        body: formData,
      },
      60000                                          // <-- 3) bump for >1-min clips
    );
    if (data.text) return data.text;
    throw new Error('Transcription failed: bad Whisper response');
  },

  /** Clean transcript with Gemini Flash */
  async cleanTranscript(text: string): Promise<string> {
    const prompt =
      `Please clean up the following transcript. Add punctuation, fix spelling, ` +
      `and format it into clear paragraphs *without changing the meaning*:\n\n${text}`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    });

    const data = await fetchWithTimeout(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const cleaned = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (cleaned) return cleaned;
    throw new Error('Cleanup failed: bad Gemini response');
  },
};
