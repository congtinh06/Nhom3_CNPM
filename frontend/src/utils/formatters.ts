export const formatPrice = (amount: number): string => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0đ';
  }
  return amount.toLocaleString('vi-VN') + 'đ';
};

export const formatPriceWithSpace = (amount: number): string => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0 đ';
  }
  return amount.toLocaleString('vi-VN') + ' đ';
};
