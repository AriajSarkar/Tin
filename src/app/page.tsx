"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TopBar } from "@/components/TopBar";
import { CardGrid } from "@/components/CardGrid";
import { CardView } from "@/components/CardView";
import { RecentChanges } from "@/components/RecentChanges";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Card, CardWithTodos, ChangeLog } from "@/lib/types";
import * as api from "@/lib/api";
import { colors } from "@/styles/tokens";
import type { SearchFilterType } from "@/components/SearchFilters";

type TabType = "recent" | "saved";
type SelectionAction = "delete" | "move" | null;

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [archivedCards, setArchivedCards] = useState<Card[]>([]);
  const [changes, setChanges] = useState<ChangeLog[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardWithTodos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  // Search filter state
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>("all");
  const [amountRange, setAmountRange] = useState({ min: "", max: "" });
  const [dateFilter, setDateFilter] = useState("");

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [selectionAction, setSelectionAction] = useState<SelectionAction>(null);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    onConfirm: () => { },
  });



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

  // Restore active card from persistence on mount
  useEffect(() => {
    const restoreActiveCard = async () => {
      const persistedId = localStorage.getItem("activeCardId");
      if (persistedId) {
        try {
          const fullCard = await api.getCard(persistedId);
          setSelectedCard(fullCard);
        } catch (error) {
          console.error("Failed to restore card:", error);
          localStorage.removeItem("activeCardId");
        }
      }
    };
    restoreActiveCard();
  }, []);

  const loadArchivedCards = useCallback(async () => {
    try {
      const archivedData = await api.listArchivedCards();
      setArchivedCards(archivedData);
    } catch (error) {
      console.error("Failed to load archived cards:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load archived cards when switching to Saved tab
  useEffect(() => {
    if (activeTab === "saved") {
      loadArchivedCards();
    }
  }, [activeTab, loadArchivedCards]);

  // Android back button navigation - use browser history to navigate back through app
  useEffect(() => {
    const handlePopState = () => {
      // If viewing a card, go back to dashboard
      if (selectedCard) {
        setSelectedCard(null);
        localStorage.removeItem("activeCardId");
        loadData();
        // Push another state so back button works again
        window.history.pushState({ screen: "dashboard" }, "");
      }
      // If on dashboard, allow default (app close on Android)
    };

    // Push initial state when component mounts
    window.history.pushState({ screen: "dashboard" }, "");
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [selectedCard, loadData]);

  // Filter cards based on search query, filter type, and active tab
  const baseCards = activeTab === "saved" ? archivedCards : cards;
  const filteredCards = baseCards.filter((card) => {
    // Text search
    if (searchQuery) {
      const matchesTitle = card.title?.toLowerCase().includes(searchQuery.toLowerCase());
      // For cards filter, only check title
      if (searchFilter === "cards" && !matchesTitle) return false;
      // For todos filter, skip cards-only matching (would need to load todos)
      if (searchFilter === "todos") return true; // API handles this
      // For all/date/amount, include title match
      if (searchFilter === "all" && !matchesTitle) return false;
    }

    // Date filter
    if (searchFilter === "date" && dateFilter) {
      const cardDate = new Date(card.created_at).toISOString().split('T')[0];
      if (cardDate !== dateFilter) return false;
    }

    // Amount filter
    if (searchFilter === "amount") {
      const amount = parseFloat(card.amount);
      const min = amountRange.min ? parseFloat(amountRange.min) : -Infinity;
      const max = amountRange.max ? parseFloat(amountRange.max) : Infinity;
      if (amount < min || amount > max) return false;
    }

    return true;
  });

  // displayedCards is filtered cards
  const displayedCards = filteredCards;

  const handleSearch = useCallback((
    query: string,
    filter?: SearchFilterType,
    range?: { min: string; max: string },
    date?: string
  ) => {
    setSearchQuery(query);
    if (filter !== undefined) setSearchFilter(filter);
    if (range !== undefined) setAmountRange(range);
    if (date !== undefined) setDateFilter(date);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    // Exit selection mode when changing tabs
    setIsSelectionMode(false);
    setSelectedCardIds(new Set());
    setSelectionAction(null);
  }, []);

  const handleAddCard = useCallback(async () => {
    try {
      const newCard = await api.createCard("New Card", "0");
      setCards((prev) => [newCard, ...prev]);
      const fullCard = await api.getCard(newCard.id);
      setSelectedCard(fullCard);
      localStorage.setItem("activeCardId", newCard.id);
      // Push history state for Android back button navigation
      window.history.pushState({ screen: "cardView", cardId: newCard.id }, "");
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  }, []);

  const handleCardClick = useCallback(async (cardId: string) => {
    try {
      const fullCard = await api.getCard(cardId);
      setSelectedCard(fullCard);
      localStorage.setItem("activeCardId", cardId);
      // Push history state for Android back button navigation
      window.history.pushState({ screen: "cardView", cardId }, "");
    } catch (error) {
      console.error("Failed to load card:", error);
    }
  }, []);

  // Single card delete with themed modal
  const handleDeleteCard = useCallback((cardId: string) => {

    setConfirmState({
      isOpen: true,
      title: "Delete Card",
      message: "Are you sure you want to delete this card? This action cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await api.deleteCard(cardId);
          setCards((prev) => prev.filter((c) => c.id !== cardId));
          // If the deleted card was active (shouldn't happen in this view but good safety)
          if (selectedCard?.id === cardId) {
            setSelectedCard(null);
            localStorage.removeItem("activeCardId");
          }
        } catch (error) {
          console.error("Failed to delete card:", error);
        }

        setConfirmState(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [selectedCard?.id]);

  const handleBack = useCallback(() => {
    setSelectedCard(null);
    localStorage.removeItem("activeCardId");
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


  const handleToggleSelect = useCallback((cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCardIds(new Set(displayedCards.map(c => c.id)));
  }, [displayedCards]);

  const handleDeselectAll = useCallback(() => {
    setSelectedCardIds(new Set());
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedCardIds(new Set());
    setSelectionAction(null);
  }, []);

  // Handler for entering selection mode via hold/right-click on a card
  const handleEnterSelectionModeWithCard = useCallback((cardId: string) => {
    setIsSelectionMode(true);
    setSelectedCardIds(new Set([cardId]));
    setSelectionAction(null); // Show both options
  }, []);

  // Multi-delete with themed modal - works for both tabs
  const handleDeleteSelected = useCallback(() => {
    if (selectedCardIds.size === 0) return;

    const count = selectedCardIds.size;
    setConfirmState({
      isOpen: true,
      title: "Delete Cards",
      message: `Are you sure you want to delete ${count} card${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await Promise.all([...selectedCardIds].map(id => api.deleteCard(id)));
          // Update local state for both tabs
          setCards((prev) => prev.filter((c) => !selectedCardIds.has(c.id)));
          setArchivedCards((prev) => prev.filter((c) => !selectedCardIds.has(c.id)));
          handleExitSelectionMode();
          loadData();
          if (activeTab === "saved") {
            loadArchivedCards();
          }
        } catch (error) {
          console.error("Failed to delete cards:", error);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [selectedCardIds, handleExitSelectionMode, loadData, loadArchivedCards, activeTab]);

  const handleMoveToSaved = useCallback(async () => {
    if (selectedCardIds.size === 0) return;

    try {
      // Archive selected cards
      await Promise.all([...selectedCardIds].map(id => api.archiveCard(id)));
      handleExitSelectionMode();
      loadData();
    } catch (error) {
      console.error("Failed to move cards to saved:", error);
    }
  }, [selectedCardIds, handleExitSelectionMode, loadData]);

  const handleMoveToRecent = useCallback(async () => {
    if (selectedCardIds.size === 0) return;

    try {
      // Unarchive selected cards
      await Promise.all([...selectedCardIds].map(id => api.unarchiveCard(id)));
      handleExitSelectionMode();
      loadArchivedCards();
      loadData();
    } catch (error) {
      console.error("Failed to move cards to recent:", error);
    }
  }, [selectedCardIds, handleExitSelectionMode, loadArchivedCards, loadData]);


  const handleCloseConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));

  }, []);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: colors.bg.base }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm"
          style={{ color: colors.text.tertiary }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: colors.bg.base }}
    >
      <AnimatePresence mode="wait">
        {selectedCard ? (
          <CardView
            key="card-view"
            card={selectedCard}
            onBack={handleBack}
            onUpdate={handleCardUpdate}
          />
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TopBar
              onSearch={handleSearch}
              onAddCard={handleAddCard}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            <main className="max-w-2xl mx-auto px-4 py-5">
              {/* Recent Changes Section */}
              {activeTab === "recent" && !searchQuery && !isSelectionMode && (
                <RecentChanges changes={changes} onCardClick={handleCardClick} />
              )}

              {/* Cards Section */}
              <section>
                <h2
                  className="section-header"
                  style={{ color: colors.text.tertiary }}
                >
                  {searchQuery ? `Search: "${searchQuery}"` : activeTab === "saved" ? "Saved Cards" : "Cards"}
                </h2>
                <CardGrid
                  cards={displayedCards}
                  onCardClick={handleCardClick}
                  onDeleteCard={handleDeleteCard}
                  onEnterSelectionMode={handleEnterSelectionModeWithCard}
                  isSelectionMode={isSelectionMode}
                  selectedIds={selectedCardIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onDeleteSelected={handleDeleteSelected}
                  onMoveToSaved={handleMoveToSaved}
                  onMoveToRecent={handleMoveToRecent}
                  onExitSelectionMode={handleExitSelectionMode}
                  selectionAction={selectionAction}
                  isSavedTab={activeTab === "saved"}
                />
              </section>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Themed Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        confirmVariant="danger"
        onConfirm={confirmState.onConfirm}
        onCancel={handleCloseConfirm}
      />
    </div>
  );
}
