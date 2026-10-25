export const COLORS = {
  // Primary - Green (matching Figma)
  primary: "#10b981",
  primaryHover: "#059669",
  primaryDark: "#047857",
  primaryLight: "#d1fae5",

  // Neutral/Warm scale (Figma: #faf9f5, #f5f4ef, #1f1e1d, #6b6a68)
  neutral: {
    50: "#faf9f5",
    100: "#f5f4ef",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1f1e1d",
  },

  // Semantic
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // Status colors
  status: {
    registered: "#10b981",
    in_transit: "#3b82f6",
    received: "#10b981",
    flagged: "#f59e0b",
    retired: "#6b7280",
  },

  // Backgrounds
  bg: {
    primary: "#faf9f5",
    secondary: "#f5f4ef",
    card: "#ffffff",
    input: "#ffffff",
  },

  // Text
  text: {
    primary: "#1f1e1d",
    secondary: "#6b6a68",
    muted: "#a8a29e",
    inverse: "#ffffff",
  },

  // Borders
  border: {
    light: "#e7e5e4",
    default: "#d6d3d1",
    focus: "#10b981",
    error: "#ef4444",
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const SPACING = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const BORDER_RADIUS = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
} as const;

export const SHADOWS = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  card: "0 1px 3px rgba(0, 0, 0, 0.12)",
} as const;

export const TRANSITIONS = {
  fast: "150ms ease",
  normal: "200ms ease",
  slow: "300ms ease",
} as const;

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

export type ColorScale = keyof typeof COLORS.neutral;
export type ColorKey = keyof typeof COLORS;