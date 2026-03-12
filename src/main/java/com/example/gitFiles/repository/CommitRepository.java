package com.example.gitFiles.repository;

import com.example.gitFiles.entity.Commit;
import com.example.gitFiles.entity.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommitRepository extends JpaRepository<Commit, Long> {
    List<Commit> findByRepositoryOrderByCreatedAtDesc(Repository repository);
    List<Commit> findByRepositoryIdOrderByCreatedAtDesc(Long repositoryId);
}