export const removeDiacritics = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

export const matchesSearch = (text: string, query: string): boolean => {
  if (!query.trim()) return true;
  const normalizedText = removeDiacritics(text);
  const normalizedQuery = removeDiacritics(query.trim());
  return normalizedText.includes(normalizedQuery);
};
