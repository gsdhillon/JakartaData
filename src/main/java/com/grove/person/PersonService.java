package com.grove.person;

import com.grove.core.EditableFields;
import com.grove.core.security.PasswordService;
import com.grove.core.security.UserAccessPolicy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PersonService {

    private PersonRepository personRepository;
    private PasswordService passwordService;
    private Validator validator;

    @PersistenceContext
    private EntityManager entityManager;

    public PersonService() {
    }

    @Inject
    public PersonService(PersonRepository personRepository, PasswordService passwordService, Validator validator) {
        this.personRepository = personRepository;
        this.passwordService = passwordService;
        this.validator = validator;
    }

    public Person create(Person person) {
        person.setId(null);
        person.setRole(UserAccessPolicy.normalizeRole(person.getRole()));

        var violations = validator.validate(person, Person.Create.class);

        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }

        person.setPassword(passwordService.hashPassword(person.getRawPassword()));
        person.setRawPassword(null);
        return personRepository.save(person);
    }

    public List<Person> findAll() {
        return personRepository.findAll().toList();
    }

    public boolean hasPersons() {
        Long count = entityManager
                .createQuery("select count(person) from Person person", Long.class)
                .getSingleResult();

        return count > 0;
    }

    public Person createBootstrapUser(Person person) {
        person.setId(null);
        person.setRole(UserAccessPolicy.normalizeRole(person.getRole()));
        return personRepository.save(person);
    }

    public Optional<Person> findById(Long id) {
        return personRepository.findById(id);
    }

    public Optional<Person> findByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);

        return normalizedEmail == null
                ? Optional.empty()
                : personRepository.findByEmail(normalizedEmail);
    }

    public Optional<Person> findByMobileNo(String mobileNo) {
        String normalizedMobileNo = blankToNull(mobileNo);

        return normalizedMobileNo == null
                ? Optional.empty()
                : personRepository.findByMobileNo(normalizedMobileNo);
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
        person.setRole(UserAccessPolicy.normalizeRole(person.getRole()));
        return personRepository.save(person);
    }

    public Person findRequiredById(Long id) {
        return personRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Person not found: " + id));
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
                case "role" -> person.setRole(getStringOrNull(patch, fieldName));
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

    public Person changePassword(Long id, String passwordHash) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Person not found: " + id));

        person.setPassword(passwordHash);
        person.setPasswordChangeRequired(false);
        return personRepository.save(person);
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

    private String normalizeEmail(String value) {
        String normalizedValue = blankToNull(value);

        return normalizedValue == null
                ? null
                : normalizedValue.toLowerCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }
}
