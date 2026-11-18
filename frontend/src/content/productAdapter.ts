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

const defaultById = new Map<number, Product>(defaultProducts.map((p) => [p.id, p]));
const defaultBySlug = new Map<string, Product>(defaultProducts.map((p) => [p.slug, p]));
const defaultByName = new Map<string, Product>(defaultProducts.map((p) => [normalize(p.name), p]));

/**
 * Tìm hình ảnh đại diện cho món trong giỏ hàng/đơn hàng từ id/productId, name/productName hoặc imagePath/imageUrl sẵn có.
 */
export function resolveOrderItemImage(item?: {
  id?: number;
  productId?: number;
  name?: string;
  productName?: string;
  imagePath?: string;
  imageUrl?: string;
}): string | undefined {
  if (!item) return undefined;
  const directPath = item.imagePath || item.imageUrl;
  if (directPath && !directPath.includes('placeholder')) {
    return directPath;
  }
  const name = item.productName || item.name;
  if (name) {
    const norm = normalize(name);
    const prod = defaultByName.get(norm);
    if (prod?.imagePath && !prod.imagePath.includes('placeholder')) {
      return prod.imagePath;
    }
  }
  const id = item.productId ?? item.id;
  if (id) {
    const prod = defaultById.get(id);
    if (prod?.imagePath && !prod.imagePath.includes('placeholder')) {
      return prod.imagePath;
    }
  }
  if (name) {
    const norm = normalize(name);
    const partial = defaultProducts.find((p) => {
      const pNorm = normalize(p.name);
      return pNorm === norm || norm.includes(pNorm) || pNorm.includes(norm);
    });
    if (partial?.imagePath && !partial.imagePath.includes('placeholder')) {
      return partial.imagePath;
    }
  }
  return undefined;
}

export function enrichProduct(product: Product): Product {
  const meta = defaultBySlug.get(product.slug) || defaultByName.get(normalize(product.name));
  if (!meta) return product;
  return {
    ...product,
    shortDescription: product.shortDescription || meta.shortDescription,
    description: product.description || meta.description,
    imagePath:
      product.imagePath && !product.imagePath.includes('placeholder')
        ? product.imagePath
        : (meta.imagePath || product.imagePath),
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
