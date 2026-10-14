import { adminClient } from './adminClient';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductQueryParams,
  ProductPageResponse,
} from '../types/product';

export const productApi = {
  getProducts: async (params?: ProductQueryParams): Promise<ProductPageResponse> => {
    const response = await adminClient.get<ProductPageResponse>('/api/admin/products', {
      params,
    });
    return response.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await adminClient.get<Product>(`/api/admin/products/${id}`);
    return response.data;
  },

  createProduct: async (data: CreateProductInput): Promise<Product> => {
    const response = await adminClient.post<Product>('/api/admin/products', data);
    return response.data;
  },

  updateProduct: async (id: number, data: UpdateProductInput): Promise<Product> => {
    const response = await adminClient.put<Product>(`/api/admin/products/${id}`, data);
    return response.data;
  },

  updateProductStatus: async (id: number, isActive: boolean): Promise<Product> => {
    const response = await adminClient.patch<Product>(`/api/admin/products/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  updateProductSortOrder: async (id: number, sortOrder: number): Promise<Product> => {
    const response = await adminClient.patch<Product>(`/api/admin/products/${id}/sort-order`, {
      sortOrder,
    });
    return response.data;
  },

  uploadProductImage: async (id: number, file: File): Promise<Product> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await adminClient.post<Product>(
      `/api/admin/products/${id}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
