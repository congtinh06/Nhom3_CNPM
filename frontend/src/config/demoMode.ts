/**
 * Cờ bật dữ liệu mẫu tĩnh (news fixtures, nearbyPois.json) cho giao diện du khách.
 *
 * - Chế độ test luôn bật để unit test không phụ thuộc mạng.
 * - Bản build thật tắt mặc định: API lỗi thì UI hiển thị lỗi, không âm thầm thay
 *   bằng dữ liệu mẫu.
 * - Chỉ bật khi build với VITE_USE_SAMPLE_DATA=true cho buổi demo offline.
 */
export const DEMO_FIXTURES_ENABLED =
  import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_SAMPLE_DATA === 'true';
