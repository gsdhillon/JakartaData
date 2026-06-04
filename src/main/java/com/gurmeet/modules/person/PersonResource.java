package com.gurmeet.modules.person;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
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

    @POST
    // Method name is not used in the URL. @POST decides the HTTP action.
    public Response create(@Valid Person person) {
        Person savedPerson = personService.create(person);
        return Response.created(URI.create("/api/persons/" + savedPerson.getId()))
                .entity(savedPerson)
                .build();
    }

    @GET
    // Method name is not used in the URL. @GET decides the HTTP action.
    public List<Person> findAll() {
        return personService.findAll();
    }

    @GET
    @Path("/{id}")
    // Method name is not used in the URL. @GET and @Path decide the endpoint.
    // "{id}" and @PathParam("id") must match. The Java variable name can be different.
    public Person findById(@PathParam("id") Long personId) {
        return personService.findById(personId)
                .orElseThrow(() -> new NotFoundException("Person not found: " + personId));
    }

    @PUT
    @Path("/{id}")
    // Method name is not used in the URL. @PUT and @Path decide the endpoint.
    public Person update(@PathParam("id") Long id, @Valid Person person) {
        return personService.update(id, person);
    }

    @DELETE
    @Path("/{id}")
    // Method name is not used in the URL. @DELETE and @Path decide the endpoint.
    public Response delete(@PathParam("id") Long id) {
        personService.delete(id);
        return Response.noContent().build();
    }
}
