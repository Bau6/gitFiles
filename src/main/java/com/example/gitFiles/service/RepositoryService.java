package com.example.gitFiles.service;

import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import com.example.gitFiles.repository.RepositoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RepositoryService {

    @Autowired
    private RepositoryRepository repositoryRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PermissionService permissionService;

    public Repository createRepository(String name, String description) {
        User currentUser = userService.getCurrentUser();
        Repository repository = new Repository(name, description, currentUser);
        return repositoryRepository.save(repository);
    }

    /**
     * Получить репозитории, где пользователь является владельцем
     */
    public List<Repository> getUserRepositories(User user) {
        return repositoryRepository.findByOwner(user);
    }

    /**
     * Получить репозитории текущего пользователя (владеемые + доступные)
     */
    public List<Repository> getCurrentUserRepositories() {
        User currentUser = userService.getCurrentUser();

        // Владеемые репозитории
        List<Repository> owned = getUserRepositories(currentUser);

        // Репозитории с доступом
        List<Repository> accessible = permissionService.getAccessibleRepositories();

        // Объединяем и убираем дубликаты
        owned.addAll(accessible);
        return owned.stream().distinct().toList();
    }

    public Repository getRepository(Long id) {
        Repository repo = repositoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Репозиторий не найден"));

        // Проверяем доступ на чтение
        permissionService.checkReadAccess(repo);

        return repo;
    }

    public Repository getRepositoryForWrite(Long id) {
        Repository repo = getRepository(id);
        permissionService.checkWriteAccess(repo);
        return repo;
    }

    public Repository getRepositoryForManage(Long id) {
        Repository repo = getRepository(id);
        permissionService.checkManageAccess(repo);
        return repo;
    }

    public List<Repository> getAllRepositories() {
        // Только для админов (пока заглушка)
        return repositoryRepository.findAll();
    }
}