import { invoke } from "@tauri-apps/api/core";

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        // Create some sample cards
        const groceryCard = await invoke("create_card", {
            title: "Groceries Budget",
            amount: "500.00",
        });
        console.log("Created card:", groceryCard);

        const entertainmentCard = await invoke("create_card", {
            title: "Entertainment",
            amount: "200.00",
        });
        console.log("Created card:", entertainmentCard);

        const savingsCard = await invoke("create_card", {
            title: "Monthly Savings",
            amount: "1000.00",
        });
        console.log("Created card:", savingsCard);

        // Add todos to grocery card
        if (typeof (groceryCard as Record<string, unknown>).id === "string") {
            const cardId = (groceryCard as Record<string, unknown>).id as string;

            await invoke("add_todo", {
                cardId,
                title: "Milk and eggs",
                amount: "12.50",
                useCurrentTime: true,
            });

            await invoke("add_todo", {
                cardId,
                title: "Bread",
                amount: "4.00",
                useCurrentTime: true,
            });

            await invoke("add_todo", {
                cardId,
                title: "Vegetables",
                amount: "25.00",
                useCurrentTime: true,
            });
        }

        // Add todos to entertainment card
        if (typeof (entertainmentCard as Record<string, unknown>).id === "string") {
            const cardId = (entertainmentCard as Record<string, unknown>).id as string;

            await invoke("add_todo", {
                cardId,
                title: "Movie tickets",
                amount: "30.00",
                useCurrentTime: true,
            });

            await invoke("add_todo", {
                cardId,
                title: "Netflix subscription",
                amount: "15.99",
                useCurrentTime: true,
            });
        }

        console.log("✅ Seed completed successfully!");
        console.log("\nRun `pnpm tauri:dev` to see the seeded data.");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        throw error;
    }
}

// Only run if this file is executed directly
if (typeof window !== "undefined") {
    seed().catch(console.error);
}

export { seed };
