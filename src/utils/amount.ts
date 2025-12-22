/**
 * Amount formatting and parsing utilities for Tin app
 * Centralized calculation functions for currency handling
 */

import Decimal from "decimal.js";

/**
 * Safe Decimal wrapper - handles null/undefined/invalid values
 * Strips commas (thousand separators) before parsing
 */
export function safeDecimal(value: string | null | undefined): Decimal {
    try {
        // Strip commas (thousand separators) before parsing
        const clean = (value || "0").replace(/,/g, "");
        return new Decimal(clean);
    } catch {
        return new Decimal(0);
    }
}

/**
 * Format amount to 2 decimal places
 */
export function formatAmount(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
}

/**
 * Format number with thousand separators (bank format)
 * Example: 13398.88 -> "13,398.88"
 */
export function formatWithCommas(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Parse shorthand input (k, m, b)
 * Examples: "100k" -> 100000, "1.5m" -> 1500000
 */
export function parseShorthand(value: string): {
    num: number;
    isValid: boolean;
    overLimit: boolean
} {
    const clean = value.replace(/,/g, "").trim().toLowerCase();
    if (clean === "" || clean === "-") return { num: 0, isValid: true, overLimit: false };

    const match = clean.match(/^(-?\d*\.?\d+)(k|m|b)?$/);
    if (!match) return { num: 0, isValid: false, overLimit: false };

    let num = parseFloat(match[1]);
    const suffix = match[2];

    if (suffix === "k") num *= 1000;
    else if (suffix === "m") num *= 1000000;
    else if (suffix === "b") num *= 1000000000;

    const overLimit = num > 1000000000;
    return { num, isValid: true, overLimit };
}

/**
 * Format as Gen Z friendly display (12.3k, 1.5m, etc.)
 */
export function formatGenZ(value: number): string {
    const absVal = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (absVal >= 1000000000) return `${sign}${(value / 1000000000).toFixed(1)}b`;
    if (absVal >= 1000000) return `${sign}${(value / 1000000).toFixed(1)}m`;
    if (absVal >= 1000) return `${sign}${(value / 1000).toFixed(1)}k`;
    return value.toFixed(2);
}

/**
 * Validate numeric input - allows digits, decimal, minus, k/m/b suffix
 * For Windows: accepts period as decimal separator
 */
export function isValidAmountInput(value: string): boolean {
    if (value === "" || value === "-") return true;
    const clean = value.replace(/,/g, "").toLowerCase();
    return /^-?\d*\.?\d*[kmb]?$/.test(clean);
}

/**
 * Validate numeric input for Android
 * Accepts comma as decimal separator and normalizes to period
 */
export function normalizeAmountInput(value: string): string {
    // Replace comma with period for consistency
    return value.replace(/,/g, ".");
}

/**
 * Calculate total from an array of amount strings
 */
export function sumAmounts(amounts: (string | null | undefined)[]): Decimal {
    return amounts.reduce((sum, amt) => {
        return sum.plus(safeDecimal(amt));
    }, new Decimal(0));
}
