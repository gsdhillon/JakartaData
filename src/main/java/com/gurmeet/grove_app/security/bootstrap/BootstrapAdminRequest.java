package com.gurmeet.grove_app.security.bootstrap;

import com.gurmeet.grove_app.ValidationRules;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class BootstrapAdminRequest {

    @NotBlank(message = "Name is required.")
    @Size(min = 2, max = 25, message = "Name must be between 2 and 25 characters.")
    private String name;

    @NotBlank(message = "Designation is required.")
    private String designation;

    @Email(message = "Email must be valid.")
    private String email;

    private String gender;

    @Past(message = "DOB must be in the past.")
    private LocalDate dob;

    private String mobileNo;
    private String photo;

    @NotBlank(message = "Password is required.")
    @Size(min = ValidationRules.PASSWORD_MIN_LENGTH, message = "Password must be at least {min} characters.")
    private String password;

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

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
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
}
