# Release Notes

A running record of features, fixes, and changes per branch / release.

---

## `enhancement` branch — 2026-06-16

### Added — Crypto Account support in Bank Reconciliation

- The **Bank Reconciliation** page (`/dashboard/bank`) now supports both **Bank** and **Crypto** account types alongside each other.
- When adding a new account, an **Account Type toggle** (Bank / Crypto) appears at the top of the modal. Selecting Crypto:
  - Relabels "Bank Name" → "Exchange / Wallet Name" (e.g. Binance, MetaMask).
  - Relabels "Account Number" → "Account / User ID".
  - Shows an additional optional **Wallet Address** field (monospace input).
  - Changes the currency placeholder to suggest crypto currencies (USDT, BTC, ETH).
  - Turns the submit button orange to visually distinguish the action.
- Account cards on the dashboard distinguish type at a glance:
  - Crypto accounts show an **orange Wallet icon** and an orange **CRYPTO** badge.
  - Bank accounts keep the blue Landmark icon and a blue **BANK** badge.
  - Wallet address is displayed on the card when present.
- Import Statement, Auto-Match, Manual Match, and Complete Reconciliation flows are identical for both account types — no separate module needed.

### Added — Edit and Delete for Bank / Crypto Accounts

- Each account card on the Bank Reconciliation page now has **Edit** and **Delete** buttons.
- **Edit** opens a pre-filled modal to update the exchange/bank name, account/user ID, wallet address (crypto only), and currency. The linked COA account cannot be changed after creation.
- **Delete** shows a confirmation dialog before removing the account. Deletion is blocked with an error message if the account already has imported statements (to protect reconciliation history).

### Database

- Migration `20260615000000_add_billing_officer_department_manager_roles` — adds `BILLING_OFFICER` and `DEPARTMENT_MANAGER` values to the `Role` enum (reserved for future use; not exposed in any invite or role-change flow).
- Migration `20260616000000_add_crypto_account_fields` — adds `accountType VARCHAR(10) DEFAULT 'BANK'` and `walletAddress VARCHAR(255)` (nullable) to the `bank_accounts` table.

### Backend

- `apps/api/src/modules/bank-reconciliation/dto/create-bank-account.dto.ts` — added `accountType` (`BANK` | `CRYPTO`, optional, default `BANK`) and `walletAddress` (optional string, max 255).
- `apps/api/src/modules/bank-reconciliation/bank-reconciliation.service.ts` — `createBankAccount` saves new fields; added `updateBankAccount` and `deleteBankAccount` methods.
- `apps/api/src/modules/bank-reconciliation/bank-reconciliation.controller.ts` — added `PATCH /bank-reconciliation/bank-accounts/:id` and `DELETE /bank-reconciliation/bank-accounts/:id` endpoints (OWNER / CHIEF_ACCOUNTANT only).

### Frontend

- `apps/web/src/app/(dashboard)/dashboard/bank/page.tsx`:
  - `BankAccount` interface extended with `accountType` and `walletAddress`.
  - `AddBankAccountModal` — Bank/Crypto toggle, dynamic labels, conditional wallet address field, scrollable modal body (`max-h-[90vh]`), dropdown z-index raised to `z-[200]`.
  - `EditBankAccountModal` — new component, pre-fills current values, shows wallet address field for crypto accounts only.
  - Account cards — type-aware icon/badge, wallet address display, Edit and Delete buttons with confirmation dialog.

### Notes

- Existing bank accounts are unaffected — they default to `accountType = 'BANK'` via the migration default.
- The reconciliation engine (auto-match algorithm, manual matching, statement import) is shared between bank and crypto accounts with no changes.

---

## `filter` branch — 2026-05-12

### Added — Sortable columns on the Vouchers list

- Five columns on `/dashboard/vouchers` are now clickable to sort ascending / descending: **Date**, **Type**, **Amount**, **Status**, **Created**. (Number, Reference, and Narration remain static — sorting those wasn't a common need and the underlying values are mostly free-text / auto-generated.)
- First click on a column sorts **descending** (the useful default for dates and amounts), the second click flips to **ascending**, subsequent clicks toggle. The active column shows a filled chevron (▲/▼); inactive sortable columns show a neutral up/down indicator.
- Switching the sort always resets pagination to page 1 so the user lands on the first results of the new ordering.
- Backend: `VoucherFilterDto.sortBy` now accepts `date | voucherNumber | voucherType | totalAmount | status | createdAt` (`createdAt` remains the default). `VouchersService.findAll` whitelist was extended to match — unsupported values silently fall back to `createdAt`.
- Frontend: new in-file `SortableHeader` component renders the sortable header as a button with the sort-state icon; the Vouchers page tracks `sortBy` / `sortOrder` state and re-fetches when either changes.

### Changed — Bank account last-4 chip moved from invoice rows to contact group header

- The `····1234` chip showing the contact's bank-account last 4 digits previously rendered next to **each individual voucher row** on the AR/AP report. It now renders **once per contact**, next to the contact name and type badge (`Customer` / `Vendor` / `BOTH`) in the Level 1 group header.
- Rationale: the bank account is a single field on the contact (`Contact.bankAccountNumber`), so per-invoice rendering was redundant — every invoice for the same contact carried the same value. Moving it to the group header removes the visual repetition and surfaces the info one level higher in the hierarchy.
- Fix: the chip now also appears for **BOTH-type contacts** whose only visible row is the synthetic Netting Settlement (Level 2 synthetic row). Previously the netting-cycle Prisma query didn't select `bankAccountNumber` and the synthetic row didn't emit `bankAccountLast4`, so the chip silently dropped for these contacts even when a bank number was saved.

### Backend

- `apps/api/src/modules/reports/ar-report.service.ts` and `apps/api/src/modules/reports/ap-report.service.ts`:
  - Added `bankAccountNumber` to the contact `select` on the `nettingCycle.findMany(...)` include.
  - Synthetic netting-settlement row now emits `bankAccountLast4` (derived the same way as regular voucher rows: `bankAcct.slice(-4)` when length ≥ 4, else `null`).

### Frontend

- `apps/web/src/app/(dashboard)/dashboard/reports/page.tsx`:
  - `groupedContacts` now hoists `bankAccountLast4` from the first row that has it onto the group object.
  - Level 1 contact header renders the `····XXXX` chip after the type badge.
  - Removed the duplicate chip from Level 2 voucher rows.

### Notes

- No schema changes, no migrations.
- Regular voucher rows (`bankAccountLast4` on each row) are still emitted by the backend — only the frontend rendering moved. The field on row payloads is now effectively unused by the UI but kept on the API contract for backward compatibility.

---

## `partial-payment` branch — 2026-05-11

### Added — Partial payment on AR/AP Mark as Paid

- The Mark as Paid modal now exposes an **Amount** field next to the Payment Proof uploader.
- The field is pre-filled to **2 decimals** with the invoice's full outstanding and **auto-selected** when the modal opens — so the existing one-click full-payment flow is unchanged (just press Enter / click Mark as Paid).
- To record a partial payment (e.g. $400 of a $1,000 invoice) the user types a smaller value. The invoice stays on the AR/AP report with the reduced outstanding; multiple partial payments compose naturally because `PaymentAllocation` already supports many rows per invoice.
- Helper text under the label shows `Outstanding: {currency} {amount}` so the cap is visible at a glance.
- Validation:
  - Client: button disables and inline error appears when amount ≤ 0 or amount > outstanding.
  - Server: rejects with 400 — `paymentAmount must be greater than zero` / `paymentAmount (...) exceeds outstanding (...)`.
- API: `POST /vouchers/:id/mark-paid` accepts an optional multipart `paymentAmount` field. Omitting it preserves today's behaviour (full payment, fully backward-compatible).

### Added — Settle Netting Cycle flow

- New green-check action on a Netting Settlement row (synthetic row at Level 2) opens a dedicated **Settle Netting Cycle** modal for any non-terminal cycle status (`OPEN` / `PENDING_AM` / `PENDING_CEO` / `APPROVED` / `PARTIAL`), so the user can settle a netting cycle directly from the AR/AP report without going through the formal AM/CEO approval workflow first.
- Modal shows AR total, AP total, computed offset, and the net with a Receivable/Payable badge (all displayed to 2 decimals). Cash field is **locked** to the full net — settling a cycle always pays the full net in one go.
- One round-trip creates a single `JOURNAL` voucher that carries both:
  - **Offset wash**: `Dr Trade Account / Cr Trade Account` for `min(AR, AP)` — net GL impact $0 but writes `PaymentAllocation` rows on both sides (oldest-first), so the matched portion of the AR and AP invoices is properly cleared.
  - **Cash leg** (if cash > 0): `Dr Trade / Cr Bank` for net Payable, or `Dr Bank / Cr Trade` for net Receivable — allocated to the remaining larger-side invoices.
- Cycle status auto-updates after settlement:
  - Both sides cleared → `SETTLED`.
  - Anything remaining → `PARTIAL` (regardless of the starting status).
- Backend defence-in-depth: `SETTLED` and `AM_REJECTED` / `CEO_REJECTED` cycles still cannot be settled — `BadRequestException: This netting cycle cannot be settled (already settled or rejected)`.
- Endpoint: `POST /netting-cycles/:id/settle` (multipart: `cashAmount`, optional `bankAccountId`, `paymentDate`, `file`).

### Changed — AR/AP report visibility for BOTH-type contacts

- For BOTH-type contacts, the report now hides invoices that are **not linked to a synthetic-row netting cycle** (statuses `OPEN`, `PENDING_AM`, `PENDING_CEO`, `APPROVED`, `PARTIAL`). Invoices linked only to a rejected (`AM_REJECTED` / `CEO_REJECTED`) cycle or unlinked invoices are no longer surfaced.
- This guarantees the 3-level hierarchy: every visible BOTH-contact invoice is rendered nested under its synthetic Netting Settlement row, never flat at Level 2.
- The filter is gated on `includeNettingAdjustments === true` (the default). With the **Netting-adjusted view** toggle off, every invoice reappears (audit mode unchanged).
- `CUSTOMER` and `VENDOR` contacts are unaffected by this filter.

### Changed — Netting Settlement row outstanding now equals the cycle's own net

- The synthetic Netting Settlement row's outstanding amount used to include a "carry-forward" term — every POSTED SALES/PURCHASE voucher for the same contact dated before `cycle.startDate` and not linked to the cycle, signed by AR/AP nature.
- That term has been removed. The row's outstanding now equals `|cycle AR − cycle AP|` exactly, matching what the Settle Netting Cycle modal shows and acts on.
- Side effect: pre-cycle unlinked invoices for BOTH contacts remain hidden under default flags (the BOTH-contact filter above still applies). Toggle off **Netting-adjusted view** to see them in audit mode.

### Changed — Pending (Open / Pending AM / Pending CEO) cycles also show net

- Previously pending cycles showed **gross** AR (in AR report) or gross AP (in AP report), under the assumption that netting wasn't yet legally agreed.
- They now show the net (`|cycle AR − cycle AP|`) using the same math as approved cycles. The cycle still carries its pending badge ("Open" / "Pending AM Approval" / "Pending CEO Approval") so the user can tell the netting isn't formally approved yet.
- Pending cycles still cannot be settled via the new Settle Netting Cycle modal — the green check falls back to single-invoice payment, unchanged.

### Notes

- No database migrations. All schema (`PaymentAllocation.amount Decimal(20,4)`, `NettingCycleInvoice` linkage, `NettingCycle.status` enum) already supported these flows; only application behaviour changed.
- `Voucher.currencyCode` is now surfaced on AR/AP report row payloads (regular and constituent rows) so the frontend can label the Outstanding / Amount fields in the right currency.
- The existing `MARKED_PAID` event payload picks up the actual paid amount (`amountStr`) automatically, so partial-payment emails / bell notifications reflect the partial figure with no extra work.

---

## `notification` branch — 2026-05-07

### Added — Beneficiary Name on Contacts

- New **Beneficiary Name** field in the Bank Details section of the Contact form (the account holder name).
- Available in both **Add Contact** and **Edit Contact** flows.
- Displayed first in the bank grid of the Contact Quick View (used from AR/AP rows).
- Stored as a nullable column on `Contact.bankBeneficiaryName`.

### Added — Email + in-app notifications for Mark as Paid and voucher comments

- When a user clicks **Mark as Paid** on an AR or AP row:
  - All users with role **SUPER_ADMIN, OWNER, CHIEF_ACCOUNTANT, ACCOUNTANT** receive
    - 📧 An email titled "Payment received against …" (AR) or "Payment sent against …" (AP), summarizing invoice/bill, payment voucher, amount, date, and counterparty.
    - 🔔 A bell-icon notification of type `INVOICE_PAID`.
  - The user who performed the action is **excluded** from both the email and the bell notification.
- When a user adds a **comment** on a voucher (from the AR/AP comment icon or the voucher detail):
  - Same recipient list (SUPER_ADMIN, OWNER, CHIEF_ACCOUNTANT, ACCOUNTANT, actor excluded).
  - 📧 Email titled "New comment on …", with the comment body inline.
  - 🔔 Bell notification of type `VOUCHER_COMMENT_ADDED`.
- Email transport reuses the existing pipeline: **Microsoft Graph (OAuth client credentials) first, SMTP fallback** — same setup used for netting cycle reviews.
- New email templates: `invoice-paid.hbs` (green header, payment summary) and `voucher-comment-added.hbs` (indigo header, comment body).

### Database

- Migration `20260507120000_add_contact_bank_beneficiary_name` — adds `Contact.bankBeneficiaryName VARCHAR(255)` (nullable).
- Migration `20260507130000_add_notification_types_paid_comment` — adds `INVOICE_PAID` and `VOUCHER_COMMENT_ADDED` to the `NotificationType` enum.

### Notes

- Existing voucher events (`VOUCHER_SUBMITTED`, `VOUCHER_APPROVED`, `VOUCHER_REJECTED`, `VOUCHER_REVERSED`) **remain bell-only** — emails for those are still disabled.
- No new env vars required. Reuses existing `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_SENDER_EMAIL` and SMTP settings.

---

## `AP-report` branch — 2026-05-06

### Added — Mark as Paid flow on AR/AP reports

- New **green check icon** in the Actions column of every AR and AP row.
- Clicking it opens a Mark as Paid modal where the user uploads payment proof (image or PDF) and confirms.
- On submit, the system:
  - Creates a real **Receipt voucher** (AR) or **Payment voucher** (AP) with proper double-entry journal lines.
  - Allocates the new voucher against the invoice via `PaymentAllocation` so the invoice's outstanding balance drops to zero.
  - Attaches the uploaded file as supporting proof on the new voucher.
  - The fully paid invoice **automatically disappears** from the AR/AP report (via the existing `outstanding > 0` filter).
- The bank/cash account used for the journal entry is auto-selected:
  - First active **BankAccount** for the tenant, or
  - first active **ASSET** account if no BankAccount is configured (with a clear error if neither exists).
- Tracking columns added on `Voucher`: `markedPaidAt`, `markedPaidById`.

### Added — Comments on vouchers

- New **comment icon** in the AR/AP Actions column (and reachable from the voucher detail page).
- Opens a thread modal: see existing comments (with author + timestamp), post a new comment, and optionally attach files.
- A **count badge** on the comment icon shows how many comments exist on the row.
- Backend models: `VoucherComment` and `VoucherCommentAttachment`.
- Endpoints: `GET/POST /vouchers/:id/comments`, `GET /vouchers/:id/comments/:commentId/attachments/:attachmentId/download`.

### Added — Clickable navigation in AR/AP reports

- **Customer / Vendor name** → opens a Contact Quick View modal showing key details from the Contacts page (no need to leave the report).
- **Invoice #** → opens the voucher detail in view mode (new tab).
- **SOA icon** → opens the Statement of Account for the contact (new tab) — same destination as the SOA icon on the Contacts page.

### Added — Clickable Voucher # on Statement of Account

- On the contact-level Statement of Account page (`/dashboard/contacts/:id/statement`), each row's **Voucher #** is now a link that opens the voucher in view mode.
- The print/PDF export keeps voucher numbers as plain text (intentional).

### Added — "Outstanding only" filter on AR/AP

- A checkbox above the AR/AP table to toggle whether fully-paid invoices appear.
- Default ON — keeps the report focused on what's actually owed.

### Database

- Migration `20260506123327_add_voucher_comments_mark_paid` — adds `voucher_comments`, `voucher_comment_attachments` tables; adds `markedPaidAt`/`markedPaidById` columns; adds `category` column on `voucher_attachments`.

### Notes

- Marking an invoice as paid is now a **proper accounting action** — it generates an audit-trail-preserving Payment / Receipt voucher rather than just flipping a flag. Reversal should be done via voucher reversal, not by deleting.
- AR / AP / SOA logic confirmed:
  - **AR Report** → only `SALES` invoices (filter on `voucherType`).
  - **AP Report** → only `PURCHASE` invoices.
  - **SOA** → all transactions for the contact (sales, purchases, payments, receipts) — by design, since SOA is a complete ledger view.
