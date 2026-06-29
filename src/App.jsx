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
import { SUBSIDIARIES } from '@/lib/subsidiaries';
import phakathiLogoFullColor from '@/assets/branding/phakathi-holdings/phakathi-holdings-fullcolor.svg';
import portfolioCompaniesImage from '@/assets/branding/phakathi-holdings/images/our-portfolio-of-companies.png';

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

const AuthLanding = ({ onLogin, error }) => {
  const [form, setForm] = React.useState({ full_name: "", email: "", password: "" });
  const [localError, setLocalError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    if (!form.email.trim()) {
      setLocalError("Enter your work email to continue.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onLogin(form);
    } catch (err) {
      setLocalError(err.message || "Could not sign you in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
        <div className="bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur">
          <img
            src={phakathiLogoFullColor}
            alt="Phakathi Holdings"
            className="h-20 w-auto mb-8 opacity-95"
          />
          <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-4">Phakathi Flow</p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            One digital office for the Phakathi Holdings group.
          </h1>
          <p className="text-white/70 text-lg mb-8">
            Sign in or register, then choose the company you belong to so your dashboard, team views, meetings, and colour defaults are set up correctly.
          </p>
          {(error?.message || localError) && (
            <div className="mb-5 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              {localError || error.message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Full name"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/50"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Work email"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/50"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Password (optional for local dev)"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-white text-gray-950 px-6 py-3 font-semibold shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in / Register"}
            </button>
          </form>
        </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl text-gray-900">
        <div
          className="h-44 bg-cover bg-center"
          style={{ backgroundImage: `url(${portfolioCompaniesImage})` }}
          role="img"
          aria-label="Phakathi Holdings portfolio of companies"
        />
        <div className="p-6">
        <h2 className="font-bold text-xl mb-2">Supported subsidiaries</h2>
        <p className="text-sm text-gray-500 mb-4">You will select one after authentication.</p>
        <div className="space-y-2">
          {SUBSIDIARIES.map((subsidiary) => (
            <div key={subsidiary} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium">
              {subsidiary}
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  </div>
  );
};

const AuthenticatedApp = () => {
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, checkUserAuth } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    return <AuthLanding onLogin={navigateToLogin} error={authError} />;
  }

  if (!isAuthenticated) {
    return <AuthLanding onLogin={navigateToLogin} />;
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
