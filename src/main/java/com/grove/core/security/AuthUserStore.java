package com.grove.core.security;

import com.grove.core.security.bootstrap.BootstrapAdminRequest;

import java.util.Optional;

public interface AuthUserStore {

    Optional<AuthUser> findById(String id);

    Optional<AuthUser> findByLoginId(String loginId);

    boolean hasUsers();

    // BOILERPLATE-AUTH-STORE: implement this in the domain module that owns application users.
    AuthUser createBootstrapAdmin(BootstrapAdminRequest request, String passwordHash);

    AuthUser changePassword(String id, String passwordHash);
}
