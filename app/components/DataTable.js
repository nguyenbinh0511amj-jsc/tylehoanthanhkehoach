'use client';
import { useMemo } from 'react';

function getStatusClass(value) {
  if (!value || typeof value !== 'string') return '';
  const v = value.toLowerCase();
  if (v.includes('đã chuyển') || v.includes('đã giao') || v.includes('hoàn thành') || v.includes('kết thúc')) return 'done';
  if (v.includes('đang') || v.includes('rửa') || v.includes('tap') || v.includes('via')) return 'in-progress';
  if (v.includes('gấp') || v.includes('siêu gấp')) return 'urgent';
  return '';
}

function CellContent({ value, header }) {
  if (value === null || value === undefined || value === '') return null;
  
  // Status column
  if (header === 'Tổng TGHT' || header === 'trang_thai' || header === 'ghi_trang_thai') {
    const cls = getStatusClass(String(value));
    if (cls) {
      return <span className={`cell-status ${cls}`}>{String(value)}</span>;
    }
  }
  
  return String(value);
}

export default function DataTable({ headers, rows, sheetName }) {
  const MAX_ROWS = 2000;
  
  const displayRows = useMemo(() => {
    if (!rows) return [];
    // Filter out completely empty rows
    const filtered = rows.filter(row => 
      row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );
    return filtered.slice(0, MAX_ROWS);
  }, [rows]);

  if (!headers || headers.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>Sheet này không có dữ liệu</p>
        </div>
      </div>
    );
  }

  const totalRows = rows ? rows.filter(r => r.some(c => c !== null && c !== undefined && c !== '')).length : 0;

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {headers.map((h, i) => (
                <th key={i}>{h || `Col ${i + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => {
              const isSummary = rowIdx === 0 && sheetName !== 'Đơn hàng' && sheetName !== 'Dữ liệu' && sheetName !== 'Chương trình 3D';
              return (
                <tr key={rowIdx} className={isSummary ? 'summary-row' : ''}>
                  <td>{rowIdx + 1}</td>
                  {headers.map((h, colIdx) => (
                    <td key={colIdx}>
                      <CellContent value={row[colIdx]} header={h} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          Hiển thị {displayRows.length.toLocaleString()} / {totalRows.toLocaleString()} dòng
          {totalRows > MAX_ROWS && ` (giới hạn ${MAX_ROWS.toLocaleString()} dòng)`}
        </span>
        <span>{headers.length} cột · {sheetName}</span>
      </div>
    </div>
  );
}
