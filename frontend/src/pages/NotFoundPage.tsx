import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="s sp" style={{ minHeight: '60vh', marginTop: 100, textAlign: 'center' }}>
      <h2>404 - Không tìm thấy trang</h2>
      <p style={{ margin: '16px auto' }}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển hướng.
      </p>
      <button type="button" className="tb" onClick={() => navigate('/')}>
        ← Về trang chủ
      </button>
    </section>
  );
};
