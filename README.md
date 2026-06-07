# Jakarta Data Person

Minimal Jakarta EE 11 project for teaching Jakarta Data first.

## Package Structure

```text
com.gurmeet
+-- application
+-- modules
    +-- person
    +-- security
    +-- task
```

## Database

The application expects this Payara JDBC resource:

```text
jdbc/personDS
```

Current local MySQL settings used by the scripts:

```text
Database: person
Username: ishjyot
Password: fw0r
URL:      jdbc:mysql://localhost:3306/person
Pool:     personPool
```

Create the database and application user in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS person;

CREATE USER IF NOT EXISTS 'ishjyot'@'localhost' IDENTIFIED BY 'fw0r';

GRANT CREATE, ALTER, SELECT, INSERT, UPDATE, DELETE
ON person.*
TO 'ishjyot'@'localhost';

FLUSH PRIVILEGES;
```

If you recreate the database during development:

```sql
DROP DATABASE IF EXISTS person;
CREATE DATABASE person;

GRANT CREATE, ALTER, SELECT, INSERT, UPDATE, DELETE
ON person.*
TO 'ishjyot'@'localhost';

FLUSH PRIVILEGES;
```

## Fresh PC Setup

Prerequisites:

```text
JDK 17+
Maven
Payara Server
MySQL Server
asadmin on PATH
```

First-time application setup:

```bat
mvn clean package
payara
jdbc
deploy
```

What each command does:

```text
mvn clean package  Builds the app and downloads runtime dependencies, including MySQL Connector/J.
payara             Starts the Payara domain.
jdbc               Installs the MySQL driver into Payara if missing, creates personPool, creates jdbc/personDS, and pings the pool.
deploy             Builds and deploys the exploded application directory. Payara and JDBC must already be ready.
```

Application URL:

```text
http://localhost:8080/jakarta-data-person/
```

## Day-To-Day Workflow

Start Payara only:

```bat
payara
```

Configure or repair JDBC resources:

```bat
jdbc
```

Deploy after Java, REST API, entity, persistence, dependency, or backend configuration changes. Payara must already be running and jdbc/personDS must already exist:

```bat
deploy
```

Sync frontend-only changes under `src/main/web`:

```bat
web
```

Then refresh the browser.

## MySQL Driver And Payara

The MySQL driver comes from Maven:

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>${mysql.connector.version}</version>
    <scope>runtime</scope>
</dependency>
```

After `mvn clean package`, Maven copies it into the exploded app:

```text
target\jakarta-data-person\WEB-INF\lib\mysql-connector-j-9.7.0.jar
```

`jdbc.bat` installs that jar into Payara common libraries using:

```bat
asadmin add-library --type common target\jakarta-data-person\WEB-INF\lib\mysql-connector-j-9.7.0.jar
```

Payara is restarted after adding the library because server-level JDBC pools need the driver on Payara's classpath.

## First User And Roles

Current roles:

```text
SUPER-ADMIN
ADMIN
USER
```

Current access model:

```text
SUPER-ADMIN can create ADMIN and USER accounts.
ADMIN can create USER accounts.
USER can update only their own allowed fields.
```

First SUPER-ADMIN bootstrap:

```text
POST /api/security/bootstrap-admin
```

This endpoint is intentionally allowed only while no users exist. Once the first user has been created, bootstrap returns an error and normal authorization rules apply.

Sample body:

```json
{
  "name": "Ishjyot Kaur",
  "designation": "Student",
  "email": "ishjyot@gmail.com",
  "gender": "Female",
  "dob": "2004-09-23",
  "mobileNo": "9920351796",
  "password": "changeit"
}
```

The endpoint always creates `SUPER-ADMIN`; it does not accept a role from the request. The password is stored as a PBKDF2 hash, not plain text.

After bootstrap, log in using the returned person `id` and the password from the request. Then use the application UI to create further `ADMIN` and `USER` accounts.

## Build

```bat
mvn clean package
```

The exploded application directory is:

```text
target\jakarta-data-person
```
