import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBSIDIARIES } from "@/lib/subsidiaries";


const colors = [
  "#808080", "#000000", "#C0C0C0", "#404040", "#606060", "#A0A0A0", "#505050", "#707070"
];

export default function ProjectDialog({ open, onOpenChange, project, onSubmit, isLoading, portfolios = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    portfolio_id: "",
    subsidiary: "",
    status: "planning",
    priority: "medium",
    start_date: "",
    end_date: "",
    budget: "",
    team_members: "",
    color: colors[0],
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        portfolio_id: project.portfolio_id || "",
        subsidiary: project.subsidiary || "",
        status: project.status || "planning",
        priority: project.priority || "medium",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        budget: project.budget || "",
        team_members: project.team_members?.join(", ") || "",
        color: project.color || colors[0],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        portfolio_id: "",
        subsidiary: "",
        status: "planning",
        priority: "medium",
        start_date: "",
        end_date: "",
        budget: "",
        team_members: "",
        color: colors[0],
      });
    }
  }, [project, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      team_members: formData.team_members 
        ? formData.team_members.split(",").map(email => email.trim()).filter(Boolean)
        : [],
    };
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {project ? "Edit Project" : "Create New Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="portfolio_id">Portfolio / Strategic Initiative</Label>
              <Select value={formData.portfolio_id || "none"} onValueChange={(value) => setFormData({...formData, portfolio_id: value === "none" ? "" : value})}>
                <SelectTrigger><SelectValue placeholder="Link to portfolio..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Portfolio</SelectItem>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>{portfolio.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="subsidiary">Subsidiary</Label>
              <Select value={formData.subsidiary} onValueChange={(value) => setFormData({...formData, subsidiary: value})}>
                <SelectTrigger><SelectValue placeholder="Select subsidiary..." /></SelectTrigger>
                <SelectContent>
                  {SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the project"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Project Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="team_members">Team Members (comma separated emails)</Label>
              <Input
                id="team_members"
                value={formData.team_members}
                onChange={(e) => setFormData({...formData, team_members: e.target.value})}
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white"
            >
              {isLoading ? "Saving..." : project ? "Update Project" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
