"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CardWithTodos, Todo } from "@/lib/types";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencySelector } from "./CurrencySelector";
import { TodoItem } from "./TodoItem";
import { RiArrowLeftLine, RiAddLine, RiSearchLine, RiSortAsc, RiSortDesc, RiCloseLine, RiExchangeLine } from "@remixicon/react";
import { colors } from "@/styles/tokens";
import { safeDecimal, formatAmount, formatWithCommas, parseShorthand, formatGenZ, isValidAmountInput } from "@/utils/amount";
import { isAndroid } from "@/utils/platform";

import Decimal from "decimal.js";
import * as api from "@/lib/api";

interface CardViewProps {
    card: CardWithTodos;
    onBack: () => void;
    onUpdate: () => void;
}

export function CardView({ card, onBack, onUpdate }: CardViewProps) {
    const { currency, setCurrency, symbol, allCurrencies } = useCurrency();
    const [showCurrencySelector, setShowCurrencySelector] = useState(false);
    const [title, setTitle] = useState(card.title || "");
    const [amount, setAmount] = useState(formatWithCommas(card.amount));
    const [todos, setTodos] = useState<Todo[]>(card.todos);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTodoTitle, setNewTodoTitle] = useState("");
    const [newTodoAmount, setNewTodoAmount] = useState("");
    const [useCurrentTime, setUseCurrentTime] = useState(true);
    const [scheduledAt, setScheduledAt] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Todo search and sort state
    const [todoSearch, setTodoSearch] = useState("");
    const [showTodoSearch, setShowTodoSearch] = useState(false);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // desc = newest first

    // Keyboard shortcuts for todo search (Ctrl+K to toggle, ESC to close)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K to toggle todo search
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setShowTodoSearch(prev => !prev);
            }
            // ESC to close todo search
            if (e.key === "Escape" && showTodoSearch) {
                setShowTodoSearch(false);
                setTodoSearch("");
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showTodoSearch]);

    useEffect(() => {
        setTitle(card.title || "");
        setAmount(formatWithCommas(card.amount));
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
        // Parse shorthand (k, m, b) - also handles stripping commas
        const parsed = parseShorthand(amount);

        // Check 1B limit
        if (parsed.overLimit) {
            alert("You should hire an accountant for that amount of money 🫠🙃");
            setAmount(formatWithCommas(card.amount)); // Reset to original
            return;
        }

        const formatted = formatAmount(parsed.num.toString());
        setAmount(formatWithCommas(parsed.num.toString())); // Display with commas

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
            setAmount(formatWithCommas(result.updated_card.amount));
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

    const handleEditTodo = useCallback(async (todoId: string, newTitle: string, newAmount?: string, newScheduledAt?: string) => {
        await api.updateTodo(todoId, newTitle, newAmount, undefined, newScheduledAt);
        setTodos((prev) =>
            prev.map((t) =>
                t.id === todoId
                    ? { ...t, title: newTitle, amount: newAmount || t.amount, scheduled_at: newScheduledAt || t.scheduled_at }
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
                    paddingTop: "env(safe-area-inset-top, 0px)", // Respect status bar
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
                        <motion.button
                            onClick={() => setShowCurrencySelector(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xl font-medium cursor-pointer px-2 py-1 -ml-1 rounded-lg flex items-center gap-1.5 transition-all"
                            style={{
                                color: colors.accent.primary,
                                background: colors.accent.muted,
                            }}
                            title="Click to change currency"
                        >
                            {symbol}
                            <RiExchangeLine size={14} style={{ opacity: 0.7 }} />
                        </motion.button>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount === "0" || amount === "0.00" ? "" : amount}
                            onChange={handleAmountChange}
                            onBlur={handleAmountBlur}
                            placeholder="0.00"
                            className="text-3xl font-semibold bg-transparent border-none outline-none w-full tabular-nums"
                            style={{
                                color: colors.text.primary,
                            }}
                        />
                    </div>
                    {/* Gen Z friendly display & shorthand tip (hidden on Android) */}
                    <div className="flex justify-between items-center mt-2">
                        {!isAndroid() && (
                            <span className="text-xs" style={{ color: colors.text.tertiary }}>
                                Tip: Use k, m, b (e.g., 100k = 100,000)
                            </span>
                        )}
                        {parseFloat(amount) >= 1000 && (
                            <span className="text-xs font-medium" style={{ color: colors.accent.primary }}>
                                ≈ {formatGenZ(parseFloat(amount))}
                            </span>
                        )}
                    </div>
                </motion.section>

                {/* Summary Section - NOW ABOVE ITEMS */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl p-4 mb-5"
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
                            {symbol}{formatWithCommas(totalDeducted.toString())}
                        </span>
                    </div>
                    <div
                        className="my-3"
                        style={{ height: 1, background: colors.border.subtle }}
                    />
                    <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.tertiary }}>Remaining</span>
                        <div className="text-right">
                            <span
                                className="text-lg font-semibold tabular-nums"
                                style={{
                                    color: remaining.isNegative()
                                        ? colors.status.negative
                                        : colors.status.positive,
                                }}
                            >
                                {symbol}{formatWithCommas(remaining.toString())}
                            </span>
                            {Math.abs(remaining.toNumber()) >= 1000 && (
                                <div
                                    className="text-xs"
                                    style={{
                                        color: remaining.isNegative()
                                            ? colors.status.negative
                                            : colors.status.positive,
                                        opacity: 0.8
                                    }}
                                >
                                    ≈ {formatGenZ(remaining.toNumber())}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* Add Item Section - NOW ABOVE ITEMS LIST */}
                <AnimatePresence>
                    {showAddForm ? (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="mb-4 rounded-xl p-4"
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
                                    <label
                                        className="flex items-center gap-1.5 text-xs cursor-pointer p-2 rounded-lg"
                                        style={{
                                            color: colors.text.secondary,
                                            background: colors.bg.surface,
                                            border: `1px solid ${colors.border.subtle}`,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!useCurrentTime}
                                            onChange={(e) => setUseCurrentTime(!e.target.checked)}
                                            className="accent-emerald-500"
                                        />
                                        Schedule
                                    </label>
                                </div>
                            </div>

                            {/* Datetime picker - shown when Schedule is checked */}
                            {!useCurrentTime && (
                                <div className="mb-3">
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="w-full p-2 rounded-lg text-sm outline-none"
                                        style={{
                                            background: colors.bg.surface,
                                            border: `1px solid ${colors.border.subtle}`,
                                            color: colors.text.primary,
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewTodoTitle("");
                                        setNewTodoAmount("");
                                        setScheduledAt("");
                                        setUseCurrentTime(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
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
                            className="w-full mb-4 py-3 rounded-xl text-sm cursor-pointer flex items-center justify-center gap-2 transition-colors"
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

                {/* Items Section - NOW BELOW ADD BUTTON */}
                <section className="mb-5">
                    {/* Header with search icon and item count */}
                    <div className="flex items-center justify-between mb-3">
                        <h2
                            className="text-sm font-medium"
                            style={{ color: colors.text.primary }}
                        >
                            Items
                        </h2>
                        <div className="flex items-center gap-2">
                            {/* Search icon */}
                            <button
                                onClick={() => setShowTodoSearch(!showTodoSearch)}
                                className="p-1 rounded transition-colors cursor-pointer"
                                style={{
                                    color: showTodoSearch ? colors.accent.primary : colors.text.tertiary,
                                }}
                                title="Search todos"
                            >
                                <RiSearchLine size={14} />
                            </button>
                            <span
                                className="text-xs"
                                style={{ color: colors.text.tertiary }}
                            >
                                {todos.length} item{todos.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>

                    {/* Inline search bar (shown when search icon clicked) */}
                    <AnimatePresence>
                        {showTodoSearch && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="mb-3"
                            >
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={todoSearch}
                                        onChange={(e) => setTodoSearch(e.target.value)}
                                        placeholder="Search todos..."
                                        className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                        style={{
                                            background: colors.bg.surface,
                                            border: `1px solid ${colors.border.subtle}`,
                                            color: colors.text.primary,
                                        }}
                                        autoFocus
                                    />
                                    {todoSearch && (
                                        <button
                                            onClick={() => setTodoSearch("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                            style={{ color: colors.text.tertiary }}
                                        >
                                            <RiCloseLine size={14} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scrollable items container - Android: 4 items (~200px), Windows: 15 items (~750px) */}
                    <div
                        className="overflow-y-auto max-h-[200px] sm:max-h-[750px]"
                        style={{
                            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-2">
                                {todos
                                    .filter(todo =>
                                        !todoSearch ||
                                        todo.title.toLowerCase().includes(todoSearch.toLowerCase())
                                    )
                                    .sort((a, b) => {
                                        const dateA = new Date(a.created_at).getTime();
                                        const dateB = new Date(b.created_at).getTime();
                                        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
                                    })
                                    .map((todo) => (
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
                    </div>

                    {/* Sort buttons - after items list */}
                    <div className="flex items-center justify-end gap-2 mt-3">
                        <span className="text-xs" style={{ color: colors.text.tertiary }}>
                            Sort:
                        </span>
                        <button
                            onClick={() => setSortOrder("asc")}
                            className="p-1.5 rounded transition-colors cursor-pointer"
                            style={{
                                background: sortOrder === "asc" ? colors.bg.surface : "transparent",
                                color: sortOrder === "asc" ? colors.accent.primary : colors.text.tertiary,
                                border: sortOrder === "asc" ? `1px solid ${colors.border.subtle}` : "1px solid transparent",
                            }}
                            title="Oldest first"
                        >
                            <RiSortAsc size={14} />
                        </button>
                        <button
                            onClick={() => setSortOrder("desc")}
                            className="p-1.5 rounded transition-colors cursor-pointer"
                            style={{
                                background: sortOrder === "desc" ? colors.bg.surface : "transparent",
                                color: sortOrder === "desc" ? colors.accent.primary : colors.text.tertiary,
                                border: sortOrder === "desc" ? `1px solid ${colors.border.subtle}` : "1px solid transparent",
                            }}
                            title="Newest first"
                        >
                            <RiSortDesc size={14} />
                        </button>
                    </div>

                </section>
            </main>

            <CurrencySelector
                isOpen={showCurrencySelector}
                onClose={() => setShowCurrencySelector(false)}
                onSelect={setCurrency}
                currentCurrency={currency}
                allCurrencies={allCurrencies}
            />
        </motion.div>
    );
}
