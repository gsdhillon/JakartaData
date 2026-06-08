# Codex Collaboration Notes

This document records selected user requests and the core implementation guidance from Codex for future reference and training. The wording is polished for clarity while preserving the technical intent.

## Responsiveness

### Conversation Summary

**User request:** Make the frontend responsive for both mobile and desktop using media queries instead of Bootstrap responsive utility classes. Manage the responsive behavior as much as possible at the framework level inside `src/main/web/lib`, especially in reusable components such as `Form`, `Table`, and `CenterPanel`. First make a plan and suggest the simplest, cleanest strategy before implementing anything.

**Codex response:** Use framework-level responsive contracts instead of page-specific CSS. Feature modules should continue using generic components such as `Page`, `Form`, `Table`, and `CenterPanel`, while shared CSS and component markup inside `lib` should decide how those components adapt on mobile. The simplest approach is CSS-first: define Grove classes and media queries in `lib/styles.css`, then add component metadata only where CSS alone is insufficient.

**User request:** Proceed with implementation using the following generic mobile rules:

- All menu items should move under a hamburger icon beside the avatar.
- Form side sections, such as photo upload/preview, should move below the main fields.
- Form fields should still show label and input side by side on mobile.
- `CenterPanel` toolbar should use two rows: the top row for its own controls such as page path, back, and maximize; the second row for icons/actions provided by the page through the hook.
- `Table` columns should accept an `essential` prop, spelled correctly, defaulting to `true`.
- On mobile, tables should show only essential columns.
- For the demo person table, email, mobile number, and designation should be marked `essential: false`.
- Table row actions should collapse under one icon on mobile.
- Header should hide the subtitle on mobile.

**Codex response:** Implement the mobile behavior as reusable framework rules:

- `Header` gets a mobile hamburger menu beside the avatar.
- `AppShell` passes main menu items to the header for mobile display while retaining the desktop side menu.
- `Form` keeps label/input side-by-side on mobile and moves aside content below the main fields through the existing grid collapse.
- `CenterPanel` separates its toolbar into a system row for page path/back/maximize and an action row for page-provided hook actions.
- `Table` supports an `essential` column property, defaulting to visible. Columns marked `essential: false` are hidden on mobile.
- `Table` row actions remain inline on desktop and collapse into a three-dot action menu on mobile.
- `Header` subtitle is hidden through the mobile media query.

**User request:** For the demo person table, mark email, mobile number, and designation as non-essential fields.

**Codex response:** Mark those columns with `essential: false` in `PersonTable`, while keeping the default behavior for all other table columns as essential.
