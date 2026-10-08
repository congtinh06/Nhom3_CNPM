import React from 'react';
import { FoodBeveragePage } from './FoodBeveragePage';
import { ProductCategory } from '../types';

interface ProductListPageProps {
  category?: ProductCategory;
}

export const ProductListPage: React.FC<ProductListPageProps> = () => {
  return <FoodBeveragePage />;
};

export default ProductListPage;
