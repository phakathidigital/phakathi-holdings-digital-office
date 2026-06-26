import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import TaskItem from "./TaskItem";

export default function TaskList({ tasks, isLoading, onEditTask, onDeleteTask, onStatusChange, allTasks = [] }) {
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredTasks = filterStatus === "all" 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus);

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-xl font-bold">Tasks</CardTitle>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="all">
                All ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="todo">
                To Do ({tasksByStatus.todo.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({tasksByStatus.in_progress.length})
              </TabsTrigger>
              <TabsTrigger value="review">
                Review ({tasksByStatus.review.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Done ({tasksByStatus.completed.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tasks {filterStatus !== 'all' && `with status "${filterStatus}"`}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onStatusChange={onStatusChange}
                  allTasks={allTasks}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}