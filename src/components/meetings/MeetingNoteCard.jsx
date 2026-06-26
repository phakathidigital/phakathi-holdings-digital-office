import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Lock, ChevronDown, ChevronUp, Pencil, Trash2, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function MeetingNoteCard({ note, delay, meetingTypeColors, currentUser, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isOwner = note.created_by === currentUser?.email;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={`${meetingTypeColors[note.meeting_type] || 'bg-gray-100 text-gray-700'} text-xs border-0`}>
                  {note.meeting_type}
                </Badge>
                {note.is_confidential && (
                  <Badge className="bg-gray-900 text-white text-xs"><Lock className="w-3 h-3 mr-1" />Confidential</Badge>
                )}
                {note.department && <Badge variant="outline" className="text-xs">{note.department}</Badge>}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 truncate">{note.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{format(new Date(note.meeting_date), "EEEE, d MMMM yyyy")}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {note.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{note.venue}</span>}
                {note.attendees?.length > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{note.attendees.length} attendees</span>}
                {note.action_items?.length > 0 && <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{note.action_items.length} actions</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {(isOwner || isAdmin) && (
                <>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
                </>
              )}
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-4 border-t pt-4">
              {note.agenda && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Agenda</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.agenda}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Minutes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.minutes}</p>
              </div>
              {note.attendees?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Attendees</p>
                  <div className="flex flex-wrap gap-2">
                    {note.attendees.map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>)}
                  </div>
                </div>
              )}
              {note.action_items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Action Items</p>
                  <ul className="space-y-1">
                    {note.action_items.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-gray-900 font-bold">→</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}