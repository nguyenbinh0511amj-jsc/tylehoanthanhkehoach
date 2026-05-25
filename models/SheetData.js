import mongoose from 'mongoose';

const SheetDataSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  sheetName: { type: String, required: true },
  headers: [String],
  summaryRow: [mongoose.Schema.Types.Mixed],
  rows: [[mongoose.Schema.Types.Mixed]],
  rowCount: { type: Number, default: 0 },
  importedAt: { type: Date, default: Date.now },
});

// Index for fast queries
SheetDataSchema.index({ fileName: 1, sheetName: 1 });

export default mongoose.models.SheetData || mongoose.model('SheetData', SheetDataSchema);
