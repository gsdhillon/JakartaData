package com.gurmeet.application;

import jakarta.persistence.PersistenceException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.List;

@Provider
public class PersistenceExceptionMapper implements ExceptionMapper<PersistenceException> {

    @Override
    public Response toResponse(PersistenceException exception) {
        int status = Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();

        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(List.of("Database operation failed. Check server logs for details."))
                .build();
    }
}
