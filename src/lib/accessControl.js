const normalize = (value = "") => String(value).trim().toLowerCase();

export const GROUP_OVERVIEW_ROLE_LABELS = [
  "Group CEO",
  "Operations Manager",
  "HR",
];

export function hasGroupOverviewAccess(user = {}) {
  if (!user) return false;
  if (user.role === "admin") return true;

  const designation = normalize(user.job_title);
  const department = normalize(user.department);

  const isGroupCeo = designation.includes("group ceo") || designation.includes("chief executive officer");
  const isOperationsManager = designation.includes("operations manager");
  const isHr = department === "hr" || department.includes("human resources") || /\bhr\b/.test(designation) || designation.includes("human resources");

  return isGroupCeo || isOperationsManager || isHr;
}

export function accessScopeLabel(user = {}) {
  return hasGroupOverviewAccess(user) ? "Entire group overview" : user?.subsidiary || "Assigned company";
}
