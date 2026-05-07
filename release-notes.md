# Release Notes

A running record of features, fixes, and changes per branch / release.

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
