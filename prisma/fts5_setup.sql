-- FTS5 virtual table for full-text search across cards and todos
-- Run this after Prisma migrations

-- Create FTS5 virtual table for search
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  card_id UNINDEXED,
  todo_id UNINDEXED,
  card_title,
  todo_title,
  content,
  tokenize = 'unicode61'
);

-- Trigger: Insert card into search index when created
CREATE TRIGGER IF NOT EXISTS search_index_card_insert AFTER INSERT ON Card BEGIN
  INSERT INTO search_index(card_id, todo_id, card_title, todo_title, content)
  VALUES (NEW.id, NULL, COALESCE(NEW.title, ''), '', '');
END;

-- Trigger: Update card in search index when updated
CREATE TRIGGER IF NOT EXISTS search_index_card_update AFTER UPDATE ON Card BEGIN
  DELETE FROM search_index WHERE card_id = NEW.id AND todo_id IS NULL;
  INSERT INTO search_index(card_id, todo_id, card_title, todo_title, content)
  VALUES (NEW.id, NULL, COALESCE(NEW.title, ''), '', '');
END;

-- Trigger: Delete card from search index when deleted
CREATE TRIGGER IF NOT EXISTS search_index_card_delete AFTER DELETE ON Card BEGIN
  DELETE FROM search_index WHERE card_id = OLD.id;
END;

-- Trigger: Insert todo into search index when created
CREATE TRIGGER IF NOT EXISTS search_index_todo_insert AFTER INSERT ON Todo BEGIN
  INSERT INTO search_index(card_id, todo_id, card_title, todo_title, content)
  VALUES (NEW.cardId, NEW.id, '', NEW.title, '');
END;

-- Trigger: Update todo in search index when updated
CREATE TRIGGER IF NOT EXISTS search_index_todo_update AFTER UPDATE ON Todo BEGIN
  DELETE FROM search_index WHERE todo_id = NEW.id;
  INSERT INTO search_index(card_id, todo_id, card_title, todo_title, content)
  VALUES (NEW.cardId, NEW.id, '', NEW.title, '');
END;

-- Trigger: Delete todo from search index when deleted
CREATE TRIGGER IF NOT EXISTS search_index_todo_delete AFTER DELETE ON Todo BEGIN
  DELETE FROM search_index WHERE todo_id = OLD.id;
END;
