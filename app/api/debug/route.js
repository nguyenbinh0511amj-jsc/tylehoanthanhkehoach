import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import KeHoachPKT from '../../../models/KeHoachPKT';
import SheetData from '../../../models/SheetData';

// GET - Debug: kiểm tra dữ liệu order_kd
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const orderKD = searchParams.get('order_kd') || '0003461654';

    // 1. Tìm trong ke_hoach_pkt
    const pktExact = await KeHoachPKT.findOne({ order_kd: orderKD }).lean();
    
    // 2. Tìm bằng regex (phòng trường hợp format khác)
    const pktRegex = await KeHoachPKT.find({ 
      order_kd: { $regex: orderKD.replace(/^0+/, ''), $options: 'i' } 
    }).limit(5).lean();

    // 3. Xem 3 record mẫu trong ke_hoach_pkt để hiểu structure
    const samples = await KeHoachPKT.find({}).limit(3).lean();
    
    // 4. Tìm order trong sheet data
    const sheets = await SheetData.find({}).lean();
    const sheetMatches = [];
    sheets.forEach((sheet) => {
      const orderKDIdx = sheet.headers.findIndex((h) => h === 'OrderKD');
      const tghtIdx = sheet.headers.findIndex((h) => h === 'Tổng TGHT');
      if (orderKDIdx !== -1 && sheet.rows) {
        sheet.rows.forEach((row, i) => {
          if (String(row[orderKDIdx]).trim() === orderKD) {
            sheetMatches.push({
              sheet: sheet.sheetName,
              rowIndex: i,
              orderKD: row[orderKDIdx],
              tongTGHT: tghtIdx !== -1 ? row[tghtIdx] : 'N/A (no column)',
              headers: sheet.headers.slice(0, 15),
            });
          }
        });
      }
    });

    // 5. Đếm tổng documents trong ke_hoach_pkt
    const totalPKT = await KeHoachPKT.countDocuments();

    return NextResponse.json({
      success: true,
      query: orderKD,
      totalPKTRecords: totalPKT,
      pkt_exact_match: pktExact,
      pkt_regex_matches: pktRegex,
      pkt_sample_records: samples.map((s) => ({
        order_kd: s.order_kd,
        ghi_trang_thai: s.ghi_trang_thai,
        _allFields: Object.keys(s),
      })),
      sheet_matches: sheetMatches,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
