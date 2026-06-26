import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, MoreHorizontal, Trash2, Edit2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const FOLDER_COLORS = ["#6b7280","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316"];

function FolderNode({ folder, allFolders, docCounts, selectedId, onSelect, onDelete, onEdit, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0);
  const children = allFolders.filter(f => f.parent_id === folder.id);
  const count = docCounts[folder.id] || 0;
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(folder.id)}
      >
        <button
          onClick={e => { e.stopPropagation(); setOpen(!open); }}
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
        >
          {children.length > 0
            ? (open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
            : <span className="w-3" />}
        </button>
        {open && children.length > 0
          ? <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? "currentColor" : folder.color }} />
          : <Folder className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? "currentColor" : folder.color }} />
        }
        <span className={`text-sm flex-1 truncate ${isSelected ? "font-semibold" : ""}`}>{folder.name}</span>
        {count > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${isSelected ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
            {count}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button className={`w-5 h-5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity ${isSelected ? "hover:bg-white/20" : "hover:bg-gray-200"}`}>
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit(folder)} className="gap-2 text-xs">
              <Edit2 className="w-3 h-3" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(folder)} className="gap-2 text-xs text-red-600">
              <Trash2 className="w-3 h-3" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && children.map(child => (
        <FolderNode
          key={child.id}
          folder={child}
          allFolders={allFolders}
          docCounts={docCounts}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          onEdit={onEdit}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function FolderTree({ folders, docCounts, selectedFolderId, onSelect, onDelete, onEdit, onCreateFolder }) {
  const rootFolders = folders.filter(f => !f.parent_id);

  return (
    <div className="space-y-1">
      {/* All Documents */}
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${!selectedFolderId ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-gray-100"}`}
        onClick={() => onSelect(null)}
      >
        <FolderOpen className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm flex-1">All Documents</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${!selectedFolderId ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
          {Object.values(docCounts).reduce((a, b) => a + b, 0)}
        </span>
      </div>

      {/* Folder tree */}
      {rootFolders.map(folder => (
        <FolderNode
          key={folder.id}
          folder={folder}
          allFolders={folders}
          docCounts={docCounts}
          selectedId={selectedFolderId}
          onSelect={onSelect}
          onDelete={onDelete}
          onEdit={onEdit}
          depth={0}
        />
      ))}

      <Button variant="ghost" size="sm" onClick={onCreateFolder}
        className="w-full justify-start gap-2 text-gray-500 hover:text-gray-700 mt-1 text-xs">
        <Plus className="w-3.5 h-3.5" /> New Folder
      </Button>
    </div>
  );
}