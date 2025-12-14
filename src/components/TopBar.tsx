"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";
import {
    RiSearchLine,
    RiAddLine,
    RiSunLine,
    RiMoonLine,
    RiMenuLine,
    RiCloseLine,
    RiTimeLine,
    RiBookmarkLine,
    RiSettings4Line,
    RiQuestionLine,
    RiComputerLine,
    RiMore2Fill,
    RiCheckboxMultipleLine,
    RiDeleteBinLine,
    RiArchiveLine
} from "@remixicon/react";
import { colors } from "@/styles/tokens";

interface TopBarProps {
    onSearch: (query: string) => void;
    onAddCard: () => void;
    activeTab?: "recent" | "saved";
    onTabChange?: (tab: "recent" | "saved") => void;
    onEnterEditMode?: () => void;
    onDeleteSelected?: () => void;
    onMoveToSaved?: () => void;
    isEditMode?: boolean;
}

export function TopBar({
    onSearch,
    onAddCard,
    activeTab = "recent",
    onTabChange,
    onEnterEditMode,
    onDeleteSelected,
    onMoveToSaved,
    isEditMode = false
}: TopBarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle ESC key to close search/menu
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Close on ESC
            if (e.key === "Escape") {
                if (showSearch) {
                    setShowSearch(false);
                    setSearchQuery("");
                    onSearch("");
                }
                if (showMenu) {
                    setShowMenu(false);
                }
            }
            // Toggle search on Ctrl+K / Cmd+K
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setShowSearch(prev => !prev);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showSearch, showMenu, onSearch]);

    // Focus search input when opened
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    // Live search as user types
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        onSearch(value);
    }, [onSearch]);

    const handleTabClick = useCallback((tab: "recent" | "saved") => {
        onTabChange?.(tab);
    }, [onTabChange]);

    const cycleTheme = useCallback(() => {
        // Cycle: system -> dark -> light (coming soon message) -> system
        if (theme === "system") {
            setTheme("dark");
        } else if (theme === "dark") {
            // Light theme coming soon - show alert and stay on dark
            alert("Light theme coming soon!");
        } else {
            setTheme("system");
        }
    }, [theme, setTheme]);

    const getThemeIcon = () => {
        if (!mounted) return <RiComputerLine size={16} />;

        if (theme === "system") {
            return <RiComputerLine size={16} />;
        }
        return resolvedTheme === "dark" ? <RiMoonLine size={16} /> : <RiSunLine size={16} />;
    };

    return (
        <>
            <motion.header
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                    background: colors.bg.base,
                    borderBottom: `1px solid ${colors.border.subtle}`,
                    paddingTop: "env(safe-area-inset-top, 0px)", // Respect status bar
                }}
                className="sticky top-0 z-50"
            >
                <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-center justify-between h-12">
                        {/* Left: Hamburger + Logo */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowMenu(true)}
                                className="p-1.5 rounded-md cursor-pointer"
                                style={{ color: colors.text.tertiary }}
                                onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <RiMenuLine size={18} />
                            </motion.button>
                            <span
                                className="text-sm font-medium tracking-tight"
                                style={{ color: colors.text.secondary }}
                            >
                                Tin
                            </span>
                        </div>

                        {/* Center: Recent / Saved toggle */}
                        <div
                            className="flex items-center gap-0.5 px-1 py-0.5 rounded-lg"
                            style={{ background: colors.bg.surface }}
                        >
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleTabClick("recent")}
                                className="px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-all duration-150"
                                style={{
                                    background: activeTab === "recent" ? colors.bg.hover : "transparent",
                                    color: activeTab === "recent" ? colors.text.primary : colors.text.tertiary,
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== "recent") {
                                        e.currentTarget.style.color = colors.text.secondary;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== "recent") {
                                        e.currentTarget.style.color = colors.text.tertiary;
                                    }
                                }}
                            >
                                Recent
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleTabClick("saved")}
                                className="px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-all duration-150"
                                style={{
                                    background: activeTab === "saved" ? colors.bg.hover : "transparent",
                                    color: activeTab === "saved" ? colors.text.primary : colors.text.tertiary,
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== "saved") {
                                        e.currentTarget.style.color = colors.text.secondary;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== "saved") {
                                        e.currentTarget.style.color = colors.text.tertiary;
                                    }
                                }}
                            >
                                Saved
                            </motion.button>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-0.5">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowSearch(!showSearch)}
                                className="p-2 rounded-md cursor-pointer transition-colors duration-150"
                                style={{
                                    color: showSearch ? colors.accent.primary : colors.text.tertiary,
                                    background: showSearch ? colors.accent.muted : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                    if (!showSearch) e.currentTarget.style.background = colors.bg.hover;
                                }}
                                onMouseLeave={(e) => {
                                    if (!showSearch) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <RiSearchLine size={16} />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={cycleTheme}
                                className="hidden sm:block p-2 rounded-md cursor-pointer transition-colors duration-150"
                                style={{ color: colors.text.tertiary }}
                                onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.hover}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                title={mounted ? `Theme: ${theme}` : "Theme"}
                            >
                                {getThemeIcon()}
                            </motion.button>

                            {/* Three-dot menu for card actions */}
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                                    className="p-2 rounded-md cursor-pointer transition-colors duration-150"
                                    style={{
                                        color: showActionsMenu || isEditMode ? colors.accent.primary : colors.text.tertiary,
                                        background: showActionsMenu ? colors.accent.muted : "transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!showActionsMenu) e.currentTarget.style.background = colors.bg.hover;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!showActionsMenu) e.currentTarget.style.background = 'transparent';
                                    }}
                                    title="Card Actions"
                                >
                                    <RiMore2Fill size={16} />
                                </motion.button>

                                {/* Actions dropdown */}
                                <AnimatePresence>
                                    {showActionsMenu && (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.1 }}
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowActionsMenu(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                transition={{ duration: 0.12, ease: "easeOut" }}
                                                className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden py-1 min-w-[160px]"
                                                style={{
                                                    background: colors.bg.raised,
                                                    border: `1px solid ${colors.border.subtle}`,
                                                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        onMoveToSaved?.();
                                                        setShowActionsMenu(false);
                                                    }}
                                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-100"
                                                    style={{ color: colors.text.secondary }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.surface}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <RiArchiveLine size={14} />
                                                    Select to move
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onDeleteSelected?.();
                                                        setShowActionsMenu(false);
                                                    }}
                                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-100"
                                                    style={{ color: colors.status.negative }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.surface}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <RiDeleteBinLine size={14} />
                                                    Select to delete
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.button
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onAddCard}
                                className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs font-medium ml-1 cursor-pointer transition-all duration-150"
                                style={{
                                    background: colors.accent.muted,
                                    color: colors.accent.primary,
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = colors.accent.primary + "30"}
                                onMouseLeave={(e) => e.currentTarget.style.background = colors.accent.muted}
                            >
                                <RiAddLine size={16} />
                                <span className="hidden sm:inline">New</span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Inline Search Bar */}
                <AnimatePresence>
                    {showSearch && (
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: -10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ borderTop: `1px solid ${colors.border.subtle}` }}
                        >
                            <div className="max-w-3xl mx-auto px-4 py-2">
                                <div className="relative">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        placeholder="Search cards, todos, or dates..."
                                        className="w-full px-4 py-2 text-sm rounded-lg outline-none"
                                        style={{
                                            background: colors.bg.surface,
                                            border: `1px solid ${colors.border.subtle}`,
                                            color: colors.text.primary,
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                onSearch("");
                                                searchInputRef.current?.focus();
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                            style={{ color: colors.text.tertiary }}
                                        >
                                            <RiCloseLine size={14} />
                                        </button>
                                    )}
                                </div>
                                <p
                                    className="text-xs mt-1.5 px-1 hidden sm:block"
                                    style={{ color: colors.text.tertiary }}
                                >
                                    Press <kbd className="px-1 py-0.5 rounded text-xs" style={{ background: colors.bg.hover }}>ESC</kbd> to close
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* Side Menu Overlay */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-50"
                            style={{ background: "rgba(0,0,0,0.5)" }}
                            onClick={() => setShowMenu(false)}
                        />

                        {/* Side Panel */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col"
                            style={{ background: colors.bg.raised }}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between px-4 py-4"
                                style={{
                                    borderBottom: `1px solid ${colors.border.subtle}`,
                                    paddingTop: "max(1rem, env(safe-area-inset-top))", // Respect notch/status bar
                                }}
                            >
                                <span className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                                    Tin
                                </span>
                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="p-1 rounded-md"
                                    style={{ color: colors.text.tertiary }}
                                >
                                    <RiCloseLine size={18} />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 py-2">
                                {[
                                    { icon: RiTimeLine, label: "Recent", active: activeTab === "recent" },
                                    { icon: RiBookmarkLine, label: "Saved", active: activeTab === "saved" },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            handleTabClick(item.label.toLowerCase() as "recent" | "saved");
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150"
                                        style={{
                                            color: item.active ? colors.text.primary : colors.text.secondary,
                                            background: item.active ? colors.bg.surface : "transparent",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!item.active) e.currentTarget.style.background = colors.bg.surface;
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!item.active) e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <item.icon size={16} />
                                        {item.label}
                                    </button>
                                ))}

                                <div
                                    className="my-2 mx-4"
                                    style={{ height: 1, background: colors.border.subtle }}
                                />

                                {[
                                    { icon: RiSettings4Line, label: "Settings" },
                                    { icon: RiQuestionLine, label: "Help / About" },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150"
                                        style={{ color: colors.text.secondary }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.surface}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    >
                                        <item.icon size={16} />
                                        {item.label}
                                    </button>
                                ))}

                                {/* Theme Toggle (Mobile) */}
                                <button
                                    onClick={cycleTheme}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150"
                                    style={{ color: colors.text.secondary }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = colors.bg.surface}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                    <span className="w-4 h-4 flex items-center justify-center">
                                        {getThemeIcon()}
                                    </span>
                                    Theme: <span className="capitalize">{theme}</span>
                                </button>
                            </nav>

                            {/* Footer */}
                            <div
                                className="px-4 py-3 text-xs"
                                style={{
                                    color: colors.text.tertiary,
                                    borderTop: `1px solid ${colors.border.subtle}`,
                                    paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", // Respect home indicator
                                }}
                            >
                                v0.1.0
                            </div>
                        </motion.aside>
                    </>
                )
                }
            </AnimatePresence >
        </>
    );
}
