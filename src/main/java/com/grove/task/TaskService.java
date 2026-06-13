package com.grove.task;

import com.grove.core.notifications.NotificationService;
import com.grove.person.Person;
import com.grove.person.PersonRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@ApplicationScoped
public class TaskService {

    private TaskRepository taskRepository;
    private PersonRepository personRepository;
    private NotificationService notificationService;

    @PersistenceContext(unitName = "personPU")
    private EntityManager entityManager;

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

        notifyAssignedUsers(savedTask, "Task assigned");

        return toResponse(savedTask);
    }

    public List<TaskResponseDto> findAll() {
        return taskRepository.findAll()
                .map(this::toResponse)
                .toList();
    }

    public TaskResponseDto findById(Long id) {
        return taskRepository.findById(id)
                .map(this::toResponse)
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

        notifyAssignedUsers(savedTask, "Task updated");

        return toResponse(savedTask);
    }

    public TaskResponseDto markCompleted(Long id, Long loggedInUserId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));

        if (!isActiveMember(task, loggedInUserId)) {
            throw new ForbiddenException("Only the assigned user can mark this task completed.");
        }

        if (task.getCompletedOn() != null) {
            throw new BadRequestException("Task is already completed.");
        }

        TaskActionRequestDto request = new TaskActionRequestDto();

        request.setStatus(TaskAction.STATUS_COMPLETED);
        request.setDesc("Task marked completed.");

        return addAction(id, request, loggedInUserId);
    }

    public TaskResponseDto addAction(Long id, TaskActionRequestDto request, Long loggedInUserId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));

        boolean creator = loggedInUserId.equals(task.getAddBy());

        if (!creator && !isActiveMember(task, loggedInUserId)) {
            throw new ForbiddenException("Only the creator or assigned users can add task actions.");
        }

        String status = TaskAction.normalizeStatus(request.getStatus());
        boolean completedTask = task.getCompletedOn() != null;
        boolean completing = TaskAction.STATUS_COMPLETED.equals(status);
        boolean reopening = completedTask && TaskAction.STATUS_PENDING.equals(status);

        if (completedTask && completing) {
            throw new BadRequestException("Task is already completed.");
        }

        if (reopening && !creator) {
            throw new ForbiddenException("Only the creator can reopen this task.");
        }

        Instant actionOn = Instant.now();
        TaskAction action = new TaskAction();

        action.setTask(task);
        action.setActionBy(loggedInUserId);
        action.setActionOn(actionOn);
        action.setStatus(status);
        action.setDesc(request.getDesc());
        task.getActions().add(action);

        if (completing) {
            task.setCompletedOn(actionOn);
        } else if (reopening) {
            task.setCompletedOn(null);
        }

        Task savedTask = taskRepository.save(task);

        if (completing) {
            notifyCreatorTaskCompleted(savedTask, loggedInUserId);
        } else if (reopening) {
            notifyAssignedUsers(savedTask, "Task reopened");
        }

        return toResponse(savedTask);
    }

    @Transactional
    public void delete(Long id, Long loggedInUserId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Task not found: " + id));

        if (!loggedInUserId.equals(task.getAddBy())) {
            throw new ForbiddenException("Only the user who added the task can delete it.");
        }

        deleteRowsByTaskId("task_action", id);
        deleteRowsByTaskId("task_member", id);
        entityManager.createNativeQuery("delete from task where id = ?")
                .setParameter(1, id)
                .executeUpdate();
    }

    private void deleteRowsByTaskId(String tableName, Long taskId) {
        entityManager.createNativeQuery("delete from " + tableName + " where task_id = ?")
                .setParameter(1, taskId)
                .executeUpdate();
    }

    private static void copyEditableFields(TaskRequestDto request, Task task) {
        List<Long> memberIds = memberIds(request);

        if (memberIds.isEmpty()) {
            throw new BadRequestException("At least one member is required.");
        }

        task.setTaskName(request.getTaskName());
        task.setTaskDesc(request.getTaskDesc());
        task.setDeadLine(request.getDeadLine());

        if (task.getCompletedOn() != null && hasMembersChanged(task, memberIds)) {
            throw new BadRequestException("Reopen the task before changing members.");
        }

        syncMembers(task, memberIds);
    }

    private static List<Long> memberIds(TaskRequestDto request) {
        Map<Long, Long> ids = new LinkedHashMap<>();

        if (request.getMemberIds() != null) {
            request.getMemberIds().stream()
                    .filter(Objects::nonNull)
                    .forEach(id -> ids.put(id, id));
        }

        return new ArrayList<>(ids.values());
    }

    private static boolean isActiveMember(Task task, Long personId) {
        if (personId == null) {
            return false;
        }

        return activeMemberIds(task).stream()
                .anyMatch(id -> personId.equals(id));
    }

    private static List<Long> activeMemberIds(Task task) {
        List<TaskMember> memberships = task.getMembers();
        Map<Long, Long> ids = new LinkedHashMap<>();

        memberships.stream()
                .filter(TaskMember::isActive)
                .map(TaskMember::getPersonId)
                .filter(Objects::nonNull)
                .forEach(personId -> ids.putIfAbsent(personId, personId));

        if (!memberships.isEmpty()) {
            return new ArrayList<>(ids.values());
        }

        return List.of();
    }

    private static boolean hasMembersChanged(Task task, List<Long> requestedMemberIds) {
        return !new LinkedHashSet<>(activeMemberIds(task)).equals(new LinkedHashSet<>(requestedMemberIds));
    }

    private static void syncMembers(Task task, List<Long> requestedMemberIds) {
        Map<Long, TaskMember> membershipsByPersonId = new LinkedHashMap<>();

        task.getMembers().stream()
                .filter(membership -> membership.getPersonId() != null)
                .forEach(membership -> membershipsByPersonId.putIfAbsent(
                        membership.getPersonId(),
                        membership
                ));

        Set<Long> requestedIds = new LinkedHashSet<>(requestedMemberIds);

        for (Long personId : requestedIds) {
            TaskMember member = membershipsByPersonId.get(personId);

            if (member == null) {
                member = new TaskMember();
                member.setTask(task);
                member.setPersonId(personId);
                task.getMembers().add(member);
            }

            member.setActive(true);
            member.setRemovedOn(null);
        }

        Instant removedOn = Instant.now();

        for (TaskMember membership : task.getMembers()) {
            Long personId = membership.getPersonId();

            if (personId != null && !requestedIds.contains(personId) && membership.isActive()) {
                membership.setActive(false);
                membership.setRemovedOn(removedOn);
            }
        }
    }

    private void notifyAssignedUsers(Task task, String title) {
        String addedByName = personName(task.getAddBy());

        activeMemberIds(task).forEach(personId ->
                notificationService.notifyUser(
                        String.valueOf(personId),
                        title,
                        task.getTaskName() + " added by " + addedByName,
                        "task"
                )
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

    private TaskPersonDto personDto(Long personId) {
        if (personId == null) {
            return null;
        }

        TaskPersonDto dto = new TaskPersonDto();

        dto.setId(personId);

        personRepository.findById(personId).ifPresentOrElse(
                person -> {
                    dto.setName(person.getName());
                    dto.setDesignation(person.getDesignation());
                    dto.setPhoto(person.getPhoto());
                },
                () -> {
                    dto.setName("User " + personId);
                    dto.setDesignation("");
                    dto.setPhoto("");
                }
        );

        return dto;
    }

    private TaskActionResponseDto actionDto(TaskAction action) {
        TaskActionResponseDto response = new TaskActionResponseDto();

        response.setId(action.getId());
        response.setStatus(action.getStatus());
        response.setDesc(action.getDesc());
        response.setActionOn(action.getActionOn());
        response.setActionBy(action.getActionBy());
        response.setActionByPerson(personDto(action.getActionBy()));

        return response;
    }

    private TaskResponseDto toResponse(Task task) {
        TaskResponseDto response = new TaskResponseDto();
        List<Long> memberIds = activeMemberIds(task);

        response.setId(task.getId());
        response.setTaskName(task.getTaskName());
        response.setTaskDesc(task.getTaskDesc());
        response.setAddBy(task.getAddBy());
        response.setCreator(personDto(task.getAddBy()));
        response.setMemberIds(memberIds);
        response.setMembers(memberIds.stream()
                .map(this::personDto)
                .toList());
        response.setActions(task.getActions().stream()
                .map(this::actionDto)
                .toList());
        response.setDeadLine(task.getDeadLine());
        response.setCreatedOn(task.getCreatedOn());
        response.setCompletedOn(task.getCompletedOn());

        return response;
    }
}
