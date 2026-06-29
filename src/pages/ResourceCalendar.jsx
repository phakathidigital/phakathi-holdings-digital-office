import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, Trash2, MapPin, Users, Clock, ChevronLeft, ChevronRight, Monitor, Car, Video } from "lucide-react";
import { format, addDays, startOfWeek, parseISO, isSameDay } from "date-fns";

const RESOURCE_ICONS = {
  "Meeting Room": Users,
  "Projector": Monitor,
  "Laptop": Monitor,
  "Camera": Video,
  "Boardroom": Users,
  "Vehicle": Car,
  "Other": Clock,
};

const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

function BookingForm({ resources, onSubmit, isLoading, onCancel, existingBookings }) {
  const [form, setForm] = useState({
    resource_id: "", title: "", date: format(new Date(), "yyyy-MM-dd"),
    start_time: "08:00", end_time: "09:00", description: "", attendees_count: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedResource = resources.find((r) => r.id === form.resource_id);

  const hasConflict = () => {
    if (!form.resource_id || !form.date || !form.start_time || !form.end_time) return false;
    return existingBookings
      .filter((b) => b.resource_id === form.resource_id && b.date === form.date && b.status !== "cancelled")
      .some((b) => form.start_time < b.end_time && form.end_time > b.start_time);
  };

  const conflict = hasConflict();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (conflict) return;
    onSubmit({
      ...form,
      resource_name: selectedResource?.name || "",
      attendees_count: form.attendees_count ? parseInt(form.attendees_count) : undefined,
      status: "confirmed",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Resource *</Label>
        <Select value={form.resource_id} onValueChange={(v) => set("resource_id", v)} required>
          <SelectTrigger><SelectValue placeholder="Select a resource" /></SelectTrigger>
          <SelectContent>
            {resources.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name} ({r.type})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Booking Title *</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Team Standup, Client Meeting" required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Start Time *</Label>
          <Input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>End Time *</Label>
          <Input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} required />
        </div>
      </div>
      {conflict && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          ⚠️ This resource is already booked during the selected time. Please choose a different time or resource.
        </div>
      )}
      {selectedResource?.capacity && (
        <div className="space-y-1.5">
          <Label>Number of Attendees (capacity: {selectedResource.capacity})</Label>
          <Input type="number" min="1" max={selectedResource.capacity} value={form.attendees_count}
            onChange={(e) => set("attendees_count", e.target.value)} placeholder="How many people?" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional details" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={isLoading || conflict} className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
          {isLoading ? "Booking..." : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}

export default function ResourceCalendar() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showBooking, setShowBooking] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResource, setNewResource] = useState({ name: "", type: "Meeting Room", capacity: "", location: "" });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => api.auth.me() });
  const isAdmin = user?.role === "admin";

  const { data: resources = [] } = useQuery({
    queryKey: ["resources"],
    queryFn: () => api.entities.Resource.filter({ is_active: true }),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => api.entities.Booking.list("-created_date", 300),
  });

  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const createBooking = useMutation({
    mutationFn: async (data) => {
      const me = await api.auth.me();
      const booking = await api.entities.Booking.create({
        ...data,
        booker_email: me.email,
        booker_name: me.full_name || me.email,
      });
      await api.integrations.Core.SendEmail({
        to: me.email,
        subject: `Booking Confirmed: ${data.title}`,
        body: `Hi ${me.full_name || me.email},\n\nYour booking has been confirmed!\n\n📌 ${data.title}\n🏢 Resource: ${data.resource_name}\n📅 Date: ${data.date}\n🕐 Time: ${data.start_time} – ${data.end_time}\n\nPhakathi Holdings – Resource Scheduler`,
      });
      return booking;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); setShowBooking(false); },
  });

  const cancelBooking = useMutation({
    mutationFn: (id) => api.entities.Booking.update(id, { status: "cancelled" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const createResource = useMutation({
    mutationFn: (data) => api.entities.Resource.create({ ...data, capacity: data.capacity ? parseInt(data.capacity) : undefined, is_active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["resources"] }); setShowAddResource(false); setNewResource({ name: "", type: "Meeting Room", capacity: "", location: "" }); },
  });

  const getDayBookings = (day, resourceId) =>
    bookings.filter((b) => b.resource_id === resourceId && b.date === format(day, "yyyy-MM-dd") && b.status !== "cancelled");

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resource Scheduler</h1>
              <p className="text-gray-600 text-sm">Book meeting rooms and shared office equipment</p>
            </div>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Button variant="outline" onClick={() => setShowAddResource(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            )}
            <Button onClick={() => setShowBooking(true)}
              className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> New Booking
            </Button>
          </div>
        </motion.div>

        {/* Resources overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resources.map((r) => {
            const Icon = RESOURCE_ICONS[r.type] || Clock;
            const todayBookings = bookings.filter((b) => b.resource_id === r.id && b.date === format(new Date(), "yyyy-MM-dd") && b.status !== "cancelled");
            return (
              <Card key={r.id} className="border-none shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.type}</p>
                      {r.location && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</p>}
                      <Badge className={`mt-1 text-xs border-0 ${todayBookings.length > 0 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {todayBookings.length > 0 ? `${todayBookings.length} booking(s) today` : "Available today"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {resources.length === 0 && (
            <div className="col-span-4 text-center py-8 text-gray-400 text-sm">
              No resources yet. {isAdmin ? "Add resources to get started." : "Contact admin to add resources."}
            </div>
          )}
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-gray-700">
            {format(weekStart, "d MMM")} – {format(addDays(weekStart, 4), "d MMM yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar grid */}
        {resources.length > 0 && (
          <Card className="border-none shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-3 font-semibold text-gray-700 w-36">Resource</th>
                    {weekDays.map((d) => (
                      <th key={d.toString()} className={`p-3 font-semibold text-center min-w-[140px] ${isSameDay(d, new Date()) ? "bg-gray-900 text-white" : "text-gray-700"}`}>
                        <div>{format(d, "EEE")}</div>
                        <div className="text-xs font-normal">{format(d, "d MMM")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource, ri) => (
                    <tr key={resource.id} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="p-3 font-medium text-gray-800 border-r">
                        <div>{resource.name}</div>
                        <div className="text-xs text-gray-400">{resource.type}</div>
                      </td>
                      {weekDays.map((day) => {
                        const dayBookings = getDayBookings(day, resource.id);
                        return (
                          <td key={day.toString()} className={`p-2 align-top border-r min-h-[80px] ${isSameDay(day, new Date()) ? "bg-gray-50" : ""}`}>
                            {dayBookings.map((b) => (
                              <div key={b.id} className="mb-1.5 p-2 bg-gray-900 text-white rounded-lg text-xs group relative">
                                <p className="font-semibold truncate">{b.title}</p>
                                <p className="opacity-70">{b.start_time} – {b.end_time}</p>
                                <p className="opacity-60 truncate">{b.booker_name?.split(" ")[0] || b.booker_email?.split("@")[0]}</p>
                                {(b.booker_email === user?.email || isAdmin) && (
                                  <button
                                    onClick={() => cancelBooking.mutate(b.id)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-100"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* New Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Book a Resource</DialogTitle></DialogHeader>
          <BookingForm
            resources={resources}
            existingBookings={bookings}
            onSubmit={(data) => createBooking.mutate(data)}
            isLoading={createBooking.isPending}
            onCancel={() => setShowBooking(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Resource Dialog (admin) */}
      <Dialog open={showAddResource} onOpenChange={setShowAddResource}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={newResource.name} onChange={(e) => setNewResource((r) => ({ ...r, name: e.target.value }))} placeholder="e.g. Boardroom A" />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={newResource.type} onValueChange={(v) => setNewResource((r) => ({ ...r, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Meeting Room", "Projector", "Laptop", "Camera", "Boardroom", "Vehicle", "Other"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input type="number" value={newResource.capacity} onChange={(e) => setNewResource((r) => ({ ...r, capacity: e.target.value }))} placeholder="Max people" />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={newResource.location} onChange={(e) => setNewResource((r) => ({ ...r, location: e.target.value }))} placeholder="e.g. Floor 2" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAddResource(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => createResource.mutate(newResource)} disabled={!newResource.name || createResource.isPending}
                className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
                {createResource.isPending ? "Adding..." : "Add Resource"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}