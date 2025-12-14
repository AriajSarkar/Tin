"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import cc from "currency-codes";

// Get all currencies from currency-codes library (ISO 4217)
export interface CurrencyInfo {
    code: string;
    name: string;
    countries: string[];
    digits: number;
}

// Get all currencies dynamically from the library
export function getAllCurrencies(): CurrencyInfo[] {
    const allCurrencies = cc.codes();
    return allCurrencies
        .map((code) => {
            const info = cc.code(code);
            if (!info) return null;
            return {
                code: info.code,
                name: info.currency,
                countries: info.countries,
                digits: info.digits,
            };
        })
        .filter((c): c is CurrencyInfo => c !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Get currency symbol from Intl API (dynamic, no hardcoding)
export function getCurrencySymbol(currencyCode: string, locale?: string): string {
    const effectiveLocale = locale || (typeof navigator !== "undefined" ? navigator.language : "en-US");
    try {
        return new Intl.NumberFormat(effectiveLocale, {
            style: "currency",
            currency: currencyCode,
            currencyDisplay: "narrowSymbol",
        })
            .formatToParts(0)
            .find((part) => part.type === "currency")?.value || currencyCode;
    } catch {
        return currencyCode;
    }
}

// Format amount with proper currency formatting (dynamic via Intl)
export function formatCurrency(amount: number | string, currencyCode: string, locale?: string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return formatCurrency(0, currencyCode, locale);

    const effectiveLocale = locale || (typeof navigator !== "undefined" ? navigator.language : "en-US");
    try {
        return new Intl.NumberFormat(effectiveLocale, {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    } catch {
        return `${currencyCode} ${num.toFixed(2)}`;
    }
}

// Detect user's likely currency from browser locale (dynamic)
function detectSystemCurrency(): string {
    if (typeof navigator === "undefined") return "USD";

    const locale = navigator.language || "en-US";
    const region = locale.split("-")[1]?.toUpperCase();

    if (!region) return "USD";

    // Use currency-codes library to find currency by country
    const currencies = cc.country(region);
    if (currencies && currencies.length > 0) {
        return currencies[0].code;
    }

    // Fallback: try full locale region name lookup
    const allCurrencies = getAllCurrencies();
    const match = allCurrencies.find((c) =>
        c.countries.some((country) =>
            country.toUpperCase().includes(region)
        )
    );

    return match?.code || "USD";
}

interface CurrencyContextType {
    currency: string;
    setCurrency: (code: string) => void;
    cycleCurrency: () => void;
    symbol: string;
    format: (amount: number | string) => string;
    allCurrencies: CurrencyInfo[];
    locale: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "tin-currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<string>("USD");
    const [locale, setLocale] = useState<string>("en-US");
    const [allCurrencies] = useState<CurrencyInfo[]>(() => getAllCurrencies());

    // Initialize from localStorage or detect from system
    useEffect(() => {
        const systemLocale = typeof navigator !== "undefined" ? navigator.language : "en-US";
        setLocale(systemLocale);

        // Check localStorage first - user's previous selection persists
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            // Validate it's a real currency code
            const isValid = cc.code(stored) !== undefined;
            if (isValid) {
                setCurrencyState(stored);
                return;
            }
        }

        // Otherwise detect from system
        const detected = detectSystemCurrency();
        setCurrencyState(detected);
    }, []);

    // Set currency and persist to localStorage
    const setCurrency = useCallback((code: string) => {
        const isValid = cc.code(code) !== undefined;
        if (!isValid) {
            console.warn(`Invalid currency code: ${code}`);
            return;
        }
        setCurrencyState(code);
        localStorage.setItem(STORAGE_KEY, code);
    }, []);

    // Get symbol dynamically
    const symbol = getCurrencySymbol(currency, locale);

    // Format amount with current currency
    const format = useCallback(
        (amount: number | string) => formatCurrency(amount, currency, locale),
        [currency, locale]
    );

    // Cycle through all currencies
    const cycleCurrency = useCallback(() => {
        if (allCurrencies.length === 0) return;

        const currentIndex = allCurrencies.findIndex(c => c.code === currency);
        // If not found, start from 0, otherwise go to next
        const nextIndex = (currentIndex + 1) % allCurrencies.length;
        setCurrency(allCurrencies[nextIndex].code);
    }, [currency, setCurrency, allCurrencies]);

    const value: CurrencyContextType = {
        currency,
        setCurrency,
        cycleCurrency,
        symbol,
        format,
        allCurrencies,
        locale,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
