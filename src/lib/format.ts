export function inr(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function discountPercent(price: number, offerPrice: number): number {
  if (price <= 0 || offerPrice >= price) return 0;
  return Math.round(((price - offerPrice) / price) * 100);
}
