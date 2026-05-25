'use client';

export default function CompletionStats({ sheets }) {
  if (!sheets || sheets.length === 0) return null;

  // Calculate completion stats from each sheet's actual row data
  const stats = sheets.map((sheet) => {
    const { headers, rows, name, rowCount } = sheet;

    // Find the index of "Tổng TGHT" and "OrderKD" columns
    const tghtIdx = headers.findIndex((h) => h === 'Tổng TGHT');
    const orderKDIdx = headers.findIndex((h) => h === 'OrderKD');

    let completedCount = 0;
    let totalRows = 0;

    if (rows) {
      // Chỉ đếm dòng có OrderKD có dữ liệu
      const validRows = rows.filter((row) => {
        if (orderKDIdx === -1) return row.some((cell) => cell !== null && cell !== undefined && cell !== '');
        const orderKD = row[orderKDIdx];
        return orderKD !== null && orderKD !== undefined && orderKD !== '';
      });
      totalRows = validRows.length;

      // Count rows where "Tổng TGHT" column is "Hoàn thành"
      if (tghtIdx !== -1) {
        completedCount = validRows.filter((row) => {
          const val = row[tghtIdx];
          if (!val || typeof val !== 'string') return false;
          return val.trim().toLowerCase() === 'hoàn thành';
        }).length;
      }
    }

    const ratio = totalRows > 0 ? completedCount / totalRows : null;
    const percent = ratio !== null ? (ratio * 100).toFixed(1) : null;

    return {
      name,
      rowCount,
      totalRows,
      completedCount,
      notCompleted: totalRows - completedCount,
      ratio,
      percent,
      hasTGHT: tghtIdx !== -1,
    };
  });

  // Overall totals
  const totalAllRows = stats.reduce((sum, s) => sum + s.totalRows, 0);
  const totalCompleted = stats.reduce((sum, s) => sum + s.completedCount, 0);
  const totalNotCompleted = totalAllRows - totalCompleted;
  const overallRatio = totalAllRows > 0 ? ((totalCompleted / totalAllRows) * 100).toFixed(1) : null;

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

  return (
    <div className="completion-stats">
      <div className="completion-header">
        <div className="completion-title">
          <span className="completion-icon">📊</span>
          <h2>Thống kê tỷ lệ hoàn thành</h2>
          <span className="completion-note">Dựa theo cột "Tổng TGHT"</span>
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
              <th className="col-number">Tổng dòng</th>
              <th className="col-number">Hoàn thành</th>
              <th className="col-number">Chưa xong</th>
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
                  {!s.hasTGHT && <span className="no-data-tag">Không có cột TGHT</span>}
                </td>
                <td className="col-number">{s.totalRows.toLocaleString()}</td>
                <td className="col-number col-completed">{s.completedCount.toLocaleString()}</td>
                <td className="col-number col-not-completed">{s.notCompleted.toLocaleString()}</td>
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
              <td className="col-number"><strong>{totalAllRows.toLocaleString()}</strong></td>
              <td className="col-number col-completed"><strong>{totalCompleted.toLocaleString()}</strong></td>
              <td className="col-number col-not-completed"><strong>{totalNotCompleted.toLocaleString()}</strong></td>
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
