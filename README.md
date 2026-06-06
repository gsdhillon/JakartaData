# Jakarta Data Person

Minimal Jakarta EE 11 project for teaching Jakarta Data first.

## Package Structure

```text
com.example.person
├── entity
│   └── Person
├── repository
│   └── PersonRepository
└── service
    └── PersonService
```


```sql
CREATE USER 'ishjyot'@'localhost' IDENTIFIED BY 'fw0r';
GRANT CREATE ON *.* TO 'ishjyot'@'localhost';
GRANT CREATE, ALTER, SELECT, INSERT, UPDATE, DELETE
ON person.*
TO 'ishjyot'@'localhost';
FLUSH PRIVILEGES;
```


```sql
CREATE DATABASE person;
GRANT CREATE, ALTER, SELECT, INSERT, UPDATE, DELETE
ON person.*
TO 'ishjyot'@'localhost';
FLUSH PRIVILEGES;

```




## Database

Database name: `person`

MySQL user: `ishjyot`

Datasource JNDI name expected by the application: `jdbc/personDS`

```text
URL: jdbc:mysql://localhost:3306/person
Username: ishjyot
Password: fw0r
```

## Build

```bash
mvn clean package
```

Deploy `target/jakarta-data-person.war` to a Jakarta EE 11 server that supports Jakarta Data.

## Payara Workflow

Start Payara only:

```bat
payara
```

Full backend deployment:

```bat
deploy
```

This runs `mvn clean package`, recreates `jdbc/personDS`, and deploys the exploded app directory:

```text
target/jakarta-data-person
```

Frontend-only sync after editing files under `src/main/web`:

```bat
web
```

Then refresh the browser. Use `deploy` again when Java code, dependencies, REST resources, entities, or config changes.

Application URL:

```text
http://localhost:8080/jakarta-data-person/
```
