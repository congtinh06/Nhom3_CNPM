import React, { useCallback, useEffect, useState } from 'react';
import { AccountSection } from './AccountSection';
import { claimFeedbackThread, getMyFeedbackThreads, loadAllFeedbackCredentials, FeedbackThread } from '../../services/feedbackService';

export const AccountFeedback: React.FC = () => {
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setThreads(await getMyFeedbackThreads()); setError(''); }
    catch { setError('Không tải được hội thoại hỗ trợ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    const run = async () => {
      const credentials = loadAllFeedbackCredentials();
      await Promise.all(credentials.map(async (credential) => {
        try { await claimFeedbackThread(credential.ticket, credential.accessToken); } catch { /* inaccessible or already linked to another account */ }
      }));
      if (active) await refresh();
    };
    void run();
    const timer = window.setInterval(() => { if (active) void refresh(); }, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refresh]);
  return <AccountSection id="feedback" title="Tin nhắn hỗ trợ" description="Các hội thoại gắn với tài khoản này. Phản hồi mới tự cập nhật.">
    {loading && <p className="ac-muted">Đang tải hội thoại…</p>}
    {!loading && error && <p className="ac-error">{error}</p>}
    {!loading && !error && threads.length === 0 && <p className="ac-muted">Chưa có hội thoại nào được gắn với tài khoản. Tin nhắn gửi trước khi đăng nhập sẽ xuất hiện sau khi đăng nhập trên cùng trình duyệt.</p>}
    {!loading && !error && threads.map((thread) => <article key={thread.ticket} style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>Yêu cầu hỗ trợ</strong><span>{thread.status === 'REPLIED' ? 'Đã có phản hồi' : 'Đang chờ phản hồi'}</span></header>
      <p className="ac-muted" style={{ margin: '4px 0 12px' }}>Gửi lúc {new Date(thread.createdAt).toLocaleString('vi-VN')}</p>
      <div aria-live="polite">{thread.messages.map((message) => <p key={message.id} style={{ whiteSpace: 'pre-wrap', padding: 12, borderRadius: 8, background: message.sender === 'ADMIN' ? '#eff6ff' : '#f5f5f4' }}><b>{message.sender === 'ADMIN' ? 'Echora' : 'Bạn'}:</b> {message.content}<br/><small>{new Date(message.createdAt).toLocaleString('vi-VN')}</small></p>)}</div>
    </article>)}
  </AccountSection>;
};
export default AccountFeedback;
