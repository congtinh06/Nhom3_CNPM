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

  it('reads RFC 7807 detail for 401 Unauthorized', () => {
    const error = {
      response: {
        status: 401,
        data: {
          type: 'https://api.echora.dev/problems/401',
          title: 'Unauthorized',
          status: 401,
          detail: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
          instance: '/api/orders',
          traceId: 'trace-401',
        },
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(401);
    expect(norm.message).toBe('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  });

  it('reads RFC 7807 detail for 403 Forbidden', () => {
    const error = {
      response: {
        status: 403,
        data: {
          title: 'Forbidden',
          status: 403,
          detail: 'Ngôn ngữ này yêu cầu gói Premium đang hoạt động.',
          instance: '/api/content/pois/guide',
          traceId: 'trace-403',
        },
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(403);
    expect(norm.message).toBe('Ngôn ngữ này yêu cầu gói Premium đang hoạt động.');
  });

  it('reads RFC 7807 detail for 429 and keeps Retry-After', () => {
    const error = {
      response: {
        status: 429,
        headers: { 'retry-after': '12' },
        data: {
          title: 'Too Many Requests',
          status: 429,
          detail: 'Rate limit exceeded. Retry after 12 seconds.',
          instance: '/api/analytics/events',
          traceId: 'trace-429',
        },
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(429);
    expect(norm.retryAfter).toBe(12);
    expect(norm.message).toBe('Rate limit exceeded. Retry after 12 seconds.');
  });

  it('reads RFC 7807 detail for 500 and falls back to title', () => {
    const error = {
      response: {
        status: 500,
        data: {
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred',
          instance: '/api/content/pois',
          traceId: 'trace-500',
        },
      },
    };
    const norm = normalizeApiError(error);
    expect(norm.status).toBe(500);
    expect(norm.message).toBe('An unexpected error occurred');

    const titleOnly = normalizeApiError({
      response: { status: 500, data: { title: 'Internal Server Error' } },
    });
    expect(titleOnly.message).toBe('Internal Server Error');
  });

  it('reads the RFC 7807 errors map and the legacy details field', () => {
    const problem = normalizeApiError({
      response: {
        status: 400,
        data: {
          title: 'Bad Request',
          status: 400,
          detail: 'Validation failed',
          errors: { email: 'Email không hợp lệ' },
        },
      },
    });
    expect(problem.details).toEqual({ email: 'Email không hợp lệ' });

    const legacy = normalizeApiError({
      response: { status: 400, data: { details: { slug: 'Slug bị trùng' } } },
    });
    expect(legacy.details).toEqual({ slug: 'Slug bị trùng' });
  });
});
