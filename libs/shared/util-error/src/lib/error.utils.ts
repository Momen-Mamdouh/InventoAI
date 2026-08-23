/**
 * Extracts a human-readable message from an HTTP error, a native `Error`, or any other thrown
 * value. Prefers the backend's own `message` field (string or array of strings), then a native
 * `Error.message`, then the raw `error` payload; falls back to `fallback` when nothing usable is
 * found.
 *
 * Byte-identical across all three apps prior to extraction (md5 `bb6b10b4…`); the only change
 * here is the parameter type, narrowed from `any` to `unknown` per Constitution Principle 2 —
 * runtime behaviour is unchanged for every existing caller.
 */
export function extractErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (!err) return fallback;

  const rawMessage = extractRawMessage(err);

  if (typeof rawMessage === 'string') {
    return rawMessage;
  }

  if (Array.isArray(rawMessage)) {
    return rawMessage.filter((item): item is string => typeof item === 'string').join(', ') || fallback;
  }

  if (typeof rawMessage === 'object' && rawMessage !== null) {
    const nested = (rawMessage as Record<string, unknown>)['message'];
    if (typeof nested === 'string') {
      return nested;
    }
    try {
      return JSON.stringify(rawMessage);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function extractRawMessage(err: unknown): unknown {
  if (typeof err !== 'object' || err === null) {
    return undefined;
  }

  const candidate = err as { error?: unknown; message?: unknown };
  const nestedError =
    typeof candidate.error === 'object' && candidate.error !== null
      ? (candidate.error as Record<string, unknown>)['message']
      : undefined;

  return nestedError ?? candidate.message ?? candidate.error;
}
