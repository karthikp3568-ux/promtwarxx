import type { HistoryEntry } from '../api/types';

const STORAGE_KEY = 'trustguard.history.v1';
const MAX_ENTRIES = 50;

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may be full or unavailable
  }
}

export function isHistoryEnabled(): boolean {
  try {
    return localStorage.getItem('trustguard.history.enabled') !== 'false';
  } catch {
    return false;
  }
}

export function setHistoryEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('trustguard.history.enabled', String(enabled));
  } catch {
    // ignore
  }
}

export function getHistory(): HistoryEntry[] {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return [];
    return entries;
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: HistoryEntry): void {
  if (!isHistoryEnabled()) return;
  const entries = getHistory();
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  safeSetItem(STORAGE_KEY, JSON.stringify(entries));
}

export function deleteHistoryEntry(id: string): void {
  const entries = getHistory().filter(e => e.id !== id);
  safeSetItem(STORAGE_KEY, JSON.stringify(entries));
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
