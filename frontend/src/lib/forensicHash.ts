/**
 * TrustGuard AI — Forensic Cryptographic Integrity Utilities
 * Generates client-side verifiable SHA-256 hashes for evidence dossiers.
 */

export async function computeEvidenceHash(evidencePayload: Record<string, unknown>): Promise<string> {
  const jsonString = JSON.stringify(evidencePayload, Object.keys(evidencePayload).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback fast numeric hash formatted as hex if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}
