package com.gurmeet.modules.person;

import com.gurmeet.grove_app.security.AuthUser;
import com.gurmeet.grove_app.security.AuthUserStore;
import com.gurmeet.grove_app.security.UserAccessPolicy;
import com.gurmeet.grove_app.security.bootstrap.BootstrapAdminRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

@ApplicationScoped
public class PersonAuthUserStore implements AuthUserStore {

    private PersonService personService;

    public PersonAuthUserStore() {
    }

    @Inject
    public PersonAuthUserStore(PersonService personService) {
        this.personService = personService;
    }

    @Override
    public Optional<AuthUser> findById(String id) {
        return parseLong(id)
                .flatMap(personService::findById)
                .map(this::toAuthUser);
    }

    @Override
    public Optional<AuthUser> findByLoginId(String loginId) {
        String normalizedLoginId = clean(loginId);

        if (normalizedLoginId == null) {
            return Optional.empty();
        }

        return findById(normalizedLoginId)
                .or(() -> personService.findByEmail(normalizedLoginId).map(this::toAuthUser))
                .or(() -> personService.findByMobileNo(normalizedLoginId).map(this::toAuthUser));
    }

    @Override
    public boolean hasUsers() {
        return personService.hasPersons();
    }

    @Override
    public AuthUser createBootstrapAdmin(BootstrapAdminRequest request, String passwordHash) {
        Person person = new Person();

        person.setName(request.getName());
        person.setDesignation(request.getDesignation());
        person.setEmail(request.getEmail());
        person.setGender(request.getGender());
        person.setDob(request.getDob());
        person.setMobileNo(request.getMobileNo());
        person.setPhoto(request.getPhoto());
        person.setRole(UserAccessPolicy.SUPER_ADMIN);
        person.setPassword(passwordHash);
        person.setPasswordChangeRequired(false);

        return toAuthUser(personService.createBootstrapUser(person));
    }

    @Override
    public AuthUser changePassword(String id, String passwordHash) {
        Long personId = parseLong(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid user id: " + id));

        return toAuthUser(personService.changePassword(personId, passwordHash));
    }

    // BOILERPLATE-REPLACE-PERSON: copy this mapping pattern when Employee/Customer replaces Person as the auth table.
    private AuthUser toAuthUser(Person person) {
        return new AuthUser(
                String.valueOf(person.getId()),
                String.valueOf(person.getId()),
                person.getName(),
                person.getRole(),
                person.getEmail(),
                person.getMobileNo(),
                person.getPassword(),
                person.getPhoto(),
                person.isPasswordChangeRequired()
        );
    }

    private Optional<Long> parseLong(String value) {
        try {
            return clean(value) == null
                    ? Optional.empty()
                    : Optional.of(Long.valueOf(value.trim()));
        } catch (NumberFormatException exception) {
            return Optional.empty();
        }
    }

    private String clean(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }
}
