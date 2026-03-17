package com.example.gitFiles.service;

import com.example.gitFiles.entity.User;
import com.example.gitFiles.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                new ArrayList<>());
    }

    public User createUser(String username, String password, String email) {
        // Проверяем, существует ли пользователь
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Пользователь с таким логином уже существует");
        }

        // Проверяем email (опционально)
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email не может быть пустым");
        }

        // Хешируем пароль
        String hashedPassword = passwordEncoder.encode(password);

        // Создаем пользователя
        User user = new User(username, hashedPassword, email);

        // Сохраняем
        User savedUser = userRepository.save(user);

        System.out.println("Сохранен пользователь: " + savedUser.getUsername() + " с id=" + savedUser.getId());

        return savedUser;
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    public boolean checkPassword(String rawPassword, String storedHash) {
        return passwordEncoder.matches(rawPassword, storedHash);
    }

    public User getCurrentUser() {
        // Этот метод будем использовать в контроллерах
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return getUserByUsername(username);
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }
}