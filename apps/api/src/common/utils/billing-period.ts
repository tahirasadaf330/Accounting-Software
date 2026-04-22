export interface BillingPeriod {
  key: string;
  label: string;
  start: string;
  end: string;
}

export function computeBillingPeriod(
  invoiceDate: Date,
  billingStartDate: Date | null | undefined,
  paymentTermDays: number | null | undefined,
): BillingPeriod | null {
  if (!billingStartDate) return null;

  const termDays = paymentTermDays && paymentTermDays > 0 ? paymentTermDays : 30;
  const msPerDay = 86400000;
  const diffDays = Math.floor(
    (invoiceDate.getTime() - billingStartDate.getTime()) / msPerDay,
  );
  if (diffDays < 0) return null;

  const periodIndex = Math.floor(diffDays / termDays);
  const periodStart = new Date(billingStartDate);
  periodStart.setDate(periodStart.getDate() + periodIndex * termDays);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + termDays - 1);

  const startStr = periodStart.toISOString().split('T')[0];
  const endStr = periodEnd.toISOString().split('T')[0];
  return {
    key: startStr,
    label: `${startStr} — ${endStr}`,
    start: startStr,
    end: endStr,
  };
}
