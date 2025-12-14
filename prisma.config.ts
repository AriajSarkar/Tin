import path from "node:path";
import { defineConfig } from "prisma/config";
import type { PrismaConfig } from "prisma/config";

const dbPath = path.join(__dirname, "prisma", "dev.db");

// Using type assertion since Prisma 7's migrate adapter types are still evolving
export default defineConfig({
    schema: path.join(__dirname, "prisma", "schema.prisma"),

    datasource: {
        url: `file:${dbPath}`,
    },

    migrate: {
        async adapter() {
            const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
            return new PrismaBetterSqlite3({ url: dbPath });
        },
    },
} as PrismaConfig);
