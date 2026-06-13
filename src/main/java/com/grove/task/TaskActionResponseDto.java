package com.grove.task;

import java.time.Instant;

public class TaskActionResponseDto {

    private Long id;
    private String status;
    private String desc;
    private Instant actionOn;
    private Long actionBy;
    private TaskPersonDto actionByPerson;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Instant getActionOn() {
        return actionOn;
    }

    public void setActionOn(Instant actionOn) {
        this.actionOn = actionOn;
    }

    public Long getActionBy() {
        return actionBy;
    }

    public void setActionBy(Long actionBy) {
        this.actionBy = actionBy;
    }

    public TaskPersonDto getActionByPerson() {
        return actionByPerson;
    }

    public void setActionByPerson(TaskPersonDto actionByPerson) {
        this.actionByPerson = actionByPerson;
    }
}
