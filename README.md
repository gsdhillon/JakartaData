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

The `payara` Maven profile configures this datasource automatically with `asadmin`:

```text
URL: jdbc:mysql://localhost:3306/person
Username: ishjyot
Password: fw0r
```

It also installs the MySQL JDBC driver into the Payara domain.

## Build

```bash
mvn clean package
```

Deploy `target/jakarta-data-person.war` to a Jakarta EE 11 server that supports Jakarta Data.

## Build, Deploy, and Open on Payara

```bash
mvn package -Ppayara
```

This starts Payara, configures `jdbc/personDS`, deploys the WAR, and opens:

```text
http://localhost:8080/jakarta-data-person/
```
