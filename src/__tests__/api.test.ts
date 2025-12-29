/**
 * Comprehensive tests for API wrapper functions
 * These tests ensure Tauri invoke calls are correctly made and responses validated
 */

import { describe, it, expect, beforeEach } from "vitest";
import { mockInvoke } from "./setup";

// Import API functions
import * as api from "@/lib/api";

describe("listCards", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with list_cards command", async () => {
        mockInvoke.mockResolvedValue([]);
        await api.listCards();
        expect(mockInvoke).toHaveBeenCalledWith("list_cards", {});
    });

    it("should return parsed cards array", async () => {
        const mockCards = [
            {
                id: "card-1",
                title: "Test Card",
                amount: "100.000000",
                locked_amount: null,
                archived: false,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
                archived_at: null,
            },
        ];
        mockInvoke.mockResolvedValue(mockCards);

        const result = await api.listCards();
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("card-1");
    });

    it("should throw on invalid response", async () => {
        mockInvoke.mockResolvedValue([{ invalid: true }]);
        await expect(api.listCards()).rejects.toThrow();
    });
});

describe("getCard", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with get_card command and cardId", async () => {
        mockInvoke.mockResolvedValue({
            id: "card-1",
            title: "Test",
            amount: "100.000000",
            locked_amount: null,
            archived: false,
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
            archived_at: null,
            todos: [],
        });

        await api.getCard("card-1");
        expect(mockInvoke).toHaveBeenCalledWith("get_card", { cardId: "card-1" });
    });

    it("should return card with todos", async () => {
        const mockCard = {
            id: "card-1",
            title: "Test",
            amount: "100.000000",
            locked_amount: null,
            archived: false,
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
            archived_at: null,
            todos: [
                {
                    id: "todo-1",
                    card_id: "card-1",
                    title: "Buy milk",
                    amount: "5.000000",
                    done: false,
                    scheduled_at: null,
                    order_index: 1,
                    created_at: "2024-01-01T00:00:00.000Z",
                    updated_at: "2024-01-01T00:00:00.000Z",
                },
            ],
        };
        mockInvoke.mockResolvedValue(mockCard);

        const result = await api.getCard("card-1");
        expect(result.todos).toHaveLength(1);
        expect(result.todos[0].title).toBe("Buy milk");
    });
});

describe("createCard", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with create_card command", async () => {
        mockInvoke.mockResolvedValue({
            id: "new-card",
            title: "New Card",
            amount: "500.000000",
            locked_amount: null,
            archived: false,
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
            archived_at: null,
        });

        await api.createCard("New Card", "500.00");
        expect(mockInvoke).toHaveBeenCalledWith("create_card", {
            title: "New Card",
            amount: "500.00",
        });
    });

    it("should handle null title", async () => {
        mockInvoke.mockResolvedValue({
            id: "new-card",
            title: null,
            amount: "100.000000",
            locked_amount: null,
            archived: false,
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
            archived_at: null,
        });

        await api.createCard(null, "100.00");
        expect(mockInvoke).toHaveBeenCalledWith("create_card", {
            title: null,
            amount: "100.00",
        });
    });
});

describe("updateCard", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with update_card command", async () => {
        mockInvoke.mockResolvedValue({
            id: "card-1",
            title: "Updated Title",
            amount: "100.000000",
            locked_amount: null,
            archived: false,
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-02T00:00:00.000Z",
            archived_at: null,
        });

        await api.updateCard("card-1", "Updated Title");
        expect(mockInvoke).toHaveBeenCalledWith("update_card", {
            cardId: "card-1",
            title: "Updated Title",
            amount: undefined,
        });
    });

    it("should update amount only", async () => {
        mockInvoke.mockResolvedValue({
            id: "card-1",
            title: "Test",
            amount: "200.000000",
            locked_amount: null,
            archived: false,
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-02T00:00:00.000Z",
            archived_at: null,
        });

        await api.updateCard("card-1", undefined, "200.00");
        expect(mockInvoke).toHaveBeenCalledWith("update_card", {
            cardId: "card-1",
            title: undefined,
            amount: "200.00",
        });
    });
});

describe("deleteCard", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with delete_card command", async () => {
        mockInvoke.mockResolvedValue({ ok: true });

        await api.deleteCard("card-1");
        expect(mockInvoke).toHaveBeenCalledWith("delete_card", { cardId: "card-1" });
    });

    it("should return ok response", async () => {
        mockInvoke.mockResolvedValue({ ok: true });

        const result = await api.deleteCard("card-1");
        expect(result.ok).toBe(true);
    });
});

describe("addTodo", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with add_todo command and all params", async () => {
        mockInvoke.mockResolvedValue({
            todo: {
                id: "todo-1",
                card_id: "card-1",
                title: "Buy milk",
                amount: "5.000000",
                done: false,
                scheduled_at: "2024-01-01T00:00:00.000Z",
                order_index: 1,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            },
            updated_card: {
                id: "card-1",
                title: "Test",
                amount: "95.000000",
                locked_amount: null,
                archived: false,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
                archived_at: null,
            },
        });

        await api.addTodo("card-1", "Buy milk", "5.00", true, null);
        expect(mockInvoke).toHaveBeenCalledWith("add_todo", {
            cardId: "card-1",
            title: "Buy milk",
            amount: "5.00",
            useCurrentTime: true,
            scheduledAt: null,
        });
    });

    it("should return todo and updated card", async () => {
        mockInvoke.mockResolvedValue({
            todo: {
                id: "todo-1",
                card_id: "card-1",
                title: "Test",
                amount: "10.000000",
                done: false,
                scheduled_at: null,
                order_index: 1,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            },
            updated_card: {
                id: "card-1",
                title: "Test",
                amount: "90.000000",
                locked_amount: null,
                archived: false,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
                archived_at: null,
            },
        });

        const result = await api.addTodo("card-1", "Test", "10.00", true, null);
        expect(result.todo.id).toBe("todo-1");
        expect(result.updated_card.amount).toBe("90.000000");
    });
});

describe("updateTodo", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with update_todo command", async () => {
        mockInvoke.mockResolvedValue({
            id: "todo-1",
            card_id: "card-1",
            title: "Updated title",
            amount: "5.000000",
            done: true,
            scheduled_at: null,
            order_index: 1,
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-02T00:00:00.000Z",
        });

        await api.updateTodo("todo-1", "Updated title", undefined, true);
        expect(mockInvoke).toHaveBeenCalledWith("update_todo", {
            todoId: "todo-1",
            title: "Updated title",
            amount: undefined,
            done: true,
            scheduledAt: undefined,
            orderIndex: undefined,
        });
    });
});

describe("deleteTodo", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with delete_todo command", async () => {
        mockInvoke.mockResolvedValue({ ok: true });

        await api.deleteTodo("todo-1");
        expect(mockInvoke).toHaveBeenCalledWith("delete_todo", { todoId: "todo-1" });
    });
});

describe("search", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with search command", async () => {
        mockInvoke.mockResolvedValue([]);

        await api.search("groceries");
        expect(mockInvoke).toHaveBeenCalledWith("search", { query: "groceries" });
    });

    it("should return search results", async () => {
        mockInvoke.mockResolvedValue([
            {
                card_id: "card-1",
                todo_id: null,
                card_title: "Groceries",
                todo_title: null,
                snippet: "...Groceries Budget...",
            },
        ]);

        const result = await api.search("Groceries");
        expect(result).toHaveLength(1);
        expect(result[0].card_title).toBe("Groceries");
    });
});

describe("recentChanges", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with recent_changes command", async () => {
        mockInvoke.mockResolvedValue([]);

        await api.recentChanges(10);
        expect(mockInvoke).toHaveBeenCalledWith("recent_changes", { limit: 10 });
    });

    it("should use default limit if not provided", async () => {
        mockInvoke.mockResolvedValue([]);

        await api.recentChanges();
        expect(mockInvoke).toHaveBeenCalledWith("recent_changes", { limit: undefined });
    });
});

describe("archiveOldCards", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should call invoke with archive_old_cards command", async () => {
        mockInvoke.mockResolvedValue({ archived_count: 5 });

        await api.archiveOldCards();
        expect(mockInvoke).toHaveBeenCalledWith("archive_old_cards", {});
    });

    it("should return archive count", async () => {
        mockInvoke.mockResolvedValue({ archived_count: 3 });

        const result = await api.archiveOldCards();
        expect(result.archived_count).toBe(3);
    });
});

describe("Error handling", () => {
    beforeEach(() => {
        mockInvoke.mockReset();
    });

    it("should propagate Tauri errors", async () => {
        mockInvoke.mockRejectedValue(new Error("Card not found: card-999"));

        await expect(api.getCard("card-999")).rejects.toThrow("Card not found");
    });

    it("should propagate validation errors", async () => {
        mockInvoke.mockRejectedValue(new Error("Invalid amount: abc"));

        await expect(api.createCard("Test", "abc")).rejects.toThrow("Invalid amount");
    });
});
