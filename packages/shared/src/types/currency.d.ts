export interface CurrencyResponse {
    id: string;
    code: string;
    name: string;
    symbol: string;
    decimalPlaces: number;
    isActive: boolean;
}
export interface ExchangeRateDto {
    baseCurrency: string;
    targetCurrency: string;
    rate: string;
    effectiveDate: string;
}
export interface ExchangeRateResponse {
    id: string;
    baseCurrency: string;
    targetCurrency: string;
    rate: string;
    effectiveDate: string;
    createdAt: string;
}
//# sourceMappingURL=currency.d.ts.map