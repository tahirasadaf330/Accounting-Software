import { PrismaClient, VoucherType, VoucherStatus, ContactType } from '@prisma/client';
import { SOA_CONTACTS, SoaContact, SoaInvoice, SoaPayment, SoaAdjustment } from './soa-data';
import { deterministicUuid } from './seed-utils';

const prisma = new PrismaClient();

// Parse 'YYYY-MM-DD' as a UTC midnight date (keeps the calendar day stable
// regardless of server timezone).
function d(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

interface Ctx {
  tenantId: string;
  ceoUserId: string;
  revenueAccountId: string;
  cogsAccountId: string;
  bankAccountId: string;
  arParentId?: string;
}

async function resolveContext(): Promise<Ctx> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'hayo' } });
  if (!tenant) throw new Error('Hayo tenant not found — run main seeder first');

  // Voucher creator/approver. Local/staging seed a "ceo@hayo.net" user; production
  // uses real emails, so fall back to any OWNER of the tenant when it's absent.
  let ceoUser = await prisma.user.findUnique({ where: { email: 'ceo@hayo.net' } });
  if (!ceoUser) {
    ceoUser = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'OWNER' } });
  }
  if (!ceoUser) throw new Error('No creator user found (ceo@hayo.net or a tenant OWNER) — run main seeder first');

  const revenue = await prisma.account.findUnique({ where: { tenantId_code: { tenantId: tenant.id, code: '4000' } } });
  const cogs = await prisma.account.findUnique({ where: { tenantId_code: { tenantId: tenant.id, code: '5000' } } });
  const arParent = await prisma.account.findUnique({ where: { tenantId_code: { tenantId: tenant.id, code: '1300' } } });
  if (!revenue || !cogs) throw new Error('Required accounts (4000/5000) not found — run main seeder first');

  let bank = await prisma.account.findFirst({
    where: { tenantId: tenant.id, code: { gte: '1210', lte: '1219' }, accountType: 'ASSET' },
    orderBy: { code: 'asc' },
  });
  if (!bank) {
    bank = await prisma.account.findFirst({
      where: { tenantId: tenant.id, code: { gte: '1200', lte: '1299' }, accountType: 'ASSET' },
      orderBy: { code: 'asc' },
    });
  }
  if (!bank) throw new Error('No bank account found (1200-1299 range) — check chart of accounts');

  return {
    tenantId: tenant.id,
    ceoUserId: ceoUser.id,
    revenueAccountId: revenue.id,
    cogsAccountId: cogs.id,
    bankAccountId: bank.id,
    arParentId: arParent?.id,
  };
}

// Ensure a per-tenant-unique voucherNumber (schema has @@unique([tenantId, voucherNumber])).
async function uniqueVoucherNumber(tenantId: string, voucherId: string, num: string): Promise<string> {
  const existing = await prisma.voucher.findFirst({
    where: { tenantId, voucherNumber: num },
    select: { id: true },
  });
  if (!existing || existing.id === voucherId) return num;
  return `${num}-${voucherId.slice(0, 8)}`; // disambiguate collision across contacts
}

async function ensureTradeAccount(ctx: Ctx, c: SoaContact) {
  let acc = await prisma.account.findUnique({ where: { id: c.accountId } });
  if (acc) return acc;
  // next available code >= 1305 (1303 NAWC, 1304 HOT NET already used)
  const existing = await prisma.account.findMany({
    where: { tenantId: ctx.tenantId, code: { gte: '1305', lte: '1399' } },
    select: { code: true },
    orderBy: { code: 'desc' },
  });
  const nextCode = existing.length > 0 ? (parseInt(existing[0].code) + 1).toString() : '1305';
  acc = await prisma.account.create({
    data: {
      id: c.accountId,
      tenantId: ctx.tenantId,
      code: nextCode,
      name: `Trade - ${c.name}`,
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isSystem: false,
      description: `Auto-created trade account for contact: ${c.name}`,
      ...(ctx.arParentId ? { parentId: ctx.arParentId } : {}),
      level: ctx.arParentId ? 3 : 2,
    },
  });
  console.log(`  ✓ Trade account: ${acc.code} — ${acc.name}`);
  return acc;
}

// Generic invoice voucher (SALES or PURCHASE) with balanced JE.
async function createInvoice(
  ctx: Ctx, c: SoaContact, tradeAccountId: string, inv: SoaInvoice, type: 'SALES' | 'PURCHASE', occ = 1,
) {
  // Disambiguate repeated invoice numbers (e.g. placeholder "Exp" used on
  // multiple lines): the 2nd+ occurrence gets a suffix so it isn't collapsed
  // into the first. Occurrence 1 keeps the original ID (idempotent re-runs).
  const dupSuffix = occ > 1 ? `#${occ}` : '';
  const voucherId = deterministicUuid(`soa-${c.key}-${type.toLowerCase()}-${inv.num}${dupSuffix}`);
  if (await prisma.voucher.findUnique({ where: { id: voucherId } })) return 'skip';

  const voucherDate = d(inv.end);
  const voucherNumber = await uniqueVoucherNumber(ctx.tenantId, voucherId, inv.num);
  const isSales = type === 'SALES';

  // SALES: DR trade (receivable), CR revenue. PURCHASE: DR cogs, CR trade (payable).
  const debitAccId = isSales ? tradeAccountId : ctx.cogsAccountId;
  const creditAccId = isSales ? ctx.revenueAccountId : tradeAccountId;
  const debitNar = isSales ? `Trade Receivable — ${c.name}` : 'Cost of Goods Sold';
  const creditNar = isSales ? 'Sales Revenue' : `Trade Payable — ${c.name}`;

  const lines = [
    { accountId: debitAccId, debit: inv.amount, credit: 0, narration: debitNar, lineOrder: 0 },
    { accountId: creditAccId, debit: 0, credit: inv.amount, narration: creditNar, lineOrder: 1 },
  ];

  await prisma.voucher.create({
    data: {
      id: voucherId,
      tenantId: ctx.tenantId,
      voucherNumber,
      voucherType: isSales ? VoucherType.SALES : VoucherType.PURCHASE,
      status: VoucherStatus.POSTED,
      date: voucherDate,
      periodStart: d(inv.start),
      periodEnd: d(inv.end),
      narration: `${c.name} — Billing period ${inv.start} to ${inv.end}`,
      totalAmount: inv.amount,
      currencyCode: 'USD',
      exchangeRate: 1,
      createdById: ctx.ceoUserId,
      approvedById: ctx.ceoUserId,
      postedAt: voucherDate,
      contactId: c.contactId,
      lineItems: {
        create: lines.map((l) => ({
          tenantId: ctx.tenantId, accountId: l.accountId,
          debit: l.debit, credit: l.credit, baseDebit: l.debit, baseCredit: l.credit,
          currencyCode: 'USD', exchangeRate: 1, narration: l.narration, lineOrder: l.lineOrder,
        })),
      },
      journalEntry: {
        create: {
          tenantId: ctx.tenantId,
          entryNumber: `JE-SOA-${c.key}-${isSales ? 'S' : 'P'}-${inv.num}`.slice(0, 50),
          entryDate: voucherDate,
          narration: `${type} Invoice ${inv.num} — ${c.name}`,
          lines: {
            create: lines.map((l) => ({
              tenantId: ctx.tenantId, accountId: l.accountId,
              debit: l.debit, credit: l.credit, baseCurrencyDebit: l.debit, baseCurrencyCredit: l.credit,
              currencyCode: 'USD', exchangeRate: 1, narration: l.narration, lineOrder: l.lineOrder,
            })),
          },
        },
      },
    },
  });
  return 'created';
}

// Generic payment voucher (RECEIPT or PAYMENT) with balanced JE.
async function createPayment(
  ctx: Ctx, c: SoaContact, tradeAccountId: string, p: SoaPayment, idx: number, type: 'RECEIPT' | 'PAYMENT',
) {
  const voucherKey = `soa-${c.key}-${type.toLowerCase()}-${String(idx + 1).padStart(2, '0')}`;
  const voucherId = deterministicUuid(voucherKey);
  if (await prisma.voucher.findUnique({ where: { id: voucherId } })) return 'skip';

  const isReceipt = type === 'RECEIPT';
  const voucherNumber = await uniqueVoucherNumber(ctx.tenantId, voucherId, voucherKey.replace(/^soa-/, '').toUpperCase());
  const date = d(p.date);

  // RECEIPT (customer paid HAYO): DR bank, CR trade. PAYMENT (HAYO paid): DR trade, CR bank.
  const lines = isReceipt
    ? [
        { accountId: ctx.bankAccountId, debit: p.amount, credit: 0, narration: 'Cash received', lineOrder: 0 },
        { accountId: tradeAccountId, debit: 0, credit: p.amount, narration: `Receipt — Invoices: ${p.invoices}`, lineOrder: 1 },
      ]
    : [
        { accountId: tradeAccountId, debit: p.amount, credit: 0, narration: `Payment — Invoices: ${p.invoices}`, lineOrder: 0 },
        { accountId: ctx.bankAccountId, debit: 0, credit: p.amount, narration: 'Cash paid', lineOrder: 1 },
      ];
  const narration = `${isReceipt ? 'Receipt from' : 'Payment to'} ${c.name} — Invoices: ${p.invoices}`;

  await prisma.voucher.create({
    data: {
      id: voucherId,
      tenantId: ctx.tenantId,
      voucherNumber,
      voucherType: isReceipt ? VoucherType.RECEIPT : VoucherType.PAYMENT,
      status: VoucherStatus.POSTED,
      date,
      narration,
      totalAmount: p.amount,
      currencyCode: 'USD',
      exchangeRate: 1,
      createdById: ctx.ceoUserId,
      approvedById: ctx.ceoUserId,
      postedAt: date,
      contactId: c.contactId,
      lineItems: {
        create: lines.map((l) => ({
          tenantId: ctx.tenantId, accountId: l.accountId,
          debit: l.debit, credit: l.credit, baseDebit: l.debit, baseCredit: l.credit,
          currencyCode: 'USD', exchangeRate: 1, narration: l.narration, lineOrder: l.lineOrder,
        })),
      },
      journalEntry: {
        create: {
          tenantId: ctx.tenantId,
          entryNumber: `JE-SOA-${c.key}-${isReceipt ? 'R' : 'PMT'}-${String(idx + 1).padStart(2, '0')}`.slice(0, 50),
          entryDate: date,
          narration,
          lines: {
            create: lines.map((l) => ({
              tenantId: ctx.tenantId, accountId: l.accountId,
              debit: l.debit, credit: l.credit, baseCurrencyDebit: l.debit, baseCurrencyCredit: l.credit,
              currencyCode: 'USD', exchangeRate: 1, narration: l.narration, lineOrder: l.lineOrder,
            })),
          },
        },
      },
    },
  });
  return 'created';
}

// Adjustment voucher (CREDIT_NOTE reduces the receivable, DEBIT_NOTE increases it).
async function createAdjustment(
  ctx: Ctx, c: SoaContact, tradeAccountId: string, a: SoaAdjustment, idx: number,
) {
  const kind = a.type === 'CREDIT_NOTE' ? 'cn' : 'dn';
  const voucherKey = `soa-${c.key}-${kind}-${String(idx + 1).padStart(2, '0')}`;
  const voucherId = deterministicUuid(voucherKey);
  if (await prisma.voucher.findUnique({ where: { id: voucherId } })) return 'skip';

  const isCredit = a.type === 'CREDIT_NOTE';
  const date = d(a.date);
  const voucherNumber = await uniqueVoucherNumber(ctx.tenantId, voucherId, voucherKey.replace(/^soa-/, '').toUpperCase());

  // CREDIT_NOTE: DR revenue, CR trade (receivable down). DEBIT_NOTE: DR trade, CR revenue (receivable up).
  const lines = isCredit
    ? [
        { accountId: ctx.revenueAccountId, debit: a.amount, credit: 0, narration: 'Sales adjustment (credit note)', lineOrder: 0 },
        { accountId: tradeAccountId, debit: 0, credit: a.amount, narration: `Credit Note — ${c.name}`, lineOrder: 1 },
      ]
    : [
        { accountId: tradeAccountId, debit: a.amount, credit: 0, narration: `Debit Note — ${c.name}`, lineOrder: 0 },
        { accountId: ctx.revenueAccountId, debit: 0, credit: a.amount, narration: 'Sales adjustment (debit note)', lineOrder: 1 },
      ];
  const narration = `${isCredit ? 'Credit' : 'Debit'} Note — ${c.name}${a.ref ? ` (ref ${a.ref})` : ''}`;

  await prisma.voucher.create({
    data: {
      id: voucherId,
      tenantId: ctx.tenantId,
      voucherNumber,
      voucherType: isCredit ? VoucherType.CREDIT_NOTE : VoucherType.DEBIT_NOTE,
      status: VoucherStatus.POSTED,
      date,
      narration,
      totalAmount: a.amount,
      currencyCode: 'USD',
      exchangeRate: 1,
      createdById: ctx.ceoUserId,
      approvedById: ctx.ceoUserId,
      postedAt: date,
      contactId: c.contactId,
      lineItems: {
        create: lines.map((l) => ({
          tenantId: ctx.tenantId, accountId: l.accountId,
          debit: l.debit, credit: l.credit, baseDebit: l.debit, baseCredit: l.credit,
          currencyCode: 'USD', exchangeRate: 1, narration: l.narration, lineOrder: l.lineOrder,
        })),
      },
      journalEntry: {
        create: {
          tenantId: ctx.tenantId,
          entryNumber: `JE-SOA-${c.key}-${kind.toUpperCase()}-${String(idx + 1).padStart(2, '0')}`.slice(0, 50),
          entryDate: date,
          narration,
          lines: {
            create: lines.map((l) => ({
              tenantId: ctx.tenantId, accountId: l.accountId,
              debit: l.debit, credit: l.credit, baseCurrencyDebit: l.debit, baseCurrencyCredit: l.credit,
              currencyCode: 'USD', exchangeRate: 1, narration: l.narration, lineOrder: l.lineOrder,
            })),
          },
        },
      },
    },
  });
  return 'created';
}

async function seedContact(ctx: Ctx, c: SoaContact) {
  console.log(`\n── ${c.name} (${c.key}) | term ${c.term} ──`);
  const trade = await ensureTradeAccount(ctx, c);

  await prisma.contact.upsert({
    where: { id: c.contactId },
    update: { name: c.name, type: ContactType.BOTH, accountId: trade.id, paymentTermDays: c.term },
    create: {
      id: c.contactId, tenantId: ctx.tenantId, name: c.name, type: ContactType.BOTH,
      currencyCode: 'USD', paymentTermDays: c.term, accountId: trade.id,
    },
  });

  let created = 0, skipped = 0;
  const tally = (r: string) => { r === 'created' ? created++ : skipped++; };

  const salesOcc = new Map<string, number>();
  for (const inv of c.sales) {
    const n = (salesOcc.get(inv.num) || 0) + 1; salesOcc.set(inv.num, n);
    tally(await createInvoice(ctx, c, trade.id, inv, 'SALES', n));
  }
  const purOcc = new Map<string, number>();
  for (const inv of c.purchases) {
    const n = (purOcc.get(inv.num) || 0) + 1; purOcc.set(inv.num, n);
    tally(await createInvoice(ctx, c, trade.id, inv, 'PURCHASE', n));
  }
  for (let i = 0; i < c.receipts.length; i++) tally(await createPayment(ctx, c, trade.id, c.receipts[i], i, 'RECEIPT'));
  for (let i = 0; i < c.payments.length; i++) tally(await createPayment(ctx, c, trade.id, c.payments[i], i, 'PAYMENT'));
  for (let i = 0; i < c.adjustments.length; i++) tally(await createAdjustment(ctx, c, trade.id, c.adjustments[i], i));

  console.log(`  ✓ ${c.name}: created ${created}, skipped ${skipped} ` +
    `(S:${c.sales.length} P:${c.purchases.length} R:${c.receipts.length} Pay:${c.payments.length} Adj:${c.adjustments.length})`);
}

async function main() {
  const arg = (process.argv.slice(2).find((a) => a && a !== '--') || '').trim();
  if (!arg) {
    console.log('Usage: prisma:seed:soa <contact-key | all>\n\nAvailable contacts:');
    SOA_CONTACTS.forEach((c) => console.log(`  ${c.key.padEnd(32)} ${c.name}`));
    return;
  }

  const ctx = await resolveContext();
  const targets = arg === 'all'
    ? SOA_CONTACTS
    : SOA_CONTACTS.filter((c) => c.key === arg);

  if (targets.length === 0) {
    throw new Error(`No contact matches key "${arg}". Run without arguments to list keys.`);
  }

  console.log(`Seeding SOA data for ${targets.length} contact(s)...`);
  for (const c of targets) await seedContact(ctx, c);
  console.log(`\nSOA seed completed for ${targets.length} contact(s).`);
}

main()
  .catch((e) => {
    console.error('SOA seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
