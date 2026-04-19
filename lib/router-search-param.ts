/**
 * Expo Router search params can be `string | string[]` depending on platform/version.
 * Use when branching on param values (e.g. sign-in vs sign-up).
 */
export function normalizeSearchParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
