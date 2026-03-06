package com.example.gitFiles.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "commit_files")
public class CommitFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "commit_id", nullable = false)
    private Commit commit;

    @ManyToOne
    @JoinColumn(name = "file_id", nullable = false)
    private File file;

    @Column(name = "file_path_in_repo", nullable = false)
    private String filePathInRepo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public CommitFile() {}

    public CommitFile(Commit commit, File file, String filePathInRepo) {
        this.commit = commit;
        this.file = file;
        this.filePathInRepo = filePathInRepo;
        this.createdAt = LocalDateTime.now();
    }

    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Commit getCommit() { return commit; }
    public void setCommit(Commit commit) { this.commit = commit; }

    public File getFile() { return file; }
    public void setFile(File file) { this.file = file; }

    public String getFilePathInRepo() { return filePathInRepo; }
    public void setFilePathInRepo(String filePathInRepo) { this.filePathInRepo = filePathInRepo; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}