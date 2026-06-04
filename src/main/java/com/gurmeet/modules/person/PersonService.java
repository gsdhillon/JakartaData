package com.gurmeet.modules.person;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PersonService {

    private PersonRepository personRepository;

    public PersonService() {
    }

    @Inject
    public PersonService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    public Person create(Person person) {
        person.setId(null);
        return personRepository.save(person);
    }

    public List<Person> findAll() {
        return personRepository.findAll().toList();
    }

    public Optional<Person> findById(Long id) {
        return personRepository.findById(id);
    }

    public Person update(Long id, Person updatedPerson) {
        // Shorter version:
        // Person person = personRepository.findById(id)
        //         .orElseThrow(() -> new IllegalArgumentException("Person not found: " + id));

        Optional<Person> optionalPerson = personRepository.findById(id);

        if (optionalPerson.isEmpty()) {
            throw new NotFoundException("Person not found: " + id);
        }

        Person person = optionalPerson.get();
        copyPersonFields(updatedPerson, person);
        return personRepository.save(person);
    }

    public void delete(Long id) {
        personRepository.deleteById(id);
    }

    private void copyPersonFields(Person source, Person target) {
        target.setName(source.getName());
        target.setDesignation(source.getDesignation());
        target.setDob(source.getDob());
        target.setAppointmentAt(source.getAppointmentAt());
        target.setEmail(source.getEmail());
        target.setGender(source.getGender());
        target.setMobileNo(source.getMobileNo());
        target.setPhoto(source.getPhoto());
    }
}
