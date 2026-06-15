const api = {
    login: "/auth/login/",
    register: "/auth/registration/",
    logout: "/auth/logout/",
    categories: "/api/v1/category/",
    transactions: "/api/v1/transaction/",
    statistics: "/api/v1/transaction/statistics/",
};

const state = {
    token: localStorage.getItem("financePlannerToken"),
    categories: [],
    transactions: [],
};

const els = {
    authSection: document.querySelector("#authSection"),
    appSection: document.querySelector("#appSection"),
    logoutButton: document.querySelector("#logoutButton"),
    loginForm: document.querySelector("#loginForm"),
    registerForm: document.querySelector("#registerForm"),
    categoryForm: document.querySelector("#categoryForm"),
    transactionForm: document.querySelector("#transactionForm"),
    transactionCategory: document.querySelector("#transactionCategory"),
    refreshButton: document.querySelector("#refreshButton"),
    categoriesList: document.querySelector("#categoriesList"),
    transactionsList: document.querySelector("#transactionsList"),
    incomeValue: document.querySelector("#incomeValue"),
    expenseValue: document.querySelector("#expenseValue"),
    balanceValue: document.querySelector("#balanceValue"),
    message: document.querySelector("#message"),
};

function showMessage(text, type = "success") {
    els.message.textContent = text;
    els.message.className = `message ${type}`;
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
        els.message.classList.add("hidden");
    }, 3500);
}

function getFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function authHeaders(extra = {}) {
    const headers = { ...extra };

    if (state.token) {
        headers.Authorization = `Token ${state.token}`;
    }

    return headers;
}

async function request(url, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = authHeaders(isFormData ? options.headers : {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    });

    const response = await fetch(url, { ...options, headers });
    const text = await response.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch (_) {
        data = text;
    }

    if (!response.ok) {
        throw new Error(formatApiError(data, response.status));
    }

    return data;
}

function formatApiError(data, status) {
    if (!data) return `Request failed with status ${status}.`;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (data.non_field_errors) return data.non_field_errors.join(" ");

    return Object.entries(data)
        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(" ") : errors}`)
        .join(" | ");
}

function saveToken(token) {
    state.token = token;
    localStorage.setItem("financePlannerToken", token);
}

function clearToken() {
    state.token = null;
    localStorage.removeItem("financePlannerToken");
}

function updateLayout() {
    const isLoggedIn = Boolean(state.token);
    els.authSection.classList.toggle("hidden", isLoggedIn);
    els.appSection.classList.toggle("hidden", !isLoggedIn);
    els.logoutButton.classList.toggle("hidden", !isLoggedIn);
}

function normalizeList(data) {
    return Array.isArray(data) ? data : data?.results || [];
}

async function requestList(url) {
    const items = [];
    let nextUrl = url;

    while (nextUrl) {
        const data = await request(nextUrl);

        if (Array.isArray(data)) {
            items.push(...data);
            nextUrl = null;
        } else {
            items.push(...(data.results || []));
            nextUrl = data.next;
        }
    }

    return items;
}

function money(value) {
    const number = Number(value || 0);
    return number.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

async function loadDashboard() {
    if (!state.token) {
        updateLayout();
        return;
    }

    updateLayout();

    try {
        const [categoriesData, transactionsData, statsData] = await Promise.all([
            requestList(`${api.categories}?ordering=name`),
            requestList(`${api.transactions}?ordering=-date`),
            request(api.statistics),
        ]);

        state.categories = categoriesData;
        state.transactions = transactionsData;

        renderCategories();
        renderCategoryOptions();
        renderTransactions();
        renderStats(statsData);
    } catch (error) {
        clearToken();
        updateLayout();
        showMessage(error.message, "error");
    }
}

function renderStats(stats) {
    els.incomeValue.textContent = money(stats?.income);
    els.expenseValue.textContent = money(stats?.expense);
    els.balanceValue.textContent = money(stats?.balance);
}

function renderCategories() {
    if (!state.categories.length) {
        els.categoriesList.className = "list empty-state";
        els.categoriesList.textContent = "No categories yet. Create one before adding transactions.";
        return;
    }

    els.categoriesList.className = "list";
    els.categoriesList.innerHTML = state.categories
        .map(category => `
            <div class="category-item">
                <strong>${escapeHtml(category.name)}</strong>
                <span class="badge ${category.type}">${category.type}</span>
            </div>
        `)
        .join("");
}

function renderCategoryOptions() {
    if (!state.categories.length) {
        els.transactionCategory.innerHTML = '<option value="">Create a category first</option>';
        els.transactionForm.querySelector("button").disabled = true;
        return;
    }

    els.transactionForm.querySelector("button").disabled = false;
    els.transactionCategory.innerHTML = state.categories
        .map(category => `<option value="${category.id}">${escapeHtml(category.name)} (${category.type})</option>`)
        .join("");
}

function renderTransactions() {
    if (!state.transactions.length) {
        els.transactionsList.className = "table-wrap empty-state";
        els.transactionsList.textContent = "No transactions yet.";
        return;
    }

    els.transactionsList.className = "table-wrap";
    els.transactionsList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${state.transactions.map(transaction => {
                    const type = transaction.category_type || "expense";
                    const sign = type === "income" ? "+" : "-";
                    return `
                        <tr>
                            <td>${transaction.date}</td>
                            <td>${escapeHtml(transaction.category_name || "Unknown")}</td>
                            <td><span class="badge ${type}">${type}</span></td>
                            <td>${escapeHtml(transaction.description || "—")}</td>
                            <td class="amount-${type}">${sign}${money(transaction.amount)}</td>
                            <td><button class="delete-button" data-delete-id="${transaction.id}" type="button">Delete</button></td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const data = await request(api.login, {
            method: "POST",
            body: JSON.stringify(getFormData(els.loginForm)),
        });

        saveToken(data.key);
        els.loginForm.reset();
        showMessage("Logged in successfully.");
        await loadDashboard();
    } catch (error) {
        showMessage(error.message, "error");
    }
});

els.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const data = await request(api.register, {
            method: "POST",
            body: JSON.stringify(getFormData(els.registerForm)),
        });

        if (data.key) {
            saveToken(data.key);
        }

        els.registerForm.reset();
        showMessage("Account created successfully.");
        await loadDashboard();
    } catch (error) {
        showMessage(error.message, "error");
    }
});

els.logoutButton.addEventListener("click", async () => {
    try {
        if (state.token) {
            await request(api.logout, { method: "POST" });
        }
    } catch (_) {
        // Local logout should still work even if server logout fails.
    } finally {
        clearToken();
        updateLayout();
        showMessage("Logged out.");
    }
});

els.categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        await request(api.categories, {
            method: "POST",
            body: JSON.stringify(getFormData(els.categoryForm)),
        });

        els.categoryForm.reset();
        showMessage("Category added.");
        await loadDashboard();
    } catch (error) {
        showMessage(error.message, "error");
    }
});

els.transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = getFormData(els.transactionForm);

    try {
        await request(api.transactions, {
            method: "POST",
            body: JSON.stringify(payload),
        });

        els.transactionForm.reset();
        setToday();
        showMessage("Transaction saved.");
        await loadDashboard();
    } catch (error) {
        showMessage(error.message, "error");
    }
});

els.transactionsList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-id]");
    if (!button) return;

    const id = button.dataset.deleteId;

    try {
        await request(`${api.transactions}${id}/`, { method: "DELETE" });
        showMessage("Transaction deleted.");
        await loadDashboard();
    } catch (error) {
        showMessage(error.message, "error");
    }
});

els.refreshButton.addEventListener("click", loadDashboard);

function setToday() {
    const dateInput = els.transactionForm.querySelector('input[name="date"]');
    dateInput.value = new Date().toISOString().slice(0, 10);
}

setToday();
loadDashboard();
