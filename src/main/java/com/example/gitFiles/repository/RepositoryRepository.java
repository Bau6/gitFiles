package com.example.gitFiles.repository;

import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RepositoryRepository extends JpaRepository<Repository, Long> {
    List<Repository> findByOwner(User owner);
    List<Repository> findByOwnerId(Long userId);
    List<Repository> findByVisibility(String visibility);
}