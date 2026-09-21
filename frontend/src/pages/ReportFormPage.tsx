import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface CheckFormProps {
  initialUrl?: string;
  initialChannel?: 'Web' | 'SMS';
  initialEmail?: string;
  initialDescription?: string;
  urlError?: string;
  isInteractive?: boolean;
}

const CheckForm: React.FC<CheckFormProps> = ({
  initialUrl = '',
  initialChannel = 'Web',
  initialEmail = '',
  initialDescription = '',
  urlError,
  isInteractive = false,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [channel, setChannel] = useState<'Web' | 'SMS'>(initialChannel);
  const [email, setEmail] = useState(initialEmail);
  const [description, setDescription] = useState(initialDescription);

  const fillSafe = () => {
    setUrl('https://portal.vietcombank.com.vn');
    setChannel('Web');
    setEmail('security.officer@org.vn');
    setDescription('Tin nhắn SMS mạo danh ngân hàng yêu cầu nâng cấp gói OTT.');
  };

  const fillPhishing = () => {
    setUrl('https://vietcombank-ebank-login.xyz/auth');
    setChannel('Web');
    setEmail('security.officer@org.vn');
    setDescription('Tin nhắn SMS mạo danh ngân hàng yêu cầu nâng cấp gói OTT.');
  };

  return (
    <div className="panel" style={{ width: '560px', flexShrink: 0 }}>
      {/* 1. URL input */}
      <div className="form-group-public">
        <div className="form-label-row">
          <label className="form-label">Đường dẫn nghi vấn (URL)</label>
          {isInteractive ? (
            <div className="form-hint">
              Điền mẫu:{' '}
              <span className="accent-link" onClick={fillSafe} style={{ cursor: 'pointer' }}>
                An toàn
              </span>{' '}
              ·{' '}
              <span className="accent-link" onClick={fillPhishing} style={{ cursor: 'pointer' }}>
                Giả mạo
              </span>
            </div>
          ) : (
            <div className="form-hint">
              Điền mẫu: <span className="accent-link">An toàn</span> · <span className="accent-link">Giả mạo</span>
            </div>
          )}
        </div>
        <input
          type="text"
          className={`input-public mono ${urlError ? 'has-error' : ''}`}
          placeholder="https://example-bank-fake.com/login"
          value={isInteractive ? url : initialUrl}
          onChange={(e) => isInteractive && setUrl(e.target.value)}
          readOnly={!isInteractive}
        />
        {urlError && <div className="validation-error-text">{urlError}</div>}
      </div>

      {/* 2. Channel Segmented Control */}
      <div className="form-group-public">
        <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
          Kênh tiếp nhận
        </label>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-btn ${(isInteractive ? channel : initialChannel) === 'Web' ? 'selected' : ''}`}
            onClick={() => isInteractive && setChannel('Web')}
          >
            Web
          </button>
          <button
            type="button"
            className={`segmented-btn ${(isInteractive ? channel : initialChannel) === 'SMS' ? 'selected' : ''}`}
            onClick={() => isInteractive && setChannel('SMS')}
          >
            SMS
          </button>
        </div>
      </div>

      {/* 3. Email / Phone */}
      <div className="form-group-public">
        <div className="form-label-row">
          <label className="form-label">
            {(isInteractive ? channel : initialChannel) === 'Web'
              ? 'Email người báo cáo'
              : 'Số điện thoại người báo cáo'}
          </label>
          <span className="form-hint">
            {(isInteractive ? channel : initialChannel) === 'Web' ? 'Ví dụ: user@domain.com' : 'Ví dụ: 0912345678'}
          </span>
        </div>
        <input
          type="text"
          className="input-public"
          placeholder={(isInteractive ? channel : initialChannel) === 'Web' ? 'user@domain.com' : '0912345678'}
          value={isInteractive ? email : initialEmail}
          onChange={(e) => isInteractive && setEmail(e.target.value)}
          readOnly={!isInteractive}
        />
      </div>

      {/* 4. Description */}
      <div className="form-group-public">
        <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
          Mô tả (tùy chọn)
        </label>
        <textarea
          rows={3}
          className="textarea-public"
          value={isInteractive ? description : initialDescription}
          onChange={(e) => isInteractive && setDescription(e.target.value)}
          readOnly={!isInteractive}
        />
        <div className="char-counter">
          {(isInteractive ? description.length : initialDescription.length)}/1000
        </div>
      </div>

      {/* 5. Primary button */}
      <button type="button" className="btn-primary-public">
        Gửi báo cáo & phân tích
      </button>
    </div>
  );
};

export const ReportFormPage: React.FC = () => {
  return (
    <div className="canvas-stack">
      {/* =========================================================================
          RUN 1: SCREEN "Kiểm tra" — FRAME 1 (Default)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Kiểm tra" />
        <main className="page-content">
          <h1 className="page-title">Kiểm tra liên kết</h1>
          <p className="page-subtitle">Dán đường dẫn nghi ngờ để đối chiếu với 3 nguồn an ninh.</p>

          <div className="two-columns">
            <CheckForm isInteractive={true} />
            <div className="panel" style={{ flex: 1, minWidth: '460px' }}>
              <h2 className="panel-title" style={{ marginBottom: '16px' }}>Kết quả phân tích</h2>
              <div className="empty-line">Chưa có kết quả. Gửi một liên kết để bắt đầu.</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* =========================================================================
          RUN 1: SCREEN "Kiểm tra" — FRAME 2 (Validation error)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Kiểm tra" />
        <main className="page-content">
          <h1 className="page-title">Kiểm tra liên kết</h1>
          <p className="page-subtitle">Dán đường dẫn nghi ngờ để đối chiếu với 3 nguồn an ninh.</p>

          <div className="two-columns">
            <CheckForm
              initialUrl="vietcombank.com"
              urlError="Đường dẫn phải bắt đầu bằng http:// hoặc https://"
            />
            <div className="panel" style={{ flex: 1, minWidth: '460px' }}>
              <h2 className="panel-title" style={{ marginBottom: '16px' }}>Kết quả phân tích</h2>
              <div className="empty-line">Chưa có kết quả. Gửi một liên kết để bắt đầu.</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* =========================================================================
          RUN 1: SCREEN "Kiểm tra" — FRAME 3 (Phishing)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Kiểm tra" />
        <main className="page-content">
          <h1 className="page-title">Kiểm tra liên kết</h1>
          <p className="page-subtitle">Dán đường dẫn nghi ngờ để đối chiếu với 3 nguồn an ninh.</p>

          <div className="two-columns">
            <CheckForm
              initialUrl="https://vietcombank-ebank-login.xyz/auth"
              initialChannel="Web"
              initialEmail="security.officer@org.vn"
              initialDescription="Tin nhắn SMS mạo danh ngân hàng yêu cầu nâng cấp gói OTT."
            />
            <div className="panel" style={{ flex: 1, minWidth: '460px' }}>
              <div className="panel-header-row">
                <h2 className="panel-title">Kết quả phân tích</h2>
                <span className="mono muted-text" style={{ fontSize: '13px' }}>Báo cáo #1042</span>
              </div>

              <div className="verdict-row">
                <span className="verdict-label danger">LỪA ĐẢO</span>
                <span className="verdict-score danger">67%</span>
              </div>

              <div className="continuous-risk-bar">
                <div className="continuous-risk-fill danger" style={{ width: '67%' }}></div>
              </div>

              <div className="info-line">
                Tên miền: <span className="mono">vietcombank-ebank-login.xyz</span>
              </div>

              <table className="flat-table" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Nguồn</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google Safe Browsing</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 danger"></span>
                        <span>Gắn cờ</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Phishunt</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 danger"></span>
                        <span>Gắn cờ</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>PhishTank</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 safe"></span>
                        <span>Sạch</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="muted-text" style={{ fontSize: '13px', paddingTop: '4px' }}>
                Đã đưa cảnh báo vào hàng đợi gửi email/SMS.
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* =========================================================================
          RUN 1: SCREEN "Kiểm tra" — FRAME 4 (Safe)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Kiểm tra" />
        <main className="page-content">
          <h1 className="page-title">Kiểm tra liên kết</h1>
          <p className="page-subtitle">Dán đường dẫn nghi ngờ để đối chiếu với 3 nguồn an ninh.</p>

          <div className="two-columns">
            <CheckForm
              initialUrl="https://portal.vietcombank.com.vn"
              initialChannel="Web"
              initialEmail="security.officer@org.vn"
              initialDescription="Tin nhắn SMS mạo danh ngân hàng yêu cầu nâng cấp gói OTT."
            />
            <div className="panel" style={{ flex: 1, minWidth: '460px' }}>
              <div className="panel-header-row">
                <h2 className="panel-title">Kết quả phân tích</h2>
              </div>

              <div className="verdict-row">
                <span className="verdict-label safe">AN TOÀN</span>
                <span className="verdict-score safe">0%</span>
              </div>

              <div className="continuous-risk-bar">
                <div className="continuous-risk-fill safe" style={{ width: '0%' }}></div>
              </div>

              <div className="info-line">
                Tên miền: <span className="mono">portal.vietcombank.com.vn</span>
              </div>

              <table className="flat-table" style={{ marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th>Nguồn</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google Safe Browsing</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 safe"></span>
                        <span>Sạch</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Phishunt</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 safe"></span>
                        <span>Sạch</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>PhishTank</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 safe"></span>
                        <span>Sạch</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* =========================================================================
          RUN 1: SCREEN "Kiểm tra" — FRAME 5 (Pending)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Kiểm tra" />
        <main className="page-content">
          <h1 className="page-title">Kiểm tra liên kết</h1>
          <p className="page-subtitle">Dán đường dẫn nghi ngờ để đối chiếu với 3 nguồn an ninh.</p>

          <div className="two-columns">
            <CheckForm
              initialUrl="https://vietcombank-ebank-login.xyz/auth"
              initialChannel="Web"
              initialEmail="security.officer@org.vn"
              initialDescription="Tin nhắn SMS mạo danh ngân hàng yêu cầu nâng cấp gói OTT."
            />
            <div className="panel" style={{ flex: 1, minWidth: '460px' }}>
              <div className="panel-header-row">
                <h2 className="panel-title">Kết quả phân tích</h2>
              </div>

              <div className="verdict-row">
                <span className="verdict-label pending">ĐANG CHỜ</span>
              </div>

              <p className="muted-text" style={{ fontSize: '14px', margin: '14px 0 16px 0', lineHeight: 1.5 }}>
                Dịch vụ phân tích phản hồi chậm. Báo cáo đã được lưu và sẽ xử lý sau.
              </p>

              <table className="flat-table">
                <thead>
                  <tr>
                    <th>Nguồn</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google Safe Browsing</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 pending"></span>
                        <span style={{ color: 'var(--pending)' }}>Lỗi</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Phishunt</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 pending"></span>
                        <span style={{ color: 'var(--pending)' }}>Lỗi</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>PhishTank</td>
                    <td>
                      <span className="status-badge">
                        <span className="status-dot-8 pending"></span>
                        <span style={{ color: 'var(--pending)' }}>Lỗi</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* =========================================================================
          RUN 1: SCREEN "Kiểm tra" — FRAME 6 (Rate limit)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Kiểm tra" />
        <main className="page-content">
          <h1 className="page-title">Kiểm tra liên kết</h1>
          <p className="page-subtitle">Dán đường dẫn nghi ngờ để đối chiếu với 3 nguồn an ninh.</p>

          <div className="two-columns">
            <CheckForm
              initialUrl="https://vietcombank-ebank-login.xyz/auth"
              initialChannel="Web"
              initialEmail="security.officer@org.vn"
              initialDescription="Tin nhắn SMS mạo danh ngân hàng yêu cầu nâng cấp gói OTT."
            />
            <div className="panel" style={{ flex: 1, minWidth: '460px' }}>
              <div className="panel-header-row">
                <h2 className="panel-title">Kết quả phân tích</h2>
              </div>
              <div style={{ color: 'var(--danger)', fontSize: '14px', lineHeight: 1.5 }}>
                Bạn gửi quá 5 lần trong 1 phút. Vui lòng thử lại sau 42 giây.
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};
