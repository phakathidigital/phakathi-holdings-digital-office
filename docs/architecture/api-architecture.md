# Phakathi Flow API architecture

## Current API

Current bases:

- Local: `http://127.0.0.1:4000/api`
- Netlify: `/api`

Current routes:

- `/api/health`
- `/api/auth`
- `/api/entities`
- `/api/integrations`
- `/api/functions`
- `/api/analytics`
- `/api/push`

The frontend dynamically uses `api.entities.EntityName` clients.

## Strengths

- Existing pages work through one compatibility layer.
- Auth is enforced for generic entities.
- Users and push subscriptions are sanitized.
- Task/project anti-cheating rules exist.
- Meeting Studio AI backend exists.
- Netlify wraps the Express API successfully.

## Gaps

- No `/api/v1`.
- Generic CRUD is too broad for production.
- No domain CRM APIs.
- No domain Business Development APIs.
- Limited validation.
- Limited pagination.
- Limited granular authorization.
- AuditLog is not consistently written.
- `/api/functions/:functionName` is placeholder-style.

## Target API flow

```text
Route
  -> authenticate
  -> authorize
  -> validate
  -> service
  -> repository/Prisma
  -> audit log
  -> notifications/events
  -> response
```

## Target `/api/v1` map

- `/api/v1/auth`
- `/api/v1/sessions`
- `/api/v1/organisations`
- `/api/v1/subsidiaries`
- `/api/v1/departments`
- `/api/v1/users`
- `/api/v1/roles`
- `/api/v1/permissions`
- `/api/v1/work`
- `/api/v1/projects`
- `/api/v1/tasks`
- `/api/v1/meetings`
- `/api/v1/crm/accounts`
- `/api/v1/crm/contacts`
- `/api/v1/crm/activities`
- `/api/v1/crm/timeline`
- `/api/v1/crm/health`
- `/api/v1/business-development/leads`
- `/api/v1/business-development/opportunities`
- `/api/v1/business-development/proposals`
- `/api/v1/business-development/deals`
- `/api/v1/documents`
- `/api/v1/notifications`
- `/api/v1/integrations`
- `/api/v1/ai`
- `/api/v1/audit`

## Permission model

Move beyond `admin` and `user`.

Examples:

- `group.view`
- `users.manage`
- `projects.view`
- `projects.edit`
- `tasks.assign`
- `crm.view`
- `crm.edit`
- `crm.private_relationships.view`
- `business_development.manage`
- `finance.manage`
- `documents.manage`
- `integrations.manage`
- `audit.view`

Permissions should be scoped to group, subsidiary, department, account, project, or self.

## Validation standard

Every mutating route needs schema validation and relationship checks.

Examples:

- Project cannot complete with open tasks.
- Task assignee must be an active user.
- Opportunity cannot be won without required account/deal fields.
- Private relationship fields require permission and audit reason.

## Compatibility policy

Do not remove `/api/entities` yet. Add `/api/v1`, migrate page by page, then lock down generic writes after domain services are complete.
