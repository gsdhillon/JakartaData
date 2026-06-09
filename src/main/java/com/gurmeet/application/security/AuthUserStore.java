package com.gurmeet.application.security;

import com.gurmeet.application.security.bootstrap.BootstrapAdminRequest;

import java.util.Optional;

public interface AuthUserStore {

    Optional<AuthUser> findById(Long id);

    boolean hasUsers();

    // BOILERPLATE-AUTH-STORE: implement this in your user module when replacing the included Person module.
    AuthUser createBootstrapAdmin(BootstrapAdminRequest request, String passwordHash);

    AuthUser changePassword(Long id, String passwordHash);
}
