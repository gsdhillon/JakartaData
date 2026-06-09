package com.gurmeet.application.security;

import com.gurmeet.application.security.bootstrap.BootstrapAdminRequest;
import com.gurmeet.application.security.bootstrap.BootstrapAdminService;
import com.gurmeet.application.security.login.ChangePasswordRequest;
import com.gurmeet.application.security.login.LoginRequest;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/security")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SecurityResource {

    @Inject
    private SecurityService securityService;

    @Inject
    private BootstrapAdminService bootstrapAdminService;

    @POST
    @Path("/login")
    public AuthResponse login(@Valid LoginRequest request) {
        return securityService.login(request);
    }

    @POST
    @Path("/bootstrap-admin")
    public Response bootstrapAdmin(@Valid BootstrapAdminRequest request) {
        return Response.status(Response.Status.CREATED)
                .entity(bootstrapAdminService.createFirstSuperAdmin(request))
                .build();
    }

    @POST
    @Path("/logout")
    public Response logout() {
        return Response.noContent().build();
    }

    @POST
    @Path("/change-password")
    public Response changePassword(
            @HeaderParam("Authorization") String authorizationHeader,
            @Valid ChangePasswordRequest request
    ) {
        securityService.changePassword(authorizationHeader, request);
        return Response.noContent().build();
    }
}
