package com.gurmeet.modules.security;

import com.gurmeet.modules.person.Person;
import com.gurmeet.modules.person.PersonService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;

@ApplicationScoped
public class BootstrapAdminService {

    private PersonService personService;
    private PasswordService passwordService;

    public BootstrapAdminService() {
    }

    @Inject
    public BootstrapAdminService(PersonService personService, PasswordService passwordService) {
        this.personService = personService;
        this.passwordService = passwordService;
    }

    public Person createFirstSuperAdmin(BootstrapAdminRequest request) {
        if (personService.hasPersons()) {
            throw new ForbiddenException("Bootstrap is disabled because at least one user already exists.");
        }

        Person person = new Person();

        person.setName(request.getName());
        person.setDesignation(request.getDesignation());
        person.setEmail(request.getEmail());
        person.setGender(request.getGender());
        person.setDob(request.getDob());
        person.setMobileNo(request.getMobileNo());
        person.setPhoto(request.getPhoto());
        person.setRole(PersonAccessPolicy.SUPER_ADMIN);
        person.setPassword(passwordService.hashPassword(request.getPassword()));

        return personService.create(person);
    }
}