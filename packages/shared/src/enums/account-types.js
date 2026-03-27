"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountLevel = exports.ACCOUNT_TYPE_NORMAL_BALANCE = exports.NormalBalance = exports.AccountType = void 0;
var AccountType;
(function (AccountType) {
    AccountType["ASSET"] = "ASSET";
    AccountType["LIABILITY"] = "LIABILITY";
    AccountType["EQUITY"] = "EQUITY";
    AccountType["REVENUE"] = "REVENUE";
    AccountType["COGS"] = "COGS";
    AccountType["EXPENSE"] = "EXPENSE";
})(AccountType || (exports.AccountType = AccountType = {}));
var NormalBalance;
(function (NormalBalance) {
    NormalBalance["DEBIT"] = "DEBIT";
    NormalBalance["CREDIT"] = "CREDIT";
})(NormalBalance || (exports.NormalBalance = NormalBalance = {}));
exports.ACCOUNT_TYPE_NORMAL_BALANCE = {
    [AccountType.ASSET]: NormalBalance.DEBIT,
    [AccountType.LIABILITY]: NormalBalance.CREDIT,
    [AccountType.EQUITY]: NormalBalance.CREDIT,
    [AccountType.REVENUE]: NormalBalance.CREDIT,
    [AccountType.COGS]: NormalBalance.DEBIT,
    [AccountType.EXPENSE]: NormalBalance.DEBIT,
};
var AccountLevel;
(function (AccountLevel) {
    AccountLevel[AccountLevel["CATEGORY"] = 1] = "CATEGORY";
    AccountLevel[AccountLevel["GROUP"] = 2] = "GROUP";
    AccountLevel[AccountLevel["SUB_GROUP"] = 3] = "SUB_GROUP";
    AccountLevel[AccountLevel["DETAIL"] = 4] = "DETAIL";
})(AccountLevel || (exports.AccountLevel = AccountLevel = {}));
//# sourceMappingURL=account-types.js.map