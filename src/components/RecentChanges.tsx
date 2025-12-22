"use client";

import { motion } from "motion/react";
import type { ChangeLog } from "@/lib/types";
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiArchiveLine} from "@remixicon/react";
import { colors } from "@/styles/tokens";

interface RecentChangesProps {
    changes: ChangeLog[];
    onCardClick: (cardId: string) => void;
}

const kindConfig: Record<string, { icon: React.ElementType; label: string }> = {
    created: { icon: RiAddLine, label: "Created" },
    updated: { icon: RiEditLine, label: "Updated" },
    todo_added: { icon: RiAddLine, label: "Todo added" },
    todo_updated: { icon: RiEditLine, label: "Todo updated" },
    todo_deleted: { icon: RiDeleteBinLine, label: "Removed" },
    archived: { icon: RiArchiveLine, label: "Archived" },
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

        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <section className="mb-8">
            {/* Section header - notebook style */}
            <h2
                className="section-header"
                style={{ color: colors.text.tertiary }}
            >
                Recent Changes
            </h2>

            <div className="space-y-1.5">
                {changes.slice(0, 5).map((change, index) => {
                    const config = kindConfig[change.kind] || { icon: RiEditLine, label: change.kind };
                    const Icon = config.icon;
                    const payload = change.payload as Record<string, unknown>;

                    return (
                        <motion.button
                            key={change.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04, duration: 0.2 }}
                            onClick={() => onCardClick(change.card_id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
                            style={{
                                background: 'transparent',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.surface}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            {/* Icon */}
                            <div
                                className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
                                style={{
                                    background: colors.bg.surface,
                                    color: colors.text.tertiary,
                                }}
                            >
                                <Icon size={12} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-xs font-medium truncate"
                                    style={{ color: colors.text.secondary }}
                                >
                                    {config.label}
                                    {payload.title ? (
                                        <span style={{ color: colors.text.tertiary }}>
                                            {" · "}{String(payload.title)}
                                        </span>
                                    ) : null}
                                </p>
                            </div>

                            {/* Time */}
                            <span
                                className="text-xs tabular-nums"
                                style={{ color: colors.text.tertiary }}
                            >
                                {formatTime(change.created_at)}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}
