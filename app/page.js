'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SheetTabs from './components/SheetTabs';
import SheetSummary from './components/SheetSummary';
import DataTable from './components/DataTable';
import CompletionStats from './components/CompletionStats';

// Chỉ hiển thị các sheet này
const VISIBLE_SHEETS = [
  'Bàn gấp+ lẻ',
  'hàng đánh bóng + đo quang',
  'Hàng loạt (bàn 1)',
  'Ca đêm',
  'Ca đêm (2)',
];

export default function Home() {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savedFileName, setSavedFileName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

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
        const allSheets = json.data.map((doc) => ({
          name: doc.sheetName,
          headers: doc.headers,
          summaryRow: doc.summaryRow,
          rows: doc.rows,
          rowCount: doc.rowCount,
        }));
        // Lọc và sắp xếp theo đúng thứ tự VISIBLE_SHEETS
        const filteredSheets = VISIBLE_SHEETS
          .map((name) => allSheets.find((s) => s.name === name))
          .filter(Boolean);
        setSheets(filteredSheets);
        if (filteredSheets.length > 0) {
          setActiveSheet(filteredSheets[0].name);
        }
        setSavedFileName(json.data[0].fileName);
      }
    } catch (err) {
      console.error('Load DB error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setToast({ type: 'info', text: '⏳ Đang đồng bộ trạng thái từ ke_hoach_pkt...' });
      const res = await fetch('/api/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', text: `✅ ${json.message}` });
        // Reload dữ liệu mới
        await loadFromDB();
      } else {
        setToast({ type: 'error', text: `❌ ${json.error}` });
      }
    } catch (err) {
      setToast({ type: 'error', text: `❌ Lỗi: ${err.message}` });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const activeSheetData = sheets.find((s) => s.name === activeSheet);

  return (
    <div className="app-container">

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.text}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      )}

      {/* No data - show empty state */}
      {!isLoading && sheets.length === 0 && (
        <div className="empty-data-state">
          <div className="empty-data-icon">📭</div>
          <h2>Chưa có dữ liệu</h2>
          <p>Import file Excel để bắt đầu xem dữ liệu</p>
          <Link href="/import" className="btn-import-cta">
            📥 Import dữ liệu ngay
          </Link>
        </div>
      )}

      {/* Data view */}
      {!isLoading && sheets.length > 0 && (
        <>
          {/* File info bar */}
          <div className="data-info-bar">
            <div className="data-info-left">
              <span className="data-file-badge">
                💾 <strong>{savedFileName}</strong>
              </span>
              <span className="data-sheet-count">{sheets.length} sheets</span>
              <span className="data-total-rows">
                {sheets.reduce((sum, s) => sum + s.rowCount, 0).toLocaleString()} dòng
              </span>
            </div>
            <div className="data-info-actions">
              <button
                className="btn-sync"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? '⏳ Đang đồng bộ...' : '🔄 Đồng bộ trạng thái'}
              </button>
              <Link href="/import" className="btn-reimport">
                📥 Import lại
              </Link>
            </div>
          </div>

          <CompletionStats sheets={sheets} />

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
        </>
      )}
    </div>
  );
}
