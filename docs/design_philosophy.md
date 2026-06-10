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
