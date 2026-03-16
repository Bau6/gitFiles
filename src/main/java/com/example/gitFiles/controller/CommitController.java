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
import java.util.*;
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
            @RequestParam Long repositoryId,
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam("paths") List<String> paths) {

        Commit commit = commitService.createCommit(message, repositoryId, files, paths);
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

    /**
     * Получить дерево файлов коммита (структура папок)
     */
    @GetMapping("/{commitId}/tree")
    public ResponseEntity<?> getFileTree(@PathVariable Long commitId) {
        try {
            List<CommitFile> files = commitService.getCommitFiles(commitId);

            // Строим дерево
            Map<String, Object> tree = buildFileTree(files);

            return ResponseEntity.ok(tree);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Скачать структуру репозитория как ZIP с сохранением папок
     */
    @GetMapping("/{commitId}/download-structure")
    public ResponseEntity<Resource> downloadStructure(@PathVariable Long commitId) {
        try {
            List<CommitFile> commitFiles = commitService.getCommitFiles(commitId);

            if (commitFiles.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);

            for (CommitFile cf : commitFiles) {
                File file = cf.getFile();
                byte[] content = fileStorageService.loadFile(file);

                // Убираем ведущий слеш для ZipEntry
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
                            "attachment; filename=\"repository-structure.zip\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("Ошибка создания структуры", e);
        }
    }

    /**
     * Вспомогательный метод для построения дерева файлов
     */
    private Map<String, Object> buildFileTree(List<CommitFile> files) {
        Map<String, Object> root = new HashMap<>();
        root.put("name", "/");
        root.put("type", "directory");
        root.put("children", new ArrayList<Map<String, Object>>());

        for (CommitFile cf : files) {
            String path = cf.getFilePathInRepo();
            if (path.startsWith("/")) {
                path = path.substring(1);
            }

            String[] parts = path.split("/");
            addToTree(root, parts, 0, cf);
        }

        return root;
    }

    /**
     * Рекурсивное добавление элемента в дерево
     */
    @SuppressWarnings("unchecked")
    private void addToTree(Map<String, Object> node, String[] parts, int index, CommitFile cf) {
        if (index >= parts.length) return;

        String current = parts[index];
        List<Map<String, Object>> children = (List<Map<String, Object>>) node.get("children");

        // Ищем существующий узел
        Map<String, Object> child = children.stream()
                .filter(c -> c.get("name").equals(current))
                .findFirst()
                .orElse(null);

        if (child == null) {
            child = new HashMap<>();
            child.put("name", current);
            if (index == parts.length - 1) {
                // Это файл
                child.put("type", "file");
                child.put("fileId", cf.getFile().getId());
                child.put("size", cf.getFile().getFileSize());
                child.put("mimeType", cf.getFile().getMimeType());
            } else {
                // Это папка
                child.put("type", "directory");
                child.put("children", new ArrayList<Map<String, Object>>());
            }
            children.add(child);
        }

        if (index < parts.length - 1) {
            addToTree(child, parts, index + 1, cf);
        }
    }

    /**
     * Получить плоский список файлов коммита
     */
    @GetMapping("/{commitId}/files-list")
    public ResponseEntity<List<Map<String, Object>>> getFilesList(@PathVariable Long commitId) {
        try {
            List<CommitFile> commitFiles = commitService.getCommitFiles(commitId);

            List<Map<String, Object>> filesList = new ArrayList<>();

            for (CommitFile cf : commitFiles) {
                Map<String, Object> fileInfo = new HashMap<>();
                fileInfo.put("path", cf.getFilePathInRepo());
                fileInfo.put("fileId", cf.getFile().getId());
                fileInfo.put("name", cf.getFile().getFilename());
                fileInfo.put("size", cf.getFile().getFileSize());
                fileInfo.put("mimeType", cf.getFile().getMimeType());
                filesList.add(fileInfo);
            }

            return ResponseEntity.ok(filesList);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}