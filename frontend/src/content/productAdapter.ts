import { Product } from '../types';
import { defaultProducts } from './defaultProducts';

/**
 * DB/API chỉ lưu các trường cốt lõi (tên, mô tả, giá, ảnh, danh mục FOOD/DRINK).
 * Bù thêm metadata phục vụ UI (subCategory, badge, rating, prepTime...) từ catalog tĩnh
 * cũ khi khớp slug hoặc tên, để bộ lọc danh mục vẫn hoạt động.
 */
function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const defaultBySlug = new Map<string, Product>(defaultProducts.map((p) => [p.slug, p]));
const defaultByName = new Map<string, Product>(defaultProducts.map((p) => [normalize(p.name), p]));

export function enrichProduct(product: Product): Product {
  const meta = defaultBySlug.get(product.slug) || defaultByName.get(normalize(product.name));
  if (!meta) return product;
  return {
    ...product,
    subCategory: product.subCategory ?? meta.subCategory,
    oldPrice: product.oldPrice ?? meta.oldPrice,
    badge: product.badge ?? meta.badge,
    prepTime: product.prepTime ?? meta.prepTime,
    portion: product.portion ?? meta.portion,
    hasDrinkOptions: product.hasDrinkOptions ?? meta.hasDrinkOptions,
    rating: product.rating ?? meta.rating,
    reviewsCount: product.reviewsCount ?? meta.reviewsCount,
  };
}

export function enrichProducts(products: Product[]): Product[] {
  return products.map(enrichProduct);
}
