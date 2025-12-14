/**
 * Tin Design Tokens
 * A calm, notebook-like aesthetic for a personal expense tracker.
 * Dark mode first. Quiet, honest, slightly imperfect.
 */

// Muted, desaturated palette for calm UI
export const colors = {
    // Background layers (darkest to lightest)
    bg: {
        base: "#0f1117",        // Main background - deep, quiet dark
        raised: "#161922",      // Cards - slightly lifted
        surface: "#1c1f2a",     // Interactive surfaces
        hover: "#252836",       // Hover state
    },
    // Text hierarchy (most important to least)
    text: {
        primary: "#e8e9eb",     // Off-white, not pure white
        secondary: "#9ca3af",   // Muted gray for supporting text
        tertiary: "#6b7280",    // Very muted for timestamps etc
        placeholder: "#4b5563", // Input placeholders
    },
    // Accent - used very sparingly
    accent: {
        primary: "#a78bfa",     // Soft purple for margin markers
        muted: "#7c3aed20",     // Very transparent purple for subtle highlights
        rose: "#f472b6",        // Pink accent for contrast
        roseMuted: "#f472b620",
    },
    // Semantic colors
    status: {
        positive: "#34d399",    // Soft green
        negative: "#f87171",    // Soft red  
        warning: "#fbbf24",     // Amber
    },
    // Borders and dividers
    border: {
        subtle: "#1f2937",      // Almost invisible separator
        default: "#374151",     // Visible border
        focus: "#6366f1",       // Focus state
    }
} as const;

// More generous spacing for breathing room
export const spacing = {
    0: "0",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
} as const;

// Typography - readable, not flashy
export const fontSize = {
    xs: "0.75rem",      // 12px - timestamps, meta
    sm: "0.8125rem",    // 13px - secondary text
    base: "0.875rem",   // 14px - body text (smaller for calm feel)
    md: "0.9375rem",    // 15px - emphasized body
    lg: "1rem",         // 16px - section headers
    xl: "1.125rem",     // 18px - titles
    "2xl": "1.375rem",  // 22px - card amounts
    "3xl": "1.75rem",   // 28px - large amounts
    "4xl": "2.25rem",   // 36px - hero values
} as const;

// Lighter weights for notebook feel
export const fontWeight = {
    normal: "400",
    medium: "450",
    semibold: "500",
    bold: "600",
} as const;

// Softer, organic corners
export const borderRadius = {
    none: "0",
    sm: "0.25rem",
    default: "0.375rem",
    md: "0.5rem",
    lg: "0.625rem",
    xl: "0.75rem",
    "2xl": "0.875rem",
    full: "9999px",
} as const;

// No flashy shadows - just subtle depth through contrast
export const shadows = {
    none: "none",
    subtle: "0 1px 2px rgba(0, 0, 0, 0.1)",
    soft: "0 2px 8px rgba(0, 0, 0, 0.15)",
} as const;

// Gentle, relaxed transitions
export const transitions = {
    subtle: "120ms ease-out",
    default: "180ms ease-out",
    slow: "280ms ease-out",
    spring: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// Animation variants for motion
export const motionVariants = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideUp: {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
    },
    // Subtle hover - not bouncy
    cardHover: {
        rest: { scale: 1 },
        hover: { scale: 1.01 },
        tap: { scale: 0.99 },
    },
} as const;
