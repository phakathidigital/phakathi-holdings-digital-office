import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Edit, Mail, Phone, MapPin, Briefcase, Building, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

import ProfileView from "../components/profile/ProfileView";
import ProfileEditDialog from "../components/profile/ProfileEditDialog";
import ProfileImageUpload from "../components/profile/ProfileImageUpload";
import CoverImageUpload from "../components/profile/CoverImageUpload";

export default function Profile() {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.auth.me(),
  });

  const updateUserMutation = useMutation({
    mutationFn: (userData) => api.auth.updateMe(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowEditDialog(false);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      return api.auth.updateMe({ profile_image_url: file_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowImageUpload(false);
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      return api.auth.updateMe({ cover_image_url: file_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowCoverUpload(false);
    },
  });

  const handleUpdateProfile = (data) => {
    updateUserMutation.mutate(data);
  };

  const handleImageUpload = (file) => {
    uploadImageMutation.mutate(file);
  };

  const handleCoverUpload = (file) => {
    uploadCoverMutation.mutate(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>
          <Button
            onClick={() => setShowEditDialog(true)}
            className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </motion.div>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-lg overflow-hidden">
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600">
              {user?.cover_image_url && (
                <img
                  src={user.cover_image_url}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={() => setShowCoverUpload(true)}
                className="absolute top-4 right-4 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-lg flex items-center gap-2 transition-all duration-200"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm">Change Cover</span>
              </button>
            </div>

            {/* Profile Image — anchored to bottom of cover */}
            <div className="relative h-0">
              <div className="absolute left-6 -top-16 z-10 group">
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.full_name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-xl">
                    <span className="text-white font-bold text-4xl">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="absolute bottom-1 right-1 w-9 h-9 bg-gray-900 hover:bg-gray-700 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 border-2 border-white"
                  title="Change profile photo"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Profile Info Section — all in white area */}
            <CardContent className="px-6 pt-20 pb-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {user?.full_name || "No name set"}
                  </h2>
                  <p className="text-gray-500 mb-3">{user?.job_title || "No designation / role"}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {user?.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user?.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors self-start md:self-auto mt-1 md:mt-0"
                >
                  Change photo
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Details */}
        <ProfileView user={user} />

        {/* Edit Dialog */}
        <ProfileEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          user={user}
          onSubmit={handleUpdateProfile}
          isLoading={updateUserMutation.isPending}
        />

        {/* Profile Image Upload Dialog */}
        <ProfileImageUpload
          open={showImageUpload}
          onOpenChange={setShowImageUpload}
          onUpload={handleImageUpload}
          isLoading={uploadImageMutation.isPending}
        />

        {/* Cover Image Upload Dialog */}
        <CoverImageUpload
          open={showCoverUpload}
          onOpenChange={setShowCoverUpload}
          onUpload={handleCoverUpload}
          isLoading={uploadCoverMutation.isPending}
        />
      </div>
    </div>
  );
}
