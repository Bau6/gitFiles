package com.example.gitFiles.service;

import com.example.gitFiles.entity.Commit;
import com.example.gitFiles.entity.CommitFile;
import com.example.gitFiles.entity.File;
import com.example.gitFiles.entity.Repository;
import com.example.gitFiles.entity.User;
import com.example.gitFiles.repository.CommitFileRepository;
import com.example.gitFiles.repository.CommitRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Transactional
    public Commit createCommit(String message, User author, Repository repository,
                               List<MultipartFile> files, List<String> filePaths) {

        // создание коммита
        Commit commit = new Commit(message, author, repository);
        commit = commitRepository.save(commit);

        // обработка каждого файла
        for (int i = 0; i < files.size(); i++) {
            MultipartFile multipartFile = files.get(i);
            String pathInRepo = filePaths.get(i);

            // сохранение
            File file = fileStorageService.saveFile(multipartFile);

            // связь файла с коммитом
            commit.addFile(file, pathInRepo);
        }

        // сохранение связи
        return commitRepository.save(commit);
    }

    public List<Commit> getRepositoryCommits(Long repositoryId) {
        return commitRepository.findByRepositoryIdOrderByCreatedAtDesc(repositoryId);
    }

    public List<CommitFile> getCommitFiles(Long commitId) {
        return commitFileRepository.findByCommitId(commitId);
    }

    public Commit getCommit(Long id) {
        return commitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Коммит не найден"));
    }
}