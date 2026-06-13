@echo off

asadmin list-applications
asadmin list-libraries --type common

mvn -f "%~dp0..\pom.xml" package

asadmin add-library --type common "%~dp0..\target\grove\WEB-INF\lib\mysql-connector-j-9.7.0.jar"
asadmin restart-domain domain1

asadmin create-jdbc-connection-pool --restype javax.sql.XADataSource --datasourceclassname com.mysql.cj.jdbc.MysqlXADataSource --property serverName=localhost:portNumber=3306:databaseName=person:user=ishjyot:password=fw0r:useSSL=false:allowPublicKeyRetrieval=true personPool
asadmin create-jdbc-resource --connectionpoolid personPool jdbc/personDS
asadmin ping-connection-pool personPool
