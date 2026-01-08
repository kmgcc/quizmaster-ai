// 主题系统 - Material You 风格的低饱和配色方案

export type ThemePalette = 
  | 'teal_elegant' 
  | 'indigo_calm' 
  | 'sage_mist' 
  | 'amber_linen' 
  | 'rose_dust' 
  | 'sky_slate'
  | 'lime_silk'
  | 'butter_mint'
  | 'citrus_sage'
  | 'sunlit_yellow'
  | 'lime_pop'
  | 'citrus_grove'
  | 'orchid_ink'
  | 'copper_tide'
  | 'neon_paper'
  | 'forest_lemon'
  | 'clay_cyan'
  | 'obsidian_gold'
  | 'parchment_pale'
  | 'classical_greystone'
  | 'four_seasons';

export interface ThemeTokens {
  // 基础色
  bg: string;
  surface: string;
  surface2: string;
  outline: string;
  text: string;
  muted: string;
  
  // Primary (主色)
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Secondary (副色)
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  
  // Tertiary (点缀色)
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  
  // 状态色
  success: string;
  warning: string;
  danger: string;
  
  // Focus ring
  ring: string;
}

// 主题定义
export const themes: Record<ThemePalette, { light: ThemeTokens; dark: ThemeTokens }> = {
  teal_elegant: {
    light: {
      bg: 'hsl(0, 0%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(0, 0%, 96%)',
      outline: 'hsl(0, 0%, 85%)',
      text: 'hsl(0, 0%, 10%)',
      muted: 'hsl(0, 0%, 45%)',
      primary: 'hsl(175, 28%, 40%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(175, 25%, 92%)',
      onPrimaryContainer: 'hsl(175, 35%, 25%)',
      secondary: 'hsl(200, 20%, 45%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(200, 18%, 90%)',
      onSecondaryContainer: 'hsl(200, 25%, 30%)',
      tertiary: 'hsl(35, 25%, 50%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(35, 20%, 88%)',
      onTertiaryContainer: 'hsl(35, 30%, 30%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(175, 28%, 40%)',
    },
    dark: {
      bg: 'hsl(210, 15%, 8%)',
      surface: 'hsl(210, 12%, 12%)',
      surface2: 'hsl(210, 10%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 95%)',
      muted: 'hsl(0, 0%, 60%)',
      primary: 'hsl(175, 22%, 55%)', // 低饱和，不刺眼
      onPrimary: 'hsl(0, 0%, 10%)',
      primaryContainer: 'hsl(175, 20%, 20%)',
      onPrimaryContainer: 'hsl(175, 25%, 75%)',
      secondary: 'hsl(200, 15%, 55%)',
      onSecondary: 'hsl(0, 0%, 10%)',
      secondaryContainer: 'hsl(200, 12%, 18%)',
      onSecondaryContainer: 'hsl(200, 18%, 70%)',
      tertiary: 'hsl(35, 20%, 60%)',
      onTertiary: 'hsl(0, 0%, 10%)',
      tertiaryContainer: 'hsl(35, 15%, 22%)',
      onTertiaryContainer: 'hsl(35, 25%, 75%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(175, 22%, 55%)',
    },
  },
  indigo_calm: {
    light: {
      bg: 'hsl(0, 0%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(0, 0%, 96%)',
      outline: 'hsl(0, 0%, 85%)',
      text: 'hsl(0, 0%, 10%)',
      muted: 'hsl(0, 0%, 45%)',
      primary: 'hsl(230, 25%, 45%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(230, 20%, 92%)',
      onPrimaryContainer: 'hsl(230, 30%, 25%)',
      secondary: 'hsl(260, 20%, 50%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(260, 18%, 90%)',
      onSecondaryContainer: 'hsl(260, 25%, 30%)',
      tertiary: 'hsl(30, 25%, 55%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(30, 20%, 88%)',
      onTertiaryContainer: 'hsl(30, 30%, 30%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(230, 25%, 45%)',
    },
    dark: {
      bg: 'hsl(230, 20%, 8%)',
      surface: 'hsl(230, 15%, 12%)',
      surface2: 'hsl(230, 12%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 95%)',
      muted: 'hsl(0, 0%, 60%)',
      primary: 'hsl(230, 18%, 60%)',
      onPrimary: 'hsl(0, 0%, 10%)',
      primaryContainer: 'hsl(230, 15%, 20%)',
      onPrimaryContainer: 'hsl(230, 20%, 75%)',
      secondary: 'hsl(260, 15%, 60%)',
      onSecondary: 'hsl(0, 0%, 10%)',
      secondaryContainer: 'hsl(260, 12%, 18%)',
      onSecondaryContainer: 'hsl(260, 18%, 70%)',
      tertiary: 'hsl(30, 20%, 65%)',
      onTertiary: 'hsl(0, 0%, 10%)',
      tertiaryContainer: 'hsl(30, 15%, 22%)',
      onTertiaryContainer: 'hsl(30, 25%, 75%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(230, 18%, 60%)',
    },
  },
  sage_mist: {
    light: {
      bg: 'hsl(0, 0%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(0, 0%, 96%)',
      outline: 'hsl(0, 0%, 85%)',
      text: 'hsl(0, 0%, 10%)',
      muted: 'hsl(0, 0%, 45%)',
      primary: 'hsl(150, 20%, 40%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(150, 18%, 92%)',
      onPrimaryContainer: 'hsl(150, 25%, 25%)',
      secondary: 'hsl(120, 15%, 45%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(120, 12%, 90%)',
      onSecondaryContainer: 'hsl(120, 20%, 30%)',
      tertiary: 'hsl(40, 25%, 50%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(40, 20%, 88%)',
      onTertiaryContainer: 'hsl(40, 30%, 30%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(150, 20%, 40%)',
    },
    dark: {
      bg: 'hsl(150, 15%, 8%)',
      surface: 'hsl(150, 12%, 12%)',
      surface2: 'hsl(150, 10%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 95%)',
      muted: 'hsl(0, 0%, 60%)',
      primary: 'hsl(150, 18%, 55%)',
      onPrimary: 'hsl(0, 0%, 10%)',
      primaryContainer: 'hsl(150, 15%, 20%)',
      onPrimaryContainer: 'hsl(150, 20%, 75%)',
      secondary: 'hsl(120, 12%, 58%)',
      onSecondary: 'hsl(0, 0%, 10%)',
      secondaryContainer: 'hsl(120, 10%, 18%)',
      onSecondaryContainer: 'hsl(120, 15%, 70%)',
      tertiary: 'hsl(40, 20%, 62%)',
      onTertiary: 'hsl(0, 0%, 10%)',
      tertiaryContainer: 'hsl(40, 15%, 22%)',
      onTertiaryContainer: 'hsl(40, 25%, 75%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(150, 18%, 55%)',
    },
  },
  amber_linen: {
    light: {
      bg: 'hsl(0, 0%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(0, 0%, 96%)',
      outline: 'hsl(0, 0%, 85%)',
      text: 'hsl(0, 0%, 10%)',
      muted: 'hsl(0, 0%, 45%)',
      primary: 'hsl(38, 30%, 45%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(38, 25%, 92%)',
      onPrimaryContainer: 'hsl(38, 35%, 25%)',
      secondary: 'hsl(25, 25%, 50%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(25, 20%, 90%)',
      onSecondaryContainer: 'hsl(25, 30%, 30%)',
      tertiary: 'hsl(200, 20%, 50%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(200, 18%, 88%)',
      onTertiaryContainer: 'hsl(200, 25%, 30%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(38, 30%, 45%)',
    },
    dark: {
      bg: 'hsl(30, 15%, 8%)',
      surface: 'hsl(30, 12%, 12%)',
      surface2: 'hsl(30, 10%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 95%)',
      muted: 'hsl(0, 0%, 60%)',
      primary: 'hsl(38, 25%, 58%)',
      onPrimary: 'hsl(0, 0%, 10%)',
      primaryContainer: 'hsl(38, 20%, 20%)',
      onPrimaryContainer: 'hsl(38, 28%, 75%)',
      secondary: 'hsl(25, 20%, 60%)',
      onSecondary: 'hsl(0, 0%, 10%)',
      secondaryContainer: 'hsl(25, 15%, 18%)',
      onSecondaryContainer: 'hsl(25, 25%, 70%)',
      tertiary: 'hsl(200, 15%, 60%)',
      onTertiary: 'hsl(0, 0%, 10%)',
      tertiaryContainer: 'hsl(200, 12%, 22%)',
      onTertiaryContainer: 'hsl(200, 20%, 75%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(38, 25%, 58%)',
    },
  },
  rose_dust: {
    light: {
      bg: 'hsl(0, 0%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(0, 0%, 96%)',
      outline: 'hsl(0, 0%, 85%)',
      text: 'hsl(0, 0%, 10%)',
      muted: 'hsl(0, 0%, 45%)',
      primary: 'hsl(350, 25%, 45%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(350, 20%, 92%)',
      onPrimaryContainer: 'hsl(350, 30%, 25%)',
      secondary: 'hsl(320, 20%, 50%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(320, 18%, 90%)',
      onSecondaryContainer: 'hsl(320, 25%, 30%)',
      tertiary: 'hsl(280, 25%, 55%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(280, 20%, 88%)',
      onTertiaryContainer: 'hsl(280, 30%, 30%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(350, 25%, 45%)',
    },
    dark: {
      bg: 'hsl(350, 20%, 8%)',
      surface: 'hsl(350, 15%, 12%)',
      surface2: 'hsl(350, 12%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 95%)',
      muted: 'hsl(0, 0%, 60%)',
      primary: 'hsl(350, 20%, 58%)',
      onPrimary: 'hsl(0, 0%, 10%)',
      primaryContainer: 'hsl(350, 15%, 20%)',
      onPrimaryContainer: 'hsl(350, 25%, 75%)',
      secondary: 'hsl(320, 15%, 60%)',
      onSecondary: 'hsl(0, 0%, 10%)',
      secondaryContainer: 'hsl(320, 12%, 18%)',
      onSecondaryContainer: 'hsl(320, 18%, 70%)',
      tertiary: 'hsl(280, 20%, 62%)',
      onTertiary: 'hsl(0, 0%, 10%)',
      tertiaryContainer: 'hsl(280, 15%, 22%)',
      onTertiaryContainer: 'hsl(280, 25%, 75%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(350, 20%, 58%)',
    },
  },
  sky_slate: {
    light: {
      bg: 'hsl(0, 0%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(0, 0%, 96%)',
      outline: 'hsl(0, 0%, 85%)',
      text: 'hsl(0, 0%, 10%)',
      muted: 'hsl(0, 0%, 45%)',
      primary: 'hsl(200, 30%, 45%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(200, 25%, 92%)',
      onPrimaryContainer: 'hsl(200, 35%, 25%)',
      secondary: 'hsl(220, 20%, 50%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(220, 18%, 90%)',
      onSecondaryContainer: 'hsl(220, 25%, 30%)',
      tertiary: 'hsl(180, 25%, 50%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(180, 20%, 88%)',
      onTertiaryContainer: 'hsl(180, 30%, 30%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(200, 30%, 45%)',
    },
    dark: {
      bg: 'hsl(210, 20%, 8%)',
      surface: 'hsl(210, 15%, 12%)',
      surface2: 'hsl(210, 12%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 95%)',
      muted: 'hsl(0, 0%, 60%)',
      primary: 'hsl(200, 25%, 58%)',
      onPrimary: 'hsl(0, 0%, 10%)',
      primaryContainer: 'hsl(200, 20%, 20%)',
      onPrimaryContainer: 'hsl(200, 28%, 75%)',
      secondary: 'hsl(220, 18%, 60%)',
      onSecondary: 'hsl(0, 0%, 10%)',
      secondaryContainer: 'hsl(220, 15%, 18%)',
      onSecondaryContainer: 'hsl(220, 22%, 70%)',
      tertiary: 'hsl(180, 20%, 60%)',
      onTertiary: 'hsl(0, 0%, 10%)',
      tertiaryContainer: 'hsl(180, 15%, 22%)',
      onTertiaryContainer: 'hsl(180, 25%, 75%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(200, 25%, 58%)',
    },
  },
  lime_silk: {
    light: {
      bg: 'hsl(56, 35%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(56, 28%, 96%)',
      outline: 'hsl(220, 10%, 50%)',
      text: 'hsl(220, 18%, 18%)',
      muted: 'hsl(220, 10%, 42%)',
      primary: 'hsl(78, 24%, 36%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(78, 30%, 90%)',
      onPrimaryContainer: 'hsl(78, 28%, 18%)',
      secondary: 'hsl(55, 22%, 38%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(55, 28%, 90%)',
      onSecondaryContainer: 'hsl(55, 28%, 18%)',
      tertiary: 'hsl(160, 16%, 34%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(160, 18%, 90%)',
      onTertiaryContainer: 'hsl(160, 22%, 18%)',
      success: 'hsl(145, 40%, 35%)',
      warning: 'hsl(35, 85%, 45%)',
      danger: 'hsl(0, 70%, 50%)',
      ring: 'hsl(78, 28%, 46%)',
    },
    dark: {
      bg: 'hsl(230, 18%, 10%)',
      surface: 'hsl(230, 16%, 14%)',
      surface2: 'hsl(230, 14%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 98%)',
      muted: 'hsl(220, 10%, 70%)',
      primary: 'hsl(78, 18%, 56%)', // 低饱和，避免荧光
      onPrimary: 'hsl(78, 25%, 12%)',
      primaryContainer: 'hsl(78, 16%, 22%)',
      onPrimaryContainer: 'hsl(78, 22%, 86%)',
      secondary: 'hsl(55, 18%, 60%)',
      onSecondary: 'hsl(55, 25%, 12%)',
      secondaryContainer: 'hsl(55, 14%, 22%)',
      onSecondaryContainer: 'hsl(55, 22%, 86%)',
      tertiary: 'hsl(160, 12%, 58%)',
      onTertiary: 'hsl(160, 22%, 12%)',
      tertiaryContainer: 'hsl(160, 12%, 22%)',
      onTertiaryContainer: 'hsl(160, 18%, 86%)',
      success: 'hsl(145, 35%, 55%)',
      warning: 'hsl(35, 85%, 55%)',
      danger: 'hsl(0, 70%, 58%)',
      ring: 'hsl(78, 20%, 60%)',
    },
  },
  butter_mint: {
    light: {
      bg: 'hsl(48, 40%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(48, 30%, 96%)',
      outline: 'hsl(220, 10%, 50%)',
      text: 'hsl(220, 18%, 18%)',
      muted: 'hsl(220, 10%, 42%)',
      primary: 'hsl(44, 30%, 42%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(44, 40%, 90%)',
      onPrimaryContainer: 'hsl(44, 35%, 18%)',
      secondary: 'hsl(150, 18%, 34%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(150, 18%, 90%)',
      onSecondaryContainer: 'hsl(150, 24%, 18%)',
      tertiary: 'hsl(210, 14%, 42%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(210, 16%, 92%)',
      onTertiaryContainer: 'hsl(210, 22%, 18%)',
      success: 'hsl(145, 40%, 35%)',
      warning: 'hsl(35, 85%, 45%)',
      danger: 'hsl(0, 70%, 50%)',
      ring: 'hsl(44, 35%, 50%)',
    },
    dark: {
      bg: 'hsl(230, 18%, 10%)',
      surface: 'hsl(230, 16%, 14%)',
      surface2: 'hsl(230, 14%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 98%)',
      muted: 'hsl(220, 10%, 70%)',
      primary: 'hsl(44, 22%, 62%)', // 低饱和，避免荧光
      onPrimary: 'hsl(44, 25%, 12%)',
      primaryContainer: 'hsl(44, 16%, 22%)',
      onPrimaryContainer: 'hsl(44, 22%, 86%)',
      secondary: 'hsl(150, 14%, 56%)',
      onSecondary: 'hsl(150, 22%, 12%)',
      secondaryContainer: 'hsl(150, 12%, 22%)',
      onSecondaryContainer: 'hsl(150, 18%, 86%)',
      tertiary: 'hsl(210, 12%, 64%)',
      onTertiary: 'hsl(210, 18%, 12%)',
      tertiaryContainer: 'hsl(210, 12%, 22%)',
      onTertiaryContainer: 'hsl(210, 18%, 86%)',
      success: 'hsl(145, 35%, 55%)',
      warning: 'hsl(35, 85%, 55%)',
      danger: 'hsl(0, 70%, 58%)',
      ring: 'hsl(44, 24%, 62%)',
    },
  },
  citrus_sage: {
    light: {
      bg: 'hsl(60, 35%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(60, 28%, 96%)',
      outline: 'hsl(220, 10%, 50%)',
      text: 'hsl(220, 18%, 18%)',
      muted: 'hsl(220, 10%, 42%)',
      primary: 'hsl(70, 22%, 36%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(70, 28%, 90%)',
      onPrimaryContainer: 'hsl(70, 26%, 18%)',
      secondary: 'hsl(32, 30%, 44%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(32, 38%, 90%)',
      onSecondaryContainer: 'hsl(32, 34%, 18%)',
      tertiary: 'hsl(200, 14%, 42%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(200, 16%, 92%)',
      onTertiaryContainer: 'hsl(200, 22%, 18%)',
      success: 'hsl(145, 40%, 35%)',
      warning: 'hsl(35, 85%, 45%)',
      danger: 'hsl(0, 70%, 50%)',
      ring: 'hsl(70, 26%, 46%)',
    },
    dark: {
      bg: 'hsl(230, 18%, 10%)',
      surface: 'hsl(230, 16%, 14%)',
      surface2: 'hsl(230, 14%, 16%)',
      outline: 'hsl(0, 0%, 30%)',
      text: 'hsl(0, 0%, 98%)',
      muted: 'hsl(220, 10%, 70%)',
      primary: 'hsl(70, 16%, 56%)', // 低饱和，避免荧光
      onPrimary: 'hsl(70, 22%, 12%)',
      primaryContainer: 'hsl(70, 14%, 22%)',
      onPrimaryContainer: 'hsl(70, 18%, 86%)',
      secondary: 'hsl(32, 22%, 62%)',
      onSecondary: 'hsl(32, 22%, 12%)',
      secondaryContainer: 'hsl(32, 16%, 22%)',
      onSecondaryContainer: 'hsl(32, 18%, 86%)',
      tertiary: 'hsl(200, 12%, 64%)',
      onTertiary: 'hsl(200, 18%, 12%)',
      tertiaryContainer: 'hsl(200, 12%, 22%)',
      onTertiaryContainer: 'hsl(200, 18%, 86%)',
      success: 'hsl(145, 35%, 55%)',
      warning: 'hsl(35, 85%, 55%)',
      danger: 'hsl(0, 70%, 58%)',
      ring: 'hsl(70, 18%, 60%)',
    },
  },
  sunlit_yellow: {
    light: {
      bg: 'hsl(50, 70%, 98%)',
      surface: 'hsla(0, 0%, 100%, 0.76)',
      surface2: 'hsla(50, 55%, 96%, 0.76)',
      outline: 'hsla(40, 18%, 35%, 0.18)',
      text: 'hsl(35, 25%, 12%)',
      muted: 'hsl(35, 12%, 36%)',
      primary: 'hsl(44, 85%, 45%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(44, 90%, 88%)',
      onPrimaryContainer: 'hsl(35, 40%, 14%)',
      secondary: 'hsl(120, 35%, 34%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(120, 35%, 90%)',
      onSecondaryContainer: 'hsl(120, 35%, 14%)',
      tertiary: 'hsl(200, 28%, 36%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(200, 28%, 92%)',
      onTertiaryContainer: 'hsl(200, 30%, 14%)',
      ring: 'hsla(44, 85%, 48%, 0.30)',
      success: 'hsl(145, 45%, 35%)',
      warning: 'hsl(35, 90%, 48%)',
      danger: 'hsl(0, 70%, 50%)',
    },
    dark: {
      bg: 'hsl(44, 10%, 10%)',
      surface: 'hsla(44, 8%, 14%, 0.68)',
      surface2: 'hsla(44, 8%, 16%, 0.68)',
      outline: 'hsla(44, 10%, 85%, 0.10)',
      text: 'hsl(44, 10%, 96%)',
      muted: 'hsl(44, 8%, 72%)',
      primary: 'hsl(44, 85%, 62%)',
      onPrimary: 'hsl(44, 25%, 12%)',
      primaryContainer: 'hsla(44, 18%, 22%, 0.85)',
      onPrimaryContainer: 'hsl(44, 40%, 88%)',
      secondary: 'hsl(120, 30%, 56%)',
      onSecondary: 'hsl(120, 22%, 12%)',
      secondaryContainer: 'hsla(120, 12%, 22%, 0.85)',
      onSecondaryContainer: 'hsl(120, 18%, 86%)',
      tertiary: 'hsl(200, 22%, 62%)',
      onTertiary: 'hsl(200, 18%, 12%)',
      tertiaryContainer: 'hsla(200, 10%, 22%, 0.85)',
      onTertiaryContainer: 'hsl(200, 16%, 86%)',
      ring: 'hsla(44, 85%, 65%, 0.24)',
      success: 'hsl(145, 40%, 55%)',
      warning: 'hsl(35, 90%, 58%)',
      danger: 'hsl(0, 70%, 58%)',
    },
  },
  lime_pop: {
    light: {
      bg: 'hsl(90, 60%, 98%)',
      surface: 'hsla(0, 0%, 100%, 0.76)',
      surface2: 'hsla(90, 50%, 96%, 0.76)',
      outline: 'hsla(90, 12%, 30%, 0.18)',
      text: 'hsl(120, 18%, 12%)',
      muted: 'hsl(120, 10%, 36%)',
      primary: 'hsl(95, 65%, 40%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(95, 70%, 88%)',
      onPrimaryContainer: 'hsl(120, 25%, 14%)',
      secondary: 'hsl(44, 75%, 42%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(44, 80%, 90%)',
      onSecondaryContainer: 'hsl(35, 35%, 14%)',
      tertiary: 'hsl(175, 40%, 34%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(175, 35%, 90%)',
      onTertiaryContainer: 'hsl(175, 30%, 14%)',
      ring: 'hsla(95, 65%, 42%, 0.30)',
      success: 'hsl(145, 45%, 35%)',
      warning: 'hsl(35, 90%, 48%)',
      danger: 'hsl(0, 70%, 50%)',
    },
    dark: {
      bg: 'hsl(120, 10%, 10%)',
      surface: 'hsla(120, 8%, 14%, 0.68)',
      surface2: 'hsla(120, 8%, 16%, 0.68)',
      outline: 'hsla(120, 10%, 85%, 0.10)',
      text: 'hsl(120, 10%, 96%)',
      muted: 'hsl(120, 8%, 72%)',
      primary: 'hsl(95, 65%, 60%)',
      onPrimary: 'hsl(120, 22%, 12%)',
      primaryContainer: 'hsla(95, 18%, 22%, 0.85)',
      onPrimaryContainer: 'hsl(95, 35%, 88%)',
      secondary: 'hsl(44, 75%, 60%)',
      onSecondary: 'hsl(44, 22%, 12%)',
      secondaryContainer: 'hsla(44, 16%, 22%, 0.85)',
      onSecondaryContainer: 'hsl(44, 30%, 88%)',
      tertiary: 'hsl(175, 28%, 58%)',
      onTertiary: 'hsl(175, 18%, 12%)',
      tertiaryContainer: 'hsla(175, 10%, 22%, 0.85)',
      onTertiaryContainer: 'hsl(175, 16%, 86%)',
      ring: 'hsla(95, 65%, 62%, 0.24)',
      success: 'hsl(145, 40%, 55%)',
      warning: 'hsl(35, 90%, 58%)',
      danger: 'hsl(0, 70%, 58%)',
    },
  },
  citrus_grove: {
    light: {
      bg: 'hsl(70, 65%, 98%)',
      surface: 'hsla(0, 0%, 100%, 0.76)',
      surface2: 'hsla(70, 55%, 96%, 0.76)',
      outline: 'hsla(70, 12%, 30%, 0.18)',
      text: 'hsl(90, 18%, 12%)',
      muted: 'hsl(90, 10%, 36%)',
      primary: 'hsl(70, 70%, 38%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(70, 75%, 88%)',
      onPrimaryContainer: 'hsl(90, 25%, 14%)',
      secondary: 'hsl(44, 80%, 44%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(44, 85%, 90%)',
      onSecondaryContainer: 'hsl(35, 35%, 14%)',
      tertiary: 'hsl(165, 35%, 34%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(165, 30%, 90%)',
      onTertiaryContainer: 'hsl(165, 28%, 14%)',
      ring: 'hsla(70, 70%, 40%, 0.30)',
      success: 'hsl(145, 45%, 35%)',
      warning: 'hsl(35, 90%, 48%)',
      danger: 'hsl(0, 70%, 50%)',
    },
    dark: {
      bg: 'hsl(70, 10%, 10%)',
      surface: 'hsla(70, 8%, 14%, 0.68)',
      surface2: 'hsla(70, 8%, 16%, 0.68)',
      outline: 'hsla(70, 10%, 85%, 0.10)',
      text: 'hsl(70, 10%, 96%)',
      muted: 'hsl(70, 8%, 72%)',
      primary: 'hsl(70, 70%, 60%)',
      onPrimary: 'hsl(70, 22%, 12%)',
      primaryContainer: 'hsla(70, 18%, 22%, 0.85)',
      onPrimaryContainer: 'hsl(70, 35%, 88%)',
      secondary: 'hsl(44, 80%, 60%)',
      onSecondary: 'hsl(44, 22%, 12%)',
      secondaryContainer: 'hsla(44, 16%, 22%, 0.85)',
      onSecondaryContainer: 'hsl(44, 30%, 88%)',
      tertiary: 'hsl(165, 26%, 58%)',
      onTertiary: 'hsl(165, 18%, 12%)',
      tertiaryContainer: 'hsla(165, 10%, 22%, 0.85)',
      onTertiaryContainer: 'hsl(165, 16%, 86%)',
      ring: 'hsla(70, 70%, 62%, 0.24)',
      success: 'hsl(145, 40%, 55%)',
      warning: 'hsl(35, 90%, 58%)',
      danger: 'hsl(0, 70%, 58%)',
    },
  },
  orchid_ink: {
    light: {
      bg: 'hsl(255, 30%, 98%)',
      surface: 'hsla(0, 0%, 100%, 0.76)',
      surface2: 'hsla(255, 22%, 96%, 0.76)',
      outline: 'hsla(255, 12%, 32%, 0.16)',
      text: 'hsl(250, 22%, 14%)',
      muted: 'hsl(250, 10%, 38%)',
      primary: 'hsl(275, 34%, 42%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(275, 30%, 92%)',
      onPrimaryContainer: 'hsl(275, 28%, 16%)',
      secondary: 'hsl(190, 28%, 34%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(190, 22%, 90%)',
      onSecondaryContainer: 'hsl(190, 26%, 16%)',
      tertiary: 'hsl(30, 32%, 44%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(30, 30%, 90%)',
      onTertiaryContainer: 'hsl(30, 30%, 16%)',
      ring: 'hsla(275, 34%, 46%, 0.28)',
      success: 'hsl(145, 40%, 35%)',
      warning: 'hsl(35, 90%, 48%)',
      danger: 'hsl(0, 70%, 50%)',
    },
    dark: {
      bg: 'hsl(255, 10%, 10%)',
      surface: 'hsla(255, 8%, 14%, 0.68)',
      surface2: 'hsla(255, 8%, 16%, 0.68)',
      outline: 'hsla(255, 10%, 88%, 0.10)',
      text: 'hsl(255, 10%, 96%)',
      muted: 'hsl(255, 8%, 72%)',
      primary: 'hsl(275, 30%, 62%)',
      onPrimary: 'hsl(275, 22%, 12%)',
      primaryContainer: 'hsla(275, 12%, 22%, 0.85)',
      onPrimaryContainer: 'hsl(275, 24%, 88%)',
      secondary: 'hsl(190, 22%, 58%)',
      onSecondary: 'hsl(190, 18%, 12%)',
      secondaryContainer: 'hsla(190, 10%, 22%, 0.85)',
      onSecondaryContainer: 'hsl(190, 18%, 86%)',
      tertiary: 'hsl(30, 26%, 60%)',
      onTertiary: 'hsl(30, 18%, 12%)',
      tertiaryContainer: 'hsla(30, 10%, 22%, 0.85)',
      onTertiaryContainer: 'hsl(30, 18%, 86%)',
      ring: 'hsla(275, 30%, 64%, 0.22)',
      success: 'hsl(145, 35%, 55%)',
      warning: 'hsl(35, 90%, 58%)',
      danger: 'hsl(0, 70%, 58%)',
    },
  },
  copper_tide: {
    light: {
      bg: 'hsl(35, 35%, 98%)',
      surface: 'hsla(0, 0%, 100%, 0.76)',
      surface2: 'hsla(35, 25%, 96%, 0.76)',
      outline: 'hsla(25, 12%, 32%, 0.16)',
      text: 'hsl(25, 22%, 14%)',
      muted: 'hsl(25, 10%, 38%)',
      primary: 'hsl(25, 38%, 42%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(25, 34%, 92%)',
      onPrimaryContainer: 'hsl(25, 30%, 16%)',
      secondary: 'hsl(195, 28%, 34%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(195, 22%, 90%)',
      onSecondaryContainer: 'hsl(195, 26%, 16%)',
      tertiary: 'hsl(85, 22%, 36%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(85, 18%, 90%)',
      onTertiaryContainer: 'hsl(85, 22%, 16%)',
      ring: 'hsla(25, 38%, 46%, 0.26)',
      success: 'hsl(145, 40%, 35%)',
      warning: 'hsl(35, 90%, 48%)',
      danger: 'hsl(0, 70%, 50%)',
    },
    dark: {
      bg: 'hsl(25, 10%, 10%)',
      surface: 'hsla(25, 8%, 14%, 0.68)',
      surface2: 'hsla(25, 8%, 16%, 0.68)',
      outline: 'hsla(25, 10%, 88%, 0.10)',
      text: 'hsl(25, 10%, 96%)',
      muted: 'hsl(25, 8%, 72%)',
      primary: 'hsl(25, 32%, 62%)',
      onPrimary: 'hsl(25, 22%, 12%)',
      primaryContainer: 'hsla(25, 12%, 22%, 0.85)',
      onPrimaryContainer: 'hsl(25, 24%, 88%)',
      secondary: 'hsl(195, 22%, 58%)',
      onSecondary: 'hsl(195, 18%, 12%)',
      secondaryContainer: 'hsla(195, 10%, 22%, 0.85)',
      onSecondaryContainer: 'hsl(195, 18%, 86%)',
      tertiary: 'hsl(85, 16%, 56%)',
      onTertiary: 'hsl(85, 18%, 12%)',
      tertiaryContainer: 'hsla(85, 8%, 22%, 0.85)',
      onTertiaryContainer: 'hsl(85, 16%, 86%)',
      ring: 'hsla(25, 32%, 64%, 0.22)',
      success: 'hsl(145, 35%, 55%)',
      warning: 'hsl(35, 90%, 58%)',
      danger: 'hsl(0, 70%, 58%)',
    },
  },
  neon_paper: {
    light: {
      bg: 'hsl(220, 30%, 99%)',
      surface: 'hsla(0, 0%, 100%, 0.78)',
      surface2: 'hsla(220, 22%, 96%, 0.78)',
      outline: 'hsla(220, 12%, 32%, 0.16)',
      text: 'hsl(220, 22%, 14%)',
      muted: 'hsl(220, 10%, 38%)',
      primary: 'hsl(215, 40%, 42%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(215, 34%, 92%)',
      onPrimaryContainer: 'hsl(215, 28%, 16%)',
      secondary: 'hsl(280, 32%, 44%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(280, 26%, 92%)',
      onSecondaryContainer: 'hsl(280, 26%, 16%)',
      tertiary: 'hsl(40, 38%, 44%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(40, 32%, 92%)',
      onTertiaryContainer: 'hsl(40, 30%, 16%)',
      ring: 'hsla(215, 40%, 46%, 0.26)',
      success: 'hsl(145, 40%, 35%)',
      warning: 'hsl(35, 90%, 48%)',
      danger: 'hsl(0, 70%, 50%)',
    },
    dark: {
      bg: 'hsl(220, 10%, 10%)',
      surface: 'hsla(220, 8%, 14%, 0.68)',
      surface2: 'hsla(220, 8%, 16%, 0.68)',
      outline: 'hsla(220, 10%, 88%, 0.10)',
      text: 'hsl(220, 10%, 96%)',
      muted: 'hsl(220, 8%, 72%)',
      primary: 'hsl(215, 34%, 62%)',
      onPrimary: 'hsl(215, 22%, 12%)',
      primaryContainer: 'hsla(215, 12%, 22%, 0.85)',
      onPrimaryContainer: 'hsl(215, 22%, 88%)',
      secondary: 'hsl(280, 26%, 62%)',
      onSecondary: 'hsl(280, 18%, 12%)',
      secondaryContainer: 'hsla(280, 10%, 22%, 0.85)',
      onSecondaryContainer: 'hsl(280, 18%, 86%)',
      tertiary: 'hsl(40, 30%, 60%)',
      onTertiary: 'hsl(40, 18%, 12%)',
      tertiaryContainer: 'hsla(40, 10%, 22%, 0.85)',
      onTertiaryContainer: 'hsl(40, 18%, 86%)',
      ring: 'hsla(215, 34%, 64%, 0.22)',
      success: 'hsl(145, 35%, 55%)',
      warning: 'hsl(35, 90%, 58%)',
      danger: 'hsl(0, 70%, 58%)',
    },
  },
  forest_lemon: {
    light: {
      bg: 'hsl(80, 35%, 98%)',
      surface: 'hsla(0, 0%, 100%, 0.76)',
      surface2: 'hsla(80, 24%, 96%, 0.76)',
      outline: 'hsla(80, 12%, 32%, 0.16)',
      text: 'hsl(120, 18%, 12%)',
      muted: 'hsl(120, 10%, 36%)',
      primary: 'hsl(120, 30%, 34%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(120, 22%, 90%)',
      onPrimaryContainer: 'hsl(120, 24%, 14%)',
      secondary: 'hsl(60, 55%, 44%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(60, 45%, 90%)',
      onSecondaryContainer: 'hsl(60, 30%, 16%)',
      tertiary: 'hsl(200, 20%, 36%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(200, 16%, 92%)',
      onTertiaryContainer: 'hsl(200, 18%, 16%)',
      ring: 'hsla(60, 55%, 48%, 0.22)',
      success: 'hsl(145, 40%, 35%)',
      warning: 'hsl(35, 90%, 48%)',
      danger: 'hsl(0, 70%, 50%)',
    },
    dark: {
      bg: 'hsl(120, 10%, 10%)',
      surface: 'hsla(120, 8%, 14%, 0.68)',
      surface2: 'hsla(120, 8%, 16%, 0.68)',
      outline: 'hsla(120, 10%, 88%, 0.10)',
      text: 'hsl(120, 10%, 96%)',
      muted: 'hsl(120, 8%, 72%)',
      primary: 'hsl(120, 22%, 56%)',
      onPrimary: 'hsl(120, 18%, 12%)',
      primaryContainer: 'hsla(120, 10%, 22%, 0.85)',
      onPrimaryContainer: 'hsl(120, 16%, 86%)',
      secondary: 'hsl(60, 46%, 60%)',
      onSecondary: 'hsl(60, 18%, 12%)',
      secondaryContainer: 'hsla(60, 10%, 22%, 0.85)',
      onSecondaryContainer: 'hsl(60, 18%, 86%)',
      tertiary: 'hsl(200, 16%, 58%)',
      onTertiary: 'hsl(200, 18%, 12%)',
      tertiaryContainer: 'hsla(200, 8%, 22%, 0.85)',
      onTertiaryContainer: 'hsl(200, 16%, 86%)',
      ring: 'hsla(60, 46%, 62%, 0.18)',
      success: 'hsl(145, 35%, 55%)',
      warning: 'hsl(35, 90%, 58%)',
      danger: 'hsl(0, 70%, 58%)',
    },
  },
  clay_cyan: {
    light: {
      bg: 'hsl(25, 35%, 98%)',
      surface: 'hsla(0, 0%, 100%, 0.76)',
      surface2: 'hsla(25, 24%, 96%, 0.76)',
      outline: 'hsla(25, 12%, 32%, 0.16)',
      text: 'hsl(25, 22%, 14%)',
      muted: 'hsl(25, 10%, 38%)',
      primary: 'hsl(20, 28%, 40%)',
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(20, 24%, 92%)',
      onPrimaryContainer: 'hsl(20, 26%, 16%)',
      secondary: 'hsl(185, 28%, 34%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(185, 22%, 90%)',
      onSecondaryContainer: 'hsl(185, 26%, 16%)',
      tertiary: 'hsl(55, 32%, 42%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(55, 26%, 92%)',
      onTertiaryContainer: 'hsl(55, 26%, 16%)',
      ring: 'hsla(185, 28%, 40%, 0.22)',
      success: 'hsl(145, 40%, 35%)',
      warning: 'hsl(35, 90%, 48%)',
      danger: 'hsl(0, 70%, 50%)',
    },
    dark: {
      bg: 'hsl(20, 10%, 10%)',
      surface: 'hsla(20, 8%, 14%, 0.68)',
      surface2: 'hsla(20, 8%, 16%, 0.68)',
      outline: 'hsla(20, 10%, 88%, 0.10)',
      text: 'hsl(20, 10%, 96%)',
      muted: 'hsl(20, 8%, 72%)',
      primary: 'hsl(20, 22%, 58%)',
      onPrimary: 'hsl(20, 18%, 12%)',
      primaryContainer: 'hsla(20, 10%, 22%, 0.85)',
      onPrimaryContainer: 'hsl(20, 16%, 86%)',
      secondary: 'hsl(185, 22%, 58%)',
      onSecondary: 'hsl(185, 18%, 12%)',
      secondaryContainer: 'hsla(185, 10%, 22%, 0.85)',
      onSecondaryContainer: 'hsl(185, 18%, 86%)',
      tertiary: 'hsl(55, 26%, 60%)',
      onTertiary: 'hsl(55, 18%, 12%)',
      tertiaryContainer: 'hsla(55, 10%, 22%, 0.85)',
      onTertiaryContainer: 'hsl(55, 18%, 86%)',
      ring: 'hsla(185, 22%, 62%, 0.20)',
      success: 'hsl(145, 35%, 55%)',
      warning: 'hsl(35, 90%, 58%)',
      danger: 'hsl(0, 70%, 58%)',
    },
  },
  obsidian_gold: {
    light: {
      bg: 'hsl(35, 15%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(35, 12%, 96%)',
      outline: 'hsl(35, 8%, 85%)',
      text: 'hsl(35, 20%, 10%)',
      muted: 'hsl(35, 10%, 45%)',
      primary: 'hsl(38, 75%, 48%)', // 高饱和橙黄
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(38, 70%, 92%)',
      onPrimaryContainer: 'hsl(38, 80%, 20%)',
      secondary: 'hsl(45, 65%, 52%)', // 金黄
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(45, 60%, 90%)',
      onSecondaryContainer: 'hsl(45, 70%, 22%)',
      tertiary: 'hsl(30, 60%, 50%)', // 深橙
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(30, 55%, 88%)',
      onTertiaryContainer: 'hsl(30, 65%, 24%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(38, 75%, 48%)',
    },
    dark: {
      bg: 'hsl(25, 8%, 8%)', // 极低饱和暖暗色相 near-black
      surface: 'hsl(25, 6%, 12%)',
      surface2: 'hsl(25, 6%, 16%)',
      outline: 'hsl(25, 8%, 30%)',
      text: 'hsl(25, 10%, 95%)',
      muted: 'hsl(25, 8%, 60%)',
      primary: 'hsl(38, 65%, 58%)', // 高饱和橙黄
      onPrimary: 'hsl(25, 8%, 8%)',
      primaryContainer: 'hsl(38, 20%, 22%)',
      onPrimaryContainer: 'hsl(38, 60%, 80%)',
      secondary: 'hsl(45, 55%, 60%)',
      onSecondary: 'hsl(25, 8%, 8%)',
      secondaryContainer: 'hsl(45, 18%, 24%)',
      onSecondaryContainer: 'hsl(45, 55%, 82%)',
      tertiary: 'hsl(30, 50%, 58%)',
      onTertiary: 'hsl(25, 8%, 8%)',
      tertiaryContainer: 'hsl(30, 18%, 24%)',
      onTertiaryContainer: 'hsl(30, 50%, 80%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(38, 65%, 58%)',
    },
  },
  parchment_pale: {
    light: {
      bg: 'hsl(45, 12%, 98%)', // 极低饱和淡黄
      surface: 'hsl(45, 10%, 100%)',
      surface2: 'hsl(45, 8%, 96%)',
      outline: 'hsl(45, 6%, 85%)',
      text: 'hsl(45, 15%, 12%)',
      muted: 'hsl(45, 8%, 45%)',
      primary: 'hsl(42, 18%, 42%)', // 极低饱和古典黄
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(42, 15%, 92%)',
      onPrimaryContainer: 'hsl(42, 20%, 18%)',
      secondary: 'hsl(50, 15%, 45%)',
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(50, 12%, 90%)',
      onSecondaryContainer: 'hsl(50, 18%, 20%)',
      tertiary: 'hsl(38, 16%, 48%)',
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(38, 14%, 88%)',
      onTertiaryContainer: 'hsl(38, 18%, 22%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(42, 18%, 42%)',
    },
    dark: {
      bg: 'hsl(40, 8%, 8%)', // 极低饱和暖暗色相
      surface: 'hsl(40, 6%, 12%)',
      surface2: 'hsl(40, 6%, 16%)',
      outline: 'hsl(40, 8%, 30%)',
      text: 'hsl(40, 10%, 95%)',
      muted: 'hsl(40, 8%, 60%)',
      primary: 'hsl(42, 20%, 58%)',
      onPrimary: 'hsl(40, 8%, 8%)',
      primaryContainer: 'hsl(42, 12%, 22%)',
      onPrimaryContainer: 'hsl(42, 18%, 85%)',
      secondary: 'hsl(50, 18%, 60%)',
      onSecondary: 'hsl(40, 8%, 8%)',
      secondaryContainer: 'hsl(50, 12%, 24%)',
      onSecondaryContainer: 'hsl(50, 18%, 82%)',
      tertiary: 'hsl(38, 18%, 62%)',
      onTertiary: 'hsl(40, 8%, 8%)',
      tertiaryContainer: 'hsl(38, 12%, 24%)',
      onTertiaryContainer: 'hsl(38, 18%, 83%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(42, 20%, 58%)',
    },
  },
  classical_greystone: {
    light: {
      bg: 'hsl(220, 8%, 98%)', // 低饱和冷灰
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(220, 6%, 96%)',
      outline: 'hsl(220, 5%, 85%)',
      text: 'hsl(220, 12%, 10%)',
      muted: 'hsl(220, 6%, 45%)',
      primary: 'hsl(210, 12%, 40%)', // 冷灰蓝
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(210, 10%, 92%)',
      onPrimaryContainer: 'hsl(210, 15%, 18%)',
      secondary: 'hsl(200, 10%, 42%)', // 中性灰蓝
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(200, 8%, 90%)',
      onSecondaryContainer: 'hsl(200, 12%, 20%)',
      tertiary: 'hsl(30, 10%, 44%)', // 暖灰（冷暖层次）
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(30, 8%, 88%)',
      onTertiaryContainer: 'hsl(30, 12%, 22%)',
      success: 'hsl(142, 50%, 45%)',
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(210, 12%, 40%)',
    },
    dark: {
      bg: 'hsl(220, 6%, 8%)', // 极低饱和冷暗色相
      surface: 'hsl(220, 5%, 12%)',
      surface2: 'hsl(220, 5%, 16%)',
      outline: 'hsl(220, 6%, 30%)',
      text: 'hsl(220, 8%, 95%)',
      muted: 'hsl(220, 6%, 60%)',
      primary: 'hsl(210, 15%, 58%)',
      onPrimary: 'hsl(220, 6%, 8%)',
      primaryContainer: 'hsl(210, 10%, 22%)',
      onPrimaryContainer: 'hsl(210, 15%, 85%)',
      secondary: 'hsl(200, 12%, 60%)',
      onSecondary: 'hsl(220, 6%, 8%)',
      secondaryContainer: 'hsl(200, 8%, 24%)',
      onSecondaryContainer: 'hsl(200, 12%, 82%)',
      tertiary: 'hsl(30, 12%, 62%)', // 暖灰（冷暖层次）
      onTertiary: 'hsl(220, 6%, 8%)',
      tertiaryContainer: 'hsl(30, 8%, 24%)',
      onTertiaryContainer: 'hsl(30, 12%, 83%)',
      success: 'hsl(142, 45%, 55%)',
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(210, 15%, 58%)',
    },
  },
  four_seasons: {
    light: {
      bg: 'hsl(0, 0%, 98%)',
      surface: 'hsl(0, 0%, 100%)',
      surface2: 'hsl(0, 0%, 96%)',
      outline: 'hsl(0, 0%, 85%)',
      text: 'hsl(0, 0%, 10%)',
      muted: 'hsl(0, 0%, 45%)',
      primary: 'hsl(142, 50%, 40%)', // 春绿
      onPrimary: 'hsl(0, 0%, 100%)',
      primaryContainer: 'hsl(142, 45%, 92%)',
      onPrimaryContainer: 'hsl(142, 55%, 18%)',
      secondary: 'hsl(200, 60%, 45%)', // 夏蓝
      onSecondary: 'hsl(0, 0%, 100%)',
      secondaryContainer: 'hsl(200, 55%, 90%)',
      onSecondaryContainer: 'hsl(200, 65%, 20%)',
      tertiary: 'hsl(30, 70%, 48%)', // 秋橙
      onTertiary: 'hsl(0, 0%, 100%)',
      tertiaryContainer: 'hsl(30, 65%, 88%)',
      onTertiaryContainer: 'hsl(30, 75%, 22%)',
      success: 'hsl(260, 40%, 50%)', // 冬紫（作为第四季节）
      warning: 'hsl(38, 70%, 55%)',
      danger: 'hsl(0, 65%, 50%)',
      ring: 'hsl(142, 50%, 40%)',
    },
    dark: {
      bg: 'hsl(220, 8%, 8%)', // 极低饱和暗色相
      surface: 'hsl(220, 6%, 12%)',
      surface2: 'hsl(220, 6%, 16%)',
      outline: 'hsl(220, 8%, 30%)',
      text: 'hsl(220, 10%, 95%)',
      muted: 'hsl(220, 8%, 60%)',
      primary: 'hsl(142, 45%, 55%)', // 春绿
      onPrimary: 'hsl(220, 8%, 8%)',
      primaryContainer: 'hsl(142, 20%, 22%)',
      onPrimaryContainer: 'hsl(142, 45%, 85%)',
      secondary: 'hsl(200, 55%, 58%)', // 夏蓝
      onSecondary: 'hsl(220, 8%, 8%)',
      secondaryContainer: 'hsl(200, 18%, 24%)',
      onSecondaryContainer: 'hsl(200, 55%, 82%)',
      tertiary: 'hsl(30, 65%, 60%)', // 秋橙
      onTertiary: 'hsl(220, 8%, 8%)',
      tertiaryContainer: 'hsl(30, 18%, 24%)',
      onTertiaryContainer: 'hsl(30, 65%, 83%)',
      success: 'hsl(260, 35%, 58%)', // 冬紫（作为第四季节）
      warning: 'hsl(38, 65%, 60%)',
      danger: 'hsl(0, 60%, 55%)',
      ring: 'hsl(142, 45%, 55%)',
    },
  },
};

// 应用主题到CSS变量
export function applyTheme(palette: ThemePalette, isDark: boolean) {
  const theme = themes[palette][isDark ? 'dark' : 'light'];
  const root = document.documentElement;
  
  // 设置所有CSS变量
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--surface2', theme.surface2);
  root.style.setProperty('--outline', theme.outline);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--muted', theme.muted);
  
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--on-primary', theme.onPrimary);
  root.style.setProperty('--primary-container', theme.primaryContainer);
  root.style.setProperty('--on-primary-container', theme.onPrimaryContainer);
  
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--on-secondary', theme.onSecondary);
  root.style.setProperty('--secondary-container', theme.secondaryContainer);
  root.style.setProperty('--on-secondary-container', theme.onSecondaryContainer);
  
  root.style.setProperty('--tertiary', theme.tertiary);
  root.style.setProperty('--on-tertiary', theme.onTertiary);
  root.style.setProperty('--tertiary-container', theme.tertiaryContainer);
  root.style.setProperty('--on-tertiary-container', theme.onTertiaryContainer);
  
  root.style.setProperty('--success', theme.success);
  root.style.setProperty('--warning', theme.warning);
  root.style.setProperty('--danger', theme.danger);
  
  root.style.setProperty('--ring', theme.ring);
  
  // 为了兼容旧的 spotlight 效果，设置 RGB 值
  const primaryRgb = hslToRgb(theme.primary);
  root.style.setProperty('--theme-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  
  // 设置 surface 的 RGB 值（用于 backdrop）
  const surfaceRgb = hslToRgb(theme.surface);
  root.style.setProperty('--surface-rgb', `${surfaceRgb.r}, ${surfaceRgb.g}, ${surfaceRgb.b}`);
  
  // 设置 warning、danger 和 success 的 RGB 值（用于半透明背景）
  const warningRgb = hslToRgb(theme.warning);
  root.style.setProperty('--warning-rgb', `${warningRgb.r}, ${warningRgb.g}, ${warningRgb.b}`);
  
  const dangerRgb = hslToRgb(theme.danger);
  root.style.setProperty('--danger-rgb', `${dangerRgb.r}, ${dangerRgb.g}, ${dangerRgb.b}`);
  
  const successRgb = hslToRgb(theme.success);
  root.style.setProperty('--success-rgb', `${successRgb.r}, ${successRgb.g}, ${successRgb.b}`);
}

// HSL 转 RGB 辅助函数（支持 HSL 和 HSLA）
function hslToRgb(hsl: string): { r: number; g: number; b: number } {
  // 匹配 hsl() 或 hsla() 格式，忽略透明度
  const match = hsl.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/);
  if (!match) return { r: 59, g: 130, b: 246 }; // 默认蓝色
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// 获取主题显示名称
export function getThemeDisplayName(palette: ThemePalette): string {
  const names: Record<ThemePalette, string> = {
    teal_elegant: 'Teal 典雅',
    indigo_calm: 'Indigo 宁静',
    sage_mist: 'Sage 薄雾',
    amber_linen: 'Amber 亚麻',
    rose_dust: 'Rose 尘埃',
    sky_slate: 'Sky 石板',
    lime_silk: 'Lime 丝绸',
    butter_mint: 'Butter 薄荷',
    citrus_sage: 'Citrus 鼠尾草',
    sunlit_yellow: 'Sunlit 阳光',
    lime_pop: 'Lime 活力',
    citrus_grove: 'Citrus 果园',
    orchid_ink: 'Orchid 墨兰',
    copper_tide: 'Copper 潮汐',
    neon_paper: 'Neon 纸白',
    forest_lemon: 'Forest 柠檬',
    clay_cyan: 'Clay 青蓝',
    obsidian_gold: 'Obsidian 黑曜金',
    parchment_pale: 'Parchment 羊皮纸',
    classical_greystone: 'Greystone 古典灰',
    four_seasons: 'Four 四季',
  };
  return names[palette];
}

// 获取主题预览颜色（用于色卡显示）
export function getThemePreviewColors(palette: ThemePalette): { primary: string; secondary: string; tertiary: string; surface: string; success?: string } {
  const theme = themes[palette].light;
  const result: { primary: string; secondary: string; tertiary: string; surface: string; success?: string } = {
    primary: theme.primary,
    secondary: theme.secondary,
    tertiary: theme.tertiary,
    surface: theme.surface,
  };
  // four_seasons 需要显示4个色块（primary/secondary/tertiary/success）
  if (palette === 'four_seasons') {
    result.success = theme.success;
  }
  return result;
}

