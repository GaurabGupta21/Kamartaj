import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Components & Layout
import DashboardLayout from './components/DashboardLayout';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import Menu from './pages/Menu';
import MyBookings from './pages/MyBookings';

// Mess Worker Pages
import WorkerDashboard from './pages/WorkerDashboard';
import MenuManagement from './pages/MenuManagement';
import QRScanner from './pages/QRScanner';
import FoodWaste from './pages/FoodWaste';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Routes (protected: student) */}
        <Route element={<DashboardLayout allowedRoles={['student']} pageTitle="Student Portal" />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/menu" element={<Menu />} />
          <Route path="/student/bookings" element={<MyBookings />} />
        </Route>

        {/* Mess Worker Routes (protected: staff, admin) */}
        <Route element={<DashboardLayout allowedRoles={['staff', 'admin']} pageTitle="Mess Operations" />}>
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/worker/menus" element={<MenuManagement />} />
          <Route path="/worker/scan" element={<QRScanner />} />
          <Route path="/worker/waste" element={<FoodWaste />} />
        </Route>

        {/* Admin Routes (protected: admin) */}
        <Route element={<DashboardLayout allowedRoles={['admin']} pageTitle="Admin Intelligence" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/capacity" element={<AdminDashboard />} />
          <Route path="/admin/waste-reports" element={<AdminDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
