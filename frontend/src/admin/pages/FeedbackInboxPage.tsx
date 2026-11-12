import React, { useCallback, useEffect, useState } from 'react';
import { feedbackApi } from '../api/feedbackApi';
import { FeedbackThread } from '../../services/feedbackService';

export const FeedbackInboxPage: React.FC = () => {
  const [items, setItems] = useState<FeedbackThread[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { const data = await feedbackApi.list(); setItems(data); setError(''); }
    catch { setError('Không tải được hộp thư liên hệ.'); }
  }, []);
  useEffect(() => { void refresh(); const timer = window.setInterval(refresh, 4000); return () => window.clearInterval(timer); }, [refresh]);
  const active = items.find((item) => item.ticket === selected) || items[0];
  const send = async (event: React.FormEvent) => {
    event.preventDefault(); if (!active || !reply.trim()) return;
    try { await feedbackApi.reply(active.ticket, reply.trim()); setReply(''); await refresh(); }
    catch { setError('Không gửi được phản hồi. Vui lòng thử lại.'); }
  };
  return <div className="adm-page">
    <header className="adm-page-header"><div><h1>Liên hệ khách hàng</h1><p>Tin nhắn mới và phản hồi tự cập nhật mỗi vài giây.</p></div><button className="adm-btn adm-btn-secondary" onClick={() => void refresh()}>Làm mới</button></header>
    {error && <p role="alert">{error}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(360px, 1.5fr)', gap: 20 }}>
      <div className="adm-card" style={{ padding: 16 }}><h2>Hộp thư ({items.length})</h2>{items.map((item) => <button key={item.ticket} onClick={() => setSelected(item.ticket)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: 12, margin: '8px 0', border: '1px solid #ddd', borderRadius: 8, background: active?.ticket === item.ticket ? '#fff7ed' : 'white' }}><b>{item.name}</b><span style={{ float: 'right' }}>{item.status === 'OPEN' ? 'Mới' : 'Đã trả lời'}</span><br/><small>{item.email} · {new Date(item.updatedAt).toLocaleString('vi-VN')}</small></button>)}</div>
      <div className="adm-card" style={{ padding: 20 }}>{active ? <><h2>{active.name}</h2><p>{active.email} · Mã {active.ticket}</p><div aria-live="polite" style={{ minHeight: 220, maxHeight: 420, overflow: 'auto' }}>{active.messages.map((message) => <p key={message.id} style={{ padding: 12, borderRadius: 8, background: message.sender === 'ADMIN' ? '#eff6ff' : '#f5f5f4' }}><b>{message.sender === 'ADMIN' ? 'Admin' : active.name}</b> · {new Date(message.createdAt).toLocaleString('vi-VN')}<br/>{message.content}</p>)}</div><form onSubmit={send}><textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength={5000} required rows={4} style={{ width: '100%', marginTop: 12 }} placeholder="Nhập phản hồi..."/><button className="adm-btn adm-btn-primary" type="submit" disabled={!reply.trim()}>Gửi phản hồi</button></form></> : <p>Chưa có tin nhắn liên hệ.</p>}</div>
    </div>
  </div>;
};
export default FeedbackInboxPage;
