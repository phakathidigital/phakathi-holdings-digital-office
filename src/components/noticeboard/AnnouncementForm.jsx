import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const categories = ["general", "hr", "finance", "it", "operations", "urgent"];
const audiences = [
  { value: "all", label: "Everyone" },
  { value: "management", label: "Management Only" },
  { value: "empoweryst", label: "Empoweryst Team" },
  { value: "finance", label: "Finance Team" },
  { value: "hr", label: "HR Team" },
];

export default function AnnouncementForm({ onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    title: "", content: "", category: "general", target_audience: "all", is_pinned: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
        <CardTitle>New Announcement</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input className="mt-1" placeholder="Announcement title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Audience</Label>
              <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {audiences.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Content *</Label>
            <Textarea className="mt-1" rows={4} placeholder="Write your announcement..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_pinned} onCheckedChange={(v) => setForm({ ...form, is_pinned: v })} />
            <Label className="cursor-pointer">Pin this announcement to the top</Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !form.title || !form.content} className="bg-gradient-to-r from-gray-900 to-gray-700 text-white">
              {isLoading ? "Posting..." : "Post Announcement"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}