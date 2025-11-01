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
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const defaultRedirect = isAdmin ? '/admin/dashboard' : '/notices';

  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to={defaultRedirect} replace />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={defaultRedirect} replace />} />
      <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to={defaultRedirect} replace />} />
      
      <Route element={<AppLayout />}>
        {isAdmin ? (
          <>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/visitors" element={<VisitorsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </>
        ) : (
          /* Redirect non-admins away from admin pages */
          <>
            <Route path="/admin/dashboard" element={<Navigate to="/notices" replace />} />
            <Route path="/students" element={<Navigate to="/notices" replace />} />
            <Route path="/rooms" element={<Navigate to="/notices" replace />} />
            <Route path="/visitors" element={<Navigate to="/notices" replace />} />
            <Route path="/reports" element={<Navigate to="/notices" replace />} />
          </>
        )}
        <Route path="/fees" element={<FeesPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/notices"element={<NoticesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <Router>
        <AppContent />
      </Router>
      <Toaster />
    </>
  );
}

export default App;
