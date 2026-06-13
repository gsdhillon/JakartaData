package com.grove.task;

import com.grove.core.security.SecurityService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.net.URI;
import java.util.List;

@Path("/tasks")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TaskResource {

    @Inject
    private TaskService taskService;

    @Inject
    private SecurityService securityService;

    @POST
    public Response create(
            @Valid TaskRequestDto request,
            @HeaderParam("Authorization") String authorizationHeader,
            @HeaderParam("X-User-Id") Long loggedInUserId
    ) {
        TaskResponseDto savedTask = taskService.create(request, requireUserId(authorizationHeader, loggedInUserId));

        return Response.created(URI.create("/api/tasks/" + savedTask.getId()))
                .entity(savedTask)
                .build();
    }

    @GET
    public List<TaskResponseDto> findAll(@HeaderParam("Authorization") String authorizationHeader) {
        securityService.requireUserId(authorizationHeader);
        return taskService.findAll();
    }

    @GET
    @Path("/{id}")
    public TaskResponseDto findById(
            @HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Long id
    ) {
        securityService.requireUserId(authorizationHeader);
        return taskService.findById(id);
    }

    @PUT
    @Path("/{id}")
    public TaskResponseDto update(
            @PathParam("id") Long id,
            @Valid TaskRequestDto request,
            @HeaderParam("Authorization") String authorizationHeader,
            @HeaderParam("X-User-Id") Long loggedInUserId
    ) {
        return taskService.update(id, request, requireUserId(authorizationHeader, loggedInUserId));
    }

    @PATCH
    @Path("/{id}/complete")
    public TaskResponseDto markCompleted(
            @PathParam("id") Long id,
            @HeaderParam("Authorization") String authorizationHeader,
            @HeaderParam("X-User-Id") Long loggedInUserId
    ) {
        return taskService.markCompleted(id, requireUserId(authorizationHeader, loggedInUserId));
    }

    @POST
    @Path("/{id}/actions")
    public TaskResponseDto addAction(
            @PathParam("id") Long id,
            @Valid TaskActionRequestDto request,
            @HeaderParam("Authorization") String authorizationHeader,
            @HeaderParam("X-User-Id") Long loggedInUserId
    ) {
        return taskService.addAction(id, request, requireUserId(authorizationHeader, loggedInUserId));
    }

    @DELETE
    @Path("/{id}")
    public Response delete(
            @PathParam("id") Long id,
            @HeaderParam("Authorization") String authorizationHeader,
            @HeaderParam("X-User-Id") Long loggedInUserId
    ) {
        taskService.delete(id, requireUserId(authorizationHeader, loggedInUserId));
        return Response.noContent().build();
    }

    private Long requireUserId(String authorizationHeader, Long loggedInUserId) {
        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            return parseLong(securityService.requireUserId(authorizationHeader));
        }

        if (loggedInUserId == null) {
            throw new BadRequestException("Authorization bearer token is required.");
        }

        return loggedInUserId;
    }

    private Long parseLong(String value) {
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException exception) {
            throw new BadRequestException("Current task module requires a numeric user id.");
        }
    }
}
