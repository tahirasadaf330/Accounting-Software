/**
 * Feature flags. Flip a value to `true` to show the feature in the UI, `false`
 * to hide it. Hidden features keep their backend endpoints reachable — only
 * the UI entry point is removed. After changing a flag, restart the dev
 * server (or rebuild for production) so the new value is picked up.
 */
export const features = {
  importPurchaseInvoicesFromExcel: false,
  importPaymentVouchersFromExcel: false,
} as const;
