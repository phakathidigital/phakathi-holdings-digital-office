import { getPrismaClient, shouldUsePostgresPersistence } from "../config/database.js";

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function hasManagementOverview(user = {}) {
  const role = normalize(user.role);
  const title = normalize(user.job_title);
  const department = normalize(user.department);
  return (
    role === "admin" ||
    title.includes("group ceo") ||
    title.includes("chief executive officer") ||
    title.includes("operations manager") ||
    department === "hr" ||
    title.includes("human resources") ||
    /\bhr\b/.test(title)
  );
}

export async function getUserPermissionKeys(user = {}) {
  if (!user?.email) return new Set();
  if (user.role === "admin") return new Set(["*"]);

  if (!shouldUsePostgresPersistence()) {
    const keys = ["projects.view", "projects.create", "projects.edit"];
    if (hasManagementOverview(user)) {
      keys.push("reports.view", "employees.view", "projects.edit", "notifications.manage");
    }
    return new Set(keys);
  }

  const prisma = await getPrismaClient();
  const record = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!record) return new Set();
  const keys = new Set();
  for (const userRole of record.roles || []) {
    for (const rolePermission of userRole.role?.permissions || []) {
      if (rolePermission.permission?.key) keys.add(rolePermission.permission.key);
    }
  }
  return keys;
}

export async function userHasPermission(user, permissionKey) {
  if (!permissionKey) return true;
  const keys = await getUserPermissionKeys(user);
  return keys.has("*") || keys.has(permissionKey);
}
