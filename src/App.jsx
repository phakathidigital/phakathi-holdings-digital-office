import './App.css'
import React from 'react'
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

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Projects = React.lazy(() => import('./pages/Projects'));
const ProjectDetails = React.lazy(() => import('./pages/ProjectDetails'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AIAssistant = React.lazy(() => import('./pages/AIAssistant'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Leave = React.lazy(() => import('./pages/Leave'));
const Payslips = React.lazy(() => import('./pages/Payslips'));
const MeetingNotes = React.lazy(() => import('./pages/MeetingNotes'));
const Noticeboard = React.lazy(() => import('./pages/Noticeboard'));
const Kanban = React.lazy(() => import('./pages/Kanban'));
const ResourceCalendar = React.lazy(() => import('./pages/ResourceCalendar'));
const PerformanceReviews = React.lazy(() => import('./pages/PerformanceReviews'));
const PayrollDashboard = React.lazy(() => import('./pages/PayrollDashboard'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Assets = React.lazy(() => import('./pages/Assets'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Messaging = React.lazy(() => import('./pages/Messaging'));
const MeetingStudio = React.lazy(() => import('./pages/MeetingStudio'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const AutoPayroll = React.lazy(() => import('./pages/AutoPayroll'));
const OrgChart = React.lazy(() => import('./pages/OrgChart'));
const Integrations = React.lazy(() => import('./pages/Integrations'));
const Tickets = React.lazy(() => import('./pages/Tickets'));
const DocumentRepository = React.lazy(() => import('./pages/DocumentRepository'));
const TeamAttendance = React.lazy(() => import('./pages/TeamAttendance'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const HRHub = React.lazy(() => import('./pages/HRHub'));
const ExecutiveDashboard = React.lazy(() => import('./pages/ExecutiveDashboard'));
const CultureHub = React.lazy(() => import('./pages/CultureHub'));
const TimeTracking = React.lazy(() => import('./pages/TimeTracking'));
const GanttChart = React.lazy(() => import('./pages/GanttChart'));
const MyDay = React.lazy(() => import('./pages/MyDay'));
const Portfolios = React.lazy(() => import('./pages/Portfolios'));
const WorkloadPlanner = React.lazy(() => import('./pages/WorkloadPlanner'));
const Roadmaps = React.lazy(() => import('./pages/Roadmaps'));
const CompanyFeed = React.lazy(() => import('./pages/CompanyFeed'));
const SageIntegration = React.lazy(() => import('./pages/SageIntegration'));
const GoalsOKRs = React.lazy(() => import('./pages/GoalsOKRs'));
const Account360 = React.lazy(() => import('./pages/Account360'));
const ClientIntelligence = React.lazy(() => import('./pages/ClientIntelligence'));
const BusinessDevelopment = React.lazy(() => import('./pages/BusinessDevelopment'));
const SalesPipeline = React.lazy(() => import('./pages/SalesPipeline'));
const Proposals = React.lazy(() => import('./pages/Proposals'));
const Deals = React.lazy(() => import('./pages/Deals'));
const PlatformReadiness = React.lazy(() => import('./pages/PlatformReadiness'));

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
    if (!form.password || form.password.length < 8) {
      setLocalError("Enter a password of at least 8 characters.");
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
              placeholder="Password"
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
      <React.Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading workspace…</div>}>
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
          <Route path="/GoalsOKRs" element={<GoalsOKRs />} />
          <Route path="/Account360" element={<Account360 />} />
          <Route path="/ClientIntelligence" element={<ClientIntelligence />} />
          <Route path="/BusinessDevelopment" element={<BusinessDevelopment />} />
          <Route path="/SalesPipeline" element={<SalesPipeline />} />
          <Route path="/Proposals" element={<Proposals />} />
          <Route path="/Deals" element={<Deals />} />
          <Route path="/PlatformReadiness" element={<PlatformReadiness />} />
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
      </React.Suspense>
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
