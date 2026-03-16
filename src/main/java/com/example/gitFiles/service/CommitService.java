package com.example.gitFiles.service;

import com.example.gitFiles.entity.*;
import com.example.gitFiles.repository.CommitFileRepository;
import com.example.gitFiles.repository.CommitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class CommitService {

    @Autowired
    private CommitRepository commitRepository;

    @Autowired
    private CommitFileRepository commitFileRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private RepositoryService repositoryService;

    @Autowired
    private UserService userService;

    @Transactional
    public Commit createCommit(String message, Long repositoryId,
                               List<MultipartFile> files, List<String> filePaths) {

        User author = userService.getCurrentUser();
        Repository repository = repositoryService.getRepository(repositoryId);

        Commit commit = new Commit(message, author, repository);
        commit = commitRepository.save(commit);

        for (int i = 0; i < files.size(); i++) {
            MultipartFile multipartFile = files.get(i);
            String pathInRepo = filePaths.get(i);

            File file = fileStorageService.saveFile(multipartFile);
            commit.addFile(file, pathInRepo);
        }

        return commitRepository.save(commit);
    }

    public List<Commit> getRepositoryCommits(Long repositoryId) {
        // Проверяем доступ через repositoryService.getRepository()
        Repository repo = repositoryService.getRepository(repositoryId);
        return commitRepository.findByRepositoryOrderByCreatedAtDesc(repo);
    }

    public List<CommitFile> getCommitFiles(Long commitId) {
        Commit commit = getCommit(commitId);
        return commitFileRepository.findByCommit(commit);
    }

    public Commit getCommit(Long id) {
        Commit commit = commitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Коммит не найден"));

        // Проверяем доступ через владельца репозитория
        repositoryService.getRepository(commit.getRepository().getId());

        return commit;
    }
}