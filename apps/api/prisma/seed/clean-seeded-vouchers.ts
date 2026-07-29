import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREFIXES = ['soa-', 'hotnet-', 'nawc-'];

async function main() {
  console.log('Cleaning old readable-ID seeded vouchers (migration to UUID IDs)...');

  const orPrefix = PREFIXES.map((p) => ({ startsWith: p }));

  // JournalEntry -> Voucher has no cascade; delete JEs first (cascades JE lines).
  const je = await prisma.journalEntry.deleteMany({
    where: { OR: orPrefix.map((sw) => ({ voucherId: sw })) },
  });
  console.log(`  ✓ Deleted ${je.count} journal entries (readable voucherId prefixes)`);

  // Voucher delete cascades its line items.
  const v = await prisma.voucher.deleteMany({
    where: { OR: orPrefix.map((sw) => ({ id: sw })) },
  });
  console.log(`  ✓ Deleted ${v.count} vouchers (readable IDs)`);

  // Remove ONLY the seeded Cloudonix Inc (dropped from seeder). Target by its
  // exact seeded IDs — never by name — so a real/manual Cloudonix contact is
  // never affected.
  const CLOUDONIX_CONTACT_ID = '50a0c000-0000-4000-8000-000000000045';
  const CLOUDONIX_ACCOUNT_ID = '50a0a000-0000-4000-8000-000000000045';
  const cloud = await prisma.contact.findUnique({ where: { id: CLOUDONIX_CONTACT_ID } });
  if (cloud) {
    await prisma.contact.delete({ where: { id: CLOUDONIX_CONTACT_ID } });
    console.log('  ✓ Deleted seeded contact: Cloudonix Inc');
    const hasLines = await prisma.journalEntryLine.count({ where: { accountId: CLOUDONIX_ACCOUNT_ID } });
    const stillUsed = await prisma.contact.count({ where: { accountId: CLOUDONIX_ACCOUNT_ID } });
    if (hasLines === 0 && stillUsed === 0) {
      await prisma.account.delete({ where: { id: CLOUDONIX_ACCOUNT_ID } }).catch(() => null);
      console.log('  ✓ Deleted seeded Cloudonix trade account');
    }
  } else {
    console.log('  ~ Seeded Cloudonix contact not found (already removed)');
  }
}

main()
  .catch((e) => { console.error('Cleanup failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
