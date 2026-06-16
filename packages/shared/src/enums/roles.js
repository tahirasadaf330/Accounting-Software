"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPROVAL_ROLES = exports.TENANT_ROLES = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["OWNER"] = "OWNER";
    Role["FINANCE_MANAGER"] = "FINANCE_MANAGER";
    Role["ASSISTANT_MANAGER_BILLING"] = "ASSISTANT_MANAGER_BILLING";
    Role["SENIOR_OFFICE_PAYMENTS"] = "SENIOR_OFFICE_PAYMENTS";
    Role["SENIOR_ARAP_OFFICER"] = "SENIOR_ARAP_OFFICER";
    Role["PAYMENT_OFFICER"] = "PAYMENT_OFFICER";
})(Role || (exports.Role = Role = {}));
exports.TENANT_ROLES = [Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING, Role.SENIOR_OFFICE_PAYMENTS, Role.SENIOR_ARAP_OFFICER, Role.PAYMENT_OFFICER];
exports.APPROVAL_ROLES = [Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING];
//# sourceMappingURL=roles.js.map