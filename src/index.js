// CHAMAK STORE
// Cloudflare Worker API Foundation
// Step 0005

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // -----------------------------
      // CORS
      // -----------------------------
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders()
        });
      }

      // -----------------------------
      // API Router
      // -----------------------------
      if (url.pathname.startsWith("/api/")) {
        const response = await handleApiRequest(request, env, url);

        return addCors(response);
      }

      // -----------------------------
      // Frontend
      // -----------------------------
      return env.ASSETS.fetch(request);

    } catch (error) {
      console.error("Worker Error:", error);

      return json(
        {
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "সার্ভারে একটি unexpected error হয়েছে।"
        },
        500
      );
    }
  }
};


// ============================================================
// API ROUTER
// ============================================================

async function handleApiRequest(request, env, url) {

  const path = url.pathname;
  const method = request.method.toUpperCase();

  // -----------------------------
  // Health
  // -----------------------------

  if (path === "/api/health" && method === "GET") {
    return json({
      success: true,
      service: "chamak-store",
      status: "ok",
      time: new Date().toISOString()
    });
  }


  // -----------------------------
  // Dashboard
  // -----------------------------

  if (path === "/api/dashboard" && method === "GET") {
    return await getDashboard(env);
  }


  // -----------------------------
  // Products
  // -----------------------------

  if (path === "/api/products" && method === "GET") {
    return await getProducts(env, url);
  }


  // -----------------------------
  // 404
  // -----------------------------

  return json(
    {
      success: false,
      error: "NOT_FOUND",
      message: "API endpoint পাওয়া যায়নি।"
    },
    404
  );
}


// ============================================================
// DASHBOARD
// ============================================================

async function getDashboard(env) {

  const queries = await Promise.all([
    safeQuery(
      env.DB,
      `
      SELECT
        COALESCE(SUM(
          CASE
            WHEN account_code = '1000'
            THEN current_balance
            ELSE 0
          END
        ), 0) AS cash
      FROM accounts
      `
    ),

    safeQuery(
      env.DB,
      `
      SELECT
        COALESCE(SUM(
          CASE
            WHEN account_code = '1010'
            THEN current_balance
            ELSE 0
          END
        ), 0) AS bkash
      FROM accounts
      `
    ),

    safeQuery(
      env.DB,
      `
      SELECT
        COALESCE(SUM(
          CASE
            WHEN account_code = '1020'
            THEN current_balance
            ELSE 0
          END
        ), 0) AS nagad
      FROM accounts
      `
    ),

    safeQuery(
      env.DB,
      `
      SELECT
        COALESCE(SUM(current_stock_value), 0) AS stock_value
      FROM products
      WHERE status = 'ACTIVE'
      `
    ),

    safeQuery(
      env.DB,
      `
      SELECT
        COALESCE(SUM(current_due), 0) AS customer_due
      FROM customers
      WHERE status = 'ACTIVE'
      `
    ),

    safeQuery(
      env.DB,
      `
      SELECT
        COALESCE(SUM(current_due), 0) AS supplier_due
      FROM suppliers
      WHERE status = 'ACTIVE'
      `
    )
  ]);

  return json({
    success: true,

    data: {
      cash: Number(queries[0]?.cash || 0),
      bkash: Number(queries[1]?.bkash || 0),
      nagad: Number(queries[2]?.nagad || 0),

      stockValue: Number(
        queries[3]?.stock_value || 0
      ),

      customerDue: Number(
        queries[4]?.customer_due || 0
      ),

      supplierDue: Number(
        queries[5]?.supplier_due || 0
      )
    }
  });
}


// ============================================================
// PRODUCTS
// ============================================================

async function getProducts(env, url) {

  const search =
    (url.searchParams.get("search") || "").trim();

  const limitRaw =
    Number(url.searchParams.get("limit") || 100);

  const limit =
    Math.min(Math.max(limitRaw, 1), 500);


  let result;


  if (search) {

    result = await env.DB.prepare(
      `
      SELECT
        id,
        product_code,
        name,
        category,
        unit,
        sale_price,
        minimum_stock,
        current_stock,
        current_stock_value,
        status
      FROM products
      WHERE status = 'ACTIVE'
        AND (
          name LIKE ?
          OR product_code LIKE ?
        )
      ORDER BY name COLLATE NOCASE
      LIMIT ?
      `
    )
      .bind(
        `%${search}%`,
        `%${search}%`,
        limit
      )
      .all();

  } else {

    result = await env.DB.prepare(
      `
      SELECT
        id,
        product_code,
        name,
        category,
        unit,
        sale_price,
        minimum_stock,
        current_stock,
        current_stock_value,
        status
      FROM products
      WHERE status = 'ACTIVE'
      ORDER BY name COLLATE NOCASE
      LIMIT ?
      `
    )
      .bind(limit)
      .all();
  }


  return json({
    success: true,
    data: result.results || []
  });
}


// ============================================================
// DATABASE HELPERS
// ============================================================

async function safeQuery(db, sql) {

  try {

    const row =
      await db.prepare(sql).first();

    return row || {};

  } catch (error) {

    console.error(
      "Database query failed:",
      error
    );

    return {};
  }
}


// ============================================================
// JSON RESPONSE
// ============================================================

function json(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        ...corsHeaders()
      }
    }
  );
}


// ============================================================
// CORS
// ============================================================

function corsHeaders() {

  return {
    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Methods":
      "GET,POST,PUT,DELETE,OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization"
  };
}


function addCors(response) {

  const headers =
    new Headers(response.headers);

  Object.entries(corsHeaders())
    .forEach(([key, value]) => {
      headers.set(key, value);
    });

  return new Response(
    response.body,
    {
      status: response.status,
      statusText: response.statusText,
      headers
    }
  );
}
