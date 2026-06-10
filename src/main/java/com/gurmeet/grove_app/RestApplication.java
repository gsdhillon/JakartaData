package com.gurmeet.grove_app;

import com.gurmeet.grove_app.mappers.PersistenceExceptionMapper;
import com.gurmeet.grove_app.mappers.UnhandledExceptionMapper;
import com.gurmeet.grove_app.mappers.ValidationErrorsMapper;
import com.gurmeet.grove_app.mappers.WebApplicationExceptionMapper;
import com.gurmeet.grove_app.user_logs.RestRequestContextFilter;
import com.gurmeet.grove_app.user_logs.UserLogResource;
import com.gurmeet.modules.person.PersonResource;
import com.gurmeet.grove_app.security.SecurityResource;
import com.gurmeet.modules.task.TaskResource;
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

import java.util.Set;

@ApplicationPath("/api")
// Class name is not used in the URL. @ApplicationPath decides the REST base path.
public class RestApplication extends Application {

    @Override
    public Set<Class<?>> getClasses() {
        return Set.of(
                PersonResource.class,
                SecurityResource.class,
                TaskResource.class,
                UserLogResource.class,
                RestRequestContextFilter.class,
                ValidationErrorsMapper.class,
                WebApplicationExceptionMapper.class,
                PersistenceExceptionMapper.class,
                UnhandledExceptionMapper.class
        );
    }
}
