import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBSIDIARY_OPTIONS_WITH_ALL as SUBSIDIARIES } from "@/lib/subsidiaries";
import { Input } from "@/components/ui/input";
import { X, Search, Users, Briefcase, Building2, FolderKanban, ChevronDown, ChevronRight, BarChart2 } from "lucide-react";
import OrgAnalytics from "../components/orgchart/OrgAnalytics";


const DEPT_COLORS = {
  Management:  { bg: "bg-gray-900",   text: "text-white",       light: "bg-gray-100 text-gray-800" },
  Finance:     { bg: "bg-blue-700",   text: "text-white",       light: "bg-blue-50 text-blue-800" },
  HR:          { bg: "bg-purple-600", text: "text-white",       light: "bg-purple-50 text-purple-800" },
  IT:          { bg: "bg-cyan-600",   text: "text-white",       light: "bg-cyan-50 text-cyan-800" },
  Operations:  { bg: "bg-amber-600",  text: "text-white",       light: "bg-amber-50 text-amber-800" },
  Empoweryst:  { bg: "bg-green-700",  text: "text-white",       light: "bg-green-50 text-green-800" },
};

function Avatar({ name, imageUrl, size = "md", dept }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-sm", lg: "w-16 h-16 text-lg", xl: "w-20 h-20 text-2xl" };
  const col = DEPT_COLORS[dept] || DEPT_COLORS.Management;
  const initials = (name || "?").split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase();
  return imageUrl ? (
    <img src={imageUrl} alt={name} className={`${sizes[size]} rounded-full object-cover border-2 border-white shadow`} />
  ) : (
    <div className={`${sizes[size]} ${col.bg} ${col.text} rounded-full flex items-center justify-center font-bold shrink-0 shadow`}>{initials}</div>
  );
}

function EmployeeNode({ person, onClick, isSelected, depth = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: depth * 0.05 }}
      onClick={() => onClick(person)}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all hover:shadow-md border-2 ${
        isSelected ? "border-gray-900 shadow-lg bg-gray-50" : "border-transparent bg-white hover:border-gray-200"
      } w-28`}
    >
      <Avatar name={person.full_name} imageUrl={person.profile_image_url} size="md" dept={person.department} />
      <p className="text-xs font-semibold text-gray-900 text-center leading-tight line-clamp-2">{person.full_name || person.email}</p>
      <p className="text-xs text-gray-400 text-center leading-tight line-clamp-1">{person.job_title || person.department || ""}</p>
      {person.department && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DEPT_COLORS[person.department]?.light || "bg-gray-100 text-gray-600"}`}>
          {person.department}
        </span>
      )}
    </motion.button>
  );
}

// Tree node for hierarchy visualization
function OrgNode({ node, onClick, selectedId, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.reports && node.reports.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <EmployeeNode person={node} onClick={onClick} isSelected={selectedId === node.id} depth={depth} />
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center z-10 hover:bg-gray-900 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {hasChildren && !collapsed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center">
            {/* Vertical connector */}
            <div className="w-px h-6 bg-gray-300 mt-2" />
            {/* Horizontal bar */}
            <div className="flex items-start gap-4 md:gap-8 relative">
              {node.reports.length > 1 && (
                <div className="absolute top-0 left-14 right-14 h-px bg-gray-300" />
              )}
              {node.reports.map((child, i) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-px h-4 bg-gray-300" />
                  <OrgNode node={child} onClick={onClick} selectedId={selectedId} depth={depth + 1} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeProfile({ person, projects, tasks, allUsers, onClose }) {
  const reports = allUsers.filter(u => u.manager_email === person.email);
  const userProjects = projects.filter(p => (p.team_members || []).includes(person.email));
  const userTasks = tasks.filter(t => t.assigned_to === person.email && t.status !== "completed");
  const dept = DEPT_COLORS[person.department] || DEPT_COLORS.Management;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-100 z-40 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className={`p-6 ${dept.bg} ${dept.text}`}>
        <div className="flex justify-between items-start mb-4">
          <button onClick={onClose} className="opacity-70 hover:opacity-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
          <Avatar name={person.full_name} imageUrl={person.profile_image_url} size="xl" dept={person.department} />
          <h3 className="font-bold text-lg leading-tight">{person.full_name || person.email}</h3>
          <p className="text-sm opacity-80">{person.job_title || "No title set"}</p>
          <div className="flex gap-2 flex-wrap justify-center mt-1">
            {person.department && <Badge className="bg-white/20 text-white border-0 text-xs">{person.department}</Badge>}
            {person.subsidiary && <Badge className="bg-white/20 text-white border-0 text-xs">{person.subsidiary}</Badge>}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Bio */}
        {person.bio && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">About</p>
            <p className="text-sm text-gray-700 leading-relaxed">{person.bio}</p>
          </div>
        )}

        {/* Contact */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Contact</p>
          <p className="text-sm text-gray-700">{person.email}</p>
          {person.phone && <p className="text-sm text-gray-500 mt-0.5">{person.phone}</p>}
        </div>

        {/* Direct reports */}
        {reports.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Reports ({reports.length})
            </p>
            <div className="space-y-1.5">
              {reports.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Avatar name={r.full_name} imageUrl={r.profile_image_url} size="sm" dept={r.department} />
                  <div>
                    <p className="text-xs font-medium text-gray-800">{r.full_name || r.email}</p>
                    <p className="text-xs text-gray-400">{r.job_title || r.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active projects */}
        {userProjects.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5" /> Projects ({userProjects.length})
            </p>
            <div className="space-y-1.5">
              {userProjects.map(p => (
                <div key={p.id} className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-800">{p.name}</p>
                  <div className="flex gap-1.5 mt-1">
                    <Badge className={`text-xs border-0 ${p.status === "in_progress" ? "bg-blue-50 text-blue-700" : p.status === "completed" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.status?.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open tasks */}
        {userTasks.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Open Tasks ({userTasks.length})
            </p>
            <div className="space-y-1.5">
              {userTasks.slice(0, 5).map(t => (
                <div key={t.id} className="p-2 bg-gray-50 rounded-lg flex justify-between items-center gap-2">
                  <p className="text-xs text-gray-700 truncate">{t.title}</p>
                  <Badge className={`text-xs border-0 shrink-0 ${t.priority === "critical" ? "bg-red-50 text-red-700" : t.priority === "high" ? "bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                    {t.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function OrgChart() {
  const [selectedSubsidiary, setSelectedSubsidiary] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [viewMode, setViewMode] = useState("tree"); // tree | grid | analytics

  const { data: users = [], isLoading } = useQuery({ queryKey: ["org-users"], queryFn: () => base44.entities.User.list() });
  const { data: profiles = [] } = useQuery({ queryKey: ["org-profiles"], queryFn: () => base44.entities.UserProfile.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["org-projects"], queryFn: () => base44.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["org-tasks"], queryFn: () => base44.entities.Task.list() });

  // Merge user + profile data
  const enrichedUsers = useMemo(() => users.map(u => {
    const profile = profiles.find(p => p.user_email === u.email) || {};
    return { ...u, ...profile, user_email: u.email };
  }), [users, profiles]);

  const filteredUsers = useMemo(() => enrichedUsers.filter(u => {
    const subOk = selectedSubsidiary === "All" || u.subsidiary === selectedSubsidiary;
    const searchOk = !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase())
      || (u.email || "").toLowerCase().includes(search.toLowerCase())
      || (u.department || "").toLowerCase().includes(search.toLowerCase())
      || (u.job_title || "").toLowerCase().includes(search.toLowerCase());
    return subOk && searchOk;
  }), [enrichedUsers, selectedSubsidiary, search]);

  // Build hierarchy tree — group by role: admin = top, then by manager_email
  const treeRoots = useMemo(() => {
    const byId = {};
    filteredUsers.forEach(u => { byId[u.email] = { ...u, reports: [] }; });
    const roots = [];
    filteredUsers.forEach(u => {
      if (u.manager_email && byId[u.manager_email]) {
        byId[u.manager_email].reports.push(byId[u.email]);
      } else {
        roots.push(byId[u.email]);
      }
    });
    // Sort roots: admins first
    return roots.sort((a, b) => (a.role === "admin" ? -1 : 1));
  }, [filteredUsers]);

  // Group for grid view
  const byDept = useMemo(() => {
    const map = {};
    filteredUsers.forEach(u => {
      const d = u.department || "Other";
      if (!map[d]) map[d] = [];
      map[d].push(u);
    });
    return map;
  }, [filteredUsers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-gray-700" />
            <h1 className="text-xl font-bold text-gray-900">Organisation Chart</h1>
            <Badge variant="outline" className="text-xs">{filteredUsers.length} people</Badge>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..." className="pl-8 h-8 text-xs w-44 bg-white" />
            </div>
            <Select value={selectedSubsidiary} onValueChange={setSelectedSubsidiary}>
              <SelectTrigger className="h-8 text-xs w-44 bg-white">
                <SelectValue placeholder="All Subsidiaries" />
              </SelectTrigger>
              <SelectContent>
                {SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode("tree")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "tree" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Tree</button>
              <button onClick={() => setViewMode("grid")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "grid" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Grid</button>
              <button onClick={() => setViewMode("analytics")} className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "analytics" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                <BarChart2 className="w-3 h-3" />Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>No employees found.</p>
          </div>
        ) : viewMode === "analytics" ? (
          <OrgAnalytics users={users} profiles={profiles} />
        ) : viewMode === "tree" ? (
          /* TREE VIEW */
          <div className="overflow-x-auto pb-8">
            <div className="flex gap-16 justify-center min-w-max px-8">
              {treeRoots.map(root => (
                <OrgNode
                  key={root.id}
                  node={root}
                  onClick={setSelectedPerson}
                  selectedId={selectedPerson?.id}
                />
              ))}
            </div>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="max-w-7xl mx-auto space-y-8">
            {Object.entries(byDept).sort().map(([dept, people]) => {
              const col = DEPT_COLORS[dept] || DEPT_COLORS.Management;
              return (
                <div key={dept}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-3 h-3 rounded-full ${col.bg}`} />
                    <h2 className="font-bold text-gray-800">{dept}</h2>
                    <Badge variant="outline" className="text-xs">{people.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {people.map(person => (
                      <EmployeeNode
                        key={person.id}
                        person={person}
                        onClick={setSelectedPerson}
                        isSelected={selectedPerson?.id === person.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Employee profile panel */}
      <AnimatePresence>
        {selectedPerson && (
          <EmployeeProfile
            person={selectedPerson}
            projects={projects}
            tasks={tasks}
            allUsers={enrichedUsers}
            onClose={() => setSelectedPerson(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}