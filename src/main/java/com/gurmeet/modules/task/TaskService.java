package com.gurmeet.modules.task;

import com.gurmeet.grove_app.notifications.NotificationService;
import com.gurmeet.modules.person.Person;
import com.gurmeet.modules.person.PersonRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class TaskService {

    private TaskRepository taskRepository;
    private PersonRepository personRepository;
    private NotificationService notificationService;

    public TaskService() {
    }

    @Inject
    public TaskService(
            TaskRepository taskRepository,
            PersonRepository personRepository,
            NotificationService notificationService
    ) {
        this.taskRepository = taskRepository;
        this.personRepository = personRepository;
        this.notificationService = notificationService;
    }

    public TaskResponseDto create(TaskRequestDto request, Long loggedInUserId) {
        Task task = new Task();

        task.setAddBy(loggedInUserId);
        copyEditableFields(request, task);
        Task savedTask = taskRepository.save(task);

        notifyAssignedUser(savedTask, "Task assigned");

        return toResponse(savedTask);
    }

    public List<TaskResponseDto> findAll() {
        return taskRepository.findAll()
                .map(TaskService::toResponse)
                .toList();
    }

    public TaskResponseDto findById(Long id) {
        return taskRepository.findById(id)
                .map(TaskService::toResponse)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));
    }

    public TaskResponseDto update(Long id, TaskRequestDto request, Long loggedInUserId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));

        if (!loggedInUserId.equals(task.getAddBy())) {
            throw new ForbiddenException("Only the user who added the task can update it.");
        }

        copyEditableFields(request, task);
        Task savedTask = taskRepository.save(task);

        notifyAssignedUser(savedTask, "Task updated");

        return toResponse(savedTask);
    }

    public TaskResponseDto markCompleted(Long id, Long loggedInUserId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));

        if (!loggedInUserId.equals(task.getAssignedTo())) {
            throw new ForbiddenException("Only the assigned user can mark this task completed.");
        }

        if (task.getCompletedOn() != null) {
            throw new BadRequestException("Task is already completed.");
        }

        task.setCompletedOn(Instant.now());
        Task savedTask = taskRepository.save(task);
        notifyCreatorTaskCompleted(savedTask, loggedInUserId);

        return toResponse(savedTask);
    }

    public void delete(Long id, Long loggedInUserId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));

        if (!loggedInUserId.equals(task.getAddBy())) {
            throw new ForbiddenException("Only the user who added the task can delete it.");
        }

        taskRepository.deleteById(id);
    }

    private static void copyEditableFields(TaskRequestDto request, Task task) {
        task.setTaskName(request.getTaskName());
        task.setTaskDesc(request.getTaskDesc());
        task.setAssignedTo(request.getAssignedTo());
        task.setDeadLine(request.getDeadLine());
    }

    private void notifyAssignedUser(Task task, String title) {
        String assignedUserId = String.valueOf(task.getAssignedTo());
        String addedByName = personName(task.getAddBy());

        notificationService.notifyUser(
                assignedUserId,
                title,
                task.getTaskName() + " added by " + addedByName,
                "task"
        );
    }

    private void notifyCreatorTaskCompleted(Task task, Long completedByUserId) {
        String completedByName = personName(completedByUserId);

        notificationService.notifyUser(
                String.valueOf(task.getAddBy()),
                "Task done",
                task.getTaskName() + " marked done by " + completedByName,
                "task"
        );
    }

    private String personName(Long personId) {
        return personRepository.findById(personId)
                .map(Person::getName)
                .filter(name -> !name.isBlank())
                .orElse("User " + personId);
    }

    private static TaskResponseDto toResponse(Task task) {
        TaskResponseDto response = new TaskResponseDto();

        response.setId(task.getId());
        response.setTaskName(task.getTaskName());
        response.setTaskDesc(task.getTaskDesc());
        response.setAddBy(task.getAddBy());
        response.setAssignedTo(task.getAssignedTo());
        response.setDeadLine(task.getDeadLine());
        response.setCreatedOn(task.getCreatedOn());
        response.setCompletedOn(task.getCompletedOn());

        return response;
    }
}
