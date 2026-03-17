import React, {useState, useEffect} from 'react';
import API from '../api';
import RepositoryPermissions from "./RepositoryPermissions.jsx";

function Repository({repoId, userId, onBack, onShowHistory}) {
    const [repo, setRepo] = useState(null);
    const [serverFiles, setServerFiles] = useState([]);
    const [localFiles, setLocalFiles] = useState([]);
    const [commitMessage, setCommitMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [workspacePath, setWorkspacePath] = useState('');
    const [workspaceHandle, setWorkspaceHandle] = useState(null);
    const [showPermissions, setShowPermissions] = useState(false);
    const [userRole, setUserRole] = useState('NONE'); // Роль текущего пользователя

    useEffect(() => {
        loadRepository();
        loadSavedWorkspace();
        loadUserRole(); // Загружаем роль пользователя
    }, [repoId]);

    // Загружаем роль пользователя в этом репозитории
    const loadUserRole = async () => {
        try {
            const response = await API.get(`/repositories/${repoId}/permissions/my-role`);
            setUserRole(response.data.role);
            console.log('Роль пользователя:', response.data.role);
        } catch (err) {
            console.error('Ошибка загрузки роли', err);
        }
    };

    // Проверка прав на запись (OWNER или WRITER)
    const canWrite = () => {
        return userRole === 'OWNER' || userRole === 'WRITER';
    };

    // Проверка прав на управление доступом (только OWNER)
    const canManage = () => {
        return userRole === 'OWNER';
    };

    const loadSavedWorkspace = async () => {
        const savedPath = localStorage.getItem(`workspace-${repoId}`);
        if (savedPath) {
            setWorkspacePath(savedPath);
            try {
                console.log('Сохраненный путь:', savedPath);
            } catch (err) {
                console.error('Не удалось восстановить доступ к папке');
            }
        }
    };

    const initializeWorkspace = async () => {
        try {
            const dirHandle = await window.showDirectoryPicker({
                id: `repo-${repoId}`,
                mode: 'readwrite',
                startIn: 'documents'
            });

            setWorkspaceHandle(dirHandle);
            setWorkspacePath(dirHandle.name);
            localStorage.setItem(`workspace-${repoId}`, dirHandle.name);
            await scanLocalFiles(dirHandle);
        } catch (err) {
            console.error('Ошибка доступа к папке:', err);
            if (err.name !== 'AbortError') {
                alert('Для работы с репозиторием необходимо выбрать папку');
            }
        }
    };

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

    const getFileStatus = (serverFile) => {
        if (!serverFile.file) return 'unknown';

        const serverPath = serverFile.filePathInRepo.slice(1);
        const localFile = localFiles.find(f => f.path === serverPath);

        if (!localFile) return 'missing';
        if (localFile.size !== serverFile.file.fileSize) return 'modified';
        return 'synced';
    };

    const getNewLocalFiles = () => {
        const serverPaths = new Set(
            serverFiles.map(cf => cf.filePathInRepo.slice(1))
        );
        return localFiles.filter(f => !serverPaths.has(f.path));
    };

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

            const filesToUpload = localFiles;

            for (const file of filesToUpload) {
                const fileBlob = await file.handle.getFile();
                formData.append('files', fileBlob);
                formData.append('paths', '/' + file.path);
            }

            console.log(`Отправка ${filesToUpload.length} файлов...`);

            const response = await API.post('/commits', formData, {
                headers: {'Content-Type': 'multipart/form-data'}
            });

            if (response.status === 200) {
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

    const saveFileToWorkspace = async (fileData, relativePath) => {
        if (!workspaceHandle) {
            throw new Error('Рабочая папка не выбрана');
        }

        const pathParts = relativePath.split('/').filter(p => p);
        const fileName = pathParts.pop();

        let currentHandle = workspaceHandle;
        for (const part of pathParts) {
            currentHandle = await currentHandle.getDirectoryHandle(part, {create: true});
        }

        const fileHandle = await currentHandle.getFileHandle(fileName, {create: true});
        const writable = await fileHandle.createWritable();
        await writable.write(fileData);
        await writable.close();
    };

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

            for (const cf of filesRes.data) {
                if (!cf.file) continue;

                const relativePath = cf.filePathInRepo.slice(1);
                const response = await API.get(`/commits/files/${cf.file.id}/download`, {
                    responseType: 'blob'
                });

                await saveFileToWorkspace(response.data, relativePath);
                console.log('Сохранен файл:', relativePath);
            }

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
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center'}}>
                <button onClick={onBack}>← Назад к репозиториям</button>
                <button onClick={onShowHistory}>История версий</button>

                {/* Отображаем роль пользователя */}
                {userRole !== 'NONE' && (
                    <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: userRole === 'OWNER' ? '#6f42c1' : (userRole === 'WRITER' ? '#28a745' : '#17a2b8'),
                        color: 'white',
                        fontSize: '0.9em'
                    }}>
                        {userRole === 'OWNER' && '👑 Владелец'}
                        {userRole === 'WRITER' && '✏️ Редактор'}
                        {userRole === 'READER' && '👁️ Читатель'}
                    </span>
                )}

                {/* Кнопка выбора папки - доступна всем с правами */}
                {canWrite() && !workspaceHandle && (
                    <button onClick={initializeWorkspace} style={{backgroundColor: '#28a745'}}>
                        📁 Выбрать локальную папку
                    </button>
                )}

                {/* Кнопки для WRITER и OWNER */}
                {canWrite() && workspaceHandle && (
                    <>
                        <button onClick={pullFromServer} disabled={syncing}>
                            {syncing ? '⏳ Синхронизация...' : '📥 Pull (скачать с сервера)'}
                        </button>
                        <button onClick={pushToServer} disabled={syncing}>
                            {syncing ? '⏳ Синхронизация...' : '📤 Push (отправить на сервер)'}
                        </button>
                    </>
                )}

                {/* Кнопка для READER - только Pull, без выбора папки */}
                {userRole === 'READER' && (
                    <button onClick={pullFromServer} disabled={syncing} style={{backgroundColor: '#17a2b8'}}>
                        {syncing ? '⏳ Загрузка...' : '📥 Скачать файлы (только чтение)'}
                    </button>
                )}

                {/* Управление доступом - только для OWNER */}
                {canManage() && (
                    <button
                        onClick={() => setShowPermissions(true)}
                        style={{backgroundColor: '#6f42c1'}}
                    >
                        👥 Управление доступом
                    </button>
                )}

                {showPermissions && canManage() && (
                    <RepositoryPermissions
                        repoId={repoId}
                        onClose={() => setShowPermissions(false)}
                    />
                )}
            </div>

            <h2>{repo.name}</h2>
            <p>{repo.description}</p>
            {workspacePath && canWrite() && (
                <p><strong>Локальная папка:</strong> {workspacePath}</p>
            )}

            <div className="card">
                <h3>Файлы в репозитории</h3>

                {serverFiles.length === 0 && localFiles.length === 0 ? (
                    <p>Репозиторий пуст.</p>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>Путь в репозитории</th>
                            <th>Имя файла</th>
                            <th>Размер</th>
                            {canWrite() && <th>Статус</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {serverFiles.map((cf, index) => {
                            if (!cf.file) return null;

                            const status = canWrite() ? getFileStatus(cf) : null;
                            const statusColor = {
                                synced: '#28a745',
                                modified: '#fd7e14',
                                missing: '#dc3545'
                            }[status];

                            return (
                                <tr key={`server-${index}`}>
                                    <td>{cf.filePathInRepo}</td>
                                    <td>{cf.file.filename}</td>
                                    <td>{(cf.file.fileSize / 1024).toFixed(2)} KB</td>
                                    {canWrite() && (
                                        <td style={{color: statusColor, fontWeight: 'bold'}}>
                                            {status === 'synced' && '✓ Синхронизирован'}
                                            {status === 'modified' && '⚠ Изменен локально'}
                                            {status === 'missing' && '✗ Отсутствует локально'}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Показываем новые локальные файлы только для WRITER/OWNER */}
            {canWrite() && newLocalFiles.length > 0 && (
                <div className="card" style={{marginTop: '20px'}}>
                    <h4>Новые локальные файлы (не отправлены на сервер)</h4>
                    <table>
                        <thead>
                        <tr>
                            <th>Путь</th>
                            <th>Имя файла</th>
                            <th>Размер</th>
                        </tr>
                        </thead>
                        <tbody>
                        {newLocalFiles.map((file, index) => (
                            <tr key={`local-${index}`}>
                                <td style={{fontStyle: 'italic'}}>{'/' + file.path}</td>
                                <td>{file.name}</td>
                                <td>{(file.size / 1024).toFixed(2)} KB</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Repository;