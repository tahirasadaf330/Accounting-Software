"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactType = exports.MatchType = exports.ReconciliationStatus = exports.UserStatus = exports.TenantStatus = void 0;
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "ACTIVE";
    TenantStatus["SUSPENDED"] = "SUSPENDED";
    TenantStatus["PENDING_SETUP"] = "PENDING_SETUP";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["INVITED"] = "INVITED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var ReconciliationStatus;
(function (ReconciliationStatus) {
    ReconciliationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ReconciliationStatus["COMPLETED"] = "COMPLETED";
})(ReconciliationStatus || (exports.ReconciliationStatus = ReconciliationStatus = {}));
var MatchType;
(function (MatchType) {
    MatchType["EXACT_AMOUNT_DATE"] = "EXACT_AMOUNT_DATE";
    MatchType["EXACT_AMOUNT_NEAR_DATE"] = "EXACT_AMOUNT_NEAR_DATE";
    MatchType["EXACT_AMOUNT"] = "EXACT_AMOUNT";
    MatchType["MANUAL"] = "MANUAL";
})(MatchType || (exports.MatchType = MatchType = {}));
var ContactType;
(function (ContactType) {
    ContactType["CUSTOMER"] = "CUSTOMER";
    ContactType["VENDOR"] = "VENDOR";
    ContactType["BOTH"] = "BOTH";
})(ContactType || (exports.ContactType = ContactType = {}));
//# sourceMappingURL=currencies.js.map