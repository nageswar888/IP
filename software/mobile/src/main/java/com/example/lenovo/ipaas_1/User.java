package com.example.lenovo.ipaas_1;

import org.json.JSONArray;

import java.util.ArrayList;

/**
 * Created by Arun on 11/28/2016.
 */

public class User
{
    String token;
    String id;
    String firstName;
    String lastName;
    String email;
    JSONArray roles = new JSONArray();
    String isAuthenticated;

    @Override
    public String toString() {
        return "User{" +
                "email='" + email + '\'' +
                ", token='" + token + '\'' +
                ", id='" + id + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", roles=" + roles +
                ", isAuthenticated='" + isAuthenticated + '\'' +
                '}';
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIsAuthenticated() {
        return isAuthenticated;
    }

    public void setIsAuthenticated(String isAuthenticated) {
        this.isAuthenticated = isAuthenticated;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }


    public JSONArray getRoles() {
        return roles;
    }

    public void setRoles(JSONArray roles) {
        this.roles = roles;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
