import React, { useState, useEffect } from 'react';
import API from '../api';

function Repository({ repoId, userId, onBack, onShowHistory }) {
    const [repo, setRepo] = useState(null);
    const [serverFiles, setServerFiles] = useState([]); // файлы на сервере
    const [localFiles, setLocalFiles] = useState([]);   // файлы локально
    const [commitMessage, setCommitMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [workspacePath, setWorkspacePath] = useState('');
    const [workspaceHandle, setWorkspaceHandle] = useState(null); // для File System Access API

    useEffect(() => {
        loadRepository();
        // Проверяем, есть ли сохраненный доступ к папке
        loadSavedWorkspace();
    }, [repoId]);

    // Загружаем сохраненную информацию о рабочей папке
    const loadSavedWorkspace = async () => {
        const savedPath = localStorage.getItem(`workspace-${repoId}`);
        if (savedPath) {
            setWorkspacePath(savedPath);
            // Пытаемся восстановить доступ
            try {
                // Восстановление доступа к папке - сложная тема
                // Пока просто показываем путь
                console.log('Сохраненный путь:', savedPath);
            } catch (err) {
                console.error('Не удалось восстановить доступ к папке');
            }
        }
    };

    // Инициализация локальной рабочей папки
    const initializeWorkspace = async () => {
        try {
            // Запрашиваем у пользователя разрешение на доступ к папке
            const dirHandle = await window.showDirectoryPicker({
                id: `repo-${repoId}`,
                mode: 'readwrite',
                startIn: 'documents'
            });

            // Сохраняем handle и путь
            setWorkspaceHandle(dirHandle);
            setWorkspacePath(dirHandle.name);

            // Сохраняем путь в localStorage для информации
            localStorage.setItem(`workspace-${repoId}`, dirHandle.name);

            // Сканируем локальные файлы
            await scanLocalFiles(dirHandle);

        } catch (err) {
            console.error('Ошибка доступа к папке:', err);
            if (err.name !== 'AbortError') {
                alert('Для работы с репозиторием необходимо выбрать папку');
            }
        }
    };

    // Сканирование локальных файлов
    const scanLocalFiles = async (dirHandle) => {
        const files = [];

        async function scanDir(handle, path = '') {
            for await (const entry of handle.values()) {
                const currentPath = path ? `${path}/${entry.name}` : entry.name;

                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    files.push({
                        name: entry.name,
                        path: currentPath,
                        size: file.size,
                        lastModified: file.lastModified,
                        handle: entry
                    });
                } else if (entry.kind === 'directory') {
                    await scanDir(entry, currentPath);
                }
            }
        }

        await scanDir(dirHandle);
        setLocalFiles(files);
        console.log('Найдено локальных файлов:', files.length);
    };

    const loadRepository = async () => {
        try {
            const repoRes = await API.get(`/repositories/${repoId}`);
            setRepo(repoRes.data);

            // Загружаем файлы с сервера (последний коммит)
            const commitsRes = await API.get(`/commits/repository/${repoId}`);
            if (commitsRes.data.length > 0) {
                const lastCommit = commitsRes.data[0];
                const filesRes = await API.get(`/commits/${lastCommit.id}/files`);
                setServerFiles(filesRes.data);
            }
        } catch (err) {
            console.error('Ошибка загрузки репозитория', err);
        } finally {
            setLoading(false);
        }
    };

    // Сравнение локальных и серверных файлов
    const getFileStatus = (serverFile) => {
        if (!serverFile.file) return 'unknown';

        const serverPath = serverFile.filePathInRepo.slice(1); // убираем ведущий слеш
        const localFile = localFiles.find(f => f.path === serverPath);

        if (!localFile) return 'missing'; // файла нет локально
        if (localFile.size !== serverFile.file.fileSize) return 'modified'; // изменен
        return 'synced'; // синхронизирован
    };

    // Получить локальные файлы, которых нет на сервере
    const getNewLocalFiles = () => {
        const serverPaths = new Set(
            serverFiles.map(cf => cf.filePathInRepo.slice(1))
        );
        return localFiles.filter(f => !serverPaths.has(f.path));
    };

    // Push - отправить локальные изменения на сервер
    const pushToServer = async () => {
        if (!workspaceHandle) {
            alert('Сначала выберите локальную папку');
            await initializeWorkspace();
            return;
        }

        setSyncing(true);
        try {
            const formData = new FormData();
            formData.append('message', commitMessage || 'Push local changes');
            formData.append('repositoryId', repoId);

            // Добавляем ВСЕ локальные файлы (или только измененные/новые)
            const filesToUpload = localFiles; // можно фильтровать по статусу

            for (const file of filesToUpload) {
                const fileBlob = await file.handle.getFile();
                formData.append('files', fileBlob);
                formData.append('paths', '/' + file.path);
            }

            console.log(`Отправка ${filesToUpload.length} файлов...`);

            const response = await API.post('/commits', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 200) {
                // Перезагружаем серверные файлы
                await loadRepository();
                setCommitMessage('');
                alert('Изменения успешно отправлены на сервер!');
            }
        } catch (err) {
            console.error('Ошибка push', err);
            alert('Ошибка при отправке: ' + (err.response?.data?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    // Функция для создания файла в локальной папке
    const saveFileToWorkspace = async (fileData, relativePath) => {
        if (!workspaceHandle) {
            throw new Error('Рабочая папка не выбрана');
        }

        // Разбиваем путь на части
        const pathParts = relativePath.split('/').filter(p => p);
        const fileName = pathParts.pop();

        // Находим или создаем нужные подпапки
        let currentHandle = workspaceHandle;
        for (const part of pathParts) {
            currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
        }

        // Создаем файл
        const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(fileData);
        await writable.close();
    };

    // Pull - скачать файлы с сервера в локальную папку
    const pullFromServer = async () => {
        if (!workspaceHandle) {
            alert('Сначала выберите локальную папку');
            await initializeWorkspace();
            return;
        }

        setSyncing(true);
        try {
            const commitsRes = await API.get(`/commits/repository/${repoId}`);
            if (commitsRes.data.length === 0) {
                alert('Репозиторий пуст');
                return;
            }

            const lastCommit = commitsRes.data[0];
            const filesRes = await API.get(`/commits/${lastCommit.id}/files`);

            if (filesRes.data.length === 0) {
                alert('В последнем коммите нет файлов');
                return;
            }

            console.log(`Загрузка ${filesRes.data.length} файлов...`);

            // Создаем или обновляем файлы в локальной папке
            for (const cf of filesRes.data) {
                if (!cf.file) continue;

                const relativePath = cf.filePathInRepo.slice(1); // убираем ведущий слеш

                // Скачиваем файл с сервера
                const response = await API.get(`/commits/files/${cf.file.id}/download`, {
                    responseType: 'blob'
                });

                // Сохраняем в локальную папку
                await saveFileToWorkspace(response.data, relativePath);

                console.log('Сохранен файл:', relativePath);
            }

            // Пересканируем локальные файлы
            await scanLocalFiles(workspaceHandle);

            alert('Файлы успешно загружены с сервера!');
        } catch (err) {
            console.error('Ошибка pull', err);
            alert('Ошибка при загрузке: ' + (err.response?.data?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return <div>Загрузка...</div>;
    if (!repo) return <div>Репозиторий не найден</div>;

    const newLocalFiles = getNewLocalFiles();

    return (
        <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button onClick={onBack}>← Назад к репозиториям</button>
                <button onClick={onShowHistory}>История версий</button>
                {!workspaceHandle && (
                    <button onClick={initializeWorkspace} style={{ backgroundColor: '#28a745' }}>
                        📁 Выбрать локальную папку
                    </button>
                )}
                {workspaceHandle && (
                    <>
                        <button onClick={pullFromServer} disabled={syncing}>
                            {syncing ? '⏳ Синхронизация...' : '📥 Pull (скачать с сервера)'}
                        </button>
                        <button onClick={pushToServer} disabled={syncing}>
                            {syncing ? '⏳ Синхронизация...' : '📤 Push (отправить на сервер)'}
                        </button>
                    </>
                )}
            </div>

            <h2>{repo.name}</h2>
            <p>{repo.description}</p>
            {workspacePath && (
                <p><strong>Локальная папка:</strong> {workspacePath}</p>
            )}

            <div className="card">
                <h3>Статус файлов</h3>
                <input
                    type="text"
                    placeholder="Сообщение для коммита"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    style={{ width: '100%', marginBottom: '10px' }}
                />

                {serverFiles.length === 0 && localFiles.length === 0 ? (
                    <p>Репозиторий пуст. Выберите локальную папку и сделайте push.</p>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>Путь в репозитории</th>
                            <th>На сервере</th>
                            <th>Локально</th>
                            <th>Статус</th>
                        </tr>
                        </thead>
                        <tbody>
                        {/* Файлы с сервера */}
                        {serverFiles.map((cf, index) => {
                            if (!cf.file) return null;

                            const status = getFileStatus(cf);
                            const statusColor = {
                                synced: '#28a745',
                                modified: '#fd7e14',
                                missing: '#dc3545'
                            }[status];

                            return (
                                <tr key={`server-${index}`}>
                                    <td>{cf.filePathInRepo}</td>
                                    <td>{cf.file.filename} ({(cf.file.fileSize / 1024).toFixed(2)} KB)</td>
                                    <td>
                                        {status !== 'missing' ? (
                                            localFiles.find(f => f.path === cf.filePathInRepo.slice(1))?.name || '—'
                                        ) : '—'}
                                    </td>
                                    <td style={{ color: statusColor, fontWeight: 'bold' }}>
                                        {status === 'synced' && '✓ Синхронизирован'}
                                        {status === 'modified' && '⚠ Изменен локально'}
                                        {status === 'missing' && '✗ Отсутствует локально'}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Новые локальные файлы (которых нет на сервере) */}
                        {newLocalFiles.map((file, index) => (
                            <tr key={`local-${index}`} style={{ backgroundColor: '#e8f4e8' }}>
                                <td style={{ fontStyle: 'italic' }}>{'/' + file.path} (новый)</td>
                                <td>—</td>
                                <td>{file.name} ({(file.size / 1024).toFixed(2)} KB)</td>
                                <td style={{ color: '#17a2b8', fontWeight: 'bold' }}>
                                    ✚ Новый локальный файл
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {localFiles.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                    Всего локальных файлов: {localFiles.length}, на сервере: {serverFiles.length}
                </div>
            )}
        </div>
    );
}

export default Repository;