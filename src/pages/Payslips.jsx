import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Upload, FileText, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format } from "date-fns";
import PayslipUploadDialog from "../components/payslips/PayslipUploadDialog";

export default function Payslips() {
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const isAdmin = user?.role === 'admin';

  const { data: payslips, isLoading } = useQuery({
    queryKey: ['payslips', user?.email],
    queryFn: () =>
      isAdmin
        ? api.entities.Payslip.list("-period_year", 50)
        : api.entities.Payslip.filter({ employee_email: user?.email, status: "published" }, "-period_year"),
    enabled: !!user,
    initialData: [],
  });

  const uploadMutation = useMutation({
    mutationFn: (data) => api.entities.Payslip.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      setShowUpload(false);
      // Notify the employee
      if (data.employee_email) {
        api.integrations.Core.SendEmail({
          to: data.employee_email,
          subject: `Your ${data.period_month} ${data.period_year} Payslip is Ready — Phakathi Holdings`,
          body: `Dear ${data.employee_name || data.employee_email},\n\nYour payslip for <strong>${data.period_month} ${data.period_year}</strong> has been uploaded and is now available in the Phakathi Holdings Digital Office portal.\n\nPlease log in to view and download your payslip.\n\nRegards,\nPhakathi Holdings HR`,
        }).catch(() => {});
      }
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id }) => api.entities.Payslip.update(id, { status: "published" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payslips'] }),
  });

  // Group by employee if admin
  const grouped = payslips.reduce((acc, p) => {
    const key = isAdmin ? p.employee_name : `${p.period_year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

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
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Payslips</h1>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Lock className="w-4 h-4" />
                <span>Secure & Private</span>
              </div>
            </div>
            <p className="text-gray-600">
              {isAdmin ? "Upload and manage payslips for all employees" : "Your payslips — confidential and accessible anytime"}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Payslip
            </Button>
          )}
        </motion.div>

        {/* Security notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Your payslips are private</p>
              <p className="text-blue-700 text-xs mt-0.5">Only you and HR administrators can access your payslips. All files are securely stored.</p>
            </div>
          </CardContent>
        </Card>

        {/* Payslips */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : payslips.length === 0 ? (
          <Card className="border-none shadow-md">
            <CardContent className="p-16 text-center">
              <FileText className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No payslips available yet</p>
              {isAdmin && <p className="text-gray-400 text-sm mt-1">Upload payslips for employees above</p>}
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([group, slips]) => (
            <div key={group}>
              {isAdmin && <h3 className="font-semibold text-gray-700 mb-2 px-1">{group}</h3>}
              <div className="space-y-3">
                {slips.map((payslip, i) => (
                  <motion.div key={payslip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {payslip.period_month} {payslip.period_year}
                              </p>
                              {isAdmin && <p className="text-sm text-gray-500">{payslip.employee_name}</p>}
                              {payslip.net_amount && (
                                <p className="text-sm text-gray-500">
                                  Net: R{payslip.net_amount?.toLocaleString('en-ZA')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isAdmin && payslip.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => publishMutation.mutate({ id: payslip.id })}
                                disabled={publishMutation.isPending}
                              >
                                Publish
                              </Button>
                            )}
                            {isAdmin && (
                              <Badge className={payslip.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                {payslip.status}
                              </Badge>
                            )}
                            <a href={payslip.file_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="bg-gray-900 hover:bg-gray-700 text-white">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <PayslipUploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        onUpload={(data) => uploadMutation.mutate(data)}
        isLoading={uploadMutation.isPending}
      />
    </div>
  );
}