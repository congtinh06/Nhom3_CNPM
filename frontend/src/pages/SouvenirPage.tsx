import React from 'react';
import { FoodBeveragePage } from './FoodBeveragePage';

/**
 * Trang quà lưu niệm đã được gộp vào trang "Ẩm thực" (nay đổi nội dung thành quà lưu niệm).
 * Component này chỉ còn là lớp bọc mỏng, không còn tab riêng.
 * Các route cũ `/qua-luu-niem` được chuyển hướng sang `/am-thuc`.
 */
export const SouvenirPage: React.FC = () => {
  return <FoodBeveragePage />;
};

export default SouvenirPage;
