-- Microsoft Entra SSO: users authenticate via Microsoft, so a local password is optional.
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Store the Microsoft Entra Object ID (oid) as the permanent identity key.
ALTER TABLE "users" ADD COLUMN "azureOid" TEXT;

-- One app account per Microsoft identity.
CREATE UNIQUE INDEX "users_azureOid_key" ON "users"("azureOid");
