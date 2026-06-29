import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  Shield, 
  Database, 
  Palette
} from "lucide-react";
import BrandingSettings from "../components/settings/BrandingSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import NotificationSettings from "../components/settings/NotificationSettings";
import PrivacySettings from "../components/settings/PrivacySettings";
import DataManagement from "../components/settings/DataManagement";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("notifications");
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.entities.Project.list(),
    initialData: [],
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.entities.Task.list(),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: (userData) => api.auth.updateMe(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const handleUpdateSettings = (data) => {
    updateUserMutation.mutate(data);
  };

  const tabs = [
    {
      value: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      value: "privacy",
      label: "Privacy & Security",
      icon: Shield,
    },
    {
      value: "data",
      label: "Data Management",
      icon: Database,
    },
    {
      value: "branding",
      label: "Branding",
      icon: Palette,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tabs Navigation */}
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 h-auto p-1">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="text-xs md:text-sm font-medium">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </CardContent>
            </Card>

            {/* Tab Content */}
            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettings 
                user={user}
                onUpdate={handleUpdateSettings}
                isLoading={updateUserMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <PrivacySettings 
                user={user}
                onUpdate={handleUpdateSettings}
                isLoading={updateUserMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <DataManagement 
                user={user}
                projects={projects}
                tasks={tasks}
              />
            </TabsContent>

            <TabsContent value="branding" className="space-y-6">
              <BrandingSettings user={user} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}