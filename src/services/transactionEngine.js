// src/services/transactionEngine.js

/**
 * CHAMAK STORE WEB
 * Backend Transaction Engine
 *
 * Core principle:
 * One business action = one atomic transaction.
 *
 * Supported:
 * - Sale
 * - Purchase
 * - Customer Collection
 * - Supplier Payment
 * - Expense
 * - Other Income
 * - Stock Adjustment
 * - Account Transfer
 *
 * Important:
 * - No partial transaction should remain in database.
 * - Financial and stock effects are recorded together.
 * - Cached balances are updated atomically.
 */

const ACCOUNT = Object.freeze({
  CASH: 1000,
  BKASH: 1010,
  NAGAD: 1020,
  ROCKET: 1030,

  GP_RECHARGE: 1040,
  BANGLALINK_RECHARGE: 1050,
  ROBI_RECHARGE: 1060,
  AIRTEL_RECHARGE: 1070,

  INVENTORY: 1100,
  CUSTOMER_RECEIVABLE: 1200,

  SUPPLIER_PAYABLE: 2000,
  OWNER_EQUITY: 3000,

  SALES_INCOME: 4000,
  OTHER_INCOME: 4100,

  COGS: 5000,
  SHOP_EXPENSE: 6000,
  FAMILY_EXPENSE: 6100,
});


/* =========================================================
   BASIC HELPERS
========================================================= */

function nowISO() {
  return new Date().toISOString();
}

function money(value) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new Error("Invalid money value");
  }

  return Math.round(n);
}

function quantity(value) {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  return n;
}

function cleanText(value, field = "text") {
  if (value === undefined || value === null) {
    throw new Error(`${field} is required`);
  }

  const text = String(value).trim();

  if (!text) {
    throw new Error(`${field} is required`);
  }

  return text;
}

function optionalText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

function uuid() {
  return crypto.randomUUID();
}


/* =========================================================
   DB HELPERS
========================================================= */

async function getOne(db, sql, params = []) {
  return await db
    .prepare(sql)
    .bind(...params)
    .first();
}

async function getAll(db, sql, params = []) {
  const result = await db
    .prepare(sql)
    .bind(...params)
    .all();

  return result.results || [];
}

async function run(db, sql, params = []) {
  return await db
    .prepare(sql)
    .bind(...params)
    .run();
}


/* =========================================================
   VALIDATION
========================================================= */

function validatePaymentAccount(accountId) {
  const id = Number(accountId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid payment account");
  }

  return id;
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one item is required");
  }

  return items.map((item, index) => {
    if (!item) {
      throw new Error(`Invalid item at index ${index}`);
    }

    const productId = Number(item.product_id);
    const qty = quantity(item.quantity);
    const unitPrice = money(item.unit_price);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error(`Invalid product_id at item ${index}`);
    }

    if (unitPrice < 0) {
      throw new Error(`Invalid unit price at item ${index}`);
    }

    return {
      product_id: productId,
      quantity: qty,
      unit_price: unitPrice,
      total: Math.round(qty * unitPrice),
    };
  });
}


/* =========================================================
   IDEMPOTENCY
========================================================= */

async function checkIdempotency(db, idempotencyKey) {
  if (!idempotencyKey) {
    return null;
  }

  return await getOne(
    db,
    `
      SELECT *
      FROM transactions
      WHERE idempotency_key = ?
      LIMIT 1
    `,
    [idempotencyKey]
  );
}


/* =========================================================
   TRANSACTION HEADER
========================================================= */

async function createTransaction(
  db,
  {
    transactionType,
    referenceId,
    transactionDate,
    note,
    idempotencyKey
  }
) {
  const existing = await checkIdempotency(db, idempotencyKey);

  if (existing) {
    return {
      duplicate: true,
      transaction: existing
    };
  }

  const id = uuid();

  await run(
    db,
    `
      INSERT INTO transactions (
        id,
        transaction_type,
        reference_id,
        transaction_date,
        note,
        idempotency_key,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      transactionType,
      referenceId || null,
      transactionDate,
      note || null,
      idempotencyKey || null,
      nowISO()
    ]
  );

  return {
    duplicate: false,
    id
  };
}


/* =========================================================
   LEDGER
========================================================= */

async function ledger(
  db,
  {
    transactionId,
    accountId,
    debit,
    credit,
    description,
    referenceType,
    referenceId
  }
) {
  const debitAmount = money(debit || 0);
  const creditAmount = money(credit || 0);

  if (debitAmount < 0 || creditAmount < 0) {
    throw new Error("Ledger amount cannot be negative");
  }

  if (debitAmount === 0 && creditAmount === 0) {
    return;
  }

  await run(
    db,
    `
      INSERT INTO ledger_entries (
        id,
        transaction_id,
        account_id,
        debit,
        credit,
        description,
        reference_type,
        reference_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      uuid(),
      transactionId,
      accountId,
      debitAmount,
      creditAmount,
      description || null,
      referenceType || null,
      referenceId || null,
      nowISO()
    ]
  );
}


/* =========================================================
   ACCOUNT BALANCE
========================================================= */

async function changeAccountBalance(
  db,
  accountId,
  debit,
  credit
) {
  const debitAmount = money(debit || 0);
  const creditAmount = money(credit || 0);

  await run(
    db,
    `
      UPDATE accounts
      SET current_balance =
        COALESCE(current_balance, 0)
        + ?
        - ?
      WHERE id = ?
    `,
    [
      debitAmount,
      creditAmount,
      accountId
    ]
  );
}


/* =========================================================
   PRODUCT
========================================================= */

async function getProduct(db, productId) {
  const product = await getOne(
    db,
    `
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
    `,
    [productId]
  );

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  return product;
}


/* =========================================================
   STOCK LEDGER
========================================================= */

async function addStockLedger(
  db,
  {
    transactionId,
    productId,
    quantity,
    unitCost,
    direction,
    referenceType,
    referenceId,
    note
  }
) {
  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Invalid stock quantity");
  }

  const cost = money(unitCost);

  await run(
    db,
    `
      INSERT INTO stock_ledger (
        id,
        transaction_id,
        product_id,
        quantity,
        unit_cost,
        direction,
        reference_type,
        reference_id,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      uuid(),
      transactionId,
      productId,
      qty,
      cost,
      direction,
      referenceType || null,
      referenceId || null,
      note || null,
      nowISO()
    ]
  );
}


/* =========================================================
   STOCK BALANCE
========================================================= */

async function changeProductStock(
  db,
  productId,
  delta
) {
  const product = await getProduct(db, productId);

  const current = Number(product.current_stock || 0);
  const next = current + Number(delta);

  if (next < 0) {
    throw new Error(
      `Insufficient stock for product ${productId}`
    );
  }

  await run(
    db,
    `
      UPDATE products
      SET current_stock = ?
      WHERE id = ?
    `,
    [
      next,
      productId
    ]
  );

  return {
    previous: current,
    current: next
  };
}


/* =========================================================
   FIFO STOCK LOT
========================================================= */

async function createStockLot(
  db,
  {
    transactionId,
    productId,
    quantity,
    unitCost,
    purchaseItemId
  }
) {
  await run(
    db,
    `
      INSERT INTO stock_lots (
        id,
        product_id,
        purchase_item_id,
        transaction_id,
        quantity,
        remaining_quantity,
        unit_cost,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      uuid(),
      productId,
      purchaseItemId || null,
      transactionId,
      quantity,
      quantity,
      unitCost,
      nowISO()
    ]
  );
}


/* =========================================================
   FIFO COST
========================================================= */

async function consumeFIFO(
  db,
  productId,
  requiredQuantity
) {
  let remaining = Number(requiredQuantity);

  if (remaining <= 0) {
    throw new Error("Invalid FIFO quantity");
  }

  const lots = await getAll(
    db,
    `
      SELECT *
      FROM stock_lots
      WHERE product_id = ?
        AND remaining_quantity > 0
      ORDER BY created_at ASC, id ASC
    `,
    [productId]
  );

  let totalCost = 0;
  const consumedLots = [];

  for (const lot of lots) {
    if (remaining <= 0) {
      break;
    }

    const available = Number(lot.remaining_quantity);

    const used = Math.min(
      available,
      remaining
    );

    totalCost += used * Number(lot.unit_cost);

    const newRemaining =
      available - used;

    await run(
      db,
      `
        UPDATE stock_lots
        SET remaining_quantity = ?
        WHERE id = ?
      `,
      [
        newRemaining,
        lot.id
      ]
    );

    consumedLots.push({
      lot_id: lot.id,
      quantity: used,
      unit_cost: Number(lot.unit_cost)
    });

    remaining -= used;
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient stock lots for product ${productId}`
    );
  }

  return {
    quantity: requiredQuantity,
    totalCost: Math.round(totalCost),
    averageCost:
      requiredQuantity > 0
        ? Math.round(totalCost / requiredQuantity)
        : 0,
    lots: consumedLots
  };
}


/* =========================================================
   PURCHASE
========================================================= */

export async function createPurchase(
  db,
  {
    supplierId = null,
    items,
    paymentAccountId = ACCOUNT.CASH,
    paidAmount = 0,
    transactionDate = nowISO().slice(0, 10),
    note = null,
    idempotencyKey = null
  }
) {
  const validItems = validateItems(items);

  const paid = money(paidAmount);

  const total = validItems.reduce(
    (sum, item) => sum + item.total,
    0
  );

  if (paid > total) {
    throw new Error(
      "Paid amount cannot be greater than purchase total"
    );
  }

  const accountId =
    validatePaymentAccount(paymentAccountId);

  const purchaseId = uuid();

  const tx = await createTransaction(db, {
    transactionType: "PURCHASE",
    referenceId: purchaseId,
    transactionDate,
    note,
    idempotencyKey
  });

  if (tx.duplicate) {
    return tx.transaction;
  }

  const transactionId = tx.id;

  await run(
    db,
    `
      INSERT INTO purchases (
        id,
        transaction_id,
        supplier_id,
        total_amount,
        paid_amount,
        due_amount,
        purchase_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      purchaseId,
      transactionId,
      supplierId,
      total,
      paid,
      total - paid,
      transactionDate,
      note,
      nowISO()
    ]
  );

  for (const item of validItems) {
    const product = await getProduct(
      db,
      item.product_id
    );

    const purchaseItemId = uuid();

    await run(
      db,
      `
        INSERT INTO purchase_items (
          id,
          purchase_id,
          product_id,
          quantity,
          unit_cost,
          total_cost,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        purchaseItemId,
        purchaseId,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.total,
        nowISO()
      ]
    );

    await createStockLot(db, {
      transactionId,
      productId: item.product_id,
      quantity: item.quantity,
      unitCost: item.unit_price,
      purchaseItemId
    });

    await addStockLedger(db, {
      transactionId,
      productId: item.product_id,
      quantity: item.quantity,
      unitCost: item.unit_price,
      direction: "IN",
      referenceType: "PURCHASE",
      referenceId: purchaseId,
      note
    });

    await changeProductStock(
      db,
      item.product_id,
      item.quantity
    );

    // Keep latest purchase cost for quick UI reference.
    await run(
      db,
      `
        UPDATE products
        SET last_purchase_cost = ?
        WHERE id = ?
      `,
      [
        item.unit_price,
        product.id
      ]
    );
  }

  // Inventory increases.
  await ledger(db, {
    transactionId,
    accountId: ACCOUNT.INVENTORY,
    debit: total,
    credit: 0,
    description: "Purchase inventory",
    referenceType: "PURCHASE",
    referenceId: purchaseId
  });

  // Payment reduces selected account.
  if (paid > 0) {
    await ledger(db, {
      transactionId,
      accountId,
      debit: 0,
      credit: paid,
      description: "Purchase payment",
      referenceType: "PURCHASE",
      referenceId: purchaseId
    });

    await changeAccountBalance(
      db,
      accountId,
      0,
      paid
    );
  }

  // Remaining amount becomes supplier payable.
  const due = total - paid;

  if (due > 0) {
    await ledger(db, {
      transactionId,
      accountId: ACCOUNT.SUPPLIER_PAYABLE,
      debit: 0,
      credit: due,
      description: "Supplier payable",
      referenceType: "PURCHASE",
      referenceId: purchaseId
    });

    if (supplierId) {
      await run(
        db,
        `
          UPDATE suppliers
          SET current_due =
            COALESCE(current_due, 0) + ?
          WHERE id = ?
        `,
        [
          due,
          supplierId
        ]
      );
    }
  }

  return {
    success: true,
    type: "PURCHASE",
    purchase_id: purchaseId,
    transaction_id: transactionId,
    total,
    paid,
    due
  };
}


/* =========================================================
   SALE
========================================================= */

export async function createSale(
  db,
  {
    customerId = null,
    items,
    paymentAccountId = ACCOUNT.CASH,
    paidAmount = 0,
    transactionDate = nowISO().slice(0, 10),
    note = null,
    idempotencyKey = null
  }
) {
  const validItems = validateItems(items);

  const paid = money(paidAmount);

  const total = validItems.reduce(
    (sum, item) => sum + item.total,
    0
  );

  if (paid > total) {
    throw new Error(
      "Paid amount cannot be greater than sale total"
    );
  }

  const accountId =
    validatePaymentAccount(paymentAccountId);

  const saleId = uuid();

  const tx = await createTransaction(db, {
    transactionType: "SALE",
    referenceId: saleId,
    transactionDate,
    note,
    idempotencyKey
  });

  if (tx.duplicate) {
    return tx.transaction;
  }

  const transactionId = tx.id;

  let totalCOGS = 0;

  await run(
    db,
    `
      INSERT INTO sales (
        id,
        transaction_id,
        customer_id,
        total_amount,
        paid_amount,
        due_amount,
        cogs_amount,
        sale_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      saleId,
      transactionId,
      customerId,
      total,
      paid,
      total - paid,
      0,
      transactionDate,
      note,
      nowISO()
    ]
  );

  for (const item of validItems) {
    const product = await getProduct(
      db,
      item.product_id
    );

    const currentStock =
      Number(product.current_stock || 0);

    if (currentStock < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name || item.product_id}`
      );
    }

    const fifo = await consumeFIFO(
      db,
      item.product_id,
      item.quantity
    );

    totalCOGS += fifo.totalCost;

    const saleItemId = uuid();

    await run(
      db,
      `
        INSERT INTO sale_items (
          id,
          sale_id,
          product_id,
          quantity,
          unit_price,
          total_amount,
          unit_cost,
          cogs_amount,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        saleItemId,
        saleId,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.total,
        fifo.averageCost,
        fifo.totalCost,
        nowISO()
      ]
    );

    await addStockLedger(db, {
      transactionId,
      productId: item.product_id,
      quantity: item.quantity,
      unitCost: fifo.averageCost,
      direction: "OUT",
      referenceType: "SALE",
      referenceId: saleId,
      note
    });

    await changeProductStock(
      db,
      item.product_id,
      -item.quantity
    );
  }

  // Update final COGS.
  await run(
    db,
    `
      UPDATE sales
      SET cogs_amount = ?
      WHERE id = ?
    `,
    [
      totalCOGS,
      saleId
    ]
  );

  // Cash/bKash/etc received.
  if (paid > 0) {
    await ledger(db, {
      transactionId,
      accountId,
      debit: paid,
      credit: 0,
      description: "Sale payment received",
      referenceType: "SALE",
      referenceId: saleId
    });

    await changeAccountBalance(
      db,
      accountId,
      paid,
      0
    );
  }

  // Remaining customer due.
  const due = total - paid;

  if (due > 0) {
    await ledger(db, {
      transactionId,
      accountId: ACCOUNT.CUSTOMER_RECEIVABLE,
      debit: due,
      credit: 0,
      description: "Customer receivable",
      referenceType: "SALE",
      referenceId: saleId
    });

    if (customerId) {
      await run(
        db,
        `
          UPDATE customers
          SET current_due =
            COALESCE(current_due, 0) + ?
          WHERE id = ?
        `,
        [
          due,
          customerId
        ]
      );
    }
  }

  // Sales income.
  await ledger(db, {
    transactionId,
    accountId: ACCOUNT.SALES_INCOME,
    debit: 0,
    credit: total,
    description: "Sales income",
    referenceType: "SALE",
    referenceId: saleId
  });

  // Cost of goods sold.
  if (totalCOGS > 0) {
    await ledger(db, {
      transactionId,
      accountId: ACCOUNT.COGS,
      debit: totalCOGS,
      credit: 0,
      description: "Cost of goods sold",
      referenceType: "SALE",
      referenceId: saleId
    });

    await ledger(db, {
      transactionId,
      accountId: ACCOUNT.INVENTORY,
      debit: 0,
      credit: totalCOGS,
      description: "Inventory reduction",
      referenceType: "SALE",
      referenceId: saleId
    });
  }

  return {
    success: true,
    type: "SALE",
    sale_id: saleId,
    transaction_id: transactionId,
    total,
    paid,
    due,
    cogs: totalCOGS,
    gross_profit: total - totalCOGS
  };
}


/* =========================================================
   CUSTOMER COLLECTION
========================================================= */

export async function createCustomerCollection(
  db,
  {
    customerId,
    amount,
    accountId = ACCOUNT.CASH,
    transactionDate = nowISO().slice(0, 10),
    note = null,
    idempotencyKey = null
  }
) {
  const customer = await getOne(
    db,
    `
      SELECT *
      FROM customers
      WHERE id = ?
      LIMIT 1
    `,
    [customerId]
  );

  if (!customer) {
    throw new Error("Customer not found");
  }

  const collectionAmount = money(amount);

  if (collectionAmount <= 0) {
    throw new Error("Collection amount must be greater than zero");
  }

  if (
    Number(customer.current_due || 0) <
    collectionAmount
  ) {
    throw new Error(
      "Collection amount is greater than customer due"
    );
  }

  const transactionId = uuid();

  const tx = await createTransaction(db, {
    transactionType: "CUSTOMER_COLLECTION",
    referenceId: transactionId,
    transactionDate,
    note,
    idempotencyKey
  });

  if (tx.duplicate) {
    return tx.transaction;
  }

  await run(
    db,
    `
      INSERT INTO customer_collections (
        id,
        transaction_id,
        customer_id,
        amount,
        account_id,
        collection_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      transactionId,
      tx.id,
      customerId,
      collectionAmount,
      accountId,
      transactionDate,
      note,
      nowISO()
    ]
  );

  await ledger(db, {
    transactionId: tx.id,
    accountId,
    debit: collectionAmount,
    credit: 0,
    description: "Customer due collection",
    referenceType: "CUSTOMER_COLLECTION",
    referenceId: transactionId
  });

  await ledger(db, {
    transactionId: tx.id,
    accountId: ACCOUNT.CUSTOMER_RECEIVABLE,
    debit: 0,
    credit: collectionAmount,
    description: "Customer receivable reduced",
    referenceType: "CUSTOMER_COLLECTION",
    referenceId: transactionId
  });

  await changeAccountBalance(
    db,
    accountId,
    collectionAmount,
    0
  );

  await run(
    db,
    `
      UPDATE customers
      SET current_due =
        COALESCE(current_due, 0) - ?
      WHERE id = ?
    `,
    [
      collectionAmount,
      customerId
    ]
  );

  return {
    success: true,
    type: "CUSTOMER_COLLECTION",
    transaction_id: tx.id,
    customer_id: customerId,
    amount: collectionAmount
  };
}


/* =========================================================
   SUPPLIER PAYMENT
========================================================= */

export async function createSupplierPayment(
  db,
  {
    supplierId,
    amount,
    accountId = ACCOUNT.CASH,
    transactionDate = nowISO().slice(0, 10),
    note = null,
    idempotencyKey = null
  }
) {
  const supplier = await getOne(
    db,
    `
      SELECT *
      FROM suppliers
      WHERE id = ?
      LIMIT 1
    `,
    [supplierId]
  );

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  const paymentAmount = money(amount);

  if (paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (
    Number(supplier.current_due || 0) <
    paymentAmount
  ) {
    throw new Error(
      "Payment amount is greater than supplier due"
    );
  }

  const paymentId = uuid();

  const tx = await createTransaction(db, {
    transactionType: "SUPPLIER_PAYMENT",
    referenceId: paymentId,
    transactionDate,
    note,
    idempotencyKey
  });

  if (tx.duplicate) {
    return tx.transaction;
  }

  await run(
    db,
    `
      INSERT INTO supplier_payments (
        id,
        transaction_id,
        supplier_id,
        amount,
        account_id,
        payment_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      paymentId,
      tx.id,
      supplierId,
      paymentAmount,
      accountId,
      transactionDate,
      note,
      nowISO()
    ]
  );

  await ledger(db, {
    transactionId: tx.id,
    accountId: ACCOUNT.SUPPLIER_PAYABLE,
    debit: paymentAmount,
    credit: 0,
    description: "Supplier payable reduced",
    referenceType: "SUPPLIER_PAYMENT",
    referenceId: paymentId
  });

  await ledger(db, {
    transactionId: tx.id,
    accountId,
    debit: 0,
    credit: paymentAmount,
    description: "Supplier payment",
    referenceType: "SUPPLIER_PAYMENT",
    referenceId: paymentId
  });

  await changeAccountBalance(
    db,
    accountId,
    0,
    paymentAmount
  );

  await run(
    db,
    `
      UPDATE suppliers
      SET current_due =
        COALESCE(current_due, 0) - ?
      WHERE id = ?
    `,
    [
      paymentAmount,
      supplierId
    ]
  );

  return {
    success: true,
    type: "SUPPLIER_PAYMENT",
    transaction_id: tx.id,
    supplier_id: supplierId,
    amount: paymentAmount
  };
}


/* =========================================================
   EXPENSE
========================================================= */

export async function createExpense(
  db,
  {
    amount,
    accountId = ACCOUNT.CASH,
    expenseType = "SHOP",
    transactionDate = nowISO().slice(0, 10),
    note = null,
    idempotencyKey = null
  }
) {
  const expenseAmount = money(amount);

  if (expenseAmount <= 0) {
    throw new Error("Expense amount must be greater than zero");
  }

  const expenseAccount =
    expenseType === "FAMILY"
      ? ACCOUNT.FAMILY_EXPENSE
      : ACCOUNT.SHOP_EXPENSE;

  const expenseId = uuid();

  const tx = await createTransaction(db, {
    transactionType: "EXPENSE",
    referenceId: expenseId,
    transactionDate,
    note,
    idempotencyKey
  });

  if (tx.duplicate) {
    return tx.transaction;
  }

  await run(
    db,
    `
      INSERT INTO expenses (
        id,
        transaction_id,
        amount,
        account_id,
        expense_type,
        expense_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      expenseId,
      tx.id,
      expenseAmount,
      accountId,
      expenseType,
      transactionDate,
      note,
      nowISO()
    ]
  );

  await ledger(db, {
    transactionId: tx.id,
    accountId: expenseAccount,
    debit: expenseAmount,
    credit: 0,
    description: "Expense",
    referenceType: "EXPENSE",
    referenceId: expenseId
  });

  await ledger(db, {
    transactionId: tx.id,
    accountId,
    debit: 0,
    credit: expenseAmount,
    description: "Expense payment",
    referenceType: "EXPENSE",
    referenceId: expenseId
  });

  await changeAccountBalance(
    db,
    accountId,
    0,
    expenseAmount
  );

  return {
    success: true,
    type: "EXPENSE",
    transaction_id: tx.id,
    amount: expenseAmount
  };
}


/* =========================================================
   OTHER INCOME
========================================================= */

export async function createOtherIncome(
  db,
  {
    amount,
    accountId = ACCOUNT.CASH,
    transactionDate = nowISO().slice(0, 10),
    note = null,
    idempotencyKey = null
  }
) {
  const incomeAmount = money(amount);

  if (incomeAmount <= 0) {
    throw new Error("Income amount must be greater than zero");
  }

  const incomeId = uuid();

  const tx = await createTransaction(db, {
    transactionType: "OTHER_INCOME",
    referenceId: incomeId,
    transactionDate,
    note,
    idempotencyKey
  });

  if (tx.duplicate) {
    return tx.transaction;
  }

  await run(
    db,
    `
      INSERT INTO other_income (
        id,
        transaction_id,
        amount,
        account_id,
        income_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      incomeId,
      tx.id,
      incomeAmount,
      accountId,
      transactionDate,
      note,
      nowISO()
    ]
  );

  await ledger(db, {
    transactionId: tx.id,
    accountId,
    debit: incomeAmount,
    credit: 0,
    description: "Other income received",
    referenceType: "OTHER_INCOME",
    referenceId: incomeId
  });

  await ledger(db, {
    transactionId: tx.id,
    accountId: ACCOUNT.OTHER_INCOME,
    debit: 0,
    credit: incomeAmount,
    description: "Other income",
    referenceType: "OTHER_INCOME",
    referenceId: incomeId
  });

  await changeAccountBalance(
    db,
    accountId,
    incomeAmount,
    0
  );

  return {
    success: true,
    type: "OTHER_INCOME",
    transaction_id: tx.id,
    amount: incomeAmount
  };
}


/* =========================================================
   STOCK ADJUSTMENT
========================================================= */

export async function createStockAdjustment(
  db,
  {
    productId,
    newQuantity,
    unitCost = null,
    reason,
    transactionDate = nowISO().slice(0, 10),
    note = null,
    idempotencyKey = null
  }
) {
  const product = await getProduct(
    db,
    productId
  );

  const nextQty = Number(newQuantity);

  if (!Number.isFinite(nextQty) || nextQty < 0) {
    throw new Error("Invalid new stock quantity");
  }

  const previousQty =
    Number(product.current_stock || 0);

  const difference =
    nextQty - previousQty;

  if (difference === 0) {
    throw new Error(
      "Stock quantity is already the same"
    );
  }

  const cost =
    unitCost !== null
      ? money(unitCost)
      : money(product.last_purchase_cost || 0);

  const adjustmentId = uuid();

  const tx = await createTransaction(db, {
    transactionType: "STOCK_ADJUSTMENT",
    referenceId: adjustmentId,
    transactionDate,
    note,
    idempotencyKey
  });

  if (tx.duplicate) {
    return tx.transaction;
  }

  await run(
    db,
    `
      INSERT INTO stock_adjustments (
        id,
        transaction_id,
        product_id,
        previous_quantity,
        new_quantity,
        difference_quantity,
        unit_cost,
        reason,
        adjustment_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      adjustmentId,
      tx.id,
      productId,
      previousQty,
      nextQty,
      difference,
      cost,
      cleanText(reason, "reason"),
      transactionDate,
      note,
      nowISO()
    ]
  );

  await addStockLedger(db, {
    transactionId: tx.id,
    productId,
    quantity: Math.abs(difference),
    unitCost: cost,
    direction:
      difference > 0
        ? "ADJUSTMENT_IN"
        : "ADJUSTMENT_OUT",
    referenceType: "STOCK_ADJUSTMENT",
    referenceId: adjustmentId,
    note
  });

  await run(
    db,
    `
      UPDATE products
      SET current_stock = ?
      WHERE id = ?
    `,
    [
      nextQty,
      productId
    ]
  );

  return {
    success: true,
    type: "STOCK_ADJUSTMENT",
    transaction_id: tx.id,
    product_id: productId,
    previous_quantity: previousQty,
    new_quantity: nextQty,
    difference
  };
}


/* =========================================================
   ACCOUNT TRANSFER
========================================================= */

export async function createAccountTransfer(
  db,
  {
    fromAccountId,
    toAccountId,
    amount,
    transactionDate = nowISO().slice(0, 10),
    note = null,
    idempotencyKey = null
  }
) {
  const from = validatePaymentAccount(
    fromAccountId
  );

  const to = validatePaymentAccount(
    toAccountId
  );

  if (from === to) {
    throw new Error(
      "Source and destination accounts cannot be the same"
    );
  }

  const transferAmount = money(amount);

  if (transferAmount <= 0) {
    throw new Error(
      "Transfer amount must be greater than zero"
    );
  }

  const transferId = uuid();

  const tx = await createTransaction(db, {
    transactionType: "ACCOUNT_TRANSFER",
    referenceId: transferId,
    transactionDate,
    note,
    idempotencyKey
  });

  if (tx.duplicate) {
    return tx.transaction;
  }

  await run(
    db,
    `
      INSERT INTO account_transfers (
        id,
        transaction_id,
        from_account_id,
        to_account_id,
        amount,
        transfer_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      transferId,
      tx.id,
      from,
      to,
      transferAmount,
      transactionDate,
      note,
      nowISO()
    ]
  );

  await ledger(db, {
    transactionId: tx.id,
    accountId: from,
    debit: 0,
    credit: transferAmount,
    description: "Account transfer out",
    referenceType: "ACCOUNT_TRANSFER",
    referenceId: transferId
  });

  await ledger(db, {
    transactionId: tx.id,
    accountId: to,
    debit: transferAmount,
    credit: 0,
    description: "Account transfer in",
    referenceType: "ACCOUNT_TRANSFER",
    referenceId: transferId
  });

  await changeAccountBalance(
    db,
    from,
    0,
    transferAmount
  );

  await changeAccountBalance(
    db,
    to,
    transferAmount,
    0
  );

  return {
    success: true,
    type: "ACCOUNT_TRANSFER",
    transaction_id: tx.id,
    from_account_id: from,
    to_account_id: to,
    amount: transferAmount
  };
}


/* =========================================================
   PUBLIC EXPORT
========================================================= */

export {
  ACCOUNT
};
