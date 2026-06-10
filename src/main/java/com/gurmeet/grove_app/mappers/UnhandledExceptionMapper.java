package com.gurmeet.grove_app.mappers;

import com.gurmeet.grove_app.REST;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.List;

@Provider
public class UnhandledExceptionMapper implements ExceptionMapper<Throwable> {

    @Inject
    private REST rest;

    @Override
    public Response toResponse(Throwable exception) {
        int status = Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();

        return rest.error(status, List.of("Internal server error. Check server logs for details."));
    }
}
