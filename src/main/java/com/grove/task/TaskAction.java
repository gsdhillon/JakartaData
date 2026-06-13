package com.grove.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Entity
@Table(name = "task_action")
public class TaskAction {

    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_COMPLETED = "completed";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @NotBlank(message = "Status is required!")
    @Column(nullable = false)
    private String status = STATUS_PENDING;

    @NotBlank(message = "Action description can not be blank!")
    @Size(min = 2, max = 500, message = "Action description must be between 2 and 500 characters!")
    @Lob
    @Column(name = "action_desc", columnDefinition = "TEXT", nullable = false)
    private String desc;

    @Column(name = "action_on", nullable = false, updatable = false)
    private Instant actionOn;

    @NotNull(message = "Action By is required!")
    @Column(name = "action_by", nullable = false, updatable = false)
    private Long actionBy;

    @PrePersist
    private void initActionOn() {
        if (actionOn == null) {
            actionOn = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Task getTask() {
        return task;
    }

    public void setTask(Task task) {
        this.task = task;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = normalizeStatus(status);
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

    public static String normalizeStatus(String value) {
        String statusValue = value == null || value.isBlank()
                ? STATUS_PENDING
                : value.trim().toLowerCase();

        return STATUS_COMPLETED.equals(statusValue)
                ? STATUS_COMPLETED
                : STATUS_PENDING;
    }
}
