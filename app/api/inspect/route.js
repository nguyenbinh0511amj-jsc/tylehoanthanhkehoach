import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import SheetData from '../../../models/SheetData';

export async function GET() {
  try {
    await dbConnect();
    const sheets = await SheetData.find({}).lean();
    
    const result = sheets.map((sheet) => {
      const headers = sheet.headers || [];
      const orderKDIdx = headers.findIndex((h) => h === 'OrderKD');
      
      let sampleOrderKDs = [];
      if (orderKDIdx !== -1 && sheet.rows) {
        sampleOrderKDs = sheet.rows
          .slice(0, 10)
          .map((row) => ({
            value: row[orderKDIdx],
            type: typeof row[orderKDIdx],
          }))
          .filter((item) => item.value !== null && item.value !== undefined && item.value !== '');
      }

      return {
        sheet: sheet.sheetName,
        hasOrderKD: orderKDIdx !== -1,
        orderKDColIndex: orderKDIdx,
        sampleOrderKDs,
        headers: headers.slice(0, 20),
      };
    });

    return NextResponse.json({ success: true, sheets: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
