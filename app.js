function calculateInvoice() {
  const quantity = parseFloat(document.getElementById("quantity").value) || 0;
  const price = parseFloat(document.getElementById("price").value) || 0;
  const discountRate = parseFloat(document.getElementById("discount").value) || 0;
  const gstRate = parseFloat(document.getElementById("gst").value) || 0;

  const subtotal = quantity * price;
  const discountAmount = subtotal * (discountRate / 100);
  const taxableAmount = subtotal - discountAmount;

  const gstAmount = taxableAmount * (gstRate / 100);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  const total = taxableAmount + gstAmount;

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("discountAmount").textContent = formatCurrency(discountAmount);
  document.getElementById("taxableAmount").textContent = formatCurrency(taxableAmount);
  document.getElementById("cgstAmount").textContent = formatCurrency(cgst);
  document.getElementById("sgstAmount").textContent = formatCurrency(sgst);
  document.getElementById("total").textContent = formatCurrency(total);

  document.getElementById("amountWords").textContent =
    numberToWords(total);

  updatePrintableInvoice(
    quantity,
    price,
    discountAmount,
    taxableAmount,
    gstRate,
    cgst,
    sgst,
    total
  );

  saveInvoiceData();
}


function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


function updatePrintableInvoice(
  quantity,
  price,
  discountAmount,
  taxableAmount,
  gstRate,
  cgst,
  sgst,
  total
) {
  document.getElementById("printBusiness").textContent =
    document.getElementById("business").value || "Your Business";

  document.getElementById("printBusinessAddress").textContent =
    document.getElementById("businessAddress").value;

  document.getElementById("printBusinessGSTIN").textContent =
    document.getElementById("businessGSTIN").value || "-";

  document.getElementById("printCustomer").textContent =
    document.getElementById("customer").value || "Customer";

  document.getElementById("printCustomerAddress").textContent =
    document.getElementById("customerAddress").value;

  document.getElementById("printInvoiceNumber").textContent =
    document.getElementById("invoiceNumber").value || "INV-001";

  document.getElementById("printProduct").textContent =
    document.getElementById("product").value || "Product / Service";

  document.getElementById("printHSN").textContent =
    document.getElementById("hsn").value || "-";

  document.getElementById("printQuantity").textContent = quantity;
  document.getElementById("printPrice").textContent = formatCurrency(price);
  document.getElementById("printDiscount").textContent =
    formatCurrency(discountAmount);

  document.getElementById("printGST").textContent =
    gstRate + "%";

  document.getElementById("printAmount").textContent =
    formatCurrency(taxableAmount);

  document.getElementById("printSubtotal").textContent =
    formatCurrency(quantity * price);

  document.getElementById("printDiscountTotal").textContent =
    formatCurrency(discountAmount);

  document.getElementById("printTaxable").textContent =
    formatCurrency(taxableAmount);

  document.getElementById("printCGST").textContent =
    formatCurrency(cgst);

  document.getElementById("printSGST").textContent =
    formatCurrency(sgst);

  document.getElementById("printTotal").textContent =
    formatCurrency(total);

  document.getElementById("printAmountWords").textContent =
    numberToWords(total);
}


function numberToWords(num) {
  num = Math.round(num);

  if (num === 0) return "Zero Rupees Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five",
    "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen",
    "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function two(n) {
    if (n < 20) return ones[n];

    return tens[Math.floor(n / 10)] +
      (n % 10 ? " " + ones[n % 10] : "");
  }

  function three(n) {
    if (n < 100) return two(n);

    return ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " " + two(n % 100) : "");
  }

  let result = "";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) result += three(crore) + " Crore ";
  if (lakh) result += three(lakh) + " Lakh ";
  if (thousand) result += three(thousand) + " Thousand ";
  if (num) result += three(num);

  return result.trim() + " Rupees Only";
}


function saveInvoiceData() {
  const fields = [
    "business",
    "businessGSTIN",
    "businessAddress",
    "businessPhone",
    "businessEmail",
    "customer",
    "customerGSTIN",
    "customerAddress",
    "customerPhone",
    "customerEmail",
    "invoiceNumber",
    "invoiceDate",
    "dueDate",
    "paymentStatus",
    "product",
    "hsn",
    "quantity",
    "price",
    "discount",
    "gst"
  ];

  const invoice = {};

  fields.forEach(function(id) {
    const element = document.getElementById(id);
    if (element) invoice[id] = element.value;
  });

  localStorage.setItem(
    "invoicepro_current_invoice",
    JSON.stringify(invoice)
  );
}


document.addEventListener("DOMContentLoaded", function() {

  const fields = [
    "business",
    "businessGSTIN",
    "businessAddress",
    "businessPhone",
    "businessEmail",
    "customer",
    "customerGSTIN",
    "customerAddress",
    "customerPhone",
    "customerEmail",
    "invoiceNumber",
    "invoiceDate",
    "dueDate",
    "paymentStatus",
    "product",
    "hsn",
    "quantity",
    "price",
    "discount",
    "gst"
  ];

  fields.forEach(function(id) {
    const element = document.getElementById(id);

    if (element) {
      element.addEventListener("input", calculateInvoice);
      element.addEventListener("change", calculateInvoice);
    }
  });

  calculateInvoice();
});
