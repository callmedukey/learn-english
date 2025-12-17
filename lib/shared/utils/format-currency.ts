export function formatCurrency(amount: number, currency: string): string {
  if (currency === "KRW") {
    return `₩${amount.toLocaleString("ko-KR")}`;
  } else if (currency === "USD") {
    // Amount is in cents, convert to dollars
    return `$${(amount / 100).toFixed(2)}`;
  }
  return `${currency} ${amount}`;
}
