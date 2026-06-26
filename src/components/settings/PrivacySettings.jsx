import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Lock, Users, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PrivacySettings({ user, onUpdate, isLoading }) {
  const [settings, setSettings] = useState({
    profile_visibility: "team",
    show_email: false,
    show_phone: false,
    allow_task_assignment: true,
    activity_tracking: true,
  });

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user?.privacy_settings) {
      setSettings(user.privacy_settings);
    }
  }, [user]);

  const handleSave = () => {
    onUpdate({ privacy_settings: settings });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Privacy settings updated successfully!</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Profile Visibility */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile Visibility</CardTitle>
                <CardDescription>Control who can see your profile</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="profile_visibility" className="text-base font-medium">
                Who can view your profile?
              </Label>
              <Select
                value={settings.profile_visibility}
                onValueChange={(value) =>
                  setSettings({ ...settings, profile_visibility: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="team">Team Members Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="show_email" className="text-base font-medium cursor-pointer">
                  Show Email Address
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Make your email visible to other team members
                </p>
              </div>
              <Switch
                id="show_email"
                checked={settings.show_email}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_email: checked })
                }
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="show_phone" className="text-base font-medium cursor-pointer">
                  Show Phone Number
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Make your phone number visible to other team members
                </p>
              </div>
              <Switch
                id="show_phone"
                checked={settings.show_phone}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_phone: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Collaboration Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Collaboration</CardTitle>
                <CardDescription>Manage team collaboration settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="allow_task_assignment" className="text-base font-medium cursor-pointer">
                  Allow Task Assignment
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Let team members assign tasks to you
                </p>
              </div>
              <Switch
                id="allow_task_assignment"
                checked={settings.allow_task_assignment}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allow_task_assignment: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Tracking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Activity & Data</CardTitle>
                <CardDescription>Control how your data is used</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="activity_tracking" className="text-base font-medium cursor-pointer">
                  Activity Tracking
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Allow tracking of your activity for analytics and insights
                </p>
              </div>
              <Switch
                id="activity_tracking"
                checked={settings.activity_tracking}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, activity_tracking: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}