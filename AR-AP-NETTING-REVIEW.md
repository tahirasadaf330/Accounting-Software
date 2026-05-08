# AR / AP Aging Report — Feature Overview

**Branch:** staging  
**Last Updated:** 2026-05-08

---

## What Are These Reports?

The **Accounts Receivable (AR) Report** shows money that customers owe you.  
The **Accounts Payable (AP) Report** shows money you owe to vendors.

Both reports are point-in-time snapshots — you pick an "As of Date" and the report tells you exactly what was outstanding on that day.

---

## The Problem We Solved

Some contacts are type **BOTH** — they are simultaneously a customer and a vendor. For example, Ibasis Tech buys from you ($800) but also sells to you ($3,500). Before this implementation, Ibasis Tech would appear in the AR report showing the full $3,500 owed, AND in the AP report showing the full $800 you owe them. Nobody could see the real picture: you're actually owed a net $2,700.

This feature fixes that by using the existing **Netting Cycle** workflow to calculate and display the true net position.

---

## What Is a Netting Cycle?

A netting cycle is a formal agreement created in the system that links a BOTH contact's sales invoices and purchase invoices together for offsetting. It goes through an approval workflow before it takes effect:

| Stage | Meaning |
|---|---|
| Open / Pending AM / Pending CEO | Netting proposed — awaiting approval |
| Approved / Partial | Netting is active — net position is calculated |
| Settled | Everything is cleared |
| Rejected | Netting was declined — invoices treated normally |

---

## How the Reports Now Work

### For contacts with an Approved netting cycle

Instead of showing individual invoices, the report shows a single **"Netting Settlement"** row with the net amount. The contact appears in only one report — AR if they owe you money net, AP if you owe them net. They never appear in both reports at the same time.

You can click the row to expand it and see the individual invoices that make up the net figure.

### For contacts with a Pending cycle (not yet approved)

The report still shows a single row per cycle, but it shows the gross amount (not netted) and displays a badge showing the approval stage — "Pending AM Approval", "Pending CEO Approval", or "Open". Once approved, it automatically switches to the net view.

### For contacts with a Rejected cycle

All invoices appear individually, exactly as if the netting cycle never existed.

### For regular contacts (no netting cycle)

No change at all — the report works exactly as a standard aging report.

---

## What You Can Do With the Report

### Filter by aging bucket
Seven clickable cards at the top show outstanding amounts split by how many days overdue:
**Current → 1–7 → 8–15 → 16–30 → 31–60 → 61–90 → 91+ Days**

Click any card to filter the table to only show invoices in that range. Click again to clear.

### Outstanding only toggle
When on (default): only shows invoices that still have money owed. When off: shows everything including fully paid invoices — useful for auditing history.

### Netting-adjusted view toggle
When on (default): BOTH contacts show their net position via settlement rows. When off: shows every invoice individually regardless of any netting — useful for reconciliation or audit.

### Mark individual invoices as paid
Each invoice row has a Mark Paid button. On netting settlement rows, clicking Mark Paid will pay the first outstanding invoice inside the cycle. In the AP report, sales invoices are disabled (you can only pay them from the AR report, and vice versa).

### Mark Paid All (per contact)
The contact header has a "Mark Paid All" button that opens the payment modal for the first outstanding invoice for that contact. For BOTH contacts it finds the right invoice type automatically.

### Comments
Each invoice row has a comments icon showing how many comments exist. Click to view or add comments.

### SOA link
Each invoice links to the full Statement of Account for that contact.

### Print / Export PDF
Available at the top of the generated report.

---

## UI Enhancements

### 3-Level Collapsible Table

The report table is organised into three expandable levels so you can drill down only as far as you need:

**Level 1 — Contact** (always visible)
Shows the contact name, their type badge (Customer / Vendor / BOTH), total outstanding across all their invoices, and a Mark Paid All button.

**Level 2 — Invoices / Netting Settlements** (expand the contact to see)
Shows each invoice or, for BOTH contacts with a netting cycle, a single Netting Settlement row showing the net amount, the cycle status badge, and an aging badge.

**Level 3 — Constituent Invoices** (expand a Netting Settlement row to see)
Shows the individual invoices that make up the netting settlement, each with their own amounts, aging, and Mark Paid button.

### Expand All / Collapse All

At the top right of the table there is an **Expand All** button that opens every contact group at once — useful when you want to scan all invoices across all contacts without clicking each one individually. **Collapse All** folds everything back. When an aging filter card is active, Expand All only expands the contacts visible in the current filter.

---

## Summary Cards

The bottom of the report shows:
- **Total Invoiced** — gross invoice value
- **Total Paid** — total payments received/made
- **Gross Outstanding** — what would be outstanding without any netting (shown when netting is active)
- **Netting Offset** — amount offset by approved netting cycles
- **Net Outstanding** — the true current exposure after netting
