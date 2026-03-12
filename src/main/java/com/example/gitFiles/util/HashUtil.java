package com.example.gitFiles.util;

import org.springframework.web.multipart.MultipartFile;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public class HashUtil {

    public static String calculateSha256(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(file.getBytes());
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException | java.io.IOException e) {
            throw new RuntimeException("Ошибка вычисления хэша", e);
        }
    }

    public static String calculateSha256(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(content);
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Ошибка вычисления хэша", e);
        }
    }

    public static String getStoragePath(String hash) {
        // Разбиваем хэш на подпапки: первые 2 символа / следующие 2 символа / весь хэш
        return hash.substring(0, 2) + "/" + hash.substring(2, 4) + "/" + hash;
    }
}
