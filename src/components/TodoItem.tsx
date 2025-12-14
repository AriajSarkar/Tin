"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Todo } from "@/lib/types";
import { RiCheckLine, RiEditLine, RiDeleteBinLine, RiTimeLine, RiCloseLine, RiCheckDoubleLine } from "@remixicon/react";
import { colors } from "@/styles/tokens";

interface TodoItemProps {
    todo: Todo;
    onToggle: (todoId: string, done: boolean) => void;
    onEdit: (todoId: string, newTitle: string, newAmount?: string) => void;
    onDelete: (todoId: string) => void;
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [editAmount, setEditAmount] = useState(todo.amount || "");
    const editInputRef = useRef<HTMLInputElement>(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [isEditing]);

    const handlePressStart = useCallback(() => {
        if (isEditing) return;
        const timer = setTimeout(() => {
            setShowMenu(true);
        }, 500);
        setPressTimer(timer);
    }, [isEditing]);

    const handlePressEnd = useCallback(() => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    }, [pressTimer]);

    // Right-click context menu
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (isEditing) return;
        e.preventDefault();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    }, [isEditing]);

    const handleStartEdit = useCallback(() => {
        setEditTitle(todo.title);
        setEditAmount(todo.amount || "");
        setIsEditing(true);
        setShowMenu(false);
    }, [todo.title, todo.amount]);

    const handleSaveEdit = useCallback(() => {
        if (!editTitle.trim()) {
            // Don't save empty title
            setIsEditing(false);
            return;
        }
        onEdit(todo.id, editTitle.trim(), editAmount || undefined);
        setIsEditing(false);
    }, [todo.id, editTitle, editAmount, onEdit]);

    const handleCancelEdit = useCallback(() => {
        setEditTitle(todo.title);
        setEditAmount(todo.amount || "");
        setIsEditing(false);
    }, [todo.title, todo.amount]);

    const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSaveEdit();
        } else if (e.key === "Escape") {
            handleCancelEdit();
        }
    }, [handleSaveEdit, handleCancelEdit]);

    const formattedAmount = todo.amount ? `$${parseFloat(todo.amount).toFixed(2)}` : null;
    const formattedDate = todo.scheduled_at
        ? new Date(todo.scheduled_at).toLocaleDateString()
        : null;

    // Edit mode UI
    if (isEditing) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl p-3"
                style={{
                    background: colors.bg.raised,
                    border: `1px solid ${colors.accent.primary}`,
                }}
            >
                <div className="space-y-2">
                    <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        placeholder="Todo title..."
                        className="w-full p-2 rounded-lg text-sm outline-none"
                        style={{
                            background: colors.bg.surface,
                            border: `1px solid ${colors.border.subtle}`,
                            color: colors.text.primary,
                        }}
                    />
                    <input
                        type="text"
                        value={editAmount}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
                                setEditAmount(val);
                            }
                        }}
                        onKeyDown={handleEditKeyDown}
                        placeholder="Amount (optional)"
                        inputMode="decimal"
                        className="w-full p-2 rounded-lg text-sm outline-none"
                        style={{
                            background: colors.bg.surface,
                            border: `1px solid ${colors.border.subtle}`,
                            color: colors.text.primary,
                        }}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                            style={{ color: colors.text.secondary }}
                            onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <RiCloseLine size={12} />
                            Cancel
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSaveEdit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                            style={{
                                background: colors.accent.primary,
                                color: "#fff",
                            }}
                        >
                            <RiCheckDoubleLine size={12} />
                            Save
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative"
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onContextMenu={handleContextMenu}
        >
            <motion.div
                whileHover={{ y: -1 }}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150"
                style={{
                    background: todo.done ? colors.bg.surface : colors.bg.raised,
                    border: `1px solid ${colors.border.subtle}`,
                }}
                onMouseEnter={(e) => {
                    if (!todo.done) {
                        e.currentTarget.style.borderColor = colors.border.default;
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border.subtle;
                }}
            >
                {/* Checkbox */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(todo.id, !todo.done);
                    }}
                    className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer"
                    style={{
                        background: todo.done ? colors.status.positive : "transparent",
                        border: todo.done ? "none" : `2px solid ${colors.border.default}`,
                    }}
                    onMouseEnter={(e) => {
                        if (!todo.done) {
                            e.currentTarget.style.borderColor = colors.accent.primary;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!todo.done) {
                            e.currentTarget.style.borderColor = colors.border.default;
                        }
                    }}
                >
                    {todo.done && <RiCheckLine size={12} color="#fff" />}
                </motion.button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm transition-all duration-150"
                        style={{
                            color: todo.done ? colors.text.tertiary : colors.text.primary,
                            textDecoration: todo.done ? "line-through" : "none",
                        }}
                    >
                        {todo.title}
                    </p>

                    <div className="flex items-center gap-2.5 mt-1.5">
                        {formattedAmount && (
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                    background: colors.accent.muted,
                                    color: colors.accent.primary,
                                }}
                            >
                                {formattedAmount}
                            </span>
                        )}
                        {formattedDate && (
                            <span
                                className="text-xs flex items-center gap-1"
                                style={{ color: colors.text.tertiary }}
                            >
                                <RiTimeLine size={11} />
                                {formattedDate}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Context Menu */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.12, ease: "easeOut" }}
                            className="fixed z-50 rounded-lg overflow-hidden py-1"
                            style={{
                                background: colors.bg.raised,
                                border: `1px solid ${colors.border.subtle}`,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                                left: menuPosition.x > 0 ? menuPosition.x : "auto",
                                top: menuPosition.y > 0 ? menuPosition.y : "auto",
                                right: menuPosition.x === 0 ? 16 : "auto",
                            }}
                        >
                            <button
                                onClick={handleStartEdit}
                                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-100"
                                style={{ color: colors.text.secondary }}
                                onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.surface}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <RiEditLine size={14} />
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(todo.id);
                                    setShowMenu(false);
                                }}
                                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-100"
                                style={{ color: colors.status.negative }}
                                onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.surface}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <RiDeleteBinLine size={14} />
                                Delete
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
