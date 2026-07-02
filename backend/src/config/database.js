import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir, dbPath, entitySchemaDir, uploadDir } from "./paths.js";

const initialEmployees = [
  { full_name: "Mr Tshepo Phakathi", email: "tshepo.phakathi@phakathiholdings.local", role: "admin", subsidiary: "Phakathi Holdings", department: "Executive", job_title: "Group CEO" },
  { full_name: "Lorraine Sekwati", email: "lorraine.sekwati@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "HR", job_title: "HR" },
  { full_name: "Meriam Malatji", email: "meriam.malatji@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "Finance", job_title: "Bookkeeper / Accountant" },
  { full_name: "Phathtshedzo Rakhunwana", email: "phathtshedzo.rakhunwana@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "Digital", job_title: "Web, Graphics, and System Developer" },
  { full_name: "Thuli Thabethe", email: "thuli.thabethe@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "Office Administration", job_title: "Office Coordinator" },
  { full_name: "Percity Mavimbela", email: "percity.mavimbela@phakathiholdings.local", role: "user", subsidiary: "Phakathi Holdings", department: "Operations", job_title: "Operations Manager" },
  { full_name: "Sarah Ngwenya", email: "sarah.ngwenya@phakathiholdings.local", role: "user", subsidiary: "Empoweryst", department: "Administration", job_title: "Administrator" },
  { full_name: "Lesedi Lucy Motloung", email: "lesedi.motloung@phakathiholdings.local", role: "user", subsidiary: "Empoweryst", department: "BBBEE Consulting", job_title: "Senior BBBEE Consultant" },
  { full_name: "Molato Moloko", email: "molato.moloko@phakathiholdings.local", role: "user", subsidiary: "Empoweryst", department: "BBBEE Consulting", job_title: "Senior BBBEE Consultant" },
];

const legacySeedEmails = new Set([
  "lorraine@phakathiholdings.local",
  "meriam@phakathiholdings.local",
  "phathu@phakathiholdings.local",
  "thuli@phakathiholdings.local",
  "percity@phakathiholdings.local",
  "sarah@phakathiholdings.local",
  "lesedi@phakathiholdings.local",
  "molato@phakathiholdings.local",
]);

function initialUsers() {
  const now = new Date().toISOString();
  return initialEmployees.map((employee) => ({
    id: crypto.randomUUID(),
    ...employee,
    created_date: now,
    updated_date: now,
  }));
}

function upsertInitialEmployees(db) {
  db.entities ||= {};
  db.entities.User ||= [];
  db.entities.UserProfile ||= [];

  db.entities.User = db.entities.User.filter((user) => !legacySeedEmails.has(user.email));
  db.entities.UserProfile = db.entities.UserProfile.filter((profile) => !legacySeedEmails.has(profile.user_email));

  for (const employee of initialEmployees) {
    const now = new Date().toISOString();
    const userIndex = db.entities.User.findIndex((user) => user.email === employee.email);
    if (userIndex >= 0) {
      db.entities.User[userIndex] = {
        ...db.entities.User[userIndex],
        ...employee,
        updated_date: now,
      };
    } else {
      db.entities.User.push({
        id: crypto.randomUUID(),
        ...employee,
        created_date: now,
        updated_date: now,
      });
    }

    const profileIndex = db.entities.UserProfile.findIndex((profile) => profile.user_email === employee.email);
    const profileData = {
      user_email: employee.email,
      full_name: employee.full_name,
      subsidiary: employee.subsidiary,
      department: employee.department,
      job_title: employee.job_title,
      role: employee.job_title,
    };
    if (profileIndex >= 0) {
      db.entities.UserProfile[profileIndex] = {
        ...db.entities.UserProfile[profileIndex],
        ...profileData,
        updated_date: now,
      };
    } else {
      db.entities.UserProfile.push({
        id: crypto.randomUUID(),
        ...profileData,
        created_date: now,
        updated_date: now,
      });
    }
  }
}

function upsertById(collection, record) {
  const index = collection.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    collection[index] = { ...collection[index], ...record, updated_date: new Date().toISOString() };
  } else {
    collection.push(nowStamped(record));
  }
}

function removeStaleDemoWork(db) {
  const staleProjectIds = new Set((db.entities.Project || [])
    .filter((project) => /tester|test project|stale tester/i.test(`${project.name || ""} ${project.description || ""}`))
    .map((project) => project.id));

  db.entities.Project = (db.entities.Project || []).filter((project) => !staleProjectIds.has(project.id));
  db.entities.Task = (db.entities.Task || []).filter((task) =>
    !staleProjectIds.has(task.project_id) &&
    !/tester|test task|stale tester/i.test(`${task.title || ""} ${task.description || ""}`)
  );
}

function seedJuly2026Workflow(db) {
  db.entities ||= {};
  for (const name of ["OKR", "Portfolio", "Project", "Task", "Milestone", "MeetingStudio", "TimeLog"]) {
    db.entities[name] ||= [];
  }

  removeStaleDemoWork(db);

  const okrId = "okr-july-2026-group-execution";
  const portfolioId = "portfolio-july-2026-group-alignment";
  const meetingId = "meeting-2026-07-06-weekly-alignment";
  const projectIds = {
    meetingCadence: "project-july-2026-monday-alignment-cadence",
    empowerystDelivery: "project-july-2026-empoweryst-bbbee-delivery",
    damDiscipline: "project-july-2026-dam-digital-office-discipline",
    educationPipeline: "project-july-2026-education-growth-pipeline",
  };

  upsertById(db.entities.OKR, {
    id: okrId,
    objective: "Establish a disciplined July 2026 group execution rhythm across Phakathi Holdings and Empoweryst",
    key_results: [
      "Run weekly Monday alignment meetings with documented decisions and Kanban action items",
      "Move Empoweryst BBBEE client delivery actions into visible project tasks with owners and due dates",
      "Improve Document Vault/DAM usage discipline for shared-service documents",
      "Create a clear education-growth execution pipeline across Kaelo Education and Baby Geniuses",
    ],
    progress: 0,
    period: "July 2026",
    status: "on_track",
    owner_email: "tshepo.phakathi@phakathiholdings.local",
    employee_email: "tshepo.phakathi@phakathiholdings.local",
    level: "group",
    portfolio_id: portfolioId,
    notes: "Seeded as the working July 2026 operating OKR for the Phakathi Holdings group.",
  });

  upsertById(db.entities.Portfolio, {
    id: portfolioId,
    name: "July 2026 Group Execution & Education Growth Portfolio",
    description: "A practical operating portfolio linking Monday meetings, Empoweryst delivery, DAM discipline, and education-focused growth work.",
    status: "active",
    owner: "percity.mavimbela@phakathiholdings.local",
    strategic_objective: "Turn weekly alignment into visible execution across shared services and subsidiaries.",
    budget: 85000,
    start_date: "2026-07-01",
    end_date: "2026-07-31",
    project_ids: Object.values(projectIds),
    risk_level: "medium",
    tags: ["July 2026", "Monday alignment", "education", "shared services"],
    okr_id: okrId,
  });

  const projects = [
    {
      id: projectIds.meetingCadence,
      name: "Weekly Monday Alignment Cadence",
      description: "Prepare, run, document, and follow up weekly Monday group alignment meetings.",
      subsidiary: "Phakathi Holdings",
      status: "in_progress",
      priority: "high",
      start_date: "2026-07-01",
      end_date: "2026-07-31",
      team_members: [
        "tshepo.phakathi@phakathiholdings.local",
        "percity.mavimbela@phakathiholdings.local",
        "thuli.thabethe@phakathiholdings.local",
        "phathtshedzo.rakhunwana@phakathiholdings.local",
      ],
      color: "#111827",
    },
    {
      id: projectIds.empowerystDelivery,
      name: "Empoweryst BBBEE Client Delivery Sprint",
      description: "Create visibility over Empoweryst client admin, consultant follow-ups, and delivery deadlines.",
      subsidiary: "Empoweryst",
      status: "in_progress",
      priority: "critical",
      start_date: "2026-07-01",
      end_date: "2026-07-24",
      team_members: [
        "sarah.ngwenya@phakathiholdings.local",
        "lesedi.motloung@phakathiholdings.local",
        "molato.moloko@phakathiholdings.local",
        "percity.mavimbela@phakathiholdings.local",
      ],
      color: "#f97316",
    },
    {
      id: projectIds.damDiscipline,
      name: "Digital Office DAM Usage Discipline",
      description: "Improve Document Vault/DAM upload, tagging, review, and approval discipline for shared-services records.",
      subsidiary: "Phakathi Holdings",
      status: "planning",
      priority: "high",
      start_date: "2026-07-03",
      end_date: "2026-07-17",
      team_members: [
        "phathtshedzo.rakhunwana@phakathiholdings.local",
        "lorraine.sekwati@phakathiholdings.local",
        "meriam.malatji@phakathiholdings.local",
      ],
      color: "#2563eb",
    },
    {
      id: projectIds.educationPipeline,
      name: "Education Ecosystem Growth Pipeline",
      description: "Turn education-focused strategy into a visible pipeline across Kaelo Education and Baby Geniuses.",
      subsidiary: "Kaelo Education",
      status: "planning",
      priority: "medium",
      start_date: "2026-07-06",
      end_date: "2026-07-31",
      team_members: [
        "tshepo.phakathi@phakathiholdings.local",
        "percity.mavimbela@phakathiholdings.local",
        "phathtshedzo.rakhunwana@phakathiholdings.local",
      ],
      color: "#16a34a",
    },
  ];

  for (const project of projects) {
    upsertById(db.entities.Project, {
      ...project,
      portfolio_id: portfolioId,
      okr_id: okrId,
    });
  }

  const tasks = [
    ["task-july-agenda-pack", projectIds.meetingCadence, "Prepare 6 July Monday alignment agenda pack", "Thuli to circulate agenda, previous decisions, and open action list before the meeting.", "thuli.thabethe@phakathiholdings.local", "completed", "high", "2026-07-03", 2],
    ["task-july-meeting-transcript", projectIds.meetingCadence, "Process 6 July transcript in Meeting Studio", "Phathu to process transcript, confirm summary, and sync extracted tasks to Kanban.", "phathtshedzo.rakhunwana@phakathiholdings.local", "in_progress", "high", "2026-07-06", 3],
    ["task-july-action-followup", projectIds.meetingCadence, "Publish Monday action follow-up list", "Percity to confirm owners, due dates, and blocked items after Meeting Studio task extraction.", "percity.mavimbela@phakathiholdings.local", "todo", "high", "2026-07-07", 2],
    ["task-empoweryst-client-register", projectIds.empowerystDelivery, "Update Empoweryst client delivery register", "Sarah to update active client list, missing documents, and next consultant touchpoints.", "sarah.ngwenya@phakathiholdings.local", "in_progress", "critical", "2026-07-08", 5],
    ["task-empoweryst-consultant-actions", projectIds.empowerystDelivery, "Confirm consultant action owners", "Lesedi and Molato to split outstanding BBBEE client actions and add deadlines.", "lesedi.motloung@phakathiholdings.local", "todo", "high", "2026-07-09", 4],
    ["task-empoweryst-risk-escalation", projectIds.empowerystDelivery, "Escalate high-risk Empoweryst delivery blockers", "Molato to identify client blockers needing management intervention.", "molato.moloko@phakathiholdings.local", "todo", "high", "2026-07-10", 3],
    ["task-dam-folder-structure", projectIds.damDiscipline, "Finalise Document Vault folder structure", "Phathu to align folders with HR, Finance, Projects, Empoweryst, and meeting records.", "phathtshedzo.rakhunwana@phakathiholdings.local", "in_progress", "high", "2026-07-10", 4],
    ["task-dam-hr-documents", projectIds.damDiscipline, "Upload and tag HR policy documents", "Lorraine to upload HR policies and tag them for approval and staff visibility.", "lorraine.sekwati@phakathiholdings.local", "todo", "medium", "2026-07-14", 3],
    ["task-dam-finance-documents", projectIds.damDiscipline, "Upload July finance working documents", "Meriam to upload finance working files and mark confidential items correctly.", "meriam.malatji@phakathiholdings.local", "todo", "medium", "2026-07-15", 3],
    ["task-education-pipeline-map", projectIds.educationPipeline, "Map education ecosystem opportunities", "Percity to draft pipeline across Kaelo Education, Baby Geniuses, Key Experts training support, and shared services.", "percity.mavimbela@phakathiholdings.local", "todo", "medium", "2026-07-17", 5],
    ["task-education-exec-review", projectIds.educationPipeline, "Prepare education growth review for Group CEO", "Phathu to prepare a one-page dashboard for Tshepo with projects, owners, blockers, and next actions.", "phathtshedzo.rakhunwana@phakathiholdings.local", "todo", "medium", "2026-07-20", 4],
  ];

  for (const [id, project_id, title, description, assigned_to, status, priority, due_date, estimated_hours] of tasks) {
    upsertById(db.entities.Task, {
      id,
      project_id,
      title,
      description,
      assigned_to,
      status,
      priority,
      due_date,
      estimated_hours,
      tags: ["July 2026", "Monday alignment"],
      completed_at: status === "completed" ? "2026-07-03T14:00:00.000Z" : undefined,
      completed_by: status === "completed" ? assigned_to : undefined,
      status_history: status === "completed" ? [{ from: "todo", to: "completed", changed_by: assigned_to, changed_at: "2026-07-03T14:00:00.000Z" }] : [],
    });
  }

  const milestones = [
    ["milestone-july-06-alignment", projectIds.meetingCadence, "6 July Monday alignment meeting completed", "2026-07-06", "in_progress"],
    ["milestone-july-10-empoweryst-register", projectIds.empowerystDelivery, "Empoweryst delivery register confirmed", "2026-07-10", "pending"],
    ["milestone-july-17-education-pipeline", projectIds.educationPipeline, "Education opportunity pipeline drafted", "2026-07-17", "pending"],
  ];
  for (const [id, project_id, title, due_date, status] of milestones) {
    upsertById(db.entities.Milestone, {
      id,
      project_id,
      portfolio_id: portfolioId,
      title,
      description: "Seeded July 2026 roadmap milestone.",
      due_date,
      status,
      owner_email: "percity.mavimbela@phakathiholdings.local",
    });
  }

  upsertById(db.entities.MeetingStudio, {
    id: meetingId,
    title: "Weekly Monday Group Alignment",
    meeting_date: "2026-07-06",
    meeting_type: "Weekly Monday Alignment",
    recurrence: "Weekly on Monday",
    subsidiary: "Phakathi Holdings",
    attendees: [
      "tshepo.phakathi@phakathiholdings.local",
      "lorraine.sekwati@phakathiholdings.local",
      "meriam.malatji@phakathiholdings.local",
      "phathtshedzo.rakhunwana@phakathiholdings.local",
      "thuli.thabethe@phakathiholdings.local",
      "percity.mavimbela@phakathiholdings.local",
      "sarah.ngwenya@phakathiholdings.local",
      "lesedi.motloung@phakathiholdings.local",
      "molato.moloko@phakathiholdings.local",
    ],
    transcript: "Tshepo opened the Monday alignment meeting and confirmed July must focus on execution discipline. Percity agreed to publish a single action follow-up list after each Monday meeting. Thuli confirmed she will circulate the agenda pack before meetings. Sarah will update the Empoweryst client delivery register by 2026-07-08. Lesedi and Molato agreed to split outstanding BBBEE client actions by 2026-07-09. Phathu will process the transcript in Meeting Studio and sync extracted Kanban tasks. Lorraine will upload HR policy documents to the Document Vault. Meriam will upload July finance working documents. The team agreed that project progress must be verified through Kanban tasks, not manually claimed.",
    summary: "The 6 July 2026 Monday alignment meeting established July as an execution-discipline month. The team agreed to use the connected Goals, Portfolio, Projects, Kanban, Meeting Studio, and DAM workflow as the single source of truth for weekly follow-up.\n\nKey focus areas are Empoweryst client delivery visibility, DAM usage discipline, and education ecosystem pipeline planning.",
    decisions: [
      "July 2026 execution will be tracked through the connected work management system.",
      "Project progress must roll up from completed Kanban tasks rather than manual claims.",
      "Meeting Studio will be used after Monday meetings to extract action items and Kanban tasks.",
    ],
    action_items: [
      "Thuli: circulate the Monday agenda pack before weekly meetings — 2026-07-03",
      "Phathu: process the 6 July transcript in Meeting Studio and sync tasks — 2026-07-06",
      "Sarah: update Empoweryst client delivery register — 2026-07-08",
      "Lesedi and Molato: split outstanding BBBEE client actions — 2026-07-09",
      "Lorraine: upload HR policy documents to the Document Vault — 2026-07-14",
      "Meriam: upload July finance working documents — 2026-07-15",
    ],
    structured_notes: "Agenda\n- July execution discipline\n- Empoweryst delivery visibility\n- DAM usage and document control\n- Education ecosystem pipeline\n\nOutcomes\n- Weekly Monday cadence confirmed\n- Work must move through Projects and Kanban\n- Meeting Studio will produce summaries and tasks for follow-up",
    individual_summaries: {
      "tshepo.phakathi@phakathiholdings.local": "Group CEO overview: July execution will be monitored through connected work-system progress.",
      "percity.mavimbela@phakathiholdings.local": "Operations: own weekly follow-up discipline and unblock overloaded work.",
      "phathtshedzo.rakhunwana@phakathiholdings.local": "Digital: process transcript, maintain Meeting Studio/Kanban workflow, and prepare dashboard visibility.",
      "sarah.ngwenya@phakathiholdings.local": "Empoweryst: update client delivery register and surface admin blockers.",
    },
    attendee_summaries: [
      { attendee: "Percity Mavimbela", summary: "Own action follow-up and execution accountability.", actions: ["Publish Monday follow-up list"] },
      { attendee: "Sarah Ngwenya", summary: "Own Empoweryst client delivery register update.", actions: ["Update client register by 2026-07-08"] },
    ],
    extracted_tasks: [
      { title: "Update Empoweryst client delivery register", description: "Extracted from 6 July Monday alignment.", assigned_to: "sarah.ngwenya@phakathiholdings.local", priority: "critical", due_date: "2026-07-08", project_id: projectIds.empowerystDelivery },
      { title: "Process 6 July transcript in Meeting Studio", description: "Extracted from 6 July Monday alignment.", assigned_to: "phathtshedzo.rakhunwana@phakathiholdings.local", priority: "high", due_date: "2026-07-06", project_id: projectIds.meetingCadence },
      { title: "Upload HR policy documents to Document Vault", description: "Extracted from 6 July Monday alignment.", assigned_to: "lorraine.sekwati@phakathiholdings.local", priority: "medium", due_date: "2026-07-14", project_id: projectIds.damDiscipline },
    ],
    tasks_synced: true,
    emails_sent: false,
    status: "completed",
    ai_provider: "seeded",
    ai_note: "Seeded realistic July 2026 Monday alignment meeting.",
  });

  upsertById(db.entities.TimeLog, {
    id: "timelog-july-agenda-pack",
    task_id: "task-july-agenda-pack",
    task_title: "Prepare 6 July Monday alignment agenda pack",
    project_id: projectIds.meetingCadence,
    project_name: "Weekly Monday Alignment Cadence",
    employee_email: "thuli.thabethe@phakathiholdings.local",
    employee_name: "Thuli Thabethe",
    hours: 2,
    log_date: "2026-07-03",
    description: "Prepared agenda pack, previous decisions, and open actions.",
    billable: false,
  });
}

export async function listEntityNames() {
  try {
    const files = await fs.readdir(entitySchemaDir);
    return files.filter((file) => file.endsWith(".jsonc")).map((file) => path.basename(file, ".jsonc"));
  } catch {
    return ["User", "UserProfile", "Project", "Task", "Notification", "MeetingNote"];
  }
}

export async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });

  try {
    await fs.access(dbPath);
    const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
    const entityNames = await listEntityNames();
    db.entities ||= {};
    let changed = false;
    for (const name of entityNames) {
      if (!Array.isArray(db.entities[name])) {
        db.entities[name] = [];
        changed = true;
      }
    }
    const beforeSeed = JSON.stringify({ users: db.entities.User, profiles: db.entities.UserProfile });
    upsertInitialEmployees(db);
    seedJuly2026Workflow(db);
    if (beforeSeed !== JSON.stringify({ users: db.entities.User, profiles: db.entities.UserProfile })) changed = true;
    await writeDb(db);
  } catch {
    const entityNames = await listEntityNames();
    const entities = Object.fromEntries(entityNames.map((name) => [name, []]));
    entities.User = initialUsers();
    entities.UserProfile = entities.User.map((user) => ({
      id: crypto.randomUUID(),
      user_email: user.email,
      full_name: user.full_name,
      subsidiary: user.subsidiary,
      department: user.department,
      job_title: user.job_title,
      role: user.job_title,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    }));
    const db = { entities, events: [], emails: [], sms: [] };
    seedJuly2026Workflow(db);
    await writeDb(db);
  }
}

export async function readDb() {
  await ensureStore();
  return JSON.parse(await fs.readFile(dbPath, "utf8"));
}

export async function writeDb(db) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

export function nowStamped(data, existing = {}) {
  const now = new Date().toISOString();
  return {
    ...existing,
    ...data,
    id: existing.id || data.id || crypto.randomUUID(),
    created_date: existing.created_date || data.created_date || now,
    updated_date: now,
  };
}
