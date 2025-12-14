"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { TopBar } from "@/components/TopBar";
import { CardGrid } from "@/components/CardGrid";
import { CardView } from "@/components/CardView";
import { RecentChanges } from "@/components/RecentChanges";
import type { Card, CardWithTodos, ChangeLog } from "@/lib/types";
import * as api from "@/lib/api";

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [changes, setChanges] = useState<ChangeLog[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardWithTodos | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [cardsData, changesData] = await Promise.all([
        api.listCards(),
        api.recentChanges(10),
      ]);
      setCards(cardsData);
      setChanges(changesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadData();
      return;
    }

    try {
      const results = await api.search(query);
      const uniqueCardIds = [...new Set(results.map((r) => r.card_id))];
      const filteredCards = cards.filter((c) => uniqueCardIds.includes(c.id));
      setCards(filteredCards);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, [cards, loadData]);

  const handleAddCard = useCallback(async () => {
    try {
      const newCard = await api.createCard("New Card", "0");
      setCards((prev) => [newCard, ...prev]);
      const fullCard = await api.getCard(newCard.id);
      setSelectedCard(fullCard);
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  }, []);

  const handleCardClick = useCallback(async (cardId: string) => {
    try {
      const fullCard = await api.getCard(cardId);
      setSelectedCard(fullCard);
    } catch (error) {
      console.error("Failed to load card:", error);
    }
  }, []);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    if (!confirm("Delete this card?")) return;

    try {
      await api.deleteCard(cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCard(null);
    loadData();
  }, [loadData]);

  const handleCardUpdate = useCallback(async () => {
    if (selectedCard) {
      const updated = await api.getCard(selectedCard.id);
      setSelectedCard(updated);
    }
    const changesData = await api.recentChanges(10);
    setChanges(changesData);
  }, [selectedCard]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AnimatePresence mode="wait">
        {selectedCard ? (
          <CardView
            key="card-view"
            card={selectedCard}
            onBack={handleBack}
            onUpdate={handleCardUpdate}
          />
        ) : (
          <div key="dashboard">
            <TopBar onSearch={handleSearch} onAddCard={handleAddCard} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <RecentChanges changes={changes} onCardClick={handleCardClick} />

              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Your Cards
                </h2>
                <CardGrid
                  cards={cards}
                  onCardClick={handleCardClick}
                  onDeleteCard={handleDeleteCard}
                />
              </section>
            </main>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
