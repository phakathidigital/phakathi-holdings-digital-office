import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, CheckCircle, XCircle, FileText, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import LeaveRequestForm from "../components/leave/LeaveRequestForm";
import LeaveApprovalCard from "../components/leave/LeaveApprovalCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBSIDIARIES } from "@/lib/subsidiaries";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function Leave() {
  const [showForm, setShowForm] = useState(false);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: myLeaves, isLoading: myLeavesLoading } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: () => api.entities.LeaveRequest.filter({ employee_email: user?.email }, "-created_date"),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: allLeaves, isLoading: allLeavesLoading } = useQuery({
    queryKey: ['allLeaves'],
    queryFn: () => api.entities.LeaveRequest.list("-created_date"),
    enabled: user?.role === 'admin',
    initialData: [],
  });

  const createLeaveMutation = useMutation({
    mutationFn: (data) => api.entities.LeaveRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['allLeaves'] });
      setShowForm(false);
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.LeaveRequest.update(id, data),
    onSuccess: (_, { leave, data }) => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['allLeaves'] });
      // Email notification to employee
      if (leave?.employee_email && data?.status) {
        const statusLabel = data.status === 'approved' ? 'Approved ✅' : 'Rejected ❌';
        api.integrations.Core.SendEmail({
          to: leave.employee_email,
          subject: `Your Leave Request has been ${data.status === 'approved' ? 'Approved' : 'Rejected'} — Phakathi Holdings`,
          body: `Dear ${leave.employee_name || leave.employee_email},\n\nYour ${leave.leave_type} request (${leave.start_date} to ${leave.end_date}) has been <strong>${statusLabel}</strong>.\n\n${data.rejection_reason ? `Reason: ${data.rejection_reason}\n\n` : ''}Please log in to the Phakathi Holdings Digital Office portal for more details.\n\nRegards,\nPhakathi Holdings HR`,
        }).catch(() => {});
      }
    },
  });

  const handleSubmitLeave = (formData) => {
    createLeaveMutation.mutate({
      ...formData,
      employee_email: user.email,
      employee_name: user.full_name || user.email,
      status: "pending",
    });
  };

  const handleApprove = (leave) => {
    updateLeaveMutation.mutate({
      id: leave.id,
      leave,
      data: { status: "approved", approved_by: user.email, approved_date: new Date().toISOString() },
    });
  };

  const handleReject = (leave, reason) => {
    updateLeaveMutation.mutate({
      id: leave.id,
      leave,
      data: { status: "rejected", rejection_reason: reason },
    });
  };

  const filteredAllLeaves = subsidiaryFilter === "all" ? allLeaves : allLeaves.filter(l => l.subsidiary === subsidiaryFilter);
  const pendingLeaves = filteredAllLeaves.filter(l => l.status === 'pending');
  const isAdmin = user?.role === 'admin';

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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Leave Management</h1>
            <p className="text-gray-600">Submit and track leave requests digitally</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Apply for Leave
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", count: myLeaves.filter(l => l.status === 'pending').length, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
            { label: "Approved", count: myLeaves.filter(l => l.status === 'approved').length, color: "bg-green-50 border-green-200 text-green-700" },
            { label: "Rejected", count: myLeaves.filter(l => l.status === 'rejected').length, color: "bg-red-50 border-red-200 text-red-700" },
          ].map((stat) => (
            <Card key={stat.label} className={`border ${stat.color}`}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stat.count}</p>
                <p className="text-sm font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leave Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <LeaveRequestForm
              onSubmit={handleSubmitLeave}
              onCancel={() => setShowForm(false)}
              isLoading={createLeaveMutation.isPending}
            />
          </motion.div>
        )}

        {/* Content */}
        <Tabs defaultValue="my-leaves">
          <div className="flex flex-wrap items-center gap-3">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="my-leaves">My Leave Requests</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="all-leaves" className="relative">
                  All Requests
                  {pendingLeaves.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingLeaves.length}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
            {isAdmin && (
              <Select value={subsidiaryFilter} onValueChange={setSubsidiaryFilter}>
                <SelectTrigger className="w-52 bg-white">
                  <SelectValue placeholder="All Subsidiaries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subsidiaries</SelectItem>
                  {SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <TabsContent value="my-leaves" className="mt-4 space-y-3">
            {myLeaves.length === 0 ? (
              <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No leave requests yet</p>
                </CardContent>
              </Card>
            ) : (
              myLeaves.map((leave, i) => {
                const Icon = statusIcons[leave.status];
                return (
                  <motion.div key={leave.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{leave.leave_type}</h3>
                              <Badge className={`${statusColors[leave.status]} border text-xs`}>
                                <Icon className="w-3 h-3 mr-1" />
                                {leave.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {format(new Date(leave.start_date), "d MMM yyyy")} → {format(new Date(leave.end_date), "d MMM yyyy")}
                              <span className="ml-2 font-medium text-gray-700">({leave.days_requested} {leave.days_requested === 1 ? 'day' : 'days'})</span>
                            </p>
                            <p className="text-sm text-gray-500">{leave.reason}</p>
                            {leave.rejection_reason && (
                              <p className="text-sm text-red-600 mt-1">Reason for rejection: {leave.rejection_reason}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="all-leaves" className="mt-4 space-y-3">
              {filteredAllLeaves.length === 0 ? (
                <Card className="border-none shadow-md">
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No leave requests found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAllLeaves.map((leave, i) => (
                  <LeaveApprovalCard
                    key={leave.id}
                    leave={leave}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isLoading={updateLeaveMutation.isPending}
                    delay={i * 0.05}
                  />
                ))
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}