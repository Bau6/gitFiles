package com.example.gitFiles.controller;

import com.example.gitFiles.entity.User;
import com.example.gitFiles.service.UserService;
import com.example.gitFiles.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestParam String username,
                                      @RequestParam String password,
                                      @RequestParam String email) {
        try {
            // Добавим логирование
            System.out.println("Попытка регистрации: username=" + username + ", email=" + email);

            User user = userService.createUser(username, password, email);

            System.out.println("Пользователь создан с id: " + user.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Регистрация успешна",
                    "userId", user.getId()
            ));
        } catch (Exception e) {
            // Выводим полную информацию об ошибке
            e.printStackTrace();

            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String username,
                                   @RequestParam String password) {
        try {
            User user = userService.getUserByUsername(username);

            if (userService.checkPassword(password, user.getPasswordHash())) {
                String token = jwtUtil.generateToken(username, user.getId());

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Вход выполнен успешен");
                response.put("userId", user.getId());
                response.put("token", token);

                return ResponseEntity.ok(response);
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

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            User user = userService.getCurrentUser();
            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Не авторизован"
            ));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        try {
            // Получаем текущего пользователя для проверки авторизации
            User currentUser = userService.getCurrentUser();

            // Получаем всех пользователей
            java.util.List<User> users = userService.getAllUsers();

            // Возвращаем только безопасные поля (без паролей)
            return ResponseEntity.ok(users.stream().map(user -> Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail()
            )));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }
}