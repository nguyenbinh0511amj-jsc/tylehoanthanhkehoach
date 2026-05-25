'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import FileUploader from '../components/FileUploader';

export default function ImportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const saveToDB = async (fileName, parsedSheets) => {
    try {
      setIsSaving(true);
      showMessage('info', '⏳ Đang lưu vào MongoDB...');

      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          sheets: parsedSheets.map((s) => ({
            name: s.name,
            headers: s.headers,
            summaryRow: s.summaryRow,
            rows: s.rows,
            rowCount: s.rowCount,
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setImportResult({
          fileName,
          sheetCount: parsedSheets.length,
          totalRows: parsedSheets.reduce((sum, s) => sum + s.rowCount, 0),
          sheets: parsedSheets.map((s) => ({ name: s.name, rowCount: s.rowCount, colCount: s.headers.length })),
        });
        showMessage('success', `✅ ${json.message}`);
      } else {
        showMessage('error', `❌ Lỗi: ${json.error}`);
      }
    } catch (err) {
      showMessage('error', `❌ Lỗi kết nối: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu đã lưu?')) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/sheets', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setImportResult(null);
        showMessage('success', `🗑️ ${json.message}`);
      }
    } catch (err) {
      showMessage('error', `❌ Lỗi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileLoaded = useCallback((file) => {
    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });

        const parsedSheets = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          let headers = [];
          let summaryRow = [];
          let dataRows = [];

          if (jsonData.length > 1) {
            summaryRow = jsonData[0] || [];
            headers = jsonData[1]
              ? jsonData[1].map((h) => (h !== undefined && h !== null ? String(h) : ''))
              : [];
            dataRows = jsonData.slice(2);
          } else if (jsonData.length === 1) {
            headers = jsonData[0]
              ? jsonData[0].map((h) => (h !== undefined && h !== null ? String(h) : ''))
              : [];
          }

          const filteredRows = dataRows.filter((row) =>
            row.some((cell) => cell !== null && cell !== undefined && cell !== '')
          );

          return {
            name,
            headers,
            summaryRow,
            rows: filteredRows.slice(0, 2000),
            rowCount: filteredRows.length,
          };
        });

        setIsLoading(false);
        saveToDB(file.name, parsedSheets);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        showMessage('error', 'Lỗi khi đọc file Excel. Vui lòng kiểm tra file.');
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📥 Import Dữ Liệu</h1>
        <p>Upload file Excel để lưu vào hệ thống</p>
      </header>

      {/* Message toast */}
      {message && (
        <div className={`toast toast-${message.type}`}>
          {message.text}
        </div>
      )}

      <FileUploader onFileLoaded={handleFileLoaded} isLoading={isLoading || isSaving} />

      {/* Import result */}
      {importResult && (
        <div className="import-result">
          <div className="import-result-header">
            <div className="import-result-icon">✅</div>
            <div>
              <h3>Import thành công!</h3>
              <p className="import-filename">{importResult.fileName}</p>
            </div>
          </div>

          <div className="import-stats">
            <div className="import-stat">
              <span className="import-stat-value">{importResult.sheetCount}</span>
              <span className="import-stat-label">Sheets</span>
            </div>
            <div className="import-stat">
              <span className="import-stat-value">{importResult.totalRows.toLocaleString()}</span>
              <span className="import-stat-label">Tổng dòng</span>
            </div>
          </div>

          <div className="import-sheets-list">
            {importResult.sheets.map((sheet, i) => (
              <div key={i} className="import-sheet-item">
                <span className="import-sheet-name">📄 {sheet.name}</span>
                <span className="import-sheet-info">{sheet.rowCount.toLocaleString()} dòng · {sheet.colCount} cột</span>
              </div>
            ))}
          </div>

          <div className="import-actions">
            <button className="btn-view" onClick={() => router.push('/')}>
              📊 Xem dữ liệu
            </button>
            <button className="btn-delete" onClick={handleDelete}>
              🗑️ Xóa dữ liệu
            </button>
          </div>
        </div>
      )}

      {/* Delete existing data */}
      {!importResult && (
        <div className="import-hint">
          <p>💡 Kéo thả hoặc chọn file Excel (.xlsx, .xls) để import</p>
          <p>Dữ liệu sẽ được tự động lưu vào MongoDB</p>
          <button className="btn-delete-standalone" onClick={handleDelete}>
            🗑️ Xóa toàn bộ dữ liệu cũ
          </button>
        </div>
      )}
    </div>
  );
}
