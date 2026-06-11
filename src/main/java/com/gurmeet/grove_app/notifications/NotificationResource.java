package com.gurmeet.grove_app.notifications;

import com.gurmeet.grove_app.security.AuthUser;
import com.gurmeet.grove_app.security.SecurityService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/notifications")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NotificationResource {

    @Inject
    private SecurityService securityService;

    @Inject
    private NotificationService notificationService;

    @GET
    public List<NotificationDto> findAll(@HeaderParam("Authorization") String authorizationHeader) {
        return notificationService.findAll(requireUserId(authorizationHeader));
    }

    @POST
    @Path("/test")
    public NotificationDto createTest(
            @HeaderParam("Authorization") String authorizationHeader,
            NotificationRequest request
    ) {
        AuthUser actor = securityService.requireUser(authorizationHeader);

        return notificationService.create(actor.getId(), request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(
            @HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") String id
    ) {
        notificationService.delete(requireUserId(authorizationHeader), id);
        return Response.noContent().build();
    }

    @DELETE
    public Response deleteAll(@HeaderParam("Authorization") String authorizationHeader) {
        notificationService.deleteAll(requireUserId(authorizationHeader));
        return Response.noContent().build();
    }

    private String requireUserId(String authorizationHeader) {
        return securityService.requireUser(authorizationHeader).getId();
    }
}
