import { useRef, useState, useCallback } from 'react';

type ReportType = 'trial-balance' | 'balance-sheet' | 'income-statement' | 'statement-of-account' | 'invoice-report';

const reportFileNames: Record<ReportType, string> = {
  'trial-balance': 'Trial_Balance',
  'balance-sheet': 'Balance_Sheet',
  'income-statement': 'Income_Statement',
  'statement-of-account': 'Statement_of_Account',
  'invoice-report': 'Invoice_Report',
};

const landscapeReports: ReportType[] = ['trial-balance', 'statement-of-account', 'invoice-report'];

export function useReportPrintPdf(reportType: ReportType) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const isLandscape = landscapeReports.includes(reportType);

  const handlePrint = useCallback(() => {
    const node = printRef.current;
    if (!node) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = isLandscape ? '1100px' : '800px';
    iframe.style.height = '600px';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    const orientation = isLandscape ? 'landscape' : 'portrait';
    const title = reportFileNames[reportType] || 'Report';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { margin: 10mm; size: ${orientation}; }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>${node.innerHTML}</body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    };

    // Fallback: if onload already fired (e.g. synchronous doc.write)
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }
    }, 500);
  }, [reportType, isLandscape]);

  const handleExportPdf = useCallback(async () => {
    const node = printRef.current;
    if (!node) return;

    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const today = new Date().toISOString().split('T')[0];
      const filename = `${reportFileNames[reportType]}_${today}.pdf`;

      await html2pdf()
        .set({
          margin: 10,
          filename,
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: isLandscape ? 'landscape' : 'portrait',
          },
        })
        .from(node)
        .save();
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setIsExporting(false);
  }, [reportType, isLandscape]);

  return { printRef, handlePrint, handleExportPdf, isExporting };
}
