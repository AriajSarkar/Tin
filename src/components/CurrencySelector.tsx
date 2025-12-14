"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RiCloseLine, RiSearchLine, RiCheckLine } from "@remixicon/react";
import { colors } from "@/styles/tokens";
import { type CurrencyInfo } from "@/hooks/useCurrency";

interface CurrencySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
    currentCurrency: string;
    allCurrencies: CurrencyInfo[];
}

export function CurrencySelector({
    isOpen,
    onClose,
    onSelect,
    currentCurrency,
    allCurrencies,
}: CurrencySelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            // Tiny delay to allow animation to start
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        } else {
            setSearchQuery("");
        }
    }, [isOpen]);

    const filteredCurrencies = useMemo(() => {
        if (!searchQuery) return allCurrencies;
        const lower = searchQuery.toLowerCase();
        return allCurrencies.filter(
            (c) =>
                c.code.toLowerCase().includes(lower) ||
                c.name.toLowerCase().includes(lower) ||
                c.countries.some((country) => country.toLowerCase().includes(lower))
        );
    }, [allCurrencies, searchQuery]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                        onClick={onClose}
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative w-full max-w-md rounded-xl overflow-hidden flex flex-col max-h-[80vh]"
                            style={{
                                background: colors.bg.raised,
                                border: `1px solid ${colors.border.subtle}`,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header & Search */}
                            <div
                                className="p-3 flex items-center gap-3"
                                style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
                            >
                                <div className="flex-1 relative">
                                    <RiSearchLine
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2"
                                        style={{ color: colors.text.tertiary }}
                                    />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search currency (e.g. USD, Euro...)"
                                        className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-transparent outline-none transition-colors"
                                        style={{
                                            color: colors.text.primary,
                                            background: colors.bg.surface,
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg cursor-pointer transition-colors"
                                    style={{ color: colors.text.tertiary }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <RiCloseLine size={20} />
                                </button>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto min-h-[300px] p-2">
                                {filteredCurrencies.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 text-center">
                                        <p className="text-sm" style={{ color: colors.text.tertiary }}>
                                            No currencies found
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredCurrencies.map((c) => {
                                            const isSelected = c.code === currentCurrency;
                                            return (
                                                <button
                                                    key={c.code}
                                                    onClick={() => {
                                                        onSelect(c.code);
                                                        onClose();
                                                    }}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer group"
                                                    style={{
                                                        background: isSelected ? colors.accent.primary + "15" : "transparent"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) e.currentTarget.style.background = colors.bg.hover;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <div className="flex flex-col overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm" style={{ color: isSelected ? colors.accent.primary : colors.text.primary }}>
                                                                {c.code}
                                                            </span>
                                                            <span className="text-xs truncate" style={{ color: colors.text.tertiary }}>
                                                                {c.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] truncate" style={{ color: colors.text.tertiary, opacity: 0.7 }}>
                                                            {c.countries.join(", ")}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <RiCheckLine size={16} style={{ color: colors.accent.primary }} />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
