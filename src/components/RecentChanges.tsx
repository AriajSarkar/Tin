"use client";

import { motion } from "motion/react";
import type { ChangeLog } from "@/lib/types";
import { Icon } from "./Icon";

interface RecentChangesProps {
    changes: ChangeLog[];
    onCardClick: (cardId: string) => void;
}

const kindLabels: Record<string, { label: string; icon: "plus" | "edit" | "trash" | "archive" | "check" }> = {
    created: { label: "Card created", icon: "plus" },
    updated: { label: "Card updated", icon: "edit" },
    todo_added: { label: "Todo added", icon: "plus" },
    todo_updated: { label: "Todo updated", icon: "edit" },
    todo_deleted: { label: "Todo deleted", icon: "trash" },
    archived: { label: "Card archived", icon: "archive" },
};

export function RecentChanges({ changes, onCardClick }: RecentChangesProps) {
    if (changes.length === 0) {
        return null;
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Icon name="clock" size={20} className="text-gray-400" />
                Recent Activity
            </h2>

            <div className="space-y-2">
                {changes.slice(0, 5).map((change, index) => {
                    const config = kindLabels[change.kind] || { label: change.kind, icon: "edit" as const };
                    const payload = change.payload as Record<string, unknown>;

                    return (
                        <motion.button
                            key={change.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onCardClick(change.card_id)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <Icon name={config.icon} size={16} className="text-gray-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {config.label}
                                    {payload.title ? `: ${String(payload.title)}` : null}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatTime(change.created_at)}
                                </p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}
