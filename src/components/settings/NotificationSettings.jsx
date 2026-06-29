import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, CheckCircle, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationSettings({ user, onUpdate, isLoading }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    email_notifications: true,
    task_updates: true,
    project_updates: true,
    deadline_reminders: true,
    team_mentions: true,
    weekly_digest: false,
  });
  const [profilePrefs, setProfilePrefs] = useState({
    notification_email: "",
    email_notifications_enabled: false,
    push_notifications_enabled: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pushDenied, setPushDenied] = useState(false);

  useEffect(() => {
    if (user?.notification_settings) {
      setSettings(user.notification_settings);
    }
  }, [user]);

  const { data: profile } = useQuery({
    queryKey: ['userProfile-notif', user?.email],
    queryFn: () => api.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (profile?.[0]) {
      setProfilePrefs({
        notification_email: profile[0].notification_email || user?.email || "",
        email_notifications_enabled: profile[0].email_notifications_enabled || false,
        push_notifications_enabled: profile[0].push_notifications_enabled || false,
      });
    } else if (user?.email) {
      setProfilePrefs(prev => ({ ...prev, notification_email: user.email }));
    }
  }, [profile, user]);

  const handlePushToggle = async (checked) => {
    setPushDenied(false);
    if (checked && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setPushDenied(true);
          return;
        }
      } else if (Notification.permission === 'denied') {
        setPushDenied(true);
        return;
      }
    }
    setProfilePrefs(prev => ({ ...prev, push_notifications_enabled: checked }));
  };

  const handleSave = async () => {
    onUpdate({ notification_settings: settings });
    setSavingProfile(true);
    try {
      const existing = profile?.[0];
      if (existing) {
        await api.entities.UserProfile.update(existing.id, profilePrefs);
      } else if (user?.email) {
        await api.entities.UserProfile.create({
          user_email: user.email,
          ...profilePrefs,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile-notif'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile-push'] });
    } catch (e) {}
    setSavingProfile(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const notificationGroups = [
    {
      title: "Email Notifications",
      description: "Receive notifications via email",
      icon: Mail,
      items: [
        { key: "email_notifications", label: "Enable Email Notifications", description: "Receive all notifications via email" },
        { key: "weekly_digest", label: "Weekly Digest", description: "Get a weekly summary of your activity" },
      ],
    },
    {
      title: "Project & Task Updates",
      description: "Stay informed about project changes",
      icon: Bell,
      items: [
        { key: "task_updates", label: "Task Updates", description: "Notifications when tasks are assigned or updated" },
        { key: "project_updates", label: "Project Updates", description: "Notifications about project status changes" },
        { key: "deadline_reminders", label: "Deadline Reminders", description: "Get reminded about upcoming deadlines" },
      ],
    },
    {
      title: "Team Collaboration",
      description: "Communication and mentions",
      icon: MessageSquare,
      items: [
        { key: "team_mentions", label: "Team Mentions", description: "Get notified when someone mentions you" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {showSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Settings saved successfully!</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Email & Push Delivery Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Email & Push Delivery</CardTitle>
                <CardDescription>Get birthday, holiday, and announcement alerts delivered to you</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Email address */}
            <div className="space-y-2">
              <Label htmlFor="notification_email" className="text-base font-medium">Email for notifications</Label>
              <p className="text-sm text-gray-500">Where should we send your daily birthday, holiday, and announcement alerts?</p>
              <Input
                id="notification_email"
                type="email"
                placeholder="you@example.com"
                value={profilePrefs.notification_email}
                onChange={(e) => setProfilePrefs({ ...profilePrefs, notification_email: e.target.value })}
              />
            </div>

            {/* Email toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-base font-medium">Email Alerts</Label>
                <p className="text-sm text-gray-500 mt-1">Receive birthday reminders, holiday notices, and announcements via email</p>
              </div>
              <Switch
                checked={profilePrefs.email_notifications_enabled}
                onCheckedChange={(checked) => setProfilePrefs({ ...profilePrefs, email_notifications_enabled: checked })}
              />
            </div>

            {/* Push toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> Browser Push Notifications
                </Label>
                <p className="text-sm text-gray-500 mt-1">Show pop-up notifications on your device when new alerts arrive (even if this tab is in the background)</p>
                {pushDenied && (
                  <p className="text-sm text-red-500 mt-1">Push permission was denied. Please enable notifications in your browser settings and try again.</p>
                )}
              </div>
              <Switch
                checked={profilePrefs.push_notifications_enabled}
                onCheckedChange={handlePushToggle}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Existing notification groups */}
      {notificationGroups.map((group, groupIndex) => (
        <motion.div key={group.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (groupIndex + 1) * 0.1 }}>
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                  <group.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{group.title}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor={item.key} className="text-base font-medium cursor-pointer">{item.label}</Label>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <Switch id={item.key} checked={settings[item.key]} onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading || savingProfile} className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white">
          {isLoading || savingProfile ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}