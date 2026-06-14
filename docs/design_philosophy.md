# Design Philosophy

This project is a reusable Jakarta EE + Grove application starter. Application developers should focus on business modules, not framework plumbing.

## Core Principles

- Application code should not require CSS, Bootstrap, or layout expertise.
- Responsive behavior, spacing, controls, tables, forms, dialogs, headers, and common look-and-feel are framework responsibilities.
- Application packages should stay reusable and domain-neutral wherever possible.
- Security should depend on the `AuthUser` / `AuthUserStore` contract, not on a specific table such as `Person`, `Student`, or `Employee`.
- Login should accept a generic `loginId`; each domain module decides whether that means roll number, email, mobile number, employee code, or another identifier.
- Error handling should be consistent across the app through shared mappers, request helpers, and UI feedback.
- API tapping, request/response observation, console tapping, and composition helpers are provided by the Grove Framework for developer bootstrap and debugging, keeping modules clean.
- Business modules should declare data, fields, rules, and actions; the framework should handle rendering, interaction patterns, and common UX behavior.

## Developer Goal

A developer cloning this project should be able to replace or add modules with minimal changes to the application package. Most customization should happen inside the module that owns the domain model and inside small framework contracts such as `AuthUserStore`.

## Framework Responsibility

- Page shell, navigation, header, avatar, login/logout flow.
- Form, table, input, action, dialog, and responsive layout behavior.
- REST request composition and JSON handling.
- Error display and exception mapping.
- Auth session storage, token handling, and logged-in user context.
- API/console instrumentation useful during development.

## Application Module Responsibility

- Define the domain entity and repository.
- Implement service rules and validation.
- Implement `AuthUserStore` when the module owns application users.
- Map the domain user into `AuthUser`.
- Provide module pages/actions using framework components.

The intended result is a consistent application experience with less duplicated frontend and backend infrastructure code.

## Codex Session Prompt

Use this prompt at the start of a new Codex session for this project:

```text
You are working in the Grove project, a reusable Jakarta EE + Grove application starter. Preserve the project philosophy: application modules should focus on domain data, service rules, fields, and actions; reusable framework/core code should handle cross-cutting behavior.

Follow these rules:

1. Keep look-and-feel and responsiveness at the Grove framework level.
   - Application developers should not need CSS, Bootstrap classes, media queries, spacing decisions, or layout expertise.
   - Prefer reusable components from `src/main/web/grove_lib` such as `Page`, `Form`, `Table`, `Input`, `TextArea`, `Button`, `CenterPanel`, and shared framework CSS in `src/main/web/grove_lib/styles.css`.
   - If a UI behavior must be responsive or visually consistent across modules, implement it in the framework component/CSS, not in a feature module.
   - Feature modules under `src/main/web/grove/*` should mostly declare pages, data fields, table columns, and actions using framework components.

2. Keep validation authoritative in Java Bean Validation.
   - Do not duplicate backend validation rules in frontend code.
   - Do not add frontend `maxLength`, regex checks, min/max business limits, required-field rules, or equivalent hardcoded validation unless the backend contract explicitly provides that metadata to the frontend.
   - Use `@NotBlank`, `@Size`, `@Past`, and other Bean Validation annotations on request DTOs/entities as the source of truth.
   - Database sizing and Java validation should agree where relevant, but frontend code should not become a second validation source.
   - Frontend may show informational UI, such as current text length, but it must not enforce business validation independently.

3. Keep error handling and logging as core/framework cross-cutting concerns.
   - Prefer shared exception mappers, REST helpers, request context filters, user-log services, and app-level error UI.
   - Feature controllers/pages should not build one-off error display or logging pipelines when the core/framework path can handle it.
   - API error responses should stay consistent across modules.

4. Keep security domain-neutral and core-owned.
   - Security must depend on `AuthUser` and `AuthUserStore`, not directly on a domain table such as `Person`, `Employee`, `Student`, or `Customer`.
   - Login should use a generic `loginId`; each domain module decides what that means.
   - A domain module may implement `AuthUserStore` to map its user entity into `AuthUser`.
   - Role and access policies belong in core security contracts/services unless a domain rule truly belongs to a business service.

5. Respect module boundaries.
   - Core backend infrastructure lives under `src/main/java/com/grove/core`.
   - Feature backend modules live under `src/main/java/com/grove/<module>`.
   - Shared frontend application/core code lives under `src/main/web/grove/core`.
   - Reusable frontend framework components live under `src/main/web/grove_lib`.
   - Feature frontend modules live under `src/main/web/grove/<module>`.
   - Prefer small framework contracts over coupling reusable code to a specific feature module.

6. Use framework-level developer tooling.
   - Preserve Grove REST/request observation, console tapping, API tapping, and composition helpers as framework capabilities.
   - Do not scatter debugging or request/response instrumentation through business modules.

7. Use correct backend data types and persistence contracts.
   - Use Java temporal types such as `LocalDate`, `LocalDateTime`, and `Instant` according to the business meaning.
   - Use JPA column metadata and Bean Validation together for persistent constraints.
   - Use `@Lob` for large text/base64/blob-like content when appropriate.

When making changes, first check whether the request belongs in a feature module, Grove frontend framework, backend core, or backend feature service. Choose the lowest-coupling location that preserves these principles. If a request would violate these rules, call that out and propose the framework-consistent approach before implementing.
```
