package com.grove.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_task")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Task name can not be blank!")
    @Size(min = 5, max = 50, message = "Task name must be between 5 and 50 characters!")
    private String taskName;

    @NotBlank(message = "Task description can not be blank!")
    @Size(min = 5, max = 500, message = "Task description must be between 5 and 500 characters!")
    @Lob
    @Column(columnDefinition = "TEXT")
    private String taskDesc;

    @NotNull(message = "Add By is required!")
    private Long addBy;

    @NotNull(message = "Assigned To is required!")
    private Long assignedTo;

    private LocalDateTime deadLine;

    @Column(nullable = false, updatable = false)
    private Instant createdOn;

    private Instant completedOn;

    @PrePersist
    private void initCreatedOn() {
        if (createdOn == null) {
            createdOn = Instant.now();
        }
    }

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
