export const etb = (n) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
  }).format(Number(n || 0));