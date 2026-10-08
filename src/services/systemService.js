// ============================================================
// CHAMAK STORE
// STEP 13 — SYSTEM SERVICE
// Settings + Audit Log + Backup / Restore
// ============================================================

const BACKUP_TABLES = [
  "products",
  "customers",
  "suppliers",
  "accounts",
  "transactions",
  "sales",
  "sale_items",
  "purchases",
  "purchase_items",
  "stock_lots",
  "stock_ledger",
  "ledger_entries",
  "customer_collections",
  "supplier_payments",
  "expenses",
  "other_income",
  "stock_adjustments",
  "account_transfers",
  "stock_verifications",
  "stock_verification_items",
  "daily_accounts",
  "audit_log",
  "settings"
];


// ============================================================
// SETTINGS
// ============================================================

export async function getSettings(db) {

  const result = await db.prepare(`
    SELECT
      key,
      value,
      updated_at
    FROM settings
    ORDER BY key
  `).all();

  return result.results || [];
}


export async function getSetting(db, key) {

  const row = await db.prepare(`
    SELECT
      key,
      value,
      updated_at
    FROM settings
    WHERE key = ?
    LIMIT 1
  `)
    .bind(key)
    .first();

  return row || null;
}


export async function saveSetting(
  db,
  key,
  value
) {

  if (!key) {
    throw new Error("Setting key is required");
  }

  const now =
    new Date().toISOString();

  await db.prepare(`
    INSERT INTO settings (
      key,
      value,
      updated_at
    )
    VALUES (?, ?, ?)

    ON CONFLICT(key)
    DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `)
    .bind(
      String(key),
      String(value ?? ""),
      now
    )
    .run();

  return {
    key,
    value: String(value ?? ""),
    updated_at: now
  };
}


// ============================================================
// AUDIT LOG
// ============================================================

export async function writeAuditLog(
  db,
  {
    action,
    entityType = null,
    entityId = null,
    details = null,
    userId = null
  }
) {

  const now =
    new Date().toISOString();

  await db.prepare(`
    INSERT INTO audit_log (
      id,
      action,
      entity_type,
      entity_id,
      details,
      user_id,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      crypto.randomUUID(),
      String(action || "UNKNOWN"),
      entityType,
      entityId === null
        ? null
        : String(entityId),
      typeof details === "string"
        ? details
        : JSON.stringify(details || {}),
      userId,
      now
    )
    .run();
}


export async function getAuditLogs(
  db,
  {
    limit = 100,
    offset = 0
  } = {}
) {

  const safeLimit =
    Math.min(
      Math.max(Number(limit) || 100, 1),
      500
    );

  const safeOffset =
    Math.max(
      Number(offset) || 0,
      0
    );

  const result = await db.prepare(`
    SELECT
      id,
      action,
      entity_type,
      entity_id,
      details,
      user_id,
      created_at
    FROM audit_log
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
    .bind(
      safeLimit,
      safeOffset
    )
    .all();

  return result.results || [];
}


// ============================================================
// BACKUP
// ============================================================

export async function createBackup(db) {

  const backup = {
    app: "CHAMAK STORE",
    format_version: 1,
    created_at:
      new Date().toISOString(),
    tables: {}
  };


  for (const table of BACKUP_TABLES) {

    const result = await db.prepare(`
      SELECT *
      FROM ${table}
    `).all();

    backup.tables[table] =
      result.results || [];
  }


  return backup;
}


// ============================================================
// RESTORE VALIDATION
// ============================================================

export function validateBackup(
  backup
) {

  if (
    !backup ||
    typeof backup !== "object"
  ) {
    throw new Error(
      "Invalid backup format"
    );
  }


  if (
    backup.app !== "CHAMAK STORE"
  ) {
    throw new Error(
      "This backup is not from CHAMAK STORE"
    );
  }


  if (
    !backup.tables ||
    typeof backup.tables !== "object"
  ) {
    throw new Error(
      "Backup tables are missing"
    );
  }


  return true;
}


// ============================================================
// RESTORE
// ============================================================

export async function restoreBackup(
  db,
  backup
) {

  validateBackup(backup);


  /*
   * IMPORTANT:
   *
   * Restore is destructive.
   * Caller MUST confirm before reaching here.
   */


  const statements = [];


  // ----------------------------------------------------------
  // Delete existing rows.
  //
  // Child tables first, parent tables later.
  // ----------------------------------------------------------

  const deleteOrder = [
    "stock_verification_items",
    "stock_verifications",

    "sale_items",
    "sales",

    "purchase_items",
    "purchases",

    "customer_collections",
    "supplier_payments",

    "expenses",
    "other_income",

    "stock_adjustments",
    "account_transfers",

    "stock_ledger",
    "stock_lots",

    "ledger_entries",

    "transactions",

    "daily_accounts",

    "audit_log",

    "products",
    "customers",
    "suppliers",
    "accounts",

    "settings"
  ];


  for (const table of deleteOrder) {

    statements.push(
      db.prepare(
        `DELETE FROM ${table}`
      )
    );
  }


  /*
   * Insert helper.
   */
  for (const table of BACKUP_TABLES) {

    if (
      table === "audit_log" ||
      table === "daily_accounts" ||
      table === "settings" ||
      table === "accounts" ||
      table === "products" ||
      table === "customers" ||
      table === "suppliers" ||
      table === "transactions" ||
      table === "sales" ||
      table === "sale_items" ||
      table === "purchases" ||
      table === "purchase_items" ||
      table === "stock_lots" ||
      table === "stock_ledger" ||
      table === "ledger_entries" ||
      table === "customer_collections" ||
      table === "supplier_payments" ||
      table === "expenses" ||
      table === "other_income" ||
      table === "stock_adjustments" ||
      table === "account_transfers" ||
      table === "stock_verifications" ||
      table === "stock_verification_items"
    ) {

      const rows =
        Array.isArray(
          backup.tables[table]
        )
          ? backup.tables[table]
          : [];


      for (const row of rows) {

        const columns =
          Object.keys(row);

        if (!columns.length) {
          continue;
        }


        const placeholders =
          columns
            .map(() => "?")
            .join(",");


        const sql = `
          INSERT INTO ${table}
          (${columns.join(",")})
          VALUES (${placeholders})
        `;


        statements.push(
          db.prepare(sql)
            .bind(
              ...columns.map(
                column => row[column]
              )
            )
        );
      }
    }
  }


  /*
   * D1 batch:
   * Restore যতটা সম্ভব একসাথে commit হবে।
   */
  if (statements.length > 0) {
    await db.batch(statements);
  }


  return {
    success: true,
    restored_at:
      new Date().toISOString()
  };
}
