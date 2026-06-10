package com.gurmeet.grove_app.security;

import jakarta.ws.rs.ForbiddenException;

public final class UserAccessPolicy {

    public static final String SUPER_ADMIN = "SUPER-ADMIN";
    public static final String ADMIN = "ADMIN";
    public static final String USER = "USER";

    private UserAccessPolicy() {
    }

    public static String normalizeRole(String role) {
        String normalizedRole = role == null || role.isBlank()
                ? USER
                : role.trim().toUpperCase();

        if (!SUPER_ADMIN.equals(normalizedRole) && !ADMIN.equals(normalizedRole) && !USER.equals(normalizedRole)) {
            throw new ForbiddenException("Invalid role: " + role);
        }

        return normalizedRole;
    }

    public static void requireCanCreate(AuthUser actor, String requestedRole, boolean passwordChangeRequired) {
        String actorRole = role(actor);
        String normalizedRequestedRole = normalizeRole(requestedRole);

        if (!SUPER_ADMIN.equals(actorRole) && !passwordChangeRequired) {
            throw new ForbiddenException("Only SUPER-ADMIN can skip forced password change.");
        }

        if (SUPER_ADMIN.equals(actorRole) && (ADMIN.equals(normalizedRequestedRole) || USER.equals(normalizedRequestedRole))) {
            return;
        }

        if (ADMIN.equals(actorRole) && USER.equals(normalizedRequestedRole)) {
            return;
        }

        throw new ForbiddenException("You are not allowed to create this role.");
    }

    public static void requireCanUpdate(AuthUser actor, Long existingUserId, String existingRole, String requestedRole) {
        String actorRole = role(actor);
        String normalizedExistingRole = normalizeRole(existingRole);
        String normalizedRequestedRole = requestedRole == null || requestedRole.isBlank()
                ? normalizedExistingRole
                : normalizeRole(requestedRole);
        boolean selfUpdate = actor != null && actor.getId() != null && actor.getId().equals(String.valueOf(existingUserId));

        if (SUPER_ADMIN.equals(actorRole) && selfUpdate && SUPER_ADMIN.equals(normalizedExistingRole) && SUPER_ADMIN.equals(normalizedRequestedRole)) {
            return;
        }

        if (SUPER_ADMIN.equals(actorRole) && (ADMIN.equals(normalizedExistingRole) || USER.equals(normalizedExistingRole)) && (ADMIN.equals(normalizedRequestedRole) || USER.equals(normalizedRequestedRole))) {
            return;
        }

        if (ADMIN.equals(actorRole) && USER.equals(normalizedExistingRole) && USER.equals(normalizedRequestedRole)) {
            return;
        }

        if (USER.equals(actorRole) && selfUpdate && normalizedExistingRole.equals(normalizedRequestedRole)) {
            return;
        }

        throw new ForbiddenException("You are not allowed to update this user.");
    }

    public static void requireCanDelete(AuthUser actor, String targetRole) {
        String actorRole = role(actor);
        String normalizedTargetRole = normalizeRole(targetRole);

        if (SUPER_ADMIN.equals(actorRole) && (ADMIN.equals(normalizedTargetRole) || USER.equals(normalizedTargetRole))) {
            return;
        }

        if (ADMIN.equals(actorRole) && USER.equals(normalizedTargetRole)) {
            return;
        }

        throw new ForbiddenException("You are not allowed to delete this user.");
    }

    private static String role(AuthUser user) {
        return normalizeRole(user == null ? null : user.getRole());
    }
}
