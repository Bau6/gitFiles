package com.example.gitFiles.controller;

import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import com.example.gitFiles.service.PermissionService;
import com.example.gitFiles.service.RepositoryService;
import com.example.gitFiles.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/repositories/{repositoryId}/permissions")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private RepositoryService repositoryService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<?> getPermissions(@PathVariable Long repositoryId) {
        try {
            Repository repo = repositoryService.getRepositoryForManage(repositoryId);
            List<User> users = permissionService.getUsersWithAccess(repo);

            return ResponseEntity.ok(users.stream().map(user -> {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("username", user.getUsername());
                userInfo.put("email", user.getEmail());

                String role = permissionService.getUserRole(repo, user);
                userInfo.put("role", role);

                return userInfo;
            }));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/grant")
    public ResponseEntity<?> grantAccess(
            @PathVariable Long repositoryId,
            @RequestParam Long userId,
            @RequestParam String role) {
        try {
            Repository repo = repositoryService.getRepositoryForManage(repositoryId);
            var permission = permissionService.grantAccess(repo, userId, role);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Доступ предоставлен",
                    "userId", userId,
                    "role", role
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/revoke")
    public ResponseEntity<?> revokeAccess(
            @PathVariable Long repositoryId,
            @RequestParam Long userId) {
        try {
            Repository repo = repositoryService.getRepositoryForManage(repositoryId);
            permissionService.revokeAccess(repo, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Доступ отозван"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/my-role")
    public ResponseEntity<?> getMyRole(@PathVariable Long repositoryId) {
        try {
            Repository repo = repositoryService.getRepository(repositoryId);
            User currentUser = userService.getCurrentUser();

            String role;
            if (repo.getOwner().getId().equals(currentUser.getId())) {
                role = PermissionService.ROLE_OWNER;
            } else {
                role = permissionService.getUserRole(repo, currentUser);
            }

            return ResponseEntity.ok(Map.of(
                    "role", role != null ? role : "NONE"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("role", "NONE"));
        }
    }
}