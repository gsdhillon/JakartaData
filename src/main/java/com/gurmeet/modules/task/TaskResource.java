package com.gurmeet.modules.task;

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

    @POST
    public Response create(@Valid TaskRequestDto request, @HeaderParam("X-User-Id") Long loggedInUserId) {
        TaskResponseDto savedTask = taskService.create(request, requireUserId(loggedInUserId));

        return Response.created(URI.create("/api/tasks/" + savedTask.getId()))
                .entity(savedTask)
                .build();
    }

    @GET
    public List<TaskResponseDto> findAll() {
        return taskService.findAll();
    }

    @GET
    @Path("/{id}")
    public TaskResponseDto findById(@PathParam("id") Long id) {
        return taskService.findById(id);
    }

    @PUT
    @Path("/{id}")
    public TaskResponseDto update(
            @PathParam("id") Long id,
            @Valid TaskRequestDto request,
            @HeaderParam("X-User-Id") Long loggedInUserId
    ) {
        return taskService.update(id, request, requireUserId(loggedInUserId));
    }

    @PATCH
    @Path("/{id}/complete")
    public TaskResponseDto markCompleted(@PathParam("id") Long id, @HeaderParam("X-User-Id") Long loggedInUserId) {
        return taskService.markCompleted(id, requireUserId(loggedInUserId));
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id, @HeaderParam("X-User-Id") Long loggedInUserId) {
        taskService.delete(id, requireUserId(loggedInUserId));
        return Response.noContent().build();
    }

    private Long requireUserId(Long loggedInUserId) {
        if (loggedInUserId == null) {
            throw new BadRequestException("X-User-Id header is required.");
        }

        return loggedInUserId;
    }
}
