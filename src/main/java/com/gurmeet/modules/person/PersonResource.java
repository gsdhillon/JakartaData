package com.gurmeet.modules.person;

import com.gurmeet.modules.security.PersonAccessPolicy;
import com.gurmeet.modules.security.SecurityService;
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
        Person actor = securityService.requirePerson(authorizationHeader);

        PersonAccessPolicy.requireCanCreate(actor, person);
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
        Person actor = securityService.requirePerson(authorizationHeader);
        Person existingPerson = personService.findRequiredById(id);

        PersonAccessPolicy.requireCanUpdate(actor, existingPerson, person);
        return personService.update(id, person);
    }

    @PATCH
    @Path("/{id}")
    public Person patch(
            @HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Long id,
            JsonObject patch
    ) {
        Person actor = securityService.requirePerson(authorizationHeader);
        Person existingPerson = personService.findRequiredById(id);
        Person requestedPerson = new Person();

        requestedPerson.setRole(patch.containsKey("role") && !patch.isNull("role")
                ? patch.getString("role")
                : existingPerson.getRole());
        PersonAccessPolicy.requireCanUpdate(actor, existingPerson, requestedPerson);
        return personService.patch(id, patch);
    }

    @DELETE
    @Path("/{id}")
    // Method name is not used in the URL. @DELETE and @Path decide the endpoint.
    public Response delete(@HeaderParam("Authorization") String authorizationHeader, @PathParam("id") Long id) {
        Person actor = securityService.requirePerson(authorizationHeader);
        Person targetPerson = personService.findRequiredById(id);

        PersonAccessPolicy.requireCanDelete(actor, targetPerson);
        personService.delete(id);
        return Response.noContent().build();
    }
}
