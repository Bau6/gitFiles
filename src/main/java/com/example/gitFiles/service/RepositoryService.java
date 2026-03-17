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

    public Repository createRepository(String name, String description, String visibility) {
        User currentUser = userService.getCurrentUser();
        Repository repository = new Repository(name, description, currentUser);
        repository.setVisibility(visibility);
        return repositoryRepository.save(repository);
    }

    public List<Repository> getUserRepositories(User user) {
        return repositoryRepository.findByOwner(user);
    }

    public List<Repository> getCurrentUserRepositories() {
        User currentUser = userService.getCurrentUser();
        List<Repository> owned = getUserRepositories(currentUser);
        List<Repository> accessible = permissionService.getAccessibleRepositories();
        owned.addAll(accessible);
        return owned.stream().distinct().toList();
    }

    // НОВЫЙ МЕТОД: все публичные репозитории
    public List<Repository> getPublicRepositories() {
        return repositoryRepository.findByVisibility("PUBLIC");
    }

    // НОВЫЙ МЕТОД: все репозитории, доступные текущему пользователю (с учетом публичности)
    public List<Repository> getAllAccessibleRepositories() {
        User currentUser = userService.getCurrentUser();

        // Публичные репозитории
        List<Repository> publicRepos = repositoryRepository.findByVisibility("PUBLIC");

        // Репозитории, где пользователь имеет доступ (свои + по разрешениям)
        List<Repository> accessible = getCurrentUserRepositories();

        // Объединяем
        publicRepos.addAll(accessible);
        return publicRepos.stream().distinct().toList();
    }

    public Repository getRepository(Long id) {
        Repository repo = repositoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Репозиторий не найден"));

        // Если репозиторий публичный, проверяем только при необходимости
        if ("PUBLIC".equals(repo.getVisibility())) {
            return repo;
        }

        // Если приватный - проверяем доступ
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

    // НОВЫЙ МЕТОД: изменить видимость
    public Repository changeVisibility(Long id, String visibility) {
        Repository repo = getRepositoryForManage(id);
        repo.setVisibility(visibility);
        return repositoryRepository.save(repo);
    }

    public List<Repository> getAllRepositories() {
        return repositoryRepository.findAll();
    }
}