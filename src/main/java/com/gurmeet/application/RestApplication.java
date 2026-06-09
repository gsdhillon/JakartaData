package com.gurmeet.application;

import com.gurmeet.application.mappers.PersistenceExceptionMapper;
import com.gurmeet.application.mappers.UnhandledExceptionMapper;
import com.gurmeet.application.mappers.ValidationErrorsMapper;
import com.gurmeet.application.mappers.WebApplicationExceptionMapper;
import com.gurmeet.modules.person.PersonResource;
import com.gurmeet.application.security.SecurityResource;
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
                ValidationErrorsMapper.class,
                WebApplicationExceptionMapper.class,
                PersistenceExceptionMapper.class,
                UnhandledExceptionMapper.class
        );
    }
}
