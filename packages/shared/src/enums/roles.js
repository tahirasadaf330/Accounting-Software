"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPROVAL_ROLES = exports.TENANT_ROLES = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["OWNER"] = "OWNER";
    Role["CHIEF_ACCOUNTANT"] = "CHIEF_ACCOUNTANT";
    Role["ACCOUNTANT"] = "ACCOUNTANT";
})(Role || (exports.Role = Role = {}));
exports.TENANT_ROLES = [Role.OWNER, Role.CHIEF_ACCOUNTANT, Role.ACCOUNTANT];
exports.APPROVAL_ROLES = [Role.OWNER, Role.CHIEF_ACCOUNTANT];
//# sourceMappingURL=roles.js.map