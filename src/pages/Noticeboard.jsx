import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pin, Bell, Megaphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import AnnouncementForm from "../components/noticeboard/AnnouncementForm";

const categoryConfig = {
  general:    { label: "General",    color: "bg-gray-100 text-gray-700",    dot: "bg-gray-400" },
  hr:         { label: "HR",         color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  finance:    { label: "Finance",    color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  it:         { label: "IT",         color: "bg-purple-100 text-purple-700",dot: "bg-purple-500" },
  operations: { label: "Operations", color: "bg-orange-100 text-orange-700",dot: "bg-orange-500" },
  urgent:     { label: "URGENT",     color: "bg-red-100 text-red-700",      dot: "bg-red-500" },
};

export default function Noticeboard() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list("-created_date"),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create(data),
    onSuccess: async (created, data) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowForm(false);
      // Notify all users about the new announcement
      const users = await base44.entities.User.list().catch(() => []);
      users.forEach((u) => {
        if (!u.email) return;
        base44.integrations.Core.SendEmail({
          to: u.email,
          subject: `New Announcement: ${data.title} — Phakathi Holdings`,
          body: `Dear ${u.full_name || u.email},\n\nA new announcement has been posted on the Company Noticeboard:\n\n<strong>${data.title}</strong>\n\n${data.content}\n\nLog in to the Phakathi Holdings Digital Office to view it.\n\nRegards,\nPhakathi Holdings`,
        }).catch(() => {});
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, pinned }) => base44.entities.Announcement.update(id, { is_pinned: !pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const isAdmin = user?.role === 'admin';
  const pinned = announcements.filter(a => a.is_pinned);
  const unpinned = announcements.filter(a => !a.is_pinned);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Megaphone className="w-8 h-8 text-gray-900" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Company Noticeboard</h1>
            </div>
            <p className="text-gray-600">All company announcements, policies, and updates — in one place</p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          )}
        </motion.div>

        {/* Form */}
        {showForm && isAdmin && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <AnnouncementForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowForm(false)}
              isLoading={createMutation.isPending}
            />
          </motion.div>
        )}

        {/* Pinned */}
        {pinned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-4 h-4 text-gray-700" />
              <h2 className="font-semibold text-gray-700">Pinned</h2>
            </div>
            <div className="space-y-3">
              {pinned.map((announcement, i) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isAdmin={isAdmin}
                  user={user}
                  onDelete={() => deleteMutation.mutate(announcement.id)}
                  onTogglePin={() => togglePinMutation.mutate({ id: announcement.id, pinned: announcement.is_pinned })}
                  delay={i * 0.05}
                  isPinned
                />
              ))}
            </div>
          </div>
        )}

        {/* All Announcements */}
        <div>
          {pinned.length > 0 && <h2 className="font-semibold text-gray-700 mb-3">All Announcements</h2>}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : announcements.length === 0 ? (
            <Card className="border-none shadow-md">
              <CardContent className="p-16 text-center">
                <Bell className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No announcements yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {unpinned.map((announcement, i) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isAdmin={isAdmin}
                  user={user}
                  onDelete={() => deleteMutation.mutate(announcement.id)}
                  onTogglePin={() => togglePinMutation.mutate({ id: announcement.id, pinned: announcement.is_pinned })}
                  delay={i * 0.05}
                  isPinned={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement, isAdmin, user, onDelete, onTogglePin, delay, isPinned }) {
  const config = categoryConfig[announcement.category] || categoryConfig.general;
  const isOwner = announcement.created_by === user?.email;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className={`border-none shadow-md hover:shadow-lg transition-shadow ${isPinned ? 'border-l-4 border-l-gray-900' : ''}`}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                <Badge className={`${config.color} text-xs border-0`}>{config.label}</Badge>
                {isPinned && <Badge className="bg-gray-900 text-white text-xs"><Pin className="w-3 h-3 mr-1" />Pinned</Badge>}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{announcement.content}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>Posted {format(new Date(announcement.created_date), "d MMM yyyy")}</span>
                {announcement.target_audience !== 'all' && (
                  <span className="capitalize">• For: {announcement.target_audience}</span>
                )}
              </div>
            </div>
            {(isAdmin || isOwner) && (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onTogglePin}
                  className="h-8 w-8 p-0"
                  title={isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className={`w-4 h-4 ${isPinned ? 'text-gray-900' : 'text-gray-400'}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}