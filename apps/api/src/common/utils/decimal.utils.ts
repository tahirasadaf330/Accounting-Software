import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function decimalEquals(a: string | Decimal, b: string | Decimal): boolean {
  return new Decimal(a).equals(new Decimal(b));
}

export function sumDecimals(values: (string | Decimal)[]): Decimal {
  return values.reduce((acc: Decimal, val) => acc.plus(new Decimal(val)), new Decimal(0));
}

export function isZero(value: string | Decimal): boolean {
  return new Decimal(value).isZero();
}

export function convertCurrency(
  amount: string | Decimal,
  exchangeRate: string | Decimal,
): Decimal {
  return new Decimal(amount).times(new Decimal(exchangeRate));
}

export const ZERO = new Decimal(0);
