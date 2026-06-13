package com.grove.core.mappers;

import com.grove.core.REST;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.List;

@Provider
public class WebApplicationExceptionMapper implements ExceptionMapper<WebApplicationException> {

    @Inject
    private REST rest;

    @Override
    public Response toResponse(WebApplicationException exception) {
        int status = exception.getResponse().getStatus();
        String message = exception.getMessage();

        if (message == null || message.isBlank()) {
            message = Response.Status.fromStatusCode(status).getReasonPhrase();
        }

        return rest.error(status, List.of(message));
    }
}
