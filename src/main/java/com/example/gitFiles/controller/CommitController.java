package com.example.gitFiles.controller;

import com.example.gitFiles.entity.Commit;
import com.example.gitFiles.entity.CommitFile;
import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import com.example.gitFiles.entity.File;
import com.example.gitFiles.service.CommitService;
import com.example.gitFiles.service.RepositoryService;
import com.example.gitFiles.service.UserService;
import com.example.gitFiles.service.FileService;
import com.example.gitFiles.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/commits")
public class CommitController {

    @Autowired
    private CommitService commitService;

    @Autowired
    private UserService userService;

    @Autowired
    private RepositoryService repositoryService;

    @Autowired
    private FileService fileService;

    @Autowired
    private FileStorageService fileStorageService;

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

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        try {
            File file = fileService.getFile(fileId);

            byte[] fileContent = fileStorageService.loadFile(file);

            ByteArrayResource resource = new ByteArrayResource(fileContent);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.parseMediaType(file.getMimeType()))
                    .contentLength(file.getFileSize())
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("Ошибка скачивания файла", e);
        }
    }

    @GetMapping("/{commitId}/download-all")
    public ResponseEntity<Resource> downloadAllFiles(@PathVariable Long commitId) {
        try {
            List<CommitFile> commitFiles = commitService.getCommitFiles(commitId);

            if (commitFiles.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            if (commitFiles.size() == 1) {
                return downloadFile(commitFiles.get(0).getFile().getId());
            }

            // Создаем ZIP архив
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);

            for (CommitFile cf : commitFiles) {
                File file = cf.getFile();
                byte[] content = fileStorageService.loadFile(file);

                String entryName = cf.getFilePathInRepo().startsWith("/")
                        ? cf.getFilePathInRepo().substring(1)
                        : cf.getFilePathInRepo();

                ZipEntry entry = new ZipEntry(entryName);
                zos.putNextEntry(entry);
                zos.write(content);
                zos.closeEntry();
            }

            zos.close();

            ByteArrayResource resource = new ByteArrayResource(baos.toByteArray());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"commit-" + commitId + ".zip\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("Ошибка создания ZIP архива", e);
        }
    }
}