"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Todo } from "@/lib/types";
import { Icon } from "./Icon";

interface TodoItemProps {
    todo: Todo;
    onToggle: (todoId: string, done: boolean) => void;
    onEdit: (todoId: string) => void;
    onDelete: (todoId: string) => void;
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

    const handlePressStart = () => {
        const timer = setTimeout(() => {
            setShowMenu(true);
        }, 500);
        setPressTimer(timer);
    };

    const handlePressEnd = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    };

    const formattedAmount = todo.amount ? `$${parseFloat(todo.amount).toFixed(2)}` : null;
    const formattedDate = todo.scheduled_at
        ? new Date(todo.scheduled_at).toLocaleDateString()
        : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="relative"
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
        >
            <div
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${todo.done
                        ? "bg-gray-50 dark:bg-gray-800/50"
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                    } border border-gray-100 dark:border-gray-700`}
            >
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => onToggle(todo.id, !todo.done)}
                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${todo.done
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
                        }`}
                >
                    {todo.done && <Icon name="check" size={12} className="text-white" />}
                </motion.button>

                <div className="flex-1 min-w-0">
                    <p
                        className={`text-sm transition-all ${todo.done
                                ? "text-gray-400 line-through"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                    >
                        {todo.title}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5">
                        {formattedAmount && (
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                {formattedAmount}
                            </span>
                        )}
                        {formattedDate && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Icon name="clock" size={12} />
                                {formattedDate}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute right-0 top-0 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                        >
                            <button
                                onClick={() => {
                                    onEdit(todo.id);
                                    setShowMenu(false);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Icon name="edit" size={16} />
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(todo.id);
                                    setShowMenu(false);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <Icon name="trash" size={16} />
                                Delete
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
