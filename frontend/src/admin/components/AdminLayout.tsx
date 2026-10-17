import React, { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import type { AdminDensity } from '../types';

const DENSITY_STORAGE_KEY = 'echora_admin_density';

function readStoredDensity(): AdminDensity {
  try {
    return localStorage.getItem(DENSITY_STORAGE_KEY) === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [density, setDensity] = useState<AdminDensity>(readStoredDensity);

  const handleToggleDensity = useCallback(() => {
    setDensity((prev) => {
      const next: AdminDensity = prev === 'compact' ? 'comfortable' : 'compact';
      try {
        localStorage.setItem(DENSITY_STORAGE_KEY, next);
      } catch {
        // Bỏ qua khi trình duyệt chặn lưu trữ
      }
      return next;
    });
  }, []);

  return (
    <div
      className={`adm-layout ${density === 'compact' ? 'adm-density-compact' : ''}`.trim()}
    >
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="adm-main-container">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          density={density}
          onToggleDensity={handleToggleDensity}
        />
        <main className="adm-content" id="adm-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
