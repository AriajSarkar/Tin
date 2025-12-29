/**
 * Platform detection utilities for Tin app
 * Used for conditional UI rendering between Android and Windows
 */

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return /android/i.test(navigator.userAgent);
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
    if (typeof window === 'undefined') return false;
    return /windows/i.test(navigator.userAgent);
}

/**
 * Check if touch device (mobile/tablet)
 */
export function isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get current platform
 */
export function getPlatform(): 'android' | 'windows' | 'other' {
    if (isAndroid()) return 'android';
    if (isWindows()) return 'windows';
    return 'other';
}
