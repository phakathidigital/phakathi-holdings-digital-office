import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBSIDIARY_OPTIONS_WITH_ALL as SUBSIDIARIES } from "@/lib/subsidiaries";
import { Upload, CheckCircle, X, Plus, AlertCircle } from "lucide-react";

const CATEGORIES = ["Contract","Tax Form","Policy Handbook","NDA","Payslip","Certificate","ID Document","Template","Project Spec","Report","Other"];
const DEPARTMENTS = ["Management","Finance","HR","IT","Operations","Empoweryst"];
const ACCESS_OPTIONS = [
  { value: "public", label: "Public (Everyone)" },
  { value: "employee_only", label: "All Employees" },
  { value: "hr_only", label: "HR Only" },
  { value: "management_only", label: "Management Only" },
];

export default function UploadDocDialog({ open, onClose, user, folders = [], defaultFolderId = "" }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", category: "Other",
    access_level: "employee_only", allowed_departments: [],
    subsidiary: "All", folder_id: defaultFolderId,
    version: "1.0", version_notes: "", expiry_date: "",
    tags: [], shared_with: [],
  });

  const toggleDept = (dept) => {
    setForm(f => ({
      ...f,
      allowed_departments: f.allowed_departments.includes(dept)
        ? f.allowed_departments.filter(d => d !== dept)
        : [...f.allowed_departments, dept]
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const createMutation = useMutation({
    mutationFn: async (data) => base44.entities.HRDocument.create(data),
    onSuccess: async (doc) => {
      queryClient.invalidateQueries({ queryKey: ["hr-documents"] });
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Document submitted for review: ${form.title}`,
        body: `Your document "${form.title}" has been submitted and is pending review.\n\nPhakathi Holdings`,
      }).catch(() => {});
      onClose();
      setFile(null);
      setForm({ title: "", description: "", category: "Other", access_level: "employee_only", allowed_departments: [], subsidiary: "All", folder_id: defaultFolderId, version: "1.0", version_notes: "", expiry_date: "", tags: [], shared_with: [] });
    },
  });

  const handleUpload = async () => {
    if (!file || !form.title) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    const folder = folders.find(f => f.id === form.folder_id);
    await createMutation.mutateAsync({
      ...form,
      file_url,
      file_name: file.name,
      file_size: `${(file.size / 1024).toFixed(0)} KB`,
      owner_email: user.email,
      owner_name: user.full_name || user.email,
      folder_path: folder?.name || "",
      status: "pending_review",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="w-4 h-4" />Upload Document</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* File drop zone */}
          <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${file ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.txt"
              onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            {file ? (
              <div className="space-y-1">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                <button type="button" onClick={e => { e.preventDefault(); setFile(null); }} className="text-xs text-red-500 underline">Remove</button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to select or drop a file</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, PNG, JPG, TXT</p>
              </>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Document Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Leave Policy 2025" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Folder</Label>
              <Select value={form.folder_id || "none"} onValueChange={v => setForm(f => ({ ...f, folder_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Access Level</Label>
              <Select value={form.access_level} onValueChange={v => setForm(f => ({ ...f, access_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCESS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subsidiary</Label>
              <Select value={form.subsidiary} onValueChange={v => setForm(f => ({ ...f, subsidiary: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Version</Label>
              <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0" />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <textarea className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300" rows={2}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
            </div>
          </div>

          {/* Department restrictions */}
          <div className="space-y-1.5">
            <Label>Department Restrictions <span className="text-xs text-gray-400 font-normal">(empty = all)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map(dept => (
                <button key={dept} type="button" onClick={() => toggleDept(dept)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${form.allowed_departments.includes(dept) ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="e.g. policy, 2025"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} className="flex-1" />
              <Button type="button" variant="outline" size="sm" onClick={addTag}><Plus className="w-4 h-4" /></Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
                    #{tag} <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Documents are submitted for review. You'll receive an email once approved.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleUpload} disabled={!file || !form.title || uploading || createMutation.isPending}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : createMutation.isPending ? "Saving..." : "Upload & Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}