import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="adm-layout">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="adm-main-container">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="adm-content" id="adm-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
