package com.example.gitFiles.repository;

import com.example.gitFiles.entity.RepositoryPermission;
import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RepositoryPermissionRepository extends JpaRepository<RepositoryPermission, Long> {

    List<RepositoryPermission> findByRepository(Repository repository);

    List<RepositoryPermission> findByUser(User user);

    Optional<RepositoryPermission> findByRepositoryAndUser(Repository repository, User user);

    @Query("SELECT rp.role FROM RepositoryPermission rp WHERE rp.repository.id = :repoId AND rp.user.id = :userId")
    Optional<String> findRoleByRepositoryAndUser(@Param("repoId") Long repoId, @Param("userId") Long userId);

    @Query("SELECT rp.user FROM RepositoryPermission rp WHERE rp.repository.id = :repoId")
    List<User> findUsersByRepository(@Param("repoId") Long repoId);

    boolean existsByRepositoryAndUserAndRole(Repository repository, User user, String role);
}