package com.grove.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TaskRequestDto {

    @NotBlank(message = "Task name can not be blank!")
    @Size(min = 5, max = 50, message = "Task name must be between 5 and 50 characters!")
    private String taskName;

    @NotBlank(message = "Task description can not be blank!")
    @Size(min = 5, max = 500, message = "Task description must be between 5 and 500 characters!")
    private String taskDesc;

    private List<Long> memberIds = new ArrayList<>();

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

    public List<Long> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(List<Long> memberIds) {
        this.memberIds = memberIds;
    }

    public LocalDateTime getDeadLine() {
        return deadLine;
    }

    public void setDeadLine(LocalDateTime deadLine) {
        this.deadLine = deadLine;
    }
}
