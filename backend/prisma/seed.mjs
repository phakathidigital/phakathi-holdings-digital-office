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
    "sales.manage",
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
    "sales.manage",
    "projects.view",
    "projects.create",
    "projects.edit",
    "notifications.manage",
    "integrations.manage",
  ],
  "Employee": ["projects.view", "projects.create", "projects.edit", "crm.view", "sales.view"],
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

  const percity = await prisma.user.findUnique({ where: { email: "percity.mavimbela@phakathiholdings.local" } });
  const sarah = await prisma.user.findUnique({ where: { email: "sarah.ngwenya@phakathiholdings.local" } });
  const leadStage = await prisma.opportunityStage.findUnique({ where: { name: "Lead" } });
  const discoveryStage = await prisma.opportunityStage.findUnique({ where: { name: "Discovery" } });
  const proposalStage = await prisma.opportunityStage.findUnique({ where: { name: "Proposal" } });

  const kaeloAccount = await prisma.clientAccount.upsert({
    where: { id: "client-account-kaelo-education-growth" },
    create: {
      id: "client-account-kaelo-education-growth",
      name: "Kaelo Education Growth Partners",
      status: "active",
      industry: "Education",
      location: "South Africa",
      source: "Group ecosystem",
      category: "Strategic education",
      tags: ["education", "growth", "group"],
      estimated_value: 150000,
      historical_revenue: 0,
      relationship_status: "healthy",
      account_owner_id: percity?.id,
    },
    update: {
      name: "Kaelo Education Growth Partners",
      status: "active",
      industry: "Education",
      relationship_status: "healthy",
      account_owner_id: percity?.id,
    },
  });

  const empowerystAccount = await prisma.clientAccount.upsert({
    where: { id: "client-account-empoweryst-bbbee-pipeline" },
    create: {
      id: "client-account-empoweryst-bbbee-pipeline",
      name: "Empoweryst BBBEE Client Pipeline",
      status: "active",
      industry: "BBBEE Consulting",
      location: "South Africa",
      source: "Empoweryst delivery",
      category: "Consulting",
      tags: ["empoweryst", "bbbee", "client-delivery"],
      estimated_value: 220000,
      historical_revenue: 0,
      relationship_status: "watch",
      account_owner_id: sarah?.id,
    },
    update: {
      name: "Empoweryst BBBEE Client Pipeline",
      status: "active",
      industry: "BBBEE Consulting",
      relationship_status: "watch",
      account_owner_id: sarah?.id,
    },
  });

  await prisma.clientContact.upsert({
    where: { id: "contact-kaelo-programme-lead" },
    create: {
      id: "contact-kaelo-programme-lead",
      client_account_id: kaeloAccount.id,
      owner_user_id: percity?.id,
      full_name: "Education Programme Lead",
      position: "Programme Coordinator",
      email: "education.lead@example.com",
      preferred_contact: "email",
    },
    update: {
      client_account_id: kaeloAccount.id,
      full_name: "Education Programme Lead",
      position: "Programme Coordinator",
      email: "education.lead@example.com",
    },
  });

  await prisma.clientContact.upsert({
    where: { id: "contact-empoweryst-client-admin" },
    create: {
      id: "contact-empoweryst-client-admin",
      client_account_id: empowerystAccount.id,
      owner_user_id: sarah?.id,
      full_name: "Client Administration Lead",
      position: "Client Coordinator",
      email: "client.admin@example.com",
      preferred_contact: "email",
    },
    update: {
      client_account_id: empowerystAccount.id,
      full_name: "Client Administration Lead",
      position: "Client Coordinator",
      email: "client.admin@example.com",
    },
  });

  await prisma.clientInteraction.upsert({
    where: { id: "interaction-kaelo-july-discovery" },
    create: {
      id: "interaction-kaelo-july-discovery",
      client_account_id: kaeloAccount.id,
      client_contact_id: "contact-kaelo-programme-lead",
      user_id: percity?.id,
      interaction_type: "strategy_call",
      subject: "July education growth discovery",
      description: "Discussed education ecosystem growth pipeline and Monday reporting cadence.",
      occurred_at: new Date("2026-07-06T10:00:00.000Z"),
      source: "manual",
    },
    update: {
      subject: "July education growth discovery",
      description: "Discussed education ecosystem growth pipeline and Monday reporting cadence.",
      occurred_at: new Date("2026-07-06T10:00:00.000Z"),
    },
  });

  await prisma.clientNote.upsert({
    where: { id: "note-empoweryst-delivery-risk" },
    create: {
      id: "note-empoweryst-delivery-risk",
      client_account_id: empowerystAccount.id,
      client_contact_id: "contact-empoweryst-client-admin",
      created_by_user_id: sarah?.id,
      subject: "Delivery register required",
      body: "Client pipeline health depends on keeping missing documents and consultant follow-ups visible weekly.",
      visibility: "account_team",
    },
    update: {
      subject: "Delivery register required",
      body: "Client pipeline health depends on keeping missing documents and consultant follow-ups visible weekly.",
    },
  });

  const groupReferralSource = await prisma.leadSource.upsert({
    where: { name: "Group Referral" },
    create: {
      id: "lead-source-group-referral",
      name: "Group Referral",
      description: "Lead created from internal subsidiary or group-company referral.",
      metadata: {},
    },
    update: {
      description: "Lead created from internal subsidiary or group-company referral.",
    },
  });

  const mondaySource = await prisma.leadSource.upsert({
    where: { name: "Monday Alignment" },
    create: {
      id: "lead-source-monday-alignment",
      name: "Monday Alignment",
      description: "Lead raised during weekly Monday alignment meetings.",
      metadata: {},
    },
    update: {
      description: "Lead raised during weekly Monday alignment meetings.",
    },
  });

  const kaeloLead = await prisma.lead.upsert({
    where: { id: "lead-kaelo-education-expansion" },
    create: {
      id: "lead-kaelo-education-expansion",
      title: "Kaelo Education July growth expansion",
      source_id: mondaySource.id,
      owner_user_id: percity?.id,
      client_account_id: kaeloAccount.id,
      status: "qualified",
      qualification: "Education ecosystem expansion discussed in the 6 July Monday alignment workflow.",
      estimated_value: 150000,
      description: "Potential execution package for education-growth coordination across Kaelo Education and Baby Geniuses.",
      metadata: { focus: "education", cadence: "Monday alignment" },
    },
    update: {
      source_id: mondaySource.id,
      owner_user_id: percity?.id,
      client_account_id: kaeloAccount.id,
      status: "qualified",
      estimated_value: 150000,
    },
  });

  const empowerystLead = await prisma.lead.upsert({
    where: { id: "lead-empoweryst-bbbee-retainer" },
    create: {
      id: "lead-empoweryst-bbbee-retainer",
      title: "Empoweryst BBBEE delivery retainer",
      source_id: groupReferralSource.id,
      owner_user_id: sarah?.id,
      client_account_id: empowerystAccount.id,
      status: "qualified",
      qualification: "Client delivery register and consultant capacity need recurring monthly coordination.",
      estimated_value: 220000,
      description: "Business-development opportunity to package BBBEE consulting delivery into a monthly retainer workflow.",
      metadata: { focus: "consulting", subsidiary: "Empoweryst" },
    },
    update: {
      source_id: groupReferralSource.id,
      owner_user_id: sarah?.id,
      client_account_id: empowerystAccount.id,
      status: "qualified",
      estimated_value: 220000,
    },
  });

  await prisma.opportunity.upsert({
    where: { id: "opportunity-kaelo-education-growth-july" },
    create: {
      id: "opportunity-kaelo-education-growth-july",
      title: "July Education Growth Execution Package",
      lead_id: kaeloLead.id,
      client_account_id: kaeloAccount.id,
      owner_user_id: percity?.id,
      stage_id: discoveryStage?.id || leadStage?.id,
      value: 150000,
      probability: 35,
      weighted_value: 52500,
      expected_close_date: new Date("2026-07-31"),
      source: "Group strategy",
      industry: "Education",
      description: "Structured package to move education ecosystem strategy into visible execution.",
      next_action: "Prepare pipeline dashboard for Group CEO review.",
      next_follow_up_at: new Date("2026-07-20"),
      status: "open",
    },
    update: {
      title: "July Education Growth Execution Package",
      lead_id: kaeloLead.id,
      client_account_id: kaeloAccount.id,
      owner_user_id: percity?.id,
      stage_id: discoveryStage?.id || leadStage?.id,
      value: 150000,
      probability: 35,
      weighted_value: 52500,
      expected_close_date: new Date("2026-07-31"),
      status: "open",
    },
  });

  const empowerystOpportunity = await prisma.opportunity.upsert({
    where: { id: "opportunity-empoweryst-bbbee-retainer" },
    create: {
      id: "opportunity-empoweryst-bbbee-retainer",
      title: "Empoweryst BBBEE Monthly Delivery Retainer",
      lead_id: empowerystLead.id,
      client_account_id: empowerystAccount.id,
      owner_user_id: sarah?.id,
      stage_id: proposalStage?.id || leadStage?.id,
      value: 220000,
      probability: 55,
      weighted_value: 121000,
      expected_close_date: new Date("2026-07-24"),
      source: "Group referral",
      industry: "BBBEE Consulting",
      description: "Recurring retainer for BBBEE client administration, evidence follow-up, and weekly delivery visibility.",
      next_action: "Send proposal for July retainer approval.",
      next_follow_up_at: new Date("2026-07-17"),
      status: "open",
    },
    update: {
      lead_id: empowerystLead.id,
      client_account_id: empowerystAccount.id,
      owner_user_id: sarah?.id,
      stage_id: proposalStage?.id || leadStage?.id,
      value: 220000,
      probability: 55,
      weighted_value: 121000,
      expected_close_date: new Date("2026-07-24"),
      status: "open",
    },
  });

  await prisma.opportunityActivity.upsert({
    where: { id: "opportunity-activity-empoweryst-proposal" },
    create: {
      id: "opportunity-activity-empoweryst-proposal",
      opportunity_id: empowerystOpportunity.id,
      user_id: sarah?.id,
      activity_type: "proposal_preparation",
      subject: "Prepared retainer proposal outline",
      description: "Mapped consultant follow-ups, evidence collection and weekly reporting into a retainer proposal.",
      occurred_at: new Date("2026-07-10T09:00:00.000Z"),
      metadata: {},
    },
    update: {
      subject: "Prepared retainer proposal outline",
      description: "Mapped consultant follow-ups, evidence collection and weekly reporting into a retainer proposal.",
    },
  });

  await prisma.proposal.upsert({
    where: { id: "proposal-kaelo-education-growth" },
    create: {
      id: "proposal-kaelo-education-growth",
      client_account_id: kaeloAccount.id,
      opportunity_id: "opportunity-kaelo-education-growth-july",
      owner_user_id: percity?.id,
      proposal_value: 150000,
      expiry_date: new Date("2026-07-31"),
      status: "draft",
      notes: "Draft education-growth execution package for Group CEO review.",
      next_action: "Convert Monday action items into a proposal appendix.",
      metadata: { focus: "education" },
    },
    update: {
      client_account_id: kaeloAccount.id,
      opportunity_id: "opportunity-kaelo-education-growth-july",
      owner_user_id: percity?.id,
      proposal_value: 150000,
      status: "draft",
    },
  });

  const empowerystProposal = await prisma.proposal.upsert({
    where: { id: "proposal-empoweryst-bbbee-retainer" },
    create: {
      id: "proposal-empoweryst-bbbee-retainer",
      client_account_id: empowerystAccount.id,
      opportunity_id: empowerystOpportunity.id,
      owner_user_id: sarah?.id,
      proposal_value: 220000,
      submission_date: new Date("2026-07-13"),
      expiry_date: new Date("2026-07-31"),
      status: "sent",
      notes: "Includes BBBEE evidence follow-up, client delivery register and weekly accountability reports.",
      next_action: "Follow up for verbal commitment before the next Monday alignment.",
      metadata: { focus: "BBBEE consulting delivery" },
    },
    update: {
      client_account_id: empowerystAccount.id,
      opportunity_id: empowerystOpportunity.id,
      owner_user_id: sarah?.id,
      proposal_value: 220000,
      status: "sent",
    },
  });

  const empowerystDeal = await prisma.deal.upsert({
    where: { id: "deal-empoweryst-delivery-retainer" },
    create: {
      id: "deal-empoweryst-delivery-retainer",
      client_account_id: empowerystAccount.id,
      opportunity_id: empowerystOpportunity.id,
      proposal_id: empowerystProposal.id,
      status: "open",
      value: 220000,
      metadata: { expected_start: "2026-08-01" },
    },
    update: {
      client_account_id: empowerystAccount.id,
      opportunity_id: empowerystOpportunity.id,
      proposal_id: empowerystProposal.id,
      status: "open",
      value: 220000,
    },
  });

  await prisma.dealProductService.upsert({
    where: { id: "deal-service-bbbee-delivery-register" },
    create: {
      id: "deal-service-bbbee-delivery-register",
      deal_id: empowerystDeal.id,
      name: "BBBEE delivery register and weekly reporting",
      description: "Monthly coordination service for evidence tracking, consultant allocation and client reporting.",
      value: 120000,
      metadata: {},
    },
    update: {
      deal_id: empowerystDeal.id,
      name: "BBBEE delivery register and weekly reporting",
      value: 120000,
    },
  });

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
