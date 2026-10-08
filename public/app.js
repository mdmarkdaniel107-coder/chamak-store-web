const app = document.getElementById("app");


// ============================================================
// API CLIENT
// ============================================================

async function api(path, options = {}) {

  const response = await fetch(`/api${path}`, {

    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }

  });


  const data =
    await response.json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data.message ||
      `API Error: ${response.status}`
    );

  }


  return data;
}


// ============================================================
// MONEY
// ============================================================

function money(paisa) {

  return (
    Number(paisa || 0) / 100
  ).toLocaleString(
    "bn-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

  app.innerHTML = `
    <div class="loading">
      ড্যাশবোর্ড লোড হচ্ছে...
    </div>
  `;


  try {

    const response =
      await api("/dashboard");


    const d =
      response.data;


    app.innerHTML = `

      <h2>ড্যাশবোর্ড</h2>

      <div class="dashboard-grid">

        ${card(
          "নগদ",
          money(d.cash)
        )}

        ${card(
          "bKash",
          money(d.bkash)
        )}

        ${card(
          "Nagad",
          money(d.nagad)
        )}

        ${card(
          "স্টক ভেলু",
          money(d.stockValue)
        )}

        ${card(
          "কাস্টমার বাকি",
          money(d.customerDue)
        )}

        ${card(
          "সরবরাহকারী বাকি",
          money(d.supplierDue)
        )}

      </div>

    `;

  } catch (error) {

    app.innerHTML = `

      <div class="error-box">

        ড্যাশবোর্ড লোড করা যায়নি।

        <br>

        ${escapeHtml(error.message)}

      </div>

    `;
  }
}


// ============================================================
// CARD
// ============================================================

function card(title, value) {

  return `

    <div class="dashboard-card">

      <div class="card-title">
        ${title}
      </div>

      <div class="card-value">
        ৳ ${value}
      </div>

    </div>

  `;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================================
// APP START
// ============================================================

loadDashboard();
