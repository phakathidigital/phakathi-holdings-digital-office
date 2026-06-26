import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './Layout.jsx';
import BrandingLoader from './lib/BrandingLoader';
import CompleteProfileSetup from '@/components/profile/CompleteProfileSetup';

// Pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AIAssistant from './pages/AIAssistant';
import Analytics from './pages/Analytics';
import Leave from './pages/Leave';
import Payslips from './pages/Payslips';
import MeetingNotes from './pages/MeetingNotes';
import Noticeboard from './pages/Noticeboard';
import Kanban from './pages/Kanban';
import ResourceCalendar from './pages/ResourceCalendar';
import PerformanceReviews from './pages/PerformanceReviews';
import PayrollDashboard from './pages/PayrollDashboard';
import Expenses from './pages/Expenses';
import Assets from './pages/Assets';
import Onboarding from './pages/Onboarding';
import Messaging from './pages/Messaging';
import MeetingStudio from './pages/MeetingStudio';
import Calendar from './pages/Calendar';
import AutoPayroll from './pages/AutoPayroll';
import OrgChart from './pages/OrgChart';
import Integrations from './pages/Integrations';
import Tickets from './pages/Tickets';
import DocumentRepository from './pages/DocumentRepository';
import TeamAttendance from './pages/TeamAttendance';
import Notifications from './pages/Notifications';
import HRHub from './pages/HRHub';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import CultureHub from './pages/CultureHub';
import TimeTracking from './pages/TimeTracking';
import GanttChart from './pages/GanttChart';
import MyDay from './pages/MyDay';
import Portfolios from './pages/Portfolios';
import WorkloadPlanner from './pages/WorkloadPlanner';
import Roadmaps from './pages/Roadmaps';
import CompanyFeed from './pages/CompanyFeed';
import SageIntegration from './pages/SageIntegration';

setupIframeMessaging();

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, checkUserAuth } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  if (user && !user.subsidiary) {
    return <CompleteProfileSetup user={user} onCompleted={checkUserAuth} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Projects" element={<Projects />} />
        <Route path="/ProjectDetails" element={<ProjectDetails />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/AIAssistant" element={<AIAssistant />} />
        <Route path="/Analytics" element={<Analytics />} />
        <Route path="/Leave" element={<Leave />} />
        <Route path="/Payslips" element={<Payslips />} />
        <Route path="/MeetingNotes" element={<MeetingNotes />} />
        <Route path="/Noticeboard" element={<Noticeboard />} />
        <Route path="/Kanban" element={<Kanban />} />
        <Route path="/ResourceCalendar" element={<ResourceCalendar />} />
        <Route path="/PerformanceReviews" element={<PerformanceReviews />} />
        <Route path="/PayrollDashboard" element={<PayrollDashboard />} />
        <Route path="/Expenses" element={<Expenses />} />
        <Route path="/Assets" element={<Assets />} />
        <Route path="/Onboarding" element={<Onboarding />} />
        <Route path="/Messaging" element={<Messaging />} />
        <Route path="/MeetingStudio" element={<MeetingStudio />} />
        <Route path="/Calendar" element={<Calendar />} />
        <Route path="/AutoPayroll" element={<AutoPayroll />} />
        <Route path="/OrgChart" element={<OrgChart />} />
        <Route path="/Integrations" element={<Integrations />} />
        <Route path="/Tickets" element={<Tickets />} />
        <Route path="/DocumentRepository" element={<DocumentRepository />} />
        <Route path="/TeamAttendance" element={<TeamAttendance />} />
        <Route path="/Notifications" element={<Notifications />} />
        <Route path="/HRHub" element={<HRHub />} />
        <Route path="/ExecutiveDashboard" element={<ExecutiveDashboard />} />
        <Route path="/CultureHub" element={<CultureHub />} />
        <Route path="/TimeTracking" element={<TimeTracking />} />
        <Route path="/GanttChart" element={<GanttChart />} />
        <Route path="/MyDay" element={<MyDay />} />
        <Route path="/Portfolios" element={<Portfolios />} />
        <Route path="/WorkloadPlanner" element={<WorkloadPlanner />} />
        <Route path="/Roadmaps" element={<Roadmaps />} />
        <Route path="/CompanyFeed" element={<CompanyFeed />} />
        <Route path="/SageIntegration" element={<SageIntegration />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <BrandingLoader />
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;