package com.example.gitFiles.controller;

import com.example.gitFiles.dto.RepositoryDto;
import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.service.RepositoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/repositories")
public class RepositoryController {

    @Autowired
    private RepositoryService repositoryService;

    @PostMapping
    public ResponseEntity<RepositoryDto> createRepository(
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        Repository repository = repositoryService.createRepository(name, description);
        return ResponseEntity.ok(new RepositoryDto(repository));
    }

    @PostMapping("/with-visibility")
    public ResponseEntity<RepositoryDto> createRepositoryWithVisibility(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam String visibility) {
        Repository repository = repositoryService.createRepository(name, description, visibility);
        return ResponseEntity.ok(new RepositoryDto(repository));
    }

    @GetMapping("/my")
    public ResponseEntity<List<RepositoryDto>> getMyRepositories() {
        List<Repository> repositories = repositoryService.getCurrentUserRepositories();
        List<RepositoryDto> dtos = repositories.stream()
                .map(RepositoryDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/public")
    public ResponseEntity<List<RepositoryDto>> getPublicRepositories() {
        List<Repository> repositories = repositoryService.getPublicRepositories();
        List<RepositoryDto> dtos = repositories.stream()
                .map(RepositoryDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepositoryDto> getRepository(@PathVariable Long id) {
        Repository repository = repositoryService.getRepository(id);
        return ResponseEntity.ok(new RepositoryDto(repository));
    }

    @GetMapping("/{id}/detailed")
    public ResponseEntity<Repository> getRepositoryDetailed(@PathVariable Long id) {
        Repository repository = repositoryService.getRepository(id);
        return ResponseEntity.ok(repository);
    }

    @PostMapping("/{id}/visibility")
    public ResponseEntity<RepositoryDto> changeVisibility(
            @PathVariable Long id,
            @RequestParam String visibility) {
        Repository repository = repositoryService.changeVisibility(id, visibility);
        return ResponseEntity.ok(new RepositoryDto(repository));
    }

    @GetMapping("/all")
    public ResponseEntity<List<RepositoryDto>> getAllRepositories() {
        List<Repository> repositories = repositoryService.getAllRepositories();
        List<RepositoryDto> dtos = repositories.stream()
                .map(RepositoryDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}