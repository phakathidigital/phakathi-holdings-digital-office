import { getPrismaClient, readDb, shouldUsePostgresPersistence } from "../../config/database.js";
import { toSlug } from "../../utils/validation.js";

export const REQUIRED_SUBSIDIARIES = [
  "Phakathi Holdings",
  "Empoweryst",
  "Micky Mouse School / Baby Geniuses",
  "Phakathi Capital",
  "Key Experts",
  "Kaelo Education",
  "Kaelo",
  "Synergex Health",
];

const DEFAULT_DEPARTMENTS = [
  ["Phakathi Holdings", "Executive"],
  ["Phakathi Holdings", "HR"],
  ["Phakathi Holdings", "Finance"],
  ["Phakathi Holdings", "Digital"],
  ["Phakathi Holdings", "Office Administration"],
  ["Phakathi Holdings", "Operations"],
  ["Empoweryst", "Administration"],
  ["Empoweryst", "BBBEE Consulting"],
];

function publicUser(user = {}) {
  const { password_hash, password_reset_token, ...safe } = user;
  return safe;
}

function localOrganisation() {
  return {
    id: "local-phakathi-holdings-group",
    name: "Phakathi Holdings Group",
    slug: "phakathi-holdings-group",
    status: "active",
  };
}

export async function listOrganisations() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    return prisma.organisation.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
    });
  }
  return [localOrganisation()];
}

export async function listSubsidiaries() {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    return prisma.subsidiary.findMany({
      where: { deleted_at: null },
      include: { organisation: true, departments: { where: { deleted_at: null }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });
  }

  const organisation = localOrganisation();
  return REQUIRED_SUBSIDIARIES.map((name) => ({
    id: `local-${toSlug(name)}`,
    organisation_id: organisation.id,
    name,
    slug: toSlug(name),
    status: "active",
    departments: DEFAULT_DEPARTMENTS
      .filter(([subsidiary]) => subsidiary === name)
      .map(([, department]) => ({ id: `local-${toSlug(name)}-${toSlug(department)}`, name: department, slug: `${toSlug(name)}-${toSlug(department)}` })),
  }));
}

export async function listDepartments({ subsidiaryId, subsidiaryName } = {}) {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    return prisma.department.findMany({
      where: {
        deleted_at: null,
        ...(subsidiaryId ? { subsidiary_id: subsidiaryId } : {}),
        ...(subsidiaryName ? { subsidiary: { name: subsidiaryName } } : {}),
      },
      include: { subsidiary: true },
      orderBy: { name: "asc" },
    });
  }

  return DEFAULT_DEPARTMENTS
    .filter(([subsidiary]) => !subsidiaryName || subsidiary === subsidiaryName)
    .map(([subsidiary, name]) => ({
      id: `local-${toSlug(subsidiary)}-${toSlug(name)}`,
      subsidiary_id: `local-${toSlug(subsidiary)}`,
      subsidiary,
      name,
      slug: `${toSlug(subsidiary)}-${toSlug(name)}`,
      status: "active",
    }));
}

export async function listUsers({ subsidiaryId, subsidiaryName, includeDeleted = false } = {}) {
  if (shouldUsePostgresPersistence()) {
    const prisma = await getPrismaClient();
    const users = await prisma.user.findMany({
      where: {
        ...(includeDeleted ? {} : { deleted_at: null }),
        ...(subsidiaryId ? { subsidiary_id: subsidiaryId } : {}),
        ...(subsidiaryName ? { subsidiary: subsidiaryName } : {}),
      },
      include: { subsidiary_ref: true, department_ref: true, roles: { include: { role: true } } },
      orderBy: { full_name: "asc" },
    });
    return users.map(publicUser);
  }

  const db = await readDb();
  return (db.entities.User || [])
    .filter((user) => !subsidiaryName || user.subsidiary === subsidiaryName)
    .map(publicUser);
}

export async function syncUserToRelational(user = {}) {
  if (!shouldUsePostgresPersistence() || !user.email) return null;
  const prisma = await getPrismaClient();
  const subsidiary = user.subsidiary
    ? await prisma.subsidiary.findUnique({ where: { slug: toSlug(user.subsidiary) } })
    : null;
  const department = user.department && subsidiary
    ? await prisma.department.findFirst({ where: { subsidiary_id: subsidiary.id, name: user.department } })
    : null;

  const relationalUser = await prisma.user.upsert({
    where: { email: user.email },
    create: {
      email: user.email,
      full_name: user.full_name,
      role: user.role || "user",
      subsidiary: user.subsidiary || null,
      department: user.department || null,
      job_title: user.job_title || null,
      subsidiary_id: subsidiary?.id,
      department_id: department?.id,
      password_hash: user.password_hash,
      auth_provider: user.auth_provider,
      password_set_date: user.password_set_date ? new Date(user.password_set_date) : undefined,
      branding: user.branding,
      profile_image_url: user.profile_image_url,
      cover_image_url: user.cover_image_url,
    },
    update: {
      full_name: user.full_name,
      role: user.role || "user",
      subsidiary: user.subsidiary || null,
      department: user.department || null,
      job_title: user.job_title || null,
      subsidiary_id: subsidiary?.id,
      department_id: department?.id,
      password_hash: user.password_hash,
      auth_provider: user.auth_provider,
      password_set_date: user.password_set_date ? new Date(user.password_set_date) : undefined,
      branding: user.branding,
      profile_image_url: user.profile_image_url,
      cover_image_url: user.cover_image_url,
    },
  });

  await prisma.userProfile.upsert({
    where: { user_id: relationalUser.id },
    create: {
      user_id: relationalUser.id,
      user_email: relationalUser.email,
      full_name: relationalUser.full_name,
      subsidiary: relationalUser.subsidiary,
      department: relationalUser.department,
      job_title: relationalUser.job_title,
      role: relationalUser.job_title,
      preferences: user.preferences,
    },
    update: {
      user_email: relationalUser.email,
      full_name: relationalUser.full_name,
      subsidiary: relationalUser.subsidiary,
      department: relationalUser.department,
      job_title: relationalUser.job_title,
      role: relationalUser.job_title,
      preferences: user.preferences,
    },
  });

  return publicUser(relationalUser);
}

export async function backfillRelationalUsers() {
  const db = await readDb();
  const users = db.entities.User || [];
  const synced = [];
  for (const user of users) {
    const record = await syncUserToRelational(user);
    if (record) synced.push(record);
  }
  return { scanned: users.length, synced: synced.length };
}
