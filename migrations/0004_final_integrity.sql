-- ============================================================
-- CHAMAK STORE
-- MIGRATION 0004
-- FINAL INTEGRITY + PERFORMANCE
-- ============================================================

PRAGMA foreign_keys = ON;


-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_transactions_type
ON transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_transactions_idempotency
ON transactions(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_ledger_transaction
ON ledger_entries(transaction_id);

CREATE INDEX IF NOT EXISTS idx_ledger_account
ON ledger_entries(account_id);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_product
ON stock_ledger(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_date
ON stock_ledger(created_at);

CREATE INDEX IF NOT EXISTS idx_stock_lots_product
ON stock_lots(product_id);

CREATE INDEX IF NOT EXISTS idx_sales_customer
ON sales(customer_id);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier
ON purchases(supplier_id);

CREATE INDEX IF NOT EXISTS idx_audit_created
ON audit_log(created_at);


-- ============================================================
-- TOTAL SALE SUPPORT
-- ============================================================

CREATE TABLE IF NOT EXISTS direct_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id TEXT NOT NULL UNIQUE,

    customer_id INTEGER,

    total_amount INTEGER NOT NULL
        CHECK(total_amount > 0),

    paid_amount INTEGER NOT NULL
        CHECK(paid_amount >= 0),

    due_amount INTEGER NOT NULL
        CHECK(due_amount >= 0),

    payment_account_id INTEGER,

    sale_date TEXT NOT NULL,

    reference TEXT,

    note TEXT,

    created_at TEXT NOT NULL,

    FOREIGN KEY(transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY(customer_id)
        REFERENCES customers(id),

    FOREIGN KEY(payment_account_id)
        REFERENCES accounts(id),

    CHECK(
        paid_amount + due_amount
        = total_amount
    )
);


CREATE INDEX IF NOT EXISTS idx_direct_sales_date
ON direct_sales(sale_date);

CREATE INDEX IF NOT EXISTS idx_direct_sales_customer
ON direct_sales(customer_id);


-- ============================================================
-- SYSTEM INTEGRITY RECORD
-- ============================================================

CREATE TABLE IF NOT EXISTS system_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    check_type TEXT NOT NULL,

    status TEXT NOT NULL,

    details TEXT,

    created_at TEXT NOT NULL
);


-- ============================================================
-- SETTINGS
-- ============================================================

INSERT OR IGNORE INTO settings(
    key,
    value,
    updated_at
)
VALUES(
    'system_version',
    '1.0.0',
    datetime('now')
);

INSERT OR IGNORE INTO settings(
    key,
    value,
    updated_at
)
VALUES(
    'accounting_mode',
    'double_entry',
    datetime('now')
);

INSERT OR IGNORE INTO settings(
    key,
    value,
    updated_at
)
VALUES(
    'stock_cost_method',
    'FIFO',
    datetime('now')
);

INSERT OR IGNORE INTO settings(
    key,
    value,
    updated_at
)
VALUES(
    'total_sale_stock_effect',
    'NONE',
    datetime('now')
);
