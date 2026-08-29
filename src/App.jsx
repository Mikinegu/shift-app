import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Landing from '@/pages/Landing';
import Onboarding from '@/pages/Onboarding';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AdminLogin from '@/pages/AdminLogin';
import StudentDashboard from '@/pages/StudentDashboard';
import CompanyDashboard from '@/pages/CompanyDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import JobSearch from '@/pages/JobSearch';
import JobDetail from '@/pages/JobDetail';
import JobForm from '@/pages/JobForm';
import CompanyJobs from '@/pages/CompanyJobs';
import StudentApplications from '@/pages/StudentApplications';
import CompanyApplications from '@/pages/CompanyApplications';
import SavedJobs from '@/pages/SavedJobs';
import Messages from '@/pages/Messages';
import Interviews from '@/pages/Interviews';
import InterviewRoom from '@/pages/InterviewRoom';
import Notifications from '@/pages/Notifications';
import Assistant from '@/pages/Assistant';
import StudentProfilePage from '@/pages/StudentProfilePage';
import CompanyProfilePage from '@/pages/CompanyProfilePage';
import AdminVerification from '@/pages/AdminVerification';
import AdminJobs from '@/pages/AdminJobs';
import AdminReports from '@/pages/AdminReports';
import AdminAudit from '@/pages/AdminAudit';
import AdminNotifications from '@/pages/AdminNotifications';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Dedicated Admin Portal Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Student & Company User Routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<AppLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/applications" element={<StudentApplications />} />
          <Route path="/student/saved" element={<SavedJobs />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/jobs" element={<JobSearch />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/company/jobs" element={<CompanyJobs />} />
          <Route path="/company/jobs/new" element={<JobForm />} />
          <Route path="/company/jobs/:id/edit" element={<JobForm />} />
          <Route path="/company/applications" element={<CompanyApplications />} />
          <Route path="/company/profile" element={<CompanyProfilePage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/interviews/:id" element={<InterviewRoom />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/assistant" element={<Assistant />} />
        </Route>
      </Route>

      {/* Strictly Protected Admin Only Routes */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/verification" element={<AdminVerification />} />
          <Route path="/admin/jobs" element={<AdminJobs />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
