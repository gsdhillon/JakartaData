# Grove

Jakarta EE + Grove frontend application with JWT login, first-admin bootstrap, and modular `Person` and `Task` features.

## Database

The app expects this Payara JDBC resource:

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

Configure the Payara JDBC resource:

```bat
windows\jdbc
```

## Package And Deploy

Start Payara:

```bat
payara
```

Build and deploy:

```bat
deploy
```

`deploy.bat` runs `mvn clean package`, undeploys the existing `grove` app if needed, deploys `target\grove`, and opens:

```text
http://localhost:8080/grove/
```

For frontend-only changes after a deployment:

```bat
web
```

## Bootstrap Admin

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

Bootstrap creates only the first `SUPER-ADMIN`. It works only while no users exist.

## Add Or Remove Existing Modules

`core` is always included.

Backend module registration:

```text
src/main/java/com/grove/core/ModuleRegistry.java
```

Frontend page registration:

```text
src/main/web/App.js
```

To include `Task`, keep `"task"` in `ModuleRegistry.java` and keep the `TaskList` import/menu entry in `App.js`.

To exclude `Task`, remove `"task"` from `ModuleRegistry.java`, then remove the `TaskList` import and menu entry from `App.js`, then run:

```bat
deploy
```

Current limitation: this disables Task REST/UI registration, but it does not physically remove Task code or its JPA entity from the WAR yet.

## More Notes

Design and implementation notes live in:

```text
docs\Notes.md
```
