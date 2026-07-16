---
description: 
alwaysApply: true
---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:dms-project-rules -->
# DMS Project — MANDATORY Rules

This is the **Document Management & Electronic Approval System (DMS)** project.

## BEFORE writing ANY code, you MUST:
1. Read `.agents/skills/dms-tech-spec/SKILL.md` in full — it contains locked technical specs
2. Never deviate from the stack, file structure, or conventions defined there

## Key locked decisions (summary — read SKILL.md for full detail):
- **Frontend**: Next.js 16 (App Router only) + TypeScript + Tailwind CSS v4 + lucide-react
- **Backend**: NestJS + Prisma + PostgreSQL (not yet created)
- **params/searchParams**: Always `Promise<...>` — must `await` before use (Next.js 15+ breaking change)
- **CSS**: Use `@import "tailwindcss"` NOT `@tailwind base/components/utilities`
- **Delete**: Always Soft Delete (`is_deleted=true`) — never real DELETE
- **Icons**: Only `lucide-react` — no other icon libraries
- **Client Components**: Use sparingly — only when useState/useEffect/events needed
<!-- END:dms-project-rules --> Use caveman skill full
