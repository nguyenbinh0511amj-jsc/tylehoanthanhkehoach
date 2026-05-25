'use client';

export default function CompletionStats({ sheets }) {
  if (!sheets || sheets.length === 0) return null;

  // Extract completion stats from each sheet's summaryRow
  const stats = sheets.map((sheet) => {
    const { headers, summaryRow, name, rowCount } = sheet;
    
    const getVal = (key) => {
      const idx = headers.indexOf(key);
      if (idx === -1 || !summaryRow || summaryRow[idx] === undefined || summaryRow[idx] === '') return null;
      const v = parseFloat(summaryRow[idx]);
      return isNaN(v) ? null : v;
    };

    const sll = getVal('SLL');
    const slThucTe = getVal('SL thực tế');
    const tghd = getVal('TGHD');
    const tgbv = getVal('TGBV');

    // Completion ratio: try last column or calculate from SL thực tế / SLL
    let ratio = null;
    if (summaryRow && summaryRow.length > 0) {
      const lastVal = parseFloat(summaryRow[summaryRow.length - 1]);
      if (!isNaN(lastVal) && lastVal > 0 && lastVal < 10) {
        ratio = lastVal;
      }
    }
    if (ratio === null && sll && slThucTe && sll > 0) {
      ratio = slThucTe / sll;
    }

    return {
      name,
      rowCount,
      sll,
      slThucTe,
      tghd,
      tgbv,
      ratio,
      percent: ratio !== null ? (ratio * 100).toFixed(1) : null,
    };
  });

  // Overall totals
  const totalSLL = stats.reduce((sum, s) => sum + (s.sll || 0), 0);
  const totalSLTT = stats.reduce((sum, s) => sum + (s.slThucTe || 0), 0);
  const totalTGHD = stats.reduce((sum, s) => sum + (s.tghd || 0), 0);
  const totalTGBV = stats.reduce((sum, s) => sum + (s.tgbv || 0), 0);
  const overallRatio = totalSLL > 0 ? ((totalSLTT / totalSLL) * 100).toFixed(1) : null;

  const getBarColor = (percent) => {
    if (percent === null) return 'var(--text-muted)';
    const p = parseFloat(percent);
    if (p >= 100) return '#10b981';
    if (p >= 80) return '#3b82f6';
    if (p >= 50) return '#f59e0b';
    return '#f43f5e';
  };

  const getStatusLabel = (percent) => {
    if (percent === null) return '—';
    const p = parseFloat(percent);
    if (p >= 100) return 'Hoàn thành';
    if (p >= 80) return 'Gần xong';
    if (p >= 50) return 'Đang làm';
    return 'Chậm';
  };

  const getStatusClass = (percent) => {
    if (percent === null) return '';
    const p = parseFloat(percent);
    if (p >= 100) return 'status-done';
    if (p >= 80) return 'status-good';
    if (p >= 50) return 'status-warning';
    return 'status-danger';
  };

  const fmt = (v) => {
    if (v === null || v === undefined) return '—';
    return v % 1 === 0 ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <div className="completion-stats">
      <div className="completion-header">
        <div className="completion-title">
          <span className="completion-icon">📊</span>
          <h2>Thống kê tỷ lệ hoàn thành</h2>
        </div>
        {overallRatio !== null && (
          <div className="completion-overall">
            <span className="overall-label">Tổng chung</span>
            <span className="overall-value" style={{ color: getBarColor(overallRatio) }}>
              {overallRatio}%
            </span>
          </div>
        )}
      </div>

      <div className="completion-table-wrapper">
        <table className="completion-table">
          <thead>
            <tr>
              <th>Sheet</th>
              <th className="col-number">Số dòng</th>
              <th className="col-number">SL Lệnh</th>
              <th className="col-number">SL Thực tế</th>
              <th className="col-number">TG Hoạt động</th>
              <th className="col-number">TG Bảo vệ</th>
              <th className="col-progress">Tỷ lệ HT</th>
              <th className="col-status">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={i}>
                <td className="cell-name">
                  <span className="sheet-dot" style={{ background: getBarColor(s.percent) }}></span>
                  {s.name}
                </td>
                <td className="col-number">{s.rowCount.toLocaleString()}</td>
                <td className="col-number">{fmt(s.sll)}</td>
                <td className="col-number">{fmt(s.slThucTe)}</td>
                <td className="col-number">{fmt(s.tghd)}</td>
                <td className="col-number">{fmt(s.tgbv)}</td>
                <td className="col-progress">
                  <div className="progress-cell">
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: s.percent !== null ? `${Math.min(parseFloat(s.percent), 100)}%` : '0%',
                          background: getBarColor(s.percent),
                        }}
                      ></div>
                    </div>
                    <span className="progress-text" style={{ color: getBarColor(s.percent) }}>
                      {s.percent !== null ? `${s.percent}%` : '—'}
                    </span>
                  </div>
                </td>
                <td className="col-status">
                  <span className={`status-badge ${getStatusClass(s.percent)}`}>
                    {getStatusLabel(s.percent)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td className="cell-name"><strong>Tổng cộng</strong></td>
              <td className="col-number"><strong>{stats.reduce((s, r) => s + r.rowCount, 0).toLocaleString()}</strong></td>
              <td className="col-number"><strong>{totalSLL > 0 ? fmt(totalSLL) : '—'}</strong></td>
              <td className="col-number"><strong>{totalSLTT > 0 ? fmt(totalSLTT) : '—'}</strong></td>
              <td className="col-number"><strong>{totalTGHD > 0 ? fmt(totalTGHD) : '—'}</strong></td>
              <td className="col-number"><strong>{totalTGBV > 0 ? fmt(totalTGBV) : '—'}</strong></td>
              <td className="col-progress">
                <div className="progress-cell">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: overallRatio !== null ? `${Math.min(parseFloat(overallRatio), 100)}%` : '0%',
                        background: getBarColor(overallRatio),
                      }}
                    ></div>
                  </div>
                  <span className="progress-text" style={{ color: getBarColor(overallRatio), fontWeight: 700 }}>
                    {overallRatio !== null ? `${overallRatio}%` : '—'}
                  </span>
                </div>
              </td>
              <td className="col-status">
                <span className={`status-badge ${getStatusClass(overallRatio)}`}>
                  {getStatusLabel(overallRatio)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
