import React, { useState, useEffect } from 'react';
import API from '../api';

function History({ repoId, onBack }) {
    const [commits, setCommits] = useState([]);
    const [selectedCommit, setSelectedCommit] = useState(null);
    const [commitFiles, setCommitFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [repoId]);

    const loadHistory = async () => {
        try {
            const response = await API.get(`/commits/repository/${repoId}`);
            setCommits(response.data);
        } catch (err) {
            console.error('Ошибка загрузки истории', err);
        } finally {
            setLoading(false);
        }
    };

    const loadCommitFiles = async (commitId) => {
        try {
            const response = await API.get(`/commits/${commitId}/files`);
            setCommitFiles(response.data);
            setSelectedCommit(commitId);
        } catch (err) {
            console.error('Ошибка загрузки файлов коммита', err);
        }
    };

    if (loading) return <div>Загрузка...</div>;

    return (
        <div>
            <button onClick={onBack}>← Назад в репозиторий</button>

            <h2>История версий</h2>

            {commits.length === 0 ? (
                <p>История коммитов пуста</p>
            ) : (
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
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
                                    <td>{commit.author.username}</td>
                                    <td>{commit.message}</td>
                                    <td>
                                        <button onClick={() => loadCommitFiles(commit.id)}>
                                            Просмотр
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedCommit && (
                        <div style={{ flex: 1 }}>
                            <h3>Файлы в коммите</h3>
                            <table>
                                <thead>
                                <tr>
                                    <th>Путь</th>
                                    <th>Имя файла</th>
                                </tr>
                                </thead>
                                <tbody>
                                {commitFiles.map((cf, idx) => (
                                    <tr key={idx}>
                                        <td>{cf.filePathInRepo}</td>
                                        <td>{cf.file.filename}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default History;