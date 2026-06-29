import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Heart, CheckCircle, Clock, AlertCircle } from "lucide-react";
import BenefitsEnrollmentForm from "./BenefitsEnrollmentForm";
import { format } from "date-fns";

const STATUS_COLOR = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-yellow-100 text-yellow-700",
  approved:  "bg-green-100 text-green-700",
};

const BENEFIT_LABELS = {
  retirement_fund:       "Retirement Fund",
  group_life_cover:      "Group Life Cover",
  disability_cover:      "Disability Cover",
  funeral_cover:         "Funeral Cover",
  travel_allowance:      "Travel Allowance",
  cell_phone_allowance:  "Cell Phone Allowance",
};

export default function EmployeePayrollView({ user }) {
  const [showEnrollment, setShowEnrollment] = useState(false);
  const currentYear = new Date().getFullYear();

  const { data: myPayslips = [] } = useQuery({
    queryKey: ["my-payslips", user?.email],
    queryFn: () => api.entities.Payslip.filter({ employee_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: myBenefits = [] } = useQuery({
    queryKey: ["benefits-enrollment", user?.email],
    queryFn: () => api.entities.BenefitsEnrollment.filter({ employee_email: user?.email }),
    enabled: !!user?.email,
  });

  const currentEnrollment = myBenefits.find(b => b.period_year === currentYear);
  const publishedPayslips = myPayslips.filter(p => p.status === "published").sort((a, b) => {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return (b.period_year - a.period_year) || (months.indexOf(b.period_month) - months.indexOf(a.period_month));
  });

  const activeBenefits = currentEnrollment
    ? Object.entries(BENEFIT_LABELS).filter(([k]) => currentEnrollment[k])
    : [];

  return (
    <div className="space-y-6">
      {/* Benefits enrollment banner */}
      {!currentEnrollment && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">Benefits Enrollment Open — {currentYear}</p>
            <p className="text-xs text-orange-600 mt-0.5">You haven't enrolled in benefits for {currentYear} yet. Enrollment closes end of January.</p>
          </div>
          <Button size="sm" onClick={() => setShowEnrollment(true)} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
            Enroll Now
          </Button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payslips */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> My Payslips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {publishedPayslips.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No payslips published yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {publishedPayslips.map(ps => (
                  <div key={ps.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{ps.period_month} {ps.period_year}</p>
                      <p className="text-xs text-gray-500">
                        Gross: R{(ps.gross_amount || 0).toLocaleString()} · Net: <span className="font-semibold text-gray-700">R{(ps.net_amount || 0).toLocaleString()}</span>
                      </p>
                    </div>
                    {ps.file_url && (
                      <a href={ps.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                          <Download className="w-3.5 h-3.5" /> PDF
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits Summary */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> My Benefits {currentYear}</span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowEnrollment(true)}>
                {currentEnrollment ? "Update" : "Enroll"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!currentEnrollment ? (
              <p className="text-sm text-gray-400 text-center py-6">No benefits enrolled for {currentYear}.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`border-0 text-xs ${STATUS_COLOR[currentEnrollment.status]}`}>
                    {currentEnrollment.status === "approved" ? <CheckCircle className="w-3 h-3 mr-1 inline" /> : <Clock className="w-3 h-3 mr-1 inline" />}
                    {currentEnrollment.status}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Medical Aid</span>
                    <span className="font-medium text-gray-800 capitalize">{currentEnrollment.medical_aid}
                      {currentEnrollment.medical_aid !== "none" && currentEnrollment.medical_aid_dependants > 0 &&
                        ` +${currentEnrollment.medical_aid_dependants} dep.`}
                    </span>
                  </div>
                  {activeBenefits.map(([key, label]) => (
                    <div key={key} className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">{label}</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                  {currentEnrollment.retirement_fund && (
                    <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Retirement Contribution</span>
                      <span className="font-medium text-gray-800">{currentEnrollment.retirement_contribution_pct}%</span>
                    </div>
                  )}
                  {currentEnrollment.annual_bonus_pct > 0 && (
                    <div className="flex justify-between text-sm py-1.5">
                      <span className="text-gray-600">Annual Bonus</span>
                      <span className="font-medium text-gray-800">{currentEnrollment.annual_bonus_pct}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BenefitsEnrollmentForm
        existing={currentEnrollment}
        user={user}
        open={showEnrollment}
        onClose={() => setShowEnrollment(false)}
      />
    </div>
  );
}