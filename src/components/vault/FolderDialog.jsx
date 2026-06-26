import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder } from "lucide-react";

const COLORS = ["#6b7280","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316"];
const DEPARTMENTS = ["Management","Finance","HR","IT","Operations","Empoweryst"];
const ACCESS_OPTIONS = [
  { value: "public", label: "Public — Everyone" },
  { value: "employee_only", label: "Employees Only" },
  { value: "hr_only", label: "HR Only" },
  { value: "management_only", label: "Management Only" },
];

export default function FolderDialog({ open, onClose, onSave, folders = [], editingFolder = null }) {
  const [form, setForm] = useState({ name: "", description: "", color: "#3b82f6", parent_id: "", access_level: "employee_only", allowed_departments: [] });

  useEffect(() => {
    if (editingFolder) {
      setForm({ name: editingFolder.name, description: editingFolder.description || "", color: editingFolder.color || "#3b82f6", parent_id: editingFolder.parent_id || "", access_level: editingFolder.access_level || "employee_only", allowed_departments: editingFolder.allowed_departments || [] });
    } else {
      setForm({ name: "", description: "", color: "#3b82f6", parent_id: "", access_level: "employee_only", allowed_departments: [] });
    }
  }, [editingFolder, open]);

  const toggleDept = (dept) => {
    setForm(f => ({
      ...f,
      allowed_departments: f.allowed_departments.includes(dept)
        ? f.allowed_departments.filter(d => d !== dept)
        : [...f.allowed_departments, dept]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-4 h-4" style={{ color: form.color }} />
            {editingFolder ? "Rename Folder" : "New Folder"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Folder Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. HR Policies" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>

          {!editingFolder && folders.length > 0 && (
            <div className="space-y-1.5">
              <Label>Parent Folder</Label>
              <Select value={form.parent_id || "none"} onValueChange={v => setForm(f => ({ ...f, parent_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Root (no parent)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Root level</SelectItem>
                  {folders.filter(f => !editingFolder || f.id !== editingFolder.id).map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? "border-gray-900 scale-125" : "border-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Access Level</Label>
            <Select value={form.access_level} onValueChange={v => setForm(f => ({ ...f, access_level: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACCESS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Department Restrictions <span className="text-xs text-gray-400 font-normal">(leave empty = all departments)</span></Label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map(dept => (
                <button key={dept} onClick={() => toggleDept(dept)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${form.allowed_departments.includes(dept) ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                  {dept}
                </button>
              ))}
            </div>
            {form.allowed_departments.length > 0 && (
              <p className="text-xs text-gray-500">Only <strong>{form.allowed_departments.join(", ")}</strong> will see this folder.</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => onSave(form)} disabled={!form.name.trim()}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
              {editingFolder ? "Save Changes" : "Create Folder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}