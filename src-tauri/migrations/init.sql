-- Tin Database Schema
-- SQLite with FTS5 for full-text search

-- Cards table
CREATE TABLE IF NOT EXISTS Card (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT,
    amount REAL NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    archivedAt TEXT,
    archived INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_card_created ON Card(createdAt);
CREATE INDEX IF NOT EXISTS idx_card_archived ON Card(archived);

-- Todos table
CREATE TABLE IF NOT EXISTS Todo (
    id TEXT PRIMARY KEY NOT NULL,
    cardId TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL,
    done INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    scheduledAt TEXT,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cardId) REFERENCES Card(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_todo_card ON Todo(cardId);
CREATE INDEX IF NOT EXISTS idx_todo_title ON Todo(title);
CREATE INDEX IF NOT EXISTS idx_todo_created ON Todo(createdAt);

-- ChangeLog table
CREATE TABLE IF NOT EXISTS ChangeLog (
    id TEXT PRIMARY KEY NOT NULL,
    cardId TEXT NOT NULL,
    kind TEXT NOT NULL,
    payload TEXT NOT NULL DEFAULT '{}',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cardId) REFERENCES Card(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_changelog_card ON ChangeLog(cardId);
CREATE INDEX IF NOT EXISTS idx_changelog_created ON ChangeLog(createdAt);

-- FTS5 virtual table for search
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    card_id UNINDEXED,
    todo_id UNINDEXED,
    card_title,
    todo_title,
    content,
    tokenize = 'unicode61'
);

-- Trigger: Insert card into search index
CREATE TRIGGER IF NOT EXISTS search_index_card_insert AFTER INSERT ON Card BEGIN
    INSERT INTO search_index(card_id, todo_id, card_title, todo_title, content)
    VALUES (NEW.id, NULL, COALESCE(NEW.title, ''), '', '');
END;

-- Trigger: Update card in search index
CREATE TRIGGER IF NOT EXISTS search_index_card_update AFTER UPDATE ON Card BEGIN
    DELETE FROM search_index WHERE card_id = NEW.id AND todo_id IS NULL;
    INSERT INTO search_index(card_id, todo_id, card_title, todo_title, content)
    VALUES (NEW.id, NULL, COALESCE(NEW.title, ''), '', '');
END;

-- Trigger: Delete card from search index
CREATE TRIGGER IF NOT EXISTS search_index_card_delete AFTER DELETE ON Card BEGIN
    DELETE FROM search_index WHERE card_id = OLD.id;
END;

-- Trigger: Insert todo into search index
CREATE TRIGGER IF NOT EXISTS search_index_todo_insert AFTER INSERT ON Todo BEGIN
    INSERT INTO search_index(card_id, todo_id, card_title, todo_title, content)
    VALUES (NEW.cardId, NEW.id, '', NEW.title, '');
END;

-- Trigger: Update todo in search index
CREATE TRIGGER IF NOT EXISTS search_index_todo_update AFTER UPDATE ON Todo BEGIN
    DELETE FROM search_index WHERE todo_id = NEW.id;
    INSERT INTO search_index(card_id, todo_id, card_title, todo_title, content)
    VALUES (NEW.cardId, NEW.id, '', NEW.title, '');
END;

-- Trigger: Delete todo from search index
CREATE TRIGGER IF NOT EXISTS search_index_todo_delete AFTER DELETE ON Todo BEGIN
    DELETE FROM search_index WHERE todo_id = OLD.id;
END;
