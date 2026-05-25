import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

// GET - Liệt kê tất cả collections trong database
export async function GET() {
  try {
    await dbConnect();
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionInfo = [];

    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      // Lấy 1 record mẫu
      const sample = await mongoose.connection.db.collection(col.name).findOne();
      collectionInfo.push({
        name: col.name,
        count,
        sampleFields: sample ? Object.keys(sample) : [],
        sample: sample ? JSON.parse(JSON.stringify(sample)) : null,
      });
    }

    return NextResponse.json({
      success: true,
      database: mongoose.connection.db.databaseName,
      collections: collectionInfo,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
