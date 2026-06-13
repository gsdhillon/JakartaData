package com.grove.task;

import java.time.Instant;
import java.time.LocalDateTime;

public class TaskResponseDto {

    private Long id;
    private String taskName;
    private String taskDesc;
    private Long addBy;
    private Long assignedTo;
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

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
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
