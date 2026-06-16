-- Migrate existing users to new roles (runs after enum values are committed)
UPDATE "users" SET "role" = 'FINANCE_MANAGER' WHERE "role" = 'CHIEF_ACCOUNTANT';
UPDATE "users" SET "role" = 'PAYMENT_OFFICER' WHERE "role" = 'ACCOUNTANT';
UPDATE "users" SET "role" = 'OWNER' WHERE "role" = 'SUPER_ADMIN';
UPDATE "invitations" SET "role" = 'FINANCE_MANAGER' WHERE "role" = 'CHIEF_ACCOUNTANT';
UPDATE "invitations" SET "role" = 'PAYMENT_OFFICER' WHERE "role" = 'ACCOUNTANT';
