-- ============================================================
-- CHAMAK STORE
-- Core Sales + Stock + Accounting Extension
-- ============================================================

PRAGMA foreign_keys = ON;


-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    product_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,

    category TEXT,
    unit TEXT NOT NULL DEFAULT 'pcs',

    sale_price INTEGER NOT NULL DEFAULT 0,

    minimum_stock REAL NOT NULL DEFAULT 0,

    current_stock REAL NOT NULL DEFAULT 0,

    current_stock_value INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    customer_code TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    mobile TEXT,
    address TEXT,

    opening_due INTEGER NOT NULL DEFAULT 0,

    current_due INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- SUPPLIERS
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    supplier_code TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    mobile TEXT,
    address TEXT,

    opening_due INTEGER NOT NULL DEFAULT 0,

    current_due INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- ACCOUNTS
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    account_code TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    account_type TEXT NOT NULL,

    opening_balance INTEGER NOT NULL DEFAULT 0,

    current_balance INTEGER NOT NULL DEFAULT 0,

    active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_no TEXT NOT NULL UNIQUE,

    transaction_type TEXT NOT NULL,

    transaction_date TEXT NOT NULL,

    note TEXT,

    status TEXT NOT NULL DEFAULT 'POSTED'
        CHECK (
            status IN (
                'DRAFT',
                'POSTED',
                'CANCELLED'
            )
        ),

    idempotency_key TEXT UNIQUE,

    created_by TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- SALES HEADER
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL UNIQUE,

    customer_id INTEGER,

    subtotal INTEGER NOT NULL DEFAULT 0,

    paid_amount INTEGER NOT NULL DEFAULT 0,

    due_amount INTEGER NOT NULL DEFAULT 0,

    payment_account_id INTEGER,

    sale_date TEXT NOT NULL,

    note TEXT,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    FOREIGN KEY (payment_account_id)
        REFERENCES accounts(id),

    CHECK (
        subtotal = paid_amount + due_amount
    )
);


-- ============================================================
-- SALES ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    sale_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    qty REAL NOT NULL
        CHECK (qty > 0),

    unit_sale_price INTEGER NOT NULL
        CHECK (unit_sale_price >= 0),

    line_total INTEGER NOT NULL
        CHECK (line_total >= 0),

    unit_cost INTEGER NOT NULL DEFAULT 0,

    cogs_amount INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (sale_id)
        REFERENCES sales(id),

    FOREIGN KEY (product_id)
        REFERENCES products(id)
);


-- ============================================================
-- PURCHASE HEADER
-- ============================================================

CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL UNIQUE,

    supplier_id INTEGER,

    subtotal INTEGER NOT NULL DEFAULT 0,

    paid_amount INTEGER NOT NULL DEFAULT 0,

    payable_amount INTEGER NOT NULL DEFAULT 0,

    payment_account_id INTEGER,

    purchase_date TEXT NOT NULL,

    note TEXT,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id),

    FOREIGN KEY (payment_account_id)
        REFERENCES accounts(id),

    CHECK (
        subtotal = paid_amount + payable_amount
    )
);


-- ============================================================
-- PURCHASE ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    purchase_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    qty REAL NOT NULL
        CHECK (qty > 0),

    unit_cost INTEGER NOT NULL
        CHECK (unit_cost >= 0),

    line_total INTEGER NOT NULL
        CHECK (line_total >= 0),

    FOREIGN KEY (purchase_id)
        REFERENCES purchases(id),

    FOREIGN KEY (product_id)
        REFERENCES products(id)
);


-- ============================================================
-- STOCK LOTS
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    product_id INTEGER NOT NULL,

    source_transaction_id INTEGER,

    received_qty REAL NOT NULL,

    remaining_qty REAL NOT NULL,

    unit_cost INTEGER NOT NULL,

    received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status TEXT NOT NULL DEFAULT 'OPEN'
        CHECK (
            status IN (
                'OPEN',
                'DEPLETED',
                'CLOSED'
            )
        ),

    FOREIGN KEY (product_id)
        REFERENCES products(id),

    FOREIGN KEY (source_transaction_id)
        REFERENCES transactions(id)
);


-- ============================================================
-- STOCK LEDGER
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    stock_lot_id INTEGER,

    qty_change REAL NOT NULL,

    unit_cost INTEGER NOT NULL DEFAULT 0,

    value_change INTEGER NOT NULL DEFAULT 0,

    movement_type TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (product_id)
        REFERENCES products(id),

    FOREIGN KEY (stock_lot_id)
        REFERENCES stock_lots(id)
);


-- ============================================================
-- LEDGER ENTRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS ledger_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL,

    account_id INTEGER NOT NULL,

    debit INTEGER NOT NULL DEFAULT 0,

    credit INTEGER NOT NULL DEFAULT 0,

    entry_date TEXT NOT NULL,

    description TEXT,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (account_id)
        REFERENCES accounts(id),

    CHECK (
        debit >= 0 AND credit >= 0
    ),

    CHECK (
        NOT (
            debit > 0
            AND credit > 0
        )
    )
);


-- ============================================================
-- CUSTOMER COLLECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL UNIQUE,

    customer_id INTEGER NOT NULL,

    amount INTEGER NOT NULL
        CHECK (amount > 0),

    account_id INTEGER NOT NULL,

    collection_date TEXT NOT NULL,

    note TEXT,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    FOREIGN KEY (account_id)
        REFERENCES accounts(id)
);


-- ============================================================
-- SUPPLIER PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL UNIQUE,

    supplier_id INTEGER NOT NULL,

    amount INTEGER NOT NULL
        CHECK (amount > 0),

    account_id INTEGER NOT NULL,

    payment_date TEXT NOT NULL,

    note TEXT,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id),

    FOREIGN KEY (account_id)
        REFERENCES accounts(id)
);


-- ============================================================
-- EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL UNIQUE,

    expense_type TEXT NOT NULL,

    amount INTEGER NOT NULL
        CHECK (amount > 0),

    account_id INTEGER NOT NULL,

    expense_date TEXT NOT NULL,

    note TEXT,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (account_id)
        REFERENCES accounts(id)
);


-- ============================================================
-- OTHER INCOME
-- ============================================================

CREATE TABLE IF NOT EXISTS other_income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL UNIQUE,

    income_type TEXT NOT NULL,

    amount INTEGER NOT NULL
        CHECK (amount > 0),

    account_id INTEGER NOT NULL,

    income_date TEXT NOT NULL,

    note TEXT,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (account_id)
        REFERENCES accounts(id)
);


-- ============================================================
-- STOCK ADJUSTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL UNIQUE,

    product_id INTEGER NOT NULL,

    qty_change REAL NOT NULL,

    unit_cost INTEGER NOT NULL DEFAULT 0,

    reason TEXT NOT NULL,

    adjustment_date TEXT NOT NULL,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (product_id)
        REFERENCES products(id)
);


-- ============================================================
-- ACCOUNT TRANSFERS
-- ============================================================

CREATE TABLE IF NOT EXISTS account_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER NOT NULL UNIQUE,

    from_account_id INTEGER NOT NULL,

    to_account_id INTEGER NOT NULL,

    amount INTEGER NOT NULL
        CHECK (amount > 0),

    transfer_date TEXT NOT NULL,

    note TEXT,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),

    FOREIGN KEY (from_account_id)
        REFERENCES accounts(id),

    FOREIGN KEY (to_account_id)
        REFERENCES accounts(id)
);


-- ============================================================
-- STOCK VALUE VERIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    verification_no TEXT NOT NULL UNIQUE,

    verification_date TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'DRAFT'
        CHECK (
            status IN (
                'DRAFT',
                'FINAL',
                'CANCELLED'
            )
        ),

    note TEXT,

    created_by TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS stock_verification_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    verification_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    system_qty REAL NOT NULL,

    unit_cost INTEGER NOT NULL,

    expected_value INTEGER NOT NULL,

    physical_qty REAL,

    physical_value INTEGER,

    difference_qty REAL,

    difference_value INTEGER,

    note TEXT,

    FOREIGN KEY (verification_id)
        REFERENCES stock_verifications(id),

    FOREIGN KEY (product_id)
        REFERENCES products(id)
);


-- ============================================================
-- DAILY ACCOUNTING CACHE
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    account_date TEXT NOT NULL UNIQUE,

    total_sales INTEGER NOT NULL DEFAULT 0,

    total_purchase INTEGER NOT NULL DEFAULT 0,

    total_expense INTEGER NOT NULL DEFAULT 0,

    total_income INTEGER NOT NULL DEFAULT 0,

    total_collection INTEGER NOT NULL DEFAULT 0,

    total_supplier_payment INTEGER NOT NULL DEFAULT 0,

    total_cogs INTEGER NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    transaction_id INTEGER,

    entity_type TEXT NOT NULL,

    entity_id INTEGER,

    action TEXT NOT NULL,

    old_data TEXT,

    new_data TEXT,

    created_by TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
);


-- ============================================================
-- SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,

    value TEXT NOT NULL,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- DEFAULT ACCOUNTS
-- ============================================================

INSERT OR IGNORE INTO accounts
(account_code, name, account_type)
VALUES
('1000', 'Cash', 'ASSET'),
('1010', 'bKash', 'ASSET'),
('1020', 'Nagad', 'ASSET'),
('1030', 'Rocket', 'ASSET'),
('1040', 'GP Recharge', 'ASSET'),
('1050', 'Banglalink Recharge', 'ASSET'),
('1060', 'Robi Recharge', 'ASSET'),
('1070', 'Airtel Recharge', 'ASSET'),
('1100', 'Inventory', 'ASSET'),
('1200', 'Customer Receivable', 'ASSET'),
('2000', 'Supplier Payable', 'LIABILITY'),
('3000', 'Owner Equity', 'EQUITY'),
('4000', 'Sales Income', 'INCOME'),
('4100', 'Other Income', 'INCOME'),
('5000', 'COGS', 'EXPENSE'),
('6000', 'Shop Expense', 'EXPENSE'),
('6100', 'Family Expense', 'EXPENSE');


-- ============================================================
-- SETTINGS
-- ============================================================

INSERT OR IGNORE INTO settings
(key, value)
VALUES
('schema_version', '1'),
('money_unit', 'paisa'),
('quantity_unit', 'mixed'),
('inventory_cost_method', 'FIFO'),
('ledger_mode', 'double_entry'),
('transaction_mode', 'atomic');


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_name
ON products(name);

CREATE INDEX IF NOT EXISTS idx_products_status
ON products(status);

CREATE INDEX IF NOT EXISTS idx_customers_name
ON customers(name);

CREATE INDEX IF NOT EXISTS idx_suppliers_name
ON suppliers(name);

CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_transactions_type
ON transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_sale_items_product
ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_items_product
ON purchase_items(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_lots_product
ON stock_lots(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_lots_remaining
ON stock_lots(product_id, remaining_qty);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_product
ON stock_ledger(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_transaction
ON stock_ledger(transaction_id);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_account
ON ledger_entries(account_id);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction
ON ledger_entries(transaction_id);

CREATE INDEX IF NOT EXISTS idx_audit_transaction
ON audit_log(transaction_id);

CREATE INDEX IF NOT EXISTS idx_verification_product
ON stock_verification_items(product_id);
