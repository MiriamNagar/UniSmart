import { designTokens } from '@/constants/design-tokens';

describe('designTokens (shell)', () => {
  it('matches shell hex values for bottom-nav and semantic colors', () => {
    expect(designTokens.color.primary).toBe('#5B4C9D');
    expect(designTokens.color.primaryDark).toBe('#4A3D7E');
    expect(designTokens.color.textSecondary).toBe('#57534E');
    expect(designTokens.color.surfaceCard).toBe('#FFFFFF');
    expect(designTokens.color.border).toBe('#E7E5E4');
    expect(designTokens.color.alert).toBe('#DC2626');
  });
});
