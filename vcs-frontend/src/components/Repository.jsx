import React, { useState, useEffect } from 'react';
import API from '../api';

function Repository({ repoId, userId, onBack, onShowHistory }) {
    const [repo, setRepo] = useState(null);
    const [files, setFiles] = useState([]);
    const [commitMessage, setCommitMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filePaths, setFilePaths] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRepository();
    }, [repoId]);

    const loadRepository = async () => {
        try {
            const repoRes = await API.get(`/repositories/${repoId}`);
            setRepo(repoRes.data);

            // Загружаем последний коммит
            const commitsRes = await API.get(`/commits/repository/${repoId}`);
            if (commitsRes.data.length > 0) {
                const lastCommit = commitsRes.data[0];
                const filesRes = await API.get(`/commits/${lastCommit.id}/files`);
                setFiles(filesRes.data);
            }
        } catch (err) {
            console.error('Ошибка загрузки репозитория', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFiles(e.target.files);
        // Создаем массив путей (по умолчанию /filename)
        const paths = Array.from(e.target.files).map(f => `/${f.name}`);
        setFilePaths(paths);
    };

    const updateFilePath = (index, path) => {
        const newPaths = [...filePaths];
        newPaths[index] = path;
        setFilePaths(newPaths);
    };

    const createCommit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) return;

        const formData = new FormData();
        formData.append('message', commitMessage);
        formData.append('authorId', userId);
        formData.append('repositoryId', repoId);

        Array.from(selectedFiles).forEach(file => {
            formData.append('files', file);
        });

        filePaths.forEach(path => {
            formData.append('paths', path);
        });

        try {
            await API.post('/commits', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setCommitMessage('');
            setSelectedFiles([]);
            setFilePaths([]);
            loadRepository(); // перезагружаем
        } catch (err) {
            console.error('Ошибка создания коммита', err);
        }
    };

    const downloadFile = (fileId, filename) => {
        window.open(`http://localhost:8080/api/commits/files/${fileId}/download`);
    };

    if (loading) return <div>Загрузка...</div>;
    if (!repo) return <div>Репозиторий не найден</div>;

    return (
        <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={onBack}>← Назад к репозиториям</button>
                <button onClick={onShowHistory}>История версий</button>
            </div>

            <h2>{repo.name}</h2>
            <p>{repo.description}</p>

            <div className="card">
                <h3>Новый коммит</h3>
                <form onSubmit={createCommit}>
                    <input
                        type="text"
                        placeholder="Сообщение коммита"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        required
                    />

                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        required
                    />

                    {selectedFiles.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <h4>Пути файлов в репозитории:</h4>
                            {Array.from(selectedFiles).map((file, index) => (
                                <div key={index}>
                                    <input
                                        type="text"
                                        value={filePaths[index] || `/${file.name}`}
                                        onChange={(e) => updateFilePath(index, e.target.value)}
                                        placeholder="Путь к файлу"
                                    />
                                    <small>Файл: {file.name}</small>
                                </div>
                            ))}
                        </div>
                    )}

                    <button type="submit">Создать коммит</button>
                </form>
            </div>

            <h3>Текущие файлы</h3>
            {files.length === 0 ? (
                <p>В репозитории пока нет файлов</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Путь в репозитории</th>
                        <th>Имя файла</th>
                        <th>Размер</th>
                        <th>Тип</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {files.map((cf, index) => (
                        <tr key={index}>
                            <td>{cf.filePathInRepo}</td>
                            <td>{cf.file?.filename || 'Неизвестно'}</td>
                            <td>{cf.file?.fileSize || 0} байт</td>
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
            )}
        </div>
    );
}

export default Repository;