package com.example.gitFiles.controller;

import com.example.gitFiles.entity.User;
import com.example.gitFiles.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<User> createUser(@RequestParam String username,
                                           @RequestParam String password,
                                           @RequestParam String email) {
        User user = userService.createUser(username, password, email);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String username,
                                   @RequestParam String password) {
        try {
            User user = userService.getUserByUsername(username);

            if (userService.checkPassword(password, user.getPasswordHash())) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Вход выполнен успешно",
                        "userId", user.getId()
                ));
            } else {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Неверный пароль"
                ));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Пользователь не найден"
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.getUser(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/by-username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        return ResponseEntity.ok(user);
    }
}