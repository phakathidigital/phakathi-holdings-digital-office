# Cleanup / Audit Prompt

You are auditing the "Phakathi Flow" codebase — a React 18 + Tailwind CSS + Vite single-page application built on the Base44 BaaS platform. The app is an employee experience, operations, and intelligence platform with 40+ pages, 34 entities, and 100+ components organized into eight navigation hubs (Home, Work, Collaboration, People, Operations, Company, Insights, Account).

Perform a comprehensive codebase audit and produce a prioritized cleanup report. Do NOT make any changes yet — only analyze and report.

## Audit Areas

### A. Dead Code & Unused Imports
- Scan every file in src/pages, src/components, src/lib, src/hooks, and src/utils for unused imports, unused variables, and unreferenced files.
- Identify any page components imported in App.jsx that no longer exist, and any page files that exist but are not routed.
- Flag any entity JSON schemas in src/entities that are not referenced by any page or component.
- Flag any components that are imported nowhere.

### B. Import Path Consistency
- Verify all imports use the @ alias consistently (e.g., @/components/ui, @/api/base44Client, @/utils).
- Flag any relative imports (../../) that should use the alias.
- Flag any imports that reference files that don't exist (broken imports that would cause build failures).

### C. Entity Schema Integrity
- For each entity in src/entities/*.json, verify the schema is valid JSON with "name", "type", "properties", and "required" fields.
- Flag any entity whose fields are referenced in pages/components but don't exist in the schema (mismatched field names).
- Flag any enum values used in code that don't match the schema's enum arrays.
- Verify no entity stores large content (base64, blobs) directly in fields — file URLs should be used instead.

### D. Duplicate & Overlapping Logic
- Identify duplicate utility functions across lib/ and utils/ that do the same thing.
- Identify duplicate API call patterns that could be extracted into shared hooks.
- Flag any page that duplicates significant logic from another page (e.g., two pages both computing team performance stats independently).

### E. Component Size & Structure
- List any component or page file exceeding 300 lines and recommend splitting into sub-components.
- List any component file that contains multiple unrelated components (should be separate files).

### F. Styling Consistency
- Flag any hardcoded color values (bg-[#hex], inline style with hex colors) that should use Tailwind theme tokens (bg-primary, bg-secondary, etc.).
- Flag any dynamic Tailwind class names (bg-${color}-500) that would be purged by the build.
- Verify index.css tokens and tailwind.config.js mappings are in sync.

### G. Routing & Navigation
- Verify every route in App.jsx has a corresponding page file and vice versa.
- Verify the sidebar navigation in Layout.jsx matches the routes in App.jsx (no dead links, no missing links).
- Confirm the "/" route points to Dashboard as the landing page.

### H. Security & Data Access
- Flag any entity operation that should be admin-only but isn't guarded.
- Flag any backend function that doesn't call base44.auth.me() before performing operations.
- Flag any place where base44.asServiceRole is used without verifying admin role first.

## Output Format
Produce a markdown report with these sections, each containing a numbered list of findings:
- File path
- Line number (if applicable)
- Issue description
- Severity (Critical / High / Medium / Low)
- Recommended fix

End with a summary table: count of issues by severity, and the top 5 fixes to prioritize.