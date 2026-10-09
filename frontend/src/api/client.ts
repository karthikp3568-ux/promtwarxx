import type { HealthStatus, StreamEvent, Simulation, AnalysisResult } from './types';
import { auth } from '../firebase';


const rawBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '') : '';
export const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';
const BASE = API_BASE;


async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

async function* parseNDJSON(response: Response): AsyncGenerator<StreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          yield JSON.parse(trimmed) as StreamEvent;
        } catch {
          console.warn('Failed to parse NDJSON line:', trimmed);
        }
      }
    }

    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer.trim()) as StreamEvent;
      } catch {
        console.warn('Failed to parse final NDJSON line:', buffer.trim());
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function* analyzeConversation(
  text?: string,
  image?: File,
): AsyncGenerator<StreamEvent> {
  const form = new FormData();
  if (text) form.append('text', text);
  if (image) form.append('image', image);

  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/analyze/conversation`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'UNKNOWN', message: 'Request failed' }));
    yield { type: 'error' as const, code: err.code, message: err.message };
    return;
  }

  yield* parseNDJSON(res);
}

export async function* analyzePayment(
  image?: File,
  text?: string,
  purpose?: string,
): AsyncGenerator<StreamEvent> {
  const form = new FormData();
  if (image) form.append('image', image);
  if (text) form.append('text', text);
  if (purpose) form.append('purpose', purpose);

  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/analyze/payment`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'UNKNOWN', message: 'Request failed' }));
    yield { type: 'error' as const, code: err.code, message: err.message };
    return;
  }

  yield* parseNDJSON(res);
}

export async function* analyzeDocument(
  file: File,
  context?: string,
): AsyncGenerator<StreamEvent> {
  const form = new FormData();
  form.append('file', file);
  if (context) form.append('context', context);

  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/analyze/document`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'UNKNOWN', message: 'Request failed' }));
    yield { type: 'error' as const, code: err.code, message: err.message };
    return;
  }

  yield* parseNDJSON(res);
}

export async function* analyzeVoice(
  audio: File,
  context?: string,
): AsyncGenerator<StreamEvent> {
  const form = new FormData();
  form.append('audio', audio);
  if (context) form.append('context', context);

  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/analyze/voice`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'UNKNOWN', message: 'Request failed' }));
    yield { type: 'error' as const, code: err.code, message: err.message };
    return;
  }

  yield* parseNDJSON(res);
}

export async function simulateWhatIf(req: {
  analysis_id?: string;
  analysis?: Partial<AnalysisResult> | Record<string, unknown>;
  description?: string;
}): Promise<Simulation> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}/whatif`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'UNKNOWN', message: 'Request failed' }));
    throw new Error(err.message || 'What-If simulation failed');
  }

  return res.json();
}
