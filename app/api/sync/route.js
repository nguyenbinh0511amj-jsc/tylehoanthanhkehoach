import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import SheetData from '../../../models/SheetData';
import KeHoachPKT from '../../../models/KeHoachPKT';

// POST - Đồng bộ Tổng TGHT từ ke_hoach_pkt.ghi_trang_thai theo order_kd
export async function POST() {
  try {
    await dbConnect();

    // 1. Lấy tất cả sheet data
    const sheets = await SheetData.find({});
    
    if (sheets.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chưa có dữ liệu sheet nào' 
      }, { status: 404 });
    }

    // 2. Thu thập tất cả OrderKD từ các sheets
    const allOrderKDs = new Set();
    const sheetMeta = sheets.map((sheet) => {
      const headers = sheet.headers || [];
      const orderKDIdx = headers.findIndex((h) => h === 'OrderKD');
      const tghtIdx = headers.findIndex((h) => h === 'Tổng TGHT');

      if (orderKDIdx !== -1 && sheet.rows) {
        sheet.rows.forEach((row) => {
          const val = row[orderKDIdx];
          if (val !== null && val !== undefined && val !== '') {
            allOrderKDs.add(String(val).trim());
          }
        });
      }

      return { sheet, orderKDIdx, tghtIdx };
    });

    if (allOrderKDs.size === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Không tìm thấy cột OrderKD trong dữ liệu' 
      }, { status: 400 });
    }

    // 3. Query ke_hoach_pkt để lấy ghi_trang_thai theo order_kd
    const orderKDArray = Array.from(allOrderKDs);
    const pktRecords = await KeHoachPKT.find(
      { order_kd: { $in: orderKDArray } },
      { order_kd: 1, ghi_trang_thai: 1, _id: 0 }
    ).lean();

    // Tạo map: order_kd -> ghi_trang_thai
    const statusMap = {};
    pktRecords.forEach((rec) => {
      if (rec.order_kd) {
        statusMap[String(rec.order_kd).trim()] = rec.ghi_trang_thai || '';
      }
    });

    // 4. Cập nhật Tổng TGHT cho từng sheet
    let totalUpdated = 0;
    let totalMatched = 0;
    const sheetResults = [];

    for (const { sheet, orderKDIdx, tghtIdx } of sheetMeta) {
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
            // Chỉ cập nhật nếu giá trị khác
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
      message: `Đã đồng bộ: ${totalMatched} khớp, ${totalUpdated} cập nhật`,
      summary: {
        totalOrderKDs: allOrderKDs.size,
        pktRecordsFound: pktRecords.length,
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
