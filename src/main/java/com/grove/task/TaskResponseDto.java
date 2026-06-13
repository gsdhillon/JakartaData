package com.grove.task;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TaskResponseDto {

    private Long id;
    private String taskName;
    private String taskDesc;
    private Long addBy;
    private TaskPersonDto creator;
    private List<Long> memberIds = new ArrayList<>();
    private List<TaskPersonDto> members = new ArrayList<>();
    private List<TaskActionResponseDto> actions = new ArrayList<>();
    private LocalDateTime deadLine;
    private Instant createdOn;
    private Instant completedOn;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getTaskDesc() {
        return taskDesc;
    }

    public void setTaskDesc(String taskDesc) {
        this.taskDesc = taskDesc;
    }

    public Long getAddBy() {
        return addBy;
    }

    public void setAddBy(Long addBy) {
        this.addBy = addBy;
    }

    public TaskPersonDto getCreator() {
        return creator;
    }

    public void setCreator(TaskPersonDto creator) {
        this.creator = creator;
    }

    public List<Long> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(List<Long> memberIds) {
        this.memberIds = memberIds;
    }

    public List<TaskPersonDto> getMembers() {
        return members;
    }

    public void setMembers(List<TaskPersonDto> members) {
        this.members = members;
    }

    public List<TaskActionResponseDto> getActions() {
        return actions;
    }

    public void setActions(List<TaskActionResponseDto> actions) {
        this.actions = actions;
    }

    public LocalDateTime getDeadLine() {
        return deadLine;
    }

    public void setDeadLine(LocalDateTime deadLine) {
        this.deadLine = deadLine;
    }

    public Instant getCreatedOn() {
        return createdOn;
    }

    public void setCreatedOn(Instant createdOn) {
        this.createdOn = createdOn;
    }

    public Instant getCompletedOn() {
        return completedOn;
    }

    public void setCompletedOn(Instant completedOn) {
        this.completedOn = completedOn;
    }
}
