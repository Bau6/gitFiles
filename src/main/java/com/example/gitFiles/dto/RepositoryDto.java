package com.example.gitFiles.dto;

import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import java.time.LocalDateTime;

public class RepositoryDto {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private String visibility;
    private OwnerInfo owner;

    // Внутренний класс для информации о владельце
    public static class OwnerInfo {
        private Long id;
        private String username;

        public OwnerInfo(Long id, String username) {
            this.id = id;
            this.username = username;
        }

        public Long getId() { return id; }
        public String getUsername() { return username; }
    }

    public RepositoryDto(Repository repository) {
        this.id = repository.getId();
        this.name = repository.getName();
        this.description = repository.getDescription();
        this.createdAt = repository.getCreatedAt();
        this.visibility = repository.getVisibility();

        User owner = repository.getOwner();
        if (owner != null) {
            this.owner = new OwnerInfo(owner.getId(), owner.getUsername());
        }
    }

    // Геттеры
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getVisibility() { return visibility; }
    public OwnerInfo getOwner() { return owner; }
}