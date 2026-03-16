package com.example.gitFiles.controller;

import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.service.RepositoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories")
public class RepositoryController {

    @Autowired
    private RepositoryService repositoryService;

    @PostMapping
    public ResponseEntity<Repository> createRepository(@RequestParam String name,
                                                       @RequestParam(required = false) String description) {
        Repository repository = repositoryService.createRepository(name, description);
        return ResponseEntity.ok(repository);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Repository>> getMyRepositories() {
        List<Repository> repositories = repositoryService.getCurrentUserRepositories();
        return ResponseEntity.ok(repositories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Repository> getRepository(@PathVariable Long id) {
        Repository repository = repositoryService.getRepository(id);
        return ResponseEntity.ok(repository);
    }
}