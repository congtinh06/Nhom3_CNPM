import { adminClient } from './adminClient';
import { FeedbackThread } from '../../services/feedbackService';

export const feedbackApi = {
  list: async () => (await adminClient.get<FeedbackThread[]>('/api/admin/feedback')).data,
  reply: async (ticket: string, message: string) =>
    (await adminClient.post<FeedbackThread>(`/api/admin/feedback/${encodeURIComponent(ticket)}/replies`, { message })).data,
};
