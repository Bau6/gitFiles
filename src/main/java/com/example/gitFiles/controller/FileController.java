package com.example.gitFiles.controller;

import com.example.gitFiles.service.FileStorageService;
import com.example.gitFiles.service.RepositoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private RepositoryService repositoryService;

    /**
     * Сканировать локальную папку и вернуть список файлов
     */
    @PostMapping("/scan")
    public ResponseEntity<?> scanLocalFolder(@RequestBody Map<String, String> request) {
        try {
            String path = request.get("path");
            Long repoId = Long.parseLong(request.get("repoId"));

            if (path == null || path.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Путь не указан"
                ));
            }

            Path rootPath = Paths.get(path);
            if (!Files.exists(rootPath)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Указанный путь не существует"
                ));
            }

            if (!Files.isDirectory(rootPath)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Указанный путь не является папкой"
                ));
            }

            // Сканируем папку рекурсивно
            List<Map<String, Object>> files = new ArrayList<>();

            Files.walk(rootPath)
                    .filter(Files::isRegularFile)
                    .forEach(filePath -> {
                        try {
                            Map<String, Object> fileInfo = new HashMap<>();
                            String relativePath = rootPath.relativize(filePath).toString().replace("\\", "/");

                            fileInfo.put("path", "/" + relativePath);
                            fileInfo.put("name", filePath.getFileName().toString());
                            fileInfo.put("size", Files.size(filePath));
                            fileInfo.put("lastModified", Files.getLastModifiedTime(filePath).toMillis());
                            fileInfo.put("absolutePath", filePath.toString());

                            // Определяем MIME-тип
                            String mimeType = Files.probeContentType(filePath);
                            fileInfo.put("mimeType", mimeType != null ? mimeType : "application/octet-stream");

                            files.add(fileInfo);
                        } catch (IOException e) {
                            // Пропускаем файлы, которые не удалось прочитать
                        }
                    });

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "path", path,
                    "files", files,
                    "count", files.size()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Загрузить файлы из локальной папки на сервер
     */
    @PostMapping("/upload-folder")
    public ResponseEntity<?> uploadFolder(@RequestParam Long repositoryId,
                                          @RequestParam String localPath,
                                          @RequestParam(required = false) String commitMessage) {
        try {
            Path rootPath = Paths.get(localPath);
            if (!Files.exists(rootPath) || !Files.isDirectory(rootPath)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Некорректный путь к папке"
                ));
            }

            // Собираем все файлы из папки
            List<Path> allFiles = Files.walk(rootPath)
                    .filter(Files::isRegularFile)
                    .collect(Collectors.toList());

            if (allFiles.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Папка не содержит файлов"
                ));
            }

            // Здесь можно создать коммит со всеми файлами
            // Для этого нужно будет преобразовать файлы в MultipartFile
            // Это сложно сделать напрямую, поэтому лучше использовать отдельный сервис

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Найдено файлов: " + allFiles.size(),
                    "files", allFiles.stream()
                            .map(p -> rootPath.relativize(p).toString())
                            .collect(Collectors.toList())
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Получить информацию о файле по пути
     */
    @PostMapping("/info")
    public ResponseEntity<?> getFileInfo(@RequestBody Map<String, String> request) {
        try {
            String path = request.get("path");

            Path filePath = Paths.get(path);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> info = new HashMap<>();
            info.put("name", filePath.getFileName().toString());
            info.put("size", Files.size(filePath));
            info.put("lastModified", Files.getLastModifiedTime(filePath).toMillis());
            info.put("isDirectory", Files.isDirectory(filePath));

            if (!Files.isDirectory(filePath)) {
                String mimeType = Files.probeContentType(filePath);
                info.put("mimeType", mimeType != null ? mimeType : "application/octet-stream");
            }

            return ResponseEntity.ok(info);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Проверить, существует ли локальная папка
     */
    @PostMapping("/check-path")
    public ResponseEntity<?> checkPath(@RequestBody Map<String, String> request) {
        try {
            String path = request.get("path");

            Path filePath = Paths.get(path);
            boolean exists = Files.exists(filePath);
            boolean isDirectory = exists && Files.isDirectory(filePath);

            return ResponseEntity.ok(Map.of(
                    "exists", exists,
                    "isDirectory", isDirectory,
                    "path", path
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }
}