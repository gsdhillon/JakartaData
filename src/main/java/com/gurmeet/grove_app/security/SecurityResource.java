package com.gurmeet.grove_app.security;

import com.gurmeet.grove_app.security.bootstrap.BootstrapAdminRequest;
import com.gurmeet.grove_app.security.bootstrap.BootstrapAdminService;
import com.gurmeet.grove_app.security.login.ChangePasswordRequest;
import com.gurmeet.grove_app.security.login.LoginRequest;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.Context;

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
    public AuthResponse login(@Valid LoginRequest request, @Context HttpServletRequest httpRequest) {
        return securityService.login(request, clientIp(httpRequest));
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
    public Response logout(@HeaderParam("Authorization") String authorizationHeader) {
        securityService.logout(authorizationHeader);
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

    private String clientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            for (String candidate : forwardedFor.split(",")) {
                String ipv4 = ipv4Of(candidate);

                if (ipv4 != null) {
                    return ipv4;
                }
            }
        }

        String realIp = ipv4Of(request.getHeader("X-Real-IP"));

        if (realIp != null) {
            return realIp;
        }

        String remoteAddr = request.getRemoteAddr();
        String remoteIpv4 = ipv4Of(remoteAddr);

        return remoteIpv4 == null ? remoteAddr : remoteIpv4;
    }

    private String ipv4Of(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String ip = value.trim();

        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }

        if (ip.startsWith("::ffff:")) {
            ip = ip.substring("::ffff:".length());
        }

        return ip.matches("\\d{1,3}(\\.\\d{1,3}){3}")
                ? ip
                : null;
    }
}
