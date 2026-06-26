import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function LeaveApprovalCard({ leave, onApprove, onReject, isLoading, delay }) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-5">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <p className="font-semibold text-gray-900">{leave.employee_name}</p>
                <Badge className={`${statusColors[leave.status]} border text-xs`}>
                  {leave.status}
                </Badge>
                <Badge variant="outline" className="text-xs">{leave.department}</Badge>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">{leave.leave_type}</p>
              <p className="text-sm text-gray-600">
                {format(new Date(leave.start_date), "d MMM yyyy")} → {format(new Date(leave.end_date), "d MMM yyyy")}
                <span className="ml-2 font-medium">({leave.days_requested} days)</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
              {leave.rejection_reason && (
                <p className="text-sm text-red-600 mt-1">Rejected: {leave.rejection_reason}</p>
              )}
            </div>

            {leave.status === 'pending' && (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(leave)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejecting(!rejecting)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>

          {rejecting && (
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => { onReject(leave, rejectReason); setRejecting(false); }}
                disabled={!rejectReason || isLoading}
              >
                Confirm
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}