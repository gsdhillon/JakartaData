package com.gurmeet.modules.person;

import com.gurmeet.application.security.AuthUser;
import com.gurmeet.application.security.AuthUserStore;
import com.gurmeet.application.security.UserAccessPolicy;
import com.gurmeet.application.security.bootstrap.BootstrapAdminRequest;
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
    public Optional<AuthUser> findById(Long id) {
        return personService.findById(id).map(this::toAuthUser);
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
    public AuthUser changePassword(Long id, String passwordHash) {
        return toAuthUser(personService.changePassword(id, passwordHash));
    }

    // BOILERPLATE-REPLACE-PERSON: copy this mapping pattern when Employee/Customer replaces Person as the auth table.
    private AuthUser toAuthUser(Person person) {
        return new AuthUser(
                person.getId(),
                person.getName(),
                person.getRole(),
                person.getPassword(),
                person.getPhoto(),
                person.isPasswordChangeRequired()
        );
    }
}
