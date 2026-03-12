package com.example.gitFiles.repository;

import com.example.gitFiles.entity.File;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FileRepository extends JpaRepository<File, Long> {
    Optional<File> findByFileHash(String fileHash);
    boolean existsByFileHash(String fileHash);
}