import React from 'react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div>
      <h1 className="page-title">Kiến trúc hệ thống</h1>
          <p className="page-subtitle">Cách một báo cáo được xử lý từ lúc gửi đến lúc cảnh báo.</p>

          {/* Section 1: Flat Diagram */}
          <div style={{ marginBottom: '32px' }}>
            <div className="panel" style={{ padding: '24px', overflowX: 'auto' }}>
              <svg
                viewBox="0 0 1020 440"
                style={{ width: '100%', minWidth: '920px', height: 'auto', display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
              >
                <defs>
                  <marker id="arr-muted" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b949e" />
                  </marker>
                  <marker id="arr-accent" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2f6feb" />
                  </marker>
                </defs>

                {/* Trình duyệt */}
                <rect x="20" y="160" width="130" height="48" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="85" y="189" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)">Trình duyệt</text>

                <line x1="150" y1="184" x2="200" y2="184" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />

                {/* API Gateway :8080 */}
                <rect x="200" y="150" width="140" height="68" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="270" y="180" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)">API Gateway</text>
                <text x="270" y="200" fill="#8b949e" textAnchor="middle" fontSize="12">:8080</text>

                {/* Lines to 3 services */}
                <path d="M 340 165 L 375 165 L 375 65 L 400 65" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
                <path d="M 340 184 L 400 184" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
                <path d="M 340 203 L 375 203 L 375 303 L 400 303" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />

                {/* Report Service :8081 */}
                <rect x="400" y="38" width="170" height="54" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="485" y="62" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)">Report Service</text>
                <text x="485" y="78" fill="#8b949e" textAnchor="middle" fontSize="12">:8081</text>

                {/* report_db */}
                <line x1="485" y1="92" x2="485" y2="110" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
                <rect x="425" y="110" width="120" height="24" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="485" y="126" fill="#8b949e" textAnchor="middle" fontSize="11">report_db</text>

                {/* Link Verification :8082 */}
                <rect x="400" y="157" width="170" height="54" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="485" y="181" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)">Link Verification</text>
                <text x="485" y="197" fill="#8b949e" textAnchor="middle" fontSize="12">:8082</text>

                {/* link_verification_db */}
                <line x1="485" y1="211" x2="485" y2="230" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
                <rect x="415" y="230" width="140" height="24" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="485" y="246" fill="#8b949e" textAnchor="middle" fontSize="11">link_verification_db</text>

                {/* Notification :8083 */}
                <rect x="400" y="276" width="170" height="54" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="485" y="300" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)">Notification</text>
                <text x="485" y="316" fill="#8b949e" textAnchor="middle" fontSize="12">:8083</text>

                {/* notification_db */}
                <line x1="485" y1="330" x2="485" y2="348" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
                <rect x="415" y="348" width="140" height="24" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="485" y="364" fill="#8b949e" textAnchor="middle" fontSize="11">notification_db</text>

                {/* Line: Report -> Link Verification labeled "OpenFeign (đồng bộ)" */}
                <path d="M 570 55 L 610 55 L 610 170 L 575 170" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
                <text x="618" y="115" fill="#8b949e" fontSize="11" fontFamily="var(--font-ui)">OpenFeign (đồng bộ)</text>

                {/* Line: Report -> RabbitMQ -> Notification labeled "Sự kiện (bất đồng bộ)" in accent */}
                <rect x="700" y="286" width="110" height="34" fill="#11161d" stroke="#2f6feb" strokeWidth="1" rx="3" />
                <text x="755" y="307" fill="#2f6feb" textAnchor="middle" fontSize="12">RabbitMQ</text>

                <path d="M 570 70 L 755 70 L 755 280" fill="none" stroke="#2f6feb" strokeWidth="1" markerEnd="url(#arr-accent)" />
                <text x="762" y="175" fill="#2f6feb" fontSize="11" fontFamily="var(--font-ui)">Sự kiện (bất đồng bộ)</text>

                <line x1="700" y1="303" x2="575" y2="303" stroke="#2f6feb" strokeWidth="1" markerEnd="url(#arr-accent)" />

                {/* To the right of Link Verification: Google Safe Browsing, Phishunt, PhishTank */}
                <line x1="570" y1="184" x2="630" y2="184" stroke="#8b949e" strokeWidth="1" />
                <path d="M 630 184 L 645 184 L 645 145 L 660 145" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
                <path d="M 630 184 L 660 184" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
                <path d="M 630 184 L 645 184 L 645 223 L 660 223" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />

                <rect x="660" y="132" width="160" height="26" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="740" y="149" fill="#e6edf3" textAnchor="middle" fontSize="11" fontFamily="var(--font-ui)">Google Safe Browsing</text>

                <rect x="660" y="171" width="160" height="26" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="740" y="188" fill="#e6edf3" textAnchor="middle" fontSize="11" fontFamily="var(--font-ui)">Phishunt</text>

                <rect x="660" y="210" width="160" height="26" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="3" />
                <text x="740" y="227" fill="#e6edf3" textAnchor="middle" fontSize="11" fontFamily="var(--font-ui)">PhishTank</text>
              </svg>
            </div>
          </div>

          {/* Section 2: Luồng xử lý một báo cáo */}
          <div style={{ marginBottom: '32px' }}>
            <h2 className="panel-title" style={{ marginBottom: '12px' }}>Luồng xử lý một báo cáo</h2>
            <div className="flow-list">
              <div className="flow-row">
                <div className="flow-num mono">01</div>
                <div className="flow-text">Người dùng gửi báo cáo qua API Gateway.</div>
              </div>
              <div className="flow-row">
                <div className="flow-num mono">02</div>
                <div className="flow-text">Report Service kiểm tra giới hạn 5 yêu cầu/phút và dữ liệu đầu vào.</div>
              </div>
              <div className="flow-row">
                <div className="flow-num mono">03</div>
                <div className="flow-text">Gọi đồng bộ sang Link Verification để đối chiếu 3 nguồn an ninh.</div>
              </div>
              <div className="flow-row">
                <div className="flow-num mono">04</div>
                <div className="flow-text">Kết quả được lưu vào report_db và trả về ngay cho người dùng.</div>
              </div>
              <div className="flow-row">
                <div className="flow-num mono">05</div>
                <div className="flow-text">Nếu là lừa đảo, sự kiện được phát lên RabbitMQ.</div>
              </div>
              <div className="flow-row">
                <div className="flow-num mono">06</div>
                <div className="flow-text">Notification Service nhận sự kiện, gửi email/SMS và ghi nhật ký.</div>
              </div>
            </div>
          </div>

          {/* Section 3: Đặc điểm thiết kế */}
          <div>
            <h2 className="panel-title" style={{ marginBottom: '12px' }}>Đặc điểm thiết kế</h2>
            <div className="kv-list">
              <div className="kv-row">
                <div className="kv-key">Cơ sở dữ liệu</div>
                <div className="kv-value">Mỗi service một PostgreSQL riêng</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Chịu lỗi</div>
                <div className="kv-value">Một nguồn phân tích lỗi không làm hỏng kết quả</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Chống spam</div>
                <div className="kv-value">Giới hạn 5 yêu cầu/phút/IP</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Bảo mật nội bộ</div>
                <div className="kv-value">Khóa xác thực giữa các service</div>
              </div>
            </div>
          </div>
        </div>
  );
};
