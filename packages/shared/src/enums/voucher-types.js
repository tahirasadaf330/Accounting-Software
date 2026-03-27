"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STATUS_TRANSITIONS = exports.EDITABLE_STATUSES = exports.VOUCHER_TYPE_PREFIX = exports.VoucherStatus = exports.VoucherType = void 0;
var VoucherType;
(function (VoucherType) {
    VoucherType["PAYMENT"] = "PAYMENT";
    VoucherType["RECEIPT"] = "RECEIPT";
    VoucherType["JOURNAL"] = "JOURNAL";
    VoucherType["CONTRA"] = "CONTRA";
    VoucherType["SALES"] = "SALES";
    VoucherType["PURCHASE"] = "PURCHASE";
    VoucherType["CREDIT_NOTE"] = "CREDIT_NOTE";
    VoucherType["DEBIT_NOTE"] = "DEBIT_NOTE";
})(VoucherType || (exports.VoucherType = VoucherType = {}));
var VoucherStatus;
(function (VoucherStatus) {
    VoucherStatus["DRAFT"] = "DRAFT";
    VoucherStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    VoucherStatus["APPROVED"] = "APPROVED";
    VoucherStatus["REJECTED"] = "REJECTED";
    VoucherStatus["POSTED"] = "POSTED";
    VoucherStatus["REVERSED"] = "REVERSED";
})(VoucherStatus || (exports.VoucherStatus = VoucherStatus = {}));
exports.VOUCHER_TYPE_PREFIX = {
    [VoucherType.PAYMENT]: 'PV',
    [VoucherType.RECEIPT]: 'RV',
    [VoucherType.JOURNAL]: 'JV',
    [VoucherType.CONTRA]: 'CV',
    [VoucherType.SALES]: 'SV',
    [VoucherType.PURCHASE]: 'PUR',
    [VoucherType.CREDIT_NOTE]: 'CN',
    [VoucherType.DEBIT_NOTE]: 'DN',
};
exports.EDITABLE_STATUSES = [VoucherStatus.DRAFT, VoucherStatus.REJECTED];
exports.VALID_STATUS_TRANSITIONS = {
    [VoucherStatus.DRAFT]: [VoucherStatus.PENDING_APPROVAL],
    [VoucherStatus.PENDING_APPROVAL]: [VoucherStatus.APPROVED, VoucherStatus.REJECTED],
    [VoucherStatus.APPROVED]: [VoucherStatus.POSTED],
    [VoucherStatus.REJECTED]: [VoucherStatus.PENDING_APPROVAL],
    [VoucherStatus.POSTED]: [VoucherStatus.REVERSED],
    [VoucherStatus.REVERSED]: [],
};
//# sourceMappingURL=voucher-types.js.map