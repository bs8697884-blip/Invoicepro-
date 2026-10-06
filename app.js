* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background: #f5f7fb;
  color: #12213b;
  line-height: 1.5;
}

/* NAVIGATION */

.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #e5e9f0;
}

.nav {
  max-width: 1200px;
  margin: auto;
  padding: 15px 22px;
  display: flex;
  align-items: center;
  gap: 30px;
}

.logo {
  font-size: 23px;
  font-weight: 800;
  color: #1646d8;
}

nav {
  display: flex;
  gap: 20px;
  flex: 1;
}

nav a {
  text-decoration: none;
  color: #5f6b80;
  font-size: 14px;
  font-weight: 600;
}

nav a:hover {
  color: #1646d8;
}


/* BUTTONS */

.btn {
  display: inline-block;
  background: #1646d8;
  color: white;
  border: none;
  border-radius: 9px;
  padding: 11px 18px;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
}

.btn:hover {
  background: #0d35aa;
}

.secondary {
  background: white;
  color: #1646d8;
  border: 1px solid #d6deed;
}


/* HERO */

.hero {
  max-width: 1200px;
  margin: auto;
  padding: 90px 22px;
  display: grid;
  grid-template-columns: 1.2fr .8fr;
  gap: 60px;
  align-items: center;
}

.tag {
  color: #1646d8;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.hero h1 {
  font-size: clamp(44px, 6vw, 70px);
  line-height: 1.05;
  margin: 18px 0;
}

.hero p:not(.tag) {
  max-width: 650px;
  color: #68758a;
  font-size: 18px;
}

.buttons {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.invoice-card {
  background: #eaf0ff;
  padding: 40px;
  border-radius: 25px;
}

.mini-invoice {
  background: white;
  padding: 28px;
  border-radius: 13px;
  box-shadow: 0 20px 50px rgba(20,33,61,.12);
}

.mini-top {
  display: flex;
  justify-content: space-between;
}

.mini-invoice p {
  color: #718096;
  margin-top: 8px;
}

.mini-total {
  font-size: 28px;
  font-weight: 800;
  margin-top: 22px;
}


/* SECTIONS */

.section {
  max-width: 1200px;
  margin: auto;
  padding: 65px 22px;
}

.section h2 {
  font-size: 34px;
  margin-bottom: 25px;
}


/* CARDS */

.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.card {
  background: white;
  border: 1px solid #e4e8ef;
  border-radius: 15px;
  padding: 23px;
}

.card h3 {
  margin-bottom: 8px;
}

.card p {
  color: #6c788d;
}


/* FORM */

.invoice-form {
  max-width: 1000px;
  background: white;
  padding: 30px;
  border-radius: 18px;
  border: 1px solid #e3e8f0;
}

.invoice-form h3 {
  margin: 25px 0 18px;
  font-size: 19px;
}

.invoice-form h3:first-child {
  margin-top: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

label {
  display: block;
  font-weight: 700;
  font-size: 14px;
}

label.full {
  grid-column: 1 / -1;
}

input,
textarea,
select {
  width: 100%;
  margin-top: 7px;
  padding: 12px;
  border: 1px solid #d7deea;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  font-family: inherit;
  background: white;
}

textarea {
  min-height: 75px;
  resize: vertical;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #1646d8;
}

.button-row {
  display: flex;
  gap: 12px;
  margin-top: 25px;
}


/* CALCULATION RESULT */

.result {
  margin-top: 25px;
  padding: 20px;
  background: #f5f7fb;
  border-radius: 12px;
}

.result > div {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
}

.grand-total {
  border-top: 1px solid #dce2ec;
  margin-top: 8px;
  padding-top: 14px !important;
  font-size: 21px;
}

.amount-words {
  display: block !important;
  margin-top: 12px;
  padding-top: 12px !important;
  border-top: 1px solid #dce2ec;
}

.amount-words strong {
  display: block;
  margin-top: 5px;
}


/* DASHBOARD */

.dashboard-section {
  min-height: 250px;
}


/* FOOTER */

footer {
  text-align: center;
  padding: 40px 20px;
  color: #7a8598;
  border-top: 1px solid #e3e7ef;
  background: white;
}


/* PRINTABLE INVOICE */

.print-invoice {
  display: none;
}


/* A4 PRINT */

@media print {

  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  html,
  body {
    width: 210mm;
    height: 297mm;
    background: white;
  }

  body {
    margin: 0;
    padding: 0;
    color: #111;
  }

  .site-header,
  main,
  footer {
    display: none !important;
  }

  .print-invoice {
    display: block !important;
    width: 194mm;
    min-height: 280mm;
    margin: 0 auto;
    padding: 4mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9px;
    color: #111;
    background: white;
  }

  .print-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 1.5px solid #111;
    padding-bottom: 7px;
    margin-bottom: 8px;
  }

  .print-header h1 {
    font-size: 19px;
    margin-bottom: 3px;
  }

  .print-header p {
    margin: 1px 0;
    line-height: 1.3;
  }

  .invoice-title {
    text-align: right;
  }

  .invoice-title h2 {
    font-size: 18px;
    margin-bottom: 5px;
  }

  .invoice-title p {
    margin: 2px 0;
  }

  .bill-section {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #bbb;
    padding-bottom: 7px;
    margin-bottom: 8px;
  }

  .bill-section h4,
  .payment-details h4 {
    font-size: 9px;
    margin-bottom: 3px;
  }

  .bill-section p {
    margin: 1px 0;
  }

  .status-box {
    border: 1px solid #aaa;
    padding: 6px 12px;
    height: fit-content;
    text-align: center;
  }

  .status-box span {
    display: block;
    font-weight: bold;
    margin-top: 2px;
  }

  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 8px;
  }

  .invoice-table th {
    background: #eef1f5;
    font-weight: bold;
  }

  .invoice-table th,
  .invoice-table td {
    border: 1px solid #aaa;
    padding: 5px 4px;
    text-align: right;
  }

  .invoice-table th:nth-child(2),
  .invoice-table td:nth-child(2) {
    text-align: left;
    width: 28%;
  }

  .print-bottom {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-top: 12px;
  }

  .payment-details {
    width: 55%;
  }

  .payment-details p {
    margin: 3px 0 12px;
  }

  .print-totals {
    width: 40%;
  }

  .print-totals p {
    display: flex;
    justify-content: space-between;
    margin: 3px 0;
  }

  .final-total {
    border-top: 1.5px solid #111;
    padding-top: 6px;
    margin-top: 6px !important;
    font-size: 13px;
    font-weight: bold;
  }

  .amount-words-print {
    border-top: 1px solid #aaa;
    margin-top: 10px;
    padding-top: 7px;
  }

  .signature {
    width: 180px;
    margin-left: auto;
    margin-top: 22px;
    text-align: center;
  }

  .signature div {
    border-bottom: 1px solid #111;
    height: 25px;
  }

  .signature p {
    margin-top: 4px;
    font-size: 8px;
  }

  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}


/* TABLET */

@media (max-width: 850px) {

  nav {
    display: none;
  }

  .hero {
    grid-template-columns: 1fr;
    padding: 65px 22px;
  }

  .cards {
    grid-template-columns: 1fr 1fr;
  }

}


/* MOBILE */

@media (max-width: 600px) {

  .cards {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  label.full {
    grid-column: auto;
  }

  .hero h1 {
    font-size: 45px;
  }

  .invoice-card {
    padding: 20px;
  }

  .buttons,
  .button-row {
    flex-direction: column;
  }

  .btn {
    text-align: center;
  }

}
