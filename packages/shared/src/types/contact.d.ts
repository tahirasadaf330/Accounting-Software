export interface CreateContactDto {
    name: string;
    type?: 'CUSTOMER' | 'VENDOR' | 'BOTH';
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    taxId?: string;
    creditLimit?: number;
    paymentTermDays?: number;
    currencyCode?: string;
    accountId?: string;
    autoCreateAccount?: boolean;
}
export interface UpdateContactDto {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    taxId?: string;
    creditLimit?: number;
    paymentTermDays?: number;
    currencyCode?: string;
    isActive?: boolean;
}
export interface ContactResponse {
    id: string;
    type: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    taxId: string | null;
    creditLimit: string | null;
    paymentTermDays: number | null;
    currencyCode: string;
    isActive: boolean;
    accountId: string | null;
    accountCode: string | null;
    accountName: string | null;
    createdAt: string;
}
//# sourceMappingURL=contact.d.ts.map