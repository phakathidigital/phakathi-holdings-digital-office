import React, { useState, useMemo } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FolderOpen, Upload, Search, AlertCircle, CheckCircle, XCircle, X,
  LayoutGrid, List, Tag, Filter, SlidersHorizontal
} from "lucide-react";
import { format } from "date-fns";
import FolderTree from "../components/vault/FolderTree";
import FolderDialog from "../components/vault/FolderDialog";
import UploadDocDialog from "../components/vault/UploadDocDialog";
import ShareDocDialog from "../components/vault/ShareDocDialog";
import DocumentCard from "../components/vault/DocumentCard";
import { hasGroupOverviewAccess, accessScopeLabel } from "@/lib/accessControl";

const CATEGORIES = ["Contract","Tax Form","Policy Handbook","NDA","Payslip","Certificate","ID Document","Template","Project Spec","Report","Other"];

const STATUS_CONFIG = {
  pending_review: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  approved:       { label: "Approved", color: "bg-green-100 text-green-700" },
  rejected:       { label: "Rejected", color: "bg-red-100 text-red-700" },
  archived:       { label: "Archived", color: "bg-gray-100 text-gray-500" },
};

function canAccess(doc, user) {
  if (!user) return false;
  if (hasGroupOverviewAccess(user)) return true;
  if (doc.owner_email === user.email) return true;
  if (doc.shared_with?.includes(user.email)) return true;
  if (doc.access_level === "public") return true;
  if (doc.access_level === "employee_only") return true;
  if (doc.access_level === "hr_only") return hasGroupOverviewAccess(user);
  if (doc.access_level === "management_only") return hasGroupOverviewAccess(user);
  return false;
}

function RejectDialog({ doc, open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Reject Document</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Rejecting: <strong>{doc?.title}</strong></p>
          <div className="space-y-1.5">
            <Label>Rejection Reason *</Label>
            <textarea className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300" rows={3}
              value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this being rejected?" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => { onConfirm(reason); setReason(""); }} disabled={!reason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white">Reject</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentRepository() {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag, setFilterTag] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [sharingDoc, setSharingDoc] = useState(null);
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => api.auth.me() });
  const isAdmin = hasGroupOverviewAccess(user);

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["hr-documents"],
    queryFn: () => api.entities.HRDocument.list("-created_date", 300),
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["doc-folders"],
    queryFn: () => api.entities.DocFolder.list("name", 200),
  });

  // Folder CRUD
  const createFolder = useMutation({
    mutationFn: async (data) => {
      const me = await api.auth.me();
      return api.entities.DocFolder.create({ ...data, owner_email: me.email });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doc-folders"] }); setShowFolderDialog(false); setEditingFolder(null); },
  });

  const updateFolder = useMutation({
    mutationFn: ({ id, data }) => api.entities.DocFolder.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doc-folders"] }); setShowFolderDialog(false); setEditingFolder(null); },
  });

  const deleteFolder = useMutation({
    mutationFn: (id) => api.entities.DocFolder.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doc-folders"] }); if (selectedFolderId === deleteFolder._id) setSelectedFolderId(null); },
  });

  // Document mutations
  const approveMutation = useMutation({
    mutationFn: async ({ doc, newStatus }) => {
      const me = await api.auth.me();
      return api.entities.HRDocument.update(doc.id, {
        status: newStatus || "approved",
        approved_by_email: me.email,
        approved_by_name: me.full_name || me.email,
        approved_date: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: async (updated, { doc }) => {
      queryClient.invalidateQueries({ queryKey: ["hr-documents"] });
      if (updated.status === "approved" && doc.owner_email) {
        await api.integrations.Core.SendEmail({
          to: doc.owner_email,
          subject: `✅ Document Approved: ${doc.title}`,
          body: `Hi ${doc.owner_name},\n\nYour document "${doc.title}" has been approved and is now available in the Document Vault.\n\nPhakathi Holdings`,
        }).catch(() => {});
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ doc, reason }) => {
      const me = await api.auth.me();
      return api.entities.HRDocument.update(doc.id, {
        status: "rejected", rejection_reason: reason,
        approved_by_email: me.email, approved_by_name: me.full_name || me.email,
      });
    },
    onSuccess: async (_, { doc, reason }) => {
      queryClient.invalidateQueries({ queryKey: ["hr-documents"] });
      setRejectingDoc(null);
      if (doc.owner_email) {
        await api.integrations.Core.SendEmail({
          to: doc.owner_email,
          subject: `Document Rejected: ${doc.title}`,
          body: `Hi ${doc.owner_name},\n\nYour document "${doc.title}" was rejected.\n\nReason: ${reason}\n\nPlease re-upload a corrected version.\n\nPhakathi Holdings`,
        }).catch(() => {});
      }
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ doc, data }) => api.entities.HRDocument.update(doc.id, data),
    onSuccess: async (updated, { doc, data }) => {
      queryClient.invalidateQueries({ queryKey: ["hr-documents"] });
      setSharingDoc(null);
      // Notify newly shared people
      const newEmails = data.shared_with?.filter(e => !doc.shared_with?.includes(e)) || [];
      for (const email of newEmails) {
        await api.integrations.Core.SendEmail({
          to: email,
          subject: `📄 A document has been shared with you: ${doc.title}`,
          body: `Hi,\n\n${doc.owner_name} has shared a document with you:\n\n📋 ${doc.title}\nCategory: ${doc.category}\n\nLog in to the Phakathi Holdings Document Vault to view it.\n\nPhakathi Holdings`,
        }).catch(() => {});
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.HRDocument.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hr-documents"] }),
  });

  // Derive all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    documents.forEach(d => d.tags?.forEach(t => tags.add(t)));
    return [...tags].sort();
  }, [documents]);

  // Doc counts per folder
  const docCounts = useMemo(() => {
    const counts = {};
    documents.forEach(doc => {
      if (doc.folder_id) counts[doc.folder_id] = (counts[doc.folder_id] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Filtered visible docs
  const visibleDocs = useMemo(() => {
    return documents.filter(doc => {
      if (!canAccess(doc, user)) return false;
      if (selectedFolderId && doc.folder_id !== selectedFolderId) return false;
      const q = search.toLowerCase();
      const matchSearch = !q || doc.title?.toLowerCase().includes(q) || doc.category?.toLowerCase().includes(q)
        || doc.owner_name?.toLowerCase().includes(q) || doc.tags?.some(t => t.includes(q));
      const matchCat = filterCategory === "all" || doc.category === filterCategory;
      const matchStatus = filterStatus === "all" || doc.status === filterStatus;
      const matchTag = !filterTag || doc.tags?.includes(filterTag);
      return matchSearch && matchCat && matchStatus && matchTag;
    });
  }, [documents, user, selectedFolderId, search, filterCategory, filterStatus, filterTag]);

  const pendingCount = documents.filter(d => d.status === "pending_review").length;
  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleFolderSave = (formData) => {
    if (editingFolder) {
      updateFolder.mutate({ id: editingFolder.id, data: formData });
    } else {
      createFolder.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
            <FolderOpen className="w-6 h-6 text-gray-900" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Document Vault</h1>
              <p className="text-xs text-gray-500 hidden md:block">Central repository · folder structure · granular permissions · {accessScopeLabel(user)}</p>
            </div>
          </div>
          <Button onClick={() => setShowUpload(true)} className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
            <Upload className="w-4 h-4" /> Upload
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex gap-0">
        {/* Sidebar — folder tree */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 256, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex-shrink-0"
            >
              <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Folders</p>
                <FolderTree
                  folders={folders}
                  docCounts={docCounts}
                  selectedFolderId={selectedFolderId}
                  onSelect={setSelectedFolderId}
                  onDelete={(f) => deleteFolder.mutate(f.id)}
                  onEdit={(f) => { setEditingFolder(f); setShowFolderDialog(true); }}
                  onCreateFolder={() => { setEditingFolder(null); setShowFolderDialog(true); }}
                />

                {/* Tags panel */}
                {allTags.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {allTags.map(tag => (
                        <button key={tag} onClick={() => setFilterTag(filterTag === tag ? "" : tag)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${filterTag === tag ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 space-y-5 min-w-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => setSelectedFolderId(null)} className="hover:text-gray-900">All Documents</button>
            {selectedFolder && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-medium">{selectedFolder.name}</span>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: documents.filter(d => canAccess(d, user)).length, color: "text-gray-900" },
              { label: "Pending", value: pendingCount, color: "text-yellow-600" },
              { label: "Approved", value: documents.filter(d => d.status === "approved").length, color: "text-green-600" },
              { label: "My Uploads", value: documents.filter(d => d.owner_email === user?.email).length, color: "text-blue-600" },
            ].map(s => (
              <Card key={s.label} className="border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending banner */}
          {isAdmin && pendingCount > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800 flex-1">
                <strong>{pendingCount} document{pendingCount > 1 ? "s" : ""}</strong> awaiting review.
              </p>
              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 text-xs"
                onClick={() => setFilterStatus("pending_review")}>
                Review
              </Button>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-40">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents, tags..." className="pl-8 bg-white h-9" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-36 bg-white text-sm h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 bg-white text-sm h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filterCategory !== "all" || filterStatus !== "all" || filterTag || search) && (
              <Button variant="ghost" size="sm" className="text-xs text-gray-500 gap-1"
                onClick={() => { setFilterCategory("all"); setFilterStatus("all"); setFilterTag(""); setSearch(""); }}>
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>

          {/* Active tag filter indicator */}
          {filterTag && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tag filter:</span>
              <Badge variant="secondary" className="gap-1 text-xs">
                #{filterTag}
                <button onClick={() => setFilterTag("")}><X className="w-3 h-3" /></button>
              </Badge>
            </div>
          )}

          {/* Document list */}
          {docsLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : visibleDocs.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-12 text-center">
                <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No documents found</p>
                <p className="text-gray-300 text-sm mt-1">
                  {selectedFolder ? `No documents in "${selectedFolder.name}"` : "Upload your first document to get started"}
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowUpload(true)}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">{visibleDocs.length} document{visibleDocs.length !== 1 ? "s" : ""}</p>
              {visibleDocs.map(doc => (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <DocumentCard
                    doc={doc}
                    user={user}
                    isAdmin={isAdmin}
                    folderName={folders.find(f => f.id === doc.folder_id)?.name}
                    onApprove={(doc, status) => approveMutation.mutate({ doc, newStatus: status })}
                    onReject={(doc) => setRejectingDoc(doc)}
                    onShare={(doc) => setSharingDoc(doc)}
                    onDelete={(doc) => deleteMutation.mutate(doc.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {user && (
        <UploadDocDialog
          open={showUpload}
          onClose={() => setShowUpload(false)}
          user={user}
          folders={folders}
          defaultFolderId={selectedFolderId || ""}
        />
      )}

      <FolderDialog
        open={showFolderDialog}
        onClose={() => { setShowFolderDialog(false); setEditingFolder(null); }}
        onSave={handleFolderSave}
        folders={folders}
        editingFolder={editingFolder}
      />

      {sharingDoc && (
        <ShareDocDialog
          open={!!sharingDoc}
          onClose={() => setSharingDoc(null)}
          doc={sharingDoc}
          onSave={(data) => shareMutation.mutate({ doc: sharingDoc, data })}
        />
      )}

      <RejectDialog
        doc={rejectingDoc}
        open={!!rejectingDoc}
        onClose={() => setRejectingDoc(null)}
        onConfirm={(reason) => rejectMutation.mutate({ doc: rejectingDoc, reason })}
      />
    </div>
  );
}
