import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Briefcase, Building, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function ProfileView({ user }) {
  const infoItems = [
    {
      icon: Mail,
      label: "Email",
      value: user?.email,
      show: true,
    },
    {
      icon: Phone,
      label: "Phone",
      value: user?.phone || "Not set",
      show: true,
    },
    {
      icon: Briefcase,
      label: "Job Title",
      value: user?.job_title || "Not set",
      show: true,
    },
    {
      icon: Building,
      label: "Department",
      value: user?.department || "Not set",
      show: true,
    },
    {
      icon: MapPin,
      label: "Location",
      value: user?.location || "Not set",
      show: true,
    },
    {
      icon: User,
      label: "Role",
      value: user?.role,
      show: user?.role,
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: user?.created_date ? format(new Date(user.created_date), 'MMMM d, yyyy') : "N/A",
      show: user?.created_date,
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-none shadow-lg h-full">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {infoItems.slice(0, 5).filter(item => item.show).map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                  <p className="font-medium text-gray-900 break-words">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Information & Bio */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        {/* Account Details */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <CardTitle className="text-lg font-bold">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {infoItems.slice(5).filter(item => item.show).map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                  {item.label === "Role" ? (
                    <Badge className="bg-gray-900 text-white">
                      {item.value}
                    </Badge>
                  ) : (
                    <p className="font-medium text-gray-900">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Biography */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <CardTitle className="text-lg font-bold">About</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 whitespace-pre-wrap">
              {user?.bio || "No bio added yet. Click 'Edit Profile' to add a description about yourself."}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}