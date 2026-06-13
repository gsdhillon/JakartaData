package com.grove.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class TaskRequestDto {

    @NotBlank(message = "Task name can not be blank!")
    @Size(min = 5, max = 50, message = "Task name must be between 5 and 50 characters!")
    private String taskName;

    @NotBlank(message = "Task description can not be blank!")
    @Size(min = 5, max = 500, message = "Task description must be between 5 and 500 characters!")
    private String taskDesc;

    @NotNull(message = "Assigned To is required!")
    private Long assignedTo;

    private LocalDateTime deadLine;

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
}
