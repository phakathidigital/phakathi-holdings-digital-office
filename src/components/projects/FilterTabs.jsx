import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FilterTabs({ activeFilter, setActiveFilter }) {
  return (
    <Tabs value={activeFilter} onValueChange={setActiveFilter}>
      <TabsList className="bg-white border border-gray-200">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="planning">Planning</TabsTrigger>
        <TabsTrigger value="in_progress">In Progress</TabsTrigger>
        <TabsTrigger value="on_hold">On Hold</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}