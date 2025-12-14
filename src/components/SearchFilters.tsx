"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    RiFilterLine,
    RiFileList3Line,
    RiCheckboxCircleLine,
    RiCalendarLine,
    RiCoinLine,
} from "@remixicon/react";
import { colors } from "@/styles/tokens";
import { useCurrency } from "@/hooks/useCurrency";

export type SearchFilterType = "all" | "cards" | "todos" | "date" | "amount";

interface SearchFiltersProps {
    activeFilter: SearchFilterType;
    onFilterChange: (filter: SearchFilterType) => void;
    amountRange: { min: string; max: string };
    onAmountRangeChange: (range: { min: string; max: string }) => void;
    dateValue: string;
    onDateChange: (date: string) => void;
}

const filterOptions: { value: SearchFilterType; label: string; icon: React.ElementType }[] = [
    { value: "all", label: "All", icon: RiFilterLine },
    { value: "cards", label: "Cards Only", icon: RiFileList3Line },
    { value: "todos", label: "Todos Only", icon: RiCheckboxCircleLine },
    { value: "date", label: "By Date", icon: RiCalendarLine },
    { value: "amount", label: "Amount Range", icon: RiCoinLine },
];

export function SearchFilters({
    activeFilter,
    onFilterChange,
    amountRange,
    onAmountRangeChange,
    dateValue,
    onDateChange,
}: SearchFiltersProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const { symbol } = useCurrency();

    const activeOption = filterOptions.find(o => o.value === activeFilter) || filterOptions[0];
    const ActiveIcon = activeOption.icon;

    const handleFilterSelect = useCallback((filter: SearchFilterType) => {
        onFilterChange(filter);
        setShowDropdown(false);
    }, [onFilterChange]);

    return (
        <div className="relative">
            {/* Filter Button */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors"
                style={{
                    background: colors.bg.surface,
                    border: `1px solid ${colors.border.subtle}`,
                    color: activeFilter !== "all" ? colors.accent.primary : colors.text.secondary,
                }}
            >
                <ActiveIcon size={14} />
                <span className="hidden sm:inline">{activeOption.label}</span>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {showDropdown && (
                    <>
                        {/* Invisible backdrop to close dropdown */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDropdown(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 z-50 py-1 rounded-lg shadow-lg min-w-[160px]"
                            style={{
                                background: colors.bg.raised,
                                border: `1px solid ${colors.border.subtle}`,
                            }}
                        >
                            {filterOptions.map((option) => {
                                const Icon = option.icon;
                                const isActive = activeFilter === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleFilterSelect(option.value)}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs cursor-pointer transition-colors"
                                        style={{
                                            color: isActive ? colors.accent.primary : colors.text.secondary,
                                            background: isActive ? colors.bg.surface : "transparent",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.background = colors.bg.surface;
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <Icon size={14} />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Amount Range Inputs (shown when amount filter active) */}
            <AnimatePresence>
                {activeFilter === "amount" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-10 z-40 p-3 rounded-lg shadow-lg"
                        style={{
                            background: colors.bg.raised,
                            border: `1px solid ${colors.border.subtle}`,
                            minWidth: 200,
                        }}
                    >
                        <p className="text-xs mb-2" style={{ color: colors.text.tertiary }}>
                            Amount Range
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs" style={{ color: colors.text.tertiary }}>{symbol}</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={amountRange.min}
                                    onChange={(e) => onAmountRangeChange({ ...amountRange, min: e.target.value })}
                                    placeholder="Min"
                                    className="w-full px-2 py-1.5 text-xs rounded outline-none"
                                    style={{
                                        background: colors.bg.surface,
                                        border: `1px solid ${colors.border.subtle}`,
                                        color: colors.text.primary,
                                    }}
                                />
                            </div>
                            <span className="text-xs" style={{ color: colors.text.tertiary }}>to</span>
                            <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs" style={{ color: colors.text.tertiary }}>{symbol}</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={amountRange.max}
                                    onChange={(e) => onAmountRangeChange({ ...amountRange, max: e.target.value })}
                                    placeholder="Max"
                                    className="w-full px-2 py-1.5 text-xs rounded outline-none"
                                    style={{
                                        background: colors.bg.surface,
                                        border: `1px solid ${colors.border.subtle}`,
                                        color: colors.text.primary,
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Date Picker (shown when date filter active) */}
            <AnimatePresence>
                {activeFilter === "date" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-10 z-40 p-3 rounded-lg shadow-lg"
                        style={{
                            background: colors.bg.raised,
                            border: `1px solid ${colors.border.subtle}`,
                            minWidth: 180,
                        }}
                    >
                        <p className="text-xs mb-2" style={{ color: colors.text.tertiary }}>
                            Filter by Date
                        </p>
                        <input
                            type="date"
                            value={dateValue}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded outline-none"
                            style={{
                                background: colors.bg.surface,
                                border: `1px solid ${colors.border.subtle}`,
                                color: colors.text.primary,
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
