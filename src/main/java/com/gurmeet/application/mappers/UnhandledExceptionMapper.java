package com.gurmeet.application;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.List;

@Provider
public class UnhandledExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        int status = Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();

        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(List.of("Internal server error. Check server logs for details."))
                .build();
    }
}
