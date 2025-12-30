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
import packageJson from "../../package.json";

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

                        {/* Footer with GitHub Link */}
                        <div
                            className="px-4 py-3"
                            style={{
                                borderTop: `1px solid ${colors.border.subtle}`,
                                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                            }}
                        >
                            <button
                                onClick={async () => {
                                    const { openUrl } = await import("@tauri-apps/plugin-opener");
                                    openUrl("https://github.com/AriajSarkar/Tin");
                                }}
                                className="flex items-center gap-2 w-full px-2 py-2 -mx-2 rounded-lg text-xs cursor-pointer transition-colors duration-150 mb-2"
                                style={{ color: colors.text.secondary }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = colors.accent.primary;
                                    e.currentTarget.style.background = colors.bg.surface;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = colors.text.secondary;
                                    e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                <span className="hidden sm:inline">Github Project</span>
                            </button>
                            <div className="text-xs" style={{ color: colors.text.tertiary }}>
                                v{packageJson.version}
                            </div>
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
