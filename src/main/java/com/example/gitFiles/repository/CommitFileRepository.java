package com.example.gitFiles.repository;

import com.example.gitFiles.entity.CommitFile;
import com.example.gitFiles.entity.Commit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommitFileRepository extends JpaRepository<CommitFile, Long> {
    List<CommitFile> findByCommit(Commit commit);
    List<CommitFile> findByCommitId(Long commitId);
}