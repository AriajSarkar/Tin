import { z } from "zod";

export const CardSchema = z.object({
    id: z.string(),
    title: z.string().nullable(),
    amount: z.string(),
    archived: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
    archived_at: z.string().nullable(),
});

export const TodoSchema = z.object({
    id: z.string(),
    card_id: z.string(),
    title: z.string(),
    amount: z.string().nullable(),
    done: z.boolean(),
    scheduled_at: z.string().nullable(),
    order_index: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
});

export const CardWithTodosSchema = CardSchema.extend({
    todos: z.array(TodoSchema),
});

export const ChangeLogSchema = z.object({
    id: z.string(),
    card_id: z.string(),
    kind: z.string(),
    payload: z.record(z.string(), z.unknown()),
    created_at: z.string(),
});

export const SearchResultSchema = z.object({
    card_id: z.string(),
    todo_id: z.string().nullable(),
    card_title: z.string().nullable(),
    todo_title: z.string().nullable(),
    snippet: z.string(),
});

export const AddTodoResultSchema = z.object({
    todo: TodoSchema,
    updated_card: CardSchema,
});

export const OkResponseSchema = z.object({
    ok: z.boolean(),
});

export const ArchiveResultSchema = z.object({
    archived_count: z.number(),
});

export type Card = z.infer<typeof CardSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type CardWithTodos = z.infer<typeof CardWithTodosSchema>;
export type ChangeLog = z.infer<typeof ChangeLogSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type AddTodoResult = z.infer<typeof AddTodoResultSchema>;
export type OkResponse = z.infer<typeof OkResponseSchema>;
export type ArchiveResult = z.infer<typeof ArchiveResultSchema>;
