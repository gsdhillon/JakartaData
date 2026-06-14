package com.grove.task;

import com.grove.core.ValidationRules;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TaskActionRequestDto {

    private String status = TaskAction.STATUS_PENDING;

    @NotBlank(message = "Action description can not be blank!")
    @Size(min = 2, max = ValidationRules.TASK_ACTION_DESC_MAX_LENGTH, message = "Action description must be between 2 and 2000 characters!")
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
