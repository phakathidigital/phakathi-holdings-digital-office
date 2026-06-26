// Shared task and performance utilities — eliminates duplicated logic across Dashboard, MyDay, TeamPerformance, EmployeeAwards, EmployeeDetailDialog

export function getTodayStr() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function isOverdue(task, todayStr) {
  if (!task.due_date) return false;
  return task.due_date < (todayStr || getTodayStr()) && task.status !== 'completed';
}

export function getOverdueTasks(tasks, todayStr) {
  return tasks.filter(t => isOverdue(t, todayStr));
}

export function getTodaysTasks(tasks, todayStr) {
  const today = todayStr || getTodayStr();
  return tasks.filter(t => t.due_date === today && t.status !== 'completed');
}

export function getPendingTasks(tasks) {
  return tasks.filter(t => t.status !== 'completed');
}

export function getInProgressTasks(tasks) {
  return tasks.filter(t => t.status === 'in_progress');
}

/**
 * Computes performance stats for a single user based on their assigned tasks.
 * Used by TeamPerformance, EmployeeAwards, and EmployeeDetailDialog.
 */
export function computeTaskStats(user, tasks) {
  const userTasks = tasks.filter(t => t.assigned_to === user.email);
  const completed = userTasks.filter(t => t.status === 'completed').length;
  const overdue = userTasks.filter(t => isOverdue(t)).length;
  const total = userTasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const onTimeRate = (completed + overdue) > 0 ? Math.round((completed / (completed + overdue)) * 100) : 100;
  const performanceScore = Math.round((completionRate * 0.6 + onTimeRate * 0.4));
  return { ...user, totalTasks: total, completedTasks: completed, overdueTasks: overdue, completionRate, onTimeRate, performanceScore };
}