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

    public Repository createRepository(String name, String description, User owner) {
        Repository repository = new Repository(name, description, owner);
        return repositoryRepository.save(repository);
    }

    public List<Repository> getUserRepositories(User user) {
        return repositoryRepository.findByOwner(user);
    }

    public Repository getRepository(Long id) {
        return repositoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Репозиторий не найден"));
    }

    public List<Repository> getAllRepositories() {
        return repositoryRepository.findAll();
    }
}