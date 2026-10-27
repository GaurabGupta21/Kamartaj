import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { getStoredToken, getStoredUser } from '../api/api';

function DashboardLayout({ allowedRoles = [], pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = getStoredToken();
  const user = getStoredUser();

  // If not logged in, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/worker" replace />;
    return <Navigate to="/student" replace />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main">
        <Navbar
          isDashboard={true}
          title={pageTitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
