"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { useTheme } from "next-themes";
import {
    RiCloseLine,
    RiTimeLine,
    RiBookmarkLine,
    RiSettings4Line,
    RiQuestionLine,
    RiSunLine,
    RiMoonLine,
    RiComputerLine,
} from "@remixicon/react";
import { colors } from "@/styles/tokens";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: "recent" | "saved";
    onTabChange: (tab: "recent" | "saved") => void;
}

export function Sidebar({ isOpen, onClose, activeTab, onTabChange }: SidebarProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);

    // Avoid hydration mismatch for theme icon
    useEffect(() => {
        setMounted(true);
    }, []);

    const cycleTheme = useCallback(() => {
        // Toggle between system and dark (light theme coming later)
        if (theme === "system") {
            setTheme("dark");
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

    const handleTabClick = useCallback((tab: "recent" | "saved") => {
        onTabChange(tab);
        onClose();
    }, [onTabChange, onClose]);

    // Handle swipe to close (drag left)
    const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // If dragged left more than 100px or velocity is high, close
        if (info.offset.x < -100 || info.velocity.x < -500) {
            onClose();
        }
    }, [onClose]);

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
                        className="fixed inset-0 z-50"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                        onClick={onClose}
                    />

                    {/* Side Panel */}
                    <motion.aside
                        ref={sidebarRef}
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        drag="x"
                        dragConstraints={{ left: -280, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={handleDragEnd}
                        className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col touch-pan-y"
                        style={{ background: colors.bg.raised }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-4 py-4"
                            style={{
                                borderBottom: `1px solid ${colors.border.subtle}`,
                                paddingTop: "max(1rem, env(safe-area-inset-top))",
                            }}
                        >
                            <span className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                                Tin
                            </span>
                            <button
                                onClick={onClose}
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
                                    onClick={() => handleTabClick(item.label.toLowerCase() as "recent" | "saved")}
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

                            {/* Theme Toggle */}
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
                                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                            }}
                        >
                            v0.1.1
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

// Hook to detect swipe-from-left-edge gesture (Android)
export function useSwipeToOpenSidebar(onOpen: () => void) {
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    useEffect(() => {
        const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (!isTouchDevice()) return; // Only enable on touch devices

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStartX.current = touch.clientX;
            touchStartY.current = touch.clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX.current;
            const deltaY = touch.clientY - touchStartY.current;

            // Swipe right from left edge (within 30px of left edge)
            // Must be horizontal swipe (deltaX > deltaY) and at least 50px
            if (
                touchStartX.current < 30 &&
                deltaX > 50 &&
                Math.abs(deltaX) > Math.abs(deltaY)
            ) {
                onOpen();
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [onOpen]);
}
