/**
 * Shell-scoped design tokens.
 * Active nav / primary accent: legacy purple. Inactive tabs: UX stone `textSecondary`.
 * (UX teal `#0D9488` is available for future surfaces if product adopts it.)
 */
export const designTokens = {
  color: {
    primary: '#5B4C9D',
    /** Darker purple for pressed / emphasis */
    primaryDark: '#4A3D7E',
    textSecondary: '#57534E',
    surfaceCard: '#FFFFFF',
    border: '#E7E5E4',
    alert: '#DC2626',
  },
} as const;

export type DesignTokenColors = typeof designTokens.color;
