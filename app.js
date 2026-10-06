/* =========================================================
   INVOICEPRO APP.JS
   Version 5
   - Dashboard
   - Billing
   - 5 Invoice Templates
   - GST / CGST / SGST / IGST
   - Inventory
   - Customers
   - Invoices
   - Reports
   - Settings
   - LocalStorage
   - Printing
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE = {
  products: "invoicepro_v2_products",
  customers: "invoicepro_v2_customers",
  invoices: "invoicepro_v2_invoices",
  settings: "invoicepro_v2_settings"
};

const DEFAULT_SETTINGS = {
  businessName: "Your Business Name",
  businessAddress: "",
  businessPhone: "",
  businessEmail: "",
  businessGSTIN: "",
  invoicePrefix: "INV-",
  defaultGST: 18,
  paymentTerms: "Payment due within 15 days.",
  defaultNotes: "Thank you for your business.",
  defaultTerms: "Goods once sold are subject to the agreed terms.",
  bankName: "",
  accountName: "",
  accountNumber: "",
  ifsc: "",
  upi: "",
  logo: "",
  invoiceTemplate: "professional",
  taxMode: "auto"
};

let products = load(STORAGE.products, []);
let customers = load(STORAGE.customers, []);
let invoices = load(STORAGE.invoices, []);
let settings = {
  ...DEFAULT_SETTINGS,
  ...load(STORAGE.settings, {})
};

let currentInvoiceItems = [];
let editingInvoiceId = null;
let editingProductId = null;
let editingCustomerId = null;
let currentTemplate = settings.invoiceTemplate || "professional";

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Storage error:", error);
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

function money(value) {
  const n = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(n);
}

function number(value) {
  return Number(value) || 0;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

function setValue(id, value) {
  const el = $(id);
  if (el) el.value = value ?? "";
}

function getValue(id) {
  const el = $(id);
  return el ? el.value : "";
}

function showToast(message) {
  let toast = $("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* =========================================================
   NAVIGATION
   ========================================================= */

const PAGE_INFO = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your business"
  },
  invoice: {
    title: "New Invoice",
    subtitle: "Create a professional invoice"
  },
  invoices: {
    title: "Invoices",
    subtitle: "Manage your invoices"
  },
  inventory: {
    title: "Inventory",
    subtitle: "Manage products and stock"
  },
  customers: {
    title: "Customers",
    subtitle: "Manage your customers"
  },
  reports: {
    title: "Reports",
    subtitle: "Sales and GST overview"
  },
  settings: {
    title: "Settings",
    subtitle: "Configure InvoicePro"
  }
};

function navigate(page) {
  document.querySelectorAll(".page").forEach(el => {
    el.classList.remove("active");
  });

  const target = $("page-" + page);

  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll("[data-page]").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.page === page
    );
  });

  const info = PAGE_INFO[page] || PAGE_INFO.dashboard;

  setText("topbarTitle", info.title);
  setText("topbarSubtitle", info.subtitle);

  if (page === "dashboard") renderDashboard();
  if (page === "invoices") renderInvoices();
  if (page === "inventory") renderInventory();
  if (page === "customers") renderCustomers();
  if (page === "reports") renderReports();
  if (page === "invoice") prepareNewInvoice();
  if (page === "settings") loadSettingsForm();
}

function setupNavigation() {
  document.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      navigate(btn.dataset.page);
    });
  });
}

/* =========================================================
   INVOICE NUMBER
   ========================================================= */

function getNextInvoiceNumber() {
  const prefix = settings.invoicePrefix || "INV-";

  let highest = 0;

  invoices.forEach(inv => {
    const match = String(inv.number || "").match(/(\d+)$/);

    if (match) {
      highest = Math.max(
        highest,
        parseInt(match[1], 10)
      );
    }
  });

  return (
    prefix +
    String(highest + 1).padStart(4, "0")
  );
}

/* =========================================================
   DATES
   ========================================================= */

function todayISO() {
  const d = new Date();

  const local = new Date(
    d.getTime() -
      d.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const d = new Date(dateString + "T00:00:00");

  d.setDate(d.getDate() + days);

  return d.toISOString().slice(0, 10);
}

/* =========================================================
   NEW INVOICE
   ========================================================= */

function prepareNewInvoice() {
  if (editingInvoiceId) return;

  setValue("invoiceNumber", getNextInvoiceNumber());
  setValue("invoiceDate", todayISO());
  setValue("dueDate", addDays(todayISO(), 15));

  setValue(
    "invoiceNotes",
    settings.defaultNotes
  );

  setValue(
    "invoiceTerms",
    settings.defaultTerms
  );

  setValue(
    "paymentStatus",
    "Pending"
  );

  setValue(
    "paymentMethod",
    "Bank Transfer"
  );

  currentInvoiceItems = [];

  populateCustomerSelect();
  populateProductSelect();

  clearCustomerFields();
  renderInvoiceItems();
  calculateInvoice();

  setTemplate(currentTemplate);
}

/* =========================================================
   CUSTOMER SELECT
   ========================================================= */

function populateCustomerSelect() {
  const select = $("customerSelect");

  if (!select) return;

  const oldValue = select.value;

  select.innerHTML =
    `<option value="">Select customer</option>` +
    customers
      .map(c =>
        `<option value="${escapeHTML(c.id)}">
          ${escapeHTML(c.name)}
        </option>`
      )
      .join("");

  if (oldValue) {
    select.value = oldValue;
  }
}

function customerSelected() {
  const id = getValue("customerSelect");

  const customer = customers.find(
    c => c.id === id
  );

  if (!customer) {
    clearCustomerFields();
    return;
  }

  setValue("customerName", customer.name);
  setValue("customerGSTIN", customer.gstin);
  setValue("customerAddress", customer.address);
  setValue("customerPhone", customer.phone);
  setValue("customerEmail", customer.email);

  calculateInvoice();
}

function clearCustomerFields() {
  setValue("customerName", "");
  setValue("customerGSTIN", "");
  setValue("customerAddress", "");
  setValue("customerPhone", "");
  setValue("customerEmail", "");
}

/* =========================================================
   PRODUCT SELECT
   ========================================================= */

function populateProductSelect() {
  const select = $("productSelect");

  if (!select) return;

  select.innerHTML =
    `<option value="">Select product</option>` +
    products
      .map(p =>
        `<option value="${escapeHTML(p.id)}">
          ${escapeHTML(p.name)}
        </option>`
      )
      .join("");
}

function productSelected() {
  const id = getValue("productSelect");

  const product = products.find(
    p => p.id === id
  );

  if (!product) return;

  setValue("itemHSN", product.hsn || "");
  setValue("itemRate", product.sellingPrice || 0);
  setValue(
    "itemGST",
    product.gst ?? settings.defaultGST
  );
  setValue("itemQty", 1);
  setValue("itemDiscount", 0);
}

/* =========================================================
   ADD INVOICE ITEM
   ========================================================= */

function addInvoiceItem() {
  const productId = getValue("productSelect");
  const product = products.find(
    p => p.id === productId
  );

  const name =
    product?.name ||
    getValue("itemName");

  const hsn =
    getValue("itemHSN") ||
    product?.hsn ||
    "";

  const qty = Math.max(
    0.01,
    number(getValue("itemQty")) || 1
  );

  const rate = Math.max(
    0,
    number(getValue("itemRate"))
  );

  const discount = Math.min(
    100,
    Math.max(
      0,
      number(getValue("itemDiscount"))
    )
  );

  const gst = Math.max(
    0,
    number(getValue("itemGST"))
  );

  if (!name) {
    showToast("Please select or enter a product.");
    return;
  }

  if (rate < 0) {
    showToast("Invalid rate.");
    return;
  }

  currentInvoiceItems.push({
    id: uid("item"),
    productId: product?.id || "",
    name,
    hsn,
    qty,
    rate,
    discount,
    gst
  });

  renderInvoiceItems();
  calculateInvoice();

  setValue("productSelect", "");
  setValue("itemHSN", "");
  setValue("itemQty", 1);
  setValue("itemRate", "");
  setValue("itemDiscount", 0);
  setValue("itemGST", settings.defaultGST);
}

/* =========================================================
   REMOVE ITEM
   ========================================================= */

function removeInvoiceItem(id) {
  currentInvoiceItems =
    currentInvoiceItems.filter(
      item => item.id !== id
    );

  renderInvoiceItems();
  calculateInvoice();
}

/* =========================================================
   RENDER INVOICE ITEMS
   ========================================================= */

function renderInvoiceItems() {
  const body = $("invoiceItemsBody");

  if (!body) return;

  if (!currentInvoiceItems.length) {
    body.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No items added yet.
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML =
    currentInvoiceItems
      .map((item, index) => {
        const gross =
          item.qty * item.rate;

        const discountAmount =
          gross * item.discount / 100;

        const taxable =
          gross - discountAmount;

        const gstAmount =
          taxable * item.gst / 100;

        const total =
          taxable + gstAmount;

        return `
          <tr>
            <td>${index + 1}</td>

            <td>
              <strong>
                ${escapeHTML(item.name)}
              </strong>
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
              ${money(total)}
            </td>

            <td>
              <button
                class="btn btn-danger btn-sm"
                onclick="removeInvoiceItem('${item.id}')">
                ✕
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
}

/* =========================================================
   GST MODE
   ========================================================= */

function getTaxMode(customerGSTIN = "") {
  const mode =
    settings.taxMode || "auto";

  if (mode === "intra") {
    return "intra";
  }

  if (mode === "inter") {
    return "inter";
  }

  const businessGSTIN =
    String(settings.businessGSTIN || "")
      .trim();

  const customerGST =
    String(customerGSTIN || "")
      .trim();

  if (
    businessGSTIN.length >= 2 &&
    customerGST.length >= 2
  ) {
    return (
      businessGSTIN.slice(0, 2) ===
      customerGST.slice(0, 2)
    )
      ? "intra"
      : "inter";
  }

  return "intra";
}

/* =========================================================
   CALCULATE INVOICE
   ========================================================= */

function calculateInvoice() {
  let subtotal = 0;
  let discountTotal = 0;
  let taxableTotal = 0;
  let gstTotal = 0;

  currentInvoiceItems.forEach(item => {
    const gross =
      number(item.qty) *
      number(item.rate);

    const discount =
      gross *
      number(item.discount) /
      100;

    const taxable =
      gross - discount;

    const gst =
      taxable *
      number(item.gst) /
      100;

    subtotal += gross;
    discountTotal += discount;
    taxableTotal += taxable;
    gstTotal += gst;
  });

  const customerGSTIN =
    getValue("customerGSTIN");

  const taxMode =
    getTaxMode(customerGSTIN);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (taxMode === "intra") {
    cgst = gstTotal / 2;
    sgst = gstTotal / 2;
  } else {
    igst = gstTotal;
  }

  const grandTotal =
    taxableTotal + gstTotal;

  setText(
    "summarySubtotal",
    money(subtotal)
  );

  setText(
    "summaryDiscount",
    money(discountTotal)
  );

  setText(
    "summaryTaxable",
    money(taxableTotal)
  );

  setText(
    "summaryCGST",
    money(cgst)
  );

  setText(
    "summarySGST",
    money(sgst)
  );

  setText(
    "summaryIGST",
    money(igst)
  );

  setText(
    "summaryGST",
    money(gstTotal)
  );

  setText(
    "summaryGrandTotal",
    money(grandTotal)
  );

  setText(
    "amountInWords",
    amountInWords(grandTotal)
  );

  return {
    subtotal,
    discountTotal,
    taxableTotal,
    gstTotal,
    cgst,
    sgst,
    igst,
    grandTotal,
    taxMode
  };
}

/* =========================================================
   AMOUNT IN WORDS
   ========================================================= */

function amountInWords(amount) {
  amount = Math.round(
    Number(amount) || 0
  );

  if (amount === 0) {
    return "Rupees Zero Only";
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

  function twoDigits(n) {
    if (n < 20) return ones[n];

    return (
      tens[Math.floor(n / 10)] +
      (n % 10
        ? " " + ones[n % 10]
        : "")
    );
  }

  function threeDigits(n) {
    if (n < 100) {
      return twoDigits(n);
    }

    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100
        ? " " + twoDigits(n % 100)
        : "")
    );
  }

  let result = "";

  const crore =
    Math.floor(amount / 10000000);

  amount %= 10000000;

  const lakh =
    Math.floor(amount / 100000);

  amount %= 100000;

  const thousand =
    Math.floor(amount / 1000);

  amount %= 1000;

  const remainder = amount;

  if (crore) {
    result +=
      threeDigits(crore) +
      " Crore ";
  }

  if (lakh) {
    result +=
      threeDigits(lakh) +
      " Lakh ";
  }

  if (thousand) {
    result +=
      threeDigits(thousand) +
      " Thousand ";
  }

  if (remainder) {
    result += threeDigits(remainder);
  }

  return (
    "Rupees " +
    result.trim() +
    " Only"
  );
}

/* =========================================================
   TEMPLATE SYSTEM
   ========================================================= */

function setTemplate(template, element) {
  const allowed = [
    "professional",
    "classic",
    "modern",
    "gst",
    "minimal"
  ];

  if (!allowed.includes(template)) {
    template = "professional";
  }

  currentTemplate = template;

  document
    .querySelectorAll(".template-option")
    .forEach(el => {
      el.classList.remove("active");
    });

  if (element) {
    element.classList.add("active");
  } else {
    const selected =
      document.querySelector(
        `[data-template="${template}"]`
      );

    if (selected) {
      selected.classList.add("active");
    }
  }

  const paper = $("invoicePaper");

  if (paper) {
    paper.classList.remove(
      "template-professional",
      "template-classic",
      "template-modern",
      "template-gst",
      "template-minimal"
    );

    paper.classList.add(
      "template-" + template
    );
  }

  updateInvoicePreview();
}

function saveSelectedTemplate() {
  settings.invoiceTemplate =
    currentTemplate;

  save(
    STORAGE.settings,
    settings
  );
}

/* =========================================================
   PREVIEW
   ========================================================= */

function updateInvoicePreview() {
  const paper = $("invoicePaper");

  if (!paper) return;

  paper.classList.remove(
    "template-professional",
    "template-classic",
    "template-modern",
    "template-gst",
    "template-minimal"
  );

  paper.classList.add(
    "template-" + currentTemplate
  );

  const calc = calculateInvoice();

  setText(
    "printBusinessName",
    settings.businessName
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
    getValue("invoiceNumber")
  );

  setText(
    "printInvoiceDate",
    getValue("invoiceDate")
  );

  setText(
    "printDueDate",
    getValue("dueDate")
  );

  setText(
    "printCustomerName",
    getValue("customerName")
  );

  setText(
    "printCustomerAddress",
    getValue("customerAddress")
  );

  setText(
    "printCustomerGSTIN",
    getValue("customerGSTIN")
  );

  setText(
    "printCustomerPhone",
    getValue("customerPhone")
  );

  setText(
    "printPaymentStatus",
    getValue("paymentStatus")
  );

  setText(
    "printPaymentMethod",
    getValue("paymentMethod")
  );

  setText(
    "printSubtotal",
    money(calc.subtotal)
  );

  setText(
    "printDiscount",
    money(calc.discountTotal)
  );

  setText(
    "printTaxable",
    money(calc.taxableTotal)
  );

  setText(
    "printCGST",
    money(calc.cgst)
  );

  setText(
    "printSGST",
    money(calc.sgst)
  );

  setText(
    "printIGST",
    money(calc.igst)
  );

  setText(
    "printGST",
    money(calc.gstTotal)
  );

  setText(
    "printGrandTotal",
    money(calc.grandTotal)
  );

  setText(
    "printAmountWords",
    amountInWords(calc.grandTotal)
  );

  setText(
    "printNotes",
    getValue("invoiceNotes")
  );

  setText(
    "printTerms",
    getValue("invoiceTerms")
  );

  renderPrintItems();

  const logo =
    $("printLogo");

  if (logo) {
    if (settings.logo) {
      logo.src = settings.logo;
      logo.style.display = "block";
    } else {
      logo.style.display = "none";
    }
  }

  const templateLabel =
    $("printTemplate");

  if (templateLabel) {
    templateLabel.textContent =
      currentTemplate.toUpperCase();
  }
}

function renderPrintItems() {
  const body =
    $("printItemsBody");

  if (!body) return;

  body.innerHTML =
    currentInvoiceItems
      .map((item, index) => {
        const gross =
          item.qty * item.rate;

        const discount =
          gross *
          item.discount /
          100;

        const taxable =
          gross - discount;

        const gst =
          taxable *
          item.gst /
          100;

        const total =
          taxable + gst;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(item.name)}</td>
            <td>${escapeHTML(item.hsn || "-")}</td>
            <td>${item.qty}</td>
            <td>${money(item.rate)}</td>
            <td>${item.gst}%</td>
            <td>${money(taxable)}</td>
            <td>${money(total)}</td>
          </tr>
        `;
      })
      .join("");
}

/* =========================================================
   SAVE INVOICE
   ========================================================= */

function saveInvoice() {
  if (!getValue("customerName")) {
    showToast("Please enter a customer.");
    return;
  }

  if (!currentInvoiceItems.length) {
    showToast("Please add at least one item.");
    return;
  }

  const calc = calculateInvoice();

  const invoice = {
    id:
      editingInvoiceId ||
      uid("invoice"),

    number:
      getValue("invoiceNumber") ||
      getNextInvoiceNumber(),

    date:
      getValue("invoiceDate") ||
      todayISO(),

    dueDate:
      getValue("dueDate"),

    customer: {
      name: getValue("customerName"),
      gstin: getValue("customerGSTIN"),
      address: getValue("customerAddress"),
      phone: getValue("customerPhone"),
      email: getValue("customerEmail")
    },

    items:
      JSON.parse(
        JSON.stringify(currentInvoiceItems)
      ),

    subtotal: calc.subtotal,
    discount: calc.discountTotal,
    taxable: calc.taxableTotal,

    gst: calc.gstTotal,
    cgst: calc.cgst,
    sgst: calc.sgst,
    igst: calc.igst,

    total: calc.grandTotal,

    taxMode: calc.taxMode,

    paymentStatus:
      getValue("paymentStatus") ||
      "Pending",

    paymentMethod:
      getValue("paymentMethod") ||
      "Bank Transfer",

    notes:
      getValue("invoiceNotes"),

    terms:
      getValue("invoiceTerms"),

    template:
      currentTemplate,

    stockAdjusted:
      editingInvoiceId
        ? true
        : false,

    createdAt:
      new Date().toISOString()
  };

  if (editingInvoiceId) {
    const index =
      invoices.findIndex(
        inv => inv.id === editingInvoiceId
      );

    if (index !== -1) {
      invoices[index] = invoice;
    }
  } else {
    deductStockForInvoice(invoice);

    invoice.stockAdjusted = true;

    invoices.unshift(invoice);
  }

  save(
    STORAGE.invoices,
    invoices
  );

  editingInvoiceId = null;

  showToast(
    "Invoice saved successfully."
  );

  renderDashboard();
  renderInvoices();

  navigate("invoices");
}

/* =========================================================
   STOCK
   ========================================================= */

function deductStockForInvoice(invoice) {
  invoice.items.forEach(item => {
    if (!item.productId) return;

    const product =
      products.find(
        p => p.id === item.productId
      );

    if (!product) return;

    product.stock =
      Math.max(
        0,
        number(product.stock) -
          number(item.qty)
      );
  });

  save(
    STORAGE.products,
    products
  );
}

function restoreStockForInvoice(invoice) {
  invoice.items.forEach(item => {
    if (!item.productId) return;

    const product =
      products.find(
        p => p.id === item.productId
      );

    if (!product) return;

    product.stock =
      number(product.stock) +
      number(item.qty);
  });

  save(
    STORAGE.products,
    products
  );
}

/* =========================================================
   CLEAR INVOICE
   ========================================================= */

function clearInvoice() {
  editingInvoiceId = null;

  currentInvoiceItems = [];

  prepareNewInvoice();

  showToast("Invoice cleared.");
}

/* =========================================================
   PRINT
   ========================================================= */

function printInvoice() {
  updateInvoicePreview();

  const paper =
    $("invoicePaper");

  if (!paper) {
    window.print();
    return;
  }

  paper.classList.add("print-invoice");

  setTimeout(() => {
    window.print();

    setTimeout(() => {
      paper.classList.remove(
        "print-invoice"
      );
    }, 500);
  }, 100);
}

/* =========================================================
   INVOICES TABLE
   ========================================================= */

function renderInvoices() {
  const body =
    $("invoicesTableBody");

  if (!body) return;

  const search =
    String(
      getValue("invoiceSearch")
    ).toLowerCase();

  const status =
    getValue("invoiceStatusFilter");

  const filtered =
    invoices.filter(inv => {
      const matchesSearch =
        !search ||
        String(inv.number)
          .toLowerCase()
          .includes(search) ||
        String(
          inv.customer?.name || ""
        )
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        !status ||
        inv.paymentStatus === status;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  if (!filtered.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-state-icon">🧾</div>
            <h3>No invoices found</h3>
            <p>Create your first invoice to see it here.</p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML =
    filtered
      .map(inv => {
        const badge =
          inv.paymentStatus === "Paid"
            ? "badge-success"
            : inv.paymentStatus === "Partial"
              ? "badge-warning"
              : "badge-danger";

        return `
          <tr>
            <td>
              <strong>
                ${escapeHTML(inv.number)}
              </strong>
            </td>

            <td>
              ${escapeHTML(
                inv.customer?.name || "-"
              )}
            </td>

            <td>
              ${escapeHTML(inv.date || "-")}
            </td>

            <td>
              ${money(inv.total)}
            </td>

            <td>
              <span class="badge ${badge}">
                ${escapeHTML(
                  inv.paymentStatus || "Pending"
                )}
              </span>
            </td>

            <td>
              ${escapeHTML(
                inv.template || "professional"
              )}
            </td>

            <td>
              <div class="table-actions">

                <button
                  class="btn btn-secondary btn-sm"
                  onclick="editInvoice('${inv.id}')">
                  Edit
                </button>

                <button
                  class="btn btn-primary btn-sm"
                  onclick="printSavedInvoice('${inv.id}')">
                  Print
                </button>

                <button
                  class="btn btn-danger btn-sm"
                  onclick="deleteInvoice('${inv.id}')">
                  Delete
                </button>

              </div>
            </td>
          </tr>
        `;
      })
      .join("");
}

/* =========================================================
   EDIT INVOICE
   ========================================================= */

function editInvoice(id) {
  const invoice =
    invoices.find(
      inv => inv.id === id
    );

  if (!invoice) return;

  editingInvoiceId = id;

  navigate("invoice");

  setValue(
    "invoiceNumber",
    invoice.number
  );

  setValue(
    "invoiceDate",
    invoice.date
  );

  setValue(
    "dueDate",
    invoice.dueDate
  );

  setValue(
    "customerName",
    invoice.customer?.name
  );

  setValue(
    "customerGSTIN",
    invoice.customer?.gstin
  );

  setValue(
    "customerAddress",
    invoice.customer?.address
  );

  setValue(
    "customerPhone",
    invoice.customer?.phone
  );

  setValue(
    "customerEmail",
    invoice.customer?.email
  );

  setValue(
    "paymentStatus",
    invoice.paymentStatus
  );

  setValue(
    "paymentMethod",
    invoice.paymentMethod
  );

  setValue(
    "invoiceNotes",
    invoice.notes
  );

  setValue(
    "invoiceTerms",
    invoice.terms
  );

  currentInvoiceItems =
    JSON.parse(
      JSON.stringify(
        invoice.items || []
      )
    );

  setTemplate(
    invoice.template ||
    "professional"
  );

  renderInvoiceItems();
  calculateInvoice();
  updateInvoicePreview();
}

/* =========================================================
   PRINT SAVED INVOICE
   ========================================================= */

function printSavedInvoice(id) {
  const invoice =
    invoices.find(
      inv => inv.id === id
    );

  if (!invoice) return;

  editingInvoiceId = id;

  currentInvoiceItems =
    JSON.parse(
      JSON.stringify(
        invoice.items || []
      )
    );

  setValue(
    "invoiceNumber",
    invoice.number
  );

  setValue(
    "invoiceDate",
    invoice.date
  );

  setValue(
    "dueDate",
    invoice.dueDate
  );

  setValue(
    "customerName",
    invoice.customer?.name
  );

  setValue(
    "customerGSTIN",
    invoice.customer?.gstin
  );

  setValue(
    "customerAddress",
    invoice.customer?.address
  );

  setValue(
    "customerPhone",
    invoice.customer?.phone
  );

  setValue(
    "customerEmail",
    invoice.customer?.email
  );

  setValue(
    "paymentStatus",
    invoice.paymentStatus
  );

  setValue(
    "paymentMethod",
    invoice.paymentMethod
  );

  setValue(
    "invoiceNotes",
    invoice.notes
  );

  setValue(
    "invoiceTerms",
    invoice.terms
  );

  setTemplate(
    invoice.template ||
    "professional"
  );

  renderInvoiceItems();
  updateInvoicePreview();

  navigate("invoice");

  setTimeout(() => {
    printInvoice();
  }, 250);
}

/* =========================================================
   DELETE INVOICE
   ========================================================= */

function deleteInvoice(id) {
  const invoice =
    invoices.find(
      inv => inv.id === id
    );

  if (!invoice) return;

  if (
    !confirm(
      `Delete invoice ${invoice.number}?`
    )
  ) {
    return;
  }

  if (invoice.stockAdjusted) {
    restoreStockForInvoice(invoice);
  }

  invoices =
    invoices.filter(
      inv => inv.id !== id
    );

  save(
    STORAGE.invoices,
    invoices
  );

  renderInvoices();
  renderDashboard();
  renderInventory();

  showToast("Invoice deleted.");
}

/* =========================================================
   INVENTORY
   ========================================================= */

function renderInventory() {
  const body =
    $("inventoryTableBody");

  if (!body) return;

  const search =
    String(
      getValue("inventorySearch")
    ).toLowerCase();

  const category =
    getValue("inventoryCategoryFilter");

  const filtered =
    products.filter(product => {
      const matchesSearch =
        !search ||
        String(product.name)
          .toLowerCase()
          .includes(search) ||
        String(product.sku || "")
          .toLowerCase()
          .includes(search) ||
        String(product.hsn || "")
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        !category ||
        product.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  if (!filtered.length) {
    body.innerHTML = `
      <tr>
        <td colspan="10">
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <h3>No products found</h3>
          </div>
        </td>
      </tr>
    `;

    updateInventoryStats();
    return;
  }

  body.innerHTML =
    filtered
      .map(product => {
        const low =
          number(product.stock) <=
          number(product.lowStock);

        return `
          <tr>
            <td>
              <strong>
                ${escapeHTML(product.name)}
              </strong>
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
              ${product.gst || 0}%
            </td>

            <td class="${low ? "stock-low" : "stock-good"}">
              ${product.stock || 0}
            </td>

            <td>
              ${
                low
                  ? `<span class="badge badge-danger">Low</span>`
                  : `<span class="badge badge-success">Good</span>`
              }
            </td>

            <td>
              <div class="table-actions">

                <button
                  class="btn btn-secondary btn-sm"
                  onclick="editProduct('${product.id}')">
                  Edit
                </button>

                <button
                  class="btn btn-danger btn-sm"
                  onclick="deleteProduct('${product.id}')">
                  Delete
                </button>

              </div>
            </td>
          </tr>
        `;
      })
      .join("");

  updateInventoryStats();
}

function updateInventoryStats() {
  const count =
    products.length;

  const stock =
    products.reduce(
      (sum, p) =>
        sum + number(p.stock),
      0
    );

  const low =
    products.filter(
      p =>
        number(p.stock) <=
        number(p.lowStock)
    ).length;

  const value =
    products.reduce(
      (sum, p) =>
        sum +
        number(p.stock) *
        number(p.purchasePrice),
      0
    );

  setText(
    "inventoryProductCount",
    count
  );

  setText(
    "inventoryStockCount",
    stock
  );

  setText(
    "inventoryLowStockCount",
    low
  );

  setText(
    "inventoryStockValue",
    money(value)
  );
}

/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openProductModal(id = null) {
  editingProductId = id;

  const modal =
    $("productModal");

  if (!modal) return;

  if (id) {
    const product =
      products.find(
        p => p.id === id
      );

    if (!product) return;

    setValue(
      "productEditId",
      id
    );

    setValue(
      "productName",
      product.name
    );

    setValue(
      "productSKU",
      product.sku
    );

    setValue(
      "productCategory",
      product.category
    );

    setValue(
      "productHSN",
      product.hsn
    );

    setValue(
      "productPurchasePrice",
      product.purchasePrice
    );

    setValue(
      "productSellingPrice",
      product.sellingPrice
    );

    setValue(
      "productGST",
      product.gst
    );

    setValue(
      "productStock",
      product.stock
    );

    setValue(
      "productLowStock",
      product.lowStock
    );
  } else {
    clearProductForm();

    setValue(
      "productGST",
      settings.defaultGST
    );

    setValue(
      "productLowStock",
      5
    );
  }

  modal.classList.add("active");
}

function closeProductModal() {
  const modal =
    $("productModal");

  if (modal) {
    modal.classList.remove("active");
  }

  editingProductId = null;
}

function clearProductForm() {
  [
    "productEditId",
    "productName",
    "productSKU",
    "productCategory",
    "productHSN",
    "productPurchasePrice",
    "productSellingPrice",
    "productGST",
    "productStock",
    "productLowStock"
  ].forEach(id => {
    setValue(id, "");
  });
}

function saveProduct() {
  const product = {
    id:
      editingProductId ||
      uid("product"),

    name:
      getValue("productName")
        .trim(),

    sku:
      getValue("productSKU")
        .trim(),

    category:
      getValue("productCategory")
        .trim(),

    hsn:
      getValue("productHSN")
        .trim(),

    purchasePrice:
      number(
        getValue(
          "productPurchasePrice"
        )
      ),

    sellingPrice:
      number(
        getValue(
          "productSellingPrice"
        )
      ),

    gst:
      number(
        getValue("productGST")
      ),

    stock:
      number(
        getValue("productStock")
      ),

    lowStock:
      number(
        getValue("productLowStock")
      ) || 5
  };

  if (!product.name) {
    showToast("Product name is required.");
    return;
  }

  if (editingProductId) {
    const index =
      products.findIndex(
        p => p.id === editingProductId
      );

    if (index !== -1) {
      products[index] = product;
    }
  } else {
    products.push(product);
  }

  save(
    STORAGE.products,
    products
  );

  closeProductModal();

  renderInventory();
  populateProductSelect();

  showToast("Product saved.");
}

function editProduct(id) {
  openProductModal(id);
}

function deleteProduct(id) {
  const product =
    products.find(
      p => p.id === id
    );

  if (!product) return;

  if (
    !confirm(
      `Delete ${product.name}?`
    )
  ) {
    return;
  }

  products =
    products.filter(
      p => p.id !== id
    );

  save(
    STORAGE.products,
    products
  );

  renderInventory();
  populateProductSelect();

  showToast("Product deleted.");
}

/* =========================================================
   CUSTOMERS
   ========================================================= */

function renderCustomers() {
  const body =
    $("customersTableBody");

  if (!body) return;

  if (!customers.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <h3>No customers yet</h3>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML =
    customers
      .map(customer => `
        <tr>
          <td>
            <strong>
              ${escapeHTML(customer.name)}
            </strong>
          </td>

          <td>
            ${escapeHTML(
              customer.gstin || "-"
            )}
          </td>

          <td>
            ${escapeHTML(
              customer.phone || "-"
            )}
          </td>

          <td>
            ${escapeHTML(
              customer.email || "-"
            )}
          </td>

          <td>
            ${escapeHTML(
              customer.address || "-"
            )}
          </td>

          <td>
            ${invoices.filter(
              inv =>
                inv.customer?.name ===
                customer.name
            ).length}
          </td>

          <td>
            <div class="table-actions">

              <button
                class="btn btn-secondary btn-sm"
                onclick="editCustomer('${customer.id}')">
                Edit
              </button>

              <button
                class="btn btn-danger btn-sm"
                onclick="deleteCustomer('${customer.id}')">
                Delete
              </button>

            </div>
          </td>
        </tr>
      `)
      .join("");
}

/* =========================================================
   CUSTOMER MODAL
   ========================================================= */

function openCustomerModal(id = null) {
  editingCustomerId = id;

  const modal =
    $("customerModal");

  if (!modal) return;

  if (id) {
    const customer =
      customers.find(
        c => c.id === id
      );

    if (!customer) return;

    setValue(
      "customerEditId",
      id
    );

    setValue(
      "modalCustomerName",
      customer.name
    );

    setValue(
      "modalCustomerGSTIN",
      customer.gstin
    );

    setValue(
      "modalCustomerAddress",
      customer.address
    );

    setValue(
      "modalCustomerPhone",
      customer.phone
    );

    setValue(
      "modalCustomerEmail",
      customer.email
    );
  } else {
    clearCustomerModalForm();
  }

  modal.classList.add("active");
}

function closeCustomerModal() {
  const modal =
    $("customerModal");

  if (modal) {
    modal.classList.remove("active");
  }

  editingCustomerId = null;
}

function clearCustomerModalForm() {
  [
    "customerEditId",
    "modalCustomerName",
    "modalCustomerGSTIN",
    "modalCustomerAddress",
    "modalCustomerPhone",
    "modalCustomerEmail"
  ].forEach(id => {
    setValue(id, "");
  });
}

function saveCustomer() {
  const customer = {
    id:
      editingCustomerId ||
      uid("customer"),

    name:
      getValue("modalCustomerName")
        .trim(),

    gstin:
      getValue("modalCustomerGSTIN")
        .trim(),

    address:
      getValue("modalCustomerAddress")
        .trim(),

    phone:
      getValue("modalCustomerPhone")
        .trim(),

    email:
      getValue("modalCustomerEmail")
        .trim()
  };

  if (!customer.name) {
    showToast("Customer name is required.");
    return;
  }

  if (editingCustomerId) {
    const index =
      customers.findIndex(
        c => c.id === editingCustomerId
      );

    if (index !== -1) {
      customers[index] = customer;
    }
  } else {
    customers.push(customer);
  }

  save(
    STORAGE.customers,
    customers
  );

  closeCustomerModal();

  renderCustomers();
  populateCustomerSelect();

  showToast("Customer saved.");
}

function editCustomer(id) {
  openCustomerModal(id);
}

function deleteCustomer(id) {
  const customer =
    customers.find(
      c => c.id === id
    );

  if (!customer) return;

  if (
    !confirm(
      `Delete ${customer.name}?`
    )
  ) {
    return;
  }

  customers =
    customers.filter(
      c => c.id !== id
    );

  save(
    STORAGE.customers,
    customers
  );

  renderCustomers();
  populateCustomerSelect();

  showToast("Customer deleted.");
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
  const sales =
    invoices.reduce(
      (sum, inv) =>
        sum + number(inv.total),
      0
    );

  const paid =
    invoices
      .filter(
        inv =>
          inv.paymentStatus ===
          "Paid"
      )
      .reduce(
        (sum, inv) =>
          sum + number(inv.total),
        0
      );

  const pending =
    invoices
      .filter(
        inv =>
          inv.paymentStatus !==
          "Paid"
      )
      .reduce(
        (sum, inv) =>
          sum + number(inv.total),
        0
      );

  const lowStock =
    products.filter(
      p =>
        number(p.stock) <=
        number(p.lowStock)
    ).length;

  setText(
    "dashboardSales",
    money(sales)
  );

  setText(
    "dashboardInvoices",
    invoices.length
  );

  setText(
    "dashboardCustomers",
    customers.length
  );

  setText(
    "dashboardLowStock",
    lowStock
  );

  setText(
    "dashboardPaid",
    money(paid)
  );

  setText(
    "dashboardPending",
    money(pending)
  );

  renderRecentInvoices();
  renderLowStockProducts();
}

function renderRecentInvoices() {
  const container =
    $("recentInvoices");

  if (!container) return;

  const recent =
    invoices.slice(0, 5);

  if (!recent.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🧾</div>
        <h3>No invoices yet</h3>
      </div>
    `;

    return;
  }

  container.innerHTML =
    recent
      .map(inv => `
        <div
          class="flex-between"
          style="
            padding:10px 0;
            border-bottom:1px solid #e5e7eb;
          "
        >
          <div>
            <strong>
              ${escapeHTML(inv.number)}
            </strong>

            <div class="small muted">
              ${escapeHTML(
                inv.customer?.name || "-"
              )}
            </div>
          </div>

          <strong>
            ${money(inv.total)}
          </strong>
        </div>
      `)
      .join("");
}

function renderLowStockProducts() {
  const container =
    $("lowStockProducts");

  if (!container) return;

  const low =
    products.filter(
      p =>
        number(p.stock) <=
        number(p.lowStock)
    );

  if (!low.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <h3>Stock looks good</h3>
      </div>
    `;

    return;
  }

  container.innerHTML =
    low
      .map(p => `
        <div
          class="flex-between"
          style="
            padding:10px 0;
            border-bottom:1px solid #e5e7eb;
          "
        >
          <span>
            ${escapeHTML(p.name)}
          </span>

          <span class="badge badge-danger">
            ${p.stock} left
          </span>
        </div>
      `)
      .join("");
}

/* =========================================================
   REPORTS
   ========================================================= */

function renderReports() {
  const sales =
    invoices.reduce(
      (sum, inv) =>
        sum + number(inv.total),
      0
    );

  const gst =
    invoices.reduce(
      (sum, inv) =>
        sum + number(inv.gst),
      0
    );

  const paid =
    invoices
      .filter(
        inv =>
          inv.paymentStatus ===
          "Paid"
      )
      .reduce(
        (sum, inv) =>
          sum + number(inv.total),
        0
      );

  const pending =
    sales - paid;

  setText(
    "reportSales",
    money(sales)
  );

  setText(
    "reportGST",
    money(gst)
  );

  setText(
    "reportPaid",
    money(paid)
  );

  setText(
    "reportPending",
    money(pending)
  );

  renderSalesChart();
}

function renderSalesChart() {
  const canvas =
    $("monthlySalesChart");

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

  const months = [];

  const values = [];

  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

    const month =
      d.toLocaleString(
        "en-IN",
        { month: "short" }
      );

    const year =
      d.getFullYear();

    const total =
      invoices
        .filter(inv => {
          const date =
            new Date(
              inv.date ||
              inv.createdAt
            );

          return (
            date.getMonth() ===
              d.getMonth() &&
            date.getFullYear() ===
              year
          );
        })
        .reduce(
          (sum, inv) =>
            sum + number(inv.total),
          0
        );

    months.push(month);
    values.push(total);
  }

  const width =
    canvas.clientWidth || 700;

  const height = 300;

  canvas.width =
    width *
    (window.devicePixelRatio || 1);

  canvas.height =
    height *
    (window.devicePixelRatio || 1);

  ctx.scale(
    window.devicePixelRatio || 1,
    window.devicePixelRatio || 1
  );

  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  const max =
    Math.max(
      ...values,
      100
    );

  const left = 45;
  const right = 15;
  const top = 20;
  const bottom = 45;

  const chartWidth =
    width - left - right;

  const chartHeight =
    height - top - bottom;

  ctx.strokeStyle =
    "#e2e8f0";

  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y =
      top +
      chartHeight -
      (chartHeight * i / 4);

    ctx.beginPath();

    ctx.moveTo(left, y);

    ctx.lineTo(
      width - right,
      y
    );

    ctx.stroke();
  }

  const points =
    values.map(
      (value, i) => ({
        x:
          left +
          chartWidth *
            (i /
              Math.max(
                values.length - 1,
                1
              )),

        y:
          top +
          chartHeight -
          (value / max) *
            chartHeight
      })
    );

  ctx.strokeStyle =
    "#2563eb";

  ctx.lineWidth = 3;

  ctx.beginPath();

  points.forEach(
    (point, index) => {
      if (index === 0) {
        ctx.moveTo(
          point.x,
          point.y
        );
      } else {
        ctx.lineTo(
          point.x,
          point.y
        );
      }
    }
  );

  ctx.stroke();

  points.forEach(point => {
    ctx.beginPath();

    ctx.arc(
      point.x,
      point.y,
      4,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#2563eb";

    ctx.fill();
  });

  ctx.fillStyle =
    "#64748b";

  ctx.font =
    "11px Arial";

  months.forEach(
    (month, i) => {
      const x =
        left +
        chartWidth *
          (i /
            Math.max(
              months.length - 1,
              1
            ));

      ctx.textAlign =
        "center";

      ctx.fillText(
        month,
        x,
        height - 17
      );
    }
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function loadSettingsForm() {
  setValue(
    "businessName",
    settings.businessName
  );

  setValue(
    "businessAddress",
    settings.businessAddress
  );

  setValue(
    "businessPhone",
    settings.businessPhone
  );

  setValue(
    "businessEmail",
    settings.businessEmail
  );

  setValue(
    "businessGSTIN",
    settings.businessGSTIN
  );

  setValue(
    "invoicePrefix",
    settings.invoicePrefix
  );

  setValue(
    "defaultGST",
    settings.defaultGST
  );

  setValue(
    "paymentTerms",
    settings.paymentTerms
  );

  setValue(
    "defaultNotes",
    settings.defaultNotes
  );

  setValue(
    "defaultTerms",
    settings.defaultTerms
  );

  setValue(
    "bankName",
    settings.bankName
  );

  setValue(
    "accountName",
    settings.accountName
  );

  setValue(
    "accountNumber",
    settings.accountNumber
  );

  setValue(
    "ifsc",
    settings.ifsc
  );

  setValue(
    "upi",
    settings.upi
  );

  setValue(
    "taxMode",
    settings.taxMode
  );

  setValue(
    "sPrefix",
    settings.invoicePrefix
  );

  setValue(
    "sNext",
    getNextInvoiceNumber()
  );

  setTemplate(
    settings.invoiceTemplate ||
    "professional"
  );
}

function saveSettings() {
  settings = {
    ...settings,

    businessName:
      getValue("businessName")
        .trim(),

    businessAddress:
      getValue("businessAddress")
        .trim(),

    businessPhone:
      getValue("businessPhone")
        .trim(),

    businessEmail:
      getValue("businessEmail")
        .trim(),

    businessGSTIN:
      getValue("businessGSTIN")
        .trim()
        .toUpperCase(),

    invoicePrefix:
      getValue("invoicePrefix")
        .trim() || "INV-",

    defaultGST:
      number(
        getValue("defaultGST")
      ),

    paymentTerms:
      getValue("paymentTerms"),

    defaultNotes:
      getValue("defaultNotes"),

    defaultTerms:
      getValue("defaultTerms"),

    bankName:
      getValue("bankName"),

    accountName:
      getValue("accountName"),

    accountNumber:
      getValue("accountNumber"),

    ifsc:
      getValue("ifsc"),

    upi:
      getValue("upi"),

    taxMode:
      getValue("taxMode") ||
      "auto",

    invoiceTemplate:
      currentTemplate
  };

  save(
    STORAGE.settings,
    settings
  );

  showToast(
    "Settings saved successfully."
  );

  updateInvoicePreview();
}

/* =========================================================
   LOGO
   ========================================================= */

function loadLogo(input) {
  const file =
    input?.files?.[0];

  if (!file) return;

  if (
    !file.type.startsWith("image/")
  ) {
    showToast(
      "Please select an image."
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload = event => {
    settings.logo =
      event.target.result;

    save(
      STORAGE.settings,
      settings
    );

    const preview =
      $("logoPreview");

    if (preview) {
      preview.innerHTML = `
        <img
          src="${settings.logo}"
          alt="Logo"
        >
      `;
    }

    updateInvoicePreview();

    showToast("Logo added.");
  };

  reader.readAsDataURL(file);
}

/* =========================================================
   REMOVE LOGO
   ========================================================= */

function removeLogo() {
  settings.logo = "";

  save(
    STORAGE.settings,
    settings
  );

  const preview =
    $("logoPreview");

  if (preview) {
    preview.innerHTML =
      "No logo";
  }

  updateInvoicePreview();

  showToast("Logo removed.");
}

/* =========================================================
   SEARCH EVENTS
   ========================================================= */

function setupSearch() {
  [
    "invoiceSearch",
    "invoiceStatusFilter",
    "inventorySearch",
    "inventoryCategoryFilter"
  ].forEach(id => {
    const el = $(id);

    if (!el) return;

    el.addEventListener(
      "input",
      () => {
        if (
          id.includes("invoice")
        ) {
          renderInvoices();
        }

        if (
          id.includes("inventory")
        ) {
          renderInventory();
        }
      }
    );

    el.addEventListener(
      "change",
      () => {
        if (
          id.includes("invoice")
        ) {
          renderInvoices();
        }

        if (
          id.includes("inventory")
        ) {
          renderInventory();
        }
      }
    );
  });
}

/* =========================================================
   INVOICE FORM EVENTS
   ========================================================= */

function setupInvoiceEvents() {
  const customer =
    $("customerSelect");

  if (customer) {
    customer.addEventListener(
      "change",
      customerSelected
    );
  }

  const product =
    $("productSelect");

  if (product) {
    product.addEventListener(
      "change",
      productSelected
    );
  }

  [
    "customerGSTIN",
    "customerName",
    "customerAddress",
    "customerPhone",
    "customerEmail",
    "invoiceDate",
    "dueDate",
    "invoiceNotes",
    "invoiceTerms",
    "paymentStatus",
    "paymentMethod"
  ].forEach(id => {
    const el = $(id);

    if (!el) return;

    el.addEventListener(
      "input",
      updateInvoicePreview
    );

    el.addEventListener(
      "change",
      updateInvoicePreview
    );
  });
}

/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function populateCategoryFilter() {
  const select =
    $("inventoryCategoryFilter");

  if (!select) return;

  const categories =
    [
      ...new Set(
        products
          .map(
            p => p.category
          )
          .filter(Boolean)
      )
    ]
    .sort();

  select.innerHTML =
    `<option value="">All categories</option>` +
    categories
      .map(
        category =>
          `<option value="${escapeHTML(category)}">
            ${escapeHTML(category)}
          </option>`
      )
      .join("");
}

/* =========================================================
   MODAL CLOSE BY BACKGROUND
   ========================================================= */

function setupModalClose() {
  document
    .querySelectorAll(".modal")
    .forEach(modal => {
      modal.addEventListener(
        "click",
        event => {
          if (
            event.target === modal
          ) {
            modal.classList.remove(
              "active"
            );
          }
        }
      );
    });
}

/* =========================================================
   DARK MODE
   ========================================================= */

function toggleDarkMode() {
  document.body.classList.toggle(
    "dark"
  );

  localStorage.setItem(
    "invoicepro_dark",
    document.body.classList.contains(
      "dark"
    )
      ? "1"
      : "0"
  );
}

function loadDarkMode() {
  if (
    localStorage.getItem(
      "invoicepro_dark"
    ) === "1"
  ) {
    document.body.classList.add(
      "dark"
    );
  }
}

/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function toggleMobileMenu() {
  const sidebar =
    document.querySelector(
      ".sidebar"
    );

  if (sidebar) {
    sidebar.classList.toggle(
      "mobile-open"
    );
  }
}

/* =========================================================
   EXPOSE FUNCTIONS FOR HTML
   ========================================================= */

window.navigate = navigate;

window.setTemplate = setTemplate;

window.addInvoiceItem =
  addInvoiceItem;

window.removeInvoiceItem =
  removeInvoiceItem;

window.saveInvoice =
  saveInvoice;

window.clearInvoice =
  clearInvoice;

window.printInvoice =
  printInvoice;

window.editInvoice =
  editInvoice;

window.printSavedInvoice =
  printSavedInvoice;

window.deleteInvoice =
  deleteInvoice;

window.openProductModal =
  openProductModal;

window.closeProductModal =
  closeProductModal;

window.saveProduct =
  saveProduct;

window.editProduct =
  editProduct;

window.deleteProduct =
  deleteProduct;

window.openCustomerModal =
  openCustomerModal;

window.closeCustomerModal =
  closeCustomerModal;

window.saveCustomer =
  saveCustomer;

window.editCustomer =
  editCustomer;

window.deleteCustomer =
  deleteCustomer;

window.saveSettings =
  saveSettings;

window.loadLogo =
  loadLogo;

window.removeLogo =
  removeLogo;

window.toggleDarkMode =
  toggleDarkMode;

window.toggleMobileMenu =
  toggleMobileMenu;

window.customerSelected =
  customerSelected;

window.productSelected =
  productSelected;

/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadDarkMode();

    setupNavigation();

    setupInvoiceEvents();

    setupSearch();

    setupModalClose();

    populateCustomerSelect();

    populateProductSelect();

    populateCategoryFilter();

    renderDashboard();

    renderInvoices();

    renderInventory();

    renderCustomers();

    renderReports();

    loadSettingsForm();

    prepareNewInvoice();

    /*
      Make sure the default template
      is loaded correctly.
    */

    setTemplate(
      settings.invoiceTemplate ||
      "professional"
    );

    updateInvoicePreview();

    console.log(
      "InvoicePro initialized successfully."
    );
  }
);
