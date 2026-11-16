import { apiClient } from '../api/client';

export interface FeedbackPayload {
  name: string;
  email: string;
  message: string;
}

export interface FeedbackThread {
  ticket: string;
  name: string;
  email: string;
  status: 'OPEN' | 'REPLIED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  messages: Array<{ id: number; sender: 'CUSTOMER' | 'ADMIN'; content: string; createdAt: string }>;
}

export const saveFeedbackCredentials = (ticket: string, accessToken: string) => {
  const credentials = loadAllFeedbackCredentials().filter((value) => value.ticket !== ticket);
  credentials.push({ ticket, accessToken });
  localStorage.setItem('echora.feedback.credentials', JSON.stringify(credentials));
};

export const loadAllFeedbackCredentials = (): Array<{ ticket: string; accessToken: string }> => {
  try {
    const value = JSON.parse(localStorage.getItem('echora.feedback.credentials') || 'null');
    const rows = Array.isArray(value) ? value : value ? [value] : [];
    return rows.filter((row) => row?.ticket && row?.accessToken);
  } catch { return []; }
};

export const loadFeedbackCredentials = (): { ticket: string; accessToken: string } | null => {
  const rows = loadAllFeedbackCredentials();
  return rows[rows.length - 1] || null;
};

export const submitFeedback = async (payload: FeedbackPayload): Promise<{ success: boolean; message: string; ticket?: string; accessToken?: string }> => {
  const { data } = await apiClient.post('/api/feedback', payload);
  return data;
};

export const getFeedbackThread = async (ticket: string, accessToken: string): Promise<FeedbackThread> => {
  const { data } = await apiClient.get(`/api/feedback/${encodeURIComponent(ticket)}`, {
    headers: { 'X-Feedback-Token': accessToken },
  });
  return data;
};

export const claimFeedbackThread = async (ticket: string, accessToken: string): Promise<FeedbackThread> => {
  const { data } = await apiClient.post(`/api/feedback/${encodeURIComponent(ticket)}/claim`, {}, {
    headers: { 'X-Feedback-Token': accessToken },
  });
  return data;
};

export const getMyFeedbackThreads = async (): Promise<FeedbackThread[]> => {
  const { data } = await apiClient.get<FeedbackThread[]>('/api/feedback/me');
  return data;
};
