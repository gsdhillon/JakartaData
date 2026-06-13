package com.grove.core;

import com.grove.core.mappers.PersistenceExceptionMapper;
import com.grove.core.mappers.UnhandledExceptionMapper;
import com.grove.core.mappers.ValidationErrorsMapper;
import com.grove.core.mappers.WebApplicationExceptionMapper;
import com.grove.core.notifications.NotificationResource;
import com.grove.core.user_logs.RestRequestContextFilter;
import com.grove.core.user_logs.UserLogResource;
import com.grove.person.PersonResource;
import com.grove.core.security.SecurityResource;
import com.grove.task.TaskResource;
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

import java.util.LinkedHashSet;
import java.util.Set;

@ApplicationPath("/api")
// Class name is not used in the URL. @ApplicationPath decides the REST base path.
public class RestApplication extends Application {

    @Override
    public Set<Class<?>> getClasses() {
        Set<Class<?>> resources = new LinkedHashSet<>(Set.of(
                NotificationResource.class,
                SecurityResource.class,
                UserLogResource.class,
                RestRequestContextFilter.class,
                ValidationErrorsMapper.class,
                WebApplicationExceptionMapper.class,
                PersistenceExceptionMapper.class,
                UnhandledExceptionMapper.class
        ));

        // REGISTER BACKEND MODULE RESOURCES HERE: guard each feature resource with ModuleRegistry.
        if (ModuleRegistry.isEnabled("person")) {
            resources.add(PersonResource.class);
        }

        if (ModuleRegistry.isEnabled("task")) {
            resources.add(TaskResource.class);
        }

        return resources;
    }
}
