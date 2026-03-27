import { AccountType, NormalBalance, AccountLevel } from '../enums/account-types';
export interface CreateAccountDto {
    code: string;
    name: string;
    accountType: AccountType;
    parentId?: string;
    level: AccountLevel;
    description?: string;
}
export interface UpdateAccountDto {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export interface AccountResponse {
    id: string;
    code: string;
    name: string;
    accountType: AccountType;
    parentId: string | null;
    level: AccountLevel;
    normalBalance: NormalBalance;
    isActive: boolean;
    isSystem: boolean;
    description: string | null;
    children?: AccountResponse[];
}
export interface AccountTreeNode extends AccountResponse {
    children: AccountTreeNode[];
}
//# sourceMappingURL=account.d.ts.map