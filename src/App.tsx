import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import { Toaster } from "@/components/ui/sonner"
import AppLayout from './components/layout/AppLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/auth/SignUpPage';
import StudentsPage from './pages/students/StudentsPage';
import RoomsPage from './pages/rooms/RoomsPage';
import FeesPage from './pages/fees/FeesPage';
import VisitorsPage from './pages/visitors/VisitorsPage';
import ComplaintsPage from './pages/complaints/ComplaintsPage';
import NoticesPage from './pages/notices/NoticesPage';
import ReportsPage from './pages/reports/ReportsPage';
import ProfilePage from './pages/profile/ProfilePage';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route element={<AppLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/visitors" element={<VisitorsPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/notices"element={<NoticesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
