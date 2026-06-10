package com.gurmeet.grove_app.security.bootstrap;

import com.gurmeet.grove_app.security.AuthUser;
import com.gurmeet.grove_app.security.AuthUserStore;
import com.gurmeet.grove_app.security.PasswordService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class BootstrapAdminService {

    private AuthUserStore authUserStore;
    private PasswordService passwordService;

    public BootstrapAdminService() {
    }

    @Inject
    public BootstrapAdminService(AuthUserStore authUserStore, PasswordService passwordService) {
        this.authUserStore = authUserStore;
        this.passwordService = passwordService;
    }

    public synchronized AuthUser createFirstSuperAdmin(BootstrapAdminRequest request) {
        if (authUserStore.hasUsers()) {
            throw new ClientErrorException(
                    "Bootstrap admin can be created only when no users exist.",
                    Response.Status.CONFLICT
            );
        }

        return authUserStore.createBootstrapAdmin(request, passwordService.hashPassword(request.getPassword()));
    }
}
