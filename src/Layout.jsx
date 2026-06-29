import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, FolderKanban, LogOut, Menu, User as UserIcon, Settings as SettingsIcon, Sparkles, CalendarOff, FileText, ClipboardList, Megaphone, BarChart2, Columns, Receipt, CalendarClock, Star, Wallet, Monitor, UserCheck, MessageCircle, Mic, CalendarDays, Calculator, GitBranch, Plug, Headphones, FolderOpen, Bell, Building2, TrendingUp, Heart, Timer, GanttChartSquare, Sun, Layers, BarChart, Map, Rss, Users, Link2, Briefcase, Target, ChevronDown } from "lucide-react";
import NotificationBell from "./components/notifications/NotificationBell";
import PushNotificationManager from "./components/notifications/PushNotificationManager";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import phakathiLogoBlack from "@/assets/branding/phakathi-holdings/phakathi-holdings-black.svg";

const navigationItems = [
  // HOME
  { title: "Dashboard",         url: "/Dashboard",          icon: LayoutDashboard, group: "home" },
  { title: "My Day",            url: "/MyDay",              icon: Sun,             group: "home" },
  { title: "Notifications",     url: "/Notifications",      icon: Bell,            group: "home" },
  { title: "Calendar",          url: "/Calendar",           icon: CalendarDays,    group: "home" },
  // WORK
  { title: "Projects",          url: "/Projects",           icon: FolderKanban,    group: "work" },
  { title: "Kanban",            url: "/Kanban",             icon: Columns,         group: "work" },
  { title: "Portfolios",        url: "/Portfolios",         icon: Layers,          group: "work" },
  { title: "Workload Planner",  url: "/WorkloadPlanner",    icon: BarChart,        group: "work" },
  { title: "Roadmaps",          url: "/Roadmaps",           icon: Map,             group: "work" },
  { title: "Gantt Timeline",    url: "/GanttChart",         icon: GanttChartSquare,group: "work" },
  { title: "Time Tracking",     url: "/TimeTracking",       icon: Timer,           group: "work" },
  { title: "Goals & OKRs",      url: "/Analytics",          icon: Target,          group: "work" },
  // COLLABORATION
  { title: "Messaging",         url: "/Messaging",          icon: MessageCircle,   group: "collaboration" },
  { title: "Company Feed",      url: "/CompanyFeed",        icon: Rss,             group: "collaboration" },
  { title: "Meeting Studio",    url: "/MeetingStudio",      icon: Mic,             group: "collaboration" },
  { title: "AI Assistant",      url: "/AIAssistant",        icon: Sparkles,        group: "collaboration" },
  // PEOPLE
  { title: "Org Chart",         url: "/OrgChart",           icon: GitBranch,       group: "people" },
  { title: "Performance",       url: "/PerformanceReviews", icon: Star,            group: "people" },
  { title: "Onboarding",        url: "/Onboarding",         icon: UserCheck,       group: "people" },
  { title: "Team Attendance",   url: "/TeamAttendance",     icon: CalendarDays,    group: "people" },
  // OPERATIONS
  { title: "Support Tickets",   url: "/Tickets",            icon: Headphones,      group: "operations" },
  { title: "Assets",            url: "/Assets",             icon: Monitor,         group: "operations" },
  { title: "Document Vault",    url: "/DocumentRepository", icon: FolderOpen,      group: "operations" },
  { title: "Expenses",          url: "/Expenses",           icon: Receipt,         group: "operations" },
  { title: "Room Booking",      url: "/ResourceCalendar",   icon: CalendarClock,   group: "operations" },
  // COMPANY
  { title: "Noticeboard",       url: "/Noticeboard",        icon: Megaphone,       group: "company" },
  { title: "Culture Hub",       url: "/CultureHub",         icon: Heart,           group: "company" },
  { title: "HR Hub",            url: "/HRHub",              icon: Building2,       group: "company" },
  { title: "Meeting Notes",     url: "/MeetingNotes",       icon: ClipboardList,   group: "company" },
  // INSIGHTS
  { title: "Executive Dash",    url: "/ExecutiveDashboard", icon: TrendingUp,      group: "insights" },
  { title: "Payroll",           url: "/PayrollDashboard",   icon: Wallet,          group: "insights" },
  { title: "Auto Payroll",      url: "/AutoPayroll",        icon: Calculator,      group: "insights" },
  { title: "Sage Integration",  url: "/SageIntegration",    icon: Link2,           group: "insights" },
  { title: "Integrations",      url: "/Integrations",       icon: Plug,            group: "insights" },
  // ACCOUNT
  { title: "Profile",           url: "/Profile",            icon: UserIcon,        group: "account" },
  { title: "Settings",          url: "/Settings",           icon: SettingsIcon,    group: "account" },
];

const sidebarGroups = [
  { key: 'home',          label: 'Home',          collapsible: false },
  { key: 'work',          label: 'Work',          collapsible: true },
  { key: 'collaboration', label: 'Collaboration', collapsible: true },
  { key: 'people',        label: 'People',        collapsible: true },
  { key: 'operations',    label: 'Operations',    collapsible: true },
  { key: 'company',       label: 'Company',       collapsible: true },
  { key: 'insights',      label: 'Insights',      collapsible: true },
  { key: 'account',       label: 'Account',       collapsible: false },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const orgName = user?.branding?.orgName || "Phakathi Flow";
  const orgTagline = user?.branding?.orgTagline || "Employee Experience & Intelligence";

  const handleLogout = () => {
    api.auth.logout();
  };

  const renderMenuItems = (key) => (
    <SidebarMenu>
      {navigationItems.filter(i => i.group === key).map((item) => {
        const isActive = location.pathname === item.url || (item.url === '/Dashboard' && location.pathname === '/');
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild className={`rounded-lg mb-0.5 transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 font-semibold shadow-sm border border-gray-200' : 'hover:bg-gray-50'}`}>
              <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                <span className="text-sm">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <style>{`
        :root {
          --ph-primary: #C0C0C0;
          --ph-primary-dark: #808080;
          --ph-secondary: #000000;
          --ph-accent: #404040;
          --ph-success: #10B981;
          --ph-warning: #F59E0B;
          --ph-error: #EF4444;
          --ph-bg: #FFFFFF;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-white">
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <Link to="/Dashboard" className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-gray-100 shadow-sm flex-shrink-0 overflow-hidden">
                  <img src={phakathiLogoBlack} alt="Phakathi Holdings" className="w-11 h-11 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-gray-900 truncate">{orgName}</h2>
                  <p className="text-xs text-gray-500 truncate">{orgTagline}</p>
                </div>
              </Link>
              <SidebarTrigger className="hidden md:inline-flex h-9 w-9 rounded-lg border border-gray-100 bg-white shadow-sm hover:bg-gray-50 flex-shrink-0" />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3 overflow-y-auto">
            {sidebarGroups.map(({ key, label, collapsible }) => {
              const groupItems = navigationItems.filter(i => i.group === key);
              const hasActiveItem = groupItems.some(item => location.pathname === item.url || (item.url === '/Dashboard' && location.pathname === '/'));

              return (
                <SidebarGroup key={key}>
                  <SidebarGroupContent>
                    {collapsible ? (
                      <Collapsible defaultOpen={hasActiveItem} className="group/collapsible">
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                          <span>{label}</span>
                          <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-1">
                          {renderMenuItems(key)}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-3 pb-1 tracking-wider">{label}</p>
                        {renderMenuItems(key)}
                      </>
                    )}
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            {user && (
              <div className="space-y-3">
                <div className="flex justify-end mb-1">
                  <NotificationBell user={user} />
                </div>
                <Link to={createPageUrl("Profile")}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    {user.profile_image_url ? (
                      <img 
                        src={user.profile_image_url} 
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          {!sidebarOpen && (
            <div className="hidden md:block fixed top-4 left-4 z-30">
              <SidebarTrigger className="h-9 w-9 rounded-xl bg-white border border-gray-200 shadow-md hover:bg-gray-50" />
            </div>
          )}
          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <img src={phakathiLogoBlack} alt="Phakathi Holdings" className="h-8 w-auto" />
              <h1 className="text-lg font-bold text-gray-900">Phakathi Holdings</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-gray-50">
            {children}
          </div>
        </main>
      </div>
      <PushNotificationManager user={user} />
    </SidebarProvider>
  );
}
