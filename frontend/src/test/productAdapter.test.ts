import { describe, expect, it } from 'vitest';
import { resolveOrderItemImage } from '../content/productAdapter';

describe('resolveOrderItemImage', () => {
  it('ưu tiên khớp tên chính xác trước id', () => {
    expect(
      resolveOrderItemImage({ productId: 25, productName: 'Khô bò Sài Gòn' })
    ).toBe('/images/souvenirs/kho-bo.jpg');
  });

  it('dùng trực tiếp imagePath khi item đã có ảnh', () => {
    expect(
      resolveOrderItemImage({
        productId: 25,
        productName: 'Khô bò Sài Gòn',
        imagePath: '/images/souvenirs/custom.jpg',
      })
    ).toBe('/images/souvenirs/custom.jpg');
  });

  it('bỏ qua ảnh placeholder và quay về khớp tên', () => {
    expect(
      resolveOrderItemImage({
        productName: 'Mứt trái cây Sài Gòn',
        imagePath: '/images/placeholder.png',
      })
    ).toBe('/images/souvenirs/mut-trai-cay.jpg');
  });

  it('dùng id khi không có tên khớp', () => {
    expect(resolveOrderItemImage({ productId: 25 })).toBe(
      '/images/souvenirs/tranh-dinh-doc-lap.jpg'
    );
  });
});
