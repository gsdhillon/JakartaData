package com.gurmeet.grove_app.mappers;

import com.gurmeet.grove_app.REST;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.List;

@Provider
public class ValidationErrorsMapper implements ExceptionMapper<ConstraintViolationException> {

    @Inject
    private REST rest;

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        List<String> messages = exception.getConstraintViolations()
                .stream()
                .map(ConstraintViolation::getMessage)
                .toList();

        int status = Response.Status.BAD_REQUEST.getStatusCode();

        return rest.error(status, messages);
    }
}
