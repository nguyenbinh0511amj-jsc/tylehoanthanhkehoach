import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import SheetData from '../../../models/SheetData';

const GOOGLE_SHEET_ID = '1IlsQuuxQY4LasPQo2jdIxsEvyn6xzF5GfcGpQI2Tm24';
const GOOGLE_SHEET_GID = '2046283284';

// Fetch dữ liệu từ Google Sheet (ke_hoach_pkt)
async function fetchGoogleSheetData() {
  const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GOOGLE_SHEET_GID}`;
  const res = await fetch(url, { cache: 'no-store' });
  
  if (!res.ok) {
    throw new Error(`Không thể đọc Google Sheet: ${res.status}`);
  }

  const csvText = await res.text();
  const rows = parseCSV(csvText);
  
  if (rows.length < 2) {
    throw new Error('Google Sheet không có dữ liệu');
  }

  // Hàng đầu là headers
  const headers = rows[0];
  const orderKDIdx = headers.indexOf('order_kd');
  const statusIdx = headers.indexOf('ghi_trang_thai');

  if (orderKDIdx === -1 || statusIdx === -1) {
    throw new Error(`Không tìm thấy cột order_kd (${orderKDIdx}) hoặc ghi_trang_thai (${statusIdx}) trong Google Sheet`);
  }

  // Tạo map: order_kd -> ghi_trang_thai
  // Lưu cả dạng có leading zeros và không có để khớp linh hoạt
  const statusMap = {};
  for (let i = 1; i < rows.length; i++) {
    const orderKD = (rows[i][orderKDIdx] || '').trim();
    const status = (rows[i][statusIdx] || '').trim();
    if (orderKD) {
      // Lưu nguyên bản (có leading zeros): "0003461654"
      statusMap[orderKD] = status;
      // Lưu dạng số (bỏ leading zeros): "3461654"
      const numericKey = orderKD.replace(/^0+/, '');
      if (numericKey) {
        statusMap[numericKey] = status;
      }
    }
  }

  return { statusMap, totalRecords: rows.length - 1, headers };
}

// Parse CSV đơn giản (hỗ trợ quoted fields)
function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        current.push(field);
        field = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        current.push(field);
        field = '';
        if (current.length > 1 || current[0] !== '') {
          rows.push(current);
        }
        current = [];
        if (char === '\r') i++;
      } else {
        field += char;
      }
    }
  }
  // Last field/row
  if (field || current.length > 0) {
    current.push(field);
    if (current.length > 1 || current[0] !== '') {
      rows.push(current);
    }
  }

  return rows;
}

// POST - Đồng bộ Tổng TGHT từ Google Sheet ke_hoach_pkt
export async function POST() {
  try {
    // 1. Fetch dữ liệu từ Google Sheet
    const { statusMap, totalRecords } = await fetchGoogleSheetData();

    // 2. Kết nối MongoDB và lấy sheet data
    await dbConnect();
    const sheets = await SheetData.find({});

    if (sheets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Chưa có dữ liệu sheet nào trong MongoDB',
      }, { status: 404 });
    }

    // 3. Cập nhật Tổng TGHT cho từng sheet
    let totalUpdated = 0;
    let totalMatched = 0;
    const sheetResults = [];

    for (const sheet of sheets) {
      const headers = sheet.headers || [];
      const orderKDIdx = headers.findIndex((h) => h === 'OrderKD');
      const tghtIdx = headers.findIndex((h) => h === 'Tổng TGHT');

      if (orderKDIdx === -1 || tghtIdx === -1 || !sheet.rows) {
        sheetResults.push({
          name: sheet.sheetName,
          updated: 0,
          matched: 0,
          skipped: true,
          reason: orderKDIdx === -1 ? 'Không có cột OrderKD' : 'Không có cột Tổng TGHT',
        });
        continue;
      }

      let updated = 0;
      let matched = 0;
      const newRows = sheet.rows.map((row) => {
        const orderKD = row[orderKDIdx];
        if (orderKD !== null && orderKD !== undefined && orderKD !== '') {
          const key = String(orderKD).trim();
          if (statusMap.hasOwnProperty(key)) {
            matched++;
            const newStatus = statusMap[key];
            if (String(row[tghtIdx] || '') !== String(newStatus)) {
              const newRow = [...row];
              newRow[tghtIdx] = newStatus;
              updated++;
              return newRow;
            }
          }
        }
        return row;
      });

      if (updated > 0) {
        await SheetData.updateOne(
          { _id: sheet._id },
          { $set: { rows: newRows } }
        );
      }

      totalUpdated += updated;
      totalMatched += matched;
      sheetResults.push({
        name: sheet.sheetName,
        updated,
        matched,
        total: sheet.rows.length,
        skipped: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đồng bộ xong: ${totalMatched} khớp, ${totalUpdated} cập nhật`,
      summary: {
        googleSheetRecords: totalRecords,
        statusMapSize: Object.keys(statusMap).length,
        totalMatched,
        totalUpdated,
      },
      sheets: sheetResults,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
