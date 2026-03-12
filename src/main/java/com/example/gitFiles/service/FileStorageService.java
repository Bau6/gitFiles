package com.example.gitFiles.service;

import com.example.gitFiles.entity.File;
import com.example.gitFiles.repository.FileRepository;
import com.example.gitFiles.util.HashUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileStorageService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private Path fileStoragePath;


    // сохранение файла на диск и в БД
    // @return сохраненная сущность File (существующая или новая)

    public File saveFile(MultipartFile multipartFile) {
        try {
            String hash = HashUtil.calculateSha256(multipartFile);

            java.util.Optional<File> existingFile = fileRepository.findByFileHash(hash);
            if (existingFile.isPresent()) {
                return existingFile.get();
            }

            String storagePath = HashUtil.getStoragePath(hash);
            Path fullPath = fileStoragePath.resolve(storagePath);
            Files.createDirectories(fullPath.getParent());

            Files.copy(multipartFile.getInputStream(), fullPath, StandardCopyOption.REPLACE_EXISTING);

            File file = new File(
                    multipartFile.getOriginalFilename(),
                    storagePath,
                    hash,
                    multipartFile.getSize(),
                    multipartFile.getContentType()
            );

            return fileRepository.save(file);

        } catch (IOException e) {
            throw new RuntimeException("Ошибка сохранения файла", e);
        }
    }


    // загрузка файла с диска

    public byte[] loadFile(File file) {
        try {
            Path path = fileStoragePath.resolve(file.getStoragePath());
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Ошибка загрузки файла", e);
        }
    }


    // проверка существования файла по хэшу

    public boolean fileExists(String hash) {
        return fileRepository.findByFileHash(hash).isPresent();
    }
}
