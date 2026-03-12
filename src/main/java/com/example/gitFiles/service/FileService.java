package com.example.gitFiles.service;

import com.example.gitFiles.entity.File;
import com.example.gitFiles.repository.FileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FileService {

    @Autowired
    private FileRepository fileRepository;

    public File getFile(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Файл не найден с id: " + id));
    }
}