import type { StreamEvent } from './types';

export async function parseNDJSONStream(
  response: Response,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
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
          const event: StreamEvent = JSON.parse(trimmed);
          onEvent(event);
        } catch {
          console.warn('Failed to parse NDJSON line:', trimmed);
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const event: StreamEvent = JSON.parse(buffer.trim());
        onEvent(event);
      } catch {
        console.warn('Failed to parse final NDJSON line:', buffer.trim());
      }
    }
  } finally {
    reader.releaseLock();
  }
}
