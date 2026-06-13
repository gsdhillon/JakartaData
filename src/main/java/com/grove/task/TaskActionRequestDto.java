package com.grove.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TaskActionRequestDto {

    private String status = TaskAction.STATUS_PENDING;

    @NotBlank(message = "Action description can not be blank!")
    @Size(min = 2, max = 500, message = "Action description must be between 2 and 500 characters!")
    private String desc;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDesc() {
        return desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }
}
