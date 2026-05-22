import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, FolderKanban, LogOut, Menu, User as UserIcon, Settings as SettingsIcon, Sparkles, CalendarOff, FileText, ClipboardList, Megaphone, BarChart2, Columns, Receipt, CalendarClock, Star, Wallet, Monitor, UserCheck, MessageCircle, Mic, CalendarDays, Calculator, GitBranch, Plug, Headphones, FolderOpen } from "lucide-react";
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
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Dashboard",     url: "/Dashboard",     icon: LayoutDashboard, group: "main" },
  { title: "Projects",      url: "/Projects",      icon: FolderKanban,    group: "main" },
  { title: "AI Assistant",  url: "/AIAssistant",   icon: Sparkles,        group: "main" },
  { title: "Team Calendar", url: "/Calendar",      icon: CalendarDays,    group: "office" },
  { title: "Analytics",     url: "/Analytics",     icon: BarChart2,       group: "office" },
  { title: "Noticeboard",   url: "/Noticeboard",   icon: Megaphone,       group: "office" },
  { title: "Leave",         url: "/Leave",         icon: CalendarOff,     group: "office" },
  { title: "Payslips",      url: "/Payslips",      icon: FileText,        group: "office" },
  { title: "Meeting Notes", url: "/MeetingNotes",  icon: ClipboardList,   group: "office" },
  { title: "Kanban Board",  url: "/Kanban",        icon: Columns,         group: "office" },
  { title: "Expenses",      url: "/Expenses",      icon: Receipt,         group: "office" },
  { title: "Room Booking",   url: "/ResourceCalendar", icon: CalendarClock,  group: "office" },
  { title: "Performance",   url: "/PerformanceReviews", icon: Star,          group: "office" },
  { title: "Payroll",       url: "/PayrollDashboard",  icon: Wallet,         group: "office" },
  { title: "Assets",        url: "/Assets",            icon: Monitor,        group: "office" },
  { title: "Onboarding",   url: "/Onboarding",        icon: UserCheck,      group: "office" },
  { title: "Messaging",    url: "/Messaging",          icon: MessageCircle,  group: "office" },
  { title: "Meeting Studio", url: "/MeetingStudio",   icon: Mic,            group: "office" },
  { title: "Auto Payroll",  url: "/AutoPayroll",      icon: Calculator,     group: "office" },
  { title: "Org Chart",     url: "/OrgChart",         icon: GitBranch,      group: "office" },
  { title: "Integrations",  url: "/Integrations",     icon: Plug,           group: "office" },
  { title: "Support Tickets",  url: "/Tickets",            icon: Headphones,  group: "office" },
  { title: "Documents",        url: "/DocumentRepository", icon: FolderOpen,  group: "office" },
  { title: "Team Attendance",  url: "/TeamAttendance",     icon: CalendarDays, group: "office" },
  { title: "Profile",       url: "/Profile",       icon: UserIcon,        group: "account" },
  { title: "Settings",      url: "/Settings",      icon: SettingsIcon,    group: "account" },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const orgName = user?.branding?.orgName || "Phakathi Holdings";
  const orgTagline = user?.branding?.orgTagline || "Digital Office";
  const orgInitials = orgName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <SidebarProvider>
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
          <SidebarHeader className="border-b border-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">{orgInitials}</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{orgName}</h2>
                <p className="text-xs text-gray-500">{orgTagline}</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3 overflow-y-auto">
            {/* Main */}
            <SidebarGroup>
              <SidebarGroupContent>
                <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-2 pb-1 tracking-wider">Main</p>
                <SidebarMenu>
                  {navigationItems.filter(i => i.group === 'main').map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className={`rounded-lg mb-1 transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 font-semibold shadow-sm border border-gray-200' : 'hover:bg-gray-50'}`}>
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {/* Digital Office */}
            <SidebarGroup>
              <SidebarGroupContent>
                <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-3 pb-1 tracking-wider">Digital Office</p>
                <SidebarMenu>
                  {navigationItems.filter(i => i.group === 'office').map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className={`rounded-lg mb-1 transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 font-semibold shadow-sm border border-gray-200' : 'hover:bg-gray-50'}`}>
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {/* Account */}
            <SidebarGroup>
              <SidebarGroupContent>
                <p className="text-xs font-semibold text-gray-400 uppercase px-3 pt-3 pb-1 tracking-wider">Account</p>
                <SidebarMenu>
                  {navigationItems.filter(i => i.group === 'account').map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className={`rounded-lg mb-1 transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 font-semibold shadow-sm border border-gray-200' : 'hover:bg-gray-50'}`}>
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            {user && (
              <div className="space-y-3">
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
          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-lg font-bold text-gray-900">Phakathi Holdings</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-gray-50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}