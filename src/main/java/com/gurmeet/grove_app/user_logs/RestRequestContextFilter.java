package com.gurmeet.grove_app.user_logs;

import com.gurmeet.grove_app.security.SecurityService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class RestRequestContextFilter implements ContainerRequestFilter, ContainerResponseFilter {

    @Inject
    private SecurityService securityService;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String authorizationHeader = requestContext.getHeaderString("Authorization");
        String sessionId = securityService.optionalSessionId(authorizationHeader).orElse(null);
        String req = requestContext.getUriInfo().getPath(false);

        RestRequestContext.set(new RestRequestContext.RestRequest(
                sessionId,
                req == null || req.isBlank() ? "/" : req,
                requestContext.getMethod()
        ));
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) throws IOException {
        RestRequestContext.clear();
    }
}
