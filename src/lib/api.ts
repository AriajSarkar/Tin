import { invoke } from "@tauri-apps/api/core";
import type {
    Card,
    CardWithTodos,
    Todo,
    ChangeLog,
    SearchResult,
    AddTodoResult,
    OkResponse,
    ArchiveResult,
} from "./types";
import {
    CardSchema,
    CardWithTodosSchema,
    TodoSchema,
    ChangeLogSchema,
    SearchResultSchema,
    AddTodoResultSchema,
    OkResponseSchema,
    ArchiveResultSchema,
} from "./types";
import { z } from "zod";

async function safeInvoke<T>(
    cmd: string,
    args: Record<string, unknown>,
    schema: z.ZodType<T>
): Promise<T> {
    const result = await invoke(cmd, args);
    return schema.parse(result);
}

export async function listCards(): Promise<Card[]> {
    return safeInvoke("list_cards", {}, z.array(CardSchema));
}

export async function listArchivedCards(): Promise<Card[]> {
    return safeInvoke("list_archived_cards", {}, z.array(CardSchema));
}

export async function getCard(cardId: string): Promise<CardWithTodos> {
    return safeInvoke("get_card", { cardId }, CardWithTodosSchema);
}

export async function createCard(
    title: string | null | undefined,
    amount: string
): Promise<Card> {
    return safeInvoke("create_card", { title, amount }, CardSchema);
}

export async function updateCard(
    cardId: string,
    title?: string | null,
    amount?: string
): Promise<Card> {
    return safeInvoke("update_card", { cardId, title, amount }, CardSchema);
}

export async function deleteCard(cardId: string): Promise<OkResponse> {
    return safeInvoke("delete_card", { cardId }, OkResponseSchema);
}

export async function addTodo(
    cardId: string,
    title: string,
    amount: string | null | undefined,
    useCurrentTime: boolean,
    scheduledAt?: string | null
): Promise<AddTodoResult> {
    return safeInvoke(
        "add_todo",
        { cardId, title, amount, useCurrentTime, scheduledAt },
        AddTodoResultSchema
    );
}

export async function updateTodo(
    todoId: string,
    title?: string,
    amount?: string | null,
    done?: boolean,
    scheduledAt?: string | null,
    orderIndex?: number
): Promise<Todo> {
    return safeInvoke(
        "update_todo",
        { todoId, title, amount, done, scheduledAt, orderIndex },
        TodoSchema
    );
}

export async function deleteTodo(todoId: string): Promise<OkResponse> {
    return safeInvoke("delete_todo", { todoId }, OkResponseSchema);
}

export async function search(query: string): Promise<SearchResult[]> {
    return safeInvoke("search", { query }, z.array(SearchResultSchema));
}

export async function recentChanges(limit?: number): Promise<ChangeLog[]> {
    return safeInvoke("recent_changes", { limit }, z.array(ChangeLogSchema));
}

export async function archiveCard(cardId: string): Promise<Card> {
    return safeInvoke("archive_card", { cardId }, CardSchema);
}

export async function unarchiveCard(cardId: string): Promise<Card> {
    return safeInvoke("unarchive_card", { cardId }, CardSchema);
}

export async function archiveOldCards(): Promise<ArchiveResult> {
    return safeInvoke("archive_old_cards", {}, ArchiveResultSchema);
}
