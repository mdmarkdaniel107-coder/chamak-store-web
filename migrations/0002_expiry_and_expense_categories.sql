-- Additive migration. Review target database and backup before applying.
ALTER TABLE products ADD COLUMN expiry_date TEXT;
ALTER TABLE purchase_items ADD COLUMN expiry_date TEXT;
CREATE TABLE IF NOT EXISTS expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO expense_categories(name) VALUES
('বেতন'),('বিল'),('ভাড়া'),('বাড়িতে খরচ'),('যাতায়াত'),('অন্যান্য');
