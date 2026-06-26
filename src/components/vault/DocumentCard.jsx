import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, Share2, ChevronDown, ChevronUp, CheckCircle, XCircle, Archive,
  Clock, Globe, Users, Shield, Lock, RefreshCw, Tag, Folder, MoreHorizontal, Trash2
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const CAT_ICONS = {
  "Contract": "📋", "Tax Form": "🧾", "Policy Handbook": "📘", "NDA": "🔏",
  "Payslip": "💰", "Certificate": "🏆", "ID Document": "🪪", "Template": "📐",
  "Project Spec": "🗂", "Report": "📊", "Other": "📄"
};

const STATUS_CONFIG = {
  pending_review: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved:       { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected:       { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  archived:       { label: "Archived", color: "bg-gray-100 text-gray-500", icon: Archive },
};

const ACCESS_CONFIG = {
  public:           { label: "Public", icon: Globe, color: "bg-green-50 text-green-700" },
  employee_only:    { label: "Employees", icon: Users, color: "bg-blue-50 text-blue-700" },
  hr_only:          { label: "HR Only", icon: Shield, color: "bg-purple-50 text-purple-700" },
  management_only:  { label: "Management", icon: Lock, color: "bg-red-50 text-red-700" },
};

export default function DocumentCard({ doc, user, isAdmin, onApprove, onReject, onShare, onDelete, folderName }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending_review;
  const access = ACCESS_CONFIG[doc.access_level] || ACCESS_CONFIG.employee_only;
  const StatusIcon = status.icon;
  const AccessIcon = access.icon;
  const isOwner = doc.owner_email === user?.email;

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0 mt-0.5">{CAT_ICONS[doc.category] || "📄"}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{doc.title}
                  <span className="ml-2 text-xs text-gray-400 font-normal">v{doc.version}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
                  <Badge className={`text-xs border-0 ${status.color}`}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
                  <Badge className={`text-xs border-0 ${access.color}`}><AccessIcon className="w-3 h-3 mr-1" />{access.label}</Badge>
                  <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                  {folderName && (
                    <Badge variant="outline" className="text-xs gap-1"><Folder className="w-2.5 h-2.5" />{folderName}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {doc.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  <span>{doc.owner_name}</span>
                  {doc.subsidiary && doc.subsidiary !== "All" && <span>· {doc.subsidiary}</span>}
                  {doc.allowed_departments?.length > 0 && <span>· {doc.allowed_departments.join(", ")} only</span>}
                  <span>· {doc.created_date ? format(new Date(doc.created_date), "dd MMM yyyy") : "—"}</span>
                  {doc.expiry_date && <span className="text-orange-500">· Expires {format(new Date(doc.expiry_date), "dd MMM yyyy")}</span>}
                  {doc.file_size && <span>· {doc.file_size}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
                {(isAdmin || isOwner) && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Share" onClick={() => onShare(doc)}>
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setExpanded(!expanded)} className="text-xs gap-2">
                      {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Details
                    </DropdownMenuItem>
                    {isAdmin && doc.status === "pending_review" && (
                      <>
                        <DropdownMenuItem onClick={() => onApprove(doc)} className="text-xs gap-2 text-green-700">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onReject(doc)} className="text-xs gap-2 text-red-600">
                          <XCircle className="w-3 h-3" /> Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && doc.status === "approved" && (
                      <DropdownMenuItem onClick={() => onApprove(doc, "archived")} className="text-xs gap-2">
                        <Archive className="w-3 h-3" /> Archive
                      </DropdownMenuItem>
                    )}
                    {(isAdmin || isOwner) && (
                      <DropdownMenuItem onClick={() => onDelete(doc)} className="text-xs gap-2 text-red-600">
                        <Trash2 className="w-3 h-3" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                {doc.description && <p className="text-sm text-gray-600">{doc.description}</p>}
                {doc.version_notes && <p className="text-xs text-gray-500"><strong>Version notes:</strong> {doc.version_notes}</p>}
                {doc.approved_by_name && (
                  <p className="text-xs text-green-600">✓ Approved by {doc.approved_by_name}
                    {doc.approved_date ? ` on ${format(new Date(doc.approved_date), "dd MMM yyyy")}` : ""}
                  </p>
                )}
                {doc.rejection_reason && <p className="text-xs text-red-600">✗ Rejected: {doc.rejection_reason}</p>}
                {doc.shared_with?.length > 0 && (
                  <p className="text-xs text-gray-500">Shared with: {doc.shared_with.join(", ")}</p>
                )}
                {doc.previous_version_url && (
                  <a href={doc.previous_version_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> View previous version
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}