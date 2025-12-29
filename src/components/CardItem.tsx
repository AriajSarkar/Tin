"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import type { Card } from "@/lib/types";
import { useCurrency } from "@/hooks/useCurrency";
import { RiCheckboxCircleFill, RiCheckboxBlankCircleLine } from "@remixicon/react";
import Decimal from "decimal.js";
import { colors } from "@/styles/tokens";
import { formatWithCommas } from "@/utils/amount";

function safeDecimal(value: string | null | undefined): Decimal {
    try {
        return new Decimal(value || "0");
    } catch {
        return new Decimal(0);
    }
}

interface CardItemProps {
    card: Card;
    onClick: () => void;
    onDelete: () => void;
    // Selection mode props
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    onEnterSelectionMode?: () => void; // Called on hold/right-click to enter selection mode and select this card
}

export function CardItem({
    card,
    onClick,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelect,
    onEnterSelectionMode,
}: CardItemProps) {
    const { symbol } = useCurrency();
    const amount = safeDecimal(card.amount);
    const isNegative = amount.isNegative();
    const formattedAmount = formatWithCommas(card.amount);

    // Long-press timer
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
        return `${Math.floor(diffDays / 30)}mo`;
    };

    const handleClick = () => {
        if (isSelectionMode) {
            onToggleSelect?.();
        } else {
            onClick();
        }
    };

    // Long-press handler - enters selection mode and selects this card
    const handlePressStart = useCallback(() => {
        if (isSelectionMode) return; // Already in selection mode
        const timer = setTimeout(() => {
            onEnterSelectionMode?.();
        }, 500);
        setPressTimer(timer);
    }, [isSelectionMode, onEnterSelectionMode]);

    const handlePressEnd = useCallback(() => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    }, [pressTimer]);

    // Right-click - enters selection mode and selects this card
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (isSelectionMode) return;
        e.preventDefault();
        onEnterSelectionMode?.();
    }, [isSelectionMode, onEnterSelectionMode]);

    return (
        <motion.article
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.995 }}
            onClick={handleClick}
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onContextMenu={handleContextMenu}
            className="relative group cursor-pointer rounded-xl overflow-hidden"
            style={{
                background: colors.bg.raised,
                border: `1px solid ${isSelected ? colors.accent.primary : colors.border.subtle}`,
            }}
        >
            {/* Selection checkbox - visible in selection mode */}
            {isSelectionMode && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 z-10"
                >
                    {isSelected ? (
                        <RiCheckboxCircleFill
                            size={20}
                            style={{ color: colors.accent.primary }}
                        />
                    ) : (
                        <RiCheckboxBlankCircleLine
                            size={20}
                            style={{ color: colors.text.tertiary }}
                        />
                    )}
                </motion.div>
            )}

            {/* Selected overlay */}
            {isSelected && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: colors.accent.primary + "10" }}
                />
            )}

            {/* Margin marker - notebook left accent line */}
            <div
                className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r"
                style={{
                    background: isNegative ? colors.status.negative : colors.accent.primary,
                    opacity: 0.5,
                }}
            />

            <div className="pl-4 pr-3 py-3.5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <h3
                            className="text-sm font-medium truncate"
                            style={{ color: colors.text.primary }}
                        >
                            {card.title || "Untitled"}
                        </h3>
                        <p
                            className="text-xs mt-0.5"
                            style={{ color: colors.text.tertiary }}
                        >
                            {timeSince(card.created_at)}
                        </p>
                    </div>
                </div>

                {/* Amount - the visual focus */}
                <div className="flex items-baseline gap-1">
                    <span
                        className="text-xs"
                        style={{ color: colors.text.tertiary }}
                    >
                        {symbol}
                    </span>
                    <span
                        className="text-xl font-medium tabular-nums tracking-tight"
                        style={{
                            color: isNegative ? colors.status.negative : colors.text.primary,
                        }}
                    >
                        {formattedAmount}
                    </span>
                </div>
            </div>
        </motion.article>
    );
}
