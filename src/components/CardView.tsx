"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CardWithTodos, Todo } from "@/lib/types";
import { TodoItem } from "./TodoItem";
import { RiArrowLeftLine, RiAddLine } from "@remixicon/react";
import Decimal from "decimal.js";
import * as api from "@/lib/api";
import { colors } from "@/styles/tokens";

function safeDecimal(value: string | null | undefined): Decimal {
    try {
        return new Decimal(value || "0");
    } catch {
        return new Decimal(0);
    }
}

// Format amount to 2 decimal places
function formatAmount(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
}

// Validate numeric input (allow digits, decimal point, minus sign)
function isValidAmountInput(value: string): boolean {
    if (value === "" || value === "-") return true;
    return /^-?\d*\.?\d*$/.test(value);
}

interface CardViewProps {
    card: CardWithTodos;
    onBack: () => void;
    onUpdate: () => void;
}

export function CardView({ card, onBack, onUpdate }: CardViewProps) {
    const [title, setTitle] = useState(card.title || "");
    const [amount, setAmount] = useState(formatAmount(card.amount));
    const [todos, setTodos] = useState<Todo[]>(card.todos);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTodoTitle, setNewTodoTitle] = useState("");
    const [newTodoAmount, setNewTodoAmount] = useState("");
    const [useCurrentTime, setUseCurrentTime] = useState(true);
    const [scheduledAt, setScheduledAt] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setTitle(card.title || "");
        setAmount(formatAmount(card.amount));
        setTodos(card.todos);
    }, [card]);

    const totalDeducted = todos.reduce((sum, todo) => {
        return sum.plus(safeDecimal(todo.amount));
    }, new Decimal(0));

    const remaining = safeDecimal(amount).minus(totalDeducted);

    const handleTitleBlur = useCallback(async () => {
        if (title !== card.title) {
            await api.updateCard(card.id, title || null);
            onUpdate();
        }
    }, [card.id, card.title, title, onUpdate]);

    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isValidAmountInput(value)) {
            setAmount(value);
        }
    }, []);

    const handleAmountBlur = useCallback(async () => {
        const formatted = formatAmount(amount);
        setAmount(formatted);

        if (formatted !== formatAmount(card.amount)) {
            await api.updateCard(card.id, undefined, formatted);
            onUpdate();
        }
    }, [card.id, card.amount, amount, onUpdate]);

    const handleAddTodo = useCallback(async () => {
        if (!newTodoTitle.trim()) return;

        setIsLoading(true);
        try {
            const result = await api.addTodo(
                card.id,
                newTodoTitle.trim(),
                newTodoAmount || null,
                useCurrentTime,
                !useCurrentTime ? scheduledAt || null : null
            );

            setTodos((prev) => [...prev, result.todo]);
            setAmount(formatAmount(result.updated_card.amount));
            setNewTodoTitle("");
            setNewTodoAmount("");
            setScheduledAt("");
            setShowAddForm(false);
            onUpdate();
        } finally {
            setIsLoading(false);
        }
    }, [card.id, newTodoTitle, newTodoAmount, useCurrentTime, scheduledAt, onUpdate]);

    const handleToggleTodo = useCallback(async (todoId: string, done: boolean) => {
        await api.updateTodo(todoId, undefined, undefined, done);
        setTodos((prev) =>
            prev.map((t) => (t.id === todoId ? { ...t, done } : t))
        );
        onUpdate();
    }, [onUpdate]);

    const handleDeleteTodo = useCallback(async (todoId: string) => {
        await api.deleteTodo(todoId);
        setTodos((prev) => prev.filter((t) => t.id !== todoId));
        onUpdate();
    }, [onUpdate]);

    const handleEditTodo = useCallback(async (todoId: string, newTitle: string, newAmount?: string) => {
        await api.updateTodo(todoId, newTitle, newAmount);
        setTodos((prev) =>
            prev.map((t) =>
                t.id === todoId
                    ? { ...t, title: newTitle, amount: newAmount || t.amount }
                    : t
            )
        );
        onUpdate();
    }, [onUpdate]);

    const handleNewTodoAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isValidAmountInput(value)) {
            setNewTodoAmount(value);
        }
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="min-h-screen"
            style={{ background: colors.bg.base }}
        >
            {/* Header */}
            <header
                className="sticky top-0 z-50"
                style={{
                    background: colors.bg.base,
                    borderBottom: `1px solid ${colors.border.subtle}`,
                }}
            >
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        className="p-1.5 rounded-md cursor-pointer"
                        style={{ color: colors.text.tertiary }}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <RiArrowLeftLine size={18} />
                    </motion.button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        placeholder="Card title..."
                        className="flex-1 text-base font-medium bg-transparent border-none outline-none"
                        style={{
                            color: colors.text.primary,
                        }}
                    />
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-5">
                {/* Main Balance Section - Consistent with dashboard */}
                <motion.section
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-xl p-5 mb-5"
                    style={{
                        background: colors.bg.raised,
                        border: `1px solid ${colors.border.subtle}`,
                    }}
                >
                    <label
                        className="text-xs font-medium block mb-2"
                        style={{ color: colors.text.tertiary }}
                    >
                        Main Balance
                    </label>
                    <div className="flex items-baseline gap-1.5">
                        <span
                            className="text-xl"
                            style={{ color: colors.text.tertiary }}
                        >
                            $
                        </span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={handleAmountChange}
                            onBlur={handleAmountBlur}
                            placeholder="0.00"
                            className="text-3xl font-semibold bg-transparent border-none outline-none w-full tabular-nums"
                            style={{
                                color: colors.text.primary,
                            }}
                        />
                    </div>
                </motion.section>

                {/* Items Section */}
                <section className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <h2
                            className="text-sm font-medium"
                            style={{ color: colors.text.primary }}
                        >
                            Items
                        </h2>
                        <span
                            className="text-xs"
                            style={{ color: colors.text.tertiary }}
                        >
                            {todos.length} item{todos.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <AnimatePresence mode="popLayout">
                        <div className="space-y-2">
                            {todos.map((todo) => (
                                <TodoItem
                                    key={todo.id}
                                    todo={todo}
                                    onToggle={handleToggleTodo}
                                    onEdit={handleEditTodo}
                                    onDelete={handleDeleteTodo}
                                />
                            ))}
                        </div>
                    </AnimatePresence>

                    <AnimatePresence>
                        {showAddForm ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="mt-3 rounded-xl p-4"
                                style={{
                                    background: colors.bg.raised,
                                    border: `1px solid ${colors.border.subtle}`,
                                }}
                            >
                                <input
                                    type="text"
                                    value={newTodoTitle}
                                    onChange={(e) => setNewTodoTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full p-2.5 rounded-lg text-sm outline-none mb-3"
                                    style={{
                                        background: colors.bg.surface,
                                        border: `1px solid ${colors.border.subtle}`,
                                        color: colors.text.primary,
                                    }}
                                    autoFocus
                                />

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label
                                            className="text-xs block mb-1"
                                            style={{ color: colors.text.tertiary }}
                                        >
                                            Amount (optional)
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={newTodoAmount}
                                            onChange={handleNewTodoAmountChange}
                                            placeholder="0.00"
                                            className="w-full p-2 rounded-lg text-sm outline-none"
                                            style={{
                                                background: colors.bg.surface,
                                                border: `1px solid ${colors.border.subtle}`,
                                                color: colors.text.primary,
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className="text-xs block mb-1"
                                            style={{ color: colors.text.tertiary }}
                                        >
                                            Date/Time
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <label
                                                className="flex items-center gap-1.5 text-xs cursor-pointer"
                                                style={{ color: colors.text.secondary }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={useCurrentTime}
                                                    onChange={(e) => setUseCurrentTime(e.target.checked)}
                                                    className="rounded"
                                                />
                                                Now
                                            </label>
                                            {!useCurrentTime && (
                                                <input
                                                    type="datetime-local"
                                                    value={scheduledAt}
                                                    onChange={(e) => setScheduledAt(e.target.value)}
                                                    className="flex-1 p-1.5 rounded-lg text-xs outline-none"
                                                    style={{
                                                        background: colors.bg.surface,
                                                        border: `1px solid ${colors.border.subtle}`,
                                                        color: colors.text.primary,
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowAddForm(false)}
                                        className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                                        style={{ color: colors.text.secondary }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleAddTodo}
                                        disabled={isLoading || !newTodoTitle.trim()}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: colors.accent.primary,
                                            color: "#fff",
                                        }}
                                    >
                                        {isLoading ? "Adding..." : "Add Item"}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setShowAddForm(true)}
                                className="w-full mt-3 py-3 rounded-xl text-sm cursor-pointer flex items-center justify-center gap-2 transition-colors"
                                style={{
                                    border: `1px dashed ${colors.border.default}`,
                                    color: colors.text.tertiary,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = colors.accent.primary;
                                    e.currentTarget.style.color = colors.accent.primary;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = colors.border.default;
                                    e.currentTarget.style.color = colors.text.tertiary;
                                }}
                            >
                                <RiAddLine size={16} />
                                Add item
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Tip */}
                    <p
                        className="text-xs mt-3 text-center"
                        style={{ color: colors.text.tertiary }}
                    >
                        💡 Right-click on an item to edit or delete
                    </p>
                </section>

                {/* Summary Section */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl p-4"
                    style={{
                        background: colors.bg.raised,
                        border: `1px solid ${colors.border.subtle}`,
                    }}
                >
                    <div className="flex items-center justify-between text-sm mb-3">
                        <span style={{ color: colors.text.tertiary }}>Total Deducted</span>
                        <span
                            className="font-medium tabular-nums"
                            style={{ color: colors.text.primary }}
                        >
                            ${totalDeducted.toFixed(2)}
                        </span>
                    </div>
                    <div
                        className="my-3"
                        style={{ height: 1, background: colors.border.subtle }}
                    />
                    <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.tertiary }}>Remaining</span>
                        <span
                            className="text-lg font-semibold tabular-nums"
                            style={{
                                color: remaining.isNegative()
                                    ? colors.status.negative
                                    : colors.status.positive,
                            }}
                        >
                            ${remaining.toFixed(2)}
                        </span>
                    </div>
                </motion.section>
            </main>
        </motion.div>
    );
}
