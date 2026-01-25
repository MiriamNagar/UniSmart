/**
 * Theme color hook for accessing theme-aware colors.
 * 
 * This hook provides access to theme colors that automatically adapt to
 * the current color scheme (light/dark mode). It supports both predefined
 * theme colors and custom color overrides.
 * 
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 * 
 * @module hooks/use-theme-color
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Hook to get theme-aware color value.
 * 
 * Returns the appropriate color based on the current color scheme. If custom
 * colors are provided in props, those take precedence over theme defaults.
 * 
 * @param {Object} props - Color configuration
 * @param {string} [props.light] - Custom color for light mode (optional)
 * @param {string} [props.dark] - Custom color for dark mode (optional)
 * @param {keyof typeof Colors.light & keyof typeof Colors.dark} colorName - 
 *   Name of the color to retrieve from theme (e.g., "text", "background", "tint")
 * 
 * @returns {string} Color value for current theme
 * 
 * @example
 * ```tsx
 * // Use theme default color
 * const textColor = useThemeColor({}, 'text');
 * 
 * // Override with custom colors
 * const customColor = useThemeColor(
 *   { light: '#000000', dark: '#FFFFFF' },
 *   'text'
 * );
 * ```
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
