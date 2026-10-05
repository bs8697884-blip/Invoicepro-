function calculateInvoice() {
  const quantity = Number(document.getElementById("quantity").value) || 0;
  const price = Number(document.getElementById("price").value) || 0;
  const gstRate = Number(document.getElementById("gst").value) || 0;

  const subtotal = quantity * price;
  const gstAmount = subtotal * (gstRate / 100);
  const total = subtotal + gstAmount;

  document.getElementById("subtotal").textContent =
    formatCurrency(subtotal);

  document.getElementById("gstAmount").textContent =
    formatCurrency(gstAmount);

  document.getElementById("total").textContent =
    formatCurrency(total);

  saveInvoiceData();
}

function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function saveInvoiceData() {
  const invoice = {
    business: document.getElementById("business").value,
    customer: document.getElementById("customer").value,
    gstin: document.getElementById("gstin").value,
    product: document.getElementById("product").value,
    quantity: document.getElementById("quantity").value,
    price: document.getElementById("price").value,
    gst: document.getElementById("gst").value
  };

  localStorage.setItem(
    "invoicepro_current_invoice",
    JSON.stringify(invoice)
  );
}

function loadInvoiceData() {
  const saved = localStorage.getItem(
    "invoicepro_current_invoice"
  );

  if (!saved) return;

  const invoice = JSON.parse(saved);

  document.getElementById("business").value = invoice.business || "";
  document.getElementById("customer").value = invoice.customer || "";
  document.getElementById("gstin").value = invoice.gstin || "";
  document.getElementById("product").value = invoice.product || "";
  document.getElementById("quantity").value = invoice.quantity || 1;
  document.getElementById("price").value = invoice.price || 0;
  document.getElementById("gst").value = invoice.gst || 18;

  calculateInvoice();
}

document.addEventListener("DOMContentLoaded", function () {
  loadInvoiceData();

  const fields = [
    "business",
    "customer",
    "gstin",
    "product",
    "quantity",
    "price",
    "gst"
  ];

  fields.forEach(function (id) {
    const element = document.getElementById(id);

    if (element) {
      element.addEventListener("input", saveInvoiceData);
    }
  });
});
