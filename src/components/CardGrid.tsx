"use client";

import { motion } from "motion/react";
import type { Card } from "@/lib/types";
import { CardItem } from "./CardItem";

interface CardGridProps {
    cards: Card[];
    onCardClick: (cardId: string) => void;
    onDeleteCard: (cardId: string) => void;
}

export function CardGrid({ cards, onCardClick, onDeleteCard }: CardGridProps) {
    if (cards.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <span className="text-4xl">💳</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No cards yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    Create your first expense card to start tracking your spending.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            {cards.map((card, index) => (
                <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <CardItem
                        card={card}
                        onClick={() => onCardClick(card.id)}
                        onDelete={() => onDeleteCard(card.id)}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}
