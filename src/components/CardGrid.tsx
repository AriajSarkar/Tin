"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Card } from "@/lib/types";
import { CardItem } from "./CardItem";
import { RiWalletLine, RiCheckboxMultipleLine, RiCloseLine, RiDeleteBinLine, RiArchiveLine, RiInboxUnarchiveLine } from "@remixicon/react";
import { colors } from "@/styles/tokens";

interface CardGridProps {
    cards: Card[];
    onCardClick: (cardId: string) => void;
    onDeleteCard: (cardId: string) => void;
    // Selection mode props
    isSelectionMode?: boolean;
    selectedIds?: Set<string>;
    onToggleSelect?: (cardId: string) => void;
    onSelectAll?: () => void;
    onDeselectAll?: () => void;
    onDeleteSelected?: () => void;
    onMoveToSaved?: () => void;
    onMoveToRecent?: () => void;
    onExitSelectionMode?: () => void;
    selectionAction?: "delete" | "move" | null;
    isSavedTab?: boolean;
}

export function CardGrid({
    cards,
    onCardClick,
    onDeleteCard,
    isSelectionMode = false,
    selectedIds = new Set(),
    onToggleSelect,
    onSelectAll,
    onDeselectAll,
    onDeleteSelected,
    onMoveToSaved,
    onMoveToRecent,
    onExitSelectionMode,
    selectionAction = null,
    isSavedTab = false,
}: CardGridProps) {
    const selectedCount = selectedIds.size;
    const allSelected = cards.length > 0 && selectedCount === cards.length;

    if (cards.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
            >
                <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: colors.bg.surface }}
                >
                    <RiWalletLine size={22} style={{ color: colors.text.tertiary }} />
                </div>
                <h3
                    className="text-sm font-medium mb-1"
                    style={{ color: colors.text.secondary }}
                >
                    No cards yet
                </h3>
                <p
                    className="text-xs max-w-[200px]"
                    style={{ color: colors.text.tertiary }}
                >
                    Create your first card to start tracking
                </p>
            </motion.div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-3"
            >
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: index * 0.04,
                            duration: 0.25,
                            ease: "easeOut",
                        }}
                    >
                        <CardItem
                            card={card}
                            onClick={() => onCardClick(card.id)}
                            onDelete={() => onDeleteCard(card.id)}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedIds.has(card.id)}
                            onToggleSelect={() => onToggleSelect?.(card.id)}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Selection Bar - Fixed at bottom */}
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bottom-0 left-0 right-0 z-50"
                        style={{
                            background: colors.bg.raised,
                            borderTop: `1px solid ${colors.border.subtle}`,
                            boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
                        }}
                    >
                        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                            {/* Left: Count and Select/Deselect */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <RiCheckboxMultipleLine size={16} style={{ color: colors.accent.primary }} />
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: colors.text.primary }}
                                    >
                                        {selectedCount} selected
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={allSelected ? onDeselectAll : onSelectAll}
                                        className="px-2 py-1 text-xs rounded-md cursor-pointer transition-colors"
                                        style={{ color: colors.accent.primary }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {allSelected ? "Deselect All" : "Select All"}
                                    </button>
                                </div>
                            </div>

                            {/* Right: Action buttons */}
                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onExitSelectionMode}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                                    style={{ color: colors.text.secondary }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <RiCloseLine size={14} />
                                    Cancel
                                </motion.button>

                                {(selectionAction === "move" || selectionAction === null) && (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={isSavedTab ? onMoveToRecent : onMoveToSaved}
                                        disabled={selectedCount === 0}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        style={{
                                            background: colors.accent.muted,
                                            color: colors.accent.primary,
                                        }}
                                    >
                                        {isSavedTab ? (
                                            <>
                                                <RiInboxUnarchiveLine size={14} />
                                                Move to Recent
                                            </>
                                        ) : (
                                            <>
                                                <RiArchiveLine size={14} />
                                                Move to Saved
                                            </>
                                        )}
                                    </motion.button>
                                )}

                                {(selectionAction === "delete" || selectionAction === null) && (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={onDeleteSelected}
                                        disabled={selectedCount === 0}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: colors.status.negative + "20",
                                            color: colors.status.negative,
                                        }}
                                    >
                                        <RiDeleteBinLine size={14} />
                                        Delete
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
