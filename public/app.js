/* =========================================================
   CHAMAK STORE 2
   Frontend Application
   ========================================================= */

"use strict";

/* =========================================================
   DOM REFERENCES
   ========================================================= */

const pageContent = document.getElementById("page-content");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const navItems = document.querySelectorAll("[data-page]");
const app = pageContent;

/* =========================================================
   API HELPER
   ========================================================= */

async function apiFetch(url, options = {}) {
  const config = {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {})
    }
  };

  return fetch(url, config);
}

/* =========================================================
   GLOBAL STATE
   ========================================================= */

const state = {
  currentPage: "dashboard",
  products: [],
  customers: [],
  suppliers: [],
  accounts: [],
  settings: {},
  saleItems: [],
  purchaseItems: [],
  loading: false
};

/* =========================================================
   COMMON HELPERS
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatNumber(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-BD", {
    maximumFractionDigits: 3
  });
}

function money(value) {
  return formatMoney(value);
}

function number(value) {
  return formatNumber(value);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowDateTime() {
  const d = new Date();

  const pad = n => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");

  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2500);
}

function showError(message) {
  showToast(message, "error");
}

function showSuccess(message) {
  showToast(message, "success");
}

function confirmAction(message) {
  return window.confirm(message);
}

function parseJsonResponse(response) {
  return response
    .json()
    .catch(() => ({}));
}

async function getJson(url, options = {}) {
  const response = await apiFetch(url, options);

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

async function postJson(url, body) {
  return getJson(url, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function putJson(url, body) {
  return getJson(url, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

async function deleteJson(url) {
  return getJson(url, {
    method: "DELETE"
  });
}

function setLoading(loading) {
  state.loading = loading;

  document.body.classList.toggle("is-loading", loading);
}

function transactionTypeLabel(type) {
  const map = {
    PURCHASE: "ক্রয়",
    SALE: "বিক্রয়",
    CUSTOMER_COLLECTION: "কাস্টমার বাকি আদায়",
    SUPPLIER_PAYMENT: "সাপ্লায়ার পেমেন্ট",
    EXPENSE: "খরচ",
    OTHER_INCOME: "অন্যান্য আয়",
    STOCK_ADJUSTMENT: "স্টক সমন্বয়",
    ACCOUNT_TRANSFER: "অ্যাকাউন্ট ট্রান্সফার"
  };

  return map[type] || type || "";
}

function accountTypeLabel(type) {
  const map = {
    ASSET: "সম্পদ",
    LIABILITY: "দায়",
    EQUITY: "মূলধন",
    INCOME: "আয়",
    EXPENSE: "খরচ"
  };

  return map[type] || type || "";
}

function stockStatus(stock, lowStockLevel) {
  const qty = Number(stock || 0);
  const low = Number(lowStockLevel || 0);

  if (qty <= 0) {
    return {
      text: "স্টক শেষ",
      className: "danger"
    };
  }

  if (qty <= low) {
    return {
      text: "কম স্টক",
      className: "warning"
    };
  }

  return {
    text: "ঠিক আছে",
    className: "success"
  };
}

/* =========================================================
   PAGE META
   ========================================================= */

const pageMeta = {
  dashboard: {
    title: "ড্যাশবোর্ড",
    subtitle: "দোকানের সার্বিক হিসাব"
  },

  products: {
    title: "পণ্য",
    subtitle: "পণ্যের তালিকা ও স্টক"
  },

  purchase: {
    title: "ক্রয়",
    subtitle: "পণ্য ক্রয় ও সাপ্লায়ার হিসাব"
  },

  sale: {
    title: "বিক্রয়",
    subtitle: "পণ্য বিক্রয় ও কাস্টমার হিসাব"
  },

  customers: {
    title: "কাস্টমার",
    subtitle: "কাস্টমার তালিকা"
  },

  suppliers: {
    title: "সাপ্লায়ার",
    subtitle: "সাপ্লায়ার তালিকা"
  },

  stockVerification: {
    title: "স্টক ভেলু যাচাই",
    subtitle: "সিস্টেম স্টক বনাম বাস্তব স্টক"
  },

  customerDue: {
    title: "কাস্টমার বাকি",
    subtitle: "বাকি ও আদায়ের হিসাব"
  },

  supplierDue: {
    title: "সাপ্লায়ার বাকি",
    subtitle: "সাপ্লায়ার পাওনা ও পেমেন্ট"
  },

  expenses: {
    title: "খরচ",
    subtitle: "দোকান ও পারিবারিক খরচ"
  },

  accounts: {
    title: "অ্যাকাউন্ট",
    subtitle: "ক্যাশ ও অন্যান্য হিসাব"
  },

  settings: {
    title: "সেটিংস",
    subtitle: "সিস্টেম সেটিংস"
  }
};

/* =========================================================
   NAVIGATION
   ========================================================= */

function updatePageMeta(page) {
  const meta = pageMeta[page] || pageMeta.dashboard;

  if (pageTitle) {
    pageTitle.textContent = meta.title;
  }

  if (pageSubtitle) {
    pageSubtitle.textContent = meta.subtitle;
  }

  navItems.forEach(item => {
    const itemPage = item.dataset.page;

    item.classList.toggle(
      "active",
      itemPage === page
    );
  });
}

async function navigate(page) {
  state.currentPage = page;

  updatePageMeta(page);

  switch (page) {
    case "dashboard":
      await renderDashboard();
      break;

    case "products":
      await renderProducts();
      break;

    case "purchase":
      await renderPurchase();
      break;

    case "sale":
      await renderSale();
      break;

    case "customers":
      await renderCustomers();
      break;

    case "suppliers":
      await renderSuppliers();
      break;

    case "customer-due":
      await renderCustomerDue();
      break;

    case "supplier-due":
      await renderSupplierDue();
      break;

    case "expense":
      await renderExpense();
      break;

    case "income":
      await renderOtherIncome();
      break;

    case "transfer":
      await renderAccountTransfer();
      break;

    case "stock-verification":
      await renderStockVerification();
      break;

    case "accounts":
      await renderAccounts();
      break;

    case "settings":
      await renderSettings();
      break;

    case "audit-log":
      await renderAuditLog();
      break;

    case "backup":
      await renderBackup();
      break;

    default:
      await renderDashboard();
      break;
  }
}

navItems.forEach(item => {
  item.addEventListener("click", event => {
    event.preventDefault();

    const page = item.dataset.page;

    if (page) {
      navigate(page);
    }
  });
});

/* =========================================================
   MODAL
   ========================================================= */

function openModal(title, content, options = {}) {
  const existing = document.getElementById("app-modal");

  if (existing) {
    existing.remove();
  }

  const modal = document.createElement("div");

  modal.id = "app-modal";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal ${options.large ? "modal-large" : ""}">
      <div class="modal-header">
        <h3>${escapeHtml(title)}</h3>

        <button
          type="button"
          class="modal-close"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div class="modal-body">
        ${content}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeButton = modal.querySelector(".modal-close");

  closeButton?.addEventListener("click", () => {
    closeModal();
  });

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModal();
    }
  });

  return modal;
}

function closeModal() {
  const modal = document.getElementById("app-modal");

  if (modal) {
    modal.remove();
  }
}

/* =========================================================
   LOADING / EMPTY / ERROR UI
   ========================================================= */

function loadingHtml(message = "লোড হচ্ছে...") {
  return `
    <div class="loading-state">
      <div class="spinner"></div>
      <div>${escapeHtml(message)}</div>
    </div>
  `;
}

function emptyHtml(message = "কোনো তথ্য পাওয়া যায়নি।") {
  return `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <div>${escapeHtml(message)}</div>
    </div>
  `;
}

function errorHtml(message = "তথ্য লোড করতে সমস্যা হয়েছে।") {
  return `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <div>${escapeHtml(message)}</div>
    </div>
  `;
}

/* =========================================================
   DASHBOARD
   ========================================================= */

async function renderDashboard() {
  if (!app) return;

  app.innerHTML = `
    <section class="page dashboard-page">

      <div class="page-toolbar">
        <div>
          <h2>ড্যাশবোর্ড</h2>
          <p class="muted">
            আজ ও নির্বাচিত সময়ের ব্যবসার সারাংশ
          </p>
        </div>

        <div class="toolbar-actions">
          <label>
            <span>শুরু</span>
            <input
              type="date"
              id="dashboard-from"
              value="${today()}"
            >
          </label>

          <label>
            <span>শেষ</span>
            <input
              type="date"
              id="dashboard-to"
              value="${today()}"
            >
          </label>

          <button
            type="button"
            class="btn btn-primary"
            id="dashboard-refresh"
          >
            রিফ্রেশ
          </button>
        </div>
      </div>

      <div id="dashboard-content">
        ${loadingHtml("ড্যাশবোর্ড লোড হচ্ছে...")}
      </div>

    </section>
  `;

  const refreshButton = document.getElementById(
    "dashboard-refresh"
  );

  refreshButton?.addEventListener("click", loadDashboard);

  await loadDashboard();
}

async function loadDashboard() {
  const container = document.getElementById(
    "dashboard-content"
  );

  if (!container) return;

  const from = document.getElementById(
    "dashboard-from"
  )?.value || today();

  const to = document.getElementById(
    "dashboard-to"
  )?.value || today();

  container.innerHTML = loadingHtml(
    "ড্যাশবোর্ড লোড হচ্ছে..."
  );

  try {
    const response = await apiFetch(
      `/api/dashboard?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        "ড্যাশবোর্ড লোড করা যায়নি"
      );
    }

    container.innerHTML = buildDashboardHtml(data);
  } catch (error) {
    console.error(error);

    container.innerHTML = errorHtml(
      error.message ||
      "ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে।"
    );
  }
}

function buildDashboardHtml(data) {
  const summary = data.summary || {};

  const sales = Number(
    summary.sales ||
    summary.totalSales ||
    0
  );

  const purchases = Number(
    summary.purchases ||
    summary.totalPurchases ||
    0
  );

  const grossProfit = Number(
    summary.grossProfit ||
    0
  );

  const netProfit = Number(
    summary.netProfit ||
    0
  );

  const customerDue = Number(
    summary.customerDue ||
    summary.customerReceivable ||
    0
  );

  const supplierDue = Number(
    summary.supplierDue ||
    summary.supplierPayable ||
    0
  );

  const stockValue = Number(
    summary.stockValue ||
    0
  );

  const productCount = Number(
    summary.productCount ||
    0
  );

  return `
    <div class="dashboard-grid">

      <div class="stat-card">
        <div class="stat-label">মোট বিক্রয়</div>
        <div class="stat-value">
          ৳ ${formatMoney(sales)}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">মোট ক্রয়</div>
        <div class="stat-value">
          ৳ ${formatMoney(purchases)}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">গ্রস প্রফিট</div>
        <div class="stat-value">
          ৳ ${formatMoney(grossProfit)}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">নেট প্রফিট</div>
        <div class="stat-value">
          ৳ ${formatMoney(netProfit)}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">কাস্টমার বাকি</div>
        <div class="stat-value">
          ৳ ${formatMoney(customerDue)}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">সাপ্লায়ার বাকি</div>
        <div class="stat-value">
          ৳ ${formatMoney(supplierDue)}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">স্টক ভেলু</div>
        <div class="stat-value">
          ৳ ${formatMoney(stockValue)}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">পণ্য সংখ্যা</div>
        <div class="stat-value">
          ${formatNumber(productCount)}
        </div>
      </div>

    </div>

    <div class="dashboard-sections">

      ${buildDashboardAccounts(data.accounts)}

      ${buildDashboardLowStock(data.lowStock)}

      ${buildDashboardTopProducts(data.topProducts)}

      ${buildDashboardRecentTransactions(
        data.recentTransactions
      )}

    </div>
  `;
}

function buildDashboardAccounts(accounts) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return `
      <section class="dashboard-section">
        <div class="section-header">
          <h3>অ্যাকাউন্ট ব্যালেন্স</h3>
        </div>

        ${emptyHtml("কোনো অ্যাকাউন্ট পাওয়া যায়নি।")}
      </section>
    `;
  }

  return `
    <section class="dashboard-section">

      <div class="section-header">
        <h3>অ্যাকাউন্ট ব্যালেন্স</h3>
      </div>

      <div class="account-balance-grid">

        ${accounts.map(account => `
          <div class="mini-card">

            <div class="mini-card-title">
              ${escapeHtml(account.name)}
            </div>

            <div class="mini-card-value">
              ৳ ${formatMoney(account.current_balance)}
            </div>

          </div>
        `).join("")}

      </div>

    </section>
  `;
}

function buildDashboardLowStock(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return `
      <section class="dashboard-section">

        <div class="section-header">
          <h3>কম স্টক</h3>
        </div>

        <div class="success-box">
          বর্তমানে কোনো কম-স্টক পণ্য নেই।
        </div>

      </section>
    `;
  }

  return `
    <section class="dashboard-section">

      <div class="section-header">
        <h3>কম স্টক</h3>
      </div>

      <div class="table-wrapper">

        <table class="data-table">

          <thead>
            <tr>
              <th>পণ্য</th>
              <th>বর্তমান স্টক</th>
              <th>সীমা</th>
              <th>অবস্থা</th>
            </tr>
          </thead>

          <tbody>

            ${products.map(product => {
              const status = stockStatus(
                product.current_stock,
                product.low_stock_level
              );

              return `
                <tr>

                  <td>
                    ${escapeHtml(product.name)}
                  </td>

                  <td>
                    ${formatNumber(product.current_stock)}
                    ${escapeHtml(product.unit || "")}
                  </td>

                  <td>
                    ${formatNumber(product.low_stock_level)}
                  </td>

                  <td>
                    <span class="badge ${status.className}">
                      ${status.text}
                    </span>
                  </td>

                </tr>
              `;
            }).join("")}

          </tbody>

        </table>

      </div>

    </section>
  `;
}

function buildDashboardTopProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return `
      <section class="dashboard-section">

        <div class="section-header">
          <h3>শীর্ষ বিক্রিত পণ্য</h3>
        </div>

        ${emptyHtml("কোনো বিক্রয় তথ্য নেই।")}

      </section>
    `;
  }

  return `
    <section class="dashboard-section">

      <div class="section-header">
        <h3>শীর্ষ বিক্রিত পণ্য</h3>
      </div>

      <div class="table-wrapper">

        <table class="data-table">

          <thead>
            <tr>
              <th>পণ্য</th>
              <th>পরিমাণ</th>
              <th>বিক্রয়</th>
            </tr>
          </thead>

          <tbody>

            ${products.map(product => `
              <tr>

                <td>
                  ${escapeHtml(product.name)}
                </td>

                <td>
                  ${formatNumber(product.quantity)}
                </td>

                <td>
                  ৳ ${formatMoney(product.total_sales)}
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>

    </section>
  `;
}

function buildDashboardRecentTransactions(
  transactions
) {
  if (
    !Array.isArray(transactions) ||
    transactions.length === 0
  ) {
    return `
      <section class="dashboard-section">

        <div class="section-header">
          <h3>সাম্প্রতিক লেনদেন</h3>
        </div>

        ${emptyHtml("কোনো লেনদেন পাওয়া যায়নি।")}

      </section>
    `;
  }

  return `
    <section class="dashboard-section">

      <div class="section-header">
        <h3>সাম্প্রতিক লেনদেন</h3>
      </div>

      <div class="table-wrapper">

        <table class="data-table">

          <thead>
            <tr>
              <th>তারিখ</th>
              <th>ধরন</th>
              <th>রেফারেন্স</th>
              <th>পরিমাণ</th>
            </tr>
          </thead>

          <tbody>

            ${transactions.map(transaction => `
              <tr>

                <td>
                  ${escapeHtml(
                    transaction.transaction_date ||
                    transaction.date ||
                    ""
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    transactionTypeLabel(
                      transaction.transaction_type ||
                      transaction.type
                    )
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    transaction.reference || ""
                  )}
                </td>

                <td>
                  ৳ ${formatMoney(
                    transaction.total_amount ||
                    transaction.amount ||
                    0
                  )}
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>

    </section>
  `;
}

/* =========================================================
   PRODUCTS
   ========================================================= */

async function renderProducts() {
  if (!app) return;

  app.innerHTML = `
    <section class="page products-page">

      <div class="page-toolbar">

        <div>
          <h2>পণ্য তালিকা</h2>

          <p class="muted">
            পণ্য, মূল্য ও বর্তমান স্টক
          </p>
        </div>

        <div class="toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="add-product-btn"
          >
            + নতুন পণ্য
          </button>

        </div>

      </div>

      <div id="products-content">
        ${loadingHtml("পণ্য লোড হচ্ছে...")}
      </div>

    </section>
  `;

  document
    .getElementById("add-product-btn")
    ?.addEventListener(
      "click",
      () => openProductModal()
    );

  await loadProducts();
}

async function loadProducts() {
  const container = document.getElementById(
    "products-content"
  );

  if (!container) return;

  container.innerHTML = loadingHtml(
    "পণ্য লোড হচ্ছে..."
  );

  try {
    const data = await getJson(
      "/api/products"
    );

    const products = Array.isArray(data)
      ? data
      : data.products || [];

    state.products = products;

    container.innerHTML =
      buildProductsTable(products);

  } catch (error) {
    console.error(error);

    container.innerHTML = errorHtml(
      error.message ||
      "পণ্য লোড করতে সমস্যা হয়েছে।"
    );
  }
}

function buildProductsTable(products) {
  if (!products.length) {
    return emptyHtml(
      "এখনও কোনো পণ্য যোগ করা হয়নি।"
    );
  }

  return `
    <div class="table-wrapper">

      <table class="data-table">

        <thead>

          <tr>
            <th>SKU</th>
            <th>পণ্যের নাম</th>
            <th>ইউনিট</th>
            <th>ক্রয়মূল্য</th>
            <th>বিক্রয়মূল্য</th>
            <th>স্টক</th>
            <th>কম স্টক সীমা</th>
            <th>অবস্থা</th>
            <th>অ্যাকশন</th>
          </tr>

        </thead>

        <tbody>

          ${products.map(product => {

            const status = stockStatus(
              product.current_stock,
              product.low_stock_level
            );

            return `
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
                  ${escapeHtml(product.unit || "")}
                </td>

                <td>
                  ৳ ${formatMoney(
                    product.purchase_price
                  )}
                </td>

                <td>
                  ৳ ${formatMoney(
                    product.sale_price
                  )}
                </td>

                <td>
                  ${formatNumber(
                    product.current_stock
                  )}
                </td>

                <td>
                  ${formatNumber(
                    product.low_stock_level
                  )}
                </td>

                <td>
                  <span class="badge ${status.className}">
                    ${status.text}
                  </span>
                </td>

                <td>

                  <div class="action-buttons">

                    <button
                      type="button"
                      class="btn btn-sm btn-secondary"
                      data-edit-product="${product.id}"
                    >
                      এডিট
                    </button>

                    <button
                      type="button"
                      class="btn btn-sm btn-danger"
                      data-delete-product="${product.id}"
                    >
                      ডিলিট
                    </button>

                  </div>

                </td>

              </tr>
            `;
          }).join("")}

        </tbody>

      </table>

    </div>
  `;
}

document.addEventListener(
  "click",
  async event => {

    const editButton =
      event.target.closest(
        "[data-edit-product]"
      );

    if (editButton) {
      const id = Number(
        editButton.dataset.editProduct
      );

      const product =
        state.products.find(
          item => Number(item.id) === id
        );

      if (product) {
        openProductModal(product);
      }

      return;
    }

    const deleteButton =
      event.target.closest(
        "[data-delete-product]"
      );

    if (deleteButton) {

      const id = Number(
        deleteButton.dataset.deleteProduct
      );

      const product =
        state.products.find(
          item => Number(item.id) === id
        );

      if (!product) return;

      if (
        !confirmAction(
          `আপনি কি "${product.name}" পণ্যটি ডিলিট করতে চান?`
        )
      ) {
        return;
      }

      try {

        await deleteJson(
          `/api/products/${id}`
        );

        showSuccess(
          "পণ্য ডিলিট হয়েছে।"
        );

        await loadProducts();

      } catch (error) {

        showError(
          error.message ||
          "পণ্য ডিলিট করা যায়নি।"
        );

      }
    }
  }
);

/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openProductModal(product = null) {

  const isEdit = Boolean(product);

  const modal = openModal(
    isEdit
      ? "পণ্য সম্পাদনা"
      : "নতুন পণ্য",

    `
      <form id="product-form">

        <div class="form-grid">

          <div class="form-group">

            <label>
              SKU
            </label>

            <input
              type="text"
              name="sku"
              value="${escapeHtml(
                product?.sku || ""
              )}"
              ${isEdit ? "" : "placeholder='অটো তৈরি হবে'"}
            >

            ${
              !isEdit
                ? `<small class="muted">
                    খালি রাখলে সিস্টেম নিজে SKU তৈরি করবে।
                   </small>`
                : ""
            }

          </div>

          <div class="form-group">

            <label>
              পণ্যের নাম *
            </label>

            <input
              type="text"
              name="name"
              required
              value="${escapeHtml(
                product?.name || ""
              )}"
            >

          </div>

          <div class="form-group">

            <label>
              ইউনিট
            </label>

            <input
              type="text"
              name="unit"
              value="${escapeHtml(
                product?.unit || ""
              )}"
              placeholder="পিস / কেজি / লিটার"
            >

          </div>

          <div class="form-group">

            <label>
              ক্রয়মূল্য
            </label>

            <input
              type="number"
              name="purchase_price"
              min="0"
              step="0.01"
              value="${product?.purchase_price ?? 0}"
            >

          </div>

          <div class="form-group">

            <label>
              বিক্রয়মূল্য
            </label>

            <input
              type="number"
              name="sale_price"
              min="0"
              step="0.01"
              value="${product?.sale_price ?? 0}"
            >

          </div>

          <div class="form-group">

            <label>
              কম স্টক সীমা
            </label>

            <input
              type="number"
              name="low_stock_level"
              min="0"
              step="0.001"
              value="${product?.low_stock_level ?? 0}"
            >

          </div>

        </div>

        ${
          isEdit
            ? `
              <div class="info-box">
                বর্তমান স্টক:
                <strong>
                  ${formatNumber(
                    product.current_stock
                  )}
                </strong>
              </div>
            `
            : ""
        }

        <div class="modal-footer">

          <button
            type="button"
            class="btn btn-secondary"
            data-modal-cancel
          >
            বাতিল
          </button>

          <button
            type="submit"
            class="btn btn-primary"
          >
            ${isEdit ? "আপডেট" : "সংরক্ষণ"}
          </button>

        </div>

      </form>
    `
  );

  modal
    .querySelector(
      "[data-modal-cancel]"
    )
    ?.addEventListener(
      "click",
      closeModal
    );

  modal
    .querySelector("#product-form")
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const form = event.currentTarget;

        const formData =
          new FormData(form);

        const payload = {
          sku:
            String(
              formData.get("sku") || ""
            ).trim(),

          name:
            String(
              formData.get("name") || ""
            ).trim(),

          unit:
            String(
              formData.get("unit") || ""
            ).trim(),

          purchase_price:
            Number(
              formData.get(
                "purchase_price"
              ) || 0
            ),

          sale_price:
            Number(
              formData.get(
                "sale_price"
              ) || 0
            ),

          low_stock_level:
            Number(
              formData.get(
                "low_stock_level"
              ) || 0
            )
        };

        if (!payload.name) {
          showError(
            "পণ্যের নাম দিতে হবে।"
          );

          return;
        }

        try {

          if (isEdit) {

            await putJson(
              `/api/products/${product.id}`,
              payload
            );

            showSuccess(
              "পণ্য আপডেট হয়েছে।"
            );

          } else {

            await postJson(
              "/api/products",
              payload
            );

            showSuccess(
              "নতুন পণ্য যোগ হয়েছে।"
            );
          }

          closeModal();

          await loadProducts();

        } catch (error) {

          showError(
            error.message ||
            "পণ্য সংরক্ষণ করা যায়নি।"
          );
        }
      }
    );
}

/* =========================================================
   CUSTOMERS
   ========================================================= */

async function renderCustomers() {

  if (!app) return;

  app.innerHTML = `
    <section class="page customers-page">

      <div class="page-toolbar">

        <div>

          <h2>কাস্টমার</h2>

          <p class="muted">
            কাস্টমার তালিকা ও যোগাযোগ
          </p>

        </div>

        <div class="toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="add-customer-btn"
          >
            + নতুন কাস্টমার
          </button>

        </div>

      </div>

      <div id="customers-content">
        ${loadingHtml("কাস্টমার লোড হচ্ছে...")}
      </div>

    </section>
  `;

  document
    .getElementById(
      "add-customer-btn"
    )
    ?.addEventListener(
      "click",
      () => openCustomerModal()
    );

  await loadCustomers();
}

async function loadCustomers() {

  const container =
    document.getElementById(
      "customers-content"
    );

  if (!container) return;

  container.innerHTML =
    loadingHtml(
      "কাস্টমার লোড হচ্ছে..."
    );

  try {

    const data =
      await getJson(
        "/api/customers"
      );

    const customers =
      Array.isArray(data)
        ? data
        : data.customers || [];

    state.customers =
      customers;

    container.innerHTML =
      buildCustomersTable(
        customers
      );

  } catch (error) {

    console.error(error);

    container.innerHTML =
      errorHtml(
        error.message ||
        "কাস্টমার লোড করতে সমস্যা হয়েছে।"
      );
  }
}

function buildCustomersTable(
  customers
) {

  if (!customers.length) {

    return emptyHtml(
      "এখনও কোনো কাস্টমার যোগ করা হয়নি।"
    );
  }

  return `
    <div class="table-wrapper">

      <table class="data-table">

        <thead>

          <tr>
            <th>নাম</th>
            <th>ফোন</th>
            <th>ঠিকানা</th>
            <th>বাকি</th>
            <th>অ্যাকশন</th>
          </tr>

        </thead>

        <tbody>

          ${customers.map(customer => `

            <tr>

              <td>
                <strong>
                  ${escapeHtml(
                    customer.name
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  customer.phone || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  customer.address || ""
                )}
              </td>

              <td>
                ৳ ${formatMoney(
                  customer.current_due || 0
                )}
              </td>

              <td>

                <div class="action-buttons">

                  <button
                    type="button"
                    class="btn btn-sm btn-secondary"
                    data-edit-customer="${customer.id}"
                  >
                    এডিট
                  </button>

                  <button
                    type="button"
                    class="btn btn-sm btn-danger"
                    data-delete-customer="${customer.id}"
                  >
                    ডিলিট
                  </button>

                </div>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}

document.addEventListener(
  "click",
  async event => {

    const editButton =
      event.target.closest(
        "[data-edit-customer]"
      );

    if (editButton) {

      const id =
        Number(
          editButton.dataset.editCustomer
        );

      const customer =
        state.customers.find(
          item =>
            Number(item.id) === id
        );

      if (customer) {
        openCustomerModal(
          customer
        );
      }

      return;
    }

    const deleteButton =
      event.target.closest(
        "[data-delete-customer]"
      );

    if (deleteButton) {

      const id =
        Number(
          deleteButton.dataset.deleteCustomer
        );

      const customer =
        state.customers.find(
          item =>
            Number(item.id) === id
        );

      if (!customer) return;

      if (
        !confirmAction(
          `আপনি কি "${customer.name}" কাস্টমারটি ডিলিট করতে চান?`
        )
      ) {
        return;
      }

      try {

        await deleteJson(
          `/api/customers/${id}`
        );

        showSuccess(
          "কাস্টমার ডিলিট হয়েছে।"
        );

        await loadCustomers();

      } catch (error) {

        showError(
          error.message ||
          "কাস্টমার ডিলিট করা যায়নি।"
        );
      }
    }
  }
);

/* =========================================================
   CUSTOMER MODAL
   ========================================================= */

function openCustomerModal(
  customer = null
) {

  const isEdit =
    Boolean(customer);

  const modal =
    openModal(
      isEdit
        ? "কাস্টমার সম্পাদনা"
        : "নতুন কাস্টমার",

      `
        <form id="customer-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                নাম *
              </label>

              <input
                type="text"
                name="name"
                required
                value="${escapeHtml(
                  customer?.name || ""
                )}"
              >

            </div>

            <div class="form-group">

              <label>
                ফোন
              </label>

              <input
                type="tel"
                name="phone"
                value="${escapeHtml(
                  customer?.phone || ""
                )}"
              >

            </div>

            <div class="form-group form-group-full">

              <label>
                ঠিকানা
              </label>

              <textarea
                name="address"
                rows="3"
              >${escapeHtml(
                customer?.address || ""
              )}</textarea>

            </div>

          </div>

          ${
            isEdit
              ? `
                <div class="info-box">

                  বর্তমান বাকি:
                  <strong>
                    ৳ ${formatMoney(
                      customer.current_due || 0
                    )}
                  </strong>

                </div>
              `
              : ""
          }

          <div class="modal-footer">

            <button
              type="button"
              class="btn btn-secondary"
              data-modal-cancel
            >
              বাতিল
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              ${isEdit
                ? "আপডেট"
                : "সংরক্ষণ"}
            </button>

          </div>

        </form>
      `
    );

  modal
    .querySelector(
      "[data-modal-cancel]"
    )
    ?.addEventListener(
      "click",
      closeModal
    );

  modal
    .querySelector(
      "#customer-form"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const form =
          event.currentTarget;

        const formData =
          new FormData(form);

        const payload = {

          name:
            String(
              formData.get("name") ||
              ""
            ).trim(),

          phone:
            String(
              formData.get("phone") ||
              ""
            ).trim(),

          address:
            String(
              formData.get("address") ||
              ""
            ).trim()
        };

        if (!payload.name) {

          showError(
            "কাস্টমারের নাম দিতে হবে।"
          );

          return;
        }

        try {

          if (isEdit) {

            await putJson(
              `/api/customers/${customer.id}`,
              payload
            );

            showSuccess(
              "কাস্টমার আপডেট হয়েছে।"
            );

          } else {

            await postJson(
              "/api/customers",
              payload
            );

            showSuccess(
              "নতুন কাস্টমার যোগ হয়েছে।"
            );
          }

          closeModal();

          await loadCustomers();

        } catch (error) {

          showError(
            error.message ||
            "কাস্টমার সংরক্ষণ করা যায়নি।"
          );
        }
      }
    );
}

/* =========================================================
   SUPPLIERS
   ========================================================= */

async function renderSuppliers() {

  if (!app) return;

  app.innerHTML = `
    <section class="page suppliers-page">

      <div class="page-toolbar">

        <div>

          <h2>সাপ্লায়ার</h2>

          <p class="muted">
            সাপ্লায়ার তালিকা ও পাওনা
          </p>

        </div>

        <div class="toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="add-supplier-btn"
          >
            + নতুন সাপ্লায়ার
          </button>

        </div>

      </div>

      <div id="suppliers-content">
        ${loadingHtml(
          "সাপ্লায়ার লোড হচ্ছে..."
        )}
      </div>

    </section>
  `;

  document
    .getElementById(
      "add-supplier-btn"
    )
    ?.addEventListener(
      "click",
      () => openSupplierModal()
    );

  await loadSuppliers();
}

async function loadSuppliers() {

  const container =
    document.getElementById(
      "suppliers-content"
    );

  if (!container) return;

  container.innerHTML =
    loadingHtml(
      "সাপ্লায়ার লোড হচ্ছে..."
    );

  try {

    const data =
      await getJson(
        "/api/suppliers"
      );

    const suppliers =
      Array.isArray(data)
        ? data
        : data.suppliers || [];

    state.suppliers =
      suppliers;

    container.innerHTML =
      buildSuppliersTable(
        suppliers
      );

  } catch (error) {

    console.error(error);

    container.innerHTML =
      errorHtml(
        error.message ||
        "সাপ্লায়ার লোড করতে সমস্যা হয়েছে।"
      );
  }
}

function buildSuppliersTable(
  suppliers
) {

  if (!suppliers.length) {

    return emptyHtml(
      "এখনও কোনো সাপ্লায়ার যোগ করা হয়নি।"
    );
  }

  return `
    <div class="table-wrapper">

      <table class="data-table">

        <thead>

          <tr>
            <th>নাম</th>
            <th>ফোন</th>
            <th>ঠিকানা</th>
            <th>পাওনা</th>
            <th>অ্যাকশন</th>
          </tr>

        </thead>

        <tbody>

          ${suppliers.map(supplier => `

            <tr>

              <td>
                <strong>
                  ${escapeHtml(
                    supplier.name
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  supplier.phone || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  supplier.address || ""
                )}
              </td>

              <td>
                ৳ ${formatMoney(
                  supplier.current_due || 0
                )}
              </td>

              <td>

                <div class="action-buttons">

                  <button
                    type="button"
                    class="btn btn-sm btn-secondary"
                    data-edit-supplier="${supplier.id}"
                  >
                    এডিট
                  </button>

                  <button
                    type="button"
                    class="btn btn-sm btn-danger"
                    data-delete-supplier="${supplier.id}"
                  >
                    ডিলিট
                  </button>

                </div>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}

document.addEventListener(
  "click",
  async event => {

    const editButton =
      event.target.closest(
        "[data-edit-supplier]"
      );

    if (editButton) {

      const id =
        Number(
          editButton.dataset.editSupplier
        );

      const supplier =
        state.suppliers.find(
          item =>
            Number(item.id) === id
        );

      if (supplier) {
        openSupplierModal(
          supplier
        );
      }

      return;
    }

    const deleteButton =
      event.target.closest(
        "[data-delete-supplier]"
      );

    if (deleteButton) {

      const id =
        Number(
          deleteButton.dataset.deleteSupplier
        );

      const supplier =
        state.suppliers.find(
          item =>
            Number(item.id) === id
        );

      if (!supplier) return;

      if (
        !confirmAction(
          `আপনি কি "${supplier.name}" সাপ্লায়ারটি ডিলিট করতে চান?`
        )
      ) {
        return;
      }

      try {

        await deleteJson(
          `/api/suppliers/${id}`
        );

        showSuccess(
          "সাপ্লায়ার ডিলিট হয়েছে।"
        );

        await loadSuppliers();

      } catch (error) {

        showError(
          error.message ||
          "সাপ্লায়ার ডিলিট করা যায়নি।"
        );
      }
    }
  }
);

/* =========================================================
   SUPPLIER MODAL
   ========================================================= */

function openSupplierModal(
  supplier = null
) {

  const isEdit =
    Boolean(supplier);

  const modal =
    openModal(
      isEdit
        ? "সাপ্লায়ার সম্পাদনা"
        : "নতুন সাপ্লায়ার",

      `
        <form id="supplier-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                নাম *
              </label>

              <input
                type="text"
                name="name"
                required
                value="${escapeHtml(
                  supplier?.name || ""
                )}"
              >

            </div>

            <div class="form-group">

              <label>
                ফোন
              </label>

              <input
                type="tel"
                name="phone"
                value="${escapeHtml(
                  supplier?.phone || ""
                )}"
              >

            </div>

            <div class="form-group form-group-full">

              <label>
                ঠিকানা
              </label>

              <textarea
                name="address"
                rows="3"
              >${escapeHtml(
                supplier?.address || ""
              )}</textarea>

            </div>

          </div>

          ${
            isEdit
              ? `
                <div class="info-box">

                  বর্তমান পাওনা:
                  <strong>
                    ৳ ${formatMoney(
                      supplier.current_due || 0
                    )}
                  </strong>

                </div>
              `
              : ""
          }

          <div class="modal-footer">

            <button
              type="button"
              class="btn btn-secondary"
              data-modal-cancel
            >
              বাতিল
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              ${isEdit
                ? "আপডেট"
                : "সংরক্ষণ"}
            </button>

          </div>

        </form>
      `
    );

  modal
    .querySelector(
      "[data-modal-cancel]"
    )
    ?.addEventListener(
      "click",
      closeModal
    );

  modal
    .querySelector(
      "#supplier-form"
    )
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const form =
          event.currentTarget;

        const formData =
          new FormData(form);

        const payload = {

          name:
            String(
              formData.get("name") ||
              ""
            ).trim(),

          phone:
            String(
              formData.get("phone") ||
              ""
            ).trim(),

          address:
            String(
              formData.get("address") ||
              ""
            ).trim()
        };

        if (!payload.name) {

          showError(
            "সাপ্লায়ারের নাম দিতে হবে।"
          );

          return;
        }

        try {

          if (isEdit) {

            await putJson(
              `/api/suppliers/${supplier.id}`,
              payload
            );

            showSuccess(
              "সাপ্লায়ার আপডেট হয়েছে।"
            );

          } else {

            await postJson(
              "/api/suppliers",
              payload
            );

            showSuccess(
              "নতুন সাপ্লায়ার যোগ হয়েছে।"
            );
          }

          closeModal();

          await loadSuppliers();

        } catch (error) {

          showError(
            error.message ||
            "সাপ্লায়ার সংরক্ষণ করা যায়নি।"
          );
        }
      }
    );
}

/* =========================================================
   PURCHASE
   ========================================================= */

async function renderPurchase() {

  if (!app) return;

  state.purchaseItems = [];

  app.innerHTML = `
    <section class="page purchase-page">

      <div class="page-toolbar">

        <div>

          <h2>পণ্য ক্রয়</h2>

          <p class="muted">
            এক ইনভয়েসে একাধিক পণ্য ক্রয় করা যাবে
          </p>

        </div>

      </div>

      <div class="card">

        <form id="purchase-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                ক্রয়ের তারিখ *
              </label>

              <input
                type="date"
                id="purchase-date"
                name="purchase_date"
                required
                value="${today()}"
              >

            </div>

            <div class="form-group">

              <label>
                সাপ্লায়ার
              </label>

              <select
                id="purchase-supplier"
                name="supplier_id"
              >

                <option value="">
                  — সাপ্লায়ার নির্বাচন —
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                পেমেন্ট অ্যাকাউন্ট *
              </label>

              <select
                id="purchase-account"
                name="account_id"
                required
              >

                <option value="">
                  — অ্যাকাউন্ট নির্বাচন —
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                রেফারেন্স
              </label>

              <input
                type="text"
                name="reference"
                placeholder="ইনভয়েস / নোট"
              >

            </div>

          </div>

          <div class="section-header">

            <h3>
              ক্রয় পণ্য
            </h3>

            <button
              type="button"
              class="btn btn-secondary"
              id="add-purchase-item"
            >
              + পণ্য যোগ
            </button>

          </div>

          <div id="purchase-items">
            ${emptyHtml(
              "প্রথমে পণ্য যোগ করুন।"
            )}
          </div>

          <div class="purchase-summary">

            <div>
              মোট ক্রয়:
              <strong id="purchase-total">
                ৳ 0.00
              </strong>
            </div>

            <div class="form-group">

              <label>
                পরিশোধ
              </label>

              <input
                type="number"
                id="purchase-paid"
                name="paid_amount"
                min="0"
                step="0.01"
                value="0"
              >

            </div>

            <div>
              বাকি:
              <strong id="purchase-due">
                ৳ 0.00
              </strong>
            </div>

          </div>

          <div class="form-actions">

            <button
              type="reset"
              class="btn btn-secondary"
              id="purchase-reset"
            >
              রিসেট
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              ক্রয় সংরক্ষণ
            </button>

          </div>

        </form>

      </div>

    </section>
  `;

  await loadPurchaseDependencies();

  document
    .getElementById(
      "add-purchase-item"
    )
    ?.addEventListener(
      "click",
      addPurchaseItem
    );

  document
    .getElementById(
      "purchase-paid"
    )
    ?.addEventListener(
      "input",
      updatePurchaseSummary
    );

  document
    .getElementById(
      "purchase-form"
    )
    ?.addEventListener(
      "submit",
      submitPurchase
    );

  document
    .getElementById(
      "purchase-reset"
    )
    ?.addEventListener(
      "click",
      () => {
        state.purchaseItems = [];
        renderPurchaseItems();
        updatePurchaseSummary();
      }
    );

  renderPurchaseItems();
  updatePurchaseSummary();
}

async function loadPurchaseDependencies() {

  try {

    const [
      productsData,
      suppliersData,
      accountsData
    ] = await Promise.all([
      getJson("/api/products"),
      getJson("/api/suppliers"),
      getJson("/api/accounts")
    ]);

    state.products =
      Array.isArray(productsData)
        ? productsData
        : productsData.products || [];

    state.suppliers =
      Array.isArray(suppliersData)
        ? suppliersData
        : suppliersData.suppliers || [];

    state.accounts =
      Array.isArray(accountsData)
        ? accountsData
        : accountsData.accounts || [];

    const supplierSelect =
      document.getElementById(
        "purchase-supplier"
      );

    if (supplierSelect) {

      supplierSelect.innerHTML = `
        <option value="">
          — সাপ্লায়ার নির্বাচন —
        </option>

        ${state.suppliers.map(
          supplier => `
            <option value="${supplier.id}">
              ${escapeHtml(
                supplier.name
              )}
            </option>
          `
        ).join("")}
      `;
    }

    const accountSelect =
      document.getElementById(
        "purchase-account"
      );

    if (accountSelect) {

      accountSelect.innerHTML = `
        <option value="">
          — অ্যাকাউন্ট নির্বাচন —
        </option>

        ${state.accounts
          .filter(
            account =>
              [
                "ASSET",
                "CASH",
                "BANK",
                "MOBILE_BANKING"
              ].includes(
                account.account_type
              ) ||
              [
                1000,
                1010,
                1020,
                1030,
                1040,
                1050,
                1060,
                1070
              ].includes(
                Number(account.id)
              )
          )
          .map(
            account => `
              <option value="${account.id}">
                ${escapeHtml(
                  account.name
                )}
              </option>
            `
          ).join("")}
      `;
    }

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "ক্রয়ের প্রয়োজনীয় তথ্য লোড করা যায়নি।"
    );
  }
}

function addPurchaseItem() {

  const item = {
    product_id: "",
    quantity: 1,
    unit_price: 0,
    total: 0
  };

  state.purchaseItems.push(item);

  renderPurchaseItems();

  updatePurchaseSummary();
}

function renderPurchaseItems() {

  const container =
    document.getElementById(
      "purchase-items"
    );

  if (!container) return;

  if (!state.purchaseItems.length) {

    container.innerHTML =
      emptyHtml(
        "প্রথমে পণ্য যোগ করুন।"
      );

    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">

      <table class="data-table purchase-items-table">

        <thead>

          <tr>
            <th>পণ্য</th>
            <th>পরিমাণ</th>
            <th>ক্রয়মূল্য</th>
            <th>মোট</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${state.purchaseItems.map(
            (item, index) => {

              const product =
                state.products.find(
                  p =>
                    Number(p.id) ===
                    Number(
                      item.product_id
                    )
                );

              return `
                <tr>

                  <td>

                    <select
                      data-purchase-product="${index}"
                    >

                      <option value="">
                        — পণ্য —
                      </option>

                      ${state.products.map(
                        p => `
                          <option
                            value="${p.id}"
                            ${
                              Number(
                                item.product_id
                              ) ===
                              Number(p.id)
                                ? "selected"
                                : ""
                            }
                          >
                            ${escapeHtml(
                              p.name
                            )}
                          </option>
                        `
                      ).join("")}

                    </select>

                  </td>

                  <td>

                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value="${item.quantity}"
                      data-purchase-quantity="${index}"
                    >

                  </td>

                  <td>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value="${item.unit_price}"
                      data-purchase-price="${index}"
                    >

                  </td>

                  <td>
                    ৳ ${formatMoney(
                      Number(item.total || 0)
                    )}
                  </td>

                  <td>

                    <button
                      type="button"
                      class="btn btn-sm btn-danger"
                      data-remove-purchase="${index}"
                    >
                      ×
                    </button>

                  </td>

                </tr>
              `;
            }
          ).join("")}

        </tbody>

      </table>

    </div>
  `;

  container
    .querySelectorAll(
      "[data-purchase-product]"
    )
    .forEach(select => {

      select.addEventListener(
        "change",
        event => {

          const index =
            Number(
              event.target.dataset
                .purchaseProduct
            );

          const productId =
            Number(
              event.target.value || 0
            );

          const product =
            state.products.find(
              p =>
                Number(p.id) ===
                productId
            );

          state.purchaseItems[index]
            .product_id =
            productId || "";

          if (
            product &&
            !state.purchaseItems[index]
              .unit_price
          ) {
            state.purchaseItems[index]
              .unit_price =
              Number(
                product.purchase_price ||
                product.last_purchase_cost ||
                0
              );
          }

          recalculatePurchaseItem(
            index
          );

          renderPurchaseItems();

          updatePurchaseSummary();
        }
      );
    });

  container
    .querySelectorAll(
      "[data-purchase-quantity]"
    )
    .forEach(input => {

      input.addEventListener(
        "input",
        event => {

          const index =
            Number(
              event.target.dataset
                .purchaseQuantity
            );

          state.purchaseItems[index]
            .quantity =
            Number(
              event.target.value || 0
            );

          recalculatePurchaseItem(
            index
          );

          renderPurchaseItems();

          updatePurchaseSummary();
        }
      );
    });

  container
    .querySelectorAll(
      "[data-purchase-price]"
    )
    .forEach(input => {

      input.addEventListener(
        "input",
        event => {

          const index =
            Number(
              event.target.dataset
                .purchasePrice
            );

          state.purchaseItems[index]
            .unit_price =
            Number(
              event.target.value || 0
            );

          recalculatePurchaseItem(
            index
          );

          renderPurchaseItems();

          updatePurchaseSummary();
        }
      );
    });

  container
    .querySelectorAll(
      "[data-remove-purchase]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          const index =
            Number(
              event.target.dataset
                .removePurchase
            );

          state.purchaseItems.splice(
            index,
            1
          );

          renderPurchaseItems();

          updatePurchaseSummary();
        }
      );
    });
}

function recalculatePurchaseItem(
  index
) {

  const item =
    state.purchaseItems[index];

  if (!item) return;

  item.quantity =
    Number(item.quantity || 0);

  item.unit_price =
    Number(item.unit_price || 0);

  item.total =
    item.quantity *
    item.unit_price;
}

function getPurchaseTotal() {

  return state.purchaseItems.reduce(
    (sum, item) =>
      sum +
      Number(item.total || 0),
    0
  );
}

function updatePurchaseSummary() {

  const total =
    getPurchaseTotal();

  const paid =
    Number(
      document.getElementById(
        "purchase-paid"
      )?.value || 0
    );

  const due =
    Math.max(
      total - paid,
      0
    );

  const totalElement =
    document.getElementById(
      "purchase-total"
    );

  const dueElement =
    document.getElementById(
      "purchase-due"
    );

  if (totalElement) {
    totalElement.textContent =
      `৳ ${formatMoney(total)}`;
  }

  if (dueElement) {
    dueElement.textContent =
      `৳ ${formatMoney(due)}`;
  }
}

async function submitPurchase(
  event
) {

  event.preventDefault();

  if (!state.purchaseItems.length) {

    showError(
      "কমপক্ষে একটি পণ্য যোগ করুন।"
    );

    return;
  }

  for (
    const item of state.purchaseItems
  ) {

    if (!item.product_id) {

      showError(
        "সব পণ্যের নাম নির্বাচন করুন।"
      );

      return;
    }

    if (
      Number(item.quantity) <= 0
    ) {

      showError(
        "পণ্যের পরিমাণ ০-এর বেশি হতে হবে।"
      );

      return;
    }

    if (
      Number(item.unit_price) < 0
    ) {

      showError(
        "ক্রয়মূল্য সঠিক দিন।"
      );

      return;
    }
  }

  const total =
    getPurchaseTotal();

  const paid =
    Number(
      document.getElementById(
        "purchase-paid"
      )?.value || 0
    );

  const due =
    total - paid;

  if (paid < 0) {

    showError(
      "পরিশোধের পরিমাণ সঠিক নয়।"
    );

    return;
  }

  if (paid > total) {

    showError(
      "পরিশোধ মোট ক্রয়ের চেয়ে বেশি হতে পারবে না।"
    );

    return;
  }

  const form =
    document.getElementById(
      "purchase-form"
    );

  const formData =
    new FormData(form);

  const payload = {

    purchase_date:
      formData.get(
        "purchase_date"
      ) || today(),

    supplier_id:
      formData.get(
        "supplier_id"
      )
        ? Number(
            formData.get(
              "supplier_id"
            )
          )
        : null,

    account_id:
      formData.get(
        "account_id"
      )
        ? Number(
            formData.get(
              "account_id"
            )
          )
        : null,

    reference:
      String(
        formData.get(
          "reference"
        ) || ""
      ).trim(),

    total_amount:
      total,

    paid_amount:
      paid,

    due_amount:
      due,

    items:
      state.purchaseItems.map(
        item => ({
          product_id:
            Number(
              item.product_id
            ),

          quantity:
            Number(
              item.quantity
            ),

          unit_price:
            Number(
              item.unit_price
            ),

          total:
            Number(
              item.total
            )
        })
      )
  };

  if (!payload.account_id) {

    showError(
      "পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন।"
    );

    return;
  }

  try {

    setLoading(true);

    await postJson(
      "/api/transactions/purchase",
      payload
    );

    showSuccess(
      "ক্রয় সফলভাবে সংরক্ষণ হয়েছে।"
    );

    state.purchaseItems = [];

    form.reset();

    document.getElementById(
      "purchase-date"
    ).value = today();

    renderPurchaseItems();

    updatePurchaseSummary();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "ক্রয় সংরক্ষণ করা যায়নি।"
    );

  } finally {

    setLoading(false);
  }
}

/* =========================================================
   SALE
   ========================================================= */

async function renderSale() {

  if (!app) return;

  state.saleItems = [];

  app.innerHTML = `
    <section class="page sale-page">

      <div class="page-toolbar">

        <div>

          <h2>বিক্রয়</h2>

          <p class="muted">
            পণ্যভিত্তিক বিক্রয় ও কাস্টমার বাকি
          </p>

        </div>

      </div>

      <div class="card">

        <form id="sale-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                বিক্রয়ের তারিখ *
              </label>

              <input
                type="date"
                name="sale_date"
                id="sale-date"
                required
                value="${today()}"
              >

            </div>

            <div class="form-group">

              <label>
                কাস্টমার
              </label>

              <select
                name="customer_id"
                id="sale-customer"
              >

                <option value="">
                  — কাস্টমার নির্বাচন —
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                পেমেন্ট অ্যাকাউন্ট
              </label>

              <select
                name="account_id"
                id="sale-account"
              >

                <option value="">
                  — অ্যাকাউন্ট —
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                রেফারেন্স
              </label>

              <input
                type="text"
                name="reference"
                placeholder="নোট / রেফারেন্স"
              >

            </div>

          </div>

          <div class="section-header">

            <h3>
              বিক্রয় পণ্য
            </h3>

            <button
              type="button"
              class="btn btn-secondary"
              id="add-sale-item"
            >
              + পণ্য যোগ
            </button>

          </div>

          <div id="sale-items">
            ${emptyHtml(
              "প্রথমে পণ্য যোগ করুন।"
            )}
          </div>

          <div class="sale-summary">

            <div>
              মোট বিক্রয়:
              <strong id="sale-total">
                ৳ 0.00
              </strong>
            </div>

            <div class="form-group">

              <label>
                পরিশোধ
              </label>

              <input
                type="number"
                id="sale-paid"
                name="paid_amount"
                min="0"
                step="0.01"
                value="0"
              >

            </div>

            <div>
              বাকি:
              <strong id="sale-due">
                ৳ 0.00
              </strong>
            </div>

          </div>

          <div class="form-actions">

            <button
              type="reset"
              class="btn btn-secondary"
              id="sale-reset"
            >
              রিসেট
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              বিক্রয় সংরক্ষণ
            </button>

          </div>

        </form>

      </div>

    </section>
  `;

  await loadSaleDependencies();

  document
    .getElementById(
      "add-sale-item"
    )
    ?.addEventListener(
      "click",
      addSaleItem
    );

  document
    .getElementById(
      "sale-paid"
    )
    ?.addEventListener(
      "input",
      updateSaleSummary
    );

  document
    .getElementById(
      "sale-form"
    )
    ?.addEventListener(
      "submit",
      submitSale
    );

  document
    .getElementById(
      "sale-reset"
    )
    ?.addEventListener(
      "click",
      () => {

        state.saleItems = [];

        renderSaleItems();

        updateSaleSummary();
      }
    );

  renderSaleItems();

  updateSaleSummary();
}

async function loadSaleDependencies() {

  try {

    const [
      productsData,
      customersData,
      accountsData
    ] = await Promise.all([
      getJson("/api/products"),
      getJson("/api/customers"),
      getJson("/api/accounts")
    ]);

    state.products =
      Array.isArray(productsData)
        ? productsData
        : productsData.products || [];

    state.customers =
      Array.isArray(customersData)
        ? customersData
        : customersData.customers || [];

    state.accounts =
      Array.isArray(accountsData)
        ? accountsData
        : accountsData.accounts || [];

    const customerSelect =
      document.getElementById(
        "sale-customer"
      );

    if (customerSelect) {

      customerSelect.innerHTML = `
        <option value="">
          — কাস্টমার নির্বাচন —
        </option>

        ${state.customers.map(
          customer => `
            <option value="${customer.id}">
              ${escapeHtml(
                customer.name
              )}
            </option>
          `
        ).join("")}
      `;
    }

    const accountSelect =
      document.getElementById(
        "sale-account"
      );

    if (accountSelect) {

      accountSelect.innerHTML = `
        <option value="">
          — অ্যাকাউন্ট —
        </option>

        ${state.accounts
          .filter(
            account =>
              [
                1000,
                1010,
                1020,
                1030,
                1040,
                1050,
                1060,
                1070
              ].includes(
                Number(account.id)
              )
          )
          .map(
            account => `
              <option value="${account.id}">
                ${escapeHtml(
                  account.name
                )}
              </option>
            `
          ).join("")}
      `;
    }

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "বিক্রয়ের প্রয়োজনীয় তথ্য লোড করা যায়নি।"
    );
  }
}

function addSaleItem() {

  state.saleItems.push({
    product_id: "",
    quantity: 1,
    unit_price: 0,
    total: 0
  });

  renderSaleItems();

  updateSaleSummary();
}

function renderSaleItems() {

  const container =
    document.getElementById(
      "sale-items"
    );

  if (!container) return;

  if (!state.saleItems.length) {

    container.innerHTML =
      emptyHtml(
        "প্রথমে পণ্য যোগ করুন।"
      );

    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">

      <table class="data-table sale-items-table">

        <thead>

          <tr>
            <th>পণ্য</th>
            <th>স্টক</th>
            <th>পরিমাণ</th>
            <th>বিক্রয়মূল্য</th>
            <th>মোট</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${state.saleItems.map(
            (item, index) => {

              const product =
                state.products.find(
                  p =>
                    Number(p.id) ===
                    Number(
                      item.product_id
                    )
                );

              return `
                <tr>

                  <td>

                    <select
                      data-sale-product="${index}"
                    >

                      <option value="">
                        — পণ্য —
                      </option>

                      ${state.products.map(
                        p => `
                          <option
                            value="${p.id}"
                            ${
                              Number(
                                item.product_id
                              ) ===
                              Number(p.id)
                                ? "selected"
                                : ""
                            }
                          >
                            ${escapeHtml(
                              p.name
                            )}
                          </option>
                        `
                      ).join("")}

                    </select>

                  </td>

                  <td>
                    ${
                      product
                        ? formatNumber(
                            product.current_stock
                          )
                        : "—"
                    }
                  </td>

                  <td>

                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      max="${
                        product
                          ? product.current_stock
                          : ""
                      }"
                      value="${item.quantity}"
                      data-sale-quantity="${index}"
                    >

                  </td>

                  <td>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value="${item.unit_price}"
                      data-sale-price="${index}"
                    >

                  </td>

                  <td>
                    ৳ ${formatMoney(
                      item.total || 0
                    )}
                  </td>

                  <td>

                    <button
                      type="button"
                      class="btn btn-sm btn-danger"
                      data-remove-sale="${index}"
                    >
                      ×
                    </button>

                  </td>

                </tr>
              `;
            }
          ).join("")}

        </tbody>

      </table>

    </div>
  `;

  container
    .querySelectorAll(
      "[data-sale-product]"
    )
    .forEach(select => {

      select.addEventListener(
        "change",
        event => {

          const index =
            Number(
              event.target.dataset
                .saleProduct
            );

          const productId =
            Number(
              event.target.value || 0
            );

          const product =
            state.products.find(
              p =>
                Number(p.id) ===
                productId
            );

          state.saleItems[index]
            .product_id =
            productId || "";

          if (product) {

            state.saleItems[index]
              .unit_price =
              Number(
                product.sale_price || 0
              );
          }

          recalculateSaleItem(
            index
          );

          renderSaleItems();

          updateSaleSummary();
        }
      );
    });

  container
    .querySelectorAll(
      "[data-sale-quantity]"
    )
    .forEach(input => {

      input.addEventListener(
        "input",
        event => {

          const index =
            Number(
              event.target.dataset
                .saleQuantity
            );

          state.saleItems[index]
            .quantity =
            Number(
              event.target.value || 0
            );

          recalculateSaleItem(
            index
          );

          renderSaleItems();

          updateSaleSummary();
        }
      );
    });

  container
    .querySelectorAll(
      "[data-sale-price]"
    )
    .forEach(input => {

      input.addEventListener(
        "input",
        event => {

          const index =
            Number(
              event.target.dataset
                .salePrice
            );

          state.saleItems[index]
            .unit_price =
            Number(
              event.target.value || 0
            );

          recalculateSaleItem(
            index
          );

          renderSaleItems();

          updateSaleSummary();
        }
      );
    });

  container
    .querySelectorAll(
      "[data-remove-sale]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          const index =
            Number(
              event.target.dataset
                .removeSale
            );

          state.saleItems.splice(
            index,
            1
          );

          renderSaleItems();

          updateSaleSummary();
        }
      );
    });
}

function recalculateSaleItem(
  index
) {

  const item =
    state.saleItems[index];

  if (!item) return;

  item.quantity =
    Number(item.quantity || 0);

  item.unit_price =
    Number(item.unit_price || 0);

  item.total =
    item.quantity *
    item.unit_price;
}

function getSaleTotal() {

  return state.saleItems.reduce(
    (sum, item) =>
      sum +
      Number(item.total || 0),
    0
  );
}

function updateSaleSummary() {

  const total =
    getSaleTotal();

  const paid =
    Number(
      document.getElementById(
        "sale-paid"
      )?.value || 0
    );

  const due =
    Math.max(
      total - paid,
      0
    );

  const totalElement =
    document.getElementById(
      "sale-total"
    );

  const dueElement =
    document.getElementById(
      "sale-due"
    );

  if (totalElement) {

    totalElement.textContent =
      `৳ ${formatMoney(total)}`;
  }

  if (dueElement) {

    dueElement.textContent =
      `৳ ${formatMoney(due)}`;
  }
}

async function submitSale(
  event
) {

  event.preventDefault();

  if (!state.saleItems.length) {

    showError(
      "কমপক্ষে একটি পণ্য যোগ করুন।"
    );

    return;
  }

  for (
    const item of state.saleItems
  ) {

    if (!item.product_id) {

      showError(
        "সব পণ্যের নাম নির্বাচন করুন।"
      );

      return;
    }

    const product =
      state.products.find(
        p =>
          Number(p.id) ===
          Number(
            item.product_id
          )
      );

    if (!product) {

      showError(
        "নির্বাচিত পণ্য পাওয়া যায়নি।"
      );

      return;
    }

    if (
      Number(item.quantity) <= 0
    ) {

      showError(
        "বিক্রয়ের পরিমাণ ০-এর বেশি হতে হবে।"
      );

      return;
    }

    if (
      Number(item.quantity) >
      Number(product.current_stock)
    ) {

      showError(
        `"${product.name}" পণ্যের পর্যাপ্ত স্টক নেই।`
      );

      return;
    }

    if (
      Number(item.unit_price) < 0
    ) {

      showError(
        "বিক্রয়মূল্য সঠিক দিন।"
      );

      return;
    }
  }

  const total =
    getSaleTotal();

  const paid =
    Number(
      document.getElementById(
        "sale-paid"
      )?.value || 0
    );

  const due =
    total - paid;

  if (paid < 0) {

    showError(
      "পরিশোধের পরিমাণ সঠিক নয়।"
    );

    return;
  }

  if (paid > total) {

    showError(
      "পরিশোধ মোট বিক্রয়ের চেয়ে বেশি হতে পারবে না।"
    );

    return;
  }

  const form =
    document.getElementById(
      "sale-form"
    );

  const formData =
    new FormData(form);

  const customerId =
    formData.get(
      "customer_id"
    )
      ? Number(
          formData.get(
            "customer_id"
          )
        )
      : null;

  if (
    due > 0 &&
    !customerId
  ) {

    showError(
      "বাকি বিক্রয়ের জন্য কাস্টমার নির্বাচন করতে হবে।"
    );

    return;
  }

  const payload = {

    sale_date:
      formData.get(
        "sale_date"
      ) || today(),

    customer_id:
      customerId,

    account_id:
      formData.get(
        "account_id"
      )
        ? Number(
            formData.get(
              "account_id"
            )
          )
        : null,

    reference:
      String(
        formData.get(
          "reference"
        ) || ""
      ).trim(),

    total_amount:
      total,

    paid_amount:
      paid,

    due_amount:
      due,

    items:
      state.saleItems.map(
        item => ({
          product_id:
            Number(
              item.product_id
            ),

          quantity:
            Number(
              item.quantity
            ),

          unit_price:
            Number(
              item.unit_price
            ),

          total:
            Number(
              item.total
            )
        })
      )
  };

  try {

    setLoading(true);

    await postJson(
      "/api/transactions/sale",
      payload
    );

    showSuccess(
      "বিক্রয় সফলভাবে সংরক্ষণ হয়েছে।"
    );

    state.saleItems = [];

    form.reset();

    document.getElementById(
      "sale-date"
    ).value = today();

    renderSaleItems();

    updateSaleSummary();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "বিক্রয় সংরক্ষণ করা যায়নি।"
    );

  } finally {

    setLoading(false);
  }
}

/* =========================================================
   CUSTOMER DUE
   ========================================================= */

async function renderCustomerDue() {

  if (!app) return;

  app.innerHTML = `
    <section class="page customer-due-page">

      <div class="page-toolbar">

        <div>

          <h2>কাস্টমার বাকি</h2>

          <p class="muted">
            বাকি বিক্রয়, আদায় ও কাস্টমার লেজার
          </p>

        </div>

        <div class="toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="new-customer-collection"
          >
            + বাকি আদায়
          </button>

        </div>

      </div>

      <div
        id="customer-due-content"
      >
        ${loadingHtml(
          "কাস্টমার বাকি লোড হচ্ছে..."
        )}
      </div>

    </section>
  `;

  document
    .getElementById(
      "new-customer-collection"
    )
    ?.addEventListener(
      "click",
      () =>
        openCustomerCollectionModal()
    );

  await loadCustomerDue();
}

async function loadCustomerDue() {

  const container =
    document.getElementById(
      "customer-due-content"
    );

  if (!container) return;

  container.innerHTML =
    loadingHtml(
      "কাস্টমার বাকি লোড হচ্ছে..."
    );

  try {

    const data =
      await getJson(
        "/api/customers"
      );

    const customers =
      Array.isArray(data)
        ? data
        : data.customers || [];

    state.customers =
      customers;

    container.innerHTML = `
      <div class="table-wrapper">

        <table class="data-table">

          <thead>

            <tr>
              <th>কাস্টমার</th>
              <th>ফোন</th>
              <th>বর্তমান বাকি</th>
              <th>অ্যাকশন</th>
            </tr>

          </thead>

          <tbody>

            ${
              customers.length
                ? customers.map(
                    customer => `
                      <tr>

                        <td>
                          <strong>
                            ${escapeHtml(
                              customer.name
                            )}
                          </strong>
                        </td>

                        <td>
                          ${escapeHtml(
                            customer.phone ||
                            ""
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            customer.current_due ||
                            0
                          )}
                        </td>

                        <td>

                          <div class="action-buttons">

                            <button
                              type="button"
                              class="btn btn-sm btn-primary"
                              data-collect-customer="${customer.id}"
                            >
                              আদায়
                            </button>

                            <button
                              type="button"
                              class="btn btn-sm btn-secondary"
                              data-customer-ledger="${customer.id}"
                            >
                              লেজার
                            </button>

                          </div>

                        </td>

                      </tr>
                    `
                  ).join("")
                : `
                    <tr>

                      <td
                        colspan="4"
                        class="text-center"
                      >
                        কোনো কাস্টমার নেই।
                      </td>

                    </tr>
                  `
            }

          </tbody>

        </table>

      </div>
    `;

  } catch (error) {

    console.error(error);

    container.innerHTML =
      errorHtml(
        error.message ||
        "কাস্টমার বাকি লোড করা যায়নি।"
      );
  }
}

document.addEventListener(
  "click",
  event => {

    const collectButton =
      event.target.closest(
        "[data-collect-customer]"
      );

    if (collectButton) {

      const id =
        Number(
          collectButton.dataset
            .collectCustomer
        );

      const customer =
        state.customers.find(
          item =>
            Number(item.id) === id
        );

      if (customer) {
        openCustomerCollectionModal(
          customer
        );
      }

      return;
    }

    const ledgerButton =
      event.target.closest(
        "[data-customer-ledger]"
      );

    if (ledgerButton) {

      const id =
        Number(
          ledgerButton.dataset
            .customerLedger
        );

      const customer =
        state.customers.find(
          item =>
            Number(item.id) === id
        );

      if (customer) {
        openCustomerLedger(
          customer
        );
      }
    }
  }
);

function openCustomerCollectionModal(
  customer = null
) {

  const modal =
    openModal(
      "কাস্টমার বাকি আদায়",

      `
        <form id="customer-collection-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                কাস্টমার *
              </label>

              <select
                name="customer_id"
                required
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

                ${state.customers.map(
                  item => `
                    <option
                      value="${item.id}"
                      ${
                        customer &&
                        Number(
                          customer.id
                        ) ===
                        Number(item.id)
                          ? "selected"
                          : ""
                      }
                    >
                      ${escapeHtml(
                        item.name
                      )}
                    </option>
                  `
                ).join("")}

              </select>

            </div>

            <div class="form-group">

              <label>
                তারিখ *
              </label>

              <input
                type="date"
                name="collection_date"
                required
                value="${today()}"
              >

            </div>

            <div class="form-group">

              <label>
                আদায়ের অ্যাকাউন্ট *
              </label>

              <select
                name="account_id"
                required
                id="collection-account"
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                পরিমাণ *
              </label>

              <input
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
              >

            </div>

            <div class="form-group form-group-full">

              <label>
                নোট
              </label>

              <textarea
                name="note"
                rows="3"
              ></textarea>

            </div>

          </div>

          <div class="modal-footer">

            <button
              type="button"
              class="btn btn-secondary"
              data-modal-cancel
            >
              বাতিল
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              আদায় সংরক্ষণ
            </button>

          </div>

        </form>
      `
    );

  loadCollectionAccounts(
    modal
  );

  modal
    .querySelector(
      "[data-modal-cancel]"
    )
    ?.addEventListener(
      "click",
      closeModal
    );

  modal
    .querySelector(
      "#customer-collection-form"
    )
    ?.addEventListener(
      "submit",
      submitCustomerCollection
    );
}

async function loadCollectionAccounts(
  modal
) {

  try {

    const data =
      await getJson(
        "/api/accounts"
      );

    const accounts =
      Array.isArray(data)
        ? data
        : data.accounts || [];

    const select =
      modal.querySelector(
        "#collection-account"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        — নির্বাচন করুন —
      </option>

      ${accounts
        .filter(
          account =>
            [
              1000,
              1010,
              1020,
              1030,
              1040,
              1050,
              1060,
              1070
            ].includes(
              Number(account.id)
            )
        )
        .map(
          account => `
            <option value="${account.id}">
              ${escapeHtml(
                account.name
              )}
            </option>
          `
        ).join("")}
    `;

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "অ্যাকাউন্ট লোড করা যায়নি।"
    );
  }
}

async function submitCustomerCollection(
  event
) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const formData =
    new FormData(form);

  const payload = {

    customer_id:
      Number(
        formData.get(
          "customer_id"
        )
      ),

    collection_date:
      formData.get(
        "collection_date"
      ) || today(),

    account_id:
      Number(
        formData.get(
          "account_id"
        )
      ),

    amount:
      Number(
        formData.get(
          "amount"
        ) || 0
      ),

    note:
      String(
        formData.get(
          "note"
        ) || ""
      ).trim()
  };

  if (
    !payload.customer_id
  ) {

    showError(
      "কাস্টমার নির্বাচন করুন।"
    );

    return;
  }

  if (
    !payload.account_id
  ) {

    showError(
      "আদায়ের অ্যাকাউন্ট নির্বাচন করুন।"
    );

    return;
  }

  if (
    payload.amount <= 0
  ) {

    showError(
      "আদায়ের পরিমাণ ০-এর বেশি হতে হবে।"
    );

    return;
  }

  try {

    setLoading(true);

    await postJson(
      "/api/transactions/customer-collection",
      payload
    );

    showSuccess(
      "কাস্টমার বাকি আদায় সংরক্ষণ হয়েছে।"
    );

    closeModal();

    await loadCustomerDue();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "বাকি আদায় সংরক্ষণ করা যায়নি।"
    );

  } finally {

    setLoading(false);
  }
}

async function openCustomerLedger(
  customer
) {

  const modal =
    openModal(
      `কাস্টমার লেজার — ${customer.name}`,

      loadingHtml(
        "লেজার লোড হচ্ছে..."
      ),

      {
        large: true
      }
    );

  try {

    const data =
      await getJson(
        `/api/ledgers/customer/${customer.id}`
      );

    const entries =
      Array.isArray(data)
        ? data
        : data.entries || [];

    const body =
      modal.querySelector(
        ".modal-body"
      );

    if (!body) return;

    body.innerHTML = `

      <div class="ledger-summary">

        <div class="mini-card">

          <div class="mini-card-title">
            বর্তমান বাকি
          </div>

          <div class="mini-card-value">
            ৳ ${formatMoney(
              customer.current_due || 0
            )}
          </div>

        </div>

      </div>

      ${
        entries.length
          ? `
            <div class="table-wrapper">

              <table class="data-table">

                <thead>

                  <tr>
                    <th>তারিখ</th>
                    <th>ধরন</th>
                    <th>রেফারেন্স</th>
                    <th>ডেবিট</th>
                    <th>ক্রেডিট</th>
                    <th>ব্যালেন্স</th>
                  </tr>

                </thead>

                <tbody>

                  ${entries.map(
                    entry => `
                      <tr>

                        <td>
                          ${escapeHtml(
                            entry.date ||
                            entry.transaction_date ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            entry.type ||
                            entry.transaction_type ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            entry.reference ||
                            ""
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            entry.debit ||
                            entry.debit_amount ||
                            0
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            entry.credit ||
                            entry.credit_amount ||
                            0
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            entry.balance ||
                            0
                          )}
                        </td>

                      </tr>
                    `
                  ).join("")}

                </tbody>

              </table>

            </div>
          `
          : emptyHtml(
              "এই কাস্টমারের কোনো লেজার পাওয়া যায়নি।"
            )
      }
    `;

  } catch (error) {

    console.error(error);

    const body =
      modal.querySelector(
        ".modal-body"
      );

    if (body) {

      body.innerHTML =
        errorHtml(
          error.message ||
          "লেজার লোড করা যায়নি।"
        );
    }
  }
}

/* =========================================================
   SUPPLIER DUE
   ========================================================= */

async function renderSupplierDue() {

  if (!app) return;

  app.innerHTML = `
    <section class="page supplier-due-page">

      <div class="page-toolbar">

        <div>

          <h2>সাপ্লায়ার বাকি</h2>

          <p class="muted">
            সাপ্লায়ার পাওনা, পেমেন্ট ও লেজার
          </p>

        </div>

        <div class="toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="new-supplier-payment"
          >
            + সাপ্লায়ার পেমেন্ট
          </button>

        </div>

      </div>

      <div id="supplier-due-content">
        ${loadingHtml(
          "সাপ্লায়ার বাকি লোড হচ্ছে..."
        )}
      </div>

    </section>
  `;

  document
    .getElementById(
      "new-supplier-payment"
    )
    ?.addEventListener(
      "click",
      () =>
        openSupplierPaymentModal()
    );

  await loadSupplierDue();
}

async function loadSupplierDue() {

  const container =
    document.getElementById(
      "supplier-due-content"
    );

  if (!container) return;

  container.innerHTML =
    loadingHtml(
      "সাপ্লায়ার বাকি লোড হচ্ছে..."
    );

  try {

    const data =
      await getJson(
        "/api/suppliers"
      );

    const suppliers =
      Array.isArray(data)
        ? data
        : data.suppliers || [];

    state.suppliers =
      suppliers;

    container.innerHTML = `

      <div class="table-wrapper">

        <table class="data-table">

          <thead>

            <tr>
              <th>সাপ্লায়ার</th>
              <th>ফোন</th>
              <th>বর্তমান পাওনা</th>
              <th>অ্যাকশন</th>
            </tr>

          </thead>

          <tbody>

            ${
              suppliers.length
                ? suppliers.map(
                    supplier => `
                      <tr>

                        <td>
                          <strong>
                            ${escapeHtml(
                              supplier.name
                            )}
                          </strong>
                        </td>

                        <td>
                          ${escapeHtml(
                            supplier.phone ||
                            ""
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            supplier.current_due ||
                            0
                          )}
                        </td>

                        <td>

                          <div class="action-buttons">

                            <button
                              type="button"
                              class="btn btn-sm btn-primary"
                              data-pay-supplier="${supplier.id}"
                            >
                              পেমেন্ট
                            </button>

                            <button
                              type="button"
                              class="btn btn-sm btn-secondary"
                              data-supplier-ledger="${supplier.id}"
                            >
                              লেজার
                            </button>

                          </div>

                        </td>

                      </tr>
                    `
                  ).join("")
                : `
                    <tr>

                      <td
                        colspan="4"
                        class="text-center"
                      >
                        কোনো সাপ্লায়ার নেই।
                      </td>

                    </tr>
                  `
            }

          </tbody>

        </table>

      </div>
    `;

  } catch (error) {

    console.error(error);

    container.innerHTML =
      errorHtml(
        error.message ||
        "সাপ্লায়ার বাকি লোড করা যায়নি।"
      );
  }
}

document.addEventListener(
  "click",
  event => {

    const payButton =
      event.target.closest(
        "[data-pay-supplier]"
      );

    if (payButton) {

      const id =
        Number(
          payButton.dataset
            .paySupplier
        );

      const supplier =
        state.suppliers.find(
          item =>
            Number(item.id) === id
        );

      if (supplier) {
        openSupplierPaymentModal(
          supplier
        );
      }

      return;
    }

    const ledgerButton =
      event.target.closest(
        "[data-supplier-ledger]"
      );

    if (ledgerButton) {

      const id =
        Number(
          ledgerButton.dataset
            .supplierLedger
        );

      const supplier =
        state.suppliers.find(
          item =>
            Number(item.id) === id
        );

      if (supplier) {
        openSupplierLedger(
          supplier
        );
      }
    }
  }
);

function openSupplierPaymentModal(
  supplier = null
) {

  const modal =
    openModal(
      "সাপ্লায়ার পেমেন্ট",

      `
        <form id="supplier-payment-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                সাপ্লায়ার *
              </label>

              <select
                name="supplier_id"
                required
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

                ${state.suppliers.map(
                  item => `
                    <option
                      value="${item.id}"
                      ${
                        supplier &&
                        Number(
                          supplier.id
                        ) ===
                        Number(item.id)
                          ? "selected"
                          : ""
                      }
                    >
                      ${escapeHtml(
                        item.name
                      )}
                    </option>
                  `
                ).join("")}

              </select>

            </div>

            <div class="form-group">

              <label>
                তারিখ *
              </label>

              <input
                type="date"
                name="payment_date"
                required
                value="${today()}"
              >

            </div>

            <div class="form-group">

              <label>
                পেমেন্ট অ্যাকাউন্ট *
              </label>

              <select
                name="account_id"
                required
                id="supplier-payment-account"
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                পরিমাণ *
              </label>

              <input
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
              >

            </div>

            <div class="form-group form-group-full">

              <label>
                নোট
              </label>

              <textarea
                name="note"
                rows="3"
              ></textarea>

            </div>

          </div>

          <div class="modal-footer">

            <button
              type="button"
              class="btn btn-secondary"
              data-modal-cancel
            >
              বাতিল
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              পেমেন্ট সংরক্ষণ
            </button>

          </div>

        </form>
      `
    );

  loadSupplierPaymentAccounts(
    modal
  );

  modal
    .querySelector(
      "[data-modal-cancel]"
    )
    ?.addEventListener(
      "click",
      closeModal
    );

  modal
    .querySelector(
      "#supplier-payment-form"
    )
    ?.addEventListener(
      "submit",
      submitSupplierPayment
    );
}

async function loadSupplierPaymentAccounts(
  modal
) {

  try {

    const data =
      await getJson(
        "/api/accounts"
      );

    const accounts =
      Array.isArray(data)
        ? data
        : data.accounts || [];

    const select =
      modal.querySelector(
        "#supplier-payment-account"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        — নির্বাচন করুন —
      </option>

      ${accounts
        .filter(
          account =>
            [
              1000,
              1010,
              1020,
              1030,
              1040,
              1050,
              1060,
              1070
            ].includes(
              Number(account.id)
            )
        )
        .map(
          account => `
            <option value="${account.id}">
              ${escapeHtml(
                account.name
              )}
            </option>
          `
        ).join("")}
    `;

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "অ্যাকাউন্ট লোড করা যায়নি।"
    );
  }
}

async function submitSupplierPayment(
  event
) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const formData =
    new FormData(form);

  const payload = {

    supplier_id:
      Number(
        formData.get(
          "supplier_id"
        )
      ),

    payment_date:
      formData.get(
        "payment_date"
      ) || today(),

    account_id:
      Number(
        formData.get(
          "account_id"
        )
      ),

    amount:
      Number(
        formData.get(
          "amount"
        ) || 0
      ),

    note:
      String(
        formData.get(
          "note"
        ) || ""
      ).trim()
  };

  if (
    !payload.supplier_id
  ) {

    showError(
      "সাপ্লায়ার নির্বাচন করুন।"
    );

    return;
  }

  if (
    !payload.account_id
  ) {

    showError(
      "পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন।"
    );

    return;
  }

  if (
    payload.amount <= 0
  ) {

    showError(
      "পেমেন্টের পরিমাণ ০-এর বেশি হতে হবে।"
    );

    return;
  }

  try {

    setLoading(true);

    await postJson(
      "/api/transactions/supplier-payment",
      payload
    );

    showSuccess(
      "সাপ্লায়ার পেমেন্ট সংরক্ষণ হয়েছে।"
    );

    closeModal();

    await loadSupplierDue();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "সাপ্লায়ার পেমেন্ট সংরক্ষণ করা যায়নি।"
    );

  } finally {

    setLoading(false);
  }
}

async function openSupplierLedger(
  supplier
) {

  const modal =
    openModal(
      `সাপ্লায়ার লেজার — ${supplier.name}`,

      loadingHtml(
        "লেজার লোড হচ্ছে..."
      ),

      {
        large: true
      }
    );

  try {

    const data =
      await getJson(
        `/api/ledgers/supplier/${supplier.id}`
      );

    const entries =
      Array.isArray(data)
        ? data
        : data.entries || [];

    const body =
      modal.querySelector(
        ".modal-body"
      );

    if (!body) return;

    body.innerHTML = `

      <div class="ledger-summary">

        <div class="mini-card">

          <div class="mini-card-title">
            বর্তমান পাওনা
          </div>

          <div class="mini-card-value">
            ৳ ${formatMoney(
              supplier.current_due || 0
            )}
          </div>

        </div>

      </div>

      ${
        entries.length
          ? `
            <div class="table-wrapper">

              <table class="data-table">

                <thead>

                  <tr>
                    <th>তারিখ</th>
                    <th>ধরন</th>
                    <th>রেফারেন্স</th>
                    <th>ডেবিট</th>
                    <th>ক্রেডিট</th>
                    <th>ব্যালেন্স</th>
                  </tr>

                </thead>

                <tbody>

                  ${entries.map(
                    entry => `
                      <tr>

                        <td>
                          ${escapeHtml(
                            entry.date ||
                            entry.transaction_date ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            entry.type ||
                            entry.transaction_type ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            entry.reference ||
                            ""
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            entry.debit ||
                            entry.debit_amount ||
                            0
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            entry.credit ||
                            entry.credit_amount ||
                            0
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            entry.balance ||
                            0
                          )}
                        </td>

                      </tr>
                    `
                  ).join("")}

                </tbody>

              </table>

            </div>
          `
          : emptyHtml(
              "এই সাপ্লায়ারের কোনো লেজার পাওয়া যায়নি।"
            )
      }
    `;

  } catch (error) {

    console.error(error);

    const body =
      modal.querySelector(
        ".modal-body"
      );

    if (body) {

      body.innerHTML =
        errorHtml(
          error.message ||
          "লেজার লোড করা যায়নি।"
        );
    }
  }
}

/* =========================================================
   EXPENSE
   ========================================================= */

async function renderExpense() {

  if (!app) return;

  app.innerHTML = `
    <section class="page expense-page">

      <div class="page-toolbar">

        <div>

          <h2>খরচ</h2>

          <p class="muted">
            দোকান ও পারিবারিক খরচ
          </p>

        </div>

        <div class="toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="new-expense-btn"
          >
            + নতুন খরচ
          </button>

        </div>

      </div>

      <div
        id="expense-content"
      >
        ${loadingHtml(
          "খরচের হিসাব লোড হচ্ছে..."
        )}
      </div>

    </section>
  `;

  document
    .getElementById(
      "new-expense-btn"
    )
    ?.addEventListener(
      "click",
      () =>
        openExpenseModal()
    );

  await loadExpenses();
}

async function loadExpenses() {

  const container =
    document.getElementById(
      "expense-content"
    );

  if (!container) return;

  container.innerHTML =
    loadingHtml(
      "খরচের হিসাব লোড হচ্ছে..."
    );

  try {

    const data =
      await getJson(
        "/api/expenses"
      );

    const expenses =
      Array.isArray(data)
        ? data
        : data.expenses || [];

    container.innerHTML = `
      <div class="table-wrapper">

        <table class="data-table">

          <thead>

            <tr>
              <th>তারিখ</th>
              <th>ধরন</th>
              <th>পরিমাণ</th>
              <th>অ্যাকাউন্ট</th>
              <th>নোট</th>
            </tr>

          </thead>

          <tbody>

            ${
              expenses.length
                ? expenses.map(
                    expense => `
                      <tr>

                        <td>
                          ${escapeHtml(
                            expense.expense_date ||
                            expense.date ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            expense.category ||
                            expense.expense_type ||
                            ""
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            expense.amount ||
                            0
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            expense.account_name ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            expense.note ||
                            ""
                          )}
                        </td>

                      </tr>
                    `
                  ).join("")
                : `
                    <tr>

                      <td
                        colspan="5"
                        class="text-center"
                      >
                        কোনো খরচ পাওয়া যায়নি।
                      </td>

                    </tr>
                  `
            }

          </tbody>

        </table>

      </div>
    `;

  } catch (error) {

    console.error(error);

    container.innerHTML =
      errorHtml(
        error.message ||
        "খরচ লোড করা যায়নি।"
      );
  }
}

async function openExpenseModal() {

  const modal =
    openModal(
      "নতুন খরচ",

      `
        <form id="expense-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                তারিখ *
              </label>

              <input
                type="date"
                name="expense_date"
                required
                value="${today()}"
              >

            </div>

            <div class="form-group">

              <label>
                খরচের ধরন *
              </label>

              <select
                name="expense_type"
                required
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

                <option value="SHOP_EXPENSE">
                  দোকানের খরচ
                </option>

                <option value="FAMILY_EXPENSE">
                  পারিবারিক খরচ
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                পরিমাণ *
              </label>

              <input
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
              >

            </div>

            <div class="form-group">

              <label>
                পেমেন্ট অ্যাকাউন্ট *
              </label>

              <select
                name="account_id"
                required
                id="expense-account"
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

              </select>

            </div>

            <div class="form-group form-group-full">

              <label>
                নোট
              </label>

              <textarea
                name="note"
                rows="3"
              ></textarea>

            </div>

          </div>

          <div class="modal-footer">

            <button
              type="button"
              class="btn btn-secondary"
              data-modal-cancel
            >
              বাতিল
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              খরচ সংরক্ষণ
            </button>

          </div>

        </form>
      `,
      {
        large: false
      }
    );

  await loadExpenseAccounts(
    modal
  );

  modal
    .querySelector(
      "[data-modal-cancel]"
    )
    ?.addEventListener(
      "click",
      closeModal
    );

  modal
    .querySelector(
      "#expense-form"
    )
    ?.addEventListener(
      "submit",
      submitExpense
    );
}

async function loadExpenseAccounts(
  modal
) {

  try {

    const data =
      await getJson(
        "/api/accounts"
      );

    const accounts =
      Array.isArray(data)
        ? data
        : data.accounts || [];

    const select =
      modal.querySelector(
        "#expense-account"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        — নির্বাচন করুন —
      </option>

      ${accounts
        .filter(
          account =>
            [
              1000,
              1010,
              1020,
              1030,
              1040,
              1050,
              1060,
              1070
            ].includes(
              Number(account.id)
            )
        )
        .map(
          account => `
            <option value="${account.id}">
              ${escapeHtml(
                account.name
              )}
            </option>
          `
        ).join("")}
    `;

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "অ্যাকাউন্ট লোড করা যায়নি।"
    );
  }
}

async function submitExpense(
  event
) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const formData =
    new FormData(form);

  const payload = {

    expense_date:
      formData.get(
        "expense_date"
      ) || today(),

    expense_type:
      String(
        formData.get(
          "expense_type"
        ) || ""
      ),

    amount:
      Number(
        formData.get(
          "amount"
        ) || 0
      ),

    account_id:
      Number(
        formData.get(
          "account_id"
        )
      ),

    note:
      String(
        formData.get(
          "note"
        ) || ""
      ).trim()
  };

  if (!payload.expense_type) {

    showError(
      "খরচের ধরন নির্বাচন করুন।"
    );

    return;
  }

  if (
    payload.amount <= 0
  ) {

    showError(
      "খরচের পরিমাণ ০-এর বেশি হতে হবে।"
    );

    return;
  }

  if (
    !payload.account_id
  ) {

    showError(
      "পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন।"
    );

    return;
  }

  try {

    setLoading(true);

    await postJson(
      "/api/transactions/expense",
      payload
    );

    showSuccess(
      "খরচ সফলভাবে সংরক্ষণ হয়েছে।"
    );

    closeModal();

    await loadExpenses();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "খরচ সংরক্ষণ করা যায়নি।"
    );

  } finally {

    setLoading(false);
  }
}

/* =========================================================
   OTHER INCOME
   ========================================================= */

async function renderOtherIncome() {

  if (!app) return;

  app.innerHTML = `
    <section class="page income-page">

      <div class="page-toolbar">

        <div>

          <h2>অন্যান্য আয়</h2>

          <p class="muted">
            বিক্রয় ছাড়া অন্যান্য আয়
          </p>

        </div>

        <div class="toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="new-income-btn"
          >
            + নতুন আয়
          </button>

        </div>

      </div>

      <div id="income-content">
        ${loadingHtml(
          "অন্যান্য আয় লোড হচ্ছে..."
        )}
      </div>

    </section>
  `;

  document
    .getElementById(
      "new-income-btn"
    )
    ?.addEventListener(
      "click",
      () =>
        openOtherIncomeModal()
    );

  await loadOtherIncome();
}

async function loadOtherIncome() {

  const container =
    document.getElementById(
      "income-content"
    );

  if (!container) return;

  container.innerHTML =
    loadingHtml(
      "অন্যান্য আয় লোড হচ্ছে..."
    );

  try {

    const data =
      await getJson(
        "/api/other-income"
      );

    const incomes =
      Array.isArray(data)
        ? data
        : data.incomes || [];

    container.innerHTML = `

      <div class="table-wrapper">

        <table class="data-table">

          <thead>

            <tr>
              <th>তারিখ</th>
              <th>পরিমাণ</th>
              <th>অ্যাকাউন্ট</th>
              <th>নোট</th>
            </tr>

          </thead>

          <tbody>

            ${
              incomes.length
                ? incomes.map(
                    income => `
                      <tr>

                        <td>
                          ${escapeHtml(
                            income.income_date ||
                            income.date ||
                            ""
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            income.amount ||
                            0
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            income.account_name ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            income.note ||
                            ""
                          )}
                        </td>

                      </tr>
                    `
                  ).join("")
                : `
                    <tr>

                      <td
                        colspan="4"
                        class="text-center"
                      >
                        কোনো অন্যান্য আয় পাওয়া যায়নি।
                      </td>

                    </tr>
                  `
            }

          </tbody>

        </table>

      </div>
    `;

  } catch (error) {

    console.error(error);

    container.innerHTML =
      errorHtml(
        error.message ||
        "অন্যান্য আয় লোড করা যায়নি।"
      );
  }
}

async function openOtherIncomeModal() {

  const modal =
    openModal(
      "নতুন অন্যান্য আয়",

      `
        <form id="other-income-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                তারিখ *
              </label>

              <input
                type="date"
                name="income_date"
                required
                value="${today()}"
              >

            </div>

            <div class="form-group">

              <label>
                পরিমাণ *
              </label>

              <input
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
              >

            </div>

            <div class="form-group">

              <label>
                জমা অ্যাকাউন্ট *
              </label>

              <select
                name="account_id"
                id="income-account"
                required
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

              </select>

            </div>

            <div class="form-group form-group-full">

              <label>
                নোট
              </label>

              <textarea
                name="note"
                rows="3"
              ></textarea>

            </div>

          </div>

          <div class="modal-footer">

            <button
              type="button"
              class="btn btn-secondary"
              data-modal-cancel
            >
              বাতিল
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              আয় সংরক্ষণ
            </button>

          </div>

        </form>
      `
    );

  await loadIncomeAccounts(
    modal
  );

  modal
    .querySelector(
      "[data-modal-cancel]"
    )
    ?.addEventListener(
      "click",
      closeModal
    );

  modal
    .querySelector(
      "#other-income-form"
    )
    ?.addEventListener(
      "submit",
      submitOtherIncome
    );
}

async function loadIncomeAccounts(
  modal
) {

  try {

    const data =
      await getJson(
        "/api/accounts"
      );

    const accounts =
      Array.isArray(data)
        ? data
        : data.accounts || [];

    const select =
      modal.querySelector(
        "#income-account"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        — নির্বাচন করুন —
      </option>

      ${accounts
        .filter(
          account =>
            [
              1000,
              1010,
              1020,
              1030,
              1040,
              1050,
              1060,
              1070
            ].includes(
              Number(account.id)
            )
        )
        .map(
          account => `
            <option value="${account.id}">
              ${escapeHtml(
                account.name
              )}
            </option>
          `
        ).join("")}
    `;

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "অ্যাকাউন্ট লোড করা যায়নি।"
    );
  }
}

async function submitOtherIncome(
  event
) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const formData =
    new FormData(form);

  const payload = {

    income_date:
      formData.get(
        "income_date"
      ) || today(),

    amount:
      Number(
        formData.get(
          "amount"
        ) || 0
      ),

    account_id:
      Number(
        formData.get(
          "account_id"
        )
      ),

    note:
      String(
        formData.get(
          "note"
        ) || ""
      ).trim()
  };

  if (
    payload.amount <= 0
  ) {

    showError(
      "আয়ের পরিমাণ ০-এর বেশি হতে হবে।"
    );

    return;
  }

  if (
    !payload.account_id
  ) {

    showError(
      "আয় জমার অ্যাকাউন্ট নির্বাচন করুন।"
    );

    return;
  }

  try {

    setLoading(true);

    await postJson(
      "/api/transactions/other-income",
      payload
    );

    showSuccess(
      "অন্যান্য আয় সংরক্ষণ হয়েছে।"
    );

    closeModal();

    await loadOtherIncome();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "অন্যান্য আয় সংরক্ষণ করা যায়নি।"
    );

  } finally {

    setLoading(false);
  }
}

/* =========================================================
   ACCOUNT TRANSFER
   ========================================================= */

async function renderAccountTransfer() {

  if (!app) return;

  app.innerHTML = `
    <section class="page transfer-page">

      <div class="page-toolbar">

        <div>

          <h2>অ্যাকাউন্ট ট্রান্সফার</h2>

          <p class="muted">
            এক অ্যাকাউন্ট থেকে অন্য অ্যাকাউন্টে টাকা স্থানান্তর
          </p>

        </div>

        <div class="toolbar-actions">

          <button
            type="button"
            class="btn btn-primary"
            id="new-transfer-btn"
          >
            + নতুন ট্রান্সফার
          </button>

        </div>

      </div>

      <div id="transfer-content">
        ${loadingHtml(
          "ট্রান্সফার লোড হচ্ছে..."
        )}
      </div>

    </section>
  `;

  document
    .getElementById(
      "new-transfer-btn"
    )
    ?.addEventListener(
      "click",
      () =>
        openAccountTransferModal()
    );

  await loadAccountTransfers();
}

async function loadAccountTransfers() {

  const container =
    document.getElementById(
      "transfer-content"
    );

  if (!container) return;

  container.innerHTML =
    loadingHtml(
      "ট্রান্সফার লোড হচ্ছে..."
    );

  try {

    const data =
      await getJson(
        "/api/account-transfers"
      );

    const transfers =
      Array.isArray(data)
        ? data
        : data.transfers || [];

    container.innerHTML = `

      <div class="table-wrapper">

        <table class="data-table">

          <thead>

            <tr>
              <th>তারিখ</th>
              <th>From</th>
              <th>To</th>
              <th>পরিমাণ</th>
              <th>নোট</th>
            </tr>

          </thead>

          <tbody>

            ${
              transfers.length
                ? transfers.map(
                    transfer => `
                      <tr>

                        <td>
                          ${escapeHtml(
                            transfer.transfer_date ||
                            transfer.date ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            transfer.from_account_name ||
                            ""
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            transfer.to_account_name ||
                            ""
                          )}
                        </td>

                        <td>
                          ৳ ${formatMoney(
                            transfer.amount ||
                            0
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            transfer.note ||
                            ""
                          )}
                        </td>

                      </tr>
                    `
                  ).join("")
                : `
                    <tr>

                      <td
                        colspan="5"
                        class="text-center"
                      >
                        কোনো ট্রান্সফার পাওয়া যায়নি।
                      </td>

                    </tr>
                  `
            }

          </tbody>

        </table>

      </div>
    `;

  } catch (error) {

    console.error(error);

    container.innerHTML =
      errorHtml(
        error.message ||
        "ট্রান্সফার লোড করা যায়নি।"
      );
  }
}

async function openAccountTransferModal() {

  const modal =
    openModal(
      "অ্যাকাউন্ট ট্রান্সফার",

      `
        <form id="account-transfer-form">

          <div class="form-grid">

            <div class="form-group">

              <label>
                তারিখ *
              </label>

              <input
                type="date"
                name="transfer_date"
                required
                value="${today()}"
              >

            </div>

            <div class="form-group">

              <label>
                From Account *
              </label>

              <select
                name="from_account_id"
                id="transfer-from"
                required
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                To Account *
              </label>

              <select
                name="to_account_id"
                id="transfer-to"
                required
              >

                <option value="">
                  — নির্বাচন করুন —
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                পরিমাণ *
              </label>

              <input
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
              >

            </div>

            <div class="form-group form-group-full">

              <label>
                নোট
              </label>

              <textarea
                name="note"
                rows="3"
              ></textarea>

            </div>

          </div>

          <div class="modal-footer">

            <button
              type="button"
              class="btn btn-secondary"
              data-modal-cancel
            >
              বাতিল
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              ট্রান্সফার সংরক্ষণ
            </button>

          </div>

        </form>
      `,
      {
        large: false
      }
    );

  await loadTransferAccounts(
    modal
  );

  modal
    .querySelector(
      "[data-modal-cancel]"
    )
    ?.addEventListener(
      "click",
      closeModal
    );

  modal
    .querySelector(
      "#account-transfer-form"
    )
    ?.addEventListener(
      "submit",
      submitAccountTransfer
    );
}

async function loadTransferAccounts(
  modal
) {

  try {

    const data =
      await getJson(
        "/api/accounts"
      );

    const accounts =
      Array.isArray(data)
        ? data
        : data.accounts || [];

    const options = `
      <option value="">
        — নির্বাচন করুন —
      </option>

      ${accounts.map(
        account => `
          <option value="${account.id}">
            ${escapeHtml(
              account.name
            )}
          </option>
        `
      ).join("")}
    `;

    const fromSelect =
      modal.querySelector(
        "#transfer-from"
      );

    const toSelect =
      modal.querySelector(
        "#transfer-to"
      );

    if (fromSelect) {
      fromSelect.innerHTML =
        options;
    }

    if (toSelect) {
      toSelect.innerHTML =
        options;
    }

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "অ্যাকাউন্ট লোড করা যায়নি।"
    );
  }
}

async function submitAccountTransfer(
  event
) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const formData =
    new FormData(form);

  const payload = {

    transfer_date:
      formData.get(
        "transfer_date"
      ) || today(),

    from_account_id:
      Number(
        formData.get(
          "from_account_id"
        )
      ),

    to_account_id:
      Number(
        formData.get(
          "to_account_id"
        )
      ),

    amount:
      Number(
        formData.get(
          "amount"
        ) || 0
      ),

    note:
      String(
        formData.get(
          "note"
        ) || ""
      ).trim()
  };

  if (
    !payload.from_account_id ||
    !payload.to_account_id
  ) {

    showError(
      "দুইটি অ্যাকাউন্ট নির্বাচন করুন।"
    );

    return;
  }

  if (
    payload.from_account_id ===
    payload.to_account_id
  ) {

    showError(
      "From ও To একই অ্যাকাউন্ট হতে পারবে না।"
    );

    return;
  }

  if (
    payload.amount <= 0
  ) {

    showError(
      "ট্রান্সফারের পরিমাণ ০-এর বেশি হতে হবে।"
    );

    return;
  }

  try {

    setLoading(true);

    await postJson(
      "/api/transactions/account-transfer",
      payload
    );

    showSuccess(
      "অ্যাকাউন্ট ট্রান্সফার সফল হয়েছে।"
    );

    closeModal();

    await loadAccountTransfers();

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "অ্যাকাউন্ট ট্রান্সফার করা যায়নি।"
    );

  } finally {

    setLoading(false);
  }
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeApp() {

  try {

    updatePageMeta(
      state.currentPage
    );

    await navigate(
      state.currentPage
    );

  } catch (error) {

    console.error(
      "Application initialization error:",
      error
    );

    if (app) {

      app.innerHTML =
        errorHtml(
          error.message ||
          "অ্যাপ চালু করতে সমস্যা হয়েছে।"
        );
    }
  }
}

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();
}
      <div class="empty-state">
        এখনো কোনো পণ্য যোগ করা হয়নি।
      </div>
    `;

    return;
  }


  container.innerHTML = `
    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            <th>#</th>
            <th>SKU</th>
            <th>পণ্য</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          ${saleItems.map((item, index) => `
            <tr>

              <td>${index + 1}</td>

              <td>
                ${escapeHtml(item.sku || "")}
              </td>

              <td>
                ${escapeHtml(item.product_name || "")}
              </td>

              <td>
                ${formatNumber(item.quantity)}
              </td>

              <td>
                ৳${formatMoney(item.unit_price)}
              </td>

              <td>
                ৳${formatMoney(item.total)}
              </td>

              <td>

                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  data-remove-sale-item="${index}"
                >
                  Remove
                </button>

              </td>

            </tr>
          `).join("")}

        </tbody>

      </table>

    </div>
  `;


  container
    .querySelectorAll(
      "[data-remove-sale-item]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index = Number(
            button.dataset.removeSaleItem
          );

          saleItems.splice(index, 1);

          renderSaleItems();
          updateSaleTotals();

        }
      );

    });
}


// ============================================================
// TOTALS
// ============================================================

function updateSaleTotals() {

  const grandTotal = saleItems.reduce(
    (sum, item) =>
      sum + Number(item.total || 0),
    0
  );


  const paid = Math.max(
    0,
    Number(
      document.getElementById(
        "salePaidInput"
      )?.value || 0
    )
  );


  const due = Math.max(
    0,
    grandTotal - paid
  );


  const totalElement =
    document.getElementById(
      "saleGrandTotal"
    );

  const paidElement =
    document.getElementById(
      "salePaidAmount"
    );

  const dueElement =
    document.getElementById(
      "saleDueAmount"
    );


  if (totalElement) {
    totalElement.textContent =
      `৳${formatMoney(grandTotal)}`;
  }


  if (paidElement) {
    paidElement.textContent =
      `৳${formatMoney(paid)}`;
  }


  if (dueElement) {
    dueElement.textContent =
      `৳${formatMoney(due)}`;
  }
}


// ============================================================
// SAVE SALE
// ============================================================

async function saveSale() {

  const button =
    document.getElementById(
      "saveSaleBtn"
    );

  if (!saleItems.length) {

    showSaleMessage(
      "কমপক্ষে একটি পণ্য যোগ করুন।",
      "error"
    );

    return;
  }


  const total = saleItems.reduce(
    (sum, item) =>
      sum + Number(item.total || 0),
    0
  );


  const paid = Number(
    document.getElementById(
      "salePaidInput"
    ).value || 0
  );


  const customerId = Number(
    document.getElementById(
      "saleCustomer"
    ).value || 0
  ) || null;


  const paymentAccountId = Number(
    document.getElementById(
      "salePaymentAccount"
    ).value || 0
  ) || null;


  const due = total - paid;


  if (paid < 0) {

    showSaleMessage(
      "Paid Amount সঠিক নয়।",
      "error"
    );

    return;
  }


  if (paid > total) {

    showSaleMessage(
      "Paid Amount মোট বিক্রয়ের চেয়ে বেশি হতে পারবে না।",
      "error"
    );

    return;
  }


  if (paid > 0 && !paymentAccountId) {

    showSaleMessage(
      "Paid Amount-এর জন্য Payment Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  if (due > 0 && !customerId) {

    showSaleMessage(
      "Due sale হলে Customer নির্বাচন করতে হবে।",
      "error"
    );

    return;
  }


  const payload = {

    sale_date:
      document.getElementById(
        "saleDate"
      ).value,

    customer_id:
      customerId,

    payment_account_id:
      paymentAccountId,

    reference:
      document.getElementById(
        "saleReference"
      ).value.trim(),

    paid_amount:
      paid,

    items:
      saleItems.map(item => ({
        product_id:
          Number(item.product_id),

        quantity:
          Number(item.quantity),

        unit_price:
          Number(item.unit_price)
      }))

  };


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response = await fetch(
      "/api/transactions/sale",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Idempotency-Key":
            crypto.randomUUID()
        },

        body:
          JSON.stringify(payload)
      }
    );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "বিক্রয় সংরক্ষণ ব্যর্থ হয়েছে।"
      );
    }


    showSaleMessage(
      `বিক্রয় সফলভাবে সংরক্ষণ হয়েছে। Invoice: ${result.transaction_id || result.id || ""}`,
      "success"
    );


    saleItems = [];

    document.getElementById(
      "salePaidInput"
    ).value = "0";

    document.getElementById(
      "saleCustomer"
    ).value = "";

    document.getElementById(
      "salePaymentAccount"
    ).value = "";

    document.getElementById(
      "saleReference"
    ).value = "";


    renderSaleItems();
    updateSaleTotals();


    // Refresh product stock
    await loadSaleData();


  } catch (error) {

    console.error(
      "Sale save error:",
      error
    );

    showSaleMessage(
      error.message ||
      "বিক্রয় সংরক্ষণ করা যায়নি।",
      "error"
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "বিক্রয় সংরক্ষণ";
  }
}


// ============================================================
// MESSAGE
// ============================================================

function showSaleMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "saleMessage"
    );

  if (!element) return;


  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}


function clearSaleMessage() {

  const element =
    document.getElementById(
      "saleMessage"
    );

  if (element) {
    element.innerHTML = "";
  }
}


// ============================================================
// FORMAT HELPERS
// ============================================================

function formatMoney(value) {

  return Number(
    value || 0
  ).toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}


function formatNumber(value) {

  return Number(
    value || 0
  ).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 3
    }
  );
}


// ============================================================
// CUSTOMER DUE MODULE
// ============================================================

let dueCustomers = [];
let dueAccounts = [];
let selectedDueCustomer = null;


// ============================================================
// RENDER CUSTOMER DUE
// ============================================================

async function renderCustomerDue() {

  app.innerHTML = `
    <section class="page-header">
      <div>
        <h1>কাস্টমারের বাকি</h1>
        <p>Customer Due, Collection ও Ledger</p>
      </div>
    </section>

    <section class="card">

      <div class="form-grid">

        <div class="form-group">
          <label>Customer Search</label>

          <input
            id="dueCustomerSearch"
            type="text"
            placeholder="নাম / ফোন দিয়ে খুঁজুন..."
          >
        </div>

      </div>

    </section>


    <section class="card">

      <div class="section-title">
        <h2>Customer Due List</h2>
      </div>

      <div id="dueCustomerList">
        <div class="empty-state">
          Loading...
        </div>
      </div>

    </section>


    <section
      id="customerDueDetails"
      class="card"
      style="display:none;"
    >

      <div class="section-title">
        <h2 id="selectedCustomerName">
          Customer
        </h2>
      </div>


      <div class="summary-grid">

        <div class="summary-card">
          <span>Total Due</span>
          <strong id="customerTotalDue">
            ৳0.00
          </strong>
        </div>

        <div class="summary-card">
          <span>Collection</span>
          <strong id="customerCollectionTotal">
            ৳0.00
          </strong>
        </div>

        <div class="summary-card">
          <span>Current Due</span>
          <strong id="customerCurrentDue">
            ৳0.00
          </strong>
        </div>

      </div>


      <hr>


      <div class="section-title">
        <h2>বাকি আদায়</h2>
      </div>


      <div class="form-grid">

        <div class="form-group">
          <label>Collection Amount</label>

          <input
            id="collectionAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >
        </div>


        <div class="form-group">

          <label>Payment Account</label>

          <select id="collectionAccount">
            <option value="">
              Account নির্বাচন
            </option>
          </select>

        </div>


        <div class="form-group">

          <label>Date</label>

          <input
            id="collectionDate"
            type="date"
            value="${todayDate()}"
          >

        </div>


        <div class="form-group">

          <label>Note</label>

          <input
            id="collectionNote"
            type="text"
            placeholder="নোট"
          >

        </div>

      </div>


      <div class="form-actions">

        <button
          id="saveCollectionBtn"
          class="btn btn-primary"
          type="button"
        >
          বাকি আদায় সংরক্ষণ
        </button>

      </div>


      <div id="collectionMessage"></div>


      <hr>


      <div class="section-title">
        <h2>Customer Ledger</h2>
      </div>


      <div id="customerLedger">

        <div class="empty-state">
          Ledger loading...
        </div>

      </div>

    </section>
  `;


  await loadDueData();

  await loadCollectionAccounts();

  bindCustomerDueEvents();

  renderDueCustomers();
}


// ============================================================
// LOAD DUE DATA
// ============================================================

async function loadDueData() {

  try {

    const response =
      await fetch(
        "/api/customers/due"
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Customer due load failed"
      );

    }


    dueCustomers =
      Array.isArray(result)
        ? result
        : (
          result.customers ||
          []
        );


  } catch (error) {

    console.error(
      "Due data error:",
      error
    );

    dueCustomers = [];

  }
}


// ============================================================
// LOAD COLLECTION ACCOUNTS
// ============================================================

async function loadCollectionAccounts() {

  const response =
    await fetch(
      "/api/accounts"
    );


  if (!response.ok) {

    throw new Error(
      "Accounts load failed"
    );

  }


  dueAccounts =
    await response.json();


  const select =
    document.getElementById(
      "collectionAccount"
    );


  if (!select) return;


  const allowed =
    dueAccounts.filter(
      account =>
        [
          1000,
          1010,
          1020,
          1030
        ].includes(
          Number(account.code)
        )
    );


  select.innerHTML = `
    <option value="">
      Account নির্বাচন
    </option>

    ${allowed.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;
}


// ============================================================
// CUSTOMER DUE EVENTS
// ============================================================

function bindCustomerDueEvents() {

  document
    .getElementById(
      "dueCustomerSearch"
    )
    ?.addEventListener(
      "input",
      renderDueCustomers
    );


  document
    .getElementById(
      "saveCollectionBtn"
    )
    ?.addEventListener(
      "click",
      saveCustomerCollection
    );
}


// ============================================================
// RENDER DUE CUSTOMERS
// ============================================================

function renderDueCustomers() {

  const container =
    document.getElementById(
      "dueCustomerList"
    );


  if (!container) return;


  const search =
    (
      document.getElementById(
        "dueCustomerSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const filtered =
    dueCustomers.filter(
      customer => {

        const name =
          String(
            customer.name || ""
          )
            .toLowerCase();


        const phone =
          String(
            customer.phone || ""
          )
            .toLowerCase();


        return (
          !search ||
          name.includes(search) ||
          phone.includes(search)
        );

      }
    );


  if (!filtered.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো customer পাওয়া যায়নি।
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Current Due</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          ${filtered.map((customer, index) => `

            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHtml(customer.name)}
              </td>

              <td>
                ${escapeHtml(
                  customer.phone || ""
                )}
              </td>

              <td>
                ৳${formatMoney(
                  customer.current_due
                )}
              </td>

              <td>

                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  data-due-customer="${customer.id}"
                >
                  View
                </button>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;


  container
    .querySelectorAll(
      "[data-due-customer]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const customerId =
            Number(
              button.dataset.dueCustomer
            );

          selectDueCustomer(
            customerId
          );

        }
      );

    });
}


// ============================================================
// SELECT CUSTOMER
// ============================================================

async function selectDueCustomer(
  customerId
) {

  selectedDueCustomer =
    dueCustomers.find(
      customer =>
        Number(customer.id) ===
        Number(customerId)
    );


  if (!selectedDueCustomer) {
    return;
  }


  const details =
    document.getElementById(
      "customerDueDetails"
    );


  if (details) {
    details.style.display =
      "block";
  }


  document.getElementById(
    "selectedCustomerName"
  ).textContent =
    selectedDueCustomer.name;


  document.getElementById(
    "customerCurrentDue"
  ).textContent =
    `৳${formatMoney(
      selectedDueCustomer.current_due
    )}`;


  await loadCustomerLedger(
    customerId
  );
}


// ============================================================
// CUSTOMER LEDGER
// ============================================================

async function loadCustomerLedger(
  customerId
) {

  const container =
    document.getElementById(
      "customerLedger"
    );


  if (!container) return;


  container.innerHTML = `
    <div class="empty-state">
      Ledger loading...
    </div>
  `;


  try {

    const response =
      await fetch(
        `/api/customers/${customerId}/ledger`
      );


    const result =
      await response.json();


    if (!response.ok) {
      throw new Error(
        result.error ||
        "Ledger load failed"
      );
    }


    renderCustomerLedger(
      result
    );


  } catch (error) {

    console.error(
      "Customer ledger error:",
      error
    );


    container.innerHTML = `
      <div class="alert error">
        ${escapeHtml(
          error.message
        )}
      </div>
    `;

  }
}


// ============================================================
// RENDER LEDGER
// ============================================================

function renderCustomerLedger(
  result
) {

  const container =
    document.getElementById(
      "customerLedger"
    );


  if (!container) return;


  const entries =
    result.entries || [];


  const totalDue =
    Number(
      result.total_due || 0
    );


  const totalCollection =
    Number(
      result.total_collection || 0
    );


  document.getElementById(
    "customerTotalDue"
  ).textContent =
    `৳${formatMoney(totalDue)}`;


  document.getElementById(
    "customerCollectionTotal"
  ).textContent =
    `৳${formatMoney(
      totalCollection
    )}`;


  document.getElementById(
    "customerCurrentDue"
  ).textContent =
    `৳${formatMoney(
      result.current_due || 0
    )}`;


  if (!entries.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো ledger পাওয়া যায়নি।
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>

        </thead>

        <tbody>

          ${entries.map(entry => `

            <tr>

              <td>
                ${escapeHtml(
                  entry.date || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  entry.type || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  entry.reference || ""
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.debit || 0
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.credit || 0
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.balance || 0
                )}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// SAVE CUSTOMER COLLECTION
// ============================================================

async function saveCustomerCollection() {

  if (!selectedDueCustomer) {

    showCollectionMessage(
      "প্রথমে Customer নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const amount =
    Number(
      document.getElementById(
        "collectionAmount"
      ).value || 0
    );


  const accountId =
    Number(
      document.getElementById(
        "collectionAccount"
      ).value || 0
    );


  const date =
    document.getElementById(
      "collectionDate"
    ).value;


  const note =
    document.getElementById(
      "collectionNote"
    ).value.trim();


  const currentDue =
    Number(
      selectedDueCustomer.current_due || 0
    );


  if (amount <= 0) {

    showCollectionMessage(
      "Collection Amount দিন।",
      "error"
    );

    return;
  }


  if (amount > currentDue) {

    showCollectionMessage(
      "Collection Amount বর্তমান বাকার চেয়ে বেশি হতে পারবে না।",
      "error"
    );

    return;
  }


  if (!accountId) {

    showCollectionMessage(
      "Payment Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveCollectionBtn"
    );


  const payload = {

    customer_id:
      Number(
        selectedDueCustomer.id
      ),

    amount,

    payment_account_id:
      accountId,

    collection_date:
      date,

    note

  };


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/customer-collection",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()

          },

          body:
            JSON.stringify(payload)

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Collection save failed"
      );

    }


    showCollectionMessage(
      "বাকি আদায় সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "collectionAmount"
    ).value = "";


    document.getElementById(
      "collectionNote"
    ).value = "";


    await loadDueData();


    selectedDueCustomer =
      dueCustomers.find(
        customer =>
          Number(customer.id) ===
          Number(
            selectedDueCustomer.id
          )
      );


    await selectDueCustomer(
      selectedDueCustomer.id
    );


    renderDueCustomers();


  } catch (error) {

    console.error(
      "Collection error:",
      error
    );


    showCollectionMessage(
      error.message ||
      "Collection সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "বাকি আদায় সংরক্ষণ";

  }
}


// ============================================================
// COLLECTION MESSAGE
// ============================================================

function showCollectionMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "collectionMessage"
    );


  if (!element) return;


  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}


// ============================================================
// SUPPLIER DUE MODULE
// ============================================================

let supplierDueList = [];
let supplierDueAccounts = [];
let selectedSupplierDue = null;


// ============================================================
// RENDER SUPPLIER DUE
// ============================================================

async function renderSupplierDue() {

  app.innerHTML = `
    <section class="page-header">
      <div>
        <h1>Supplier Due</h1>
        <p>Supplier Payable, Payment ও Ledger</p>
      </div>
    </section>

    <section class="card">

      <div class="form-grid">

        <div class="form-group">
          <label>Supplier Search</label>

          <input
            id="supplierDueSearch"
            type="text"
            placeholder="নাম / ফোন দিয়ে খুঁজুন..."
          >
        </div>

      </div>

    </section>


    <section class="card">

      <div class="section-title">
        <h2>Supplier Due List</h2>
      </div>

      <div id="supplierDueList">
        <div class="empty-state">
          Loading...
        </div>
      </div>

    </section>


    <section
      id="supplierDueDetails"
      class="card"
      style="display:none;"
    >

      <div class="section-title">
        <h2 id="selectedSupplierName">
          Supplier
        </h2>
      </div>


      <div class="summary-grid">

        <div class="summary-card">
          <span>Total Purchase Due</span>
          <strong id="supplierTotalDue">
            ৳0.00
          </strong>
        </div>

        <div class="summary-card">
          <span>Total Payment</span>
          <strong id="supplierPaymentTotal">
            ৳0.00
          </strong>
        </div>

        <div class="summary-card">
          <span>Current Payable</span>
          <strong id="supplierCurrentDue">
            ৳0.00
          </strong>
        </div>

      </div>


      <hr>


      <div class="section-title">
        <h2>Supplier Payment</h2>
      </div>


      <div class="form-grid">

        <div class="form-group">

          <label>Payment Amount</label>

          <input
            id="supplierPaymentAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >

        </div>


        <div class="form-group">

          <label>Payment Account</label>

          <select id="supplierPaymentAccount">

            <option value="">
              Account নির্বাচন
            </option>

          </select>

        </div>


        <div class="form-group">

          <label>Date</label>

          <input
            id="supplierPaymentDate"
            type="date"
            value="${todayDate()}"
          >

        </div>


        <div class="form-group">

          <label>Note</label>

          <input
            id="supplierPaymentNote"
            type="text"
            placeholder="নোট"
          >

        </div>

      </div>


      <div class="form-actions">

        <button
          id="saveSupplierPaymentBtn"
          class="btn btn-primary"
          type="button"
        >
          Supplier Payment সংরক্ষণ
        </button>

      </div>


      <div id="supplierPaymentMessage"></div>


      <hr>


      <div class="section-title">
        <h2>Supplier Ledger</h2>
      </div>


      <div id="supplierLedger">

        <div class="empty-state">
          Ledger loading...
        </div>

      </div>

    </section>
  `;


  await loadSupplierDueData();

  await loadSupplierPaymentAccounts();

  bindSupplierDueEvents();

  renderSupplierDueList();
}


// ============================================================
// LOAD SUPPLIER DUE DATA
// ============================================================

async function loadSupplierDueData() {

  try {

    const response =
      await fetch(
        "/api/suppliers/due"
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Supplier due load failed"
      );

    }


    supplierDueList =
      Array.isArray(result)
        ? result
        : (
          result.suppliers ||
          []
        );


  } catch (error) {

    console.error(
      "Supplier due data error:",
      error
    );

    supplierDueList = [];

  }
}


// ============================================================
// LOAD SUPPLIER PAYMENT ACCOUNTS
// ============================================================

async function loadSupplierPaymentAccounts() {

  const response =
    await fetch(
      "/api/accounts"
    );


  if (!response.ok) {

    throw new Error(
      "Accounts load failed"
    );

  }


  supplierDueAccounts =
    await response.json();


  const select =
    document.getElementById(
      "supplierPaymentAccount"
    );


  if (!select) return;


  const allowed =
    supplierDueAccounts.filter(
      account =>
        [
          1000,
          1010,
          1020,
          1030
        ].includes(
          Number(account.code)
        )
    );


  select.innerHTML = `
    <option value="">
      Account নির্বাচন
    </option>

    ${allowed.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;
}


// ============================================================
// SUPPLIER DUE EVENTS
// ============================================================

function bindSupplierDueEvents() {

  document
    .getElementById(
      "supplierDueSearch"
    )
    ?.addEventListener(
      "input",
      renderSupplierDueList
    );


  document
    .getElementById(
      "saveSupplierPaymentBtn"
    )
    ?.addEventListener(
      "click",
      saveSupplierPayment
    );
}


// ============================================================
// RENDER SUPPLIER DUE LIST
// ============================================================

function renderSupplierDueList() {

  const container =
    document.getElementById(
      "supplierDueList"
    );


  if (!container) return;


  const search =
    (
      document.getElementById(
        "supplierDueSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const filtered =
    supplierDueList.filter(
      supplier => {

        const name =
          String(
            supplier.name || ""
          )
            .toLowerCase();


        const phone =
          String(
            supplier.phone || ""
          )
            .toLowerCase();


        return (
          !search ||
          name.includes(search) ||
          phone.includes(search)
        );

      }
    );


  if (!filtered.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো supplier পাওয়া যায়নি।
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>#</th>
            <th>Supplier</th>
            <th>Phone</th>
            <th>Current Payable</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          ${filtered.map((supplier, index) => `

            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHtml(
                  supplier.name
                )}
              </td>

              <td>
                ${escapeHtml(
                  supplier.phone || ""
                )}
              </td>

              <td>
                ৳${formatMoney(
                  supplier.current_due
                )}
              </td>

              <td>

                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  data-supplier-due="${supplier.id}"
                >
                  View
                </button>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;


  container
    .querySelectorAll(
      "[data-supplier-due]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const supplierId =
            Number(
              button.dataset.supplierDue
            );

          selectSupplierDue(
            supplierId
          );

        }
      );

    });
}


// ============================================================
// SELECT SUPPLIER
// ============================================================

async function selectSupplierDue(
  supplierId
) {

  selectedSupplierDue =
    supplierDueList.find(
      supplier =>
        Number(supplier.id) ===
        Number(supplierId)
    );


  if (!selectedSupplierDue) {
    return;
  }


  const details =
    document.getElementById(
      "supplierDueDetails"
    );


  if (details) {

    details.style.display =
      "block";

  }


  document.getElementById(
    "selectedSupplierName"
  ).textContent =
    selectedSupplierDue.name;


  document.getElementById(
    "supplierCurrentDue"
  ).textContent =
    `৳${formatMoney(
      selectedSupplierDue.current_due
    )}`;


  await loadSupplierLedger(
    supplierId
  );
}


// ============================================================
// SUPPLIER LEDGER
// ============================================================

async function loadSupplierLedger(
  supplierId
) {

  const container =
    document.getElementById(
      "supplierLedger"
    );


  if (!container) return;


  container.innerHTML = `
    <div class="empty-state">
      Ledger loading...
    </div>
  `;


  try {

    const response =
      await fetch(
        `/api/suppliers/${supplierId}/ledger`
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Supplier ledger load failed"
      );

    }


    renderSupplierLedger(
      result
    );


  } catch (error) {

    console.error(
      "Supplier ledger error:",
      error
    );


    container.innerHTML = `
      <div class="alert error">
        ${escapeHtml(
          error.message
        )}
      </div>
    `;

  }
}


// ============================================================
// RENDER SUPPLIER LEDGER
// ============================================================

function renderSupplierLedger(
  result
) {

  const container =
    document.getElementById(
      "supplierLedger"
    );


  if (!container) return;


  const entries =
    result.entries || [];


  const totalDue =
    Number(
      result.total_due || 0
    );


  const totalPayment =
    Number(
      result.total_payment || 0
    );


  document.getElementById(
    "supplierTotalDue"
  ).textContent =
    `৳${formatMoney(
      totalDue
    )}`;


  document.getElementById(
    "supplierPaymentTotal"
  ).textContent =
    `৳${formatMoney(
      totalPayment
    )}`;


  document.getElementById(
    "supplierCurrentDue"
  ).textContent =
    `৳${formatMoney(
      result.current_due || 0
    )}`;


  if (!entries.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো ledger পাওয়া যায়নি।
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>

        </thead>

        <tbody>

          ${entries.map(entry => `

            <tr>

              <td>
                ${escapeHtml(
                  entry.date || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  entry.type || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  entry.reference || ""
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.debit || 0
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.credit || 0
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.balance || 0
                )}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// SAVE SUPPLIER PAYMENT
// ============================================================

async function saveSupplierPayment() {

  if (!selectedSupplierDue) {

    showSupplierPaymentMessage(
      "প্রথমে Supplier নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const amount =
    Number(
      document.getElementById(
        "supplierPaymentAmount"
      ).value || 0
    );


  const accountId =
    Number(
      document.getElementById(
        "supplierPaymentAccount"
      ).value || 0
    );


  const date =
    document.getElementById(
      "supplierPaymentDate"
    ).value;


  const note =
    document.getElementById(
      "supplierPaymentNote"
    ).value.trim();


  const currentDue =
    Number(
      selectedSupplierDue.current_due || 0
    );


  if (amount <= 0) {

    showSupplierPaymentMessage(
      "Payment Amount দিন।",
      "error"
    );

    return;
  }


  if (amount > currentDue) {

    showSupplierPaymentMessage(
      "Payment Amount বর্তমান payable-এর চেয়ে বেশি হতে পারবে না।",
      "error"
    );

    return;
  }


  if (!accountId) {

    showSupplierPaymentMessage(
      "Payment Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveSupplierPaymentBtn"
    );


  const payload = {

    supplier_id:
      Number(
        selectedSupplierDue.id
      ),

    amount,

    payment_account_id:
      accountId,

    payment_date:
      date,

    note

  };


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/supplier-payment",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()

          },

          body:
            JSON.stringify(payload)

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Supplier payment save failed"
      );

    }


    showSupplierPaymentMessage(
      "Supplier payment সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "supplierPaymentAmount"
    ).value = "";


    document.getElementById(
      "supplierPaymentNote"
    ).value = "";


    await loadSupplierDueData();


    selectedSupplierDue =
      supplierDueList.find(
        supplier =>
          Number(supplier.id) ===
          Number(
            selectedSupplierDue.id
          )
      );


    await selectSupplierDue(
      selectedSupplierDue.id
    );


    renderSupplierDueList();


  } catch (error) {

    console.error(
      "Supplier payment error:",
      error
    );


    showSupplierPaymentMessage(
      error.message ||
      "Supplier payment সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "Supplier Payment সংরক্ষণ";

  }
}


// ============================================================
// MESSAGE
// ============================================================

function showSupplierPaymentMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "supplierPaymentMessage"
    );


  if (!element) return;


  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}


// ============================================================
// EXPENSE MODULE
// ============================================================

let expenseAccounts = [];

async function renderExpense() {

  app.innerHTML = `
    <section class="page-header">
      <div>
        <h1>খরচ</h1>
        <p>Shop Expense / Family Expense</p>
      </div>
    </section>

    <section class="card">

      <div class="form-grid">

        <div class="form-group">
          <label>খরচের ধরন</label>

          <select id="expenseType">
            <option value="SHOP">দোকানের খরচ</option>
            <option value="FAMILY">পারিবারিক খরচ</option>
          </select>
        </div>

        <div class="form-group">
          <label>Amount</label>

          <input
            id="expenseAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label>Payment Account</label>

          <select id="expenseAccount">
            <option value="">
              Account নির্বাচন
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Date</label>

          <input
            id="expenseDate"
            type="date"
            value="${todayDate()}"
          >
        </div>

        <div class="form-group">
          <label>Category</label>

          <input
            id="expenseCategory"
            type="text"
            placeholder="যেমন: বিদ্যুৎ / ভাড়া / খাবার"
          >
        </div>

        <div class="form-group">
          <label>Note</label>

          <input
            id="expenseNote"
            type="text"
            placeholder="নোট"
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          id="saveExpenseBtn"
          class="btn btn-primary"
          type="button"
        >
          খরচ সংরক্ষণ
        </button>

      </div>

      <div id="expenseMessage"></div>

    </section>
  `;

  await loadExpenseAccounts();

  bindExpenseEvents();
}


async function loadExpenseAccounts() {

  const response =
    await fetch("/api/accounts");

  if (!response.ok) {
    throw new Error(
      "Accounts load failed"
    );
  }

  expenseAccounts =
    await response.json();

  populateExpenseAccounts();
}


function populateExpenseAccounts() {

  const select =
    document.getElementById(
      "expenseAccount"
    );

  if (!select) return;

  const accounts =
    expenseAccounts.filter(
      account =>
        [
          1000,
          1010,
          1020,
          1030
        ].includes(
          Number(account.code)
        )
    );

  select.innerHTML = `
    <option value="">
      Account নির্বাচন
    </option>

    ${accounts.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;
}


function bindExpenseEvents() {

  document
    .getElementById("saveExpenseBtn")
    ?.addEventListener(
      "click",
      saveExpense
    );
}


async function saveExpense() {

  const type =
    document.getElementById(
      "expenseType"
    ).value;

  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value || 0
    );

  const accountId =
    Number(
      document.getElementById(
        "expenseAccount"
      ).value || 0
    );

  const date =
    document.getElementById(
      "expenseDate"
    ).value;

  const category =
    document.getElementById(
      "expenseCategory"
    ).value.trim();

  const note =
    document.getElementById(
      "expenseNote"
    ).value.trim();


  if (amount <= 0) {

    showExpenseMessage(
      "সঠিক Amount দিন।",
      "error"
    );

    return;
  }


  if (!accountId) {

    showExpenseMessage(
      "Payment Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveExpenseBtn"
    );


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/expense",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()
          },

          body: JSON.stringify({
            expense_type: type,
            amount,
            payment_account_id:
              accountId,
            expense_date: date,
            category,
            note
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Expense save failed"
      );

    }


    showExpenseMessage(
      "খরচ সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "expenseAmount"
    ).value = "";

    document.getElementById(
      "expenseCategory"
    ).value = "";

    document.getElementById(
      "expenseNote"
    ).value = "";


  } catch (error) {

    console.error(
      "Expense error:",
      error
    );


    showExpenseMessage(
      error.message ||
      "খরচ সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "খরচ সংরক্ষণ";
  }
}


function showExpenseMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "expenseMessage"
    );

  if (!element) return;

  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}


// ============================================================
// OTHER INCOME MODULE
// ============================================================

let incomeAccounts = [];

async function renderOtherIncome() {

  app.innerHTML = `
    <section class="page-header">
      <div>
        <h1>অন্যান্য আয়</h1>
        <p>Business Other Income</p>
      </div>
    </section>

    <section class="card">

      <div class="form-grid">

        <div class="form-group">
          <label>Amount</label>

          <input
            id="incomeAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label>Receive Account</label>

          <select id="incomeAccount">
            <option value="">
              Account নির্বাচন
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Date</label>

          <input
            id="incomeDate"
            type="date"
            value="${todayDate()}"
          >
        </div>

        <div class="form-group">
          <label>Category</label>

          <input
            id="incomeCategory"
            type="text"
            placeholder="যেমন: কমিশন"
          >
        </div>

        <div class="form-group">
          <label>Note</label>

          <input
            id="incomeNote"
            type="text"
            placeholder="নোট"
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          id="saveIncomeBtn"
          class="btn btn-primary"
          type="button"
        >
          আয় সংরক্ষণ
        </button>

      </div>

      <div id="incomeMessage"></div>

    </section>
  `;


  await loadIncomeAccounts();

  bindIncomeEvents();
}


async function loadIncomeAccounts() {

  const response =
    await fetch("/api/accounts");

  if (!response.ok) {
    throw new Error(
      "Accounts load failed"
    );
  }

  incomeAccounts =
    await response.json();

  populateIncomeAccounts();
}


function populateIncomeAccounts() {

  const select =
    document.getElementById(
      "incomeAccount"
    );

  if (!select) return;


  const accounts =
    incomeAccounts.filter(
      account =>
        [
          1000,
          1010,
          1020,
          1030
        ].includes(
          Number(account.code)
        )
    );


  select.innerHTML = `
    <option value="">
      Account নির্বাচন
    </option>

    ${accounts.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;
}


function bindIncomeEvents() {

  document
    .getElementById(
      "saveIncomeBtn"
    )
    ?.addEventListener(
      "click",
      saveOtherIncome
    );
}


async function saveOtherIncome() {

  const amount =
    Number(
      document.getElementById(
        "incomeAmount"
      ).value || 0
    );


  const accountId =
    Number(
      document.getElementById(
        "incomeAccount"
      ).value || 0
    );


  const date =
    document.getElementById(
      "incomeDate"
    ).value;


  const category =
    document.getElementById(
      "incomeCategory"
    ).value.trim();


  const note =
    document.getElementById(
      "incomeNote"
    ).value.trim();


  if (amount <= 0) {

    showIncomeMessage(
      "সঠিক Amount দিন।",
      "error"
    );

    return;
  }


  if (!accountId) {

    showIncomeMessage(
      "Receive Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveIncomeBtn"
    );


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/other-income",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()
          },

          body: JSON.stringify({
            amount,
            receive_account_id:
              accountId,
            income_date:
              date,
            category,
            note
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Other income save failed"
      );

    }


    showIncomeMessage(
      "অন্যান্য আয় সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "incomeAmount"
    ).value = "";

    document.getElementById(
      "incomeCategory"
    ).value = "";

    document.getElementById(
      "incomeNote"
    ).value = "";


  } catch (error) {

    console.error(
      "Income error:",
      error
    );


    showIncomeMessage(
      error.message ||
      "অন্যান্য আয় সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "আয় সংরক্ষণ";
  }
}


function showIncomeMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "incomeMessage"
    );


  if (!element) return;


  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}


// ============================================================
// ACCOUNT TRANSFER MODULE
// ============================================================

let transferAccounts = [];

async function renderAccountTransfer() {

  app.innerHTML = `
    <section class="page-header">

      <div>

        <h1>Account Transfer</h1>

        <p>
          Cash / bKash / Nagad / Rocket / Recharge
          account transfer
        </p>

      </div>

    </section>


    <section class="card">

      <div class="form-grid">

        <div class="form-group">

          <label>From Account</label>

          <select id="transferFromAccount">

            <option value="">
              Account নির্বাচন
            </option>

          </select>

        </div>


        <div class="form-group">

          <label>To Account</label>

          <select id="transferToAccount">

            <option value="">
              Account নির্বাচন
            </option>

          </select>

        </div>


        <div class="form-group">

          <label>Amount</label>

          <input
            id="transferAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >

        </div>


        <div class="form-group">

          <label>Date</label>

          <input
            id="transferDate"
            type="date"
            value="${todayDate()}"
          >

        </div>


        <div class="form-group">

          <label>Reference</label>

          <input
            id="transferReference"
            type="text"
            placeholder="Reference"
          >

        </div>


        <div class="form-group">

          <label>Note</label>

          <input
            id="transferNote"
            type="text"
            placeholder="নোট"
          >

        </div>

      </div>


      <div class="form-actions">

        <button
          id="saveTransferBtn"
          class="btn btn-primary"
          type="button"
        >
          Transfer সংরক্ষণ
        </button>

      </div>


      <div id="transferMessage"></div>

    </section>
  `;


  await loadTransferAccounts();

  bindTransferEvents();
}


// ============================================================
// LOAD TRANSFER ACCOUNTS
// ============================================================

async function loadTransferAccounts() {

  const response =
    await fetch(
      "/api/accounts"
    );


  if (!response.ok) {

    throw new Error(
      "Accounts load failed"
    );

  }


  transferAccounts =
    await response.json();


  populateTransferAccounts();
}


// ============================================================
// POPULATE TRANSFER ACCOUNTS
// ============================================================

function populateTransferAccounts() {

  const fromSelect =
    document.getElementById(
      "transferFromAccount"
    );


  const toSelect =
    document.getElementById(
      "transferToAccount"
    );


  if (!fromSelect || !toSelect) {
    return;
  }


  const accounts =
    transferAccounts.filter(
      account =>
        [
          1000,
          1010,
          1020,
          1030,
          1040,
          1050,
          1060,
          1070
        ].includes(
          Number(account.code)
        )
    );


  const options = accounts
    .map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `)
    .join("");


  fromSelect.innerHTML = `
    <option value="">
      From Account নির্বাচন
    </option>

    ${options}
  `;


  toSelect.innerHTML = `
    <option value="">
      To Account নির্বাচন
    </option>

    ${options}
  `;
}


// ============================================================
// TRANSFER EVENTS
// ============================================================

function bindTransferEvents() {

  document
    .getElementById(
      "saveTransferBtn"
    )
    ?.addEventListener(
      "click",
      saveAccountTransfer
    );
}


// ============================================================
// SAVE ACCOUNT TRANSFER
// ============================================================

async function saveAccountTransfer() {

  const fromAccountId =
    Number(
      document.getElementById(
        "transferFromAccount"
      ).value || 0
    );


  const toAccountId =
    Number(
      document.getElementById(
        "transferToAccount"
      ).value || 0
    );


  const amount =
    Number(
      document.getElementById(
        "transferAmount"
      ).value || 0
    );


  const date =
    document.getElementById(
      "transferDate"
    ).value;


  const reference =
    document.getElementById(
      "transferReference"
    ).value.trim();


  const note =
    document.getElementById(
      "transferNote"
    ).value.trim();


  if (!fromAccountId) {

    showTransferMessage(
      "From Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  if (!toAccountId) {

    showTransferMessage(
      "To Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  if (
    fromAccountId ===
    toAccountId
  ) {

    showTransferMessage(
      "From এবং To Account একই হতে পারবে না।",
      "error"
    );

    return;
  }


  if (amount <= 0) {

    showTransferMessage(
      "সঠিক Amount দিন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveTransferBtn"
    );


  try {

    button.disabled = true;

    button.textContent =
      "Transfer হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/account-transfer",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()

          },

          body:
            JSON.stringify({

              from_account_id:
                fromAccountId,

              to_account_id:
                toAccountId,

              amount,

              transfer_date:
                date,

              reference,

              note

            })

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Account transfer save failed"
      );

    }


    showTransferMessage(
      "Account transfer সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "transferAmount"
    ).value = "";


    document.getElementById(
      "transferReference"
    ).value = "";


    document.getElementById(
      "transferNote"
    ).value = "";


  } catch (error) {

    console.error(
      "Transfer error:",
      error
    );


    showTransferMessage(
      error.message ||
      "Account transfer সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "Transfer সংরক্ষণ";

  }
}


// ============================================================
// TRANSFER MESSAGE
// ============================================================

function showTransferMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "transferMessage"
    );


  if (!element) return;


  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}


// ============================================================
// ACCOUNTS MODULE
// ============================================================

let accountList = [];


async function renderAccounts() {

  app.innerHTML = `

    <section class="page-header">

      <div>

        <h1>Accounts</h1>

        <p>
          Cash, Mobile Banking এবং অন্যান্য হিসাব
        </p>

      </div>

    </section>


    <section class="card">

      <div class="section-title">

        <h2>Account Balances</h2>

      </div>


      <div id="accountList">

        <div class="empty-state">
          Loading...
        </div>

      </div>

    </section>

  `;


  await loadAccounts();

  renderAccountList();
}


// ============================================================
// LOAD ACCOUNTS
// ============================================================

async function loadAccounts() {

  try {

    const response =
      await fetch(
        "/api/accounts"
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Accounts load failed"
      );

    }


    accountList =
      Array.isArray(result)
        ? result
        : (
          result.accounts ||
          []
        );


  } catch (error) {

    console.error(
      "Accounts error:",
      error
    );


    accountList = [];

  }
}


// ============================================================
// RENDER ACCOUNT LIST
// ============================================================

function renderAccountList() {

  const container =
    document.getElementById(
      "accountList"
    );


  if (!container) return;


  if (!accountList.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো account পাওয়া যায়নি।
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>Code</th>

            <th>Account</th>

            <th>Type</th>

            <th>Balance</th>

          </tr>

        </thead>


        <tbody>

          ${accountList.map(account => `

            <tr>

              <td>
                ${escapeHtml(
                  String(
                    account.code || ""
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  account.name || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  account.account_type ||
                  account.type ||
                  ""
                )}
              </td>

              <td>
                ৳${formatMoney(
                  account.current_balance ||
                  account.balance ||
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


// ============================================================
// END OF PART
// ============================================================
          Loading...
        </div>
      </div>

    </section>


    <section
      id="supplierDueDetails"
      class="card"
      style="display:none;"
    >

      <div class="section-title">
        <h2 id="selectedSupplierName">
          Supplier
        </h2>
      </div>


      <div class="summary-grid">

        <div class="summary-card">
          <span>Total Purchase Due</span>

          <strong id="supplierTotalDue">
            ৳0.00
          </strong>
        </div>


        <div class="summary-card">
          <span>Total Payment</span>

          <strong id="supplierPaymentTotal">
            ৳0.00
          </strong>
        </div>


        <div class="summary-card">
          <span>Current Due</span>

          <strong id="supplierCurrentDue">
            ৳0.00
          </strong>
        </div>

      </div>


      <hr>


      <div class="section-title">
        <h2>Supplier Payment</h2>
      </div>


      <div class="form-grid">

        <div class="form-group">

          <label>Payment Amount</label>

          <input
            id="supplierPaymentAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >

        </div>


        <div class="form-group">

          <label>Payment Account</label>

          <select id="supplierPaymentAccount">
            <option value="">
              Account নির্বাচন
            </option>
          </select>

        </div>


        <div class="form-group">

          <label>Date</label>

          <input
            id="supplierPaymentDate"
            type="date"
            value="${todayDate()}"
          >

        </div>


        <div class="form-group">

          <label>Note</label>

          <input
            id="supplierPaymentNote"
            type="text"
            placeholder="Payment note"
          >

        </div>

      </div>


      <div class="form-actions">

        <button
          id="saveSupplierPaymentBtn"
          class="btn btn-primary"
          type="button"
        >
          Supplier Payment সংরক্ষণ
        </button>

      </div>


      <div id="supplierPaymentMessage"></div>


      <hr>


      <div class="section-title">
        <h2>Supplier Ledger</h2>
      </div>


      <div id="supplierLedger">

        <div class="empty-state">
          Supplier নির্বাচন করুন।
        </div>

      </div>

    </section>
  `;


  await loadSupplierDueData();

  bindSupplierDueEvents();

  renderSupplierDueList();
}


// ============================================================
// LOAD DATA
// ============================================================

async function loadSupplierDueData() {

  const [
    suppliersResponse,
    accountsResponse
  ] = await Promise.all([

    fetch("/api/suppliers"),

    fetch("/api/accounts")

  ]);


  if (!suppliersResponse.ok) {

    throw new Error(
      "Supplier data load failed"
    );

  }


  if (!accountsResponse.ok) {

    throw new Error(
      "Account data load failed"
    );

  }


  supplierDueList =
    await suppliersResponse.json();


  supplierDueAccounts =
    await accountsResponse.json();


  populateSupplierPaymentAccounts();
}


// ============================================================
// PAYMENT ACCOUNTS
// ============================================================

function populateSupplierPaymentAccounts() {

  const select =
    document.getElementById(
      "supplierPaymentAccount"
    );


  if (!select) return;


  const accounts =
    supplierDueAccounts.filter(
      account => {

        return [
          1000,
          1010,
          1020,
          1030
        ].includes(
          Number(account.code)
        );

      }
    );


  select.innerHTML = `
    <option value="">
      Account নির্বাচন
    </option>

    ${accounts.map(account => `

      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>

    `).join("")}
  `;
}


// ============================================================
// EVENTS
// ============================================================

function bindSupplierDueEvents() {

  const search =
    document.getElementById(
      "supplierDueSearch"
    );


  search?.addEventListener(
    "input",
    renderSupplierDueList
  );


  const button =
    document.getElementById(
      "saveSupplierPaymentBtn"
    );


  button?.addEventListener(
    "click",
    saveSupplierPayment
  );
}


// ============================================================
// SUPPLIER DUE LIST
// ============================================================

function renderSupplierDueList() {

  const container =
    document.getElementById(
      "supplierDueList"
    );


  if (!container) return;


  const searchValue =
    (
      document.getElementById(
        "supplierDueSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const filtered =
    supplierDueList.filter(
      supplier => {

        const name =
          String(
            supplier.name || ""
          ).toLowerCase();


        const phone =
          String(
            supplier.phone || ""
          ).toLowerCase();


        const due =
          Number(
            supplier.current_due || 0
          );


        return (
          (
            name.includes(searchValue) ||
            phone.includes(searchValue)
          ) &&
          due > 0
        );

      }
    );


  if (!filtered.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো Supplier Due পাওয়া যায়নি।
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>#</th>
            <th>Supplier</th>
            <th>Phone</th>
            <th>Current Due</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          ${filtered.map(
            (supplier, index) => `

            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHtml(
                  supplier.name
                )}
              </td>

              <td>
                ${escapeHtml(
                  supplier.phone || ""
                )}
              </td>

              <td>
                ৳${formatMoney(
                  supplier.current_due
                )}
              </td>

              <td>

                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  data-supplier-due="${supplier.id}"
                >
                  View
                </button>

              </td>

            </tr>

          `
          ).join("")}

        </tbody>

      </table>

    </div>
  `;


  container
    .querySelectorAll(
      "[data-supplier-due]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const supplierId =
            Number(
              button.dataset.supplierDue
            );


          selectSupplierDue(
            supplierId
          );

        }
      );

    });
}


// ============================================================
// SELECT SUPPLIER
// ============================================================

async function selectSupplierDue(
  supplierId
) {

  selectedSupplierDue =
    supplierDueList.find(
      supplier =>
        Number(supplier.id) ===
        Number(supplierId)
    );


  if (!selectedSupplierDue) {
    return;
  }


  const details =
    document.getElementById(
      "supplierDueDetails"
    );


  if (details) {

    details.style.display =
      "block";

  }


  document.getElementById(
    "selectedSupplierName"
  ).textContent =
    selectedSupplierDue.name;


  document.getElementById(
    "supplierCurrentDue"
  ).textContent =
    `৳${formatMoney(
      selectedSupplierDue.current_due
    )}`;


  await loadSupplierLedger(
    supplierId
  );
}


// ============================================================
// SUPPLIER LEDGER
// ============================================================

async function loadSupplierLedger(
  supplierId
) {

  const container =
    document.getElementById(
      "supplierLedger"
    );


  if (!container) return;


  container.innerHTML = `
    <div class="empty-state">
      Ledger loading...
    </div>
  `;


  try {

    const response =
      await fetch(
        `/api/suppliers/${supplierId}/ledger`
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Supplier ledger load failed"
      );

    }


    renderSupplierLedger(
      result
    );


  } catch (error) {

    console.error(
      "Supplier ledger error:",
      error
    );


    container.innerHTML = `
      <div class="alert error">
        ${escapeHtml(
          error.message
        )}
      </div>
    `;

  }
}


// ============================================================
// RENDER SUPPLIER LEDGER
// ============================================================

function renderSupplierLedger(
  result
) {

  const container =
    document.getElementById(
      "supplierLedger"
    );


  if (!container) return;


  const entries =
    result.entries || [];


  const totalDue =
    Number(
      result.total_due || 0
    );


  const totalPayment =
    Number(
      result.total_payment || 0
    );


  document.getElementById(
    "supplierTotalDue"
  ).textContent =
    `৳${formatMoney(totalDue)}`;


  document.getElementById(
    "supplierPaymentTotal"
  ).textContent =
    `৳${formatMoney(
      totalPayment
    )}`;


  document.getElementById(
    "supplierCurrentDue"
  ).textContent =
    `৳${formatMoney(
      result.current_due || 0
    )}`;


  if (!entries.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো Supplier ledger পাওয়া যায়নি।
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Credit</th>
            <th>Debit</th>
            <th>Balance</th>
          </tr>

        </thead>

        <tbody>

          ${entries.map(
            entry => `

            <tr>

              <td>
                ${escapeHtml(
                  entry.date || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  entry.type || ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  entry.reference || ""
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.credit || 0
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.debit || 0
                )}
              </td>

              <td>
                ৳${formatMoney(
                  entry.balance || 0
                )}
              </td>

            </tr>

          `
          ).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// SAVE SUPPLIER PAYMENT
// ============================================================

async function saveSupplierPayment() {

  if (!selectedSupplierDue) {

    showSupplierPaymentMessage(
      "প্রথমে Supplier নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const amount =
    Number(
      document.getElementById(
        "supplierPaymentAmount"
      ).value || 0
    );


  const accountId =
    Number(
      document.getElementById(
        "supplierPaymentAccount"
      ).value || 0
    );


  const date =
    document.getElementById(
      "supplierPaymentDate"
    ).value;


  const note =
    document.getElementById(
      "supplierPaymentNote"
    ).value.trim();


  const currentDue =
    Number(
      selectedSupplierDue.current_due || 0
    );


  if (amount <= 0) {

    showSupplierPaymentMessage(
      "Payment Amount দিন।",
      "error"
    );

    return;
  }


  if (amount > currentDue) {

    showSupplierPaymentMessage(
      "Payment Amount বর্তমান Supplier Due-এর চেয়ে বেশি হতে পারবে না।",
      "error"
    );

    return;
  }


  if (!accountId) {

    showSupplierPaymentMessage(
      "Payment Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveSupplierPaymentBtn"
    );


  const payload = {

    supplier_id:
      Number(
        selectedSupplierDue.id
      ),

    amount,

    payment_account_id:
      accountId,

    payment_date:
      date,

    note

  };


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/supplier-payment",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()

          },

          body:
            JSON.stringify(payload)

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Supplier payment save failed"
      );

    }


    showSupplierPaymentMessage(
      "Supplier Payment সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "supplierPaymentAmount"
    ).value = "";


    document.getElementById(
      "supplierPaymentNote"
    ).value = "";


    await loadSupplierDueData();


    selectedSupplierDue =
      supplierDueList.find(
        supplier =>
          Number(supplier.id) ===
          Number(
            selectedSupplierDue.id
          )
      );


    await selectSupplierDue(
      selectedSupplierDue.id
    );


    renderSupplierDueList();


  } catch (error) {

    console.error(
      "Supplier payment error:",
      error
    );


    showSupplierPaymentMessage(
      error.message ||
      "Supplier payment সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "Supplier Payment সংরক্ষণ";

  }
}


// ============================================================
// MESSAGE
// ============================================================

function showSupplierPaymentMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "supplierPaymentMessage"
    );


  if (!element) return;


  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}
// ============================================================
// EXPENSE MODULE
// ============================================================

let expenseAccounts = [];

async function renderExpense() {

  app.innerHTML = `
    <section class="page-header">
      <div>
        <h1>খরচ</h1>
        <p>Shop Expense / Family Expense</p>
      </div>
    </section>

    <section class="card">

      <div class="form-grid">

        <div class="form-group">
          <label>খরচের ধরন</label>

          <select id="expenseType">
            <option value="SHOP">দোকানের খরচ</option>
            <option value="FAMILY">পারিবারিক খরচ</option>
          </select>
        </div>

        <div class="form-group">
          <label>Amount</label>

          <input
            id="expenseAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label>Payment Account</label>

          <select id="expenseAccount">
            <option value="">
              Account নির্বাচন
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Date</label>

          <input
            id="expenseDate"
            type="date"
            value="${todayDate()}"
          >
        </div>

        <div class="form-group">
          <label>Category</label>

          <input
            id="expenseCategory"
            type="text"
            placeholder="যেমন: বিদ্যুৎ / ভাড়া / খাবার"
          >
        </div>

        <div class="form-group">
          <label>Note</label>

          <input
            id="expenseNote"
            type="text"
            placeholder="নোট"
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          id="saveExpenseBtn"
          class="btn btn-primary"
          type="button"
        >
          খরচ সংরক্ষণ
        </button>

      </div>

      <div id="expenseMessage"></div>

    </section>
  `;

  await loadExpenseAccounts();

  bindExpenseEvents();
}


async function loadExpenseAccounts() {

  const response =
    await fetch("/api/accounts");

  if (!response.ok) {
    throw new Error(
      "Accounts load failed"
    );
  }

  expenseAccounts =
    await response.json();

  populateExpenseAccounts();
}


function populateExpenseAccounts() {

  const select =
    document.getElementById(
      "expenseAccount"
    );

  if (!select) return;

  const accounts =
    expenseAccounts.filter(
      account =>
        [
          1000,
          1010,
          1020,
          1030
        ].includes(
          Number(account.code)
        )
    );

  select.innerHTML = `
    <option value="">
      Account নির্বাচন
    </option>

    ${accounts.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;
}


function bindExpenseEvents() {

  document
    .getElementById("saveExpenseBtn")
    ?.addEventListener(
      "click",
      saveExpense
    );
}


async function saveExpense() {

  const type =
    document.getElementById(
      "expenseType"
    ).value;

  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value || 0
    );

  const accountId =
    Number(
      document.getElementById(
        "expenseAccount"
      ).value || 0
    );

  const date =
    document.getElementById(
      "expenseDate"
    ).value;

  const category =
    document.getElementById(
      "expenseCategory"
    ).value.trim();

  const note =
    document.getElementById(
      "expenseNote"
    ).value.trim();


  if (amount <= 0) {

    showExpenseMessage(
      "সঠিক Amount দিন।",
      "error"
    );

    return;
  }


  if (!accountId) {

    showExpenseMessage(
      "Payment Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveExpenseBtn"
    );


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/expense",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()
          },

          body: JSON.stringify({
            expense_type: type,
            amount,
            payment_account_id:
              accountId,
            expense_date: date,
            category,
            note
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Expense save failed"
      );

    }


    showExpenseMessage(
      "খরচ সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "expenseAmount"
    ).value = "";

    document.getElementById(
      "expenseCategory"
    ).value = "";

    document.getElementById(
      "expenseNote"
    ).value = "";


  } catch (error) {

    console.error(
      "Expense error:",
      error
    );


    showExpenseMessage(
      error.message ||
      "খরচ সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "খরচ সংরক্ষণ";
  }
}


function showExpenseMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "expenseMessage"
    );

  if (!element) return;

  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}
          <label>Amount</label>

          <input
            id="expenseAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label>Payment Account</label>

          <select id="expenseAccount">
            <option value="">
              Account নির্বাচন
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Date</label>

          <input
            id="expenseDate"
            type="date"
            value="${todayDate()}"
          >
        </div>

        <div class="form-group">
          <label>Category</label>

          <input
            id="expenseCategory"
            type="text"
            placeholder="যেমন: বিদ্যুৎ / ভাড়া / খাবার"
          >
        </div>

        <div class="form-group">
          <label>Note</label>

          <input
            id="expenseNote"
            type="text"
            placeholder="নোট"
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          id="saveExpenseBtn"
          class="btn btn-primary"
          type="button"
        >
          খরচ সংরক্ষণ
        </button>

      </div>

      <div id="expenseMessage"></div>

    </section>
  `;

  await loadExpenseAccounts();

  bindExpenseEvents();
}


async function loadExpenseAccounts() {

  const response =
    await fetch("/api/accounts");

  if (!response.ok) {
    throw new Error(
      "Accounts load failed"
    );
  }

  expenseAccounts =
    await response.json();

  populateExpenseAccounts();
}


function populateExpenseAccounts() {

  const select =
    document.getElementById(
      "expenseAccount"
    );

  if (!select) return;

  const accounts =
    expenseAccounts.filter(
      account =>
        [
          1000,
          1010,
          1020,
          1030
        ].includes(
          Number(account.code)
        )
    );

  select.innerHTML = `
    <option value="">
      Account নির্বাচন
    </option>

    ${accounts.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;
}


function bindExpenseEvents() {

  document
    .getElementById("saveExpenseBtn")
    ?.addEventListener(
      "click",
      saveExpense
    );
}


async function saveExpense() {

  const type =
    document.getElementById(
      "expenseType"
    ).value;

  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value || 0
    );

  const accountId =
    Number(
      document.getElementById(
        "expenseAccount"
      ).value || 0
    );

  const date =
    document.getElementById(
      "expenseDate"
    ).value;

  const category =
    document.getElementById(
      "expenseCategory"
    ).value.trim();

  const note =
    document.getElementById(
      "expenseNote"
    ).value.trim();


  if (amount <= 0) {

    showExpenseMessage(
      "সঠিক Amount দিন।",
      "error"
    );

    return;
  }


  if (!accountId) {

    showExpenseMessage(
      "Payment Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveExpenseBtn"
    );


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/expense",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()
          },

          body: JSON.stringify({
            expense_type: type,
            amount,
            payment_account_id:
              accountId,
            expense_date: date,
            category,
            note
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Expense save failed"
      );

    }


    showExpenseMessage(
      "খরচ সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "expenseAmount"
    ).value = "";

    document.getElementById(
      "expenseCategory"
    ).value = "";

    document.getElementById(
      "expenseNote"
    ).value = "";


  } catch (error) {

    console.error(
      "Expense error:",
      error
    );


    showExpenseMessage(
      error.message ||
      "খরচ সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "খরচ সংরক্ষণ";
  }
}


function showExpenseMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "expenseMessage"
    );

  if (!element) return;

  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}
// ============================================================
// OTHER INCOME MODULE
// ============================================================

let incomeAccounts = [];

async function renderOtherIncome() {

  app.innerHTML = `
    <section class="page-header">
      <div>
        <h1>অন্যান্য আয়</h1>
        <p>Business Other Income</p>
      </div>
    </section>

    <section class="card">

      <div class="form-grid">

        <div class="form-group">
          <label>Amount</label>

          <input
            id="incomeAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label>Receive Account</label>

          <select id="incomeAccount">
            <option value="">
              Account নির্বাচন
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Date</label>

          <input
            id="incomeDate"
            type="date"
            value="${todayDate()}"
          >
        </div>

        <div class="form-group">
          <label>Category</label>

          <input
            id="incomeCategory"
            type="text"
            placeholder="যেমন: কমিশন"
          >
        </div>

        <div class="form-group">
          <label>Note</label>

          <input
            id="incomeNote"
            type="text"
            placeholder="নোট"
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          id="saveIncomeBtn"
          class="btn btn-primary"
          type="button"
        >
          আয় সংরক্ষণ
        </button>

      </div>

      <div id="incomeMessage"></div>

    </section>
  `;


  await loadIncomeAccounts();

  bindIncomeEvents();
}


async function loadIncomeAccounts() {

  const response =
    await fetch("/api/accounts");

  if (!response.ok) {
    throw new Error(
      "Accounts load failed"
    );
  }

  incomeAccounts =
    await response.json();

  populateIncomeAccounts();
}


function populateIncomeAccounts() {

  const select =
    document.getElementById(
      "incomeAccount"
    );

  if (!select) return;


  const accounts =
    incomeAccounts.filter(
      account =>
        [
          1000,
          1010,
          1020,
          1030
        ].includes(
          Number(account.code)
        )
    );


  select.innerHTML = `
    <option value="">
      Account নির্বাচন
    </option>

    ${accounts.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;
}


function bindIncomeEvents() {

  document
    .getElementById(
      "saveIncomeBtn"
    )
    ?.addEventListener(
      "click",
      saveOtherIncome
    );
}


async function saveOtherIncome() {

  const amount =
    Number(
      document.getElementById(
        "incomeAmount"
      ).value || 0
    );


  const accountId =
    Number(
      document.getElementById(
        "incomeAccount"
      ).value || 0
    );


  const date =
    document.getElementById(
      "incomeDate"
    ).value;


  const category =
    document.getElementById(
      "incomeCategory"
    ).value.trim();


  const note =
    document.getElementById(
      "incomeNote"
    ).value.trim();


  if (amount <= 0) {

    showIncomeMessage(
      "সঠিক Amount দিন।",
      "error"
    );

    return;
  }


  if (!accountId) {

    showIncomeMessage(
      "Receive Account নির্বাচন করুন।",
      "error"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveIncomeBtn"
    );


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await fetch(
        "/api/transactions/other-income",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()
          },

          body: JSON.stringify({
            amount,
            account_id:
              accountId,
            income_date:
              date,
            category,
            note
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Income save failed"
      );

    }


    showIncomeMessage(
      "অন্যান্য আয় সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "incomeAmount"
    ).value = "";

    document.getElementById(
      "incomeCategory"
    ).value = "";

    document.getElementById(
      "incomeNote"
    ).value = "";


  } catch (error) {

    console.error(
      "Income error:",
      error
    );


    showIncomeMessage(
      error.message ||
      "আয় সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "আয় সংরক্ষণ";
  }
}


function showIncomeMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "incomeMessage"
    );

  if (!element) return;


  element.innerHTML = `
    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>
  `;
}
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

    showLoading("অ্যাকাউন্ট লোড হচ্ছে...");

    const accounts =
      await loadAccounts();


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <h3>
            Account List
          </h3>

        </div>

        <div class="card-body">

          <div class="toolbar">

            <input
              id="accountSearch"
              class="form-control search-box"
              type="search"
              placeholder="অ্যাকাউন্ট খুঁজুন..."
            >

            <span class="badge badge-info">
              মোট ${number(accounts.length)}
            </span>

          </div>


          <div
            id="accountTable"
            class="table-wrapper"
          >

            ${accountTableHtml(accounts)}

          </div>

        </div>

      </div>

    `;


    $("#accountSearch")
      .addEventListener(
        "input",
        event => {

          const query =
            event.target.value
              .trim()
              .toLowerCase();


          const filtered =
            accounts.filter(account => {

              return [

                account.name,
                account.code,
                account.account_type

              ]
                .join(" ")
                .toLowerCase()
                .includes(query);

            });


          $("#accountTable").innerHTML =
            accountTableHtml(filtered);

        }
      );


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
          💳
        </div>

        <strong>
          কোনো অ্যাকাউন্ট নেই
        </strong>

      </div>

    `;

  }


  return `

    <table class="data-table">

      <thead>

        <tr>

          <th>
            Code
          </th>

          <th>
            Account
          </th>

          <th>
            Type
          </th>

          <th class="text-right">
            Balance
          </th>

        </tr>

      </thead>

      <tbody>

        ${accounts.map(account => `

          <tr>

            <td>
              ${escapeHtml(
                String(account.code || "")
              )}
            </td>

            <td>
              <strong>
                ${escapeHtml(
                  account.name || ""
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(
                account.account_type || "-"
              )}
            </td>

            <td class="text-right">

              ৳${money(
                account.current_balance ||
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
   STOCK VERIFICATION
   ========================================================= */

async function renderStockVerification() {

  try {

    showLoading(
      "Stock verification data লোড হচ্ছে..."
    );


    const products =
      await loadProducts();


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <div>

            <h3>
              স্টক ভেলু যাচাই
            </h3>

            <p class="muted">
              System Stock বনাম Physical Stock
            </p>

          </div>

        </div>


        <div class="card-body">

          <div class="toolbar">

            <input
              id="stockVerificationSearch"
              class="form-control search-box"
              type="search"
              placeholder="পণ্য খুঁজুন..."
            >

            <button
              id="saveStockVerificationBtn"
              class="btn btn-primary"
              type="button"
            >
              যাচাই সংরক্ষণ
            </button>

          </div>


          <div
            id="stockVerificationTable"
            class="table-wrapper"
          >

            ${stockVerificationTableHtml(products)}

          </div>


          <div
            id="stockVerificationSummary"
            class="summary-grid"
          >

            <div class="summary-card">

              <span>
                System Stock Value
              </span>

              <strong id="verificationSystemValue">
                ৳0.00
              </strong>

            </div>


            <div class="summary-card">

              <span>
                Physical Stock Value
              </span>

              <strong id="verificationPhysicalValue">
                ৳0.00
              </strong>

            </div>


            <div class="summary-card">

              <span>
                Difference
              </span>

              <strong id="verificationDifference">
                ৳0.00
              </strong>

            </div>

          </div>


          <div id="stockVerificationMessage"></div>

        </div>

      </div>

    `;


    bindStockVerificationEvents(
      products
    );

    updateStockVerificationSummary();


  } catch (error) {

    renderError(error);

  } finally {

    hideLoading();

  }

}


function stockVerificationTableHtml(
  products
) {

  if (!products.length) {

    return `

      <div class="empty-state">

        <div class="icon">
          📦
        </div>

        <strong>
          কোনো পণ্য নেই
        </strong>

      </div>

    `;

  }


  return `

    <table
      class="data-table stock-verification-table"
    >

      <thead>

        <tr>

          <th>
            পণ্য
          </th>

          <th>
            System Qty
          </th>

          <th>
            Purchase Price
          </th>

          <th>
            System Value
          </th>

          <th>
            Physical Qty
          </th>

          <th>
            Physical Value
          </th>

          <th>
            Difference
          </th>

        </tr>

      </thead>


      <tbody>

        ${products.map(product => {

          const stock =
            Number(
              product.current_stock || 0
            );


          const price =
            Number(
              product.last_purchase_cost ??
              product.purchase_price ??
              0
            );


          const value =
            stock * price;


          return `

            <tr
              data-product-id="${product.id}"
              data-system-value="${value}"
            >

              <td>

                <strong>
                  ${escapeHtml(
                    product.name || ""
                  )}
                </strong>

                <div class="muted small">
                  ${escapeHtml(
                    product.sku || ""
                  )}
                </div>

              </td>


              <td>
                ${number(stock)}
              </td>


              <td>
                ৳${money(price)}
              </td>


              <td class="system-value">
                ৳${money(value)}
              </td>


              <td>

                <input
                  class="form-control physical-qty"
                  type="number"
                  min="0"
                  step="0.001"
                  value=""
                  placeholder="Qty"
                  data-product-id="${product.id}"
                >

              </td>


              <td class="physical-value">
                ৳0.00
              </td>


              <td class="verification-difference">
                ৳0.00
              </td>

            </tr>

          `;

        }).join("")}

      </tbody>

    </table>

  `;

}


function bindStockVerificationEvents(
  products
) {

  const search =
    document.getElementById(
      "stockVerificationSearch"
    );


  search?.addEventListener(
    "input",
    () => {

      const query =
        search.value
          .trim()
          .toLowerCase();


      const filtered =
        products.filter(product => {

          return [

            product.name,
            product.sku

          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        });


      const table =
        document.getElementById(
          "stockVerificationTable"
        );


      if (table) {

        table.innerHTML =
          stockVerificationTableHtml(
            filtered
          );

      }


      bindStockVerificationInputs();

      updateStockVerificationSummary();

    }
  );


  bindStockVerificationInputs();


  document
    .getElementById(
      "saveStockVerificationBtn"
    )
    ?.addEventListener(
      "click",
      saveStockVerification
    );

}


function bindStockVerificationInputs() {

  document
    .querySelectorAll(
      ".physical-qty"
    )
    .forEach(input => {

      input.addEventListener(
        "input",
        updateStockVerificationSummary
      );

    });

}


function updateStockVerificationSummary() {

  let systemValue = 0;

  let physicalValue = 0;


  document
    .querySelectorAll(
      ".stock-verification-table tbody tr"
    )
    .forEach(row => {

      const system =
        Number(
          row.dataset.systemValue || 0
        );


      const input =
        row.querySelector(
          ".physical-qty"
        );


      const physicalQty =
        Number(
          input?.value || 0
        );


      const price =
        systemValue === undefined
          ? 0
          : Number(
              row
                .querySelector(
                  "td:nth-child(3)"
                )
                ?.textContent
                ?.replace(/[৳,]/g, "")
                || 0
            );


      const physical =
        physicalQty * price;


      const difference =
        physical - system;


      systemValue += system;


      physicalValue += physical;


      const physicalCell =
        row.querySelector(
          ".physical-value"
        );


      const differenceCell =
        row.querySelector(
          ".verification-difference"
        );


      if (physicalCell) {

        physicalCell.textContent =
          `৳${money(physical)}`;

      }


      if (differenceCell) {

        differenceCell.textContent =
          `৳${money(difference)}`;

      }

    });


  const difference =
    physicalValue -
    systemValue;


  const systemElement =
    document.getElementById(
      "verificationSystemValue"
    );


  const physicalElement =
    document.getElementById(
      "verificationPhysicalValue"
    );


  const differenceElement =
    document.getElementById(
      "verificationDifference"
    );


  if (systemElement) {

    systemElement.textContent =
      `৳${money(systemValue)}`;

  }


  if (physicalElement) {

    physicalElement.textContent =
      `৳${money(physicalValue)}`;

  }


  if (differenceElement) {

    differenceElement.textContent =
      `৳${money(difference)}`;

  }

}


async function saveStockVerification() {

  const rows =
    Array.from(
      document.querySelectorAll(
        ".stock-verification-table tbody tr"
      )
    );


  const items = [];


  rows.forEach(row => {

    const input =
      row.querySelector(
        ".physical-qty"
      );


    if (!input) return;


    if (
      input.value === "" ||
      input.value === null
    ) {
      return;
    }


    const physicalQty =
      Number(input.value);


    if (
      !Number.isFinite(
        physicalQty
      ) ||
      physicalQty < 0
    ) {

      return;

    }


    items.push({

      product_id:
        Number(
          row.dataset.productId
        ),

      physical_qty:
        physicalQty

    });

  });


  if (!items.length) {

    showStockVerificationMessage(
      "কমপক্ষে একটি পণ্যের Physical Qty দিন।",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "saveStockVerificationBtn"
    );


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await apiFetch(
        "/api/stock-verifications",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()

          },

          body: JSON.stringify({

            verification_date:
              todayDate(),

            items

          })

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Stock verification save failed"
      );

    }


    showStockVerificationMessage(
      "Stock Verification সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


  } catch (error) {

    console.error(
      "Stock verification error:",
      error
    );


    showStockVerificationMessage(
      error.message ||
      "Stock Verification সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "যাচাই সংরক্ষণ";

  }

}


function showStockVerificationMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "stockVerificationMessage"
    );


  if (!element) return;


  element.innerHTML = `

    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>

  `;

}


/* =========================================================
   STOCK ADJUSTMENT
   ========================================================= */

async function renderStockAdjustment() {

  try {

    const products =
      await loadProducts();


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <h3>
            Stock Adjustment
          </h3>

        </div>


        <div class="card-body">

          <div class="form-grid">

            <div class="form-group">

              <label>
                Product
              </label>

              <select id="adjustmentProduct">

                <option value="">
                  পণ্য নির্বাচন
                </option>

                ${products.map(product => `

                  <option
                    value="${product.id}"
                  >
                    ${escapeHtml(
                      product.name
                    )}
                    —
                    ${number(
                      product.current_stock
                    )}
                  </option>

                `).join("")}

              </select>

            </div>


            <div class="form-group">

              <label>
                Adjustment Type
              </label>

              <select id="adjustmentType">

                <option value="IN">
                  Stock Increase
                </option>

                <option value="OUT">
                  Stock Decrease
                </option>

              </select>

            </div>


            <div class="form-group">

              <label>
                Quantity
              </label>

              <input
                id="adjustmentQuantity"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="0"
              >

            </div>


            <div class="form-group">

              <label>
                Reason
              </label>

              <input
                id="adjustmentReason"
                type="text"
                placeholder="যেমন: নষ্ট / ভাঙা / অতিরিক্ত পাওয়া"
              >

            </div>


            <div class="form-group">

              <label>
                Date
              </label>

              <input
                id="adjustmentDate"
                type="date"
                value="${todayDate()}"
              >

            </div>

          </div>


          <div class="form-actions">

            <button
              id="saveStockAdjustmentBtn"
              class="btn btn-primary"
              type="button"
            >
              Adjustment সংরক্ষণ
            </button>

          </div>


          <div id="stockAdjustmentMessage"></div>

        </div>

      </div>

    `;


    document
      .getElementById(
        "saveStockAdjustmentBtn"
      )
      ?.addEventListener(
        "click",
        saveStockAdjustment
      );


  } catch (error) {

    renderError(error);

  }

}


async function saveStockAdjustment() {

  const productId =
    Number(
      document.getElementById(
        "adjustmentProduct"
      ).value || 0
    );


  const type =
    document.getElementById(
      "adjustmentType"
    ).value;


  const quantity =
    Number(
      document.getElementById(
        "adjustmentQuantity"
      ).value || 0
    );


  const reason =
    document.getElementById(
      "adjustmentReason"
    ).value.trim();


  const date =
    document.getElementById(
      "adjustmentDate"
    ).value;


  if (!productId) {

    showStockAdjustmentMessage(
      "Product নির্বাচন করুন।",
      "error"
    );

    return;

  }


  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {

    showStockAdjustmentMessage(
      "সঠিক Quantity দিন।",
      "error"
    );

    return;

  }


  if (!reason) {

    showStockAdjustmentMessage(
      "Adjustment-এর কারণ লিখুন।",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "saveStockAdjustmentBtn"
    );


  try {

    button.disabled = true;

    button.textContent =
      "সংরক্ষণ হচ্ছে...";


    const response =
      await apiFetch(
        "/api/transactions/stock-adjustment",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()

          },

          body: JSON.stringify({

            product_id:
              productId,

            adjustment_type:
              type,

            quantity,

            reason,

            adjustment_date:
              date

          })

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Stock adjustment failed"
      );

    }


    showStockAdjustmentMessage(
      "Stock Adjustment সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "adjustmentQuantity"
    ).value = "";


    document.getElementById(
      "adjustmentReason"
    ).value = "";


  } catch (error) {

    console.error(
      "Stock adjustment error:",
      error
    );


    showStockAdjustmentMessage(
      error.message ||
      "Stock Adjustment সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "Adjustment সংরক্ষণ";

  }

}


function showStockAdjustmentMessage(
  message,
  type = "error"
) {

  const element =
    document.getElementById(
      "stockAdjustmentMessage"
    );


  if (!element) return;


  element.innerHTML = `

    <div class="alert ${type}">
      ${escapeHtml(message)}
    </div>

  `;

}
      <div class="form-group">

        <label>
          ${escapeHtml(
            setting.label ||
            setting.key ||
            ""
          )}
        </label>

        <input
          type="text"
          class="setting-input"
          data-setting-key="${escapeHtml(
            setting.key
          )}"
          value="${escapeHtml(
            setting.value ?? ""
          )}"
        >

      </div>

    `).join("");


  const actions = document.createElement(
    "div"
  );

  actions.className =
    "form-actions";


  actions.innerHTML = `

    <button
      type="button"
      id="saveSettingsBtn"
      class="btn btn-primary"
    >
      Settings Save
    </button>

  `;


  container.appendChild(actions);


  document
    .getElementById(
      "saveSettingsBtn"
    )
    ?.addEventListener(
      "click",
      saveSettings
    );

}


async function saveSettings() {

  const inputs = [
    ...document.querySelectorAll(
      ".setting-input"
    )
  ];


  const settings = inputs.map(
    input => ({

      key:
        input.dataset.settingKey,

      value:
        input.value

    })
  );


  try {

    const button =
      document.getElementById(
        "saveSettingsBtn"
      );


    if (button) {

      button.disabled = true;

      button.textContent =
        "Saving...";

    }


    const response =
      await apiFetch(
        "/api/settings",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()

          },

          body:
            JSON.stringify({
              settings
            })

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Settings save failed"
      );

    }


    alert(
      "Settings সফলভাবে সংরক্ষণ হয়েছে।"
    );


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Settings সংরক্ষণ করা যায়নি।"
    );


  } finally {

    const button =
      document.getElementById(
        "saveSettingsBtn"
      );


    if (button) {

      button.disabled = false;

      button.textContent =
        "Settings Save";

    }

  }

}


// ============================================================
// STEP 13 — AUDIT LOG
// ============================================================

async function renderAuditLog() {

  app.innerHTML = `

    <section class="page-header">

      <div>

        <h2>
          📋 Audit Log
        </h2>

        <p>
          System-এর গুরুত্বপূর্ণ পরিবর্তনের ইতিহাস
        </p>

      </div>

    </section>


    <div class="card">

      <div class="toolbar">

        <button
          id="refreshAuditBtn"
          class="btn btn-primary"
          type="button"
        >
          Refresh
        </button>

      </div>


      <div
        id="auditLogContainer"
        class="table-wrap"
      >

        Loading...

      </div>

    </div>

  `;


  document
    .getElementById(
      "refreshAuditBtn"
    )
    ?.addEventListener(
      "click",
      loadAuditLogs
    );


  await loadAuditLogs();

}


async function loadAuditLogs() {

  const container =
    document.getElementById(
      "auditLogContainer"
    );


  if (!container) return;


  container.innerHTML = `
    <div class="empty-state">
      Audit Log loading...
    </div>
  `;


  try {

    const response =
      await apiFetch(
        "/api/audit-logs"
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Audit log load failed"
      );

    }


    const logs =
      Array.isArray(data)
        ? data
        : data.logs || [];


    if (!logs.length) {

      container.innerHTML = `
        <div class="empty-state">
          কোনো Audit Log পাওয়া যায়নি।
        </div>
      `;

      return;
    }


    container.innerHTML = `

      <table>

        <thead>

          <tr>

            <th>
              Date
            </th>

            <th>
              Action
            </th>

            <th>
              Entity
            </th>

            <th>
              Entity ID
            </th>

            <th>
              Details
            </th>

          </tr>

        </thead>


        <tbody>

          ${logs.map(log => `

            <tr>

              <td>
                ${escapeHtml(
                  log.created_at ||
                  log.date ||
                  ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  log.action ||
                  log.event_type ||
                  ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  log.entity_type ||
                  ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  String(
                    log.entity_id ??
                    ""
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  log.details ||
                  log.metadata ||
                  ""
                )}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;


  } catch (error) {

    console.error(error);


    container.innerHTML = `

      <div class="error-state">

        ${escapeHtml(
          error.message ||
          "Audit log load failed"
        )}

      </div>

    `;

  }

}


// ============================================================
// STEP 13 — BACKUP & RESTORE
// ============================================================

async function renderBackup() {

  app.innerHTML = `

    <section class="page-header">

      <div>

        <h2>
          💾 Backup & Restore
        </h2>

        <p>
          ব্যবসার ডাটার backup তৈরি ও restore
        </p>

      </div>

    </section>


    <div class="card">

      <h3>
        Create Backup
      </h3>

      <p class="muted">
        বর্তমান database-এর backup JSON file হিসেবে তৈরি হবে।
      </p>


      <div class="form-actions">

        <button
          id="createBackupBtn"
          class="btn btn-primary"
          type="button"
        >
          Backup তৈরি করুন
        </button>

      </div>


      <div id="backupMessage"></div>

    </div>


    <div class="card">

      <h3>
        Restore Backup
      </h3>

      <p class="muted">
        ⚠️ Restore করার আগে বর্তমান data-এর backup রাখুন।
      </p>


      <input
        type="file"
        id="restoreFile"
        accept=".json,application/json"
      >


      <div class="form-actions">

        <button
          id="restoreBackupBtn"
          class="btn btn-danger"
          type="button"
        >
          Backup Restore
        </button>

      </div>


      <div id="restoreMessage"></div>

    </div>

  `;


  document
    .getElementById(
      "createBackupBtn"
    )
    ?.addEventListener(
      "click",
      createBackup
    );


  document
    .getElementById(
      "restoreBackupBtn"
    )
    ?.addEventListener(
      "click",
      restoreBackup
    );

}


async function createBackup() {

  const button =
    document.getElementById(
      "createBackupBtn"
    );


  const message =
    document.getElementById(
      "backupMessage"
    );


  try {

    button.disabled = true;

    button.textContent =
      "Backup তৈরি হচ্ছে...";


    const response =
      await apiFetch(
        "/api/system/backup"
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Backup failed"
      );

    }


    const blob =
      new Blob(
        [
          JSON.stringify(
            data,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    const timestamp =
      new Date()
        .toISOString()
        .replace(
          /[:.]/g,
          "-"
        );


    link.href = url;

    link.download =
      `chamak-store-backup-${timestamp}.json`;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      url
    );


    message.innerHTML = `

      <div class="alert success">

        Backup সফলভাবে তৈরি হয়েছে।

      </div>

    `;


  } catch (error) {

    console.error(error);


    message.innerHTML = `

      <div class="alert error">

        ${escapeHtml(
          error.message
        )}

      </div>

    `;


  } finally {

    button.disabled = false;

    button.textContent =
      "Backup তৈরি করুন";

  }

}


async function restoreBackup() {

  const input =
    document.getElementById(
      "restoreFile"
    );


  const message =
    document.getElementById(
      "restoreMessage"
    );


  const button =
    document.getElementById(
      "restoreBackupBtn"
    );


  if (!input?.files?.length) {

    message.innerHTML = `

      <div class="alert error">

        আগে একটি backup file নির্বাচন করুন।

      </div>

    `;

    return;

  }


  const file =
    input.files[0];


  try {

    const text =
      await file.text();


    let backup;


    try {

      backup =
        JSON.parse(text);

    } catch {

      throw new Error(
        "Backup file বৈধ JSON নয়।"
      );

    }


    const confirmed =
      confirm(
        "সতর্কতা: Restore করলে বর্তমান database data পরিবর্তিত হতে পারে। আপনি কি নিশ্চিত?"
      );


    if (!confirmed) {

      return;

    }


    button.disabled = true;

    button.textContent =
      "Restore হচ্ছে...";


    const response =
      await apiFetch(
        "/api/system/restore",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Idempotency-Key":
              crypto.randomUUID()

          },

          body:
            JSON.stringify(
              backup
            )

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Restore failed"
      );

    }


    message.innerHTML = `

      <div class="alert success">

        Backup সফলভাবে restore হয়েছে।

      </div>

    `;


  } catch (error) {

    console.error(error);


    message.innerHTML = `

      <div class="alert error">

        ${escapeHtml(
          error.message
        )}

      </div>

    `;


  } finally {

    button.disabled = false;

    button.textContent =
      "Backup Restore";

  }

}


// ============================================================
// STEP 12 — DASHBOARD + REPORTS
// ============================================================

async function renderDashboard() {

  app.innerHTML = `

    <section class="page-header">

      <div>

        <h2>
          Dashboard
        </h2>

        <p>
          দোকানের বর্তমান হিসাবের সারসংক্ষেপ
        </p>

      </div>


      <div class="toolbar">

        <input
          type="date"
          id="dashboardFrom"
          value="${todayDate()}"
        >

        <input
          type="date"
          id="dashboardTo"
          value="${todayDate()}"
        >

        <button
          id="dashboardRefreshBtn"
          class="btn btn-primary"
          type="button"
        >
          Refresh
        </button>

      </div>

    </section>


    <div
      id="dashboardContent"
      class="dashboard-content"
    >

      <div class="loading">
        Dashboard loading...
      </div>

    </div>

  `;


  document
    .getElementById(
      "dashboardRefreshBtn"
    )
    ?.addEventListener(
      "click",
      loadDashboard
    );


  await loadDashboard();

}


async function loadDashboard() {

  const container =
    document.getElementById(
      "dashboardContent"
    );


  if (!container) return;


  const from =
    document.getElementById(
      "dashboardFrom"
    )?.value ||
    todayDate();


  const to =
    document.getElementById(
      "dashboardTo"
    )?.value ||
    todayDate();


  container.innerHTML = `

    <div class="loading">
      Dashboard loading...
    </div>

  `;


  try {

    const response =
      await apiFetch(
        `/api/dashboard?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(
          to
        )}`
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Dashboard load failed"
      );

    }


    renderDashboardData(
      data
    );


  } catch (error) {

    console.error(error);


    container.innerHTML = `

      <div class="error-state">

        ${escapeHtml(
          error.message ||
          "Dashboard load failed"
        )}

      </div>

    `;

  }

}


function renderDashboardData(
  data
) {

  const container =
    document.getElementById(
      "dashboardContent"
    );


  if (!container) return;


  const summary =
    data.summary ||
    data;


  const sales =
    Number(
      summary.sales ||
      summary.total_sales ||
      0
    );


  const purchases =
    Number(
      summary.purchases ||
      summary.total_purchases ||
      0
    );


  const grossProfit =
    Number(
      summary.gross_profit ||
      0
    );


  const netProfit =
    Number(
      summary.net_profit ||
      0
    );


  const customerDue =
    Number(
      summary.customer_due ||
      summary.total_customer_due ||
      0
    );


  const supplierDue =
    Number(
      summary.supplier_due ||
      summary.total_supplier_due ||
      0
    );


  const stockValue =
    Number(
      summary.stock_value ||
      0
    );


  const productCount =
    Number(
      summary.product_count ||
      0
    );


  container.innerHTML = `

    <div class="summary-grid">

      <div class="summary-card">

        <span>
          Sales
        </span>

        <strong>
          ৳${formatMoney(sales)}
        </strong>

      </div>


      <div class="summary-card">

        <span>
          Purchase
        </span>

        <strong>
          ৳${formatMoney(purchases)}
        </strong>

      </div>


      <div class="summary-card">

        <span>
          Gross Profit
        </span>

        <strong>
          ৳${formatMoney(grossProfit)}
        </strong>

      </div>


      <div class="summary-card">

        <span>
          Net Profit
        </span>

        <strong>
          ৳${formatMoney(netProfit)}
        </strong>

      </div>


      <div class="summary-card">

        <span>
          Customer Due
        </span>

        <strong>
          ৳${formatMoney(customerDue)}
        </strong>

      </div>


      <div class="summary-card">

        <span>
          Supplier Due
        </span>

        <strong>
          ৳${formatMoney(supplierDue)}
        </strong>

      </div>


      <div class="summary-card">

        <span>
          Stock Value
        </span>

        <strong>
          ৳${formatMoney(stockValue)}
        </strong>

      </div>


      <div class="summary-card">

        <span>
          Products
        </span>

        <strong>
          ${formatNumber(productCount)}
        </strong>

      </div>

    </div>


    <div class="dashboard-grid">

      <div class="card">

        <h3>
          Account Balance
        </h3>

        <div id="dashboardAccounts">
          Loading...
        </div>

      </div>


      <div class="card">

        <h3>
          Low Stock
        </h3>

        <div id="dashboardLowStock">
          Loading...
        </div>

      </div>

    </div>


    <div class="card">

      <h3>
        Top Products
      </h3>

      <div id="dashboardTopProducts">
        Loading...
      </div>

    </div>


    <div class="card">

      <h3>
        Recent Transactions
      </h3>

      <div id="dashboardRecentTransactions">
        Loading...
      </div>

    </div>

  `;


  renderDashboardAccounts(
    data.accounts || []
  );


  renderDashboardLowStock(
    data.low_stock ||
    data.lowStock ||
    []
  );


  renderDashboardTopProducts(
    data.top_products ||
    data.topProducts ||
    []
  );


  renderDashboardRecentTransactions(
    data.recent_transactions ||
    data.recentTransactions ||
    []
  );

}


function renderDashboardAccounts(
  accounts
) {

  const container =
    document.getElementById(
      "dashboardAccounts"
    );


  if (!container) return;


  if (!accounts.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো account data নেই।
      </div>
    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>
              Account
            </th>

            <th class="text-right">
              Balance
            </th>

          </tr>

        </thead>

        <tbody>

          ${accounts.map(account => `

            <tr>

              <td>
                ${escapeHtml(
                  account.name || ""
                )}
              </td>

              <td class="text-right">
                ৳${formatMoney(
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


function renderDashboardLowStock(
  products
) {

  const container =
    document.getElementById(
      "dashboardLowStock"
    );


  if (!container) return;


  if (!products.length) {

    container.innerHTML = `

      <div class="empty-state">

        সব পণ্যের stock স্বাভাবিক আছে।

      </div>

    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>
              Product
            </th>

            <th>
              Stock
            </th>

            <th>
              Low Level
            </th>

          </tr>

        </thead>

        <tbody>

          ${products.map(product => `

            <tr>

              <td>
                ${escapeHtml(
                  product.name || ""
                )}
              </td>

              <td>
                ${formatNumber(
                  product.current_stock || 0
                )}
              </td>

              <td>
                ${formatNumber(
                  product.low_stock_level || 0
                )}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

  `;

}


function renderDashboardTopProducts(
  products
) {

  const container =
    document.getElementById(
      "dashboardTopProducts"
    );


  if (!container) return;


  if (!products.length) {

    container.innerHTML = `

      <div class="empty-state">
        কোনো sales product data নেই।
      </div>

    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>
              Product
            </th>

            <th>
              Qty
            </th>

            <th>
              Sales
            </th>

          </tr>

        </thead>

        <tbody>

          ${products.map(product => `

            <tr>

              <td>
                ${escapeHtml(
                  product.name || ""
                )}
              </td>

              <td>
                ${formatNumber(
                  product.quantity ||
                  product.qty ||
                  0
                )}
              </td>

              <td>
                ৳${formatMoney(
                  product.sales ||
                  product.total_sales ||
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


function renderDashboardRecentTransactions(
  transactions
) {

  const container =
    document.getElementById(
      "dashboardRecentTransactions"
    );


  if (!container) return;


  if (!transactions.length) {

    container.innerHTML = `

      <div class="empty-state">
        কোনো transaction পাওয়া যায়নি।
      </div>

    `;

    return;
  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>
              Date
            </th>

            <th>
              Type
            </th>

            <th>
              Reference
            </th>

            <th class="text-right">
              Amount
            </th>

          </tr>

        </thead>

        <tbody>

          ${transactions.map(transaction => `

            <tr>

              <td>
                ${escapeHtml(
                  transaction.transaction_date ||
                  transaction.date ||
                  ""
                )}
              </td>

              <td>
                ${escapeHtml(
                  transactionTypeLabel(
                    transaction.transaction_type ||
                    transaction.type ||
                    ""
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  transaction.reference ||
                  ""
                )}
              </td>

              <td class="text-right">
                ৳${formatMoney(
                  transaction.total_amount ||
                  transaction.amount ||
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


function transactionTypeLabel(
  type
) {

  const labels = {

    PURCHASE:
      "ক্রয়",

    SALE:
      "বিক্রয়",

    CUSTOMER_COLLECTION:
      "Customer Collection",

    SUPPLIER_PAYMENT:
      "Supplier Payment",

    EXPENSE:
      "খরচ",

    OTHER_INCOME:
      "অন্যান্য আয়",

    STOCK_ADJUSTMENT:
      "Stock Adjustment",

    ACCOUNT_TRANSFER:
      "Account Transfer"

  };


  return (
    labels[type] ||
    type ||
    "-"
  );

}
      <div class="setting-row">

        <label>
          ${escapeHtml(setting.key)}
        </label>

        <div class="setting-control">

          <input
            type="text"
            class="setting-value"
            data-setting-key="${escapeHtml(
              setting.key
            )}"
            value="${escapeHtml(
              setting.value ?? ""
            )}"
          >

          <button
            class="btn btn-primary save-setting-btn"
            data-key="${escapeHtml(
              setting.key
            )}"
          >
            Save
          </button>

        </div>

      </div>
    `).join("");


  container
    .querySelectorAll(
      ".save-setting-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => saveSingleSetting(
          button.dataset.key
        )
      );

    });
}


async function saveSingleSetting(
  key
) {

  const input =
    document.querySelector(
      `.setting-value[data-setting-key="${CSS.escape(key)}"]`
    );


  if (!input) {
    return;
  }


  try {

    const response =
      await apiFetch(
        `/api/settings/${encodeURIComponent(key)}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            value: input.value
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Setting save failed"
      );
    }


    alert(
      "Setting সংরক্ষণ হয়েছে।"
    );

  } catch (error) {

    console.error(error);

    alert(error.message);
  }
}


// ============================================================
// AUDIT LOG UI
// ============================================================

async function renderAuditLog() {

  app.innerHTML = `
    <section class="page-header">

      <div>
        <h2>🧾 Audit Log</h2>
        <p>System activity history</p>
      </div>

    </section>


    <div class="card">

      <div class="table-wrap">

        <table>

          <thead>

            <tr>
              <th>সময়</th>
              <th>Action</th>
              <th>Entity</th>
              <th>ID</th>
              <th>Details</th>
            </tr>

          </thead>

          <tbody id="auditLogBody">

            <tr>
              <td
                colspan="5"
                class="empty-state"
              >
                লোড হচ্ছে...
              </td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  `;


  try {

    const response =
      await apiFetch(
        "/api/audit-log?limit=200"
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Audit log load failed"
      );
    }


    const tbody =
      document.getElementById(
        "auditLogBody"
      );


    const logs =
      data.logs || [];


    if (!logs.length) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="5"
            class="empty-state"
          >
            কোনো activity নেই।
          </td>
        </tr>
      `;

      return;
    }


    tbody.innerHTML =
      logs.map(log => `
        <tr>

          <td>
            ${escapeHtml(
              log.created_at || ""
            )}
          </td>

          <td>
            ${escapeHtml(
              log.action || ""
            )}
          </td>

          <td>
            ${escapeHtml(
              log.entity_type || "-"
            )}
          </td>

          <td>
            ${escapeHtml(
              log.entity_id || "-"
            )}
          </td>

          <td>
            ${escapeHtml(
              log.details || "{}"
            )}
          </td>

        </tr>
      `).join("");


  } catch (error) {

    console.error(error);

    document.getElementById(
      "auditLogBody"
    ).innerHTML = `
      <tr>
        <td
          colspan="5"
          class="error-state"
        >
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}


// ============================================================
// BACKUP / RESTORE UI
// ============================================================

async function renderBackup() {

  app.innerHTML = `
    <section class="page-header">

      <div>
        <h2>💾 Backup & Restore</h2>
        <p>Database data নিরাপদে সংরক্ষণ ও পুনরুদ্ধার</p>
      </div>

    </section>


    <div class="card">

      <h3>Database Backup</h3>

      <p>
        বর্তমান database-এর গুরুত্বপূর্ণ data
        JSON backup হিসেবে সংরক্ষণ করুন।
      </p>

      <button
        class="btn btn-success"
        id="downloadBackupBtn"
      >
        💾 Backup Download
      </button>

    </div>


    <div class="card">

      <h3>Database Restore</h3>

      <p>
        ⚠️ Restore করলে বর্তমান database-এর
        data backup-এর data দিয়ে প্রতিস্থাপিত হবে।
      </p>

      <input
        type="file"
        id="restoreFile"
        accept=".json,application/json"
      >

      <div style="margin-top:12px">

        <label>
          Restore confirmation
        </label>

        <input
          type="text"
          id="restoreConfirmation"
          placeholder="RESTORE CHAMAK STORE"
        >

      </div>

      <button
        class="btn btn-danger"
        id="restoreBackupBtn"
        style="margin-top:12px"
      >
        Restore Database
      </button>

    </div>
  `;


  document
    .getElementById(
      "downloadBackupBtn"
    )
    .addEventListener(
      "click",
      downloadBackup
    );


  document
    .getElementById(
      "restoreBackupBtn"
    )
    .addEventListener(
      "click",
      restoreDatabase
    );
}


async function downloadBackup() {

  try {

    const response =
      await apiFetch(
        "/api/backup"
      );


    if (!response.ok) {

      const data =
        await response.json();

      throw new Error(
        data.error ||
        "Backup failed"
      );
    }


    const blob =
      await response.blob();


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `chamak-store-backup-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    alert(
      "Backup তৈরি হয়েছে।"
    );

  } catch (error) {

    console.error(error);

    alert(error.message);
  }
}


async function restoreDatabase() {

  const file =
    document.getElementById(
      "restoreFile"
    ).files[0];


  const confirmation =
    document.getElementById(
      "restoreConfirmation"
    ).value.trim();


  if (!file) {

    alert(
      "প্রথমে backup JSON file নির্বাচন করুন।"
    );

    return;
  }


  if (
    confirmation !==
    "RESTORE CHAMAK STORE"
  ) {

    alert(
      "সঠিক confirmation লিখুন।"
    );

    return;
  }


  const confirmed =
    confirm(
      "সতর্কতা!\n\n" +
      "বর্তমান database data replace হবে।\n\n" +
      "আপনি কি নিশ্চিত?"
    );


  if (!confirmed) {
    return;
  }


  try {

    const text =
      await file.text();


    const backup =
      JSON.parse(text);


    const response =
      await apiFetch(
        "/api/restore",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            confirm_restore:
              "RESTORE CHAMAK STORE",

            backup
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Restore failed"
      );
    }


    alert(
      "Database restore সফল হয়েছে।"
    );


    location.reload();


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Restore failed"
    );
  }
}
