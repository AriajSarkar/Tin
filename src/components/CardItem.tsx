"use client";

import { motion } from "motion/react";
import type { Card } from "@/lib/types";
import { Icon } from "./Icon";
import Decimal from "decimal.js";

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
}

export function CardItem({ card, onClick, onDelete }: CardItemProps) {
    const amount = safeDecimal(card.amount);
    const isNegative = amount.isNegative();
    const formattedAmount = amount.toFixed(2);

    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
        <motion.article
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="relative group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {card.title || "Untitled Card"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {timeSince(card.created_at)}
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                    >
                        <Icon name="trash" size={16} />
                    </motion.button>
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                    <span
                        className={`text-2xl font-bold ${isNegative
                            ? "text-red-500"
                            : "text-gray-900 dark:text-gray-100"
                            }`}
                    >
                        {formattedAmount}
                    </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: isNegative ? "100%" : `${Math.min(100, Math.abs(parseFloat(card.amount)) / 10)}%` }}
                            className={`h-full rounded-full ${isNegative
                                ? "bg-gradient-to-r from-red-400 to-red-500"
                                : "bg-gradient-to-r from-blue-400 to-purple-500"
                                }`}
                        />
                    </div>
                </div>
            </div>
        </motion.article>
    );
}
