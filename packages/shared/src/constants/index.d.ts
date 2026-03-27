import { AccountType } from '../enums/account-types';
export declare const ACCOUNT_CODE_RANGES: Record<AccountType, {
    min: number;
    max: number;
}>;
export declare const MAX_ACCOUNT_LEVELS = 4;
export declare const DECIMAL_PLACES = 4;
export declare const MONETARY_PRECISION = 20;
export declare const PAGINATION_DEFAULTS: {
    readonly page: 1;
    readonly limit: 25;
    readonly maxLimit: 100;
};
export declare const JWT_CONSTANTS: {
    readonly accessTokenExpiry: "15m";
    readonly refreshTokenExpiry: "7d";
};
export declare const FISCAL_MONTHS = 12;
//# sourceMappingURL=index.d.ts.map