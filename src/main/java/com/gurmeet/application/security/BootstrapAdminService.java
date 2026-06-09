package com.gurmeet.modules.security;

import com.gurmeet.modules.person.Person;
import com.gurmeet.modules.person.PersonService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class BootstrapAdminService {

    private PersonService personService;

    public BootstrapAdminService() {
    }

    @Inject
    public BootstrapAdminService(PersonService personService) {
        this.personService = personService;
    }

    public Person createFirstSuperAdmin(BootstrapAdminRequest request) {
        if (personService.hasPersons()) {
            throw new ClientErrorException(
                    "Bootstrap admin can be created only when the Person table is missing or empty.",
                    Response.Status.CONFLICT
            );
        }

        Person person = new Person();

        if (request.getName() != null) {
            person.setName(request.getName());
        }

        if (request.getDesignation() != null) {
            person.setDesignation(request.getDesignation());
        }

        if (request.getEmail() != null) {
            person.setEmail(request.getEmail());
        }

        if (request.getGender() != null) {
            person.setGender(request.getGender());
        }

        if (request.getDob() != null) {
            person.setDob(request.getDob());
        }

        if (request.getMobileNo() != null) {
            person.setMobileNo(request.getMobileNo());
        }

        if (request.getPhoto() != null) {
            person.setPhoto(request.getPhoto());
        }

        person.setRole(PersonAccessPolicy.SUPER_ADMIN);
        person.setRawPassword(request.getPassword());
        person.setPasswordChangeRequired(false);

        return personService.create(person);
    }
}
