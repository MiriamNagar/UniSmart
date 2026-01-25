/**
 * Theme constants for the UniSmart application.
 * 
 * This module defines all color schemes and font configurations for both
 * light and dark modes. The theme system supports platform-specific
 * font configurations for iOS, Android, and Web.
 * 
 * Color System:
 * - Light mode: Light background with dark text
 * - Dark mode: Dark background with light text
 * 
 * Font System:
 * - Platform-specific font stacks for optimal rendering
 * - Supports sans, serif, rounded, and monospace variants
 * 
 * Alternative styling solutions:
 * - [Nativewind](https://www.nativewind.dev/)
 * - [Tamagui](https://tamagui.dev/)
 * - [unistyles](https://reactnativeunistyles.vercel.app)
 * 
 * @module constants/theme
 */

import { Platform } from 'react-native';

/** Tint color for light mode (used for links, active states) */
const tintColorLight = '#0a7ea4';
/** Tint color for dark mode (used for links, active states) */
const tintColorDark = '#fff';

/**
 * Color palette for light and dark themes.
 * 
 * Each theme defines colors for:
 * - text: Primary text color
 * - background: Main background color
 * - tint: Accent color for links and active elements
 * - icon: Default icon color
 * - tabIconDefault: Inactive tab icon color
 * - tabIconSelected: Active tab icon color
 * 
 * @constant {Object} Colors
 */
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * Platform-specific font configurations.
 * 
 * Provides optimized font stacks for each platform:
 * - iOS: Uses system font descriptors
 * - Web: Uses web-safe font stacks
 * - Default (Android): Uses generic font families
 * 
 * Font variants:
 * - sans: Default sans-serif font
 * - serif: Serif font for emphasis
 * - rounded: Rounded sans-serif for friendly UI
 * - mono: Monospace font for code/data
 * 
 * @constant {Object} Fonts
 */
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
