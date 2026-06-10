package com.gurmeet.grove_app.user_logs;

import com.gurmeet.grove_app.security.AuthUser;
import com.gurmeet.grove_app.security.SecurityService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/user-logs")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserLogResource {

    @Inject
    private SecurityService securityService;

    @Inject
    private UserLogService userLogService;

    @GET
    @Path("/logins")
    public List<UserLoginDto> findLogins(@HeaderParam("Authorization") String authorizationHeader) {
        AuthUser actor = securityService.requireUser(authorizationHeader);

        return userLogService.findLogins(actor);
    }

    @GET
    @Path("/logins/{sessionId}/errors")
    public List<UserErrorDto> findErrors(
            @HeaderParam("Authorization") String authorizationHeader,
            @PathParam("sessionId") String sessionId
    ) {
        AuthUser actor = securityService.requireUser(authorizationHeader);

        return userLogService.findErrors(actor, sessionId);
    }
}
