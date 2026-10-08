// src/services/masterDataService.js

/* =========================================================
   CHAMAK STORE
   MASTER DATA SERVICE

   Handles:
   - Products
   - Customers
   - Suppliers

   Important:
   - Product delete is blocked when transaction history exists.
   - Customer/Supplier delete is blocked when financial history exists.
   - Product SKU is generated automatically.
========================================================= */


/* =========================================================
   HELPERS
========================================================= */

function nowISO() {
  return new Date().toISOString();
}


function cleanText(value, field) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(`${field} is required`);
  }

  return String(value).trim();
}


function optionalText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}


function money(value, field = "amount") {
  const n = Number(value);

  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid ${field}`);
  }

  return Math.round(n);
}


function numberValue(value, field) {
  const n = Number(value);

  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid ${field}`);
  }

  return n;
}


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
   PRODUCT SKU
========================================================= */

async function generateProductSKU(db) {

  const row = await getOne(
    db,
    `
      SELECT
        MAX(
          CAST(
            SUBSTR(sku, 4)
            AS INTEGER
          )
        ) AS max_number
      FROM products
      WHERE sku LIKE 'PRD%'
    `
  );

  const next =
    Number(row?.max_number || 0) + 1;

  return `PRD${String(next).padStart(6, "0")}`;
}


/* =========================================================
   PRODUCT
========================================================= */

export async function createProduct(
  db,
  {
    sku = null,
    name,
    unit = "pcs",
    purchasePrice = 0,
    salePrice = 0,
    lowStockLevel = 0
  }
) {

  const productName =
    cleanText(name, "Product name");

  const purchase =
    money(
      purchasePrice,
      "purchase price"
    );

  const sale =
    money(
      salePrice,
      "sale price"
    );

  const lowStock =
    numberValue(
      lowStockLevel,
      "low stock level"
    );


  let productSKU =
    optionalText(sku);

  if (!productSKU) {
    productSKU =
      await generateProductSKU(db);
  }


  const existing =
    await getOne(
      db,
      `
        SELECT id
        FROM products
        WHERE sku = ?
        LIMIT 1
      `,
      [productSKU]
    );


  if (existing) {
    throw new Error(
      `SKU already exists: ${productSKU}`
    );
  }


  const id =
    crypto.randomUUID();

  const now =
    nowISO();


  await run(
    db,
    `
      INSERT INTO products (
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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      productSKU,
      productName,
      optionalText(unit) || "pcs",
      purchase,
      sale,
      purchase,
      0,
      lowStock,
      now,
      now
    ]
  );


  return {
    success: true,
    product: await getProduct(
      db,
      id
    )
  };
}


/* =========================================================
   GET PRODUCT
========================================================= */

export async function getProduct(
  db,
  id
) {

  const product =
    await getOne(
      db,
      `
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
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );


  if (!product) {
    throw new Error(
      "Product not found"
    );
  }


  return product;
}


/* =========================================================
   UPDATE PRODUCT
========================================================= */

export async function updateProduct(
  db,
  id,
  data
) {

  const existing =
    await getProduct(
      db,
      id
    );


  const name =
    data.name !== undefined
      ? cleanText(
          data.name,
          "Product name"
        )
      : existing.name;


  const unit =
    data.unit !== undefined
      ? (
          optionalText(data.unit) ||
          "pcs"
        )
      : existing.unit;


  const purchasePrice =
    data.purchase_price !== undefined
      ? money(
          data.purchase_price,
          "purchase price"
        )
      : Number(
          existing.purchase_price || 0
        );


  const salePrice =
    data.sale_price !== undefined
      ? money(
          data.sale_price,
          "sale price"
        )
      : Number(
          existing.sale_price || 0
        );


  const lowStockLevel =
    data.low_stock_level !== undefined
      ? numberValue(
          data.low_stock_level,
          "low stock level"
        )
      : Number(
          existing.low_stock_level || 0
        );


  const newSKU =
    data.sku !== undefined
      ? cleanText(
          data.sku,
          "SKU"
        )
      : existing.sku;


  if (newSKU !== existing.sku) {

    const duplicate =
      await getOne(
        db,
        `
          SELECT id
          FROM products
          WHERE sku = ?
            AND id != ?
          LIMIT 1
        `,
        [
          newSKU,
          id
        ]
      );


    if (duplicate) {
      throw new Error(
        `SKU already exists: ${newSKU}`
      );
    }
  }


  await run(
    db,
    `
      UPDATE products
      SET
        sku = ?,
        name = ?,
        unit = ?,
        purchase_price = ?,
        sale_price = ?,
        low_stock_level = ?,
        updated_at = ?
      WHERE id = ?
    `,
    [
      newSKU,
      name,
      unit,
      purchasePrice,
      salePrice,
      lowStockLevel,
      nowISO(),
      id
    ]
  );


  return {
    success: true,
    product:
      await getProduct(
        db,
        id
      )
  };
}


/* =========================================================
   DELETE PRODUCT
========================================================= */

export async function deleteProduct(
  db,
  id
) {

  await getProduct(
    db,
    id
  );


  const usage =
    await getOne(
      db,
      `
        SELECT
          (
            SELECT COUNT(*)
            FROM sale_items
            WHERE product_id = ?
          )
          +
          (
            SELECT COUNT(*)
            FROM purchase_items
            WHERE product_id = ?
          )
          +
          (
            SELECT COUNT(*)
            FROM stock_ledger
            WHERE product_id = ?
          )
          +
          (
            SELECT COUNT(*)
            FROM stock_adjustments
            WHERE product_id = ?
          ) AS usage_count
      `,
      [
        id,
        id,
        id,
        id
      ]
    );


  if (
    Number(
      usage?.usage_count || 0
    ) > 0
  ) {

    throw new Error(
      "This product has transaction history and cannot be deleted. Deactivate it instead."
    );
  }


  await run(
    db,
    `
      DELETE FROM products
      WHERE id = ?
    `,
    [id]
  );


  return {
    success: true,
    deleted_id: id
  };
}


/* =========================================================
   CUSTOMER
========================================================= */

export async function createCustomer(
  db,
  {
    name,
    phone = null,
    address = null
  }
) {

  const customerName =
    cleanText(
      name,
      "Customer name"
    );


  const customerPhone =
    optionalText(phone);


  if (customerPhone) {

    const existing =
      await getOne(
        db,
        `
          SELECT id
          FROM customers
          WHERE phone = ?
          LIMIT 1
        `,
        [customerPhone]
      );


    if (existing) {
      throw new Error(
        "A customer with this phone number already exists"
      );
    }
  }


  const id =
    crypto.randomUUID();


  const now =
    nowISO();


  await run(
    db,
    `
      INSERT INTO customers (
        id,
        name,
        phone,
        address,
        current_due,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      customerName,
      customerPhone,
      optionalText(address),
      0,
      now,
      now
    ]
  );


  return {
    success: true,
    customer:
      await getCustomer(
        db,
        id
      )
  };
}


/* =========================================================
   GET CUSTOMER
========================================================= */

export async function getCustomer(
  db,
  id
) {

  const customer =
    await getOne(
      db,
      `
        SELECT
          id,
          name,
          phone,
          address,
          current_due,
          created_at,
          updated_at
        FROM customers
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );


  if (!customer) {
    throw new Error(
      "Customer not found"
    );
  }


  return customer;
}


/* =========================================================
   UPDATE CUSTOMER
========================================================= */

export async function updateCustomer(
  db,
  id,
  data
) {

  const existing =
    await getCustomer(
      db,
      id
    );


  const name =
    data.name !== undefined
      ? cleanText(
          data.name,
          "Customer name"
        )
      : existing.name;


  const phone =
    data.phone !== undefined
      ? optionalText(data.phone)
      : existing.phone;


  const address =
    data.address !== undefined
      ? optionalText(data.address)
      : existing.address;


  if (
    phone &&
    phone !== existing.phone
  ) {

    const duplicate =
      await getOne(
        db,
        `
          SELECT id
          FROM customers
          WHERE phone = ?
            AND id != ?
          LIMIT 1
        `,
        [
          phone,
          id
        ]
      );


    if (duplicate) {
      throw new Error(
        "A customer with this phone number already exists"
      );
    }
  }


  await run(
    db,
    `
      UPDATE customers
      SET
        name = ?,
        phone = ?,
        address = ?,
        updated_at = ?
      WHERE id = ?
    `,
    [
      name,
      phone,
      address,
      nowISO(),
      id
    ]
  );


  return {
    success: true,
    customer:
      await getCustomer(
        db,
        id
      )
  };
}


/* =========================================================
   DELETE CUSTOMER
========================================================= */

export async function deleteCustomer(
  db,
  id
) {

  const customer =
    await getCustomer(
      db,
      id
    );


  if (
    Number(
      customer.current_due || 0
    ) !== 0
  ) {

    throw new Error(
      "Customer has outstanding due and cannot be deleted"
    );
  }


  const usage =
    await getOne(
      db,
      `
        SELECT
          (
            SELECT COUNT(*)
            FROM sales
            WHERE customer_id = ?
          )
          +
          (
            SELECT COUNT(*)
            FROM customer_collections
            WHERE customer_id = ?
          ) AS usage_count
      `,
      [
        id,
        id
      ]
    );


  if (
    Number(
      usage?.usage_count || 0
    ) > 0
  ) {

    throw new Error(
      "Customer has transaction history and cannot be deleted"
    );
  }


  await run(
    db,
    `
      DELETE FROM customers
      WHERE id = ?
    `,
    [id]
  );


  return {
    success: true,
    deleted_id: id
  };
}


/* =========================================================
   SUPPLIER
========================================================= */

export async function createSupplier(
  db,
  {
    name,
    phone = null,
    address = null
  }
) {

  const supplierName =
    cleanText(
      name,
      "Supplier name"
    );


  const supplierPhone =
    optionalText(phone);


  if (supplierPhone) {

    const existing =
      await getOne(
        db,
        `
          SELECT id
          FROM suppliers
          WHERE phone = ?
          LIMIT 1
        `,
        [supplierPhone]
      );


    if (existing) {
      throw new Error(
        "A supplier with this phone number already exists"
      );
    }
  }


  const id =
    crypto.randomUUID();


  const now =
    nowISO();


  await run(
    db,
    `
      INSERT INTO suppliers (
        id,
        name,
        phone,
        address,
        current_due,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      supplierName,
      supplierPhone,
      optionalText(address),
      0,
      now,
      now
    ]
  );


  return {
    success: true,
    supplier:
      await getSupplier(
        db,
        id
      )
  };
}


/* =========================================================
   GET SUPPLIER
========================================================= */

export async function getSupplier(
  db,
  id
) {

  const supplier =
    await getOne(
      db,
      `
        SELECT
          id,
          name,
          phone,
          address,
          current_due,
          created_at,
          updated_at
        FROM suppliers
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );


  if (!supplier) {
    throw new Error(
      "Supplier not found"
    );
  }


  return supplier;
}


/* =========================================================
   UPDATE SUPPLIER
========================================================= */

export async function updateSupplier(
  db,
  id,
  data
) {

  const existing =
    await getSupplier(
      db,
      id
    );


  const name =
    data.name !== undefined
      ? cleanText(
          data.name,
          "Supplier name"
        )
      : existing.name;


  const phone =
    data.phone !== undefined
      ? optionalText(data.phone)
      : existing.phone;


  const address =
    data.address !== undefined
      ? optionalText(data.address)
      : existing.address;


  if (
    phone &&
    phone !== existing.phone
  ) {

    const duplicate =
      await getOne(
        db,
        `
          SELECT id
          FROM suppliers
          WHERE phone = ?
            AND id != ?
          LIMIT 1
        `,
        [
          phone,
          id
        ]
      );


    if (duplicate) {
      throw new Error(
        "A supplier with this phone number already exists"
      );
    }
  }


  await run(
    db,
    `
      UPDATE suppliers
      SET
        name = ?,
        phone = ?,
        address = ?,
        updated_at = ?
      WHERE id = ?
    `,
    [
      name,
      phone,
      address,
      nowISO(),
      id
    ]
  );


  return {
    success: true,
    supplier:
      await getSupplier(
        db,
        id
      )
  };
}


/* =========================================================
   DELETE SUPPLIER
========================================================= */

export async function deleteSupplier(
  db,
  id
) {

  const supplier =
    await getSupplier(
      db,
      id
    );


  if (
    Number(
      supplier.current_due || 0
    ) !== 0
  ) {

    throw new Error(
      "Supplier has outstanding due and cannot be deleted"
    );
  }


  const usage =
    await getOne(
      db,
      `
        SELECT
          (
            SELECT COUNT(*)
            FROM purchases
            WHERE supplier_id = ?
          )
          +
          (
            SELECT COUNT(*)
            FROM supplier_payments
            WHERE supplier_id = ?
          ) AS usage_count
      `,
      [
        id,
        id
      ]
    );


  if (
    Number(
      usage?.usage_count || 0
    ) > 0
  ) {

    throw new Error(
      "Supplier has transaction history and cannot be deleted"
    );
  }


  await run(
    db,
    `
      DELETE FROM suppliers
      WHERE id = ?
    `,
    [id]
  );


  return {
    success: true,
    deleted_id: id
  };
}
