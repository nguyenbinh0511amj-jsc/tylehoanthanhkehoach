import mongoose from 'mongoose';

// Model cho collection ke_hoach_pkt (từ AppSheet)
const KeHoachPKTSchema = new mongoose.Schema({}, { 
  strict: false,  // Cho phép đọc tất cả fields
  collection: 'ke_hoach_pkt' // Tên collection trong MongoDB
});

export default mongoose.models.KeHoachPKT || mongoose.model('KeHoachPKT', KeHoachPKTSchema);
