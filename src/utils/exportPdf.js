import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportTransactionsToPdf = (transactions = [], user = null, balance = 0) => {
  const doc = new jsPDF();

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Chief Account';
  const userEmail = user?.email || '';
  const currentDate = format(new Date(), 'MMM d, yyyy • HH:mm');

  const formatAmount = (num) => {
    return Number(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Ensure default normal character spacing
  if (typeof doc.setCharSpace === 'function') {
    doc.setCharSpace(0);
  }

  // --- 1. Sleek Brand Header ---
  // Top header banner background
  doc.setFillColor(6, 78, 59); // Deep Emerald Slate (RGB: 6, 78, 59)
  doc.rect(0, 0, 210, 42, 'F');

  // Accent Line under header
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 42, 210, 2.5, 'F');

  // Brand Logo Circle Badge
  doc.setFillColor(16, 185, 129);
  doc.circle(22, 21, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GHS', 22, 24.5, { align: 'center' });

  // Brand Name & Subtitle
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CEDI TRACKER', 38, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208); // Emerald 200
  doc.text('Official Personal Financial Statement', 38, 28);

  // User Metadata on the right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(userName, 196, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229);
  if (userEmail && userEmail !== userName) {
    doc.text(userEmail, 196, 24, { align: 'right' });
    doc.text(currentDate, 196, 30, { align: 'right' });
  } else {
    doc.text(`Issued: ${currentDate}`, 196, 25, { align: 'right' });
  }

  // --- 2. Executive Summary Metric Cards (3 Cards Side-by-Side) ---
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const calculatedBalance = totalIncome - totalExpense;

  const cardY = 51;
  const cardHeight = 24;
  const cardWidth = 57;

  // Card 1: Total Income
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(167, 243, 208); // Emerald-200
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'D');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // Emerald-600
  doc.text('TOTAL INCOME', 20, cardY + 8);
  doc.setFontSize(10.5);
  doc.text(`GHS ${formatAmount(totalIncome)}`, 20, cardY + 18);

  // Card 2: Total Expenses
  doc.setFillColor(254, 242, 242); // Red-50
  doc.roundedRect(76, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(254, 205, 211); // Red-200
  doc.roundedRect(76, cardY, cardWidth, cardHeight, 3, 3, 'D');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // Rose-600
  doc.text('TOTAL EXPENSES', 82, cardY + 8);
  doc.setFontSize(10.5);
  doc.text(`GHS ${formatAmount(totalExpense)}`, 82, cardY + 18);

  // Card 3: Net Balance
  const isNetPositive = calculatedBalance >= 0;
  doc.setFillColor(isNetPositive ? 240 : 254, isNetPositive ? 253 : 242, isNetPositive ? 250 : 242);
  doc.roundedRect(138, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(isNetPositive ? 153 : 254, isNetPositive ? 246 : 205, isNetPositive ? 228 : 211);
  doc.roundedRect(138, cardY, cardWidth, cardHeight, 3, 3, 'D');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isNetPositive ? 13 : 225, isNetPositive ? 148 : 29, isNetPositive ? 136 : 72);
  doc.text('NET BALANCE', 144, cardY + 8);
  doc.setFontSize(10.5);
  doc.text(`GHS ${isNetPositive ? '+' : ''}${formatAmount(calculatedBalance)}`, 144, cardY + 18);

  // --- 3. Transactions Table ---
  const tableData = transactions.length > 0 ? transactions.map((t, idx) => [
    idx + 1,
    t.date ? format(new Date(t.date), 'MMM d, yyyy') : 'N/A',
    t.category || 'General',
    t.type === 'income' ? 'Income' : 'Expense',
    `${t.type === 'income' ? '+' : '-'} GHS ${formatAmount(t.amount)}`
  ]) : [['-', '-', 'No transactions recorded', '-', '-']];

  autoTable(doc, {
    startY: cardY + 31,
    head: [['#', 'Date', 'Category', 'Type', 'Amount']],
    body: tableData,
    foot: transactions.length > 0 ? [[
      '',
      '',
      `Total Records: ${transactions.length}`,
      'Net Balance:',
      `GHS ${calculatedBalance >= 0 ? '+' : ''}${formatAmount(calculatedBalance)}`
    ]] : undefined,
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4.5
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 36 },
      2: { cellWidth: 48 },
      3: { cellWidth: 32 },
      4: { cellWidth: 52, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Style cell values in Amount column
      if (data.section === 'body' && data.column.index === 4) {
        const rawText = data.cell.text[0] || '';
        if (rawText.startsWith('+')) {
          data.cell.styles.textColor = [5, 150, 105]; // Emerald
        } else if (rawText.startsWith('-')) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose
        }
      }
      // Style Type column
      if (data.section === 'body' && data.column.index === 3) {
        const typeText = data.cell.text[0] || '';
        if (typeText === 'Income') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
      // Foot amount column styling
      if (data.section === 'foot' && data.column.index === 4) {
        data.cell.styles.textColor = isNetPositive ? [5, 150, 105] : [225, 29, 72];
        data.cell.styles.halign = 'right';
      }
    }
  });

  // --- 4. Sleek Footer ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 282, 196, 282);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Cedi Tracker • Confidential Personal Financial Report', 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
  }

  // Save PDF
  const filename = `cedi_tracker_statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};
