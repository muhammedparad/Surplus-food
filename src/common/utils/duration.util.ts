const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Parses compact duration strings like "15m", "24h", "30d", or numeric seconds/ms.
 */
export function parseDurationToMs(input: string, fallbackMs: number = 15 * 60 * 1000): number {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return fallbackMs;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const match = /^(\d+)(ms|s|m|h|d|w)$/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid duration format: "${input}"`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  return value * UNIT_TO_MS[unit];
}

export function addDurationToNow(input: string): Date {
  return new Date(Date.now() + parseDurationToMs(input));
}
