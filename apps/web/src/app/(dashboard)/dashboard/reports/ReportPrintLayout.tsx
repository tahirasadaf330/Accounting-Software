import React from 'react';
import { formatCurrency } from '@/lib/formatCurrency';

type ReportType = 'trial-balance' | 'balance-sheet' | 'income-statement' | 'statement-of-account' | 'invoice-report';

interface ReportPrintLayoutProps {
  reportType: ReportType;
  reportData: any;
  companyName: string;
  baseCurrency: string;
  dateRange: { fromDate: string; toDate: string };
  selectedAccount?: { code: string; name: string } | null;
}

const reportTitles: Record<ReportType, string> = {
  'trial-balance': 'Trial Balance',
  'balance-sheet': 'Balance Sheet',
  'income-statement': 'Income Statement',
  'statement-of-account': 'Statement of Account',
  'invoice-report': 'Invoice Report',
};

const thStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  padding: '6px 8px',
  fontWeight: 600,
  backgroundColor: '#f3f4f6',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  padding: '6px 8px',
};

const tdRightStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#6b7280',
  margin: '16px 0 8px 0',
};

const sectionTotalRowStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  fontWeight: 700,
};

const ReportPrintLayout = React.forwardRef<HTMLDivElement, ReportPrintLayoutProps>(
  ({ reportType, reportData, companyName, baseCurrency, dateRange, selectedAccount }, ref) => {
    const fmt = (v: number | string) => formatCurrency(v, baseCurrency);

    const periodLabel = () => {
      if (reportType === 'trial-balance' || reportType === 'balance-sheet') {
        return `As of ${reportData?.asOfDate || dateRange.toDate}`;
      }
      if (reportType === 'invoice-report') {
        return `${reportData?.filters?.dateFrom || dateRange.fromDate} to ${reportData?.filters?.dateTo || dateRange.toDate}`;
      }
      return `${reportData?.periodStart || dateRange.fromDate} to ${reportData?.periodEnd || dateRange.toDate}`;
    };

    return (
      <div
        ref={ref}
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#000',
          backgroundColor: '#fff',
          padding: '32px',
          maxWidth: reportType === 'trial-balance' || reportType === 'statement-of-account' || reportType === 'invoice-report' ? '1100px' : '800px',
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

        {/* Report Title */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 700,
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {reportTitles[reportType]}
        </h2>

        {/* Account info for SoA */}
        {reportType === 'statement-of-account' && (reportData?.accountCode || selectedAccount) && (
          <p style={{ textAlign: 'center', fontSize: '13px', margin: '0 0 4px 0', color: '#374151' }}>
            <span style={{ fontFamily: 'monospace' }}>{reportData?.accountCode || selectedAccount?.code}</span>
            {' — '}
            {reportData?.accountName || selectedAccount?.name}
          </p>
        )}

        {/* Period */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', margin: '0 0 20px 0' }}>
          {periodLabel()}
        </p>

        {/* Trial Balance */}
        {reportType === 'trial-balance' && reportData?.rows && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '24px',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', width: '15%' }}>Code</th>
                <th style={{ ...thStyle, textAlign: 'left', width: '45%' }}>Account</th>
                <th style={{ ...thStyle, textAlign: 'right', width: '20%' }}>Debit</th>
                <th style={{ ...thStyle, textAlign: 'right', width: '20%' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {reportData.rows.map((row: any, i: number) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{row.accountCode}</td>
                  <td style={tdStyle}>{row.accountName}</td>
                  <td style={tdRightStyle}>
                    {Number(row.debit) > 0 ? fmt(row.debit) : ''}
                  </td>
                  <td style={tdRightStyle}>
                    {Number(row.credit) > 0 ? fmt(row.credit) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={sectionTotalRowStyle}>
                <td colSpan={2} style={{ ...tdStyle, fontWeight: 700 }}>Total</td>
                <td style={{ ...tdRightStyle, fontWeight: 700 }}>{fmt(reportData.totalDebit)}</td>
                <td style={{ ...tdRightStyle, fontWeight: 700 }}>{fmt(reportData.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Balance Sheet */}
        {reportType === 'balance-sheet' && (
          <div>
            {(['assets', 'liabilities', 'equity'] as const).map((section) => {
              const data = reportData?.[section];
              if (!data) return null;
              return (
                <div key={section}>
                  <h3 style={sectionHeadingStyle}>{data.title || section}</h3>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginBottom: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <tbody>
                      {data.rows?.map((row: any, i: number) => (
                        <tr key={i}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', width: '15%' }}>{row.accountCode}</td>
                          <td style={{ ...tdStyle, width: '55%' }}>{row.accountName}</td>
                          <td style={{ ...tdRightStyle, width: '30%' }}>
                            {Number(row.debit) > 0 ? fmt(row.debit) : fmt(row.credit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={sectionTotalRowStyle}>
                        <td colSpan={2} style={{ ...tdStyle, fontWeight: 700 }}>
                          Total {data.title || section}
                        </td>
                        <td style={{ ...tdRightStyle, fontWeight: 700 }}>{fmt(data.total || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '8px',
                fontSize: '13px',
              }}
            >
              <tbody>
                <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 700 }}>
                  <td
                    style={{
                      border: '2px solid #9ca3af',
                      padding: '8px',
                      width: '70%',
                    }}
                  >
                    Total Liabilities &amp; Equity
                  </td>
                  <td
                    style={{
                      border: '2px solid #9ca3af',
                      padding: '8px',
                      textAlign: 'right',
                      width: '30%',
                    }}
                  >
                    {fmt(reportData?.totalLiabilitiesAndEquity || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Income Statement */}
        {reportType === 'income-statement' && (
          <div>
            {[
              { key: 'revenue', data: reportData?.revenue },
              { key: 'cogs', data: reportData?.costOfGoodsSold },
              { key: 'expenses', data: reportData?.expenses },
            ]
              .filter((s) => s.data)
              .map((section) => (
                <div key={section.key}>
                  <h3 style={sectionHeadingStyle}>{section.data.title}</h3>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginBottom: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <tbody>
                      {section.data.rows?.map((row: any, j: number) => (
                        <tr key={j}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', width: '15%' }}>{row.accountCode}</td>
                          <td style={{ ...tdStyle, width: '55%' }}>{row.accountName}</td>
                          <td style={{ ...tdRightStyle, width: '30%' }}>
                            {Number(row.debit) > 0 ? fmt(row.debit) : fmt(row.credit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={sectionTotalRowStyle}>
                        <td colSpan={2} style={{ ...tdStyle, fontWeight: 700 }}>
                          Total {section.data.title}
                        </td>
                        <td style={{ ...tdRightStyle, fontWeight: 700 }}>{fmt(section.data.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}

            {reportData?.grossProfit !== undefined && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #d1d5db',
                  padding: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  margin: '8px 0',
                }}
              >
                <span>Gross Profit</span>
                <span>{fmt(reportData.grossProfit)}</span>
              </div>
            )}

            {reportData?.netIncome !== undefined && (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '8px',
                  fontSize: '13px',
                }}
              >
                <tbody>
                  <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 700 }}>
                    <td
                      style={{
                        border: '2px solid #9ca3af',
                        padding: '8px',
                        width: '70%',
                      }}
                    >
                      Net Income
                    </td>
                    <td
                      style={{
                        border: '2px solid #9ca3af',
                        padding: '8px',
                        textAlign: 'right',
                        width: '30%',
                      }}
                    >
                      {fmt(reportData.netIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Statement of Account */}
        {reportType === 'statement-of-account' && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '24px',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', width: '12%' }}>Date</th>
                <th style={{ ...thStyle, textAlign: 'left', width: '13%' }}>Voucher #</th>
                <th style={{ ...thStyle, textAlign: 'left', width: '30%' }}>Narration</th>
                <th style={{ ...thStyle, textAlign: 'right', width: '15%' }}>Debit</th>
                <th style={{ ...thStyle, textAlign: 'right', width: '15%' }}>Credit</th>
                <th style={{ ...thStyle, textAlign: 'right', width: '15%' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <td colSpan={3} style={{ ...tdStyle, fontWeight: 600 }}>Opening Balance</td>
                <td style={tdRightStyle} />
                <td style={tdRightStyle} />
                <td style={{ ...tdRightStyle, fontWeight: 600 }}>
                  {fmt(reportData?.openingBalance || 0)}
                </td>
              </tr>
              {/* Transaction lines */}
              {reportData?.lines?.map((line: any, i: number) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{line.date}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {line.voucherNumber}
                  </td>
                  <td style={tdStyle}>{line.narration}</td>
                  <td style={tdRightStyle}>
                    {Number(line.debit) > 0 ? fmt(line.debit) : ''}
                  </td>
                  <td style={tdRightStyle}>
                    {Number(line.credit) > 0 ? fmt(line.credit) : ''}
                  </td>
                  <td style={tdRightStyle}>{fmt(line.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={sectionTotalRowStyle}>
                <td colSpan={3} style={{ ...tdStyle, fontWeight: 700 }}>Closing Balance</td>
                <td style={{ ...tdRightStyle, fontWeight: 700 }}>{fmt(reportData?.totalDebit || 0)}</td>
                <td style={{ ...tdRightStyle, fontWeight: 700 }}>{fmt(reportData?.totalCredit || 0)}</td>
                <td style={{ ...tdRightStyle, fontWeight: 700 }}>
                  <div>
                    {fmt(reportData?.closingBalance || 0)}
                    {reportData?.closingBalanceNature && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', color: reportData.closingBalanceNature === 'Receivable' ? '#15803d' : reportData.closingBalanceNature === 'Payable' ? '#b91c1c' : '#6b7280' }}>
                        {reportData.closingBalanceNature}
                      </span>
                    )}
                  </div>
                  {reportData?.closingDueDate && (
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', fontWeight: 400 }}>
                      Due: {reportData.closingDueDate}
                    </div>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Invoice Report */}
        {reportType === 'invoice-report' && (
          <div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '24px',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left', width: '8%' }}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'left', width: '12%' }}>Voucher #</th>
                  <th style={{ ...thStyle, textAlign: 'left', width: '9%' }}>Type</th>
                  <th style={{ ...thStyle, textAlign: 'left', width: '14%' }}>Contact</th>
                  <th style={{ ...thStyle, textAlign: 'left', width: '10%' }}>Reference</th>
                  <th style={{ ...thStyle, textAlign: 'left', width: '17%' }}>Narration</th>
                  <th style={{ ...thStyle, textAlign: 'left', width: '10%' }}>Period</th>
                  <th style={{ ...thStyle, textAlign: 'right', width: '12%' }}>Amount</th>
                  <th style={{ ...thStyle, textAlign: 'left', width: '8%' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.rows?.map((row: any, i: number) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{row.date}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{row.voucherNumber}</td>
                    <td style={tdStyle}>{row.voucherType}</td>
                    <td style={tdStyle}>{row.contactName ?? ''}</td>
                    <td style={tdStyle}>{row.reference ?? ''}</td>
                    <td style={tdStyle}>{row.narration}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontSize: '11px' }}>
                      {row.periodStart && row.periodEnd
                        ? `${row.periodStart} — ${row.periodEnd}`
                        : row.periodStart ?? row.periodEnd ?? ''}
                    </td>
                    <td style={tdRightStyle}>{fmt(row.totalAmount)}</td>
                    <td style={tdStyle}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reportData?.summary && (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '8px',
                  fontSize: '13px',
                }}
              >
                <tbody>
                  <tr style={sectionTotalRowStyle}>
                    <td style={{ ...tdStyle, width: '60%', fontWeight: 700 }}>
                      Total Sales ({reportData.summary.totalSalesCount} invoices)
                    </td>
                    <td style={{ ...tdRightStyle, fontWeight: 700 }}>{fmt(reportData.summary.totalSales)}</td>
                  </tr>
                  <tr style={sectionTotalRowStyle}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      Total Purchases ({reportData.summary.totalPurchasesCount} invoices)
                    </td>
                    <td style={{ ...tdRightStyle, fontWeight: 700 }}>{fmt(reportData.summary.totalPurchases)}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 700 }}>
                    <td style={{ border: '2px solid #9ca3af', padding: '8px', fontWeight: 700 }}>
                      Net Balance
                    </td>
                    <td style={{ border: '2px solid #9ca3af', padding: '8px', textAlign: 'right', fontWeight: 700 }}>
                      {fmt(reportData.summary.netBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
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
            marginTop: '24px',
          }}
        >
          Printed on: {new Date().toLocaleString()}
        </div>
      </div>
    );
  },
);

ReportPrintLayout.displayName = 'ReportPrintLayout';

export default ReportPrintLayout;
