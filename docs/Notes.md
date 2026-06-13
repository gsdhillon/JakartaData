# Notes

## Design Strategy

The reusable backend security code lives in:

```text
src/main/java/com/grove/core/security
```

Security does not depend on the `Person` entity. It depends on this small contract:

```text
AuthUserStore -> supplies users to login, bootstrap, password change, and JWT validation
AuthUser      -> generic logged-in user shape: id, name, role, avatar, password, passwordChangeRequired
```

The included `Person` module wires the `Person` table to security through:

```text
src/main/java/com/grove/person/PersonAuthUserStore.java
```

Useful code comments when customizing:

```text
BOILERPLATE-AUTH-STORE       Backend interface to implement when replacing Person
BOILERPLATE-REPLACE-PERSON   Default Person-to-AuthUser mapping example
BOILERPLATE-FRONTEND-AUTH    Frontend hook for authToken/loggedInUser/role checks
BOILERPLATE-FRONTEND-PAGES   Frontend place to register custom pages/menu items
```

## Replacing Person

If the application uses another table for users, create an implementation of:

```text
com.grove.core.security.AuthUserStore
```

Example names:

```text
EmployeeAuthUserStore implements AuthUserStore
CustomerAuthUserStore implements AuthUserStore
AccountAuthUserStore implements AuthUserStore
```

The implementation must map the custom entity to `AuthUser`:

```text
id -> AuthUser.id
name/displayName -> AuthUser.name
role -> AuthUser.role
passwordHash -> AuthUser.password
avatar/photo -> AuthUser.avatar
passwordChangeRequired -> AuthUser.passwordChangeRequired
```

Then remove or disable the included `PersonAuthUserStore` so CDI has only one `AuthUserStore` bean.

Use `PersonAuthUserStore.java` as the reference implementation. Search for:

```text
BOILERPLATE-REPLACE-PERSON
```

## Module Strategy

The app is organized as a modular monolith:

```text
src/main/java/com/grove/core      shared backend infrastructure
src/main/java/com/grove/person    Person feature module
src/main/java/com/grove/task      Task feature module
src/main/web/grove/core           shared frontend application code
src/main/web/grove/person         Person frontend module
src/main/web/grove/task           Task frontend module
src/main/web/grove_lib            reusable Grove UI/runtime components
```

`core` is always included. Backend REST resources are enabled in:

```text
src/main/java/com/grove/core/ModuleRegistry.java
src/main/java/com/grove/core/RestApplication.java
```

Frontend pages are selected directly in:

```text
src/main/web/App.js
```

For `core + person`, remove `task` from `ModuleRegistry.java`, then remove the `TaskList` import and menu entry from `App.js` before packaging.

Current limitation: this is runtime registration, not physical package exclusion. `persistence.xml` still controls JPA entity registration, and Task classes may still exist in the WAR until build-time module packaging is added.

## Frontend Custom Modules

Application programmers normally edit:

```text
src/main/web/App.js
src/main/web/grove/*
```

To add a page/menu item, import the page in `App.js` and add it to `menuPages`. Search for:

```text
BOILERPLATE-FRONTEND-PAGES
```

Custom modules should read auth state through `useAuth()`:

```js
import { useAuth } from "../core/AppContext.js";

const MyPage = () => {
    const { authToken, loggedInUser, hasAnyRole, isSelf } = useAuth();

    if (!hasAnyRole(["ADMIN", "SUPER-ADMIN"])) {
        return "Not allowed";
    }

    return "Hello " + loggedInUser.name;
};
```

Search for:

```text
BOILERPLATE-FRONTEND-AUTH
```

## Roles

Built-in roles:

```text
SUPER-ADMIN
ADMIN
USER
```

Default rules:

```text
SUPER-ADMIN can create ADMIN and USER accounts.
ADMIN can create USER accounts.
USER can update only their own allowed fields.
```

Role checks live in:

```text
src/main/java/com/grove/core/security/UserAccessPolicy.java
```

## Handling of Data Types

### Date Only
Use `LocalDate` in Java for date-only values such as DOB.

- Frontend: `Input({ type: "date" })`
- JSON value: `yyyy-MM-dd`
- Java type: `LocalDate`
- DB type: `DATE`
- Validation example: `@Past` for DOB

This avoids string parsing problems and keeps sorting, validation, and database queries correct.

Entity example:

```java
@Past(message = "DOB must be in the past")
private LocalDate dob;
```

Frontend form example:

```js
Input({
    label: "DOB:",
    name: "dob",
    type: "date"
})
```

Native browser date inputs require the internal value to be `yyyy-MM-dd`. The browser displays the value according to the user's Windows/browser locale. Do not manually format the value before putting it in the input.

### Date And Time
Use `LocalDateTime` when the user enters a local date and time, such as an appointment.

- Frontend: `Input({ type: "datetime-local" })`
- JSON value: `yyyy-MM-ddTHH:mm`
- Java type: `LocalDateTime`
- DB type: `DATETIME`

Use this for business date/time values where timezone conversion is not the main concern.

Entity example:

```java
@Column(name = "appointment_at")
private LocalDateTime appointmentAt;
```

Frontend form example:

```js
Input({
    label: "Appointment:",
    name: "appointmentAt",
    type: "datetime-local"
})
```

Native browser datetime-local inputs require the internal value to be `yyyy-MM-ddTHH:mm`. The browser displays it according to the user's Windows/browser locale. Do not manually format the value before putting it in the input.

### Audit Timestamp
Use `Instant` for server or database managed audit timestamps such as `updatedAt`.

- Java type: `Instant`
- DB type: `TIMESTAMP`
- Suggested DB behavior: `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- Frontend: read-only display field
- Do not copy or accept this value from client update payloads

Entity example:

```java
@Column(
        name = "updated_at",
        insertable = false,
        updatable = false,
        columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
)
private Instant updatedAt;
```

Frontend form example:

```js
Input({
    label: "Updated At:",
    name: "updatedAt",
    readOnly: true,
    type: "datetime-local"
})
```

`Instant` values from the backend may include timezone information, for example `2026-06-04T09:00:00Z`. A `datetime-local` input cannot accept the trailing `Z`, so convert the `Instant` to local `yyyy-MM-ddTHH:mm` before showing it in the input.

### Frontend Fetch And Submit Rules
Use ISO values internally in JavaScript state. Let native HTML inputs display them according to the user's locale.

On fetch from backend:

- `LocalDate` usually already arrives as `yyyy-MM-dd`; use as-is.
- `LocalDateTime` usually arrives as `yyyy-MM-ddTHH:mm:ss`; trim to `yyyy-MM-ddTHH:mm` for `datetime-local`.
- `Instant` may arrive as `yyyy-MM-ddTHH:mm:ssZ`; convert to browser local `yyyy-MM-ddTHH:mm` for read-only display.

Current normalization pattern:

```js
const toDateTimeLocal = value => {
    if (!value) {
        return "";
    }

    const text = String(value);

    return text.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(text)
        ? instantToDateTimeLocal(text)
        : text.slice(0, 16);
};

const normalizePerson = person => ({
    ...createEmptyPerson(),
    ...(person || {}),
    appointmentAt: toDateTimeLocal(person?.appointmentAt),
    updatedAt: toDateTimeLocal(person?.updatedAt),
    id: person?.id ?? ""
});
```

Before POST/PUT to backend:

- Send `LocalDate` as `yyyy-MM-dd`.
- Send `LocalDateTime` as `yyyy-MM-ddTHH:mm`.
- Convert blank date/datetime fields to `null`; do not send empty strings.
- Do not send database-managed fields such as `updatedAt`.

Current payload pattern:

```js
const personPayload = person => {
    const payload = normalizePerson(person);

    if (payload.id === "") {
        delete payload.id;
    }

    if (payload.dob === "") {
        payload.dob = null;
    }

    if (payload.appointmentAt === "") {
        payload.appointmentAt = null;
    }

    delete payload.updatedAt;

    return payload;
};
```

For table sorting, sort date and datetime columns by the raw ISO values, not by formatted display text. ISO strings sort correctly:

```js
compare: (left, right) =>
    String(left.appointmentAt || "").localeCompare(String(right.appointmentAt || ""))
```

For table display, either show raw ISO values or use a display formatter. Native input display and table display are separate concerns.

### Photo Field
The current project stores `photo` as a full browser data URL string for simplicity.

```java
@Lob
@Column(columnDefinition = "LONGTEXT")
private String photo;
```

Frontend value example:

```text
data:image/png;base64,...
```

This is easy to preview and download in the browser because the value can be used directly as an image `src`.

MySQL `LONGTEXT` maximum size is about 4 GB:

```text
4,294,967,295 bytes
```

For small images, storage is based on actual content size, not the maximum type size. A 50 KB image becomes about 67 KB as a base64 data URL because base64 adds about 33% overhead.

Alternative binary strategy:

```java
@Lob
@Column(columnDefinition = "MEDIUMBLOB")
private byte[] photo;
```

`MEDIUMBLOB` maximum size is about 16 MB:

```text
16,777,215 bytes
```

`byte[]` plus `MEDIUMBLOB` is more storage-efficient because it stores raw binary bytes, but it needs extra frontend/backend handling:

- Convert selected files to raw base64 or multipart upload.
- Store or infer the MIME type separately, for example `photoContentType`.
- Convert bytes back to a browser-displayable URL when showing the image.

Tradeoff:

- `String` + `LONGTEXT`: simpler, direct browser preview, about 33% larger.
- `byte[]` + `MEDIUMBLOB`: smaller and more correct binary storage, but more moving parts.

### Schema Creation And Alteration
Jakarta Data does not create or alter database tables by itself. Jakarta Data handles repository access. Table creation and alteration come from the JPA provider, which is EclipseLink in this project.

The current `persistence.xml` schema generation settings can create or extend tables from entity metadata. Adding new columns can usually work, but changing an existing column type, such as `String dob` to `LocalDate dob`, may require manual database migration if existing data is present.

Example MySQL migration:

```sql
ALTER TABLE Person MODIFY dob DATE NULL;
ALTER TABLE Person ADD appointment_at DATETIME NULL;
ALTER TABLE Person ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE Person MODIFY photo LONGTEXT;
```

### Sizing Strategy
Use Java validation and database column sizing together.

- `@Size`: validates API/entity input in Java.
- `@Column(length = ...)`: controls DB `VARCHAR` size.
- `String`: default is often `VARCHAR(255)`, but define length explicitly for important fields.
- `Long`: maps well to DB `BIGINT`; use for IDs.
- `Integer`: maps to DB `INT`; use for bounded numeric values.
- Use wrapper types like `Long` and `Integer` in entities when values can be null.
- Use primitives like `long` and `int` only when the value is always required.
- Use `@Lob` for large text, base64 photo data, or other large values.

Example:

```java
@Size(max = 254)
@Column(length = 254)
private String email;
```
