import React from 'react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="app-container" style={{ paddingBottom: '48px' }}>
      <h1 className="page-title">Kiến trúc hệ thống</h1>
      <p className="page-subtitle">
        Sơ đồ luồng phân tán của hệ thống Brand Protection kết hợp Hướng dẫn viên ngân hàng đa ngôn ngữ.
      </p>

      {/* Section 1: Flat Diagram */}
      <div style={{ marginBottom: '32px' }}>
        <div className="panel" style={{ padding: '24px', overflowX: 'auto', borderRadius: '12px' }}>
          <svg
            viewBox="0 0 1060 620"
            style={{
              width: '100%',
              minWidth: '960px',
              height: 'auto',
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            <defs>
              <marker
                id="arr-muted"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b949e" />
              </marker>
              <marker
                id="arr-accent"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker
                id="arr-orange"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
            </defs>

            {/* Trình duyệt / SPA */}
            <rect x="20" y="250" width="130" height="54" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="4" />
            <text x="85" y="278" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)" fontWeight="600">
              Trình duyệt
            </text>
            <text x="85" y="294" fill="#8b949e" textAnchor="middle" fontSize="11">
              React + TS (Vite)
            </text>

            <line x1="150" y1="277" x2="195" y2="277" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />

            {/* API Gateway :8080 */}
            <rect x="195" y="225" width="145" height="104" fill="#11161d" stroke="#38bdf8" strokeWidth="1" rx="4" />
            <text x="267" y="255" fill="#38bdf8" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)" fontWeight="700">
              API Gateway
            </text>
            <text x="267" y="273" fill="#8b949e" textAnchor="middle" fontSize="11">
              :8080 (Cloud Gateway)
            </text>
            <text x="267" y="293" fill="#7d8488" textAnchor="middle" fontSize="10">
              /reports · /verify
            </text>
            <text x="267" y="308" fill="#7d8488" textAnchor="middle" fontSize="10">
              /poi · /visits · /narrate
            </text>

            {/* Lines from Gateway to 5 backend services */}
            <path d="M 340 240 L 370 240 L 370 54 L 400 54" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <path d="M 340 258 L 380 258 L 380 155 L 400 155" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <path d="M 340 277 L 400 277" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <path d="M 340 295 L 380 295 L 380 395 L 400 395" fill="none" stroke="#38bdf8" strokeWidth="1" markerEnd="url(#arr-accent)" />
            <path d="M 340 312 L 370 312 L 370 500 L 400 500" fill="none" stroke="#fbbf24" strokeWidth="1" markerEnd="url(#arr-orange)" />

            {/* 1. Report Service :8081 */}
            <rect x="400" y="28" width="170" height="52" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="3" />
            <text x="485" y="51" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)" fontWeight="600">
              report-service
            </text>
            <text x="485" y="68" fill="#8b949e" textAnchor="middle" fontSize="11">
              :8081 · Bucket4j
            </text>

            <line x1="485" y1="80" x2="485" y2="96" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <rect x="425" y="96" width="120" height="22" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="2" />
            <text x="485" y="111" fill="#8b949e" textAnchor="middle" fontSize="10">
              report_db
            </text>

            {/* 2. Link Verification :8082 */}
            <rect x="400" y="128" width="170" height="52" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="3" />
            <text x="485" y="151" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)" fontWeight="600">
              link-verification
            </text>
            <text x="485" y="168" fill="#8b949e" textAnchor="middle" fontSize="11">
              :8082 · 3 Providers
            </text>

            <line x1="485" y1="180" x2="485" y2="196" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <rect x="415" y="196" width="140" height="22" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="2" />
            <text x="485" y="211" fill="#8b949e" textAnchor="middle" fontSize="10">
              link_verification_db
            </text>

            {/* 3. Notification :8083 */}
            <rect x="400" y="250" width="170" height="52" fill="#11161d" stroke="#1f2733" strokeWidth="1" rx="3" />
            <text x="485" y="273" fill="#e6edf3" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)" fontWeight="600">
              notification-service
            </text>
            <text x="485" y="290" fill="#8b949e" textAnchor="middle" fontSize="11">
              :8083 · Mail / SMS
            </text>

            <line x1="485" y1="302" x2="485" y2="318" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <rect x="415" y="318" width="140" height="22" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="2" />
            <text x="485" y="333" fill="#8b949e" textAnchor="middle" fontSize="10">
              notification_db
            </text>

            {/* 4. POI Service :8085 (NEW) */}
            <rect x="400" y="368" width="170" height="54" fill="#11161d" stroke="#38bdf8" strokeWidth="1.2" rx="3" />
            <text x="485" y="391" fill="#38bdf8" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)" fontWeight="700">
              poi-service
            </text>
            <text x="485" y="408" fill="#8b949e" textAnchor="middle" fontSize="11">
              :8085 · Haversine / Nearby
            </text>

            <line x1="485" y1="422" x2="485" y2="438" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <rect x="425" y="438" width="120" height="22" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="2" />
            <text x="485" y="453" fill="#8b949e" textAnchor="middle" fontSize="10">
              poi_db
            </text>

            {/* 5. Visit Log Service :8086 (NEW) */}
            <rect x="400" y="475" width="170" height="52" fill="#11161d" stroke="#fbbf24" strokeWidth="1.2" rx="3" />
            <text x="485" y="498" fill="#fbbf24" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)" fontWeight="700">
              visit-log-service
            </text>
            <text x="485" y="515" fill="#8b949e" textAnchor="middle" fontSize="11">
              :8086 · Metrics & Aggregation
            </text>

            <line x1="485" y1="527" x2="485" y2="543" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <rect x="415" y="543" width="140" height="22" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="2" />
            <text x="485" y="558" fill="#8b949e" textAnchor="middle" fontSize="10">
              visit_log_db
            </text>

            {/* Feign: Report -> Link Verification */}
            <path d="M 570 45 L 610 45 L 610 145 L 575 145" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <text x="618" y="100" fill="#8b949e" fontSize="10" fontFamily="var(--font-ui)">OpenFeign</text>

            {/* RabbitMQ Message Broker */}
            <rect x="690" y="248" width="130" height="42" fill="#11161d" stroke="#38bdf8" strokeWidth="1" rx="3" />
            <text x="755" y="268" fill="#38bdf8" textAnchor="middle" fontSize="12" fontWeight="700">RabbitMQ</text>
            <text x="755" y="282" fill="#8b949e" textAnchor="middle" fontSize="10">exchange: report/visit</text>

            {/* Report -> RabbitMQ -> Notification */}
            <path d="M 570 65 L 755 65 L 755 242" fill="none" stroke="#38bdf8" strokeWidth="1" markerEnd="url(#arr-accent)" />
            <text x="762" y="130" fill="#38bdf8" fontSize="10" fontFamily="var(--font-ui)">report.created</text>
            <line x1="690" y1="272" x2="575" y2="272" stroke="#38bdf8" strokeWidth="1" markerEnd="url(#arr-accent)" />

            {/* POI Service -> RabbitMQ -> Visit Log Service */}
            <path d="M 570 410 L 730 410 L 730 295" fill="none" stroke="#fbbf24" strokeWidth="1" markerEnd="url(#arr-orange)" />
            <text x="738" y="345" fill="#fbbf24" fontSize="10" fontFamily="var(--font-ui)">visit.logged</text>
            <path d="M 755 295 L 755 490 L 575 490" fill="none" stroke="#fbbf24" strokeWidth="1" markerEnd="url(#arr-orange)" />

            {/* 6. Narration Service :8084 */}
            <rect x="880" y="340" width="160" height="54" fill="#11161d" stroke="#c084fc" strokeWidth="1" rx="4" />
            <text x="960" y="362" fill="#c084fc" textAnchor="middle" fontSize="13" fontFamily="var(--font-ui)" fontWeight="700">
              narration-service
            </text>
            <text x="960" y="379" fill="#8b949e" textAnchor="middle" fontSize="11">
              :8084 · i18n (vi/en/ja/ko/zh)
            </text>

            {/* Connections to Narration Service */}
            <path d="M 570 380 L 875 380" fill="none" stroke="#c084fc" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <text x="710" y="375" fill="#c084fc" textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)">OpenFeign /api/v1/narrate</text>

            <path d="M 570 260 L 890 260 L 890 335" fill="none" stroke="#c084fc" strokeWidth="1" markerEnd="url(#arr-muted)" strokeDasharray="4" />

            {/* External security sources */}
            <line x1="570" y1="155" x2="650" y2="155" stroke="#8b949e" strokeWidth="1" />
            <path d="M 650 155 L 665 155 L 665 125 L 685 125" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <path d="M 650 155 L 685 155" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />
            <path d="M 650 155 L 665 155 L 665 185 L 685 185" fill="none" stroke="#8b949e" strokeWidth="1" markerEnd="url(#arr-muted)" />

            <rect x="685" y="114" width="155" height="22" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="2" />
            <text x="762" y="129" fill="#e6edf3" textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)">Google Safe Browsing</text>

            <rect x="685" y="144" width="155" height="22" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="2" />
            <text x="762" y="159" fill="#e6edf3" textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)">Phishunt.io</text>

            <rect x="685" y="174" width="155" height="22" fill="#0b0f14" stroke="#1f2733" strokeWidth="1" rx="2" />
            <text x="762" y="189" fill="#e6edf3" textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)">PhishTank</text>
          </svg>
        </div>
      </div>

      {/* Section 2: Luồng xử lý nghiệp vụ */}
      <div style={{ marginBottom: '32px' }}>
        <h2 className="panel-title" style={{ marginBottom: '16px' }}>Các luồng nghiệp vụ cốt lõi</h2>

        {/* Nhánh 1: Hướng dẫn viên POI */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
            A. Luồng Hướng dẫn viên ngân hàng & Ghi nhận lượt nghe (Mới)
          </div>
          <div className="flow-list">
            <div className="flow-row">
              <div className="flow-num mono" style={{ color: '#38bdf8' }}>01</div>
              <div className="flow-text">
                Người dùng chọn ngôn ngữ (vi, en, ja, ko, zh) và cung cấp tọa độ hiện tại (GPS thực tế hoặc Giả lập demo).
              </div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono" style={{ color: '#38bdf8' }}>02</div>
              <div className="flow-text">
                API Gateway chuyển tiếp yêu cầu đến <strong>poi-service</strong> qua <code>GET /api/v1/poi/nearby</code>.
              </div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono" style={{ color: '#38bdf8' }}>03</div>
              <div className="flow-text">
                <strong>poi-service</strong> tính toán khoảng cách Haversine từ tọa độ thiết bị tới các POI trong <code>poi_db</code>, lọc điểm gần nhất trong bán kính 200m (trả HTTP 204 nếu không có điểm gần).
              </div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono" style={{ color: '#38bdf8' }}>04</div>
              <div className="flow-text">
                Gọi đồng bộ sang <strong>narration-service</strong> để ghép câu thuyết minh bản xứ hóa theo mã loại điểm (ATM, Branch, FX Exchange).
              </div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono" style={{ color: '#38bdf8' }}>05</div>
              <div className="flow-text">
                Trình duyệt hiển thị card thông tin và tự động đọc giọng nói qua Web Speech API khi gặp điểm mới.
              </div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono" style={{ color: '#38bdf8' }}>06</div>
              <div className="flow-text">
                Lượt nghe được bất đồng bộ ghi nhận vào <strong>visit-log-service</strong> (<code>visit_log_db</code>) để thống kê tại <code>/admin/visits</code>.
              </div>
            </div>
          </div>
        </div>

        {/* Nhánh 2: An ninh & Báo cáo lừa đảo */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
            B. Luồng Xử lý báo cáo an ninh & Phát hiện phishing
          </div>
          <div className="flow-list">
            <div className="flow-row">
              <div className="flow-num mono">01</div>
              <div className="flow-text">Người dùng gửi báo cáo liên kết đáng ngờ (Web/SMS) qua API Gateway.</div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono">02</div>
              <div className="flow-text"><strong>report-service</strong> kiểm tra giới hạn 5 yêu cầu/phút/IP (Bucket4j) và validate contact.</div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono">03</div>
              <div className="flow-text">Gọi đồng bộ OpenFeign sang <strong>link-verification-service</strong> để đối chiếu Google Safe Browsing, Phishunt, PhishTank.</div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono">04</div>
              <div className="flow-text">Kết quả được lưu vào <code>report_db</code> và phản hồi ngay lập tức cho người dùng.</div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono">05</div>
              <div className="flow-text">Nếu phát hiện lừa đảo, phát sự kiện <code>report.created</code> lên RabbitMQ Topic Exchange.</div>
            </div>
            <div className="flow-row">
              <div className="flow-num mono">06</div>
              <div className="flow-text"><strong>notification-service</strong> tiêu thụ sự kiện, gọi narration-service và gửi Email/SMS kèm audit log.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Đặc điểm thiết kế */}
      <div>
        <h2 className="panel-title" style={{ marginBottom: '12px' }}>Đặc điểm thiết kế hệ thống</h2>
        <div className="kv-list">
          <div className="kv-row">
            <div className="kv-key">poi-service</div>
            <div className="kv-value">Quản lý cây ATM, Chi nhánh, Quầy ngoại tệ; tính khoảng cách Haversine chuẩn theo mét</div>
          </div>
          <div className="kv-row">
            <div className="kv-key">visit-log-service</div>
            <div className="kv-value">Ghi nhận nhật ký lượt nghe và tổng hợp theo 5 ngôn ngữ &amp; top địa điểm (/admin/visits)</div>
          </div>
          <div className="kv-row">
            <div className="kv-key">narration-service</div>
            <div className="kv-value">Dịch vụ thuyết minh đa ngôn ngữ (vi, en, ja, ko, zh) dùng Spring MessageSource i18n</div>
          </div>
          <div className="kv-row">
            <div className="kv-key">Cơ sở dữ liệu</div>
            <div className="kv-value">Mỗi service một Database độc lập (Database-per-service, không JOIN chéo)</div>
          </div>
          <div className="kv-row">
            <div className="kv-key">Khả năng chịu lỗi</div>
            <div className="kv-value">Graceful degradation: Fallback dữ liệu demo khi dịch vụ ngoài hoặc kết nối mạng gặp sự cố</div>
          </div>
          <div className="kv-row">
            <div className="kv-key">Bảo mật nội bộ</div>
            <div className="kv-value">Header X-Internal-Api-Key ngăn chặn truy cập trực tiếp bypass API Gateway</div>
          </div>
        </div>
      </div>
    </div>
  );
};
