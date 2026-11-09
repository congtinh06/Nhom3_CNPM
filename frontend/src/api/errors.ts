export interface NormalizedApiError {
  status: number;
  message: string;
  retryAfter?: number;
  details?: Record<string, string>;
  isNetworkError: boolean;
  isAborted: boolean;
}

export function normalizeApiError(error: unknown, _unused?: boolean): NormalizedApiError {
  if (typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name === 'CanceledError') {
    return {
      status: 0,
      message: 'Yêu cầu đã bị hủy.',
      isNetworkError: false,
      isAborted: true,
    };
  }

  const err = error as {
    response?: {
      status: number;
      data?: {
        // RFC 7807 ProblemDetail fields (current contract)
        type?: string;
        title?: string;
        status?: number;
        detail?: string;
        instance?: string;
        traceId?: string;
        errors?: unknown;
        // Legacy fields kept as safe fallbacks for older/non-contract responses
        message?: string;
        error?: string;
        details?: unknown;
      };
      headers?: Record<string, string | undefined>;
    };
    request?: unknown;
    message?: string;
  };

  if (err.response) {
    const status = err.response.status;
    let retryAfter: number | undefined;
    const retryHeader = err.response.headers?.['retry-after'];
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10);
      if (!Number.isNaN(parsed)) {
        retryAfter = parsed;
      }
    }

    const data = err.response.data;
    // Prefer the RFC 7807 detail, then title; fall back to legacy message/error.
    const serverMsg = data?.detail || data?.title || data?.message || data?.error;
    const rawDetails = data?.errors ?? data?.details;
    const details =
      rawDetails && typeof rawDetails === 'object' && !Array.isArray(rawDetails)
        ? (rawDetails as Record<string, string>)
        : undefined;

    if (status === 400) {
      return {
        status,
        message: serverMsg || 'Dữ liệu yêu cầu không hợp lệ.',
        details,
        isNetworkError: false,
        isAborted: false,
      };
    }
    if (status === 401) {
      return {
        status,
        message: serverMsg || 'Sai khóa quản trị hoặc chưa được phân quyền.',
        details,
        isNetworkError: false,
        isAborted: false,
      };
    }
    if (status === 403) {
      return {
        status,
        message: serverMsg || 'Bạn không có quyền thực hiện thao tác này.',
        details,
        isNetworkError: false,
        isAborted: false,
      };
    }
    if (status === 404) {
      return {
        status,
        message: serverMsg || 'Không tìm thấy dữ liệu yêu cầu.',
        details,
        isNetworkError: false,
        isAborted: false,
      };
    }
    if (status === 429) {
      return {
        status,
        message:
          serverMsg ||
          (retryAfter
            ? `Hệ thống đang bận. Vui lòng thử lại sau ${retryAfter} giây.`
            : 'Gửi yêu cầu quá nhanh. Vui lòng đợi trong giây lát.'),
        retryAfter,
        details,
        isNetworkError: false,
        isAborted: false,
      };
    }
    if (status >= 500) {
      return {
        status,
        message: serverMsg || 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
        details,
        isNetworkError: false,
        isAborted: false,
      };
    }

    return {
      status,
      message: serverMsg || `Lỗi máy chủ (${status}).`,
      details,
      isNetworkError: false,
      isAborted: false,
    };
  }

  if (err.request) {
    return {
      status: 0,
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',
      isNetworkError: true,
      isAborted: false,
    };
  }

  return {
    status: 0,
    message: err.message || 'Đã xảy ra lỗi không xác định.',
    isNetworkError: false,
    isAborted: false,
  };
}
