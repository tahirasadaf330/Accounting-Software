# AR / AP Report — BOTH Contact Netting Logic

**Feature:** Netting Cycle Integration into AR/AP Aging Reports  
**Branch:** staging  
**Author:** Development Team  
**Date:** 2026-05-07

---

## Background

The system supports a contact type of **BOTH**, meaning a single contact can have both Sales invoices (money owed to us) and Purchase invoices (money we owe them). Before this change, the AR and AP aging reports treated such contacts independently — showing gross receivable in AR and gross payable in AP with no awareness of the offsetting relationship.

This document describes the business logic implemented to handle BOTH-type contacts correctly through the existing Netting Cycle workflow.

---

## The Problem

### Before the Fix

| Report | What it showed |
|--------|---------------|
| AR Report | Full gross SALES outstanding (e.g. $2,000) |
| AP Report | Full gross PURCHASE outstanding (e.g. $600) |

The same BOTH contact appeared in **both** reports simultaneously, creating misleading exposure figures. The true net position ($1,400 receivable) was invisible unless you manually cross-referenced both reports.

---

## The Solution

### Netting Cycle as the Source of Truth

The Netting Cycle module (already existing) is the formal approval workflow for offsetting AR and AP for a BOTH contact. The updated AR/AP reports now read netting cycle status and reflect it accordingly.

---

## Business Logic: Treatment by Cycle Status

| Netting Cycle Status | AR / AP Report Behaviour |
|---|---|
| **APPROVED / PARTIAL** | Constituent invoices are **excluded** from individual rows. One synthetic "Netting Settlement" row replaces them, showing the net amount. |
| **SETTLED** | Invoices excluded. Hidden by default (shown as $0 if gross view is enabled). |
| **OPEN / PENDING_AM / PENDING_CEO** | Invoices shown individually but **flagged** with an amber "Pending Netting" badge — netting proposed but not yet binding. |
| **AM_REJECTED / CEO_REJECTED** | Invoices shown completely normally — netting was declined, treated as if the cycle never existed. |

---

## Net Position Calculation (per Approved Cycle)

```
Cycle Receivable   =  sum of outstanding SALES invoices inside the cycle
                      (payments counted only up to the As-Of Date)

Cycle Payable      =  sum of outstanding PURCHASE invoices inside the cycle
                      (payments counted only up to the As-Of Date)

Carry Forward      =  outstanding invoices dated BEFORE the cycle period
                      that are NOT explicitly in the cycle's invoice list
                      → SALES invoices  = positive contribution
                      → PURCHASE invoices = negative contribution

Cycle Net          =  Cycle Receivable − Cycle Payable
Net Total          =  Cycle Net + Carry Forward
```

### Net Total Determines Which Report Gets the Row

| Net Total | Appears in | As |
|---|---|---|
| **Positive (> 0)** | AR Report only | Single "Netting Settlement" row |
| **Negative (< 0)** | AP Report only | Single "Netting Settlement" row |
| **≈ Zero (settled)** | Neither report | Hidden (or $0 row in gross view) |

A BOTH contact **never appears in both reports simultaneously** once an approved cycle exists.

---

## Aging of the Net Row

The synthetic settlement row is aged using the **cycle's due date** (`cycle.endDate + contact.paymentTermDays`), not any individual invoice date. This gives a single, clean overdue position for the whole netting settlement.

---

## Summary Section — Three Figures

The report summary now exposes three figures when netting adjustments are active:

| Field | Description |
|---|---|
| **Gross Outstanding** | What the outstanding would be without any netting (all invoices raw) |
| **Netting Offset** | Amount removed / offset by approved netting cycles |
| **Net Outstanding** | True exposure = Gross Outstanding − Netting Offset + net settlement rows |

---

## Gross View Toggle

A **"Netting-adjusted view"** checkbox (default: ON) is available in the report filter bar.

| Toggle State | Behaviour |
|---|---|
| **ON (default)** | Approved cycles collapsed into single net rows. Accurate financial exposure. |
| **OFF (gross view)** | All invoices shown individually, original pre-fix behaviour. Useful for audit/reconciliation. |

---

## Carry Forward — Why It Matters

When a netting cycle is created, the netting service automatically identifies **carry-forward invoices**: outstanding invoices for that contact dated *before* the cycle's start date that were not explicitly added to the cycle. These are factored into the cycle's net total.

In the AR/AP reports, these carry-forward invoices are also **excluded from individual rows** to avoid double-counting — their outstanding amount is already embedded inside the cycle's net settlement row.

---

## Worked Example

**Contact:** ABC Trading (type: BOTH)

| Invoice | Type | Amount | Status |
|---|---|---|---|
| INV-001 | SALES | $1,000 | Outstanding |
| INV-002 | SALES | $1,000 | Outstanding |
| PO-001 | PURCHASE | $600 | Outstanding |

All three linked in an **APPROVED** netting cycle.

```
Cycle Receivable = $1,000 + $1,000 = $2,000
Cycle Payable    = $600
Cycle Net        = $2,000 − $600 = $1,400  →  Receivable
Carry Forward    = $0 (no pre-cycle invoices)
Net Total        = $1,400
```

### AR Report Result

| Contact | Invoice # | Outstanding | Aging | Note |
|---|---|---|---|---|
| ABC Trading | NETTING-XXXXXXXX | $1,400 | (based on cycle due date) | NET badge — Netting Settlement |

### AP Report Result

*(ABC Trading does not appear — net position is Receivable)*

### Summary

| | Amount |
|---|---|
| Gross Outstanding | $2,000 |
| Netting Offset | −$600 |
| **Net Outstanding** | **$1,400** |

---

## Edge Cases Handled

| Scenario | Handling |
|---|---|
| BOTH contact with some invoices in a cycle AND some standalone | Standalone invoices shown normally; only cycle-linked invoices are excluded/netted |
| Multiple approved cycles for same contact | Each cycle produces one synthetic row with its own due date and aging bucket |
| Rejected cycle (AM_REJECTED / CEO_REJECTED) | All invoices revert to normal rows, no flag, as if cycle never existed |
| Contact with no netting cycles | No change — report behaves exactly as before |
| `includeNettingAdjustments=false` (gross view) | All invoices shown individually, original behaviour restored |

---

## Files Modified

| File | Change |
|---|---|
| `packages/shared/src/types/report.ts` | Added `nettingCycleId`, `nettingCycleStatus`, `isNettingSettlement` to `ARAPRow`; added `grossOutstanding`, `nettingAdjustment` to summary; added `includeNettingAdjustments` to filters |
| `apps/api/src/modules/reports/ar-report.service.ts` | Full netting-aware rewrite |
| `apps/api/src/modules/reports/ap-report.service.ts` | Full netting-aware rewrite (symmetric with AR) |
| `apps/api/src/modules/reports/dto/ar-ap-report-query.dto.ts` | Added `includeNettingAdjustments` query param |
| `apps/web/src/app/(dashboard)/dashboard/reports/page.tsx` | Filter toggle, netting summary cards, settlement row UI, pending netting badges |
