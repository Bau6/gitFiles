package com.example.gitFiles.controller;

import com.example.gitFiles.entity.Commit;
import com.example.gitFiles.entity.CommitFile;
import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import com.example.gitFiles.service.CommitService;
import com.example.gitFiles.service.RepositoryService;
import com.example.gitFiles.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/commits")
public class CommitController {

    @Autowired
    private CommitService commitService;

    @Autowired
    private UserService userService;

    @Autowired
    private RepositoryService repositoryService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Commit> createCommit(
            @RequestParam String message,
            @RequestParam Long authorId,
            @RequestParam Long repositoryId,
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam("paths") List<String> paths) {

        User author = userService.getUser(authorId);
        Repository repository = repositoryService.getRepository(repositoryId);

        Commit commit = commitService.createCommit(message, author, repository, files, paths);
        return ResponseEntity.ok(commit);
    }

    @GetMapping("/repository/{repositoryId}")
    public ResponseEntity<List<Commit>> getRepositoryCommits(@PathVariable Long repositoryId) {
        List<Commit> commits = commitService.getRepositoryCommits(repositoryId);
        return ResponseEntity.ok(commits);
    }

    @GetMapping("/{id}/files")
    public ResponseEntity<List<CommitFile>> getCommitFiles(@PathVariable Long id) {
        List<CommitFile> files = commitService.getCommitFiles(id);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Commit> getCommit(@PathVariable Long id) {
        Commit commit = commitService.getCommit(id);
        return ResponseEntity.ok(commit);
    }
}