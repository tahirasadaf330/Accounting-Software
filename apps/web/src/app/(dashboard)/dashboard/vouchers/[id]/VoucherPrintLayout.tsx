import React from 'react';
import { formatCurrency } from '@/lib/formatCurrency';

interface LineItem {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  narration: string | null;
  lineOrder: number;
  account: { id: string; code: string; name: string };
}

interface VoucherDetail {
  id: string;
  voucherNumber: string;
  voucherType: string;
  status: string;
  date: string;
  narration: string;
  reference: string | null;
  totalAmount: string;
  currencyCode: string;
  createdBy?: { firstName: string; lastName: string };
  approvedBy?: { firstName: string; lastName: string } | null;
  createdAt: string;
  lineItems: LineItem[];
  contact?: { id: string; name: string; invoiceTerms?: string | null; paymentTermDays?: number | null } | null;
}

const typeLabels: Record<string, string> = {
  PAYMENT: 'Payment',
  RECEIPT: 'Receipt',
  JOURNAL: 'Journal',
  CONTRA: 'Contra',
  SALES: 'Sales',
  PURCHASE: 'Purchase',
  CREDIT_NOTE: 'Credit Note',
  DEBIT_NOTE: 'Debit Note',
};

interface VoucherPrintLayoutProps {
  voucher: VoucherDetail;
  companyName: string;
}

const VoucherPrintLayout = React.forwardRef<HTMLDivElement, VoucherPrintLayoutProps>(
  ({ voucher, companyName }, ref) => {
    const fmt = (v: number | string) => formatCurrency(v, voucher.currencyCode);
    const totalDebit = voucher.lineItems.reduce((s, li) => s + Number(li.debit), 0);
    const totalCredit = voucher.lineItems.reduce((s, li) => s + Number(li.credit), 0);

    const createdByName = voucher.createdBy
      ? `${voucher.createdBy.firstName} ${voucher.createdBy.lastName}`
      : '';
    const approvedByName = voucher.approvedBy
      ? `${voucher.approvedBy.firstName} ${voucher.approvedBy.lastName}`
      : '';

    return (
      <div
        ref={ref}
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#000',
          backgroundColor: '#fff',
          padding: '32px',
          maxWidth: '800px',
          margin: '0 auto',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
      >
        {/* Company Name */}
        <h1
          style={{
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 700,
            margin: '0 0 4px 0',
          }}
        >
          {companyName}
        </h1>

        <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '12px 0' }} />

        {/* Document Title */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 700,
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {typeLabels[voucher.voucherType] || voucher.voucherType} Voucher
        </h2>

        {/* Metadata Grid */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 600, width: '15%' }}>Voucher No.</td>
              <td style={{ padding: '4px 8px', width: '35%' }}>{voucher.voucherNumber}</td>
              <td style={{ padding: '4px 8px', fontWeight: 600, width: '15%' }}>Status</td>
              <td style={{ padding: '4px 8px', width: '35%' }}>
                {voucher.status.replace(/_/g, ' ')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>Date</td>
              <td style={{ padding: '4px 8px' }}>
                {new Date(voucher.date).toLocaleDateString()}
              </td>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>Created By</td>
              <td style={{ padding: '4px 8px' }}>{createdByName || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>Reference</td>
              <td style={{ padding: '4px 8px' }}>{voucher.reference || '—'}</td>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>Approved By</td>
              <td style={{ padding: '4px 8px' }}>{approvedByName || '—'}</td>
            </tr>
            {voucher.contact?.paymentTermDays && (
              <tr>
                <td style={{ padding: '4px 8px', fontWeight: 600 }}>Payment Terms</td>
                <td style={{ padding: '4px 8px' }} colSpan={3}>
                  Net {voucher.contact.paymentTermDays} days
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Narration */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Narration</div>
          <div
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              minHeight: '24px',
            }}
          >
            {voucher.narration}
          </div>
        </div>

        {/* Line Items Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '24px',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'left',
                  fontWeight: 600,
                  width: '5%',
                }}
              >
                #
              </th>
              <th
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'left',
                  fontWeight: 600,
                  width: '12%',
                }}
              >
                Account Code
              </th>
              <th
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'left',
                  fontWeight: 600,
                  width: '25%',
                }}
              >
                Account Name
              </th>
              <th
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'right',
                  fontWeight: 600,
                  width: '15%',
                }}
              >
                Debit
              </th>
              <th
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'right',
                  fontWeight: 600,
                  width: '15%',
                }}
              >
                Credit
              </th>
              <th
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'left',
                  fontWeight: 600,
                  width: '28%',
                }}
              >
                Narration
              </th>
            </tr>
          </thead>
          <tbody>
            {voucher.lineItems.map((li, i) => (
              <tr key={li.id}>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>{i + 1}</td>
                <td
                  style={{
                    border: '1px solid #d1d5db',
                    padding: '6px 8px',
                    fontFamily: 'monospace',
                  }}
                >
                  {li.account.code}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                  {li.account.name}
                </td>
                <td
                  style={{
                    border: '1px solid #d1d5db',
                    padding: '6px 8px',
                    textAlign: 'right',
                  }}
                >
                  {Number(li.debit) > 0 ? fmt(li.debit) : ''}
                </td>
                <td
                  style={{
                    border: '1px solid #d1d5db',
                    padding: '6px 8px',
                    textAlign: 'right',
                  }}
                >
                  {Number(li.credit) > 0 ? fmt(li.credit) : ''}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                  {li.narration || ''}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 700 }}>
              <td
                colSpan={3}
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  fontWeight: 700,
                }}
              >
                Totals
              </td>
              <td
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'right',
                  fontWeight: 700,
                }}
              >
                {fmt(totalDebit)}
              </td>
              <td
                style={{
                  border: '1px solid #d1d5db',
                  padding: '6px 8px',
                  textAlign: 'right',
                  fontWeight: 700,
                }}
              >
                {fmt(totalCredit)}
              </td>
              <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }} />
            </tr>
          </tfoot>
        </table>

        {/* Signature Area */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '24px',
          }}
        >
          <tbody>
            <tr>
              <td style={{ width: '50%', padding: '0 16px 0 0', verticalAlign: 'bottom' }}>
                <div style={{ marginBottom: '8px', fontWeight: 600 }}>Prepared By:</div>
                <div
                  style={{
                    borderBottom: '1px solid #000',
                    minHeight: '32px',
                    marginBottom: '4px',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#666' }}>{createdByName}</div>
              </td>
              <td style={{ width: '50%', padding: '0 0 0 16px', verticalAlign: 'bottom' }}>
                <div style={{ marginBottom: '8px', fontWeight: 600 }}>Approved By:</div>
                <div
                  style={{
                    borderBottom: '1px solid #000',
                    minHeight: '32px',
                    marginBottom: '4px',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#666' }}>{approvedByName}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Invoice Terms */}
        {voucher.contact?.invoiceTerms && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
              Terms &amp; Conditions
            </div>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#374151',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}
            >
              {voucher.contact.invoiceTerms}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '8px',
            fontSize: '11px',
            color: '#999',
            textAlign: 'center',
          }}
        >
          Printed on: {new Date().toLocaleString()}
        </div>
      </div>
    );
  },
);

VoucherPrintLayout.displayName = 'VoucherPrintLayout';

export default VoucherPrintLayout;
