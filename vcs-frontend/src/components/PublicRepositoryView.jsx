import React, { useState, useEffect } from 'react';
import API from '../api';

function PublicRepositoryView({ repoId, onBack }) {
    const [repo, setRepo] = useState(null);
    const [files, setFiles] = useState([]);
    const [commits, setCommits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCommit, setSelectedCommit] = useState(null);
    const [commitFiles, setCommitFiles] = useState([]);

    useEffect(() => {
        loadRepository();
    }, [repoId]);

    const loadRepository = async () => {
        try {
            // Загружаем информацию о репозитории
            const repoRes = await API.get(`/repositories/${repoId}`);
            setRepo(repoRes.data);

            // Загружаем коммиты
            const commitsRes = await API.get(`/commits/repository/${repoId}`);
            setCommits(commitsRes.data);

            // Загружаем последние файлы
            if (commitsRes.data.length > 0) {
                const lastCommit = commitsRes.data[0];
                await loadCommitFiles(lastCommit.id);
            }
        } catch (err) {
            console.error('Ошибка загрузки репозитория', err);
        } finally {
            setLoading(false);
        }
    };

    const loadCommitFiles = async (commitId) => {
        try {
            const filesRes = await API.get(`/commits/${commitId}/files`);
            setFiles(filesRes.data);
            setSelectedCommit(commitId);
        } catch (err) {
            console.error('Ошибка загрузки файлов', err);
        }
    };

    const downloadFile = (fileId, filename) => {
        window.open(`http://localhost:8080/api/commits/files/${fileId}/download`);
    };

    const downloadAllFiles = () => {
        window.open(`http://localhost:8080/api/commits/${selectedCommit || commits[0]?.id}/download-all`);
    };

    if (loading) return <div>Загрузка...</div>;
    if (!repo) return <div>Репозиторий не найден</div>;

    return (
        <div>
            <button onClick={onBack}>← Назад к публичным репозиториям</button>

            <h2>{repo.name}
                <span style={{ fontSize: '0.6em', color: '#666', marginLeft: '10px' }}>
                    🌍 публичный репозиторий
                </span>
            </h2>
            <p>{repo.description}</p>
            <p><strong>Владелец:</strong> {repo.owner?.username || 'Неизвестно'}</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={downloadAllFiles}>
                    📦 Скачать все файлы ZIP
                </button>
            </div>

            <div className="card">
                <h3>Коммиты</h3>
                {commits.length === 0 ? (
                    <p>Нет коммитов</p>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Автор</th>
                            <th>Сообщение</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {commits.map(commit => (
                            <tr key={commit.id}>
                                <td>{new Date(commit.createdAt).toLocaleString()}</td>
                                <td>{commit.author?.username || 'Неизвестно'}</td>
                                <td>{commit.message}</td>
                                <td>
                                    <button onClick={() => loadCommitFiles(commit.id)}>
                                        Просмотр файлов
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {files.length > 0 && (
                <div className="card">
                    <h3>Файлы в коммите {selectedCommit && `#${selectedCommit}`}</h3>
                    <table>
                        <thead>
                        <tr>
                            <th>Путь</th>
                            <th>Имя файла</th>
                            <th>Размер</th>
                            <th>Тип</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {files.map((cf, index) => (
                            <tr key={index}>
                                <td>{cf.filePathInRepo}</td>
                                <td>{cf.file?.filename || 'Неизвестно'}</td>
                                <td>{(cf.file?.fileSize / 1024).toFixed(2)} KB</td>
                                <td>{cf.file?.mimeType || 'Неизвестно'}</td>
                                <td>
                                    <button onClick={() => downloadFile(cf.file.id, cf.file.filename)}>
                                        Скачать
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default PublicRepositoryView;