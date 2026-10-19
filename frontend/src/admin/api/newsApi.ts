import { adminClient } from './adminClient';
import {
  NewsArticle,
  CreateNewsArticleInput,
  UpdateNewsArticleInput,
  NewsQueryParams,
  NewsPageResponse,
} from '../types/news';

export const newsApi = {
  getNews: async (params?: NewsQueryParams): Promise<NewsPageResponse> => {
    const response = await adminClient.get<NewsPageResponse>('/api/admin/news', {
      params,
    });
    return response.data;
  },

  getNewsById: async (id: number): Promise<NewsArticle> => {
    const response = await adminClient.get<NewsArticle>(`/api/admin/news/${id}`);
    return response.data;
  },

  createNews: async (data: CreateNewsArticleInput): Promise<NewsArticle> => {
    const response = await adminClient.post<NewsArticle>('/api/admin/news', data);
    return response.data;
  },

  updateNews: async (id: number, data: UpdateNewsArticleInput): Promise<NewsArticle> => {
    const response = await adminClient.put<NewsArticle>(`/api/admin/news/${id}`, data);
    return response.data;
  },

  updateNewsStatus: async (id: number, isActive: boolean): Promise<NewsArticle> => {
    const response = await adminClient.patch<NewsArticle>(`/api/admin/news/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  deleteNews: async (id: number): Promise<void> => {
    await adminClient.delete(`/api/admin/news/${id}`);
  },
};
