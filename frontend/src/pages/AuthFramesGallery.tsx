import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

export type AuthFrameKey =
  | 'login-default'
  | 'login-wrong-credentials'
  | 'login-loading'
  | 'login-admin-denied'
  | 'register-default'
  | 'register-validation-errors'
  | 'register-email-used';

export const AuthFramesGallery: React.FC = () => {
  const [activeFrame, setActiveFrame] = useState<AuthFrameKey>('login-default');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      {/* Top Frame Selector Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CHỌN KHUNG HÌNH RIÊNG BIỆT:</span>
        <button
          type="button"
          className={`frame-pill-btn ${activeFrame === 'login-default' ? 'active' : ''}`}
          onClick={() => setActiveFrame('login-default')}
        >
          1. Đăng nhập: Mặc định
        </button>
        <button
          type="button"
          className={`frame-pill-btn ${activeFrame === 'login-wrong-credentials' ? 'active' : ''}`}
          onClick={() => setActiveFrame('login-wrong-credentials')}
        >
          2. Đăng nhập: Sai thông tin
        </button>
        <button
          type="button"
          className={`frame-pill-btn ${activeFrame === 'login-loading' ? 'active' : ''}`}
          onClick={() => setActiveFrame('login-loading')}
        >
          3. Đăng nhập: Đang tải
        </button>
        <button
          type="button"
          className={`frame-pill-btn ${activeFrame === 'login-admin-denied' ? 'active' : ''}`}
          onClick={() => setActiveFrame('login-admin-denied')}
        >
          4. Đăng nhập: Từ chối quyền admin
        </button>
        <button
          type="button"
          className={`frame-pill-btn ${activeFrame === 'register-default' ? 'active' : ''}`}
          onClick={() => setActiveFrame('register-default')}
        >
          5. Đăng ký: Mặc định
        </button>
        <button
          type="button"
          className={`frame-pill-btn ${activeFrame === 'register-validation-errors' ? 'active' : ''}`}
          onClick={() => setActiveFrame('register-validation-errors')}
        >
          6. Đăng ký: Lỗi validation
        </button>
        <button
          type="button"
          className={`frame-pill-btn ${activeFrame === 'register-email-used' ? 'active' : ''}`}
          onClick={() => setActiveFrame('register-email-used')}
        >
          7. Đăng ký: Email đã tồn tại
        </button>
      </div>

      {/* RENDER ACTIVE FRAME */}

      {/* FRAME 1: ĐĂNG NHẬP: DEFAULT */}
      {activeFrame === 'login-default' && (
        <div className="auth-panel-wrapper">
          <div className="auth-panel">
            <h1 className="auth-title">Đăng nhập</h1>
            <p className="auth-subtitle">Đăng nhập để xem lại lịch sử báo cáo của bạn.</p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f1-email">Email</label>
                <input id="f1-email" type="email" className="auth-input" placeholder="nguoidung@example.com" />
              </div>

              <div className="auth-form-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label" htmlFor="f1-password">Mật khẩu</label>
                <div className="auth-input-wrapper">
                  <input
                    id="f1-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    style={{ paddingRight: '56px' }}
                  />
                  <button type="button" className="auth-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-btn-primary">
                Đăng nhập
              </button>

              <div className="auth-divider"><span>hoặc</span></div>

              <div className="auth-secondary-btn-stack">
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Google</button>
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Zalo</button>
              </div>

              <div className="auth-footer-prompt">
                Chưa có tài khoản?{' '}
                <span className="auth-accent-link" onClick={() => setActiveFrame('register-default')}>
                  Đăng ký
                </span>
              </div>
            </form>
          </div>

          <div className="auth-under-panel-note">
            Bạn không cần đăng nhập để{' '}
            <NavLink to="/" className="auth-accent-link" style={{ fontSize: '13px' }}>
              kiểm tra liên kết
            </NavLink>.
          </div>
        </div>
      )}

      {/* FRAME 2: ĐĂNG NHẬP: WRONG CREDENTIALS */}
      {activeFrame === 'login-wrong-credentials' && (
        <div className="auth-panel-wrapper">
          <div className="auth-panel">
            <h1 className="auth-title">Đăng nhập</h1>
            <p className="auth-subtitle">Đăng nhập để xem lại lịch sử báo cáo của bạn.</p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f2-email">Email</label>
                <input id="f2-email" type="email" className="auth-input" defaultValue="user@example.com" />
              </div>

              <div className="auth-form-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label" htmlFor="f2-password">Mật khẩu</label>
                <div className="auth-input-wrapper">
                  <input
                    id="f2-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    style={{ paddingRight: '56px' }}
                    defaultValue="123456"
                  />
                  <button type="button" className="auth-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-btn-primary">
                Đăng nhập
              </button>

              <div className="auth-danger-text">
                Email hoặc mật khẩu không đúng.
              </div>

              <div className="auth-divider"><span>hoặc</span></div>

              <div className="auth-secondary-btn-stack">
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Google</button>
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Zalo</button>
              </div>

              <div className="auth-footer-prompt">
                Chưa có tài khoản?{' '}
                <span className="auth-accent-link" onClick={() => setActiveFrame('register-default')}>
                  Đăng ký
                </span>
              </div>
            </form>
          </div>

          <div className="auth-under-panel-note">
            Bạn không cần đăng nhập để{' '}
            <NavLink to="/" className="auth-accent-link" style={{ fontSize: '13px' }}>
              kiểm tra liên kết
            </NavLink>.
          </div>
        </div>
      )}

      {/* FRAME 3: ĐĂNG NHẬP: LOADING */}
      {activeFrame === 'login-loading' && (
        <div className="auth-panel-wrapper">
          <div className="auth-panel">
            <h1 className="auth-title">Đăng nhập</h1>
            <p className="auth-subtitle">Đăng nhập để xem lại lịch sử báo cáo của bạn.</p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f3-email">Email</label>
                <input id="f3-email" type="email" className="auth-input" defaultValue="nguoidung@bank.vn" disabled />
              </div>

              <div className="auth-form-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label" htmlFor="f3-password">Mật khẩu</label>
                <div className="auth-input-wrapper">
                  <input
                    id="f3-password"
                    type="password"
                    className="auth-input"
                    style={{ paddingRight: '56px' }}
                    defaultValue="password123"
                    disabled
                  />
                  <button type="button" className="auth-toggle-btn" disabled>Hiện</button>
                </div>
              </div>

              <button type="button" className="auth-btn-primary" disabled>
                Đang đăng nhập…
              </button>

              <div className="auth-divider"><span>hoặc</span></div>

              <div className="auth-secondary-btn-stack">
                <button type="button" className="auth-btn-secondary" disabled>Đăng nhập bằng Google</button>
                <button type="button" className="auth-btn-secondary" disabled>Đăng nhập bằng Zalo</button>
              </div>

              <div className="auth-footer-prompt">
                Chưa có tài khoản?{' '}
                <span className="auth-accent-link" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                  Đăng ký
                </span>
              </div>
            </form>
          </div>

          <div className="auth-under-panel-note">
            Bạn không cần đăng nhập để{' '}
            <NavLink to="/" className="auth-accent-link" style={{ fontSize: '13px' }}>
              kiểm tra liên kết
            </NavLink>.
          </div>
        </div>
      )}

      {/* FRAME 4: ĐĂNG NHẬP: ADMIN AREA DENIED */}
      {activeFrame === 'login-admin-denied' && (
        <div className="auth-panel-wrapper">
          <div className="auth-panel">
            <h1 className="auth-title">Đăng nhập</h1>
            <p className="auth-subtitle">Đăng nhập để xem lại lịch sử báo cáo của bạn.</p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f4-email">Email</label>
                <input id="f4-email" type="email" className="auth-input" defaultValue="canbo.nganhang@gmail.com" />
              </div>

              <div className="auth-form-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label" htmlFor="f4-password">Mật khẩu</label>
                <div className="auth-input-wrapper">
                  <input
                    id="f4-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    style={{ paddingRight: '56px' }}
                    defaultValue="Matkhau@2026"
                  />
                  <button type="button" className="auth-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-btn-primary">
                Đăng nhập
              </button>

              <div className="auth-danger-text">
                Tài khoản này chưa được cấp quyền quản trị.
              </div>

              <div className="auth-divider"><span>hoặc</span></div>

              <div className="auth-secondary-btn-stack">
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Google</button>
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Zalo</button>
              </div>

              <div className="auth-footer-prompt">
                Chưa có tài khoản?{' '}
                <span className="auth-accent-link" onClick={() => setActiveFrame('register-default')}>
                  Đăng ký
                </span>
              </div>
            </form>
          </div>

          <div className="auth-under-panel-note">
            Bạn không cần đăng nhập để{' '}
            <NavLink to="/" className="auth-accent-link" style={{ fontSize: '13px' }}>
              kiểm tra liên kết
            </NavLink>.
          </div>
        </div>
      )}

      {/* FRAME 5: ĐĂNG KÝ: DEFAULT */}
      {activeFrame === 'register-default' && (
        <div className="auth-panel-wrapper">
          <div className="auth-panel">
            <h1 className="auth-title" style={{ marginBottom: '24px' }}>Tạo tài khoản</h1>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f5-fullname">Họ và tên</label>
                <input id="f5-fullname" type="text" className="auth-input" placeholder="Nguyễn Văn A" />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f5-email">Email</label>
                <input id="f5-email" type="email" className="auth-input" placeholder="user@domain.com" />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f5-password">Mật khẩu</label>
                <input id="f5-password" type="password" className="auth-input" />
                <div className="auth-helper-text">Tối thiểu 8 ký tự.</div>
              </div>

              <div className="auth-form-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label" htmlFor="f5-confirm-password">Nhập lại mật khẩu</label>
                <input id="f5-confirm-password" type="password" className="auth-input" />
              </div>

              <button type="submit" className="auth-btn-primary">
                Đăng ký
              </button>

              <div className="auth-divider"><span>hoặc</span></div>

              <div className="auth-secondary-btn-stack">
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Google</button>
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Zalo</button>
              </div>

              <div className="auth-footer-prompt">
                Đã có tài khoản?{' '}
                <span className="auth-accent-link" onClick={() => setActiveFrame('login-default')}>
                  Đăng nhập
                </span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FRAME 6: ĐĂNG KÝ: VALIDATION ERRORS */}
      {activeFrame === 'register-validation-errors' && (
        <div className="auth-panel-wrapper">
          <div className="auth-panel">
            <h1 className="auth-title" style={{ marginBottom: '24px' }}>Tạo tài khoản</h1>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f6-fullname">Họ và tên</label>
                <input id="f6-fullname" type="text" className="auth-input" defaultValue="Nguyễn Văn A" />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f6-email">Email</label>
                <input id="f6-email" type="email" className="auth-input has-error" defaultValue="email-khong-hop-le" />
                <div className="auth-inline-error">Email không hợp lệ.</div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f6-password">Mật khẩu</label>
                <input id="f6-password" type="password" className="auth-input has-error" defaultValue="12345" />
                <div className="auth-inline-error">Mật khẩu cần tối thiểu 8 ký tự.</div>
              </div>

              <div className="auth-form-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label" htmlFor="f6-confirm-password">Nhập lại mật khẩu</label>
                <input id="f6-confirm-password" type="password" className="auth-input has-error" defaultValue="67890" />
                <div className="auth-inline-error">Mật khẩu nhập lại không khớp.</div>
              </div>

              <button type="submit" className="auth-btn-primary">
                Đăng ký
              </button>

              <div className="auth-divider"><span>hoặc</span></div>

              <div className="auth-secondary-btn-stack">
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Google</button>
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Zalo</button>
              </div>

              <div className="auth-footer-prompt">
                Đã có tài khoản?{' '}
                <span className="auth-accent-link" onClick={() => setActiveFrame('login-default')}>
                  Đăng nhập
                </span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FRAME 7: ĐĂNG KÝ: EMAIL ALREADY USED */}
      {activeFrame === 'register-email-used' && (
        <div className="auth-panel-wrapper">
          <div className="auth-panel">
            <h1 className="auth-title" style={{ marginBottom: '24px' }}>Tạo tài khoản</h1>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f7-fullname">Họ và tên</label>
                <input id="f7-fullname" type="text" className="auth-input" defaultValue="Trần Thị B" />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f7-email">Email</label>
                <input id="f7-email" type="email" className="auth-input" defaultValue="existing.user@gmail.com" />
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="f7-password">Mật khẩu</label>
                <input id="f7-password" type="password" className="auth-input" defaultValue="Matkhau@1234" />
                <div className="auth-helper-text">Tối thiểu 8 ký tự.</div>
              </div>

              <div className="auth-form-group" style={{ marginBottom: '24px' }}>
                <label className="auth-label" htmlFor="f7-confirm-password">Nhập lại mật khẩu</label>
                <input id="f7-confirm-password" type="password" className="auth-input" defaultValue="Matkhau@1234" />
              </div>

              <button type="submit" className="auth-btn-primary">
                Đăng ký
              </button>

              <div className="auth-danger-text">
                Email này đã được đăng ký.
              </div>

              <div className="auth-divider"><span>hoặc</span></div>

              <div className="auth-secondary-btn-stack">
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Google</button>
                <button type="button" className="auth-btn-secondary">Đăng nhập bằng Zalo</button>
              </div>

              <div className="auth-footer-prompt">
                Đã có tài khoản?{' '}
                <span className="auth-accent-link" onClick={() => setActiveFrame('login-default')}>
                  Đăng nhập
                </span>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
