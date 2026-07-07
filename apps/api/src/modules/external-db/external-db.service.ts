import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as PgClient } from 'pg';
import * as sql from 'mssql';

export interface ExternalContact {
  externalId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  currencyCode?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIban?: string;
  bankSwiftCode?: string;
  bankBeneficiaryName?: string;
  creditLimit?: number;
}

@Injectable()
export class ExternalDbService {
  private readonly logger = new Logger(ExternalDbService.name);

  constructor(private config: ConfigService) {}

  private getJerasoftConfig() {
    return {
      host: this.config.get('JERASOFT_DB_HOST'),
      port: Number(this.config.get('JERASOFT_DB_PORT') ?? 5432),
      database: this.config.get('JERASOFT_DB_NAME'),
      user: this.config.get('JERASOFT_DB_USER'),
      password: this.config.get('JERASOFT_DB_PASSWORD'),
      connectionTimeoutMillis: 5000,
    };
  }

  private getAsmseConfig(): sql.config {
    return {
      server: this.config.get('ASMSE_DB_HOST')!,
      port: Number(this.config.get('ASMSE_DB_PORT') ?? 1433),
      database: this.config.get('ASMSE_DB_NAME'),
      user: this.config.get('ASMSE_DB_USER'),
      password: this.config.get('ASMSE_DB_PASSWORD'),
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 5000,
      },
    };
  }

  async testJerasoftConnection(): Promise<{ success: boolean; message: string }> {
    const client = new PgClient(this.getJerasoftConfig());
    try {
      await client.connect();
      await client.query('SELECT 1');
      return { success: true, message: 'Jerasoft database connected successfully' };
    } catch (err: any) {
      this.logger.error('Jerasoft connection failed', err?.message);
      return { success: false, message: err?.message ?? 'Connection failed' };
    } finally {
      await client.end().catch(() => null);
    }
  }

  async testAsmseConnection(): Promise<{ success: boolean; message: string }> {
    const pool = new sql.ConnectionPool(this.getAsmseConfig());
    try {
      await pool.connect();
      await pool.request().query('SELECT 1');
      return { success: true, message: 'ASMSE database connected successfully' };
    } catch (err: any) {
      this.logger.error('ASMSE connection failed', err?.message);
      return { success: false, message: err?.message ?? 'Connection failed' };
    } finally {
      await pool.close().catch(() => null);
    }
  }

  // ─── Jerasoft contacts ───────────────────────────────────────────────────────
  // role: 'vendor' | 'customer' | 'both' (maps to Jerasoft role column)
  async getJerasoftContacts(type: 'VENDOR' | 'CUSTOMER' | 'BOTH'): Promise<ExternalContact[]> {
    const client = new PgClient(this.getJerasoftConfig());
    try {
      await client.connect();

      // Jerasoft roles: orig = customer, term = vendor, both = both, none = unclassified
      let roleFilter = '';
      if (type === 'VENDOR') roleFilter = `AND c.role = 'term'`;
      else if (type === 'CUSTOMER') roleFilter = `AND c.role = 'orig'`;
      else if (type === 'BOTH') roleFilter = `AND c.role = 'both'`;

      const query = `
        SELECT
          c.id::text   AS "externalId",
          c.name       AS "name",
          c.c_email    AS "email",
          c.c_address  AS "address",
          c.c_city     AS "city",
          c.c_state    AS "state",
          c.c_country  AS "country",
          c.c_zip_code AS "postalCode",
          c.tax_id     AS "taxId",
          cur.name     AS "currencyCode",
          c.credit     AS "creditLimit"
        FROM clients c
        LEFT JOIN currencies cur ON cur.id = c.currencies_id
        WHERE c.status = 'active'
        ${roleFilter}
        ORDER BY c.name ASC
      `;

      const res = await client.query(query);
      return res.rows;
    } catch (err: any) {
      this.logger.error('Jerasoft getContacts failed', err?.message);
      throw err;
    } finally {
      await client.end().catch(() => null);
    }
  }

  async getJerasoftContactById(id: string): Promise<ExternalContact | null> {
    const client = new PgClient(this.getJerasoftConfig());
    try {
      await client.connect();
      const res = await client.query(`
        SELECT
          c.id::text   AS "externalId",
          c.name       AS "name",
          c.c_email    AS "email",
          c.c_address  AS "address",
          c.c_city     AS "city",
          c.c_state    AS "state",
          c.c_country  AS "country",
          c.c_zip_code AS "postalCode",
          c.tax_id     AS "taxId",
          cur.name     AS "currencyCode",
          c.credit     AS "creditLimit"
        FROM clients c
        LEFT JOIN currencies cur ON cur.id = c.currencies_id
        WHERE c.id = $1
      `, [id]);
      return res.rows[0] ?? null;
    } finally {
      await client.end().catch(() => null);
    }
  }

  // ─── ASMSE contacts ──────────────────────────────────────────────────────────
  async getAsmseContacts(type: 'VENDOR' | 'CUSTOMER' | 'BOTH'): Promise<ExternalContact[]> {
    const pool = new sql.ConnectionPool(this.getAsmseConfig());
    try {
      await pool.connect();

      // type filter applied as a WHERE clause on the OUTER APPLY results
      let typeFilter = '';
      if (type === 'VENDOR') {
        typeFilter = `AND (mvc.MtVendorConnectionId IS NOT NULL OR moc.MoVendorConnectionId IS NOT NULL)`;
      } else if (type === 'CUSTOMER') {
        typeFilter = `AND cc.CustomerConnectionId IS NOT NULL`;
      }

      const query = `
        SELECT
          CAST(cm.CompanyId AS NVARCHAR) AS externalId,
          cm.Name                        AS name,
          cm.Email                       AS email,
          cm.PhoneNumber                 AS phone,
          cm.Address                     AS address,
          cm.VatNumber                   AS taxId,
          cr.CurrencyCode                AS currencyCode,
          cm.BillingEmail                AS billingEmail,
          cm.AllowNetting                AS allowNetting,
          cc.ConnectionTypeName          AS connectionTypeName
        FROM SMSCPhoenix.dbo.Company cm
        LEFT JOIN SMSCPhoenix.dbo.CompanyStatus cs
          ON cm.CompanyStatusId = cs.CompanyStatusId
        LEFT JOIN SMSCPhoenix.dbo.Currency cr
          ON cm.CurrencyId = cr.CurrencyId
        OUTER APPLY (
          SELECT TOP 1 cc2.CustomerConnectionId, cct.ConnectionTypeName
          FROM SMSCPhoenix.dbo.CustomerConnections cc2
          LEFT JOIN SMSCPhoenix.dbo.CustomerConnectionType cct
            ON cct.CustomerConnectionTypeId = cc2.CustomerConnectionTypeId
          WHERE cc2.CompanyId = cm.CompanyId
          ORDER BY cc2.CustomerConnectionId DESC
        ) cc
        OUTER APPLY (
          SELECT MAX(MtVendorConnectionId) MtVendorConnectionId
          FROM SMSCPhoenix.dbo.MtVendorConnection
          WHERE CompanyId = cm.CompanyId
        ) mvc
        OUTER APPLY (
          SELECT MAX(MoVendorConnectionId) MoVendorConnectionId
          FROM SMSCPhoenix.dbo.MOVendorConnection
          WHERE CompanyId = cm.CompanyId
        ) moc
        WHERE cs.CompanyStatus = 'Production'
          AND NOT (
            cc.CustomerConnectionId IS NULL
            AND mvc.MtVendorConnectionId IS NULL
            AND moc.MoVendorConnectionId IS NULL
          )
          ${typeFilter}
        ORDER BY cm.Name ASC
      `;

      const res = await pool.request().query(query);
      return res.recordset.map((r: any) => ({
        externalId: r.externalId,
        name: r.name,
        email: r.email ?? undefined,
        phone: r.phone ?? undefined,
        address: r.address ?? undefined,
        taxId: r.taxId ?? undefined,
        currencyCode: r.currencyCode ?? undefined,
      }));
    } catch (err: any) {
      this.logger.error('ASMSE getContacts failed', err?.message);
      throw err;
    } finally {
      await pool.close().catch(() => null);
    }
  }

  async getAsmseContactById(id: string): Promise<ExternalContact | null> {
    const pool = new sql.ConnectionPool(this.getAsmseConfig());
    try {
      await pool.connect();
      const res = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`
          SELECT
            CAST(c.CompanyId AS NVARCHAR) AS externalId,
            c.Name        AS name,
            c.Email       AS email,
            c.PhoneNumber AS phone,
            c.Address     AS address,
            c.VatNumber   AS taxId,
            cur.CurrencyCode AS currencyCode
          FROM Company c
          LEFT JOIN Currency cur ON cur.CurrencyId = c.CurrencyId
          WHERE c.CompanyId = @id
        `);
      if (!res.recordset[0]) return null;
      const r = res.recordset[0];
      return {
        externalId: r.externalId,
        name: r.name,
        email: r.email ?? undefined,
        phone: r.phone ?? undefined,
        address: r.address ?? undefined,
        taxId: r.taxId ?? undefined,
        currencyCode: r.currencyCode ?? undefined,
      };
    } finally {
      await pool.close().catch(() => null);
    }
  }
}
