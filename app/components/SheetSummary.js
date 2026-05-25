'use client';

export default function SheetSummary({ summaryRow, headers }) {
  if (!summaryRow || !headers) return null;

  // Extract summary values from row 1 (summary row in the Excel)
  const stats = [];
  const labelMap = {
    'SLL': { label: 'Tổng SL Lệnh', style: '' },
    'SL thực tế': { label: 'SL Thực tế', style: 'emerald' },
    'TGHD': { label: 'Tổng TG HD', style: '' },
    'TGBV': { label: 'Tổng TG BV', style: 'amber' },
  };

  headers.forEach((h, i) => {
    const mapping = labelMap[h];
    if (mapping && summaryRow[i] !== undefined && summaryRow[i] !== null && summaryRow[i] !== '') {
      const val = parseFloat(summaryRow[i]);
      if (!isNaN(val)) {
        stats.push({
          label: mapping.label,
          value: val % 1 === 0 ? val.toLocaleString() : val.toLocaleString(undefined, { maximumFractionDigits: 1 }),
          style: mapping.style
        });
      }
    }
  });

  // Check for ratio (column S)
  const sIdx = headers.indexOf('') === -1 ? headers.length - 1 : -1;
  // Try last column for ratio
  const lastVal = summaryRow[summaryRow.length - 1];
  if (lastVal && !isNaN(parseFloat(lastVal))) {
    const ratio = parseFloat(lastVal);
    if (ratio > 0 && ratio < 10) {
      stats.push({
        label: 'Tỷ lệ HT',
        value: (ratio * 100).toFixed(1) + '%',
        style: ratio >= 1 ? 'emerald' : 'amber'
      });
    }
  }

  if (stats.length === 0) return null;

  return (
    <div className="summary-bar">
      {stats.map((stat, i) => (
        <div key={i} className={`summary-card ${stat.style}`}>
          <div className="label">{stat.label}</div>
          <div className="value">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
