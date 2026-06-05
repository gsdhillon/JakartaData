package com.gurmeet.modules.task;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class TaskService {

    private TaskRepository taskRepository;

    public TaskService() {
    }

    @Inject
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public TaskResponseDto create(TaskRequestDto request, Long loggedInUserId) {
        Task task = new Task();

        task.setAddBy(loggedInUserId);
        copyEditableFields(request, task);

        return toResponse(taskRepository.save(task));
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

        return toResponse(taskRepository.save(task));
    }

    public TaskResponseDto markCompleted(Long id, Long loggedInUserId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));

        if (!loggedInUserId.equals(task.getAssignedTo())) {
            throw new ForbiddenException("Only the assigned user can mark this task completed.");
        }

        task.setCompletedOn(Instant.now());

        return toResponse(taskRepository.save(task));
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
