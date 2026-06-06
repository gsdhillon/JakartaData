package com.gurmeet.modules.security;

import com.gurmeet.modules.person.Person;
import jakarta.ws.rs.ForbiddenException;

public final class PersonAccessPolicy {

    public static final String SUPER_ADMIN = "SUPER-ADMIN";
    public static final String ADMIN = "ADMIN";
    public static final String USER = "USER";

    private PersonAccessPolicy() {
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

    public static void requireCanCreate(Person actor, Person requestedPerson) {
        String actorRole = role(actor);
        String requestedRole = normalizeRole(requestedPerson.getRole());

        if (SUPER_ADMIN.equals(actorRole) && (ADMIN.equals(requestedRole) || USER.equals(requestedRole))) {
            return;
        }

        if (ADMIN.equals(actorRole) && USER.equals(requestedRole)) {
            return;
        }

        throw new ForbiddenException("You are not allowed to create this role.");
    }

    public static void requireCanUpdate(Person actor, Person existingPerson, Person requestedPerson) {
        String actorRole = role(actor);
        String existingRole = role(existingPerson);
        String requestedRole = requestedPerson.getRole() == null || requestedPerson.getRole().isBlank()
                ? existingRole
                : normalizeRole(requestedPerson.getRole());

        if (SUPER_ADMIN.equals(actorRole) && (ADMIN.equals(existingRole) || USER.equals(existingRole)) && (ADMIN.equals(requestedRole) || USER.equals(requestedRole))) {
            return;
        }

        if (ADMIN.equals(actorRole) && USER.equals(existingRole) && USER.equals(requestedRole)) {
            return;
        }

        if (USER.equals(actorRole) && actor.getId().equals(existingPerson.getId()) && existingRole.equals(requestedRole)) {
            return;
        }

        throw new ForbiddenException("You are not allowed to update this person.");
    }

    public static void requireCanDelete(Person actor, Person targetPerson) {
        String actorRole = role(actor);
        String targetRole = role(targetPerson);

        if (SUPER_ADMIN.equals(actorRole) && (ADMIN.equals(targetRole) || USER.equals(targetRole))) {
            return;
        }

        if (ADMIN.equals(actorRole) && USER.equals(targetRole)) {
            return;
        }

        throw new ForbiddenException("You are not allowed to delete this person.");
    }

    private static String role(Person person) {
        return normalizeRole(person == null ? null : person.getRole());
    }
}