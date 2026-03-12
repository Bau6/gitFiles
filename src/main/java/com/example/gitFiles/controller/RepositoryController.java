package com.example.gitFiles.controller;

import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import com.example.gitFiles.service.RepositoryService;
import com.example.gitFiles.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories")
public class RepositoryController {

    @Autowired
    private RepositoryService repositoryService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<Repository> createRepository(@RequestParam String name,
                                                       @RequestParam(required = false) String description,
                                                       @RequestParam Long ownerId) {
        User owner = userService.getUser(ownerId);
        Repository repository = repositoryService.createRepository(name, description, owner);
        return ResponseEntity.ok(repository);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Repository> getRepository(@PathVariable Long id) {
        Repository repository = repositoryService.getRepository(id);
        return ResponseEntity.ok(repository);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Repository>> getUserRepositories(@PathVariable Long userId) {
        User user = userService.getUser(userId);
        List<Repository> repositories = repositoryService.getUserRepositories(user);
        return ResponseEntity.ok(repositories);
    }

    @GetMapping
    public ResponseEntity<List<Repository>> getAllRepositories() {
        List<Repository> repositories = repositoryService.getAllRepositories();
        return ResponseEntity.ok(repositories);
    }
}
