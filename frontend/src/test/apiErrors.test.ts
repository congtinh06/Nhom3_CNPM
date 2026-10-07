import { describe, it, expect } from 'vitest';
import { normalizeApiError } from '../api/errors';

describe('normalizeApiError', () => {
  it('normalizes 400 Bad Request error', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Dữ liệu không hợp lệ' },
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(400);
    expect(norm.message).toBe('Dữ liệu không hợp lệ');
    expect(norm.isNetworkError).toBe(false);
  });

  it('normalizes 401 Unauthorized error with proper Vietnamese message', () => {
    const error = {
      response: {
        status: 401,
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(401);
    expect(norm.message).toContain('Sai khóa quản trị');
  });

  it('normalizes 404 Not Found error', () => {
    const error = {
      response: {
        status: 404,
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(404);
    expect(norm.message).toBe('Không tìm thấy dữ liệu yêu cầu.');
  });

  it('normalizes 429 Rate Limit error with Retry-After header', () => {
    const error = {
      response: {
        status: 429,
        headers: { 'retry-after': '30' },
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(429);
    expect(norm.retryAfter).toBe(30);
    expect(norm.message).toContain('30 giây');
  });

  it('normalizes 500 Server error', () => {
    const error = {
      response: {
        status: 500,
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(500);
    expect(norm.message).toContain('Máy chủ đang gặp sự cố');
  });

  it('normalizes network errors when no response is received', () => {
    const error = {
      request: {},
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(0);
    expect(norm.isNetworkError).toBe(true);
    expect(norm.message).toContain('Không thể kết nối đến máy chủ');
  });

  it('normalizes canceled request errors', () => {
    const error = {
      name: 'CanceledError',
      message: 'canceled',
    };
    const norm = normalizeApiError(error);
    expect(norm.isAborted).toBe(true);
  });
});
