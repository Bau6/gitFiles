package com.example.gitFiles.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commits")
public class Commit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne
    @JoinColumn(name = "repository_id", nullable = false)
    private Repository repository;

    @OneToMany(mappedBy = "commit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommitFile> commitFiles = new ArrayList<>();

    public Commit() {}

    public Commit(String message, User author, Repository repository) {
        this.message = message;
        this.author = author;
        this.repository = repository;
        this.createdAt = LocalDateTime.now();
    }

    public void addFile(File file, String pathInRepo) {
        CommitFile commitFile = new CommitFile(this, file, pathInRepo);
        commitFiles.add(commitFile);
    }

    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public Repository getRepository() { return repository; }
    public void setRepository(Repository repository) { this.repository = repository; }

    public List<CommitFile> getCommitFiles() { return commitFiles; }
    public void setCommitFiles(List<CommitFile> commitFiles) { this.commitFiles = commitFiles; }
}