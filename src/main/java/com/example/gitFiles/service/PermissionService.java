package com.example.gitFiles.service;

import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.RepositoryPermission;
import com.example.gitFiles.entity.User;
import com.example.gitFiles.repository.RepositoryPermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PermissionService {

    @Autowired
    private RepositoryPermissionRepository permissionRepository;

    @Autowired
    private UserService userService;

    @Autowired
    @Lazy
    private RepositoryService repositoryService;

    // Роли
    public static final String ROLE_OWNER = "OWNER";
    public static final String ROLE_WRITER = "WRITER";
    public static final String ROLE_READER = "READER";

    /**
     * Проверка прав на чтение репозитория
     */
    public void checkReadAccess(Repository repository) {
        User currentUser = userService.getCurrentUser();

        // Владелец всегда имеет доступ
        if (repository.getOwner().getId().equals(currentUser.getId())) {
            return;
        }

        // Проверяем разрешение
        String role = permissionRepository.findRoleByRepositoryAndUser(repository.getId(), currentUser.getId())
                .orElse(null);

        if (role == null) {
            throw new AccessDeniedException("У вас нет доступа к этому репозиторию");
        }
    }

    /**
     * Проверка прав на запись в репозиторий
     */
    public void checkWriteAccess(Repository repository) {
        User currentUser = userService.getCurrentUser();

        // Владелец всегда имеет доступ
        if (repository.getOwner().getId().equals(currentUser.getId())) {
            return;
        }

        // Проверяем разрешение на запись
        String role = permissionRepository.findRoleByRepositoryAndUser(repository.getId(), currentUser.getId())
                .orElse(null);

        if (role == null || (!role.equals(ROLE_WRITER) && !role.equals(ROLE_OWNER))) {
            throw new AccessDeniedException("У вас нет прав на изменение этого репозитория");
        }
    }

    /**
     * Проверка прав на управление доступом (только владелец)
     */
    public void checkManageAccess(Repository repository) {
        User currentUser = userService.getCurrentUser();

        if (!repository.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Только владелец может управлять доступом");
        }
    }

    /**
     * Добавить пользователя в репозиторий
     */
    @Transactional
    public RepositoryPermission grantAccess(Repository repository, Long userId, String role) {
        checkManageAccess(repository);

        User currentUser = userService.getCurrentUser();
        User targetUser = userService.getUser(userId);

        // Нельзя дать права владельца
        if (role.equals(ROLE_OWNER)) {
            throw new IllegalArgumentException("Нельзя назначить владельца через этот метод");
        }

        // Проверяем, есть ли уже разрешение
        var existing = permissionRepository.findByRepositoryAndUser(repository, targetUser);
        if (existing.isPresent()) {
            // Обновляем роль
            RepositoryPermission permission = existing.get();
            permission.setRole(role);
            return permissionRepository.save(permission);
        }

        // Создаем новое разрешение
        RepositoryPermission permission = new RepositoryPermission(
                repository, targetUser, role, currentUser
        );
        return permissionRepository.save(permission);
    }

    /**
     * Удалить доступ пользователя
     */
    @Transactional
    public void revokeAccess(Repository repository, Long userId) {
        checkManageAccess(repository);

        User targetUser = userService.getUser(userId);

        permissionRepository.findByRepositoryAndUser(repository, targetUser)
                .ifPresent(permissionRepository::delete);
    }

    /**
     * Получить список пользователей с доступом
     */
    public List<User> getUsersWithAccess(Repository repository) {
        checkManageAccess(repository);
        return permissionRepository.findUsersByRepository(repository.getId());
    }

    /**
     * Получить роль пользователя в репозитории
     */
    public String getUserRole(Repository repository, User user) {
        if (repository.getOwner().getId().equals(user.getId())) {
            return ROLE_OWNER;
        }

        return permissionRepository.findRoleByRepositoryAndUser(repository.getId(), user.getId())
                .orElse(null);
    }

    /**
     * Получить список репозиториев, доступных пользователю (кроме собственных)
     */
    public List<Repository> getAccessibleRepositories() {
        User currentUser = userService.getCurrentUser();

        // Репозитории, где есть разрешение
        List<RepositoryPermission> permissions = permissionRepository.findByUser(currentUser);
        return permissions.stream()
                .map(RepositoryPermission::getRepository)
                .toList();
    }

    /**
     * Получить все репозитории пользователя (включая те, где есть доступ)
     */
    public List<Repository> getAllUserRepositories() {
        User currentUser = userService.getCurrentUser();

        // Репозитории, где пользователь владелец (через RepositoryService)
        List<Repository> ownedRepos = repositoryService.getUserRepositories(currentUser);

        // Репозитории, где есть разрешение
        List<Repository> accessibleRepos = getAccessibleRepositories();

        // Объединяем
        ownedRepos.addAll(accessibleRepos);
        return ownedRepos.stream().distinct().toList();
    }
}