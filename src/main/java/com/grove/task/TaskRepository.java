package com.grove.task;

import jakarta.data.repository.CrudRepository;
import jakarta.data.repository.Repository;

@Repository
public interface TaskRepository extends CrudRepository<Task, Long> {
}
