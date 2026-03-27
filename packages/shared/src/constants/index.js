"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FISCAL_MONTHS = exports.JWT_CONSTANTS = exports.PAGINATION_DEFAULTS = exports.MONETARY_PRECISION = exports.DECIMAL_PLACES = exports.MAX_ACCOUNT_LEVELS = exports.ACCOUNT_CODE_RANGES = void 0;
const account_types_1 = require("../enums/account-types");
exports.ACCOUNT_CODE_RANGES = {
    [account_types_1.AccountType.ASSET]: { min: 1000, max: 1999 },
    [account_types_1.AccountType.LIABILITY]: { min: 2000, max: 2999 },
    [account_types_1.AccountType.EQUITY]: { min: 3000, max: 3999 },
    [account_types_1.AccountType.REVENUE]: { min: 4000, max: 4999 },
    [account_types_1.AccountType.COGS]: { min: 5000, max: 5999 },
    [account_types_1.AccountType.EXPENSE]: { min: 6000, max: 6999 },
};
exports.MAX_ACCOUNT_LEVELS = 4;
exports.DECIMAL_PLACES = 4;
exports.MONETARY_PRECISION = 20;
exports.PAGINATION_DEFAULTS = {
    page: 1,
    limit: 25,
    maxLimit: 100,
};
exports.JWT_CONSTANTS = {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
};
exports.FISCAL_MONTHS = 12;
//# sourceMappingURL=index.js.map