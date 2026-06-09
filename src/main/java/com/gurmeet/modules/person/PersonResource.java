package com.gurmeet.modules.person;

import com.gurmeet.application.security.AuthUser;
import com.gurmeet.application.security.SecurityService;
import com.gurmeet.application.security.UserAccessPolicy;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.validation.Valid;

import java.net.URI;
import java.util.List;

@Path("/persons")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
// Class name is not used in the URL. @Path decides this resource path.
public class PersonResource {

    @Inject
    private PersonService personService;

    @Inject
    private SecurityService securityService;

    @POST
    // Method name is not used in the URL. @POST decides the HTTP action.
    public Response create(@HeaderParam("Authorization") String authorizationHeader, @Valid Person person) {
        AuthUser actor = securityService.requireUser(authorizationHeader);

        UserAccessPolicy.requireCanCreate(actor, person.getRole(), person.isPasswordChangeRequired());
        Person savedPerson = personService.create(person);
        return Response.created(URI.create("/api/persons/" + savedPerson.getId()))
                .entity(savedPerson)
                .build();
    }

    @GET
    // Method name is not used in the URL. @GET decides the HTTP action.
    public List<Person> findAll(@HeaderParam("Authorization") String authorizationHeader) {
        securityService.requireUserId(authorizationHeader);
        return personService.findAll();
    }

    @GET
    @Path("/{id}")
    // Method name is not used in the URL. @GET and @Path decide the endpoint.
    // "{id}" and @PathParam("id") must match. The Java variable name can be different.
    public Person findById(@HeaderParam("Authorization") String authorizationHeader, @PathParam("id") Long personId) {
        securityService.requireUserId(authorizationHeader);
        return personService.findById(personId)
                .orElseThrow(() -> new NotFoundException("Person not found: " + personId));
    }

    @PUT
    @Path("/{id}")
    // Method name is not used in the URL. @PUT and @Path decide the endpoint.
    public Person update(
            @HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Long id,
            @Valid Person person
    ) {
        AuthUser actor = securityService.requireUser(authorizationHeader);
        Person existingPerson = personService.findRequiredById(id);

        UserAccessPolicy.requireCanUpdate(actor, existingPerson.getId(), existingPerson.getRole(), person.getRole());
        return personService.update(id, person);
    }

    @PATCH
    @Path("/{id}")
    public Person patch(
            @HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Long id,
            JsonObject patch
    ) {
        AuthUser actor = securityService.requireUser(authorizationHeader);
        Person existingPerson = personService.findRequiredById(id);
        Person requestedPerson = new Person();

        requestedPerson.setRole(patch.containsKey("role") && !patch.isNull("role")
                ? patch.getString("role")
                : existingPerson.getRole());
        UserAccessPolicy.requireCanUpdate(actor, existingPerson.getId(), existingPerson.getRole(), requestedPerson.getRole());
        return personService.patch(id, patch);
    }

    @DELETE
    @Path("/{id}")
    // Method name is not used in the URL. @DELETE and @Path decide the endpoint.
    public Response delete(@HeaderParam("Authorization") String authorizationHeader, @PathParam("id") Long id) {
        AuthUser actor = securityService.requireUser(authorizationHeader);
        Person targetPerson = personService.findRequiredById(id);

        UserAccessPolicy.requireCanDelete(actor, targetPerson.getRole());
        personService.delete(id);
        return Response.noContent().build();
    }
}
