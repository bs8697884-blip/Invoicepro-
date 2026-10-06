/* =========================================================
   INVOICEPRO V2
   Billing + Inventory + Customers + Reports
   LocalStorage based
========================================================= */

"use strict";

/* =========================
   STORAGE
========================= */

const STORAGE = {
  products: "invoicepro_v2_products",
  customers: "invoicepro_v2_customers",
  invoices: "invoicepro_v2_invoices",
  settings: "invoicepro_v2_settings"
};

let products = loadData(STORAGE.products, []);
let customers = loadData(STORAGE.customers, []);
let invoices = loadData(STORAGE.invoices, []);

let settings = loadData(STORAGE.settings, {
  businessName: "InvoicePro",
  businessAddress: "",
  businessPhone: "",
  businessEmail: "",
  businessGSTIN: "",
  invoicePrefix: "INV-",
  defaultGST: 5,
  paymentTerms: "Payment due within 7 days.",
  notes: "",
  terms: "Thank you for your business."
});

let invoiceItems = [];
let editingInvoiceId = null;


/* =========================
   BASIC HELPERS
========================= */

function loadData(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.error("Storage error:", error);
    return fallback;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function money(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(number);
}

function number(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function todayISO() {
  const date = new Date();
  return date.toISOString().split("T")[0];
}

function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function uid(prefix = "id") {
  return prefix + "_" + Date.now() + "_" + Math.random()
    .toString(36)
    .substring(2, 8);
}


/* =========================
   INITIALIZATION
========================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  setDefaultDates();
  loadSettingsIntoForm();
  setupNavigation();
  setupButtons();
  renderEverything();
  updateInvoiceNumber();
  calculateInvoice();
}


/* =========================
   NAVIGATION
========================= */

function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      const target = link.dataset.page;

      if (target) {
        showPage(target);
      }
    });
  });
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active-page");
  });

  const page = document.getElementById(pageName);

  if (page) {
    page.classList.add("active-page");
  }

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");

    if (link.dataset.page === pageName) {
      link.classList.add("active");
    }
  });

  const titles = {
    dashboard: ["Dashboard", "Your business overview"],
    invoice: ["New Invoice", "Create a professional invoice"],
    invoices: ["Invoices", "Manage your invoices"],
    inventory: ["Inventory", "Manage products and stock"],
    customers: ["Customers", "Manage your customers"],
    reports: ["Reports", "Sales and business insights"],
    settings: ["Settings", "Configure InvoicePro"]
  };

  const title = titles[pageName];

  if (title) {
    const heading = document.getElementById("topbarTitle");
    const subtitle = document.getElementById("topbarSubtitle");

    if (heading) heading.textContent = title[0];
    if (subtitle) subtitle.textContent = title[1];
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  renderEverything();
}


/* =========================
   BUTTONS
========================= */

function setupButtons() {

  const newInvoiceButtons = [
    "newInvoiceBtn",
    "createInvoiceBtn",
    "dashboardCreateInvoice"
  ];

  newInvoiceButtons.forEach(id => {
    const button = document.getElementById(id);

    if (button) {
      button.addEventListener("click", () => {
        clearInvoice();
        showPage("invoice");
      });
    }
  });

  const addItem = document.getElementById("addItemBtn");

  if (addItem) {
    addItem.addEventListener("click", addInvoiceItem);
  }

  const saveInvoice = document.getElementById("saveInvoiceBtn");

  if (saveInvoice) {
    saveInvoice.addEventListener("click", saveInvoiceData);
  }

  const printInvoice = document.getElementById("printInvoiceBtn");

  if (printInvoice) {
    printInvoice.addEventListener("click", () => {
      updatePrintableInvoice();
      window.print();
    });
  }

  const clearBtn = document.getElementById("clearInvoiceBtn");

  if (clearBtn) {
    clearBtn.addEventListener("click", clearInvoice);
  }

  const productSelect = document.getElementById("productSelect");

  if (productSelect) {
    productSelect.addEventListener("change", productSelected);
  }

  const customerSelect = document.getElementById("customerSelect");

  if (customerSelect) {
    customerSelect.addEventListener("change", customerSelected);
  }

  const itemInputs = [
    "itemQty",
    "itemRate",
    "itemDiscount",
    "itemGST"
  ];

  itemInputs.forEach(id => {
    const element = document.getElementById(id);

    if (element) {
      element.addEventListener("input", () => {
        updateItemPreview();
      });
    }
  });

  setupSearches();
  setupModals();
}


/* =========================
   DATES
========================= */

function setDefaultDates() {
  const invoiceDate = document.getElementById("invoiceDate");
  const dueDate = document.getElementById("dueDate");

  if (invoiceDate && !invoiceDate.value) {
    invoiceDate.value = todayISO();
  }

  if (dueDate && !dueDate.value) {
    dueDate.value = addDays(todayISO(), 7);
  }
}


/* =========================
   INVOICE NUMBER
========================= */

function getNextInvoiceNumber() {
  const prefix = settings.invoicePrefix || "INV-";

  let highest = 0;

  invoices.forEach(invoice => {
    const match = String(invoice.invoiceNumber || "")
      .match(/(\d+)$/);

    if (match) {
      highest = Math.max(highest, Number(match[1]));
    }
  });

  return prefix + String(highest + 1).padStart(4, "0");
}

function updateInvoiceNumber() {
  const input = document.getElementById("invoiceNumber");

  if (input && !editingInvoiceId) {
    input.value = getNextInvoiceNumber();
  }
}


/* =========================
   CUSTOMER
========================= */

function customerSelected() {
  const select = document.getElementById("customerSelect");

  if (!select) return;

  const customer = customers.find(c => c.id === select.value);

  if (!customer) return;

  setValue("customerName", customer.name);
  setValue("customerGSTIN", customer.gstin);
  setValue("customerAddress", customer.address);
  setValue("customerPhone", customer.phone);
  setValue("customerEmail", customer.email);
}

function saveCurrentCustomerIfNeeded() {
  const name = getValue("customerName").trim();

  if (!name) return null;

  const gstin = getValue("customerGSTIN").trim();
  const address = getValue("customerAddress").trim();
  const phone = getValue("customerPhone").trim();
  const email = getValue("customerEmail").trim();

  let customer = customers.find(c =>
    c.name.toLowerCase() === name.toLowerCase() &&
    (phone ? c.phone === phone : true)
  );

  if (customer) {
    customer.gstin = gstin;
    customer.address = address;
    customer.phone = phone;
    customer.email = email;
  } else {
    customer = {
      id: uid("cust"),
      name,
      gstin,
      address,
      phone,
      email,
      createdAt: new Date().toISOString()
    };

    customers.push(customer);
  }

  saveData(STORAGE.customers, customers);

  return customer;
}


/* =========================
   PRODUCT
========================= */

function productSelected() {
  const select = document.getElementById("productSelect");

  if (!select) return;

  const product = products.find(p => p.id === select.value);

  if (!product) return;

  setValue("itemHSN", product.hsn);
  setValue("itemRate", product.sellingPrice);
  setValue("itemGST", product.gst);
}

function addInvoiceItem() {

  const productId = getValue("productSelect");
  const product = products.find(p => p.id === productId);

  const name = product
    ? product.name
    : getValue("productSelectText") || "Item";

  const hsn = getValue("itemHSN");
  const qty = Number(getValue("itemQty")) || 1;
  const rate = Number(getValue("itemRate")) || 0;
  const discount = Number(getValue("itemDiscount")) || 0;
  const gst = Number(getValue("itemGST")) || 0;

  if (qty <= 0) {
    alert("Quantity must be greater than 0.");
    return;
  }

  if (rate < 0) {
    alert("Rate cannot be negative.");
    return;
  }

  const item = {
    id: uid("item"),
    productId: product ? product.id : "",
    name,
    hsn,
    qty,
    rate,
    discount,
    gst
  };

  invoiceItems.push(item);

  renderInvoiceItems();
  calculateInvoice();
  clearItemEntry();
}

function clearItemEntry() {
  setValue("productSelect", "");
  setValue("itemHSN", "");
  setValue("itemQty", 1);
  setValue("itemRate", "");
  setValue("itemDiscount", 0);
  setValue("itemGST", settings.defaultGST || 5);
}

function updateItemPreview() {
  /* Keeps the current entry ready for adding.
     Main invoice calculation happens after adding. */
}

function renderProductSelect() {
  const select = document.getElementById("productSelect");

  if (!select) return;

  const oldValue = select.value;

  select.innerHTML = `
    <option value="">Select product</option>
    ${products.map(product => `
      <option value="${escapeHTML(product.id)}">
        ${escapeHTML(product.name)}
        ${product.stock !== undefined ? ` - Stock: ${product.stock}` : ""}
      </option>
    `).join("")}
  `;

  if (products.some(p => p.id === oldValue)) {
    select.value = oldValue;
  }
}


/* =========================
   INVOICE ITEMS
========================= */

function calculateItem(item) {

  const gross = number(item.qty * item.rate);

  const discountAmount = number(
    gross * (Number(item.discount) || 0) / 100
  );

  const taxable = number(gross - discountAmount);

  const gstAmount = number(
    taxable * (Number(item.gst) || 0) / 100
  );

  const cgst = number(gstAmount / 2);
  const sgst = number(gstAmount / 2);

  const total = number(taxable + gstAmount);

  return {
    gross,
    discountAmount,
    taxable,
    gstAmount,
    cgst,
    sgst,
    total
  };
}

function calculateInvoice() {

  let subtotal = 0;
  let discount = 0;
  let taxable = 0;
  let cgst = 0;
  let sgst = 0;
  let gst = 0;
  let grandTotal = 0;

  invoiceItems.forEach(item => {

    const result = calculateItem(item);

    subtotal += result.gross;
    discount += result.discountAmount;
    taxable += result.taxable;
    cgst += result.cgst;
    sgst += result.sgst;
    gst += result.gstAmount;
    grandTotal += result.total;
  });

  subtotal = number(subtotal);
  discount = number(discount);
  taxable = number(taxable);
  cgst = number(cgst);
  sgst = number(sgst);
  gst = number(gst);
  grandTotal = number(grandTotal);

  setText("summarySubtotal", money(subtotal));
  setText("summaryDiscount", money(discount));
  setText("summaryTaxable", money(taxable));
  setText("summaryCGST", money(cgst));
  setText("summarySGST", money(sgst));
  setText("summaryGST", money(gst));
  setText("summaryGrandTotal", money(grandTotal));

  const words = numberToIndianWords(grandTotal);

  setText("amountInWords", words);

  return {
    subtotal,
    discount,
    taxable,
    cgst,
    sgst,
    gst,
    grandTotal
  };
}

function renderInvoiceItems() {

  const tbody = document.getElementById("invoiceItemsBody");

  if (!tbody) return;

  if (!invoiceItems.length) {

    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">
          No items added yet.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = invoiceItems.map((item, index) => {

    const result = calculateItem(item);

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(item.name)}</td>
        <td>${escapeHTML(item.hsn || "-")}</td>
        <td>${item.qty}</td>
        <td>${money(item.rate)}</td>
        <td>${item.discount}%</td>
        <td>${item.gst}%</td>
        <td>${money(result.total)}</td>
        <td>
          <button
            class="delete-item"
            onclick="removeInvoiceItem('${item.id}')">
            ×
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function removeInvoiceItem(id) {

  invoiceItems = invoiceItems.filter(item => item.id !== id);

  renderInvoiceItems();
  calculateInvoice();
}


/* =========================
   SAVE INVOICE
========================= */

function saveInvoiceData() {

  if (!invoiceItems.length) {
    alert("Add at least one product to the invoice.");
    return;
  }

  const customer = saveCurrentCustomerIfNeeded();

  const totals = calculateInvoice();

  const invoiceNumber =
    getValue("invoiceNumber") || getNextInvoiceNumber();

  const invoiceDate =
    getValue("invoiceDate") || todayISO();

  const dueDate =
    getValue("dueDate") || addDays(invoiceDate, 7);

  const paymentStatus =
    getValue("paymentStatus") || "pending";

  const paymentMethod =
    getValue("paymentMethod") || "Cash";

  const invoice = {
    id: editingInvoiceId || uid("inv"),
    invoiceNumber,
    invoiceDate,
    dueDate,

    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          gstin: customer.gstin,
          address: customer.address,
          phone: customer.phone,
          email: customer.email
        }
      : {
          name: getValue("customerName"),
          gstin: getValue("customerGSTIN"),
          address: getValue("customerAddress"),
          phone: getValue("customerPhone"),
          email: getValue("customerEmail")
        },

    items: JSON.parse(JSON.stringify(invoiceItems)),

    totals,

    paymentStatus,
    paymentMethod,

    notes: getValue("invoiceNotes"),
    terms: getValue("invoiceTerms"),

    createdAt: new Date().toISOString()
  };

  if (editingInvoiceId) {

    const oldIndex =
      invoices.findIndex(i => i.id === editingInvoiceId);

    if (oldIndex !== -1) {
      invoices[oldIndex] = invoice;
    }

  } else {

    invoices.push(invoice);

    deductInventory(invoice.items);
  }

  saveData(STORAGE.invoices, invoices);
  saveData(STORAGE.products, products);
  saveData(STORAGE.customers, customers);

  editingInvoiceId = null;

  alert("Invoice saved successfully.");

  updateInvoiceNumber();
  renderEverything();

  showPage("invoices");
}


/* =========================
   INVENTORY DEDUCTION
========================= */

function deductInventory(items) {

  items.forEach(item => {

    if (!item.productId) return;

    const product =
      products.find(p => p.id === item.productId);

    if (!product) return;

    product.stock =
      number(product.stock || 0) -
      number(item.qty);

    if (product.stock < 0) {
      product.stock = 0;
    }
  });
}


/* =========================
   CLEAR INVOICE
========================= */

function clearInvoice() {

  editingInvoiceId = null;
  invoiceItems = [];

  const fields = [
    "customerName",
    "customerGSTIN",
    "customerAddress",
    "customerPhone",
    "customerEmail",
    "invoiceNotes",
    "invoiceTerms",
    "itemHSN",
    "itemRate"
  ];

  fields.forEach(id => setValue(id, ""));

  setValue("customerSelect", "");
  setValue("productSelect", "");
  setValue("itemQty", 1);
  setValue("itemDiscount", 0);
  setValue("itemGST", settings.defaultGST || 5);
  setValue("paymentStatus", "pending");
  setValue("paymentMethod", "Cash");

  setValue("invoiceDate", todayISO());
  setValue("dueDate", addDays(todayISO(), 7));

  updateInvoiceNumber();

  renderInvoiceItems();
  calculateInvoice();
}


/* =========================
   INVOICE HISTORY
========================= */

function renderInvoices() {

  const tbody = document.getElementById("invoicesTableBody");

  if (!tbody) return;

  if (!invoices.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No invoices created yet.
        </td>
      </tr>
    `;

    return;
  }

  const search =
    (getValue("invoiceSearch") || "").toLowerCase();

  const status =
    getValue("invoiceStatusFilter") || "all";

  const filtered = invoices.filter(invoice => {

    const text = [
      invoice.invoiceNumber,
      invoice.customer?.name
    ]
      .join(" ")
      .toLowerCase();

    const searchMatch =
      !search || text.includes(search);

    const statusMatch =
      status === "all" ||
      invoice.paymentStatus === status;

    return searchMatch && statusMatch;
  });

  if (!filtered.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state small">
            No matching invoices.
          </div>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = filtered
    .slice()
    .reverse()
    .map(invoice => {

      const status = invoice.paymentStatus || "pending";

      return `
        <tr>

          <td>
            <strong>
              ${escapeHTML(invoice.invoiceNumber)}
            </strong>
          </td>

          <td>
            ${escapeHTML(invoice.invoiceDate)}
          </td>

          <td>
            ${escapeHTML(invoice.customer?.name || "Walk-in Customer")}
          </td>

          <td>
            ${money(invoice.totals?.taxable || 0)}
          </td>

          <td>
            ${money(invoice.totals?.gst || 0)}
          </td>

          <td>
            <strong>
              ${money(invoice.totals?.grandTotal || 0)}
            </strong>
          </td>

          <td>
            <span class="badge ${escapeHTML(status)}">
              ${escapeHTML(status)}
            </span>
          </td>

          <td>

            <button
              class="action-btn"
              onclick="printSavedInvoice('${invoice.id}')">
              Print
            </button>

            <button
              class="action-btn danger"
              onclick="deleteInvoice('${invoice.id}')">
              Delete
            </button>

          </td>

        </tr>
      `;
    }).join("");
}

function deleteInvoice(id) {

  const invoice =
    invoices.find(i => i.id === id);

  if (!invoice) return;

  const confirmed =
    confirm(
      `Delete ${invoice.invoiceNumber}?`
    );

  if (!confirmed) return;

  invoices =
    invoices.filter(i => i.id !== id);

  saveData(STORAGE.invoices, invoices);

  renderEverything();
}

function printSavedInvoice(id) {

  const invoice =
    invoices.find(i => i.id === id);

  if (!invoice) return;

  populatePrintInvoice(invoice);

  window.print();
}


/* =========================
   INVENTORY
========================= */

function renderInventory() {

  const tbody =
    document.getElementById("inventoryTableBody");

  if (!tbody) return;

  const search =
    (getValue("inventorySearch") || "").toLowerCase();

  const category =
    getValue("inventoryCategoryFilter") || "all";

  const filtered = products.filter(product => {

    const text = [
      product.name,
      product.sku,
      product.category,
      product.hsn
    ].join(" ").toLowerCase();

    const searchMatch =
      !search || text.includes(search);

    const categoryMatch =
      category === "all" ||
      product.category === category;

    return searchMatch && categoryMatch;
  });

  if (!filtered.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <div class="empty-icon">+</div>
            <h3>No products</h3>
            <p>Add your first product to start tracking inventory.</p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = filtered.map(product => {

    const stock = Number(product.stock) || 0;
    const limit = Number(product.lowStock) || 0;

    const low = stock <= limit;

    return `
      <tr>

        <td>
          <strong>${escapeHTML(product.name)}</strong>
        </td>

        <td>
          ${escapeHTML(product.sku || "-")}
        </td>

        <td>
          ${escapeHTML(product.category || "-")}
        </td>

        <td>
          ${escapeHTML(product.hsn || "-")}
        </td>

        <td>
          ${money(product.purchasePrice)}
        </td>

        <td>
          ${money(product.sellingPrice)}
        </td>

        <td>
          <strong class="${low ? "low-stock" : ""}">
            ${stock}
          </strong>
        </td>

        <td>
          ${product.gst}%
        </td>

        <td>

          <button
            class="action-btn"
            onclick="editProduct('${product.id}')">
            Edit
          </button>

          <button
            class="action-btn danger"
            onclick="deleteProduct('${product.id}')">
            Delete
          </button>

        </td>

      </tr>
    `;
  }).join("");

  updateInventoryStats();
}

function updateInventoryStats() {

  const totalProducts = products.length;

  const totalStock =
    products.reduce(
      (sum, p) => sum + (Number(p.stock) || 0),
      0
    );

  const lowStock =
    products.filter(p =>
      Number(p.stock) <= Number(p.lowStock || 0)
    ).length;

  const stockValue =
    products.reduce(
      (sum, p) =>
        sum +
        (Number(p.stock) || 0) *
        (Number(p.purchasePrice) || 0),
      0
    );

  setText("inventoryProductCount", totalProducts);
  setText("inventoryStockCount", totalStock);
  setText("inventoryLowStockCount", lowStock);
  setText("inventoryStockValue", money(stockValue));
}


/* =========================
   PRODUCT MODAL
========================= */

function setupModals() {

  document.querySelectorAll(".close-btn").forEach(button => {

    button.addEventListener("click", () => {
      closeAllModals();
    });

  });

  document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", event => {

      if (event.target === modal) {
        closeAllModals();
      }

    });

  });
}

function openProductModal(id = null) {

  const modal =
    document.getElementById("productModal");

  if (!modal) return;

  modal.classList.add("show");

  clearProductForm();

  if (id) {
    const product = products.find(p => p.id === id);

    if (!product) return;

    setValue("productEditId", product.id);
    setValue("productName", product.name);
    setValue("productSKU", product.sku);
    setValue("productCategory", product.category);
    setValue("productHSN", product.hsn);
    setValue("productPurchasePrice", product.purchasePrice);
    setValue("productSellingPrice", product.sellingPrice);
    setValue("productGST", product.gst);
    setValue("productStock", product.stock);
    setValue("productLowStock", product.lowStock);
  }
}

function clearProductForm() {

  [
    "productEditId",
    "productName",
    "productSKU",
    "productCategory",
    "productHSN",
    "productPurchasePrice",
    "productSellingPrice"
  ].forEach(id => setValue(id, ""));

  setValue("productGST", settings.defaultGST || 5);
  setValue("productStock", 0);
  setValue("productLowStock", 5);
}

function saveProduct() {

  const name =
    getValue("productName").trim();

  if (!name) {
    alert("Product name is required.");
    return;
  }

  const data = {
    name,
    sku: getValue("productSKU"),
    category: getValue("productCategory"),
    hsn: getValue("productHSN"),
    purchasePrice: Number(getValue("productPurchasePrice")) || 0,
    sellingPrice: Number(getValue("productSellingPrice")) || 0,
    gst: Number(getValue("productGST")) || 0,
    stock: Number(getValue("productStock")) || 0,
    lowStock: Number(getValue("productLowStock")) || 0
  };

  const editId =
    getValue("productEditId");

  if (editId) {

    const index =
      products.findIndex(p => p.id === editId);

    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...data
      };
    }

  } else {

    products.push({
      id: uid("prod"),
      ...data,
      createdAt: new Date().toISOString()
    });

  }

  saveData(STORAGE.products, products);

  closeAllModals();
  renderEverything();
}

function editProduct(id) {
  openProductModal(id);
}

function deleteProduct(id) {

  const product =
    products.find(p => p.id === id);

  if (!product) return;

  if (!confirm(`Delete ${product.name}?`)) {
    return;
  }

  products =
    products.filter(p => p.id !== id);

  saveData(STORAGE.products, products);

  renderEverything();
}


/* =========================
   CUSTOMER LIST
========================= */

function renderCustomers() {

  const tbody =
    document.getElementById("customersTableBody");

  if (!tbody) return;

  const search =
    (getValue("customerSearch") || "").toLowerCase();

  const filtered =
    customers.filter(customer => {

      const text = [
        customer.name,
        customer.phone,
        customer.email,
        customer.gstin
      ].join(" ").toLowerCase();

      return !search || text.includes(search);
    });

  if (!filtered.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon">+</div>
            <h3>No customers</h3>
            <p>Your saved customers will appear here.</p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    filtered.map(customer => {

      const customerInvoices =
        invoices.filter(i =>
          i.customer?.id === customer.id ||
          i.customer?.name === customer.name
        );

      const total =
        customerInvoices.reduce(
          (sum, invoice) =>
            sum + Number(invoice.totals?.grandTotal || 0),
          0
        );

      return `
        <tr>

          <td>
            <strong>${escapeHTML(customer.name)}</strong>
          </td>

          <td>
            ${escapeHTML(customer.phone || "-")}
          </td>

          <td>
            ${escapeHTML(customer.email || "-")}
          </td>

          <td>
            ${escapeHTML(customer.gstin || "-")}
          </td>

          <td>
            ${customerInvoices.length}
          </td>

          <td>
            ${money(total)}
          </td>

          <td>
            <button
              class="action-btn"
              onclick="editCustomer('${customer.id}')">
              Edit
            </button>

            <button
              class="action-btn danger"
              onclick="deleteCustomer('${customer.id}')">
              Delete
            </button>
          </td>

        </tr>
      `;
    }).join("");
}


/* =========================
   CUSTOMER MODAL
========================= */

function openCustomerModal(id = null) {

  const modal =
    document.getElementById("customerModal");

  if (!modal) return;

  modal.classList.add("show");

  clearCustomerForm();

  if (id) {

    const customer =
      customers.find(c => c.id === id);

    if (!customer) return;

    setValue("customerEditId", customer.id);
    setValue("modalCustomerName", customer.name);
    setValue("modalCustomerGSTIN", customer.gstin);
    setValue("modalCustomerAddress", customer.address);
    setValue("modalCustomerPhone", customer.phone);
    setValue("modalCustomerEmail", customer.email);
  }
}

function clearCustomerForm() {

  [
    "customerEditId",
    "modalCustomerName",
    "modalCustomerGSTIN",
    "modalCustomerAddress",
    "modalCustomerPhone",
    "modalCustomerEmail"
  ].forEach(id => setValue(id, ""));
}

function saveCustomer() {

  const name =
    getValue("modalCustomerName").trim();

  if (!name) {
    alert("Customer name is required.");
    return;
  }

  const data = {
    name,
    gstin: getValue("modalCustomerGSTIN"),
    address: getValue("modalCustomerAddress"),
    phone: getValue("modalCustomerPhone"),
    email: getValue("modalCustomerEmail")
  };

  const editId =
    getValue("customerEditId");

  if (editId) {

    const index =
      customers.findIndex(c => c.id === editId);

    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        ...data
      };
    }

  } else {

    customers.push({
      id: uid("cust"),
      ...data,
      createdAt: new Date().toISOString()
    });

  }

  saveData(STORAGE.customers, customers);

  closeAllModals();
  renderEverything();
}

function editCustomer(id) {
  openCustomerModal(id);
}

function deleteCustomer(id) {

  const customer =
    customers.find(c => c.id === id);

  if (!customer) return;

  if (!confirm(`Delete ${customer.name}?`)) {
    return;
  }

  customers =
    customers.filter(c => c.id !== id);

  saveData(STORAGE.customers, customers);

  renderEverything();
}


/* =========================
   CUSTOMER SELECT
========================= */

function renderCustomerSelect() {

  const select =
    document.getElementById("customerSelect");

  if (!select) return;

  const oldValue = select.value;

  select.innerHTML = `
    <option value="">Walk-in Customer</option>

    ${customers.map(customer => `
      <option value="${escapeHTML(customer.id)}">
        ${escapeHTML(customer.name)}
      </option>
    `).join("")}
  `;

  if (customers.some(c => c.id === oldValue)) {
    select.value = oldValue;
  }
}


/* =========================
   DASHBOARD
========================= */

function renderDashboard() {

  const totalSales =
    invoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.totals?.grandTotal || 0),
      0
    );

  const paid =
    invoices.filter(i =>
      i.paymentStatus === "paid"
    ).length;

  const pending =
    invoices.filter(i =>
      i.paymentStatus === "pending"
    ).length;

  const lowStock =
    products.filter(p =>
      Number(p.stock) <= Number(p.lowStock || 0)
    ).length;

  setText("dashboardSales", money(totalSales));
  setText("dashboardInvoices", invoices.length);
  setText("dashboardCustomers", customers.length);
  setText("dashboardLowStock", lowStock);

  renderRecentInvoices();
  renderLowStockProducts();
}

function renderRecentInvoices() {

  const container =
    document.getElementById("recentInvoices");

  if (!container) return;

  const recent =
    invoices.slice()
      .sort((a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
      )
      .slice(0, 5);

  if (!recent.length) {

    container.innerHTML = `
      <div class="empty-state small">
        No invoices yet.
      </div>
    `;

    return;
  }

  container.innerHTML = recent.map(invoice => `
    <div class="recent-row">

      <div>
        <strong>
          ${escapeHTML(invoice.invoiceNumber)}
        </strong>

        <small>
          ${escapeHTML(invoice.customer?.name || "Walk-in Customer")}
        </small>
      </div>

      <strong>
        ${money(invoice.totals?.grandTotal || 0)}
      </strong>

    </div>
  `).join("");
}

function renderLowStockProducts() {

  const container =
    document.getElementById("lowStockProducts");

  if (!container) return;

  const low =
    products.filter(p =>
      Number(p.stock) <= Number(p.lowStock || 0)
    );

  if (!low.length) {

    container.innerHTML = `
      <div class="empty-state small">
        <h3>Stock looks healthy</h3>
        <p>No low-stock products.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = low.map(product => `
    <div class="recent-row">

      <div>
        <strong>
          ${escapeHTML(product.name)}
        </strong>

        <small>
          Limit: ${product.lowStock}
        </small>
      </div>

      <strong>
        ${product.stock}
      </strong>

    </div>
  `).join("");
}


/* =========================
   REPORTS
========================= */

function renderReports() {

  const sales =
    invoices.reduce(
      (sum, i) =>
        sum + Number(i.totals?.grandTotal || 0),
      0
    );

  const gst =
    invoices.reduce(
      (sum, i) =>
        sum + Number(i.totals?.gst || 0),
      0
    );

  const paid =
    invoices
      .filter(i => i.paymentStatus === "paid")
      .reduce(
        (sum, i) =>
          sum + Number(i.totals?.grandTotal || 0),
        0
      );

  const pending =
    invoices
      .filter(i => i.paymentStatus === "pending")
      .reduce(
        (sum, i) =>
          sum + Number(i.totals?.grandTotal || 0),
        0
      );

  setText("reportSales", money(sales));
  setText("reportGST", money(gst));
  setText("reportPaid", money(paid));
  setText("reportPending", money(pending));

  renderMonthlySales();
}

function renderMonthlySales() {

  const container =
    document.getElementById("monthlySalesChart");

  if (!container) return;

  const months = [];

  const now = new Date();

  for (let i = 5; i >= 0; i--) {

    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    months.push({
      month: date.getMonth(),
      year: date.getFullYear(),
      label: date.toLocaleString("en-IN", {
        month: "short"
      }),
      total: 0
    });
  }

  invoices.forEach(invoice => {

    const date =
      new Date(invoice.invoiceDate);

    const month =
      months.find(m =>
        m.month === date.getMonth() &&
        m.year === date.getFullYear()
      );

    if (month) {
      month.total +=
        Number(invoice.totals?.grandTotal || 0);
    }
  });

  const max =
    Math.max(
      ...months.map(m => m.total),
      1
    );

  container.innerHTML =
    months.map(month => {

      const height =
        Math.max(
          3,
          (month.total / max) * 100
        );

      return `
        <div class="bar-wrap">

          <div class="bar-value">
            ${money(month.total)}
          </div>

          <div
            class="bar"
            style="height:${height}%">
          </div>

          <div class="bar-label">
            ${month.label}
          </div>

        </div>
      `;
    }).join("");
}


/* =========================
   SETTINGS
========================= */

function loadSettingsIntoForm() {

  setValue("businessName", settings.businessName);
  setValue("businessAddress", settings.businessAddress);
  setValue("businessPhone", settings.businessPhone);
  setValue("businessEmail", settings.businessEmail);
  setValue("businessGSTIN", settings.businessGSTIN);
  setValue("invoicePrefix", settings.invoicePrefix);
  setValue("defaultGST", settings.defaultGST);
  setValue("paymentTerms", settings.paymentTerms);
  setValue("defaultNotes", settings.notes);
  setValue("defaultTerms", settings.terms);
}

function saveSettings() {

  settings = {
    businessName:
      getValue("businessName"),

    businessAddress:
      getValue("businessAddress"),

    businessPhone:
      getValue("businessPhone"),

    businessEmail:
      getValue("businessEmail"),

    businessGSTIN:
      getValue("businessGSTIN"),

    invoicePrefix:
      getValue("invoicePrefix") || "INV-",

    defaultGST:
      Number(getValue("defaultGST")) || 0,

    paymentTerms:
      getValue("paymentTerms"),

    notes:
      getValue("defaultNotes"),

    terms:
      getValue("defaultTerms")
  };

  saveData(STORAGE.settings, settings);

  alert("Settings saved.");

  updateInvoiceNumber();
}


/* =========================
   SEARCH
========================= */

function setupSearches() {

  const invoiceSearch =
    document.getElementById("invoiceSearch");

  if (invoiceSearch) {
    invoiceSearch.addEventListener(
      "input",
      renderInvoices
    );
  }

  const invoiceFilter =
    document.getElementById("invoiceStatusFilter");

  if (invoiceFilter) {
    invoiceFilter.addEventListener(
      "change",
      renderInvoices
    );
  }

  const inventorySearch =
    document.getElementById("inventorySearch");

  if (inventorySearch) {
    inventorySearch.addEventListener(
      "input",
      renderInventory
    );
  }

  const customerSearch =
    document.getElementById("customerSearch");

  if (customerSearch) {
    customerSearch.addEventListener(
      "input",
      renderCustomers
    );
  }
}


/* =========================
   PRINTABLE INVOICE
========================= */

function updatePrintableInvoice() {

  const totals = calculateInvoice();

  const invoice = {
    invoiceNumber: getValue("invoiceNumber"),
    invoiceDate: getValue("invoiceDate"),
    dueDate: getValue("dueDate"),

    customer: {
      name: getValue("customerName"),
      gstin: getValue("customerGSTIN"),
      address: getValue("customerAddress"),
      phone: getValue("customerPhone"),
      email: getValue("customerEmail")
    },

    items: JSON.parse(JSON.stringify(invoiceItems)),

    totals,

    paymentStatus:
      getValue("paymentStatus"),

    paymentMethod:
      getValue("paymentMethod"),

    notes:
      getValue("invoiceNotes"),

    terms:
      getValue("invoiceTerms")
  };

  populatePrintInvoice(invoice);
}

function populatePrintInvoice(invoice) {

  setText(
    "printBusinessName",
    settings.businessName || "InvoicePro"
  );

  setText(
    "printBusinessAddress",
    settings.businessAddress
  );

  setText(
    "printBusinessPhone",
    settings.businessPhone
  );

  setText(
    "printBusinessEmail",
    settings.businessEmail
  );

  setText(
    "printBusinessGSTIN",
    settings.businessGSTIN
  );

  setText(
    "printInvoiceNumber",
    invoice.invoiceNumber
  );

  setText(
    "printInvoiceDate",
    invoice.invoiceDate
  );

  setText(
    "printDueDate",
    invoice.dueDate
  );

  setText(
    "printCustomerName",
    invoice.customer?.name || "Walk-in Customer"
  );

  setText(
    "printCustomerAddress",
    invoice.customer?.address || ""
  );

  setText(
    "printCustomerGSTIN",
    invoice.customer?.gstin || ""
  );

  setText(
    "printCustomerPhone",
    invoice.customer?.phone || ""
  );

  setText(
    "printPaymentStatus",
    invoice.paymentStatus || "pending"
  );

  setText(
    "printPaymentMethod",
    invoice.paymentMethod || ""
  );

  setText(
    "printSubtotal",
    money(invoice.totals?.subtotal || 0)
  );

  setText(
    "printDiscount",
    money(invoice.totals?.discount || 0)
  );

  setText(
    "printTaxable",
    money(invoice.totals?.taxable || 0)
  );

  setText(
    "printCGST",
    money(invoice.totals?.cgst || 0)
  );

  setText(
    "printSGST",
    money(invoice.totals?.sgst || 0)
  );

  setText(
    "printGrandTotal",
    money(invoice.totals?.grandTotal || 0)
  );

  setText(
    "printAmountWords",
    numberToIndianWords(
      invoice.totals?.grandTotal || 0
    )
  );

  setText(
    "printNotes",
    invoice.notes || settings.notes || ""
  );

  setText(
    "printTerms",
    invoice.terms || settings.terms || ""
  );

  const tbody =
    document.getElementById("printItemsBody");

  if (!tbody) return;

  tbody.innerHTML =
    (invoice.items || []).map((item, index) => {

      const result =
        calculateItem(item);

      return `
        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${escapeHTML(item.name)}
          </td>

          <td>
            ${escapeHTML(item.hsn || "-")}
          </td>

          <td>
            ${item.qty}
          </td>

          <td>
            ${money(item.rate)}
          </td>

          <td>
            ${item.discount}%
          </td>

          <td>
            ${item.gst}%
          </td>

          <td>
            ${money(result.total)}
          </td>

        </tr>
      `;
    }).join("");
}


/* =========================
   AMOUNT IN WORDS
   INDIAN NUMBER SYSTEM
========================= */

function numberToIndianWords(amount) {

  amount = number(amount);

  if (amount === 0) {
    return "Rupees Zero Only";
  }

  const rupees =
    Math.floor(amount);

  const paise =
    Math.round((amount - rupees) * 100);

  let result =
    "Rupees " +
    indianNumberWords(rupees);

  if (paise > 0) {
    result +=
      " and " +
      indianNumberWords(paise) +
      " Paise";
  }

  return result + " Only";
}

function indianNumberWords(num) {

  num = Math.floor(Number(num) || 0);

  if (num === 0) {
    return "Zero";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety"
  ];

  function belowThousand(n) {

    let words = "";

    if (n >= 100) {

      words +=
        ones[Math.floor(n / 100)] +
        " Hundred ";

      n %= 100;
    }

    if (n >= 20) {

      words +=
        tens[Math.floor(n / 10)];

      if (n % 10) {
        words +=
          " " + ones[n % 10];
      }

    } else if (n > 0) {

      words += ones[n];
    }

    return words.trim();
  }

  const parts = [];

  const crore =
    Math.floor(num / 10000000);

  num %= 10000000;

  const lakh =
    Math.floor(num / 100000);

  num %= 100000;

  const thousand =
    Math.floor(num / 1000);

  num %= 1000;

  if (crore) {
    parts.push(
      belowThousand(crore) + " Crore"
    );
  }

  if (lakh) {
    parts.push(
      belowThousand(lakh) + " Lakh"
    );
  }

  if (thousand) {
    parts.push(
      belowThousand(thousand) + " Thousand"
    );
  }

  if (num) {
    parts.push(
      belowThousand(num)
    );
  }

  return parts.join(" ");
}


/* =========================
   CLOSE MODALS
========================= */

function closeAllModals() {

  document.querySelectorAll(".modal").forEach(modal => {
    modal.classList.remove("show");
  });
}


/* =========================
   RENDER EVERYTHING
========================= */

function renderEverything() {

  renderCustomerSelect();
  renderProductSelect();

  renderInvoiceItems();

  renderInvoices();
  renderInventory();
  renderCustomers();

  renderDashboard();
  renderReports();

  loadSettingsIntoForm();
}


/* =========================
   DOM HELPERS
========================= */

function getValue(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.value
    : "";
}

function setValue(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value ?? "";
  }
}

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value ?? "";
  }
}


/* =========================
   GLOBAL FUNCTIONS
   Used by HTML onclick=""
========================= */

window.removeInvoiceItem = removeInvoiceItem;

window.openProductModal = openProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

window.openCustomerModal = openCustomerModal;
window.saveCustomer = saveCustomer;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;

window.deleteInvoice = deleteInvoice;
window.printSavedInvoice = printSavedInvoice;

window.saveSettings = saveSettings;

window.closeAllModals = closeAllModals;
