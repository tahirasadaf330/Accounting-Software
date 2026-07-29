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

  // Remove the Cloudonix Inc contact + its trade account (dropped from seeder).
  const cloud = await prisma.contact.findFirst({ where: { name: { equals: 'Cloudonix Inc', mode: 'insensitive' } } });
  if (cloud) {
    const accId = cloud.accountId;
    await prisma.contact.delete({ where: { id: cloud.id } });
    console.log(`  ✓ Deleted contact: Cloudonix Inc`);
    if (accId) {
      const stillUsed = await prisma.contact.count({ where: { accountId: accId } });
      const hasLines = await prisma.journalEntryLine.count({ where: { accountId: accId } });
      if (stillUsed === 0 && hasLines === 0) {
        await prisma.account.delete({ where: { id: accId } }).catch(() => null);
        console.log(`  ✓ Deleted Cloudonix trade account`);
      } else {
        console.log(`  ~ Kept Cloudonix account (still referenced: contacts=${stillUsed}, lines=${hasLines})`);
      }
    }
  } else {
    console.log('  ~ Cloudonix Inc contact not found (already removed)');
  }
}

main()
  .catch((e) => { console.error('Cleanup failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
