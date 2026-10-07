export interface FeedbackPayload {
  name: string;
  email: string;
  message: string;
}

export const submitFeedback = async (payload: FeedbackPayload): Promise<{ success: boolean; message: string }> => {
  /* TODO: gửi lên BE, ví dụ fetch("/api/feedback",{method:"POST",...}) */
  return {
    success: true,
    message: `Cảm ơn ${payload.name}! Góp ý đã được ghi nhận (bản demo, chưa gửi lên server).`,
  };
};
