// src/index.js

import {
  ACCOUNT,
  createPurchase,
  createSale,
  createCustomerCollection,
  createSupplierPayment,
  createExpense,
  createOtherIncome,
  createStockAdjustment,
  createAccountTransfer
} from "./services/transactionEngine.js";
import {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,

  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,

  createSupplier,
  getSupplier,
  updateSupplier,
  deleteSupplier
} from "./services/masterDataService.js";

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Idempotency-Key"
      }
    }
  );
}


function errorResponse(error, status = 400) {
  return json(
    {
      success: false,
      error: error?.message || String(error)
    },
    status
  );
}


async function readJSON(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON request body");
  }
}


/* =========================================================
   CORS
========================================================= */

function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Idempotency-Key",
      "Access-Control-Max-Age": "86400"
    }
  });
}


/* =========================================================
   DATABASE HELPERS
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
   IDEMPOTENCY KEY
========================================================= */

function getIdempotencyKey(request, body) {
  return (
    request.headers.get("X-Idempotency-Key") ||
    body?.idempotency_key ||
    null
  );
}

// ============================================================
// STEP 12 — DASHBOARD + REPORTS API
// ============================================================

if (
  request.method === "GET" &&
  pathname === "/api/dashboard"
) {
  try {

    const url = new URL(request.url);

    const from =
      url.searchParams.get("from") ||
      new Date().toISOString().slice(0, 10);

    const to =
      url.searchParams.get("to") ||
      from;

    // --------------------------------------------------------
    // 1. SALES
    // --------------------------------------------------------

    const sales = await env.DB.prepare(`
      SELECT
        COUNT(*) AS invoice_count,
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COALESCE(SUM(paid_amount), 0) AS paid_sales,
        COALESCE(SUM(due_amount), 0) AS due_sales
      FROM sales
      WHERE sale_date BETWEEN ? AND ?
    `)
      .bind(from, to)
      .first();


    // --------------------------------------------------------
    // 2. PURCHASE
    // --------------------------------------------------------

    const purchases = await env.DB.prepare(`
      SELECT
        COUNT(*) AS invoice_count,
        COALESCE(SUM(total_amount), 0) AS total_purchase,
        COALESCE(SUM(paid_amount), 0) AS paid_purchase,
        COALESCE(SUM(due_amount), 0) AS due_purchase
      FROM purchases
      WHERE purchase_date BETWEEN ? AND ?
    `)
      .bind(from, to)
      .first();


    // --------------------------------------------------------
    // 3. EXPENSE
    // --------------------------------------------------------

    const expenses = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_expense
      FROM expenses
      WHERE expense_date BETWEEN ? AND ?
    `)
      .bind(from, to)
      .first();


    // --------------------------------------------------------
    // 4. CUSTOMER COLLECTION
    // --------------------------------------------------------

    const collections = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_collection
      FROM customer_collections
      WHERE collection_date BETWEEN ? AND ?
    `)
      .bind(from, to)
      .first();


    // --------------------------------------------------------
    // 5. SUPPLIER PAYMENT
    // --------------------------------------------------------

    const supplierPayments = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_supplier_payment
      FROM supplier_payments
      WHERE payment_date BETWEEN ? AND ?
    `)
      .bind(from, to)
      .first();


    // --------------------------------------------------------
    // 6. OTHER INCOME
    // --------------------------------------------------------

    const otherIncome = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_other_income
      FROM other_income
      WHERE income_date BETWEEN ? AND ?
    `)
      .bind(from, to)
      .first();


    // --------------------------------------------------------
    // 7. CURRENT CUSTOMER DUE
    // --------------------------------------------------------

    const customerDue = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(current_due), 0) AS total_customer_due,
        COUNT(*) AS customers_with_due
      FROM customers
      WHERE current_due > 0
    `)
      .first();


    // --------------------------------------------------------
    // 8. CURRENT SUPPLIER DUE
    // --------------------------------------------------------

    const supplierDue = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(current_due), 0) AS total_supplier_due,
        COUNT(*) AS suppliers_with_due
      FROM suppliers
      WHERE current_due > 0
    `)
      .first();


    // --------------------------------------------------------
    // 9. CURRENT STOCK
    // --------------------------------------------------------

    const stock = await env.DB.prepare(`
      SELECT
        COALESCE(
          SUM(
            current_stock *
            COALESCE(last_purchase_cost, 0)
          ),
          0
        ) AS stock_value,

        COALESCE(
          SUM(current_stock),
          0
        ) AS total_quantity,

        COUNT(*) AS product_count

      FROM products
      WHERE is_active = 1
    `)
      .first();


    // --------------------------------------------------------
    // 10. LOW STOCK
    // --------------------------------------------------------

    const lowStock = await env.DB.prepare(`
      SELECT
        id,
        name,
        current_stock,
        low_stock_level
      FROM products
      WHERE
        is_active = 1
        AND current_stock <= low_stock_level
      ORDER BY current_stock ASC
      LIMIT 20
    `)
      .all();


    // --------------------------------------------------------
    // 11. TOP SELLING PRODUCTS
    // --------------------------------------------------------

    const topProducts = await env.DB.prepare(`
      SELECT
        p.id,
        p.name,

        COALESCE(
          SUM(si.quantity),
          0
        ) AS quantity_sold,

        COALESCE(
          SUM(si.line_total),
          0
        ) AS sales_value

      FROM sale_items si

      INNER JOIN sales s
        ON s.id = si.sale_id

      INNER JOIN products p
        ON p.id = si.product_id

      WHERE
        s.sale_date BETWEEN ? AND ?

      GROUP BY
        p.id,
        p.name

      ORDER BY
        quantity_sold DESC

      LIMIT 10
    `)
      .bind(from, to)
      .all();


    // --------------------------------------------------------
    // 12. RECENT TRANSACTIONS
    // --------------------------------------------------------

    const recentTransactions =
      await env.DB.prepare(`
        SELECT
          id,
          transaction_type,
          transaction_date,
          reference,
          total_amount
        FROM transactions
        ORDER BY created_at DESC
        LIMIT 20
      `)
      .all();


    // --------------------------------------------------------
    // 13. PROFIT
    //
    // Sales - COGS - Shop Expense
    //
    // এখানে Family Expense ব্যবসার profit থেকে
    // বাদ দেওয়া হচ্ছে না।
    // --------------------------------------------------------

    const cogs = await env.DB.prepare(`
      SELECT
        COALESCE(
          SUM(
            ABS(le.debit_amount)
          ),
          0
        ) AS total_cogs

      FROM ledger_entries le

      INNER JOIN transactions t
        ON t.id = le.transaction_id

      WHERE
        t.transaction_date BETWEEN ? AND ?
        AND le.account_id = 5000
    `)
      .bind(from, to)
      .first();


    const totalSales =
      Number(sales?.total_sales || 0);

    const totalCOGS =
      Number(cogs?.total_cogs || 0);

    const totalExpense =
      Number(expenses?.total_expense || 0);

    const totalOtherIncome =
      Number(otherIncome?.total_other_income || 0);

    const grossProfit =
      totalSales - totalCOGS;

    const netProfit =
      grossProfit -
      totalExpense +
      totalOtherIncome;


    // --------------------------------------------------------
    // 14. CASH / ACCOUNT BALANCES
    // --------------------------------------------------------

    const accountBalances =
      await env.DB.prepare(`
        SELECT
          id,
          code,
          name,
          account_type,
          current_balance
        FROM accounts
        WHERE is_active = 1
        ORDER BY id
      `)
      .all();


    return jsonResponse({
      success: true,

      period: {
        from,
        to
      },

      sales: {
        invoices:
          Number(sales?.invoice_count || 0),

        total:
          totalSales,

        paid:
          Number(sales?.paid_sales || 0),

        due:
          Number(sales?.due_sales || 0)
      },

      purchases: {
        invoices:
          Number(purchases?.invoice_count || 0),

        total:
          Number(purchases?.total_purchase || 0),

        paid:
          Number(purchases?.paid_purchase || 0),

        due:
          Number(purchases?.due_purchase || 0)
      },

      collections:
        Number(
          collections?.total_collection || 0
        ),

      supplierPayments:
        Number(
          supplierPayments?.total_supplier_payment || 0
        ),

      expenses:
        totalExpense,

      otherIncome:
        totalOtherIncome,

      profit: {
        gross:
          grossProfit,

        net:
          netProfit,

        cogs:
          totalCOGS
      },

      customerDue: {
        total:
          Number(
            customerDue?.total_customer_due || 0
          ),

        customers:
          Number(
            customerDue?.customers_with_due || 0
          )
      },

      supplierDue: {
        total:
          Number(
            supplierDue?.total_supplier_due || 0
          ),

        suppliers:
          Number(
            supplierDue?.suppliers_with_due || 0
          )
      },

      stock: {
        value:
          Number(stock?.stock_value || 0),

        quantity:
          Number(stock?.total_quantity || 0),

        products:
          Number(stock?.product_count || 0)
      },

      lowStock:
        lowStock.results || [],

      topProducts:
        topProducts.results || [],

      recentTransactions:
        recentTransactions.results || [],

      accounts:
        accountBalances.results || []

    });

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    return jsonResponse(
      {
        error:
          error.message ||
          "Dashboard load failed"
      },
      500
    );
  }
}


/* =========================================================
   PRODUCTS
========================================================= */

async function listProducts(db, url) {
  const search =
    url.searchParams.get("search")?.trim() || "";

  const lowStock =
    url.searchParams.get("low_stock") === "1";

  let sql = `
    SELECT
      id,
      sku,
      name,
      unit,
      purchase_price,
      sale_price,
      last_purchase_cost,
      current_stock,
      low_stock_level,
      created_at,
      updated_at
    FROM products
  `;

  const params = [];
  const conditions = [];

  if (search) {
    conditions.push(`
      (
        name LIKE ?
        OR sku LIKE ?
      )
    `);

    const value = `%${search}%`;

    params.push(value, value);
  }

  if (lowStock) {
    conditions.push(`
      current_stock <= low_stock_level
    `);
  }

  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")} `;
  }

  sql += `
    ORDER BY name COLLATE NOCASE ASC
    LIMIT 1000
  `;

  const products = await getAll(
    db,
    sql,
    params
  );

  return json({
    success: true,
    products
  });
}


/* =========================================================
   CUSTOMERS
========================================================= */

async function listCustomers(db, url) {
  const search =
    url.searchParams.get("search")?.trim() || "";

  let sql = `
    SELECT
      id,
      name,
      phone,
      address,
      current_due,
      created_at,
      updated_at
    FROM customers
  `;

  const params = [];

  if (search) {
    sql += `
      WHERE
        name LIKE ?
        OR phone LIKE ?
    `;

    const value = `%${search}%`;

    params.push(value, value);
  }

  sql += `
    ORDER BY name COLLATE NOCASE ASC
    LIMIT 1000
  `;

  const customers = await getAll(
    db,
    sql,
    params
  );

  return json({
    success: true,
    customers
  });
}


/* =========================================================
   SUPPLIERS
========================================================= */

async function listSuppliers(db, url) {
  const search =
    url.searchParams.get("search")?.trim() || "";

  let sql = `
    SELECT
      id,
      name,
      phone,
      address,
      current_due,
      created_at,
      updated_at
    FROM suppliers
  `;

  const params = [];

  if (search) {
    sql += `
      WHERE
        name LIKE ?
        OR phone LIKE ?
    `;

    const value = `%${search}%`;

    params.push(value, value);
  }

  sql += `
    ORDER BY name COLLATE NOCASE ASC
    LIMIT 1000
  `;

  const suppliers = await getAll(
    db,
    sql,
    params
  );

  return json({
    success: true,
    suppliers
  });
}


/* =========================================================
   ACCOUNTS
========================================================= */

async function listAccounts(db) {
  const accounts = await getAll(
    db,
    `
      SELECT
        id,
        code,
        name,
        type,
        current_balance,
        is_active
      FROM accounts
      WHERE is_active = 1
      ORDER BY code
    `
  );

  return json({
    success: true,
    accounts
  });
}


/* =========================================================
   STOCK VERIFICATION
========================================================= */

async function stockVerification(db, url) {
  const search =
    url.searchParams.get("search")?.trim() || "";

  let sql = `
    SELECT
      id,
      sku,
      name,
      current_stock,
      last_purchase_cost,
      ROUND(
        current_stock * COALESCE(last_purchase_cost, 0)
      ) AS expected_stock_value
    FROM products
  `;

  const params = [];

  if (search) {
    sql += `
      WHERE
        name LIKE ?
        OR sku LIKE ?
    `;

    const value = `%${search}%`;

    params.push(value, value);
  }

  sql += `
    ORDER BY name COLLATE NOCASE ASC
    LIMIT 1000
  `;

  const products = await getAll(
    db,
    sql,
    params
  );

  return json({
    success: true,
    products
  });
}
// ============================================================
// STOCK VERIFICATION — SAVE SNAPSHOT
// ============================================================

if (
  request.method === "POST" &&
  pathname === "/api/stock-verification"
) {

  try {

    const body = await request.json();

    const verificationDate =
      body.verification_date ||
      new Date().toISOString().slice(0, 10);

    const note =
      String(body.note || "").trim();

    const items =
      Array.isArray(body.items)
        ? body.items
        : [];

    if (!items.length) {

      return jsonResponse(
        {
          error:
            "কমপক্ষে একটি stock verification item প্রয়োজন"
        },
        400
      );

    }

    const transactionId =
      crypto.randomUUID();

    const verificationId =
      crypto.randomUUID();

    const createdAt =
      new Date().toISOString();

    /*
     * IMPORTANT:
     *
     * Verification শুধু snapshot।
     * এখানে products.current_stock পরিবর্তন করা হবে না।
     */

    const productIds =
      [
        ...new Set(
          items
            .map(item => Number(item.product_id))
            .filter(id => Number.isInteger(id) && id > 0)
        )
      ];

    if (!productIds.length) {

      return jsonResponse(
        {
          error:
            "Valid product_id পাওয়া যায়নি"
        },
        400
      );

    }

    const placeholders =
      productIds.map(() => "?").join(",");

    const productsResult =
      await env.DB.prepare(`
        SELECT
          id,
          name,
          current_stock,
          last_purchase_cost
        FROM products
        WHERE id IN (${placeholders})
      `)
      .bind(...productIds)
      .all();

    const productsById =
      new Map(
        (productsResult.results || [])
          .map(product => [
            Number(product.id),
            product
          ])
      );

    const statements = [];

    statements.push(
      env.DB.prepare(`
        INSERT INTO stock_verifications (
          id,
          verification_date,
          note,
          created_at
        )
        VALUES (?, ?, ?, ?)
      `).bind(
        verificationId,
        verificationDate,
        note,
        createdAt
      )
    );

    for (const item of items) {

      const productId =
        Number(item.product_id);

      const physicalQty =
        Number(item.physical_qty);

      const product =
        productsById.get(productId);

      if (!product) {

        return jsonResponse(
          {
            error:
              `Product not found: ${productId}`
          },
          400
        );

      }

      if (
        !Number.isFinite(physicalQty) ||
        physicalQty < 0
      ) {

        return jsonResponse(
          {
            error:
              `Invalid physical quantity for product ${productId}`
          },
          400
        );

      }

      const systemQty =
        Number(product.current_stock || 0);

      const unitCost =
        Number(product.last_purchase_cost || 0);

      const expectedValue =
        systemQty * unitCost;

      const physicalValue =
        physicalQty * unitCost;

      const differenceQty =
        physicalQty - systemQty;

      const differenceValue =
        physicalValue - expectedValue;

      statements.push(
        env.DB.prepare(`
          INSERT INTO stock_verification_items (
            id,
            verification_id,
            product_id,
            system_qty,
            unit_cost,
            expected_value,
            physical_qty,
            physical_value,
            difference_qty,
            difference_value
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          verificationId,
          productId,
          systemQty,
          unitCost,
          expectedValue,
          physicalQty,
          physicalValue,
          differenceQty,
          differenceValue
        )
      );

    }

    /*
     * D1 batch:
     * Verification header + all items
     * একসাথে commit হবে।
     */
    await env.DB.batch(statements);

    return jsonResponse(
      {
        success: true,
        verification_id:
          verificationId,
        items_saved:
          items.length
      },
      201
    );

  } catch (error) {

    console.error(
      "Stock verification error:",
      error
    );

    return jsonResponse(
      {
        error:
          error.message ||
          "Stock verification failed"
      },
      500
    );

  }
}


// ============================================================
// SUPPLIER LEDGER
// ============================================================

if (
  pathname.match(
    /^\/api\/suppliers\/\d+\/ledger$/
  ) &&
  request.method === "GET"
) {

  const supplierId =
    Number(
      pathname.split("/")[3]
    );


  if (!supplierId) {

    return jsonResponse(
      {
        error:
          "Invalid supplier ID"
      },
      400,
      corsHeaders
    );

  }


  try {

    const supplier =
      await env.DB
        .prepare(`
          SELECT
            id,
            name,
            phone,
            current_due
          FROM suppliers
          WHERE id = ?
        `)
        .bind(supplierId)
        .first();


    if (!supplier) {

      return jsonResponse(
        {
          error:
            "Supplier not found"
        },
        404,
        corsHeaders
      );

    }


    const purchases =
      await env.DB
        .prepare(`
          SELECT
            p.id,
            p.purchase_date AS date,
            'PURCHASE' AS type,
            COALESCE(
              p.reference,
              ''
            ) AS reference,
            COALESCE(
              p.total_amount,
              0
            ) AS credit,
            0 AS debit
          FROM purchases p
          WHERE p.supplier_id = ?

          ORDER BY
            p.purchase_date ASC,
            p.id ASC
        `)
        .bind(supplierId)
        .all();


    const payments =
      await env.DB
        .prepare(`
          SELECT
            sp.id,
            sp.payment_date AS date,
            'PAYMENT' AS type,
            COALESCE(
              sp.note,
              ''
            ) AS reference,
            0 AS credit,
            COALESCE(
              sp.amount,
              0
            ) AS debit
          FROM supplier_payments sp
          WHERE sp.supplier_id = ?

          ORDER BY
            sp.payment_date ASC,
            sp.id ASC
        `)
        .bind(supplierId)
        .all();


    const entries = [
      ...(purchases.results || []),
      ...(payments.results || [])
    ]
      .sort((a, b) => {

        const dateCompare =
          String(a.date || "")
            .localeCompare(
              String(b.date || "")
            );


        if (dateCompare !== 0) {
          return dateCompare;
        }


        return Number(a.id) -
          Number(b.id);

      });


    let balance = 0;


    for (const entry of entries) {

      balance +=
        Number(entry.credit || 0);

      balance -=
        Number(entry.debit || 0);

      entry.balance =
        balance;

    }


    const totalDue =
      entries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.credit || 0
          ),
        0
      );


    const totalPayment =
      entries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.debit || 0
          ),
        0
      );


    return jsonResponse(
      {
        supplier,
        entries,
        total_due:
          totalDue,
        total_payment:
          totalPayment,
        current_due:
          Number(
            supplier.current_due || 0
          )
      },
      200,
      corsHeaders
    );


  } catch (error) {

    console.error(
      "Supplier ledger error:",
      error
    );


    return jsonResponse(
      {
        error:
          error.message ||
          "Supplier ledger failed"
      },
      500,
      corsHeaders
    );

  }
}

/* =========================================================
   TRANSACTION ROUTER
========================================================= */

async function transactionRoute(
  request,
  env,
  type
) {
  const body = await readJSON(request);

  const db = env.DB;

  const idempotencyKey =
    getIdempotencyKey(request, body);

  const common = {
    transactionDate:
      body.transaction_date ||
      new Date().toISOString().slice(0, 10),

    note:
      body.note || null,

    idempotencyKey
  };


  switch (type) {

    /* ---------------------------------------------
       PURCHASE
    --------------------------------------------- */

    case "purchase":

      return json(
        await createPurchase(db, {
          supplierId:
            body.supplier_id || null,

          items:
            body.items,

          paymentAccountId:
            body.payment_account_id ||
            ACCOUNT.CASH,

          paidAmount:
            body.paid_amount || 0,

          ...common
        })
      );


    /* ---------------------------------------------
       SALE
    --------------------------------------------- */

    case "sale":

      return json(
        await createSale(db, {
          customerId:
            body.customer_id || null,

          items:
            body.items,

          paymentAccountId:
            body.payment_account_id ||
            ACCOUNT.CASH,

          paidAmount:
            body.paid_amount || 0,

          ...common
        })
      );


    /* ---------------------------------------------
       CUSTOMER COLLECTION
    --------------------------------------------- */

    case "customer-collection":

      return json(
        await createCustomerCollection(db, {
          customerId:
            body.customer_id,

          amount:
            body.amount,

          accountId:
            body.account_id ||
            ACCOUNT.CASH,

          ...common
        })
      );


    /* ---------------------------------------------
       SUPPLIER PAYMENT
    --------------------------------------------- */

    case "supplier-payment":

      return json(
        await createSupplierPayment(db, {
          supplierId:
            body.supplier_id,

          amount:
            body.amount,

          accountId:
            body.account_id ||
            ACCOUNT.CASH,

          ...common
        })
      );


    /* ---------------------------------------------
       EXPENSE
    --------------------------------------------- */

    case "expense":

      return json(
        await createExpense(db, {
          amount:
            body.amount,

          accountId:
            body.account_id ||
            ACCOUNT.CASH,

          expenseType:
            body.expense_type ||
            "SHOP",

          ...common
        })
      );


    /* ---------------------------------------------
       OTHER INCOME
    --------------------------------------------- */

    case "other-income":

      return json(
        await createOtherIncome(db, {
          amount:
            body.amount,

          accountId:
            body.account_id ||
            ACCOUNT.CASH,

          ...common
        })
      );


    /* ---------------------------------------------
       STOCK ADJUSTMENT
    --------------------------------------------- */

    case "stock-adjustment":

      return json(
        await createStockAdjustment(db, {
          productId:
            body.product_id,

          newQuantity:
            body.new_quantity,

          unitCost:
            body.unit_cost ?? null,

          reason:
            body.reason,

          ...common
        })
      );


    /* ---------------------------------------------
       ACCOUNT TRANSFER
    --------------------------------------------- */

    case "account-transfer":

      return json(
        await createAccountTransfer(db, {
          fromAccountId:
            body.from_account_id,

          toAccountId:
            body.to_account_id,

          amount:
            body.amount,

          ...common
        })
      );


    default:

      throw new Error(
        `Unknown transaction type: ${type}`
      );
  }
}


/* =========================================================
   MAIN ROUTER
========================================================= */

export default {

  async fetch(request, env) {

    /* ---------------------------------------------
       CORS PREFLIGHT
    --------------------------------------------- */

    if (request.method === "OPTIONS") {
      return corsResponse();
    }


    const url =
      new URL(request.url);

    const path =
      url.pathname.replace(/\/+$/, "") ||
      "/";


    try {

      /* ---------------------------------------------
         HEALTH
      --------------------------------------------- */

      if (
        request.method === "GET" &&
        path === "/api/health"
      ) {

        const result =
          await getOne(
            env.DB,
            `SELECT 1 AS ok`
          );

        return json({
          success: true,
          status: "ok",
          database:
            result?.ok === 1
              ? "connected"
              : "unknown",
          service: "chamak-store",
          version: "1.0.0"
        });
      }


      /* ---------------------------------------------
         DASHBOARD
      --------------------------------------------- */

      if (
        request.method === "GET" &&
        path === "/api/dashboard"
      ) {

        return json(
          await dashboard(env.DB)
        );
      }


      /* ---------------------------------------------
         PRODUCTS
      --------------------------------------------- */

      if (
        request.method === "GET" &&
        path === "/api/products"
      ) {

        return await listProducts(
          env.DB,
          url
        );
      }

      /* =========================================================
   PRODUCT CREATE
========================================================= */

if (
  request.method === "POST" &&
  path === "/api/products"
) {

  const body =
    await readJSON(request);

  return json(
    await createProduct(
      env.DB,
      {
        sku: body.sku,
        name: body.name,
        unit: body.unit,
        purchasePrice:
          body.purchase_price ?? 0,
        salePrice:
          body.sale_price ?? 0,
        lowStockLevel:
          body.low_stock_level ?? 0
      }
    )
  );
}


/* =========================================================
   PRODUCT GET ONE
========================================================= */

if (
  request.method === "GET" &&
  /^\/api\/products\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  return json({
    success: true,
    product:
      await getProduct(
        env.DB,
        id
      )
  });
}


/* =========================================================
   PRODUCT UPDATE
========================================================= */

if (
  request.method === "PUT" &&
  /^\/api\/products\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  const body =
    await readJSON(request);

  return json(
    await updateProduct(
      env.DB,
      id,
      body
    )
  );
}


/* =========================================================
   PRODUCT DELETE
========================================================= */

if (
  request.method === "DELETE" &&
  /^\/api\/products\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  return json(
    await deleteProduct(
      env.DB,
      id
    )
  );
}


/* =========================================================
   CUSTOMER CREATE
========================================================= */

if (
  request.method === "POST" &&
  path === "/api/customers"
) {

  const body =
    await readJSON(request);

  return json(
    await createCustomer(
      env.DB,
      {
        name: body.name,
        phone: body.phone,
        address: body.address
      }
    )
  );
}


/* =========================================================
   CUSTOMER GET ONE
========================================================= */

if (
  request.method === "GET" &&
  /^\/api\/customers\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  return json({
    success: true,
    customer:
      await getCustomer(
        env.DB,
        id
      )
  });
}


/* =========================================================
   CUSTOMER UPDATE
========================================================= */

if (
  request.method === "PUT" &&
  /^\/api\/customers\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  const body =
    await readJSON(request);

  return json(
    await updateCustomer(
      env.DB,
      id,
      body
    )
  );
}


/* =========================================================
   CUSTOMER DELETE
========================================================= */

if (
  request.method === "DELETE" &&
  /^\/api\/customers\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  return json(
    await deleteCustomer(
      env.DB,
      id
    )
  );
}
// ============================================================
// CUSTOMER LEDGER
// ============================================================

if (
  pathname.match(
    /^\/api\/customers\/\d+\/ledger$/
  ) &&
  request.method === "GET"
) {

  const customerId =
    Number(
      pathname.split("/")[3]
    );


  if (!customerId) {

    return jsonResponse(
      {
        error:
          "Invalid customer ID"
      },
      400,
      corsHeaders
    );

  }


  try {

    const customer =
      await env.DB
        .prepare(`
          SELECT
            id,
            name,
            phone,
            current_due
          FROM customers
          WHERE id = ?
        `)
        .bind(customerId)
        .first();


    if (!customer) {

      return jsonResponse(
        {
          error:
            "Customer not found"
        },
        404,
        corsHeaders
      );

    }


    const sales =
      await env.DB
        .prepare(`
          SELECT
            s.id,
            s.sale_date AS date,
            'SALE' AS type,
            COALESCE(
              s.reference,
              ''
            ) AS reference,
            COALESCE(
              s.total_amount,
              0
            ) AS debit,
            0 AS credit
          FROM sales s
          WHERE s.customer_id = ?

          ORDER BY
            s.sale_date ASC,
            s.id ASC
        `)
        .bind(customerId)
        .all();


    const collections =
      await env.DB
        .prepare(`
          SELECT
            cc.id,
            cc.collection_date AS date,
            'COLLECTION' AS type,
            COALESCE(
              cc.note,
              ''
            ) AS reference,
            0 AS debit,
            COALESCE(
              cc.amount,
              0
            ) AS credit
          FROM customer_collections cc
          WHERE cc.customer_id = ?

          ORDER BY
            cc.collection_date ASC,
            cc.id ASC
        `)
        .bind(customerId)
        .all();


    const entries = [
      ...(sales.results || []),
      ...(collections.results || [])
    ]
      .sort((a, b) => {

        const dateCompare =
          String(a.date || "")
            .localeCompare(
              String(b.date || "")
            );

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return Number(a.id) -
          Number(b.id);

      });


    let balance = 0;


    for (const entry of entries) {

      balance +=
        Number(entry.debit || 0);

      balance -=
        Number(entry.credit || 0);

      entry.balance =
        balance;

    }


    const totalDue =
      entries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.debit || 0
          ),
        0
      );


    const totalCollection =
      entries.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.credit || 0
          ),
        0
      );


    return jsonResponse(
      {
        customer,
        entries,
        total_due: totalDue,
        total_collection:
          totalCollection,
        current_due:
          Number(
            customer.current_due || 0
          )
      },
      200,
      corsHeaders
    );


  } catch (error) {

    console.error(
      "Customer ledger error:",
      error
    );


    return jsonResponse(
      {
        error:
          error.message ||
          "Customer ledger failed"
      },
      500,
      corsHeaders
    );

  }
}      


/* =========================================================
   SUPPLIER CREATE
========================================================= */

if (
  request.method === "POST" &&
  path === "/api/suppliers"
) {

  const body =
    await readJSON(request);

  return json(
    await createSupplier(
      env.DB,
      {
        name: body.name,
        phone: body.phone,
        address: body.address
      }
    )
  );
}


/* =========================================================
   SUPPLIER GET ONE
========================================================= */

if (
  request.method === "GET" &&
  /^\/api\/suppliers\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  return json({
    success: true,
    supplier:
      await getSupplier(
        env.DB,
        id
      )
  });
}


/* =========================================================
   SUPPLIER UPDATE
========================================================= */

if (
  request.method === "PUT" &&
  /^\/api\/suppliers\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  const body =
    await readJSON(request);

  return json(
    await updateSupplier(
      env.DB,
      id,
      body
    )
  );
}


/* =========================================================
   SUPPLIER DELETE
========================================================= */

if (
  request.method === "DELETE" &&
  /^\/api\/suppliers\/[^/]+$/.test(path)
) {

  const id =
    path.split("/").pop();

  return json(
    await deleteSupplier(
      env.DB,
      id
    )
  );
}

      


      /* ---------------------------------------------
         CUSTOMERS
      --------------------------------------------- */

      if (
        request.method === "GET" &&
        path === "/api/customers"
      ) {

        return await listCustomers(
          env.DB,
          url
        );
      }


      /* ---------------------------------------------
         SUPPLIERS
      --------------------------------------------- */

      if (
        request.method === "GET" &&
        path === "/api/suppliers"
      ) {

        return await listSuppliers(
          env.DB,
          url
        );
      }


      /* ---------------------------------------------
         ACCOUNTS
      --------------------------------------------- */

      if (
        request.method === "GET" &&
        path === "/api/accounts"
      ) {

        return await listAccounts(
          env.DB
        );
      }


      /* ---------------------------------------------
         STOCK VERIFICATION
      --------------------------------------------- */

      if (
        request.method === "GET" &&
        path === "/api/stock-verification"
      ) {

        return await stockVerification(
          env.DB,
          url
        );
      }


      /* ---------------------------------------------
         PURCHASE
      --------------------------------------------- */

      if (
        request.method === "POST" &&
        path === "/api/transactions/purchase"
      ) {

        return await transactionRoute(
          request,
          env,
          "purchase"
        );
      }


      /* ---------------------------------------------
         SALE
      --------------------------------------------- */

      if (
        request.method === "POST" &&
        path === "/api/transactions/sale"
      ) {

        return await transactionRoute(
          request,
          env,
          "sale"
        );
      }


      /* ---------------------------------------------
         CUSTOMER COLLECTION
      --------------------------------------------- */

      if (
        request.method === "POST" &&
        path ===
          "/api/transactions/customer-collection"
      ) {

        return await transactionRoute(
          request,
          env,
          "customer-collection"
        );
      }


      /* ---------------------------------------------
         SUPPLIER PAYMENT
      --------------------------------------------- */

      if (
        request.method === "POST" &&
        path ===
          "/api/transactions/supplier-payment"
      ) {

        return await transactionRoute(
          request,
          env,
          "supplier-payment"
        );
      }


      /* ---------------------------------------------
         EXPENSE
      --------------------------------------------- */

      if (
        request.method === "POST" &&
        path ===
          "/api/transactions/expense"
      ) {

        return await transactionRoute(
          request,
          env,
          "expense"
        );
      }


      /* ---------------------------------------------
         OTHER INCOME
      --------------------------------------------- */

      if (
        request.method === "POST" &&
        path ===
          "/api/transactions/other-income"
      ) {

        return await transactionRoute(
          request,
          env,
          "other-income"
        );
      }


      /* ---------------------------------------------
         STOCK ADJUSTMENT
      --------------------------------------------- */

      if (
        request.method === "POST" &&
        path ===
          "/api/transactions/stock-adjustment"
      ) {

        return await transactionRoute(
          request,
          env,
          "stock-adjustment"
        );
      }


      /* ---------------------------------------------
         ACCOUNT TRANSFER
      --------------------------------------------- */

      if (
        request.method === "POST" &&
        path ===
          "/api/transactions/account-transfer"
      ) {

        return await transactionRoute(
          request,
          env,
          "account-transfer"
        );
      }


      /* ---------------------------------------------
         API 404
      --------------------------------------------- */

      if (path.startsWith("/api/")) {

        return json(
          {
            success: false,
            error: "API endpoint not found",
            path
          },
          404
        );
      }


      /* ---------------------------------------------
         STATIC ASSETS
      --------------------------------------------- */

      return env.ASSETS.fetch(request);

    } catch (error) {

      console.error(
        "CHAMAK STORE ERROR:",
        error
      );

      return errorResponse(
        error,
        400
      );
    }
  }
};
