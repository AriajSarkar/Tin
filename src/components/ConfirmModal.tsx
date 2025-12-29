"use client";

import { motion, AnimatePresence } from "motion/react";
import { RiCloseLine, RiAlertLine } from "@remixicon/react";
import { colors } from "@/styles/tokens";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: "danger" | "primary";
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = "danger",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const confirmBg = confirmVariant === "danger"
        ? colors.status.negative + "20"
        : colors.accent.primary;
    const confirmColor = confirmVariant === "danger"
        ? colors.status.negative
        : "#fff";

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
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                        onClick={onCancel}
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative w-full max-w-sm mx-4 rounded-xl overflow-hidden"
                            style={{
                                background: colors.bg.raised,
                                border: `1px solid ${colors.border.subtle}`,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
                            >
                                <div className="flex items-center gap-2">
                                    <RiAlertLine
                                        size={18}
                                        style={{
                                            color: confirmVariant === "danger"
                                                ? colors.status.negative
                                                : colors.accent.primary
                                        }}
                                    />
                                    <h3
                                        className="text-sm font-medium"
                                        style={{ color: colors.text.primary }}
                                    >
                                        {title}
                                    </h3>
                                </div>
                                <button
                                    onClick={onCancel}
                                    className="p-1 rounded-md cursor-pointer transition-colors"
                                    style={{ color: colors.text.tertiary }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <RiCloseLine size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-4 py-4">
                                <p
                                    className="text-sm"
                                    style={{ color: colors.text.secondary }}
                                >
                                    {message}
                                </p>
                            </div>

                            {/* Footer */}
                            <div
                                className="flex justify-end gap-2 px-4 py-3"
                                style={{
                                    background: colors.bg.surface,
                                    borderTop: `1px solid ${colors.border.subtle}`,
                                }}
                            >
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onCancel}
                                    className="px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                                    style={{ color: colors.text.secondary }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {cancelText}
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onConfirm}
                                    className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                                    style={{
                                        background: confirmBg,
                                        color: confirmColor,
                                    }}
                                >
                                    {confirmText}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
