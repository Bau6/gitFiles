package com.example.gitFiles.service;

import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import com.example.gitFiles.repository.RepositoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RepositoryService {

    @Autowired
    private RepositoryRepository repositoryRepository;

    @Autowired
    private UserService userService;

    public Repository createRepository(String name, String description) {
        User currentUser = userService.getCurrentUser();
        Repository repository = new Repository(name, description, currentUser);
        return repositoryRepository.save(repository);
    }

    public List<Repository> getCurrentUserRepositories() {
        User currentUser = userService.getCurrentUser();
        return repositoryRepository.findByOwner(currentUser);
    }

    public Repository getRepository(Long id) {
        Repository repo = repositoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Репозиторий не найден"));

        // Проверяем, принадлежит ли репозиторий текущему пользователю
        User currentUser = userService.getCurrentUser();
        if (!repo.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("У вас нет доступа к этому репозиторию");
        }

        return repo;
    }

    public List<Repository> getAllRepositories() {
        // Только для админов (пока просто все)
        return repositoryRepository.findAll();
    }
}