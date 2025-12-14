# Tin – Local-First Expense Tracker

A notebook-like Tauri app for tracking expenses with cards containing todo items.

## Features

- **Cards**: Create expense cards with a main balance
- **Todos**: Add items that atomically deduct from the card balance
- **Search**: Full-text search across cards and todos (FTS5)
- **Recent Activity**: Track changes to cards and todos
- **Auto-Archive**: Cards older than 30 days are automatically archived
- **Dark Mode**: Toggle between light and dark themes

## Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.77+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Set up database (creates SQLite database)
echo 'DATABASE_URL="file:./dev.db"' > .env
npx prisma migrate dev --name init

# Run in development mode
pnpm tauri:dev
```

### Production Build

```bash
pnpm tauri:build
```

## Project Structure

```
tin/
├── prisma/              # Prisma schema and migrations
│   ├── schema.prisma
│   └── fts5_setup.sql   # FTS5 virtual table setup
├── src/
│   ├── app/             # Next.js pages
│   ├── components/      # React components
│   ├── lib/             # API wrappers and types
│   └── styles/          # Theme and design tokens
└── src-tauri/
    ├── migrations/      # SQLite migrations
    └── src/             # Rust backend
        ├── commands.rs  # Tauri commands
        ├── db.rs        # Database layer
        ├── models.rs    # DTOs
        └── archiver.rs  # Background job
```

## Architecture

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 + Motion
- **Backend**: Tauri 2.9 + Rust + rusqlite
- **Database**: SQLite with FTS5 for full-text search
- **State**: Local-first, no external dependencies

## API

All Tauri commands are typed and accessible via `src/lib/api.ts`:

- `listCards()` – Get all non-archived cards
- `getCard(id)` – Get card with todos
- `createCard(title, amount)` – Create new card
- `updateCard(id, title?, amount?)` – Update card
- `deleteCard(id)` – Delete card
- `addTodo(cardId, title, amount?, useCurrentTime, scheduledAt?)` – Add todo (atomic deduction)
- `updateTodo(id, ...)` – Update todo
- `deleteTodo(id)` – Delete todo
- `search(query)` – Full-text search (supports `after:` and `before:` date filters)
- `recentChanges(limit?)` – Get recent activity

## License

MIT
