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

    case "stockVerification":
      await renderStockVerification();
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
   PURCHASE MODULE
   ========================================================= */

let purchaseItems = [];


/* =========================================================
   PURCHASE INITIALIZATION
   ========================================================= */

async function renderPurchase() {

  try {

    showLoading("ক্রয় মডিউল লোড হচ্ছে...");

    const [
      suppliers,
      products,
      accounts
    ] = await Promise.all([
      loadSuppliers(),
      loadProducts(),
      loadAccounts()
    ]);


    purchaseItems = [];


    pageActions.innerHTML = "";


    pageContent.innerHTML = `

      <div class="card">

        <div class="card-header">

          <div>

            <h3>
              নতুন ক্রয়
            </h3>

            <div class="stat-sub">
              একটি Invoice-এ একাধিক পণ্য যোগ করা যাবে
            </div>

          </div>

        </div>


        <div class="card-body">

          <!-- ================= PURCHASE HEADER ================= -->

          <div class="form-grid">

            <div class="form-group">

              <label>
                সাপ্লায়ার *
              </label>

              <select
                id="purchaseSupplier"
                class="form-control"
                required
              >

                <option value="">
                  সাপ্লায়ার নির্বাচন করুন
                </option>

                ${suppliers.map(supplier => `

                  <option value="${supplier.id}">

                    ${escapeHtml(
                      supplier.name
                    )}

                    ${
                      supplier.phone
                        ? ` — ${escapeHtml(
                            supplier.phone
                          )}`
                        : ""
                    }

                  </option>

                `).join("")}

              </select>

            </div>


            <div class="form-group">

              <label>
                পেমেন্ট Account *
              </label>

              <select
                id="purchasePaymentAccount"
                class="form-control"
              >

                ${paymentAccountOptions(
                  accounts
                )}

              </select>

            </div>


            <div class="form-group">

              <label>
                ক্রয়ের তারিখ
              </label>

              <input
                id="purchaseDate"
                class="form-control"
                type="date"
                value="${todayDate()}"
              >

            </div>


            <div class="form-group">

              <label>
                Reference / Invoice No.
              </label>

              <input
                id="purchaseReference"
                class="form-control"
                maxlength="100"
                placeholder="ঐচ্ছিক"
              >

            </div>

          </div>


          <!-- ================= ADD PRODUCT ================= -->

          <div
            class="card"
            style="margin-top:20px;"
          >

            <div class="card-header">

              <h3>
                পণ্য যোগ করুন
              </h3>

            </div>


            <div class="card-body">

              <div class="form-grid">

                <div class="form-group">

                  <label>
                    পণ্য *
                  </label>

                  <select
                    id="purchaseProduct"
                    class="form-control"
                  >

                    <option value="">
                      পণ্য নির্বাচন করুন
                    </option>

                    ${products.map(product => `

                      <option
                        value="${product.id}"
                        data-cost="${product.purchase_price ?? product.cost_price ?? 0}"
                      >

                        ${escapeHtml(
                          product.name
                        )}

                        ${
                          product.sku
                            ? ` (${escapeHtml(
                                product.sku
                              )})`
                            : ""
                        }

                      </option>

                    `).join("")}

                  </select>

                </div>


                <div class="form-group">

                  <label>
                    Quantity *
                  </label>

                  <input
                    id="purchaseQuantity"
                    class="form-control"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value="1"
                  >

                </div>


                <div class="form-group">

                  <label>
                    Unit Cost *
                  </label>

                  <input
                    id="purchaseUnitCost"
                    class="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                  >

                </div>


                <div class="form-group">

                  <label>
                    Line Total
                  </label>

                  <input
                    id="purchaseLineTotal"
                    class="form-control"
                    type="number"
                    readonly
                    value="0"
                  >

                </div>

              </div>


              <div class="form-actions">

                <button
                  id="addPurchaseItemBtn"
                  type="button"
                  class="btn btn-primary"
                >
                  + পণ্য যোগ করুন
                </button>

              </div>

            </div>

          </div>


          <!-- ================= PURCHASE ITEMS ================= -->

          <div
            class="card"
            style="margin-top:20px;"
          >

            <div class="card-header">

              <h3>
                ক্রয়ের পণ্যসমূহ
              </h3>

              <span
                id="purchaseItemCount"
                class="badge badge-info"
              >
                0 item
              </span>

            </div>


            <div class="card-body">

              <div
                id="purchaseItemsTable"
                class="table-wrapper"
              >

                ${purchaseItemsTableHtml()}

              </div>

            </div>

          </div>


          <!-- ================= PAYMENT ================= -->

          <div
            class="card"
            style="margin-top:20px;"
          >

            <div class="card-header">

              <h3>
                পেমেন্ট
              </h3>

            </div>


            <div class="card-body">

              <div class="form-grid">

                <div class="form-group">

                  <label>
                    মোট ক্রয়
                  </label>

                  <input
                    id="purchaseGrandTotal"
                    class="form-control"
                    readonly
                    value="0"
                  >

                </div>


                <div class="form-group">

                  <label>
                    এখন পরিশোধ
                  </label>

                  <input
                    id="purchasePaidAmount"
                    class="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                  >

                </div>


                <div class="form-group">

                  <label>
                    Supplier Due
                  </label>

                  <input
                    id="purchaseDueAmount"
                    class="form-control"
                    readonly
                    value="0"
                  >

                </div>

              </div>


              <div class="form-actions">

                <button
                  id="clearPurchaseBtn"
                  type="button"
                  class="btn btn-light"
                >
                  পরিষ্কার
                </button>

                <button
                  id="savePurchaseBtn"
                  type="button"
                  class="btn btn-success"
                >
                  ✓ ক্রয় সংরক্ষণ
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    `;


    bindPurchaseEvents();

    updatePurchaseTotals();


  } catch (error) {

    renderError(error);

  } finally {

    hideLoading();

  }

}


/* =========================================================
   PAYMENT ACCOUNT OPTIONS
   ========================================================= */

function paymentAccountOptions(accounts) {

  const allowedNames = [
    "Cash",
    "bKash",
    "Nagad",
    "Rocket"
  ];


  const filtered =
    accounts.filter(account => {

      const name =
        String(
          account.name || ""
        ).toLowerCase();

      return allowedNames.some(
        allowed =>
          name === allowed.toLowerCase()
      );

    });


  if (!filtered.length) {

    return `

      <option value="1000">
        Cash
      </option>

    `;

  }


  return filtered.map(account => `

    <option value="${account.id}">

      ${escapeHtml(
        account.name
      )}

    </option>

  `).join("");

}


/* =========================================================
   TODAY DATE
   ========================================================= */

function todayDate() {

  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


/* =========================================================
   BIND PURCHASE EVENTS
   ========================================================= */

function bindPurchaseEvents() {


  const productSelect =
    $("#purchaseProduct");


  const quantityInput =
    $("#purchaseQuantity");


  const costInput =
    $("#purchaseUnitCost");


  productSelect.addEventListener(
    "change",
    () => {

      const selected =
        productSelect.options[
          productSelect.selectedIndex
        ];


      if (!selected) {
        return;
      }


      const cost =
        Number(
          selected.dataset.cost || 0
        );


      costInput.value =
        cost.toFixed(2);


      updatePurchaseLineTotal();

    }
  );


  quantityInput.addEventListener(
    "input",
    updatePurchaseLineTotal
  );


  costInput.addEventListener(
    "input",
    updatePurchaseLineTotal
  );


  $("#addPurchaseItemBtn")
    .addEventListener(
      "click",
      addPurchaseItem
    );


  $("#purchasePaidAmount")
    .addEventListener(
      "input",
      updatePurchaseTotals
    );


  $("#savePurchaseBtn")
    .addEventListener(
      "click",
      savePurchase
    );


  $("#clearPurchaseBtn")
    .addEventListener(
      "click",
      () => navigate("purchase")
    );

}


/* =========================================================
   PURCHASE LINE TOTAL
   ========================================================= */

function updatePurchaseLineTotal() {

  const quantity =
    Number(
      $("#purchaseQuantity")?.value || 0
    );


  const unitCost =
    Number(
      $("#purchaseUnitCost")?.value || 0
    );


  const total =
    quantity * unitCost;


  if ($("#purchaseLineTotal")) {

    $("#purchaseLineTotal").value =
      total.toFixed(2);

  }

}


/* =========================================================
   ADD PURCHASE ITEM
   ========================================================= */

function addPurchaseItem() {

  const productId =
    $("#purchaseProduct").value;


  const productSelect =
    $("#purchaseProduct");


  const selected =
    productSelect.options[
      productSelect.selectedIndex
    ];


  const quantity =
    Number(
      $("#purchaseQuantity").value || 0
    );


  const unitCost =
    Number(
      $("#purchaseUnitCost").value || 0
    );


  if (!productId) {

    showToast(
      "পণ্য নির্বাচন করুন",
      "error"
    );

    return;

  }


  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {

    showToast(
      "সঠিক Quantity দিন",
      "error"
    );

    return;

  }


  if (
    !Number.isFinite(unitCost) ||
    unitCost < 0
  ) {

    showToast(
      "সঠিক Unit Cost দিন",
      "error"
    );

    return;

  }


  const existingIndex =
    purchaseItems.findIndex(
      item =>
        String(item.product_id) ===
        String(productId)
    );


  if (existingIndex !== -1) {

    /*
      একই Invoice-এ একই product দ্বিতীয়বার
      আলাদা row না রেখে quantity যোগ করা হবে।

      Cost পরিবর্তন করলে নতুন weighted/FIFO lot
      তৈরি করার সুযোগ backend-এ থাকবে।
    */

    purchaseItems[
      existingIndex
    ].quantity += quantity;

    purchaseItems[
      existingIndex
    ].unit_cost = unitCost;

  } else {

    purchaseItems.push({

      product_id:
        Number(productId),

      product_name:
        selected.textContent.trim(),

      quantity,

      unit_cost:
        unitCost,

      total:
        quantity * unitCost

    });

  }


  purchaseItems =
    purchaseItems.map(item => ({

      ...item,

      total:
        Number(item.quantity) *
        Number(item.unit_cost)

    }));


  renderPurchaseItems();

  updatePurchaseTotals();


  $("#purchaseProduct").value = "";

  $("#purchaseQuantity").value = "1";

  $("#purchaseUnitCost").value = "0";

  $("#purchaseLineTotal").value = "0";

}


/* =========================================================
   PURCHASE ITEMS TABLE
   ========================================================= */

function purchaseItemsTableHtml() {

  if (!purchaseItems.length) {

    return `

      <div class="empty-state">

        <div class="icon">
          🛒
        </div>

        <strong>
          এখনো কোনো পণ্য যোগ করা হয়নি
        </strong>

        <span>
          উপরের Product section থেকে পণ্য যোগ করুন
        </span>

      </div>

    `;

  }


  return `

    <table class="data-table">

      <thead>

        <tr>

          <th>#</th>

          <th>
            পণ্য
          </th>

          <th class="text-right">
            Quantity
          </th>

          <th class="text-right">
            Unit Cost
          </th>

          <th class="text-right">
            Total
          </th>

          <th>
            Action
          </th>

        </tr>

      </thead>


      <tbody>

        ${purchaseItems.map(
          (item, index) => `

            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    item.product_name
                  )}
                </strong>
              </td>

              <td class="text-right">
                ${number(
                  item.quantity
                )}
              </td>

              <td class="text-right">
                ৳${money(
                  item.unit_cost
                )}
              </td>

              <td class="text-right">
                <strong>
                  ৳${money(
                    item.total
                  )}
                </strong>
              </td>

              <td>

                <button
                  type="button"
                  class="btn btn-danger btn-small"
                  data-remove-purchase-item="${index}"
                >
                  Remove
                </button>

              </td>

            </tr>

          `
        ).join("")}

      </tbody>

    </table>

  `;

}


/* =========================================================
   RENDER PURCHASE ITEMS
   ========================================================= */

function renderPurchaseItems() {

  const container =
    $("#purchaseItemsTable");


  if (!container) {
    return;
  }


  container.innerHTML =
    purchaseItemsTableHtml();


  document
    .querySelectorAll(
      "[data-remove-purchase-item]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset
                .removePurchaseItem
            );


          purchaseItems.splice(
            index,
            1
          );


          renderPurchaseItems();

          updatePurchaseTotals();

        }
      );

    });


  const count =
    $("#purchaseItemCount");


  if (count) {

    count.textContent =
      `${purchaseItems.length} item`;

  }

}


/* =========================================================
   PURCHASE TOTALS
   ========================================================= */

function updatePurchaseTotals() {

  const grandTotal =
    purchaseItems.reduce(
      (sum, item) =>
        sum +
        Number(item.total || 0),
      0
    );


  const paid =
    Number(
      $("#purchasePaidAmount")?.value ||
      0
    );


  const due =
    Math.max(
      grandTotal - paid,
      0
    );


  if ($("#purchaseGrandTotal")) {

    $("#purchaseGrandTotal").value =
      grandTotal.toFixed(2);

  }


  if ($("#purchaseDueAmount")) {

    $("#purchaseDueAmount").value =
      due.toFixed(2);

  }


  const paidInput =
    $("#purchasePaidAmount");


  if (paidInput) {

    paidInput.max =
      grandTotal.toFixed(2);

  }

}


/* =========================================================
   SAVE PURCHASE
   ========================================================= */

async function savePurchase() {

  const supplierId =
    Number(
      $("#purchaseSupplier").value || 0
    );


  const paymentAccountId =
    Number(
      $("#purchasePaymentAccount").value ||
      1000
    );


  const purchaseDate =
    $("#purchaseDate").value ||
    todayDate();


  const reference =
    $("#purchaseReference")
      .value
      .trim();


  const grandTotal =
    purchaseItems.reduce(
      (sum, item) =>
        sum +
        Number(item.total || 0),
      0
    );


  const paidAmount =
    Number(
      $("#purchasePaidAmount").value || 0
    );


  if (!supplierId) {

    showToast(
      "সাপ্লায়ার নির্বাচন করুন",
      "error"
    );

    return;

  }


  if (!purchaseItems.length) {

    showToast(
      "কমপক্ষে একটি পণ্য যোগ করুন",
      "error"
    );

    return;

  }


  if (
    paidAmount < 0 ||
    paidAmount > grandTotal
  ) {

    showToast(
      "Paid Amount সঠিক নয়",
      "error"
    );

    return;

  }


  const dueAmount =
    grandTotal - paidAmount;


  /*
    Backend Transaction Engine-এর
    createPurchase payload.
  */

  const payload = {

    supplier_id:
      supplierId,

    payment_account_id:
      paymentAccountId,

    purchase_date:
      purchaseDate,

    reference:
      reference || null,

    total_amount:
      grandTotal,

    paid_amount:
      paidAmount,

    due_amount:
      dueAmount,

    items:
      purchaseItems.map(item => ({

        product_id:
          Number(
            item.product_id
          ),

        quantity:
          Number(
            item.quantity
          ),

        unit_cost:
          Number(
            item.unit_cost
          ),

        total:
          Number(
            item.total
          )

      }))

  };


  try {

    showLoading(
      "ক্রয় সংরক্ষণ হচ্ছে..."
    );


    /*
      Duplicate mobile/network submission
      ঠেকানোর জন্য unique idempotency key.
    */

    const idempotencyKey =
      crypto.randomUUID();


    await api(
      "/api/transactions/purchase",
      {

        method: "POST",

        headers: {

          "Idempotency-Key":
            idempotencyKey

        },

        body:
          JSON.stringify(
            payload
          )

      }
    );


    showToast(
      "ক্রয় সফলভাবে সংরক্ষণ হয়েছে"
    );


    /*
      Save হওয়ার পরে নতুন Purchase screen.
      Dashboard data পরেরবার reload হবে।
    */

    await navigate("purchase");


  } catch (error) {

    console.error(
      "Purchase save failed:",
      error
    );


    showToast(
      error.message ||
      "ক্রয় সংরক্ষণ করা যায়নি",
      "error"
    );

  } finally {

    hideLoading();

  }

}
// ============================================================
// SALES MODULE
// ============================================================

let saleProducts = [];
let saleCustomers = [];
let saleAccounts = [];
let saleItems = [];

async function renderSale() {
  app.innerHTML = `
    <section class="page-header">
      <div>
        <h1>বিক্রয়</h1>
        <p>একাধিক পণ্যসহ বিক্রয় Invoice</p>
      </div>
    </section>

    <section class="card">
      <div class="form-grid">

        <div class="form-group">
          <label>বিক্রয়ের তারিখ</label>
          <input
            id="saleDate"
            type="date"
            value="${todayDate()}"
          >
        </div>

        <div class="form-group">
          <label>Customer</label>
          <select id="saleCustomer">
            <option value="">Cash Customer</option>
          </select>
        </div>

        <div class="form-group">
          <label>Payment Account</label>
          <select id="salePaymentAccount">
            <option value="">Payment Account নির্বাচন</option>
          </select>
        </div>

        <div class="form-group">
          <label>Reference</label>
          <input
            id="saleReference"
            type="text"
            placeholder="Invoice / Note"
          >
        </div>

      </div>
    </section>

    <section class="card">
      <div class="section-title">
        <h2>পণ্য যোগ করুন</h2>
      </div>

      <div class="form-grid">

        <div class="form-group">
          <label>Product</label>
          <select id="saleProduct">
            <option value="">পণ্য নির্বাচন</option>
          </select>
        </div>

        <div class="form-group">
          <label>Quantity</label>
          <input
            id="saleQty"
            type="number"
            min="0.001"
            step="0.001"
            placeholder="0"
          >
        </div>

        <div class="form-group">
          <label>Unit Sale Price</label>
          <input
            id="saleUnitPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label>Total</label>
          <input
            id="saleLineTotal"
            type="number"
            readonly
            value="0"
          >
        </div>

      </div>

      <div class="form-actions">
        <button
          id="addSaleItemBtn"
          class="btn btn-primary"
          type="button"
        >
          + পণ্য যোগ করুন
        </button>
      </div>
    </section>

    <section class="card">

      <div class="section-title">
        <h2>বিক্রয় পণ্যসমূহ</h2>
      </div>

      <div id="saleItemsContainer">
        <div class="empty-state">
          এখনো কোনো পণ্য যোগ করা হয়নি।
        </div>
      </div>

    </section>

    <section class="card">

      <div class="sale-summary">

        <div class="summary-row">
          <span>মোট বিক্রয়</span>
          <strong id="saleGrandTotal">৳0.00</strong>
        </div>

        <div class="summary-row">
          <span>Paid</span>
          <strong id="salePaidAmount">৳0.00</strong>
        </div>

        <div class="summary-row">
          <span>Customer Due</span>
          <strong id="saleDueAmount">৳0.00</strong>
        </div>

      </div>

      <div class="form-grid">

        <div class="form-group">
          <label>Paid Amount</label>
          <input
            id="salePaidInput"
            type="number"
            min="0"
            step="0.01"
            value="0"
          >
        </div>

      </div>

      <div class="form-actions">

        <button
          id="saveSaleBtn"
          class="btn btn-primary"
          type="button"
        >
          বিক্রয় সংরক্ষণ
        </button>

      </div>

      <div id="saleMessage"></div>

    </section>
  `;

  await loadSaleData();
  bindSaleEvents();
  renderSaleItems();
  updateSaleTotals();
}


// ============================================================
// LOAD DATA
// ============================================================

async function loadSaleData() {
  const [
    productsResponse,
    customersResponse,
    accountsResponse
  ] = await Promise.all([
    fetch("/api/products"),
    fetch("/api/customers"),
    fetch("/api/accounts")
  ]);

  if (!productsResponse.ok) {
    throw new Error("Products load failed");
  }

  if (!customersResponse.ok) {
    throw new Error("Customers load failed");
  }

  if (!accountsResponse.ok) {
    throw new Error("Accounts load failed");
  }

  saleProducts = await productsResponse.json();
  saleCustomers = await customersResponse.json();
  saleAccounts = await accountsResponse.json();

  populateSaleProducts();
  populateSaleCustomers();
  populateSaleAccounts();
}


// ============================================================
// PRODUCT DROPDOWN
// ============================================================

function populateSaleProducts() {
  const select = document.getElementById("saleProduct");

  if (!select) return;

  select.innerHTML = `
    <option value="">পণ্য নির্বাচন</option>

    ${saleProducts.map(product => `
      <option value="${product.id}">
        ${escapeHtml(product.sku || "")}
        — ${escapeHtml(product.name || "")}
        — Stock: ${formatNumber(product.current_stock || 0)}
      </option>
    `).join("")}
  `;
}


// ============================================================
// CUSTOMER DROPDOWN
// ============================================================

function populateSaleCustomers() {
  const select = document.getElementById("saleCustomer");

  if (!select) return;

  select.innerHTML = `
    <option value="">Cash Customer</option>

    ${saleCustomers.map(customer => `
      <option value="${customer.id}">
        ${escapeHtml(customer.name || "")}
        ${customer.phone ? ` — ${escapeHtml(customer.phone)}` : ""}
      </option>
    `).join("")}
  `;
}


// ============================================================
// PAYMENT ACCOUNT
// ============================================================

function populateSaleAccounts() {
  const select = document.getElementById("salePaymentAccount");

  if (!select) return;

  const allowedAccounts = saleAccounts.filter(account => {
    return [
      1000,
      1010,
      1020,
      1030
    ].includes(Number(account.code));
  });

  select.innerHTML = `
    <option value="">Payment Account নির্বাচন</option>

    ${allowedAccounts.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;
}


// ============================================================
// EVENTS
// ============================================================

function bindSaleEvents() {

  const productSelect = document.getElementById("saleProduct");
  const qtyInput = document.getElementById("saleQty");
  const priceInput = document.getElementById("saleUnitPrice");

  const addButton = document.getElementById("addSaleItemBtn");
  const paidInput = document.getElementById("salePaidInput");
  const saveButton = document.getElementById("saveSaleBtn");

  productSelect?.addEventListener("change", () => {

    const productId = Number(productSelect.value);

    const product = saleProducts.find(
      item => Number(item.id) === productId
    );

    if (!product) {
      priceInput.value = "";
      updateSaleLineTotal();
      return;
    }

    if (product.sale_price !== undefined) {
      priceInput.value = product.sale_price;
    }

    updateSaleLineTotal();
  });


  qtyInput?.addEventListener(
    "input",
    updateSaleLineTotal
  );


  priceInput?.addEventListener(
    "input",
    updateSaleLineTotal
  );


  addButton?.addEventListener(
    "click",
    addSaleItem
  );


  paidInput?.addEventListener(
    "input",
    updateSaleTotals
  );


  saveButton?.addEventListener(
    "click",
    saveSale
  );
}


// ============================================================
// LINE TOTAL
// ============================================================

function updateSaleLineTotal() {

  const qty = Number(
    document.getElementById("saleQty")?.value || 0
  );

  const price = Number(
    document.getElementById("saleUnitPrice")?.value || 0
  );

  const total = qty * price;

  const input = document.getElementById(
    "saleLineTotal"
  );

  if (input) {
    input.value = total.toFixed(2);
  }
}


// ============================================================
// ADD SALE ITEM
// ============================================================

function addSaleItem() {

  const productId = Number(
    document.getElementById("saleProduct").value
  );

  const qty = Number(
    document.getElementById("saleQty").value
  );

  const unitPrice = Number(
    document.getElementById("saleUnitPrice").value
  );

  if (!productId) {
    showSaleMessage(
      "পণ্য নির্বাচন করুন।",
      "error"
    );
    return;
  }

  if (!qty || qty <= 0) {
    showSaleMessage(
      "সঠিক Quantity দিন।",
      "error"
    );
    return;
  }

  if (unitPrice < 0) {
    showSaleMessage(
      "সঠিক Sale Price দিন।",
      "error"
    );
    return;
  }

  const product = saleProducts.find(
    item => Number(item.id) === productId
  );

  if (!product) {
    showSaleMessage(
      "পণ্য পাওয়া যায়নি।",
      "error"
    );
    return;
  }


  const currentStock = Number(
    product.current_stock || 0
  );


  const existingQty = saleItems
    .filter(item => Number(item.product_id) === productId)
    .reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );


  if (
    existingQty + qty >
    currentStock
  ) {
    showSaleMessage(
      `স্টক যথেষ্ট নেই। Available: ${formatNumber(currentStock)}`,
      "error"
    );
    return;
  }


  const existingItem = saleItems.find(
    item => Number(item.product_id) === productId
  );


  if (existingItem) {

    existingItem.quantity =
      Number(existingItem.quantity) + qty;

    existingItem.unit_price =
      unitPrice;

    existingItem.total =
      existingItem.quantity * unitPrice;

  } else {

    saleItems.push({
      product_id: productId,
      product_name: product.name,
      sku: product.sku,
      quantity: qty,
      unit_price: unitPrice,
      total: qty * unitPrice
    });

  }


  document.getElementById(
    "saleProduct"
  ).value = "";

  document.getElementById(
    "saleQty"
  ).value = "";

  document.getElementById(
    "saleUnitPrice"
  ).value = "";

  document.getElementById(
    "saleLineTotal"
  ).value = "0";


  renderSaleItems();
  updateSaleTotals();

  clearSaleMessage();
}


// ============================================================
// RENDER ITEMS
// ============================================================

function renderSaleItems() {

  const container = document.getElementById(
    "saleItemsContainer"
  );

  if (!container) return;


  if (saleItems.length === 0) {

    container.innerHTML = `
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


function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
            placeholder="Collection note"
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
          Customer নির্বাচন করুন।
        </div>
      </div>

    </section>
  `;


  await loadDueData();

  bindCustomerDueEvents();

  renderDueCustomers();
}


// ============================================================
// LOAD DATA
// ============================================================

async function loadDueData() {

  const [
    customersResponse,
    accountsResponse
  ] = await Promise.all([

    fetch("/api/customers"),

    fetch("/api/accounts")

  ]);


  if (!customersResponse.ok) {
    throw new Error(
      "Customer data load failed"
    );
  }


  if (!accountsResponse.ok) {
    throw new Error(
      "Account data load failed"
    );
  }


  dueCustomers =
    await customersResponse.json();


  dueAccounts =
    await accountsResponse.json();


  populateCollectionAccounts();
}


// ============================================================
// COLLECTION ACCOUNTS
// ============================================================

function populateCollectionAccounts() {

  const select =
    document.getElementById(
      "collectionAccount"
    );


  if (!select) return;


  const accounts =
    dueAccounts.filter(account => {

      return [
        1000,
        1010,
        1020,
        1030
      ].includes(
        Number(account.code)
      );

    });


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

function bindCustomerDueEvents() {

  const search =
    document.getElementById(
      "dueCustomerSearch"
    );


  search?.addEventListener(
    "input",
    renderDueCustomers
  );


  const saveButton =
    document.getElementById(
      "saveCollectionBtn"
    );


  saveButton?.addEventListener(
    "click",
    saveCustomerCollection
  );
}


// ============================================================
// CUSTOMER LIST
// ============================================================

function renderDueCustomers() {

  const container =
    document.getElementById(
      "dueCustomerList"
    );


  if (!container) return;


  const searchValue =
    (
      document.getElementById(
        "dueCustomerSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const filtered =
    dueCustomers.filter(customer => {

      const name =
        String(
          customer.name || ""
        ).toLowerCase();

      const phone =
        String(
          customer.phone || ""
        ).toLowerCase();

      const due =
        Number(
          customer.current_due || 0
        );


      return (
        name.includes(searchValue) ||
        phone.includes(searchValue)
      ) && due > 0;

    });


  if (!filtered.length) {

    container.innerHTML = `
      <div class="empty-state">
        কোনো বাকি Customer পাওয়া যায়নি।
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

// ============================================================
// ACCOUNT TRANSFER MODULE
// ============================================================

let transferAccounts = [];

async function renderAccountTransfer() {

  app.innerHTML = `
    <section class="page-header">
      <div>
        <h1>Account Transfer</h1>
        <p>Cash / bKash / Nagad / Rocket</p>
      </div>
    </section>

    <section class="card">

      <div class="form-grid">

        <div class="form-group">

          <label>From Account</label>

          <select id="transferFrom">
            <option value="">
              Account নির্বাচন
            </option>
          </select>

        </div>


        <div class="form-group">

          <label>To Account</label>

          <select id="transferTo">
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


async function loadTransferAccounts() {

  const response =
    await fetch("/api/accounts");


  if (!response.ok) {

    throw new Error(
      "Accounts load failed"
    );

  }


  transferAccounts =
    await response.json();


  populateTransferAccounts();
}


function populateTransferAccounts() {

  const from =
    document.getElementById(
      "transferFrom"
    );

  const to =
    document.getElementById(
      "transferTo"
    );


  if (!from || !to) return;


  const accounts =
    transferAccounts.filter(
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


  const options = `
    <option value="">
      Account নির্বাচন
    </option>

    ${accounts.map(account => `
      <option value="${account.id}">
        ${escapeHtml(account.name)}
      </option>
    `).join("")}
  `;


  from.innerHTML =
    options;

  to.innerHTML =
    options;
}


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


async function saveAccountTransfer() {

  const fromAccountId =
    Number(
      document.getElementById(
        "transferFrom"
      ).value || 0
    );


  const toAccountId =
    Number(
      document.getElementById(
        "transferTo"
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
      "From ও To Account একই হতে পারবে না।",
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
      "সংরক্ষণ হচ্ছে...";


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

          body: JSON.stringify({

            from_account_id:
              fromAccountId,

            to_account_id:
              toAccountId,

            amount,

            transfer_date:
              date,

            note

          })

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Transfer save failed"
      );

    }


    showTransferMessage(
      "Account Transfer সফলভাবে সংরক্ষণ হয়েছে।",
      "success"
    );


    document.getElementById(
      "transferAmount"
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
      "Transfer সংরক্ষণ করা যায়নি।",
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "Transfer সংরক্ষণ";
  }
}


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

// ============================================================
// STEP 11 — STOCK VALUE VERIFICATION + STOCK ADJUSTMENT
// ============================================================

async function renderStockVerification() {
  app.innerHTML = `
    <section class="page-header">
      <div>
        <h2>স্টক ভেলু যাচাই</h2>
        <p>সিস্টেম স্টক ও বাস্তব স্টক মিলিয়ে দেখুন</p>
      </div>
    </section>

    <div class="card">
      <div class="form-grid">

        <div class="form-group">
          <label>যাচাইয়ের তারিখ</label>
          <input
            type="date"
            id="verificationDate"
            value="${todayDate()}"
          >
        </div>

        <div class="form-group">
          <label>নোট</label>
          <input
            type="text"
            id="verificationNote"
            placeholder="যেমন: মাসিক স্টক যাচাই"
          >
        </div>

      </div>

      <div class="toolbar">
        <button
          class="btn btn-primary"
          id="loadVerificationBtn"
        >
          স্টক লোড করুন
        </button>

        <button
          class="btn btn-success"
          id="saveVerificationBtn"
        >
          যাচাই সংরক্ষণ
        </button>
      </div>
    </div>

    <div class="card">

      <div class="summary-grid">

        <div class="summary-box">
          <span>System Stock Value</span>
          <strong id="systemStockValue">৳0</strong>
        </div>

        <div class="summary-box">
          <span>Physical Stock Value</span>
          <strong id="physicalStockValue">৳0</strong>
        </div>

        <div class="summary-box">
          <span>Difference</span>
          <strong id="stockValueDifference">৳0</strong>
        </div>

      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>পণ্য</th>
              <th>System Qty</th>
              <th>Unit Cost</th>
              <th>Expected Value</th>
              <th>Physical Qty</th>
              <th>Physical Value</th>
              <th>Qty Difference</th>
              <th>Value Difference</th>
            </tr>
          </thead>

          <tbody id="verificationTableBody">
            <tr>
              <td colspan="8" class="empty-state">
                স্টক লোড করুন
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <div class="card">

      <h3>Stock Adjustment</h3>

      <div class="form-grid">

        <div class="form-group">
          <label>পণ্য</label>
          <select id="adjustmentProduct">
            <option value="">পণ্য নির্বাচন করুন</option>
          </select>
        </div>

        <div class="form-group">
          <label>Adjustment Quantity</label>
          <input
            type="number"
            id="adjustmentQty"
            step="0.001"
            placeholder="যেমন: -2 অথবা 5"
          >
        </div>

        <div class="form-group">
          <label>কারণ</label>
          <input
            type="text"
            id="adjustmentReason"
            placeholder="যেমন: Physical stock shortage"
          >
        </div>

      </div>

      <button
        class="btn btn-warning"
        id="saveAdjustmentBtn"
      >
        Stock Adjustment Save
      </button>

    </div>
  `;

  await bindStockVerification();
}


async function bindStockVerification() {

  const loadBtn = document.getElementById(
    "loadVerificationBtn"
  );

  const saveBtn = document.getElementById(
    "saveVerificationBtn"
  );

  const adjustmentBtn = document.getElementById(
    "saveAdjustmentBtn"
  );

  loadBtn.addEventListener(
    "click",
    loadVerificationStock
  );

  saveBtn.addEventListener(
    "click",
    saveStockVerification
  );

  adjustmentBtn.addEventListener(
    "click",
    saveStockAdjustment
  );

  await loadProducts();

  populateAdjustmentProducts();
}


function populateAdjustmentProducts() {

  const select = document.getElementById(
    "adjustmentProduct"
  );

  if (!select) return;

  select.innerHTML = `
    <option value="">পণ্য নির্বাচন করুন</option>
    ${productsCache.map(product => `
      <option value="${product.id}">
        ${escapeHtml(product.name)}
      </option>
    `).join("")}
  `;
}


async function loadVerificationStock() {

  const tbody = document.getElementById(
    "verificationTableBody"
  );

  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="empty-state">
        স্টক লোড হচ্ছে...
      </td>
    </tr>
  `;

  try {

    const response = await apiFetch(
      "/api/stock-verification"
    );

    if (!response.ok) {
      throw new Error(
        "স্টক ডাটা লোড করা যায়নি"
      );
    }

    const data = await response.json();

    const rows = data.items || data.products || [];

    if (!rows.length) {

      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            কোনো স্টক পাওয়া যায়নি
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML = rows.map((item, index) => {

      const systemQty = Number(
        item.current_stock ?? item.system_qty ?? 0
      );

      const unitCost = Number(
        item.unit_cost ?? item.last_unit_cost ?? 0
      );

      const expectedValue =
        systemQty * unitCost;

      return `
        <tr
          data-product-id="${item.id}"
          data-unit-cost="${unitCost}"
        >

          <td>
            ${escapeHtml(item.name || "")}
          </td>

          <td class="system-qty">
            ${formatNumber(systemQty)}
          </td>

          <td>
            ${formatMoney(unitCost)}
          </td>

          <td>
            ${formatMoney(expectedValue)}
          </td>

          <td>
            <input
              type="number"
              class="physical-qty"
              step="0.001"
              min="0"
              value="${systemQty}"
            >
          </td>

          <td class="physical-value">
            ${formatMoney(expectedValue)}
          </td>

          <td class="qty-difference">
            0
          </td>

          <td class="value-difference">
            ${formatMoney(0)}
          </td>

        </tr>
      `;

    }).join("");

    document
      .querySelectorAll(".physical-qty")
      .forEach(input => {

        input.addEventListener(
          "input",
          updateVerificationRow
        );

      });

    updateVerificationSummary();

  } catch (error) {

    console.error(error);

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="error-state">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}


function updateVerificationRow(event) {

  const input = event.target;

  const row = input.closest("tr");

  const systemQty = Number(
    row.querySelector(".system-qty")
      ?.textContent
      ?.replace(/,/g, "") || 0
  );

  const unitCost = Number(
    row.dataset.unitCost || 0
  );

  const physicalQty = Number(
    input.value || 0
  );

  const physicalValue =
    physicalQty * unitCost;

  const qtyDifference =
    physicalQty - systemQty;

  const valueDifference =
    physicalValue -
    (systemQty * unitCost);

  row.querySelector(
    ".physical-value"
  ).textContent =
    formatMoney(physicalValue);

  row.querySelector(
    ".qty-difference"
  ).textContent =
    formatNumber(qtyDifference);

  row.querySelector(
    ".value-difference"
  ).textContent =
    formatMoney(valueDifference);

  updateVerificationSummary();
}


function updateVerificationSummary() {

  let systemValue = 0;
  let physicalValue = 0;

  document
    .querySelectorAll(
      "#verificationTableBody tr[data-product-id]"
    )
    .forEach(row => {

      const systemQty = Number(
        row.querySelector(".system-qty")
          ?.textContent
          ?.replace(/,/g, "") || 0
      );

      const unitCost = Number(
        row.dataset.unitCost || 0
      );

      const physicalQty = Number(
        row.querySelector(".physical-qty")
          ?.value || 0
      );

      systemValue +=
        systemQty * unitCost;

      physicalValue +=
        physicalQty * unitCost;

    });

  const difference =
    physicalValue - systemValue;

  document.getElementById(
    "systemStockValue"
  ).textContent =
    formatMoney(systemValue);

  document.getElementById(
    "physicalStockValue"
  ).textContent =
    formatMoney(physicalValue);

  document.getElementById(
    "stockValueDifference"
  ).textContent =
    formatMoney(difference);
}


async function saveStockVerification() {

  const rows = [
    ...document.querySelectorAll(
      "#verificationTableBody tr[data-product-id]"
    )
  ];

  if (!rows.length) {

    alert("আগে স্টক লোড করুন।");

    return;
  }

  const items = rows.map(row => {

    const physicalQty = Number(
      row.querySelector(".physical-qty")
        ?.value || 0
    );

    return {
      product_id: Number(
        row.dataset.productId
      ),
      physical_qty: physicalQty
    };

  });

  const payload = {

    verification_date:
      document.getElementById(
        "verificationDate"
      ).value,

    note:
      document.getElementById(
        "verificationNote"
      ).value.trim(),

    items

  };

  try {

    const response = await apiFetch(
      "/api/stock-verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key":
            crypto.randomUUID()
        },
        body: JSON.stringify(payload)
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

    alert(
      "স্টক ভেলু যাচাই সংরক্ষণ হয়েছে।"
    );

  } catch (error) {

    console.error(error);

    alert(error.message);

  }
}


async function saveStockAdjustment() {

  const productId = Number(
    document.getElementById(
      "adjustmentProduct"
    ).value
  );

  const quantity = Number(
    document.getElementById(
      "adjustmentQty"
    ).value
  );

  const reason =
    document.getElementById(
      "adjustmentReason"
    ).value.trim();

  if (!productId) {

    alert("পণ্য নির্বাচন করুন।");

    return;
  }

  if (!Number.isFinite(quantity) || quantity === 0) {

    alert(
      "Adjustment Quantity 0 হতে পারবে না।"
    );

    return;
  }

  if (!reason) {

    alert("Adjustment-এর কারণ লিখুন।");

    return;
  }

  try {

    const response = await apiFetch(
      "/api/transactions/stock-adjustment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key":
            crypto.randomUUID()
        },
        body: JSON.stringify({

          product_id: productId,

          quantity,

          reason,

          adjustment_date:
            document.getElementById(
              "verificationDate"
            )?.value || todayDate()

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

    alert(
      "Stock Adjustment সফলভাবে সংরক্ষণ হয়েছে।"
    );

    document.getElementById(
      "adjustmentQty"
    ).value = "";

    document.getElementById(
      "adjustmentReason"
    ).value = "";

    await loadProducts();

    populateAdjustmentProducts();

    await loadVerificationStock();

  } catch (error) {

    console.error(error);

    alert(error.message);

  }
}
