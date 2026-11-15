import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Send, User, ShieldCheck, Inbox } from 'lucide-react';
import { feedbackApi } from '../api/feedbackApi';
import { FeedbackThread } from '../../services/feedbackService';
import { AdminAlert } from '../components/AdminAlert';
import { AdminTabs, AdminTabItem } from '../components/AdminTabs';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const FeedbackInboxPage: React.FC = () => {
  const [items, setItems] = useState<FeedbackThread[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'REPLIED'>('ALL');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [successNote, setSuccessNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackApi.list();
      setItems(data);
      setError('');
    } catch {
      setError('Không tải được hộp thư liên hệ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      window.clearInterval(timer);
    };
  }, [refresh]);

  const filteredItems = items.filter((item) => {
    if (filter === 'OPEN') return item.status === 'OPEN';
    if (filter === 'REPLIED') return item.status !== 'OPEN';
    return true;
  });

  const openCount = items.filter((item) => item.status === 'OPEN').length;
  const active = filteredItems.find((item) => item.ticket === selected) || filteredItems[0] || null;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!active || !reply.trim() || sending) return;
    setSending(true);
    setError('');
    setSuccessNote('');
    try {
      await feedbackApi.reply(active.ticket, reply.trim());
      setReply('');
      setSuccessNote(`Đã gửi phản hồi cho mã ${active.ticket}. Khách hàng sẽ nhận được thông báo ngay.`);
      await refresh();
    } catch {
      setError('Không gửi được phản hồi. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const filterTabs: AdminTabItem[] = [
    { id: 'ALL', label: `Tất cả (${items.length})` },
    { id: 'OPEN', label: `Chờ phản hồi (${openCount})` },
    { id: 'REPLIED', label: `Đã trả lời (${items.length - openCount})` },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div className="adm-page-head-main">
          <h1 className="adm-page-title">Hộp thư liên hệ</h1>
          <p className="adm-page-desc">
            Tiếp nhận câu hỏi, góp ý từ trang Liên hệ và gửi phản hồi trực tiếp tới chuông thông báo của khách hàng.
          </p>
        </div>
        <div className="adm-page-actions">
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw size={15} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {error && (
        <AdminAlert
          variant="danger"
          message={error}
          onClose={() => setError('')}
        />
      )}
      {successNote && (
        <AdminAlert
          variant="success"
          message={successNote}
          onClose={() => setSuccessNote('')}
        />
      )}

      <div className="adm-feedback-grid">
        <div className="adm-card adm-feedback-card">
          <div className="adm-feedback-card-head">
            <h2 className="adm-card-title">
              <Inbox size={18} />
              <span>Hộp thư ({items.length})</span>
            </h2>
            {openCount > 0 && (
              <span className="adm-badge adm-badge-warning">
                {openCount} chờ xử lý
              </span>
            )}
          </div>

          <AdminTabs
            tabs={filterTabs}
            active={filter}
            onChange={(id) => setFilter(id as 'ALL' | 'OPEN' | 'REPLIED')}
            className="adm-feedback-tabs"
          />

          <div className="adm-feedback-list" role="tabpanel">
            {filteredItems.length === 0 ? (
              <EmptyState
                title="Không có tin nhắn"
                description="Chưa có tin nhắn liên hệ nào trong mục này."
              />
            ) : (
              filteredItems.map((item) => {
                const isSelected = active?.ticket === item.ticket;
                const isPending = item.status === 'OPEN';
                return (
                  <button
                    key={item.ticket}
                    type="button"
                    onClick={() => {
                      setSelected(item.ticket);
                      setSuccessNote('');
                    }}
                    className={`adm-feedback-item${isSelected ? ' adm-feedback-item-active' : ''}`}
                  >
                    <div className="adm-feedback-item-top">
                      <span className="adm-feedback-item-name">{item.name}</span>
                      <StatusBadge variant={isPending ? 'warning' : 'neutral'}>
                        {isPending ? 'Mới' : 'Đã trả lời'}
                      </StatusBadge>
                    </div>
                    <div className="adm-feedback-item-meta">
                      Mã: <strong>{item.ticket}</strong> - {item.email}
                    </div>
                    <div className="adm-feedback-item-time">
                      {new Date(item.updatedAt || item.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="adm-card adm-feedback-detail-card">
          {active ? (
            <>
              <div className="adm-feedback-detail-head">
                <div className="adm-feedback-detail-main">
                  <h2 className="adm-feedback-detail-title">{active.name}</h2>
                  <div className="adm-feedback-detail-meta">
                    <span>Email: <strong>{active.email}</strong></span>
                    <span>Mã theo dõi: <code>{active.ticket}</code></span>
                  </div>
                </div>
                <StatusBadge variant={active.status === 'OPEN' ? 'warning' : 'neutral'}>
                  {active.status === 'OPEN' ? 'Đang chờ Admin phản hồi' : 'Đã phản hồi'}
                </StatusBadge>
              </div>

              <div
                className="adm-feedback-thread"
                aria-live="polite"
              >
                {active.messages.map((message) => {
                  const isAdmin = message.sender === 'ADMIN';
                  return (
                    <div
                      key={message.id}
                      className={`adm-feedback-msg${isAdmin ? ' adm-feedback-msg-admin' : ''}`}
                    >
                      <div className="adm-feedback-msg-head">
                        <span className="adm-feedback-msg-sender">
                          {isAdmin ? (
                            <>
                              <ShieldCheck size={14} />
                              <span>Admin Echora</span>
                            </>
                          ) : (
                            <>
                              <User size={14} />
                              <span>{active.name}</span>
                            </>
                          )}
                        </span>
                        <span className="adm-feedback-msg-time">
                          {new Date(message.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="adm-feedback-msg-body">
                        {message.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={send} className="adm-feedback-reply-form">
                <label
                  htmlFor="admin-feedback-reply"
                  className="adm-feedback-reply-label"
                >
                  Phản hồi tới khách hàng
                </label>
                <textarea
                  id="admin-feedback-reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  maxLength={5000}
                  required
                  rows={4}
                  className="adm-textarea"
                  placeholder="Nhập nội dung phản hồi cho khách hàng"
                />
                <div className="adm-feedback-reply-actions">
                  <button
                    className="adm-btn adm-btn-primary"
                    type="submit"
                    disabled={!reply.trim() || sending}
                  >
                    <Send size={15} />
                    <span>{sending ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                  </button>
                  <span className="adm-feedback-reply-hint">
                    Khách hàng sẽ nhận được thông báo phản hồi ngay lập tức tại chuông thông báo.
                  </span>
                </div>
              </form>
            </>
          ) : (
            <EmptyState
              title="Chưa chọn tin nhắn"
              description="Vui lòng chọn một liên hệ từ danh sách bên trái để xem nội dung và phản hồi."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackInboxPage;
