export function generateRandomId() {
  const randomLetters = () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const randomNumbers = () => Math.floor(1000 + Math.random() * 9000);
  return randomLetters() + randomLetters() + randomNumbers();
}

export function calcLineTotal(quantity, price, tax) {
  const total = (Number(quantity) || 0) * (Number(price) || 0);
  const taxPercentage = (Number(tax) || 0) / 100;
  return total + total * taxPercentage;
}

export function getInvoiceItems(invoice) {
  if (!invoice?.numberOfItemsAdded) return [];

  const items = [];
  for (let index = 0; index < invoice.numberOfItemsAdded; index += 1) {
    const quantity = invoice[`quantity${index}`];
    const price = invoice[`price${index}`];
    const tax = invoice[`tax${index}`];
    items.push({
      item: invoice[`item${index}`],
      quantity,
      price,
      tax,
      finalTotal: calcLineTotal(quantity, price, tax),
    });
  }
  return items;
}

export function formatAmount(currency, amount) {
  return `${currency || ""} ${(Number(amount) || 0).toFixed(0)}`.trim();
}
