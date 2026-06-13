package com.grove.person;

import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Repository;

import java.util.Optional;

@Repository
public interface PersonRepository extends CrudRepository<Person, Long> {

    Optional<Person> findByEmail(String email);

    Optional<Person> findByMobileNo(String mobileNo);
}
