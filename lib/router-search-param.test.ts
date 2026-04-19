import { normalizeSearchParam } from '@/lib/router-search-param';

describe('normalizeSearchParam', () => {
  it('returns first element when param is an array', () => {
    expect(normalizeSearchParam(['signin', 'x'])).toBe('signin');
  });

  it('returns string when param is a string', () => {
    expect(normalizeSearchParam('signup')).toBe('signup');
  });

  it('returns undefined for empty or missing', () => {
    expect(normalizeSearchParam(undefined)).toBeUndefined();
    expect(normalizeSearchParam('')).toBeUndefined();
    expect(normalizeSearchParam([])).toBeUndefined();
  });
});
