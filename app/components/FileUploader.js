'use client';
import { useRef, useState } from 'react';

export default function FileUploader({ onFileLoaded, isLoading }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      return;
    }
    setFileName(file.name);
    setFileSize(file.size);
    onFileLoaded(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="uploader-wrapper">
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <span className="upload-icon">📊</span>
        <h3>Kéo thả file Excel vào đây</h3>
        <p>Hỗ trợ file .xlsx, .xls</p>
        <button className="upload-btn" type="button" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          📁 Chọn file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        {fileName && !isLoading && (
          <div className="file-info">
            <span>✅</span>
            <span>{fileName} ({formatSize(fileSize)})</span>
          </div>
        )}
      </div>
    </div>
  );
}
