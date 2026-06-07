package com.gurmeet.modules.person;

import java.time.Instant;
import java.time.LocalDate;

import com.gurmeet.application.EditableField;
import com.gurmeet.application.ValidationRules;
import com.gurmeet.modules.security.PersonAccessPolicy;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Transient;
import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

@Entity
public class Person {

    public interface Create {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EditableField(false)
    private Long id;

    @EditableField
    @Size(min = 2, max = 25, message = "Name must be between 2 and 25 characters!")
    private String name;

    @EditableField
    @NotBlank(message = "Designation can not be blank!")
    private String designation;

    @EditableField
    @Past(message = "DOB must be in the past!")
    private LocalDate dob;

    @EditableField(false)
    @Column(
            name = "updated_at",
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    )
    private Instant updatedAt;

    @EditableField
    private String email;

    @EditableField
    private String gender;

    @EditableField
    private String role = PersonAccessPolicy.USER;

    @EditableField
    private String mobileNo;

    @EditableField
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photo;

    @EditableField(false)
    @JsonbTransient
    private String password;

    @Transient
    @NotBlank(message = "Initial password is required.", groups = Create.class)
    @Size(min = ValidationRules.PASSWORD_MIN_LENGTH, message = "Initial password must be at least {min} characters.", groups = Create.class)
    private String rawPassword;

    @EditableField(false)
    @Column(name = "password_change_required")
    private boolean passwordChangeRequired;

    public Person() {
    }

    public Person(String name) {
        this.name = name;
    }

    @PrePersist
    @PreUpdate
    private void touchUpdatedAt() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getRole() {
        return PersonAccessPolicy.normalizeRole(role);
    }

    public void setRole(String role) {
        this.role = PersonAccessPolicy.normalizeRole(role);
    }

    public String getMobileNo() {
        return mobileNo;
    }

    public void setMobileNo(String mobileNo) {
        this.mobileNo = mobileNo;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRawPassword() {
        return rawPassword;
    }

    public void setRawPassword(String rawPassword) {
        this.rawPassword = rawPassword;
    }

    public boolean isPasswordChangeRequired() {
        return passwordChangeRequired;
    }

    public void setPasswordChangeRequired(boolean passwordChangeRequired) {
        this.passwordChangeRequired = passwordChangeRequired;
    }
}
