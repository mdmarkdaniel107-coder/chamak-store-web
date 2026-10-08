// ============================================================
// CHAMAK STORE
// FINAL INTEGRITY SERVICE
// ============================================================


export async function runIntegrityCheck(db) {

  const checks = [];


  // ----------------------------------------------------------
  // 1. Negative Stock
  // ----------------------------------------------------------

  const negativeStock =
    await db.prepare(`
      SELECT
        id,
        name,
        current_stock
      FROM products
      WHERE current_stock < 0
    `).all();


  checks.push({
    check: "NEGATIVE_STOCK",
    status:
      negativeStock.results?.length
        ? "FAIL"
        : "PASS",
    count:
      negativeStock.results?.length || 0,
    details:
      negativeStock.results || []
  });


  // ----------------------------------------------------------
  // 2. Negative Customer Due
  // ----------------------------------------------------------

  const negativeCustomerDue =
    await db.prepare(`
      SELECT
        id,
        name,
        current_due
      FROM customers
      WHERE current_due < 0
    `).all();


  checks.push({
    check: "NEGATIVE_CUSTOMER_DUE",
    status:
      negativeCustomerDue.results?.length
        ? "FAIL"
        : "PASS",
    count:
      negativeCustomerDue.results?.length || 0,
    details:
      negativeCustomerDue.results || []
  });


  // ----------------------------------------------------------
  // 3. Negative Supplier Due
  // ----------------------------------------------------------

  const negativeSupplierDue =
    await db.prepare(`
      SELECT
        id,
        name,
        current_due
      FROM suppliers
      WHERE current_due < 0
    `).all();


  checks.push({
    check: "NEGATIVE_SUPPLIER_DUE",
    status:
      negativeSupplierDue.results?.length
        ? "FAIL"
        : "PASS",
    count:
      negativeSupplierDue.results?.length || 0,
    details:
      negativeSupplierDue.results || []
  });


  // ----------------------------------------------------------
  // 4. Sale arithmetic
  // ----------------------------------------------------------

  const invalidSales =
    await db.prepare(`
      SELECT
        id,
        total_amount,
        paid_amount,
        due_amount
      FROM sales
      WHERE
        paid_amount + due_amount
        != total_amount
    `).all();


  checks.push({
    check: "SALE_ARITHMETIC",
    status:
      invalidSales.results?.length
        ? "FAIL"
        : "PASS",
    count:
      invalidSales.results?.length || 0,
    details:
      invalidSales.results || []
  });


  // ----------------------------------------------------------
  // 5. Purchase arithmetic
  // ----------------------------------------------------------

  const invalidPurchases =
    await db.prepare(`
      SELECT
        id,
        total_amount,
        paid_amount,
        payable_amount
      FROM purchases
      WHERE
        paid_amount + payable_amount
        != total_amount
    `).all();


  checks.push({
    check: "PURCHASE_ARITHMETIC",
    status:
      invalidPurchases.results?.length
        ? "FAIL"
        : "PASS",
    count:
      invalidPurchases.results?.length || 0,
    details:
      invalidPurchases.results || []
  });


  // ----------------------------------------------------------
  // 6. Ledger balance
  //
  // Double-entry rule:
  //
  // Total Debit = Total Credit
  // ----------------------------------------------------------

  const ledgerBalance =
    await db.prepare(`
      SELECT

        COALESCE(
          SUM(debit_amount),
          0
        ) AS debit,

        COALESCE(
          SUM(credit_amount),
          0
        ) AS credit

      FROM ledger_entries
    `).first();


  const debit =
    Number(
      ledgerBalance?.debit || 0
    );

  const credit =
    Number(
      ledgerBalance?.credit || 0
    );


  checks.push({
    check: "DOUBLE_ENTRY_BALANCE",
    status:
      debit === credit
        ? "PASS"
        : "FAIL",
    debit,
    credit,
    difference:
      debit - credit
  });


  // ----------------------------------------------------------
  // 7. Orphan Sale Items
  // ----------------------------------------------------------

  const orphanSaleItems =
    await db.prepare(`
      SELECT
        si.id
      FROM sale_items si
      LEFT JOIN sales s
        ON s.id = si.sale_id
      WHERE s.id IS NULL
    `).all();


  checks.push({
    check: "ORPHAN_SALE_ITEMS",
    status:
      orphanSaleItems.results?.length
        ? "FAIL"
        : "PASS",
    count:
      orphanSaleItems.results?.length || 0
  });


  // ----------------------------------------------------------
  // 8. Orphan Purchase Items
  // ----------------------------------------------------------

  const orphanPurchaseItems =
    await db.prepare(`
      SELECT
        pi.id
      FROM purchase_items pi
      LEFT JOIN purchases p
        ON p.id = pi.purchase_id
      WHERE p.id IS NULL
    `).all();


  checks.push({
    check: "ORPHAN_PURCHASE_ITEMS",
    status:
      orphanPurchaseItems.results?.length
        ? "FAIL"
        : "PASS",
    count:
      orphanPurchaseItems.results?.length || 0
  });


  // ----------------------------------------------------------
  // Overall
  // ----------------------------------------------------------

  const failed =
    checks.filter(
      check => check.status === "FAIL"
    );


  return {

    success:
      failed.length === 0,

    status:
      failed.length === 0
        ? "PASS"
        : "FAIL",

    checks

  };
}
