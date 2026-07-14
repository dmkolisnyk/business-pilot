const DEFAULT_REDIRECT_PATH = '/dashboard';

export function sanitizeRedirectPath(
  value: string | string[] | null | undefined,
  fallback: string = DEFAULT_REDIRECT_PATH,
): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate === undefined || candidate === null) {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (trimmed.length === 0) {
    return fallback;
  }

  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('://') ||
    trimmed.includes('\\') ||
    trimmed.includes('\n') ||
    trimmed.includes('\r')
  ) {
    return fallback;
  }

  return trimmed;
}

