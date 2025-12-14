"use client";

import { useState, useCallback } from "react";
import { Icon } from "./Icon";
import { motion } from "motion/react";
import { useTheme } from "@/styles/theme";

interface TopBarProps {
    onSearch: (query: string) => void;
    onAddCard: () => void;
}

export function TopBar({ onSearch, onAddCard }: TopBarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const { theme, toggleTheme } = useTheme();

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            onSearch(searchQuery);
        },
        [onSearch, searchQuery]
    );

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Icon name="card" size={18} className="text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Tin
                            </span>
                        </motion.div>
                    </div>

                    <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
                        <div className="relative">
                            <Icon
                                name="search"
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search cards, todos, or dates (after:2024-01-01)"
                                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500"
                            />
                        </div>
                    </form>

                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {theme === "dark" ? "☀️" : "🌙"}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onAddCard}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                        >
                            <Icon name="plus" size={18} />
                            New Card
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
