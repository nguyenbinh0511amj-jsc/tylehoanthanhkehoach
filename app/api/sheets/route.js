import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import SheetData from '../../../models/SheetData';

// GET - Lấy tất cả sheets đã lưu
export async function GET() {
  try {
    await dbConnect();
    const sheets = await SheetData.find({}).sort({ importedAt: -1, sheetName: 1 }).lean();
    return NextResponse.json({ success: true, data: sheets });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Import dữ liệu mới (xóa cũ trước khi import)
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { fileName, sheets } = body;

    if (!fileName || !sheets || !Array.isArray(sheets)) {
      return NextResponse.json(
        { success: false, error: 'Thiếu fileName hoặc sheets' },
        { status: 400 }
      );
    }

    // Xóa dữ liệu cũ của file này
    await SheetData.deleteMany({ fileName });

    // Insert từng sheet
    const docs = sheets.map((sheet) => ({
      fileName,
      sheetName: sheet.name,
      headers: sheet.headers,
      summaryRow: sheet.summaryRow,
      rows: sheet.rows,
      rowCount: sheet.rowCount,
      importedAt: new Date(),
    }));

    const result = await SheetData.insertMany(docs);

    return NextResponse.json({
      success: true,
      message: `Đã import ${result.length} sheets thành công`,
      count: result.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Xóa toàn bộ dữ liệu
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    let result;
    if (fileName) {
      result = await SheetData.deleteMany({ fileName });
    } else {
      result = await SheetData.deleteMany({});
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa ${result.deletedCount} sheets`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
