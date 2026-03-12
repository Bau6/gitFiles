package com.example.gitFiles.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {

    @Value("${file.storage.path:./storage}")
    private String storagePath;

    @Bean
    public Path fileStoragePath() {
        return Paths.get(storagePath).toAbsolutePath().normalize();
    }
}