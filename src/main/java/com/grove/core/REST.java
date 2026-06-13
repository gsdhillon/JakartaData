package com.grove.core;

import com.grove.core.user_logs.UserLogService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@ApplicationScoped
public class REST {
    @Inject
    private UserLogService userLogService;

    public Response error(int status, List<String> errors) {
        try {
            userLogService.recordError(errors);
        } catch (RuntimeException exception) {
            // Error logging must never replace the API error response.
        }
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(errors)
                .build();
    }
}