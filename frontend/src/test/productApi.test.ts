import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productApi } from '../admin/api/productApi';
import { adminClient } from '../admin/api/adminClient';
import { CreateProductInput, UpdateProductInput, Product } from '../admin/types/product';

vi.mock('../admin/api/adminClient', () => ({
  adminClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('productApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct: Product = {
    id: 1,
    slug: 'banh-mi-thit',
    name: 'Bánh mì thịt',
    category: 'FOOD',
    shortDescription: 'Bánh mì giòn rụm',
    description: 'Bánh mì thịt truyền thống Sài Gòn',
    price: 35000,
    imagePath: '/img/products/banh-mi-thit.jpg',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  };

  it('getProducts: gọi đúng URL /api/admin/products với query params', async () => {
    const mockPageResponse = {
      content: [mockProduct],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: mockPageResponse });

    const params = { page: 0, size: 10, search: 'bánh mì', category: 'FOOD' as const, isActive: true };
    const result = await productApi.getProducts(params);

    expect(adminClient.get).toHaveBeenCalledWith('/api/admin/products', { params });
    expect(result).toEqual(mockPageResponse);
  });

  it('getProductById: gọi đúng URL /api/admin/products/:id', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: mockProduct });

    const result = await productApi.getProductById(1);

    expect(adminClient.get).toHaveBeenCalledWith('/api/admin/products/1');
    expect(result).toEqual(mockProduct);
  });

  it('createProduct: gửi POST tới /api/admin/products với payload', async () => {
    const input: CreateProductInput = {
      name: 'Cà phê sữa đá',
      category: 'DRINK',
      price: 28000,
      shortDescription: 'Cà phê đậm vị',
    };

    const createdProduct: Product = {
      ...mockProduct,
      id: 2,
      name: input.name,
      category: input.category,
      price: input.price,
    };

    vi.mocked(adminClient.post).mockResolvedValueOnce({ data: createdProduct });

    const result = await productApi.createProduct(input);

    expect(adminClient.post).toHaveBeenCalledWith('/api/admin/products', input);
    expect(result).toEqual(createdProduct);
  });

  it('updateProduct: gửi PUT tới /api/admin/products/:id với payload', async () => {
    const input: UpdateProductInput = {
      name: 'Bánh mì đặc biệt',
      category: 'FOOD',
      price: 45000,
    };

    const updatedProduct: Product = {
      ...mockProduct,
      name: input.name,
      price: input.price,
    };

    vi.mocked(adminClient.put).mockResolvedValueOnce({ data: updatedProduct });

    const result = await productApi.updateProduct(1, input);

    expect(adminClient.put).toHaveBeenCalledWith('/api/admin/products/1', input);
    expect(result).toEqual(updatedProduct);
  });

  it('updateProductStatus: gửi PATCH tới /api/admin/products/:id/status với isActive', async () => {
    const inactiveProduct: Product = {
      ...mockProduct,
      isActive: false,
    };

    vi.mocked(adminClient.patch).mockResolvedValueOnce({ data: inactiveProduct });

    const result = await productApi.updateProductStatus(1, false);

    expect(adminClient.patch).toHaveBeenCalledWith('/api/admin/products/1/status', {
      isActive: false,
    });
    expect(result.isActive).toBe(false);
  });

  it('updateProductSortOrder: gửi PATCH tới /api/admin/products/:id/sort-order với sortOrder', async () => {
    const reorderedProduct: Product = {
      ...mockProduct,
      sortOrder: 5,
    };

    vi.mocked(adminClient.patch).mockResolvedValueOnce({ data: reorderedProduct });

    const result = await productApi.updateProductSortOrder(1, 5);

    expect(adminClient.patch).toHaveBeenCalledWith('/api/admin/products/1/sort-order', {
      sortOrder: 5,
    });
    expect(result.sortOrder).toBe(5);
  });

  it('uploadProductImage: gửi POST multipart/form-data tới /api/admin/products/:id/image', async () => {
    const file = new File(['dummy-image-bytes'], 'pho.jpg', { type: 'image/jpeg' });
    const productWithNewImage: Product = {
      ...mockProduct,
      imagePath: '/img/products/banh-mi-thit.jpg',
    };

    vi.mocked(adminClient.post).mockResolvedValueOnce({ data: productWithNewImage });

    const result = await productApi.uploadProductImage(1, file);

    expect(adminClient.post).toHaveBeenCalledWith(
      '/api/admin/products/1/image',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    expect(result).toEqual(productWithNewImage);
  });
});
