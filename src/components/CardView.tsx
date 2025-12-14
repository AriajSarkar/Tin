"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CardWithTodos, Todo } from "@/lib/types";
import { TodoItem } from "./TodoItem";
import { Icon } from "./Icon";
import Decimal from "decimal.js";
import * as api from "@/lib/api";

function safeDecimal(value: string | null | undefined): Decimal {
    try {
        return new Decimal(value || "0");
    } catch {
        return new Decimal(0);
    }
}

interface CardViewProps {
    card: CardWithTodos;
    onBack: () => void;
    onUpdate: () => void;
}

export function CardView({ card, onBack, onUpdate }: CardViewProps) {
    const [title, setTitle] = useState(card.title || "");
    const [amount, setAmount] = useState(card.amount);
    const [todos, setTodos] = useState<Todo[]>(card.todos);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTodoTitle, setNewTodoTitle] = useState("");
    const [newTodoAmount, setNewTodoAmount] = useState("");
    const [useCurrentTime, setUseCurrentTime] = useState(true);
    const [scheduledAt, setScheduledAt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

    useEffect(() => {
        setTitle(card.title || "");
        setAmount(card.amount);
        setTodos(card.todos);
    }, [card]);

    const totalDeducted = todos.reduce((sum, todo) => {
        return sum.plus(safeDecimal(todo.amount));
    }, new Decimal(0));

    const handleTitleBlur = useCallback(async () => {
        if (title !== card.title) {
            await api.updateCard(card.id, title || null);
            onUpdate();
        }
    }, [card.id, card.title, title, onUpdate]);

    const handleAmountBlur = useCallback(async () => {
        if (amount !== card.amount) {
            await api.updateCard(card.id, undefined, amount);
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
            setAmount(result.updated_card.amount);
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

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-900"
        >
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        ←
                    </motion.button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        placeholder="Card title..."
                        className="flex-1 text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 mb-6 shadow-xl shadow-blue-500/20"
                >
                    <label className="text-sm font-medium text-white/80 block mb-2">
                        Main Balance
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl text-white/80">$</span>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onBlur={handleAmountBlur}
                            className="text-4xl font-bold bg-transparent border-none outline-none text-white w-full"
                        />
                    </div>
                </motion.section>

                <section className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Items
                        </h2>
                        <span className="text-sm text-gray-500">
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
                                    onEdit={(id) => setEditingTodoId(id)}
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
                                className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                            >
                                <input
                                    type="text"
                                    value={newTodoTitle}
                                    onChange={(e) => setNewTodoTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 mb-3"
                                    autoFocus
                                />

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 block mb-1">
                                            Amount (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={newTodoAmount}
                                            onChange={(e) => setNewTodoAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-gray-100 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-500 block mb-1">
                                            Date/Time
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                                                    className="flex-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none outline-none text-gray-900 dark:text-gray-100 text-sm"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleAddTodo}
                                        disabled={isLoading || !newTodoTitle.trim()}
                                        className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? "Adding..." : "Add Item"}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowAddForm(true)}
                                className="w-full mt-4 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                            >
                                <Icon name="plus" size={20} />
                                Add item
                            </motion.button>
                        )}
                    </AnimatePresence>
                </section>

                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                >
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Total Deducted</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            ${totalDeducted.toFixed(2)}
                        </span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-3" />
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Remaining</span>
                        <span
                            className={`text-xl font-bold ${safeDecimal(amount).isNegative()
                                ? "text-red-500"
                                : "text-green-500"
                                }`}
                        >
                            ${safeDecimal(amount).toFixed(2)}
                        </span>
                    </div>
                </motion.section>
            </main>
        </motion.div>
    );
}
