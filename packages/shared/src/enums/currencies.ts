export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_SETUP = 'PENDING_SETUP',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  INVITED = 'INVITED',
}

export enum ReconciliationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum MatchType {
  EXACT_AMOUNT_DATE = 'EXACT_AMOUNT_DATE',
  EXACT_AMOUNT_NEAR_DATE = 'EXACT_AMOUNT_NEAR_DATE',
  EXACT_AMOUNT = 'EXACT_AMOUNT',
  MANUAL = 'MANUAL',
}

export enum ContactType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  BOTH = 'BOTH',
}
