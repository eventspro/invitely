# CLAUDE.md

You are working on the 4ever.am wedding platform.

Before making changes:
1. Read this file first.
2. Read only the relevant docs from docs/ai-context/.
3. Inspect existing code before editing.
4. Do not rewrite unrelated systems.
5. Make minimal focused changes.
6. Do not create unrelated scripts, reports, or test artifacts.
7. Always run `npx tsc --noEmit` before reporting done.
8. Report changed files, tests run, and remaining risks.

General product rules:
- Mobile experience is priority.
- Keep design elegant, premium, clean, and professional.
- Avoid cartoonish visuals.
- Avoid hardcoded visible template text.
- Builder V2 should control editable text, images, backgrounds, icons, sections, and language values.
- Armenian text must not be auto-generated. Use English defaults and allow Armenian to be edited manually.
- Do not break existing templates.
- Do not touch unrelated files.

Builder V2 rules:
- Every visible template text must be editable.
- Every image/background image should be replaceable.
- Icons should be editable through a professional icon dropdown.
- Repeated details/items should be editable, removable, and reorderable where possible.
- Edits must update preview live.
- English and Armenian content must be separate.
- Missing translations should fallback safely.

Deployment rules:
- Vercel Hobby cannot use frequent cron.
- Do not add every-minute Vercel cron.
- Task reminders are triggered by external cron through `/api/cron/task-reminders`.
- Keep `CRON_SECRET` protection.