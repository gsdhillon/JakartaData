package com.gurmeet.modules.person;

import com.gurmeet.application.EditableFields;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
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
        EditableFields.copyEditableFields(updatedPerson, person);
        return personRepository.save(person);
    }

    public Person patch(Long id, JsonObject patch) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Person not found: " + id));

        patch.forEach((fieldName, value) -> {
            switch (fieldName) {
                case "name" -> person.setName(getStringOrNull(patch, fieldName));
                case "designation" -> person.setDesignation(getStringOrNull(patch, fieldName));
                case "dob" -> person.setDob(getLocalDateOrNull(patch, fieldName));
                case "email" -> person.setEmail(getStringOrNull(patch, fieldName));
                case "gender" -> person.setGender(getStringOrNull(patch, fieldName));
                case "mobileNo" -> person.setMobileNo(getStringOrNull(patch, fieldName));
                case "photo" -> person.setPhoto(getStringOrNull(patch, fieldName));
                default -> throw new BadRequestException("Field is not patchable: " + fieldName);
            }
        });

        Person savedPerson = personRepository.save(person);

        return personRepository.findById(id)
                .orElse(savedPerson);
    }

    public void delete(Long id) {
        personRepository.deleteById(id);
    }

    private String getStringOrNull(JsonObject patch, String fieldName) {
        return patch.isNull(fieldName)
                ? null
                : patch.getString(fieldName);
    }

    private LocalDate getLocalDateOrNull(JsonObject patch, String fieldName) {
        String value = getStringOrNull(patch, fieldName);

        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("Invalid date for field: " + fieldName);
        }
    }

}
