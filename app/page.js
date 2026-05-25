'use client';
import { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import FileUploader from './components/FileUploader';
import SheetTabs from './components/SheetTabs';
import SheetSummary from './components/SheetSummary';
import DataTable from './components/DataTable';

export default function Home() {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [savedFileName, setSavedFileName] = useState('');

  // Load dữ liệu từ MongoDB khi mở trang
  useEffect(() => {
    loadFromDB();
  }, []);

  const loadFromDB = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sheets');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const loadedSheets = json.data.map((doc) => ({
          name: doc.sheetName,
          headers: doc.headers,
          summaryRow: doc.summaryRow,
          rows: doc.rows,
          rowCount: doc.rowCount,
        }));
        setSheets(loadedSheets);
        setActiveSheet(loadedSheets[0].name);
        setSavedFileName(json.data[0].fileName);
        showMessage('success', `Đã tải ${loadedSheets.length} sheets từ cơ sở dữ liệu`);
      }
    } catch (err) {
      console.error('Load DB error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDB = async (fileName, parsedSheets) => {
    try {
      setIsSaving(true);
      showMessage('info', 'Đang lưu vào MongoDB...');

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
        setSavedFileName(fileName);
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
        setSheets([]);
        setActiveSheet('');
        setSavedFileName('');
        showMessage('success', `🗑️ ${json.message}`);
      }
    } catch (err) {
      showMessage('error', `❌ Lỗi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
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

          // Filter empty rows and limit to 2000
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

        setSheets(parsedSheets);
        setActiveSheet(parsedSheets.length > 0 ? parsedSheets[0].name : '');
        setIsLoading(false);

        // Auto-save to MongoDB
        saveToDB(file.name, parsedSheets);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        showMessage('error', 'Lỗi khi đọc file Excel. Vui lòng kiểm tra file.');
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const activeSheetData = sheets.find((s) => s.name === activeSheet);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📋 Kế Hoạch Kiểm Tra</h1>
        <p>Import file Excel để xem và quản lý kế hoạch nhóm Kiểm tra</p>
      </header>

      {/* Message toast */}
      {message && (
        <div className={`toast toast-${message.type}`}>
          {message.text}
        </div>
      )}

      <FileUploader onFileLoaded={handleFileLoaded} isLoading={isLoading || isSaving} />

      {/* Action bar */}
      {sheets.length > 0 && (
        <div className="action-bar">
          <div className="action-info">
            {savedFileName && (
              <span className="saved-badge">
                💾 <strong>{savedFileName}</strong> — đã lưu MongoDB
              </span>
            )}
            {isSaving && <span className="saving-badge">⏳ Đang lưu...</span>}
          </div>
          <div className="action-buttons">
            <button className="btn-delete" onClick={handleDelete}>
              🗑️ Xóa dữ liệu
            </button>
          </div>
        </div>
      )}

      {isLoading && !sheets.length && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      )}

      {!isLoading && sheets.length > 0 && (
        <div className="sheet-tabs-container">
          <SheetTabs sheets={sheets} activeSheet={activeSheet} onSelect={setActiveSheet} />
          {activeSheetData && (
            <>
              <SheetSummary
                summaryRow={activeSheetData.summaryRow}
                headers={activeSheetData.headers}
              />
              <DataTable
                headers={activeSheetData.headers}
                rows={activeSheetData.rows}
                sheetName={activeSheetData.name}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
