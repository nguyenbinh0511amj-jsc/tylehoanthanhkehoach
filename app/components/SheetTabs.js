'use client';

export default function SheetTabs({ sheets, activeSheet, onSelect }) {
  if (!sheets || sheets.length === 0) return null;

  return (
    <div className="sheet-tabs">
      {sheets.map((sheet) => (
        <button
          key={sheet.name}
          className={`sheet-tab ${activeSheet === sheet.name ? 'active' : ''}`}
          onClick={() => onSelect(sheet.name)}
        >
          {sheet.name}
          <span className="row-count">{sheet.rowCount.toLocaleString()}</span>
        </button>
      ))}
    </div>
  );
}
