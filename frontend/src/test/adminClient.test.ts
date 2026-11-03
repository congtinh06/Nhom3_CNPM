import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { adminClient, normalizeAdminError } from '../admin/api/adminClient';
import { tokenStore, notifyLoggedOut } from '../api/tokenStore';

vi.mock('../api/tokenStore', async () => {
  let token: string | null = null;
  return {
    tokenStore: {
      get: vi.fn(() => token),
      set: vi.fn((t: string | null) => {
        token = t;
      }),
      clear: vi.fn(() => {
        token = null;
      }),
    },
    notifyLoggedOut: vi.fn(),
  };
});

describe('adminClient & normalizeAdminError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
  });

  describe('normalizeAdminError', () => {
    it('chuẩn hóa lỗi 403 Forbidden thành thông báo tiếng Việt', () => {
      const err = new AxiosError(
        'Request failed with status code 403',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 403,
          statusText: 'Forbidden',
          data: {},
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );

      const normalized = normalizeAdminError(err);
      expect(normalized.status).toBe(403);
      expect(normalized.message).toBe('Bạn không có quyền thực hiện thao tác này.');
    });

    it('chuẩn hóa lỗi 401 Unauthorized thành thông báo hết hạn phiên', () => {
      const err = new AxiosError(
        'Request failed with status code 401',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );

      const normalized = normalizeAdminError(err);
      expect(normalized.status).toBe(401);
      expect(normalized.message).toBe('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    });

    it('ưu tiên message từ server nếu máy chủ cung cấp', () => {
      const err = new AxiosError(
        'Server Error',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Tên danh mục không được để trống' },
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );

      const normalized = normalizeAdminError(err);
      expect(normalized.status).toBe(400);
      expect(normalized.message).toBe('Tên danh mục không được để trống');
    });

    it('đọc detail của ProblemDetail cho 401/403', () => {
      const unauthorized = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 401,
        statusText: 'Unauthorized',
        data: {
          title: 'Unauthorized',
          status: 401,
          detail: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
          traceId: 'trace-401',
        },
        headers: {},
        config: { headers: new AxiosHeaders() },
      });
      expect(normalizeAdminError(unauthorized).message).toBe(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
      );

      const forbidden = new AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 403,
        statusText: 'Forbidden',
        data: {
          title: 'Forbidden',
          status: 403,
          detail: 'Bạn không có quyền thực hiện thao tác này.',
          traceId: 'trace-403',
        },
        headers: {},
        config: { headers: new AxiosHeaders() },
      });
      expect(normalizeAdminError(forbidden).message).toBe(
        'Bạn không có quyền thực hiện thao tác này.'
      );
    });

    it('đọc detail của ProblemDetail cho 429 và 500', () => {
      const rateLimited = new AxiosError('Too Many Requests', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 429,
        statusText: 'Too Many Requests',
        data: {
          title: 'Too Many Requests',
          status: 429,
          detail: 'Rate limit exceeded. Retry after 12 seconds.',
          traceId: 'trace-429',
        },
        headers: {},
        config: { headers: new AxiosHeaders() },
      });
      expect(normalizeAdminError(rateLimited).message).toBe(
        'Rate limit exceeded. Retry after 12 seconds.'
      );

      const serverError = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 500,
        statusText: 'Internal Server Error',
        data: {
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred',
          traceId: 'trace-500',
        },
        headers: {},
        config: { headers: new AxiosHeaders() },
      });
      expect(normalizeAdminError(serverError).message).toBe('An unexpected error occurred');
    });

    it('đọc errors map của ProblemDetail và giữ fallback details cũ', () => {
      const problem = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 400,
        statusText: 'Bad Request',
        data: {
          title: 'Bad Request',
          status: 400,
          detail: 'Validation failed',
          errors: { email: 'Email không hợp lệ' },
        },
        headers: {},
        config: { headers: new AxiosHeaders() },
      });
      expect(normalizeAdminError(problem).details).toEqual({ email: 'Email không hợp lệ' });

      const legacy = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 400,
        statusText: 'Bad Request',
        data: { details: { slug: 'Slug bị trùng' } },
        headers: {},
        config: { headers: new AxiosHeaders() },
      });
      expect(normalizeAdminError(legacy).details).toEqual({ slug: 'Slug bị trùng' });
    });
  });

  describe('Request Interceptor', () => {
    it('tự động đính kèm Authorization: Bearer <token> khi tokenStore có token', async () => {
      vi.mocked(tokenStore.get).mockReturnValue('valid-admin-jwt');

      const requestInterceptor = (adminClient.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig }>;
      }).handlers[0]!.fulfilled;

      const baseConfig: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
      };

      const mutated = requestInterceptor(baseConfig);
      expect(mutated.headers.get('Authorization')).toBe('Bearer valid-admin-jwt');
    });

    it('không đính kèm Authorization khi tokenStore rỗng', async () => {
      vi.mocked(tokenStore.get).mockReturnValue(null);

      const requestInterceptor = (adminClient.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig }>;
      }).handlers[0]!.fulfilled;

      const baseConfig: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
      };

      const mutated = requestInterceptor(baseConfig);
      expect(mutated.headers.get('Authorization')).toBeUndefined();
    });
  });

  describe('Response Interceptor & Refresh Flow', () => {
    it('thử refresh và thực thi lại request khi nhận 401', async () => {
      vi.mocked(tokenStore.get).mockReturnValue('expired-token');

      const responseErrorHandler = (adminClient.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>;
      }).handlers[0]!.rejected;

      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { accessToken: 'new-valid-token' },
      });
      const replaySpy = vi.spyOn(adminClient, 'request').mockResolvedValueOnce({ data: 'replayed' });

      const reqConfig: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
        url: '/api/admin/products',
      };

      const error401 = new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        reqConfig,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config: reqConfig,
        }
      );

      const res = await responseErrorHandler(error401);
      expect(replaySpy).toHaveBeenCalled();
      expect(tokenStore.set).toHaveBeenCalledWith('new-valid-token', 'admin');
      expect(res).toEqual({ data: 'replayed' });
    });

    it('gọi notifyLoggedOut khi refresh token thất bại trên lỗi 401', async () => {
      vi.mocked(tokenStore.get).mockReturnValue('expired-token');

      const responseErrorHandler = (adminClient.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>;
      }).handlers[0]!.rejected;

      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Refresh failed'));

      const reqConfig: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
        url: '/api/admin/products',
      };

      const error401 = new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        reqConfig,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config: reqConfig,
        }
      );

      await expect(responseErrorHandler(error401)).rejects.toMatchObject({
        message: expect.any(String),
      });

      expect(notifyLoggedOut).toHaveBeenCalled();
    });
  });
});
