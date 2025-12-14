import { z } from "zod";

export const CreateCardInput = z.object({
    title: z.string().optional().nullable(),
    amount: z.string().regex(/^-?\d+\.?\d*$/, "Invalid amount format"),
});

export const UpdateCardInput = z.object({
    card_id: z.string(),
    title: z.string().optional().nullable(),
    amount: z.string().regex(/^-?\d+\.?\d*$/, "Invalid amount format").optional(),
});

export const AddTodoInput = z.object({
    card_id: z.string(),
    title: z.string().min(1, "Title is required"),
    amount: z.string().regex(/^-?\d+\.?\d*$/, "Invalid amount format").optional().nullable(),
    use_current_time: z.boolean().default(true),
    scheduled_at: z.string().optional().nullable(),
});

export const UpdateTodoInput = z.object({
    todo_id: z.string(),
    title: z.string().optional(),
    amount: z.string().regex(/^-?\d+\.?\d*$/, "Invalid amount format").optional().nullable(),
    done: z.boolean().optional(),
    scheduled_at: z.string().optional().nullable(),
    order_index: z.number().optional(),
});

export const SearchInput = z.object({
    query: z.string(),
});

export const RecentChangesInput = z.object({
    limit: z.number().optional(),
});

export type CreateCardPayload = z.infer<typeof CreateCardInput>;
export type UpdateCardPayload = z.infer<typeof UpdateCardInput>;
export type AddTodoPayload = z.infer<typeof AddTodoInput>;
export type UpdateTodoPayload = z.infer<typeof UpdateTodoInput>;
export type SearchPayload = z.infer<typeof SearchInput>;
export type RecentChangesPayload = z.infer<typeof RecentChangesInput>;
