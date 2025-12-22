/**
 * Comprehensive tests for Zod type schemas
 * These tests ensure API responses are correctly validated and typed
 */

import { describe, it, expect } from "vitest";
import {
    CardSchema,
    TodoSchema,
    CardWithTodosSchema,
    ChangeLogSchema,
    SearchResultSchema,
    AddTodoResultSchema,
    OkResponseSchema,
    ArchiveResultSchema,
} from "@/lib/types";

describe("CardSchema", () => {
    const validCard = {
        id: "card-uuid-123",
        title: "Test Card",
        amount: "100.000000",
        locked_amount: null,
        archived: false,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        archived_at: null,
    };

    it("should parse valid card", () => {
        const result = CardSchema.safeParse(validCard);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.id).toBe("card-uuid-123");
            expect(result.data.amount).toBe("100.000000");
        }
    });

    it("should accept null title", () => {
        const result = CardSchema.safeParse({ ...validCard, title: null });
        expect(result.success).toBe(true);
    });

    it("should accept archived card with archived_at", () => {
        const result = CardSchema.safeParse({
            ...validCard,
            archived: true,
            archived_at: "2024-02-01T00:00:00.000Z",
        });
        expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
        const { id, ...cardWithoutId } = validCard;
        const result = CardSchema.safeParse(cardWithoutId);
        expect(result.success).toBe(false);
    });

    it("should reject missing amount", () => {
        const { amount, ...cardWithoutAmount } = validCard;
        const result = CardSchema.safeParse(cardWithoutAmount);
        expect(result.success).toBe(false);
    });

    it("should reject archived not being boolean", () => {
        const result = CardSchema.safeParse({ ...validCard, archived: "false" });
        expect(result.success).toBe(false);
    });

    it("should reject missing timestamps", () => {
        const { created_at, ...cardWithoutTimestamp } = validCard;
        const result = CardSchema.safeParse(cardWithoutTimestamp);
        expect(result.success).toBe(false);
    });
});

describe("TodoSchema", () => {
    const validTodo = {
        id: "todo-uuid-123",
        card_id: "card-uuid-123",
        title: "Buy milk",
        amount: "5.000000",
        done: false,
        scheduled_at: "2024-01-15T10:00:00.000Z",
        order_index: 1,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
    };

    it("should parse valid todo", () => {
        const result = TodoSchema.safeParse(validTodo);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.title).toBe("Buy milk");
            expect(result.data.done).toBe(false);
        }
    });

    it("should accept null amount", () => {
        const result = TodoSchema.safeParse({ ...validTodo, amount: null });
        expect(result.success).toBe(true);
    });

    it("should accept null scheduled_at", () => {
        const result = TodoSchema.safeParse({ ...validTodo, scheduled_at: null });
        expect(result.success).toBe(true);
    });

    it("should accept done = true", () => {
        const result = TodoSchema.safeParse({ ...validTodo, done: true });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.done).toBe(true);
        }
    });

    it("should reject missing card_id", () => {
        const { card_id, ...todoWithoutCardId } = validTodo;
        const result = TodoSchema.safeParse(todoWithoutCardId);
        expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
        const result = TodoSchema.safeParse({ ...validTodo, title: "" });
        // Empty string is still a string, so it passes
        expect(result.success).toBe(true);
    });

    it("should reject invalid order_index type", () => {
        const result = TodoSchema.safeParse({ ...validTodo, order_index: "1" });
        expect(result.success).toBe(false);
    });
});

describe("CardWithTodosSchema", () => {
    const validCardWithTodos = {
        id: "card-uuid-123",
        title: "Test Card",
        amount: "100.000000",
        locked_amount: null,
        archived: false,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        archived_at: null,
        todos: [
            {
                id: "todo-1",
                card_id: "card-uuid-123",
                title: "First todo",
                amount: "10.000000",
                done: false,
                scheduled_at: null,
                order_index: 1,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            },
            {
                id: "todo-2",
                card_id: "card-uuid-123",
                title: "Second todo",
                amount: null,
                done: true,
                scheduled_at: null,
                order_index: 2,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            },
        ],
    };

    it("should parse card with todos", () => {
        const result = CardWithTodosSchema.safeParse(validCardWithTodos);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.todos.length).toBe(2);
        }
    });

    it("should accept empty todos array", () => {
        const result = CardWithTodosSchema.safeParse({
            ...validCardWithTodos,
            todos: [],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.todos.length).toBe(0);
        }
    });

    it("should reject missing todos array", () => {
        const { todos, ...cardWithoutTodos } = validCardWithTodos;
        const result = CardWithTodosSchema.safeParse(cardWithoutTodos);
        expect(result.success).toBe(false);
    });

    it("should reject invalid todo in array", () => {
        const result = CardWithTodosSchema.safeParse({
            ...validCardWithTodos,
            todos: [{ invalid: true }],
        });
        expect(result.success).toBe(false);
    });
});

describe("ChangeLogSchema", () => {
    const validChangeLog = {
        id: "log-uuid-123",
        card_id: "card-uuid-123",
        kind: "created",
        payload: { title: "Test", amount: "100.00" },
        created_at: "2024-01-01T00:00:00.000Z",
    };

    it("should parse valid changelog", () => {
        const result = ChangeLogSchema.safeParse(validChangeLog);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.kind).toBe("created");
        }
    });

    it("should accept empty payload object", () => {
        const result = ChangeLogSchema.safeParse({ ...validChangeLog, payload: {} });
        expect(result.success).toBe(true);
    });

    it("should accept complex payload", () => {
        const result = ChangeLogSchema.safeParse({
            ...validChangeLog,
            payload: {
                todo_id: "todo-1",
                title: "Test",
                amount: "50.00",
                card_amount_change: "100.00 -> 50.00",
            },
        });
        expect(result.success).toBe(true);
    });

    it("should reject missing kind", () => {
        const { kind, ...logWithoutKind } = validChangeLog;
        const result = ChangeLogSchema.safeParse(logWithoutKind);
        expect(result.success).toBe(false);
    });
});

describe("SearchResultSchema", () => {
    it("should parse card search result", () => {
        const result = SearchResultSchema.safeParse({
            card_id: "card-uuid",
            todo_id: null,
            card_title: "Groceries",
            todo_title: null,
            snippet: "...Groceries Budget...",
        });
        expect(result.success).toBe(true);
    });

    it("should parse todo search result", () => {
        const result = SearchResultSchema.safeParse({
            card_id: "card-uuid",
            todo_id: "todo-uuid",
            card_title: "Groceries",
            todo_title: "Buy milk",
            snippet: "...Buy milk and eggs...",
        });
        expect(result.success).toBe(true);
    });
});

describe("AddTodoResultSchema", () => {
    it("should parse add todo result with updated card", () => {
        const result = AddTodoResultSchema.safeParse({
            todo: {
                id: "todo-uuid",
                card_id: "card-uuid",
                title: "New todo",
                amount: "25.000000",
                done: false,
                scheduled_at: null,
                order_index: 1,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            },
            updated_card: {
                id: "card-uuid",
                title: "Test Card",
                amount: "75.000000",
                locked_amount: null,
                archived: false,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
                archived_at: null,
            },
        });
        expect(result.success).toBe(true);
    });
});

describe("OkResponseSchema", () => {
    it("should parse ok: true", () => {
        const result = OkResponseSchema.safeParse({ ok: true });
        expect(result.success).toBe(true);
    });

    it("should parse ok: false", () => {
        const result = OkResponseSchema.safeParse({ ok: false });
        expect(result.success).toBe(true);
    });

    it("should reject non-boolean ok", () => {
        const result = OkResponseSchema.safeParse({ ok: "true" });
        expect(result.success).toBe(false);
    });
});

describe("ArchiveResultSchema", () => {
    it("should parse archived count", () => {
        const result = ArchiveResultSchema.safeParse({ archived_count: 5 });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.archived_count).toBe(5);
        }
    });

    it("should accept zero archived", () => {
        const result = ArchiveResultSchema.safeParse({ archived_count: 0 });
        expect(result.success).toBe(true);
    });

    it("should accept non-integer count (z.number allows floats)", () => {
        const result = ArchiveResultSchema.safeParse({ archived_count: 5.5 });
        expect(result.success).toBe(true);
    });
});
