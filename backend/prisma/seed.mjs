import "../src/config/env.js";
import { PrismaClient } from "@prisma/client";
import { ensureStore } from "../src/config/database.js";
import { OFFICE_CONTACTS } from "../src/config/officeContacts.js";

const prisma = new PrismaClient();

const subsidiaries = [
  "Phakathi Holdings",
  "Empoweryst",
  "Micky Mouse School / Baby Geniuses",
  "Phakathi Capital",
  "Key Experts",
  "Kaelo Education",
  "Kaelo",
  "Synergex Health",
];

const departments = [
  ["Phakathi Holdings", "Executive"],
  ["Phakathi Holdings", "HR"],
  ["Phakathi Holdings", "Finance"],
  ["Phakathi Holdings", "Digital"],
  ["Phakathi Holdings", "Office Administration"],
  ["Phakathi Holdings", "Operations"],
  ["Empoweryst", "Administration"],
  ["Empoweryst", "BBBEE Consulting"],
];

const employees = [
  { full_name: "Mr Tshepo Phakathi", email: "tshepo.phakathi@phakathiholdings.local", app_role: "admin", subsidiary: "Phakathi Holdings", department: "Executive", job_title: "Group CEO", role: "Group Executive" },
  { full_name: "Lorraine Sekwati", email: OFFICE_CONTACTS.hrEmail, app_role: "user", subsidiary: "Phakathi Holdings", department: "HR", job_title: "HR", role: "HR Manager" },
  { full_name: "Meriam Malatji", email: "meriam.malatji@phakathiholdings.local", app_role: "user", subsidiary: "Phakathi Holdings", department: "Finance", job_title: "Bookkeeper / Accountant", role: "Finance" },
  { full_name: "Phathtshedzo Rakhunwana", email: OFFICE_CONTACTS.digitalLeadEmail, app_role: "user", subsidiary: "Phakathi Holdings", department: "Digital", job_title: "Web, Graphics, and System Developer", role: "Digital Office" },
  { full_name: "Thuli Thabethe", email: "thuli.thabethe@phakathiholdings.local", app_role: "user", subsidiary: "Phakathi Holdings", department: "Office Administration", job_title: "Office Coordinator", role: "Operations" },
  { full_name: "Percity Mavimbela", email: "percity.mavimbela@phakathiholdings.local", app_role: "user", subsidiary: "Phakathi Holdings", department: "Operations", job_title: "Operations Manager", role: "Operations" },
  { full_name: "Sarah Ngwenya", email: "sarah.ngwenya@phakathiholdings.local", app_role: "user", subsidiary: "Empoweryst", department: "Administration", job_title: "Administrator", role: "Employee" },
  { full_name: "Lesedi Lucy Motloung", email: "lesedi.motloung@phakathiholdings.local", app_role: "user", subsidiary: "Empoweryst", department: "BBBEE Consulting", job_title: "Senior BBBEE Consultant", role: "Employee" },
  { full_name: "Molato Moloko", email: "molato.moloko@phakathiholdings.local", app_role: "user", subsidiary: "Empoweryst", department: "BBBEE Consulting", job_title: "Senior BBBEE Consultant", role: "Employee" },
];

const permissions = [
  ["admin.manage", "Administration", "Manage system administration"],
  ["audit.view", "Audit", "View audit logs"],
  ["reports.view", "Reports", "View reports and dashboards"],
  ["crm.view", "CRM", "View CRM records"],
  ["crm.create", "CRM", "Create CRM records"],
  ["crm.edit", "CRM", "Edit CRM records"],
  ["crm.delete", "CRM", "Delete CRM records"],
  ["crm.relationship_private.view", "CRM", "View restricted relationship intelligence"],
  ["sales.view", "Sales", "View leads, opportunities, proposals, and deals"],
  ["sales.manage", "Sales", "Manage leads, opportunities, proposals, and deals"],
  ["projects.view", "Projects", "View project records"],
  ["projects.create", "Projects", "Create project records"],
  ["projects.edit", "Projects", "Edit project records"],
  ["projects.delete", "Projects", "Delete project records"],
  ["employees.view", "People", "View employee records"],
  ["employees.manage", "People", "Manage employee records"],
  ["finance.view", "Finance", "View finance/payroll records"],
  ["finance.manage", "Finance", "Manage finance/payroll records"],
  ["notifications.manage", "Notifications", "Manage notification workflows"],
  ["integrations.manage", "Integrations", "Configure integrations"],
];

const rolePermissions = {
  "Group Executive": permissions.map(([key]) => key),
  "Operations": [
    "reports.view",
    "crm.view",
    "sales.view",
    "projects.view",
    "projects.create",
    "projects.edit",
    "employees.view",
    "notifications.manage",
  ],
  "HR Manager": [
    "reports.view",
    "projects.view",
    "employees.view",
    "employees.manage",
    "finance.view",
    "notifications.manage",
  ],
  "Finance": ["reports.view", "projects.view", "finance.view", "finance.manage"],
  "Digital Office": [
    "reports.view",
    "crm.view",
    "sales.view",
    "projects.view",
    "projects.create",
    "projects.edit",
    "notifications.manage",
    "integrations.manage",
  ],
  "Employee": ["projects.view", "crm.view"],
};

const opportunityStages = [
  ["Lead", 10, 10, false, false],
  ["Qualified", 20, 25, false, false],
  ["Discovery", 30, 40, false, false],
  ["Proposal", 40, 55, false, false],
  ["Negotiation", 50, 75, false, false],
  ["Verbal Commitment", 60, 90, false, false],
  ["Won", 70, 100, true, false],
  ["Lost", 80, 0, false, true],
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for npm run db:seed.");
  }

  const organisation = await prisma.organisation.upsert({
    where: { slug: "phakathi-holdings-group" },
    create: {
      name: "Phakathi Holdings Group",
      slug: "phakathi-holdings-group",
      status: "active",
    },
    update: {
      name: "Phakathi Holdings Group",
      status: "active",
    },
  });

  const subsidiaryByName = new Map();
  for (const name of subsidiaries) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const record = await prisma.subsidiary.upsert({
      where: { slug },
      create: {
        organisation_id: organisation.id,
        name,
        slug,
        status: "active",
      },
      update: {
        organisation_id: organisation.id,
        name,
        status: "active",
      },
    });
    subsidiaryByName.set(name, record);
  }

  const departmentByKey = new Map();
  for (const [subsidiaryName, name] of departments) {
    const subsidiary = subsidiaryByName.get(subsidiaryName);
    const slug = `${subsidiary.slug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const department = await prisma.department.upsert({
      where: {
        subsidiary_id_name: {
          subsidiary_id: subsidiary.id,
          name,
        },
      },
      create: {
        subsidiary_id: subsidiary.id,
        name,
        slug,
      },
      update: {
        slug,
        status: "active",
      },
    });
    departmentByKey.set(`${subsidiaryName}:${name}`, department);
  }

  const permissionByKey = new Map();
  for (const [key, module, description] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      create: { key, label: key, module, description },
      update: { module, description },
    });
    permissionByKey.set(key, permission);
  }

  const roleByName = new Map();
  for (const roleName of Object.keys(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName },
      update: {},
    });
    roleByName.set(roleName, role);
  }

  for (const [roleName, keys] of Object.entries(rolePermissions)) {
    const role = roleByName.get(roleName);
    for (const key of keys) {
      const permission = permissionByKey.get(key);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: role.id,
            permission_id: permission.id,
          },
        },
        create: {
          role_id: role.id,
          permission_id: permission.id,
        },
        update: {},
      });
    }
  }

  for (const employee of employees) {
    const subsidiary = subsidiaryByName.get(employee.subsidiary);
    const department = departmentByKey.get(`${employee.subsidiary}:${employee.department}`);
    const user = await prisma.user.upsert({
      where: { email: employee.email },
      create: {
        email: employee.email,
        full_name: employee.full_name,
        role: employee.app_role,
        subsidiary: employee.subsidiary,
        department: employee.department,
        job_title: employee.job_title,
        subsidiary_id: subsidiary?.id,
        department_id: department?.id,
      },
      update: {
        full_name: employee.full_name,
        role: employee.app_role,
        subsidiary: employee.subsidiary,
        department: employee.department,
        job_title: employee.job_title,
        subsidiary_id: subsidiary?.id,
        department_id: department?.id,
      },
    });

    await prisma.userProfile.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        user_email: user.email,
        full_name: user.full_name,
        subsidiary: user.subsidiary,
        department: user.department,
        job_title: user.job_title,
        role: user.job_title,
      },
      update: {
        user_email: user.email,
        full_name: user.full_name,
        subsidiary: user.subsidiary,
        department: user.department,
        job_title: user.job_title,
        role: user.job_title,
      },
    });

    const businessRole = roleByName.get(employee.role);
    if (businessRole) {
      await prisma.userRole.upsert({
        where: {
          user_id_role_id_scope_type_scope_id: {
            user_id: user.id,
            role_id: businessRole.id,
            scope_type: "group",
            scope_id: "",
          },
        },
        create: {
          user_id: user.id,
          role_id: businessRole.id,
          scope_type: "group",
          scope_id: "",
        },
        update: {},
      });
    }
  }

  for (const [name, order_index, probability, is_won_stage, is_lost_stage] of opportunityStages) {
    await prisma.opportunityStage.upsert({
      where: { name },
      create: { name, order_index, probability, is_won_stage, is_lost_stage },
      update: { order_index, probability, is_won_stage, is_lost_stage },
    });
  }

  for (const integration of [
    ["Sage", "sage", ["hr", "leave", "payroll"]],
    ["Google Drive", "google-drive", ["documents", "dam"]],
    ["Microsoft 365 / Outlook", "microsoft-365", ["email", "calendar", "contacts"]],
    ["OpenAI", "openai", ["meeting-studio", "ai-assistant", "business-intelligence"]],
  ]) {
    const [name, provider, supported_modules] = integration;
    await prisma.integration.upsert({
      where: { provider_name: { provider, name } },
      create: {
        provider,
        name,
        status: "not_configured",
        enabled: false,
        credentials_configured: false,
        supported_modules,
      },
      update: {
        supported_modules,
      },
    });
  }

  const previousStorage = process.env.PHAKATHI_STORAGE;
  process.env.PHAKATHI_STORAGE = "postgres";
  await ensureStore();
  if (previousStorage === undefined) delete process.env.PHAKATHI_STORAGE;
  else process.env.PHAKATHI_STORAGE = previousStorage;

  console.log("Seeded Phakathi Flow production database foundation.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
