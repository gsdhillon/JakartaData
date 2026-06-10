# Jakarta Data Person Boilerplate

Reusable Jakarta EE + Grove frontend starter with JWT login, first-admin bootstrap, password change, logout, avatar/header layout, and an included `Person` module.

## Strategy

The reusable backend security code lives in:

```text
src/main/java/com/gurmeet/application/security
```

Security does not depend on the `Person` entity. It depends on this small contract:

```text
AuthUserStore -> supplies users to login, bootstrap, password change, and JWT validation
AuthUser      -> generic logged-in user shape: id, name, role, avatar, password, passwordChangeRequired
```

The included `Person` module wires the `Person` table to security through:

```text
src/main/java/com/gurmeet/modules/person/PersonAuthUserStore.java
```

Look for these code comments when customizing:

```text
BOILERPLATE-AUTH-STORE       Backend interface to implement when replacing Person
BOILERPLATE-REPLACE-PERSON   Default Person-to-AuthUser mapping example
BOILERPLATE-FRONTEND-AUTH    Frontend hook for authToken/loggedInUser/role checks
BOILERPLATE-FRONTEND-PAGES   Frontend place to register custom pages/menu items
```

## Database Requirement

The application supports an empty user table. It does not support running without a working database.

Required startup condition:

```text
Database connection works
JPA can create or access the mapped tables
Person table may be empty
```

This project is configured for Option A: JPA/EclipseLink creates or extends mapped tables using `persistence.xml`.

Current Payara JDBC resource expected by the project:

```text
jdbc/personDS
```

Current local MySQL defaults used by the scripts:

```text
Database: person
Username: ishjyot
Password: fw0r
URL:      jdbc:mysql://localhost:3306/person
Pool:     personPool
```

Create the database/user if needed:

```sql
CREATE DATABASE IF NOT EXISTS person;
CREATE USER IF NOT EXISTS 'ishjyot'@'localhost' IDENTIFIED BY 'fw0r';
GRANT CREATE, ALTER, SELECT, INSERT, UPDATE, DELETE ON person.* TO 'ishjyot'@'localhost';
FLUSH PRIVILEGES;
```

## Initial Use With Included Person Module

For a new clone, keep the included `Person` module as the default user store.

Flow:

```text
1. Configure database and Payara JDBC resource.
2. Build and deploy the app.
3. Bootstrap the first SUPER-ADMIN while no users exist.
4. Login using the returned user id and bootstrap password.
5. Use the UI to create ADMIN/USER accounts.
```

Build and deploy:

```bat
mvn clean package
payara
jdbc
deploy
```

Application URL:

```text
http://localhost:8080/jakarta-data-person/
```

Bootstrap endpoint:

```text
POST /api/security/bootstrap-admin
```

Sample body:

```json
{
  "name": "Admin User",
  "designation": "Administrator",
  "email": "admin@example.com",
  "gender": "Female",
  "dob": "2000-01-01",
  "mobileNo": "9999999999",
  "password": "changeit"
}
```

Bootstrap creates only `SUPER-ADMIN`. It is allowed only when no users exist.

## Replacing Person With Employee, Customer, Or Another User Table

If your application uses another table, create your own implementation of:

```text
com.gurmeet.grove_app.security.AuthUserStore
```

Example names:

```text
EmployeeAuthUserStore implements AuthUserStore
CustomerAuthUserStore implements AuthUserStore
AccountAuthUserStore implements AuthUserStore
```

Your implementation must map your entity to `AuthUser`:

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

## Frontend Custom Modules

Reusable frontend pieces are split like this:

```text
src/main/web/grove_lib             reusable Grove UI/runtime components
src/main/web/grove_app/security    reusable login/logout/change-password API and pages
src/main/web/grove_app/user_logs   reusable user login/error log pages
src/main/web/grove_app/AppContext.js reusable session/auth context
src/main/web/App.js                application composition root
src/main/web/modules               custom application modules
```

Application programmers normally edit only:

```text
src/main/web/App.js
src/main/web/modules/*
```

To add a page/menu item, import your page in `App.js` and add it to `menuPages`. Search for:

```text
BOILERPLATE-FRONTEND-PAGES
```

Custom modules should read auth state through `useAuth()`:

```js
import { useAuth } from "../../grove_app/AppContext.js";

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
src/main/java/com/gurmeet/application/security/UserAccessPolicy.java
```

## Development Commands

```bat
mvn clean package   build backend and web app
payara              start Payara
jdbc                configure JDBC resource
deploy              build and deploy exploded app
web                 sync frontend-only changes
```
