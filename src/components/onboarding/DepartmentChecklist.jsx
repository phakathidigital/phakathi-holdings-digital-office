// Department and subsidiary-specific onboarding checklist generator
export const DEPARTMENT_TASKS = {
  IT: {
    accounts: [
      { key: "email_created",      label: "Company Email Created" },
      { key: "slack_invited",      label: "Slack / Teams Invited" },
      { key: "system_access",      label: "System Access & VPN Granted" },
      { key: "hardware_assigned",  label: "Laptop / Hardware Assigned" },
      { key: "dev_tools",          label: "Dev Tools & IDE Configured" },
      { key: "github_access",      label: "GitHub / Repo Access Granted" },
    ],
    training: [
      { key: "company_orientation",  label: "Company Orientation Session" },
      { key: "security_training",    label: "IT Security & Cybersecurity Training" },
      { key: "role_specific",        label: "Technical Role-Specific Training" },
      { key: "bbbee_awareness",      label: "BBBEE Awareness Session" },
      { key: "code_standards",       label: "Code Standards & Review Process" },
    ],
  },
  Finance: {
    accounts: [
      { key: "email_created",      label: "Company Email Created" },
      { key: "slack_invited",      label: "Slack / Teams Invited" },
      { key: "system_access",      label: "Accounting System Access (Sage/QuickBooks)" },
      { key: "hardware_assigned",  label: "Hardware Assigned" },
      { key: "banking_portal",     label: "Banking Portal Access" },
    ],
    training: [
      { key: "company_orientation",  label: "Company Orientation Session" },
      { key: "security_training",    label: "IT Security Training" },
      { key: "role_specific",        label: "Finance Systems Training" },
      { key: "bbbee_awareness",      label: "BBBEE Awareness Session" },
      { key: "compliance_training",  label: "Financial Compliance Training" },
    ],
  },
  HR: {
    accounts: [
      { key: "email_created",      label: "Company Email Created" },
      { key: "slack_invited",      label: "Slack / Teams Invited" },
      { key: "system_access",      label: "HRIS System Access" },
      { key: "hardware_assigned",  label: "Hardware Assigned" },
    ],
    training: [
      { key: "company_orientation",  label: "Company Orientation Session" },
      { key: "security_training",    label: "IT Security & Data Protection Training" },
      { key: "role_specific",        label: "HR Policies & Procedures Training" },
      { key: "bbbee_awareness",      label: "BBBEE Awareness Session" },
      { key: "labour_law",           label: "Labour Law & Compliance" },
    ],
  },
  Management: {
    accounts: [
      { key: "email_created",      label: "Company Email Created" },
      { key: "slack_invited",      label: "Slack / Teams Invited" },
      { key: "system_access",      label: "Executive Dashboard Access" },
      { key: "hardware_assigned",  label: "Hardware & Mobile Device Assigned" },
      { key: "board_portal",       label: "Board Portal / SharePoint Access" },
    ],
    training: [
      { key: "company_orientation",  label: "Executive Orientation Session" },
      { key: "security_training",    label: "IT Security Training" },
      { key: "role_specific",        label: "Leadership & Management Induction" },
      { key: "bbbee_awareness",      label: "BBBEE Strategy & Awareness" },
      { key: "governance",           label: "Corporate Governance Training" },
    ],
  },
  Operations: {
    accounts: [
      { key: "email_created",      label: "Company Email Created" },
      { key: "slack_invited",      label: "Slack / Teams Invited" },
      { key: "system_access",      label: "Operations Management System Access" },
      { key: "hardware_assigned",  label: "Hardware Assigned" },
    ],
    training: [
      { key: "company_orientation",  label: "Company Orientation Session" },
      { key: "security_training",    label: "Safety & IT Security Training" },
      { key: "role_specific",        label: "Operations Processes Training" },
      { key: "bbbee_awareness",      label: "BBBEE Awareness Session" },
      { key: "health_safety",        label: "Health & Safety Induction" },
    ],
  },
  Empoweryst: {
    accounts: [
      { key: "email_created",      label: "Company Email Created" },
      { key: "slack_invited",      label: "Slack / Teams Invited" },
      { key: "system_access",      label: "Empoweryst Platform Access" },
      { key: "hardware_assigned",  label: "Hardware Assigned" },
    ],
    training: [
      { key: "company_orientation",  label: "Company Orientation Session" },
      { key: "security_training",    label: "IT Security Training" },
      { key: "role_specific",        label: "Empoweryst Mission & Programme Training" },
      { key: "bbbee_awareness",      label: "BBBEE Deep-Dive Session" },
      { key: "community_impact",     label: "Community Impact & CSI Orientation" },
    ],
  },
};

export const SUBSIDIARY_EXTRA_TASKS = {
  "Synergex Health": [
    { key: "healthcare_compliance", label: "Healthcare Regulatory Compliance", section: "training" },
    { key: "patient_data",          label: "Patient Data Privacy Training (POPIA)", section: "training" },
  ],
  "Kaelo Education": [
    { key: "curriculum_access", label: "Curriculum Management System Access", section: "accounts" },
    { key: "safeguarding",      label: "Child Safeguarding Training", section: "training" },
  ],
  "Micky Mouse School / Baby Geniuses": [
    { key: "school_mgmt",  label: "School Management System Access", section: "accounts" },
    { key: "safeguarding", label: "Child Safeguarding Training", section: "training" },
  ],
  "Kaelo": [
    { key: "education_assets", label: "Education Asset Portfolio Overview", section: "training" },
    { key: "investment_pipeline", label: "Education Investment Pipeline Access", section: "accounts" },
  ],
};

// Returns the full checklist config for a given department + subsidiary
export function buildChecklist(department, subsidiary) {
  const deptTasks = DEPARTMENT_TASKS[department] || DEPARTMENT_TASKS["Operations"];
  const subExtra = SUBSIDIARY_EXTRA_TASKS[subsidiary] || [];

  const extraAccounts = subExtra.filter(t => t.section === "accounts");
  const extraTraining = subExtra.filter(t => t.section === "training");

  return [
    {
      key: "documents",
      label: "📄 Document Collection",
      color: "bg-blue-50 border-blue-100",
      headerColor: "text-blue-800",
      milestoneLabel: "Documents collected",
      items: [
        { key: "id_document",      label: "ID / Passport Copy" },
        { key: "tax_form",         label: "Tax Form (IT77)" },
        { key: "bank_details",     label: "Bank Account Details" },
        { key: "signed_contract",  label: "Signed Employment Contract" },
        { key: "nda",              label: "NDA / Confidentiality Agreement" },
      ],
    },
    {
      key: "accounts",
      label: "💻 Account Provisioning (IT)",
      color: "bg-purple-50 border-purple-100",
      headerColor: "text-purple-800",
      milestoneLabel: "Accounts provisioned",
      items: [...deptTasks.accounts, ...extraAccounts],
    },
    {
      key: "training",
      label: "🎓 Training & Orientation (HR)",
      color: "bg-green-50 border-green-100",
      headerColor: "text-green-800",
      milestoneLabel: "Training completed",
      items: [...deptTasks.training, ...extraTraining],
    },
    {
      key: "facilities",
      label: "🏢 Facilities Setup",
      color: "bg-orange-50 border-orange-100",
      headerColor: "text-orange-800",
      milestoneLabel: "Facilities ready",
      items: [
        { key: "desk_allocated",   label: "Desk / Workspace Allocated" },
        { key: "access_card",      label: "Building Access Card Issued" },
        { key: "parking",          label: "Parking / Transport Arranged" },
        { key: "office_supplies",  label: "Office Supplies Provided" },
      ],
    },
  ];
}

export function overallProgress(record, checklist) {
  const all = checklist.flatMap(s => s.items.map(i => record[s.key]?.[i.key]));
  const done = all.filter(Boolean).length;
  return all.length > 0 ? Math.round((done / all.length) * 100) : 0;
}

export function sectionProgress(record, sectionKey, items) {
  if (!record[sectionKey] || !items) return 0;
  const done = items.filter(i => record[sectionKey][i.key]).length;
  return items.length > 0 ? Math.round((done / items.length) * 100) : 0;
}

export function buildEmptyChecklist(checklist) {
  return checklist.reduce((acc, section) => {
    acc[section.key] = section.items.reduce((s, item) => ({ ...s, [item.key]: false }), {});
    return acc;
  }, {});
}
