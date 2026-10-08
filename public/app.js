/* =========================================================
   CHAMAK STORE 2
   Frontend Application
   ========================================================= */

const state = {
  currentPage: "dashboard",

  dashboard: null,

  products: [],
  customers: [],
  suppliers: [],
  accounts: [],

  loading: false
};


/* =========================================================
   DOM
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const pageContent = $("#pageContent");
const pageTitle = $("#pageTitle");
const pageSubtitle = $("#pageSubtitle");
const pageActions = $("#pageActions");

const sidebar = $("#sidebar");
const toast = $("#toast");
const loadingOverlay = $("#loadingOverlay");
const loadingText = $("#loadingText");


/* =========================================================
   UTILITIES
   ========================================================= */

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function money(value) {

  const number = Number(value || 0);

  return number.toLocaleString("bn-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


function number(value) {

  return Number(value || 0).toLocaleString("bn-BD", {
    maximumFractionDigits: 3
  });
}


function showLoading(message = "লোড হচ্ছে...") {

  loadingText.textContent = message;

  loadingOverlay.classList.remove("hidden");

  state.loading = true;
}


function hideLoading() {

  loadingOverlay.classList.add("hidden");

  state.loading = false;
}


let toastTimer = null;


function showToast(message, type = "success") {

  clearTimeout(toastTimer);

  toast.textContent = message;

  toast.className = `toast show ${type}`;

  toastTimer = setTimeout(() => {

    toast.className = "toast";

  }, 3000);
}


/* =========================================================
   API
   ========================================================= */

async function api(url, options = {}) {

  const config = {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(options.headers || {})
    }
  };


  const response = await fetch(url, config);


  let data = null;

  try {

    data = await response.json();

  } catch {

    data = null;

  }


  if (!response.ok) {

    const message =
      data?.error ||
      data?.message ||
      `Request failed: ${response.status}`;

    throw new Error(message);

  }


  return data;

}


/* =========================================================
   NAVIGATION
   ========================================================= */

const pageMeta = {

  dashboard: {
    title: "ড্যাশবোর্ড",
    subtitle: "ব্যবসার বর্তমান অবস্থা"
  },

  products: {
    title: "পণ্য",
    subtitle: "পণ্য, স্টক ও মূল্য ব্যবস্থাপনা"
  },

  purchase: {
    title: "ক্রয়",
    subtitle: "সাপ্লায়ারের কাছ থেকে পণ্য ক্রয়"
  },

  sale: {
    title: "বিক্রি",
    subtitle: "পণ্যভিত্তিক ও মোট বিক্রয়"
  },

  customers: {
    title: "কাস্টমার",
    subtitle: "কাস্টমার ও পাওনা ব্যবস্থাপনা"
  },

  suppliers: {
    title: "সাপ্লায়ার",
    subtitle: "সাপ্লায়ার ও দেনা ব্যবস্থাপনা"
  },

  stockVerification: {
    title: "স্টক ভেলু যাচাই",
    subtitle: "System Stock বনাম Physical Stock"
  },

  customerDue: {
    title: "কাস্টমার বাকি",
    subtitle: "পাওনা ও কালেকশন"
  },

  supplierDue: {
    title: "সাপ্লায়ার বাকি",
    subtitle: "দেনা ও পেমেন্ট"
  },

  expenses: {
    title: "খরচ",
    subtitle: "দোকান ও পারিবারিক খরচ"
  },

  accounts: {
    title: "হিসাব",
    subtitle: "Cash, bKash, Nagad ও অন্যান্য হিসাব"
  },

  settings: {
    title: "সেটিংস",
    subtitle: "সিস্টেম কনফিগারেশন"
  }

};


async function navigate(page) {

  state.currentPage = page;


  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === page
      );

    });


  const meta = pageMeta[page] || pageMeta.dashboard;

  pageTitle.textContent = meta.title;
  pageSubtitle.textContent = meta.subtitle;

  pageActions.innerHTML = "";


  sidebar.classList.remove("open");


  switch (page) {

    case "dashboard":
      await renderDashboard();
      break;

    case "products":
      await renderProducts();
      break;

    case "purchase":
      renderComingSoon(
        "ক্রয় মডিউল",
        "Purchase Invoice + Multiple Product Items"
      );
      break;

    case "sale":
      renderComingSoon(
        "বিক্রি মডিউল",
        "Product Sale + Direct Total Sale"
      );
      break;

    case "customers":
      await renderCustomers();
      break;

    case "suppliers":
      await renderSuppliers();
      break;

    case "stockVerification":
      await renderStockVerification();
      break;

    case "customerDue":
      renderComingSoon(
        "কাস্টমার বাকি",
        "Customer Due + Collection + Ledger"
      );
      break;

    case "supplierDue":
      renderComingSoon(
        "সাপ্লায়ার বাকি",
        "Supplier Due + Payment + Ledger"
      );
      break;

    case "expenses":
      renderComingSoon(
        "খরচ",
        "Shop Expense + Family Expense"
      );
      break;

    case "accounts":
      await renderAccounts();
      break;

    case "settings":
      renderSettings();
      break;

    default:
      await renderDashboard();

  }

}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

  const data = await api("/api/dashboard");

  state.dashboard = data;

  return data;
}


async function renderDashboard() {

  try {

    showLoading("ড্যাশবোর্ড লোড হচ্ছে...");

    const data = await loadDashboard();


    const stats = data?.stats || data || {};


    pageContent.innerHTML = `

      <div class="stats-grid">

        <div class="stat-card">

          <div class="stat-label">
            মোট স্টক
          </div>

          <div class="stat-value">
            ${number(
              stats.total_stock ??
              stats.stock_qty ??
              0
            )}
          </div>

          <div class="stat-sub">
            পণ্যের বর্তমান quantity
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            স্টক ভ্যালু
          </div>

          <div class="stat-value">
            ৳${money(
              stats.stock_value ??
              stats.inventory_value ??
              0
            )}
          </div>

          <div class="stat-sub">
            বর্তমান inventory value
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            কাস্টমার বাকি
          </div>

          <div class="stat-value">
            ৳${money(
              stats.customer_due ??
              stats.receivable ??
              0
            )}
          </div>

          <div class="stat-sub">
            মোট পাওনা
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            সাপ্লায়ার বাকি
          </div>

          <div class="stat-value">
            ৳${money(
              stats.supplier_due ??
              stats.payable ??
              0
            )}
          </div>

          <div class="stat-sub">
            মোট দেনা
          </div>

        </div>

      </div>


      <div class="dashboard-grid">

        <div class="card">

          <div class="card-header">
            <h3>দ্রুত কাজ</h3>
          </div>

          <div class="card-body">

            <div class="quick-actions">

              <button
                class="quick-action"
                data-quick-page="purchase"
              >
                <strong>🛒 নতুন ক্রয়</strong>
                <span>
                  সাপ্লায়ার থেকে পণ্য কিনুন
                </span>
              </button>


              <button
                class="quick-action"
                data-quick-page="sale"
              >
                <strong>💰 নতুন বিক্রি</strong>
                <span>
                  পণ্য বা মোট বিক্রয় এন্ট্রি
                </span>
              </button>


              <button
                class="quick-action"
                data-quick-page="products"
              >
                <strong>📦 পণ্য</strong>
                <span>
                  Product ও Stock পরিচালনা
                </span>
              </button>


              <button
                class="quick-action"
                data-quick-page="stockVerification"
              >
                <strong>🔎 স্টক যাচাই</strong>
                <span>
                  Physical Stock মিলিয়ে দেখুন
                </span>
              </button>

            </div>

          </div>

        </div>


        <div class="card">

          <div class="card-header">
            <h3>সিস্টেম স্ট্যাটাস</h3>
          </div>

          <div class="card-body">

            <p>
              <span class="badge badge-success">
                Online
              </span>
            </p>

            <p>
              Backend:
              <strong>Cloudflare Worker</strong>
            </p>

            <p>
              Database:
              <strong>Cloudflare D1</strong>
            </p>

            <p>
              হিসাব:
              <strong>Double Entry</strong>
            </p>

          </div>

        </div>

      </div>

    `;


    document
      .querySelectorAll("[data-quick-page]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => navigate(
            button.dataset.quickPage
          )
        );

      });


  } catch (error) {

    renderError(error);

  } finally {

    hideLoading();

  }

}


/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadProducts() {

  const data = await api("/api/products");

  state.products =
    Array.isArray(data)
      ? data
      : data.products || [];

  return state.products;
}


async function renderProducts() {

  try {

    showLoading("পণ্য লোড হচ্ছে...");

    const products = await loadProducts();


    pageActions.innerHTML = `
      <button
        id="newProductBtn"
        class="btn btn-primary"
        type="button"
      >
        + নতুন পণ্য
      </button>
    `;


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <h3>
            Product List
          </h3>

        </div>


        <div class="card-body">

          <div class="toolbar">

            <div class="toolbar-left">

              <input
                id="productSearch"
                class="form-control search-box"
                type="search"
                placeholder="পণ্য খুঁজুন..."
              >

            </div>

            <div class="toolbar-right">

              <span class="badge badge-info">
                মোট ${number(products.length)} পণ্য
              </span>

            </div>

          </div>


          <div
            id="productTable"
            class="table-wrapper"
          >

            ${productTableHtml(products)}

          </div>

        </div>

      </div>

    `;


    $("#newProductBtn")
      .addEventListener(
        "click",
        showProductForm
      );


    $("#productSearch")
      .addEventListener(
        "input",
        event => {

          const query =
            event.target.value
              .trim()
              .toLowerCase();

          const filtered =
            products.filter(product => {

              const text = [

                product.sku,
                product.name,
                product.unit

              ]
                .join(" ")
                .toLowerCase();

              return text.includes(query);

            });


          $("#productTable").innerHTML =
            productTableHtml(filtered);

        }
      );


  } catch (error) {

    renderError(error);

  } finally {

    hideLoading();

  }

}


function productTableHtml(products) {

  if (!products.length) {

    return `

      <div class="empty-state">

        <div class="icon">
          📦
        </div>

        <strong>
          কোনো পণ্য পাওয়া যায়নি
        </strong>

        <span>
          নতুন পণ্য যোগ করুন
        </span>

      </div>

    `;

  }


  return `

    <table class="data-table">

      <thead>

        <tr>

          <th>SKU</th>
          <th>পণ্যের নাম</th>
          <th>Unit</th>
          <th class="text-right">
            Stock
          </th>
          <th class="text-right">
            Sale Price
          </th>
          <th class="text-right">
            Stock Value
          </th>

        </tr>

      </thead>


      <tbody>

        ${products.map(product => `

          <tr>

            <td>
              ${escapeHtml(product.sku)}
            </td>

            <td>
              <strong>
                ${escapeHtml(product.name)}
              </strong>
            </td>

            <td>
              ${escapeHtml(product.unit || "-")}
            </td>

            <td class="text-right">
              ${number(product.current_stock ?? product.stock_qty)}
            </td>

            <td class="text-right">
              ৳${money(
                product.sale_price
              )}
            </td>

            <td class="text-right">
              ৳${money(
                product.stock_value
              )}
            </td>

          </tr>

        `).join("")}

      </tbody>

    </table>

  `;

}


/* =========================================================
   PRODUCT FORM
   ========================================================= */

function showProductForm() {

  pageContent.innerHTML = `

    <div class="card">

      <div class="card-header">

        <h3>
          নতুন পণ্য
        </h3>

      </div>


      <div class="card-body">

        <form id="productForm">

          <div class="form-grid">

            <div class="form-group">

              <label>
                পণ্যের নাম *
              </label>

              <input
                id="productName"
                class="form-control"
                required
                maxlength="200"
              >

            </div>


            <div class="form-group">

              <label>
                Unit
              </label>

              <input
                id="productUnit"
                class="form-control"
                placeholder="kg / pcs / litre"
              >

            </div>


            <div class="form-group">

              <label>
                বিক্রয় মূল্য
              </label>

              <input
                id="productSalePrice"
                class="form-control"
                type="number"
                min="0"
                step="0.01"
                value="0"
              >

            </div>


            <div class="form-group">

              <label>
                Low Stock Level
              </label>

              <input
                id="productLowStock"
                class="form-control"
                type="number"
                min="0"
                step="0.001"
                value="0"
              >

            </div>

          </div>


          <div class="form-actions">

            <button
              type="button"
              id="cancelProductBtn"
              class="btn btn-light"
            >
              বাতিল
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              পণ্য সংরক্ষণ
            </button>

          </div>

        </form>

      </div>

    </div>

  `;


  $("#cancelProductBtn")
    .addEventListener(
      "click",
      () => navigate("products")
    );


  $("#productForm")
    .addEventListener(
      "submit",
      submitProduct
    );

}


async function submitProduct(event) {

  event.preventDefault();


  const payload = {

    name:
      $("#productName")
        .value
        .trim(),

    unit:
      $("#productUnit")
        .value
        .trim(),

    sale_price:
      Number(
        $("#productSalePrice")
          .value || 0
      ),

    low_stock_level:
      Number(
        $("#productLowStock")
          .value || 0
      )

  };


  if (!payload.name) {

    showToast(
      "পণ্যের নাম দিন",
      "error"
    );

    return;

  }


  try {

    showLoading("পণ্য সংরক্ষণ হচ্ছে...");


    await api(
      "/api/products",
      {
        method: "POST",

        body: JSON.stringify(payload)
      }
    );


    showToast(
      "পণ্য সফলভাবে সংরক্ষণ হয়েছে"
    );


    await navigate("products");


  } catch (error) {

    showToast(
      error.message,
      "error"
    );

  } finally {

    hideLoading();

  }

}


/* =========================================================
   CUSTOMERS
   ========================================================= */

async function loadCustomers() {

  const data =
    await api("/api/customers");

  state.customers =
    Array.isArray(data)
      ? data
      : data.customers || [];

  return state.customers;
}


async function renderCustomers() {

  try {

    showLoading("কাস্টমার লোড হচ্ছে...");

    const customers =
      await loadCustomers();


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <h3>
            Customer List
          </h3>

        </div>

        <div class="card-body">

          <div class="toolbar">

            <input
              id="customerSearch"
              class="form-control search-box"
              type="search"
              placeholder="কাস্টমার খুঁজুন..."
            >

            <span class="badge badge-info">
              মোট ${number(customers.length)}
            </span>

          </div>


          <div
            id="customerTable"
            class="table-wrapper"
          >

            ${customerTableHtml(customers)}

          </div>

        </div>

      </div>

    `;


    $("#customerSearch")
      .addEventListener(
        "input",
        event => {

          const query =
            event.target.value
              .trim()
              .toLowerCase();

          const filtered =
            customers.filter(customer => {

              return [

                customer.name,
                customer.phone,
                customer.address

              ]
                .join(" ")
                .toLowerCase()
                .includes(query);

            });


          $("#customerTable").innerHTML =
            customerTableHtml(filtered);

        }
      );


  } catch (error) {

    renderError(error);

  } finally {

    hideLoading();

  }

}


function customerTableHtml(customers) {

  if (!customers.length) {

    return `

      <div class="empty-state">

        <div class="icon">
          👥
        </div>

        <strong>
          কোনো কাস্টমার নেই
        </strong>

      </div>

    `;

  }


  return `

    <table class="data-table">

      <thead>

        <tr>

          <th>নাম</th>
          <th>মোবাইল</th>
          <th>ঠিকানা</th>
          <th class="text-right">
            বাকি
          </th>

        </tr>

      </thead>

      <tbody>

        ${customers.map(customer => `

          <tr>

            <td>
              <strong>
                ${escapeHtml(customer.name)}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                customer.phone || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                customer.address || "-"
              )}
            </td>

            <td class="text-right">

              ৳${money(
                customer.current_due ??
                customer.due ??
                0
              )}

            </td>

          </tr>

        `).join("")}

      </tbody>

    </table>

  `;

}


/* =========================================================
   SUPPLIERS
   ========================================================= */

async function loadSuppliers() {

  const data =
    await api("/api/suppliers");

  state.suppliers =
    Array.isArray(data)
      ? data
      : data.suppliers || [];

  return state.suppliers;
}


async function renderSuppliers() {

  try {

    showLoading("সাপ্লায়ার লোড হচ্ছে...");

    const suppliers =
      await loadSuppliers();


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <h3>
            Supplier List
          </h3>

        </div>

        <div class="card-body">

          <div class="toolbar">

            <input
              id="supplierSearch"
              class="form-control search-box"
              type="search"
              placeholder="সাপ্লায়ার খুঁজুন..."
            >

            <span class="badge badge-info">
              মোট ${number(suppliers.length)}
            </span>

          </div>


          <div
            id="supplierTable"
            class="table-wrapper"
          >

            ${supplierTableHtml(suppliers)}

          </div>

        </div>

      </div>

    `;


    $("#supplierSearch")
      .addEventListener(
        "input",
        event => {

          const query =
            event.target.value
              .trim()
              .toLowerCase();

          const filtered =
            suppliers.filter(supplier => {

              return [

                supplier.name,
                supplier.phone,
                supplier.address

              ]
                .join(" ")
                .toLowerCase()
                .includes(query);

            });


          $("#supplierTable").innerHTML =
            supplierTableHtml(filtered);

        }
      );


  } catch (error) {

    renderError(error);

  } finally {

    hideLoading();

  }

}


function supplierTableHtml(suppliers) {

  if (!suppliers.length) {

    return `

      <div class="empty-state">

        <div class="icon">
          🏪
        </div>

        <strong>
          কোনো সাপ্লায়ার নেই
        </strong>

      </div>

    `;

  }


  return `

    <table class="data-table">

      <thead>

        <tr>

          <th>নাম</th>
          <th>মোবাইল</th>
          <th>ঠিকানা</th>
          <th class="text-right">
            বাকি
          </th>

        </tr>

      </thead>

      <tbody>

        ${suppliers.map(supplier => `

          <tr>

            <td>
              <strong>
                ${escapeHtml(supplier.name)}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                supplier.phone || "-"
              )}
            </td>

            <td>
              ${escapeHtml(
                supplier.address || "-"
              )}
            </td>

            <td class="text-right">

              ৳${money(
                supplier.current_due ??
                supplier.due ??
                0
              )}

            </td>

          </tr>

        `).join("")}

      </tbody>

    </table>

  `;

}


/* =========================================================
   ACCOUNTS
   ========================================================= */

async function loadAccounts() {

  const data =
    await api("/api/accounts");

  state.accounts =
    Array.isArray(data)
      ? data
      : data.accounts || [];

  return state.accounts;
}


async function renderAccounts() {

  try {

    showLoading("হিসাব লোড হচ্ছে...");

    const accounts =
      await loadAccounts();


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <h3>
            হিসাবের Account
          </h3>

        </div>

        <div class="card-body">

          ${accountTableHtml(accounts)}

        </div>

      </div>

    `;


  } catch (error) {

    renderError(error);

  } finally {

    hideLoading();

  }

}


function accountTableHtml(accounts) {

  if (!accounts.length) {

    return `

      <div class="empty-state">

        <div class="icon">
          🏦
        </div>

        <strong>
          কোনো account পাওয়া যায়নি
        </strong>

      </div>

    `;

  }


  return `

    <div class="table-wrapper">

      <table class="data-table">

        <thead>

          <tr>

            <th>Account</th>
            <th>Type</th>
            <th class="text-right">
              Balance
            </th>

          </tr>

        </thead>

        <tbody>

          ${accounts.map(account => `

            <tr>

              <td>
                <strong>
                  ${escapeHtml(
                    account.name
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  account.type || "-"
                )}
              </td>

              <td class="text-right">
                ৳${money(
                  account.current_balance ??
                  account.balance ??
                  0
                )}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

  `;

}


/* =========================================================
   STOCK VERIFICATION
   ========================================================= */

async function loadStockVerification() {

  const data =
    await api(
      "/api/stock-verification"
    );

  return data;

}


async function renderStockVerification() {

  try {

    showLoading(
      "স্টক ভেলু যাচাইয়ের তথ্য লোড হচ্ছে..."
    );


    const data =
      await loadStockVerification();


    const rows =
      Array.isArray(data)
        ? data
        : data.items || data.products || [];


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <h3>
            স্টক ভেলু যাচাই
          </h3>

          <span class="badge badge-info">
            Physical Qty শুধু যাচাইয়ের জন্য
          </span>

        </div>


        <div class="card-body">

          <div class="table-wrapper">

            <table class="data-table">

              <thead>

                <tr>

                  <th>পণ্য</th>

                  <th class="text-right">
                    System Qty
                  </th>

                  <th class="text-right">
                    Unit Cost
                  </th>

                  <th class="text-right">
                    Expected Value
                  </th>

                  <th class="text-right">
                    Physical Qty
                  </th>

                  <th class="text-right">
                    Physical Value
                  </th>

                  <th class="text-right">
                    Difference
                  </th>

                </tr>

              </thead>


              <tbody>

                ${
                  rows.length
                    ? rows.map(row => `

                        <tr>

                          <td>
                            ${escapeHtml(
                              row.product_name ||
                              row.name ||
                              ""
                            )}
                          </td>

                          <td class="text-right">
                            ${number(
                              row.system_qty ??
                              row.current_stock ??
                              0
                            )}
                          </td>

                          <td class="text-right">
                            ৳${money(
                              row.unit_cost ??
                              row.cost ??
                              0
                            )}
                          </td>

                          <td class="text-right">
                            ৳${money(
                              row.expected_value ??
                              0
                            )}
                          </td>

                          <td class="text-right">
                            ${
                              row.physical_qty ??
                              "-"
                            }
                          </td>

                          <td class="text-right">
                            ৳${money(
                              row.physical_value ??
                              0
                            )}
                          </td>

                          <td class="text-right">
                            ৳${money(
                              row.difference_value ??
                              0
                            )}
                          </td>

                        </tr>

                      `).join("")

                    : `

                      <tr>

                        <td
                          colspan="7"
                          class="text-center"
                        >
                          কোনো stock verification data নেই
                        </td>

                      </tr>

                    `
                }

              </tbody>

            </table>

          </div>

        </div>

      </div>

    `;


  } catch (error) {

    renderError(error);

  } finally {

    hideLoading();

  }

}


/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings() {

  pageContent.innerHTML = `

    <div class="card">

      <div class="card-header">

        <h3>
          সিস্টেম সেটিংস
        </h3>

      </div>


      <div class="card-body">

        <div class="empty-state">

          <div class="icon">
            ⚙️
          </div>

          <strong>
            Settings Module
          </strong>

          <span>
            Accounting, backup, restore ও system configuration
            পরবর্তী ধাপে যুক্ত হবে।
          </span>

        </div>

      </div>

    </div>

  `;

}


/* =========================================================
   COMING SOON
   ========================================================= */

function renderComingSoon(title, description) {

  pageContent.innerHTML = `

    <div class="card">

      <div class="card-body">

        <div class="empty-state">

          <div class="icon">
            🚧
          </div>

          <strong>
            ${escapeHtml(title)}
          </strong>

          <span>
            ${escapeHtml(description)}
          </span>

        </div>

      </div>

    </div>

  `;

}


/* =========================================================
   ERROR
   ========================================================= */

function renderError(error) {

  console.error(error);


  pageContent.innerHTML = `

    <div class="card">

      <div class="card-body">

        <div class="empty-state">

          <div class="icon">
            ⚠️
          </div>

          <strong>
            তথ্য লোড করা যায়নি
          </strong>

          <span>
            ${escapeHtml(
              error?.message ||
              "Unknown error"
            )}
          </span>

        </div>

      </div>

    </div>

  `;

}


/* =========================================================
   EVENTS
   ========================================================= */

document
  .querySelectorAll(".nav-item")
  .forEach(item => {

    item.addEventListener(
      "click",
      () => {

        navigate(
          item.dataset.page
        );

      }
    );

  });


$("#refreshBtn")
  .addEventListener(
    "click",
    () => {

      navigate(
        state.currentPage
      );

    }
  );


$("#mobileMenuBtn")
  .addEventListener(
    "click",
    () => {

      sidebar.classList.toggle("open");

    }
  );


/* =========================================================
   INITIAL LOAD
   ========================================================= */

navigate("dashboard");
