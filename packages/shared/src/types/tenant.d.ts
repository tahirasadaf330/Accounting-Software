import { TenantStatus } from '../enums/currencies';
export interface CreateTenantDto {
    name: string;
    slug: string;
    baseCurrency: string;
    fiscalYearStartMonth: number;
    timezone: string;
    locale: string;
}
export interface UpdateTenantDto {
    name?: string;
    baseCurrency?: string;
    timezone?: string;
    locale?: string;
}
export interface OnboardingDto {
    organizationName: string;
    baseCurrency: string;
    fiscalYearStartMonth: number;
    timezone: string;
    locale: string;
    coaTemplateId: string;
}
export interface TenantResponse {
    id: string;
    name: string;
    slug: string;
    baseCurrency: string;
    fiscalYearStartMonth: number;
    timezone: string;
    locale: string;
    status: TenantStatus;
    createdAt: string;
}
//# sourceMappingURL=tenant.d.ts.map