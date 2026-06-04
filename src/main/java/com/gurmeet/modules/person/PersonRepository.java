package com.gurmeet.modules.person;

import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Repository;

@Repository
public interface PersonRepository extends CrudRepository<Person, Long> {
}
