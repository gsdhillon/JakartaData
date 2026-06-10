package com.gurmeet.grove_app.mappers;

import com.gurmeet.grove_app.REST;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.List;

@Provider
public class PersistenceExceptionMapper implements ExceptionMapper<PersistenceException> {

    @Inject
    private REST rest;

    @Override
    public Response toResponse(PersistenceException exception) {
        int status = Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();

        return rest.error(status, List.of("Database operation failed. Check server logs for details."));
    }
}
