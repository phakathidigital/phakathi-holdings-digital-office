import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Users, Lock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { format } from "date-fns";
import MeetingNoteForm from "../components/meetings/MeetingNoteForm";
import MeetingNoteCard from "../components/meetings/MeetingNoteCard";

const meetingTypeColors = {
  "Management Meeting": "bg-gray-900 text-white",
  "Department Meeting": "bg-blue-100 text-blue-700",
  "Project Review": "bg-purple-100 text-purple-700",
  "Client Meeting": "bg-green-100 text-green-700",
  "One-on-One": "bg-orange-100 text-orange-700",
  "BBBEE Consultation": "bg-yellow-100 text-yellow-700",
  "Other": "bg-gray-100 text-gray-700",
};

export default function MeetingNotes() {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notes, isLoading } = useQuery({
    queryKey: ['meetingNotes'],
    queryFn: () => base44.entities.MeetingNote.list("-meeting_date"),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MeetingNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetingNotes'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MeetingNote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetingNotes'] });
      setEditingNote(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MeetingNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetingNotes'] }),
  });

  const handleSubmit = (data) => {
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const filtered = notes.filter(n =>
    !search ||
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.meeting_type?.toLowerCase().includes(search.toLowerCase()) ||
    n.minutes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Meeting Notes</h1>
            <p className="text-gray-600">No more notebook dependency — all minutes, searchable and shared instantly</p>
          </div>
          <Button
            onClick={() => { setEditingNote(null); setShowForm(!showForm); }}
            className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Meeting Note
          </Button>
        </motion.div>

        {/* Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <MeetingNoteForm
              note={editingNote}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingNote(null); }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </motion.div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search meeting notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-none shadow-md">
            <CardContent className="p-16 text-center">
              <FileText className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{search ? "No notes match your search" : "No meeting notes yet"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((note, i) => (
              <MeetingNoteCard
                key={note.id}
                note={note}
                delay={i * 0.05}
                meetingTypeColors={meetingTypeColors}
                currentUser={user}
                onEdit={handleEdit}
                onDelete={() => deleteMutation.mutate(note.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}