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
    const [workspaceInfo, setWorkspaceInfo] = useState({
        path: '',
        handle: null,
        isInitialized: false
    });
    const [showPermissions, setShowPermissions] = useState(false);
    const [userRole, setUserRole] = useState('NONE');
    const [pushMessage, setPushMessage] = useState('');
    const [showFolderSelector, setShowFolderSelector] = useState(false);

    useEffect(() => {
        loadRepository();
        loadSavedWorkspace();
        loadUserRole();
    }, [repoId]);

    const loadUserRole = async () => {
        try {
            const response = await API.get(`/repositories/${repoId}/permissions/my-role`);
            setUserRole(response.data.role);
        } catch (err) {
            console.error('Ошибка загрузки роли', err);
        }
    };

    const canWrite = () => {
        return userRole === 'OWNER' || userRole === 'WRITER';
    };

    const canManage = () => {
        return userRole === 'OWNER';
    };

    const loadSavedWorkspace = async () => {
        try {
            const savedWorkspace = localStorage.getItem(`workspace-${repoId}`);
            if (savedWorkspace) {
                const workspaceData = JSON.parse(savedWorkspace);
                setWorkspaceInfo({
                    ...workspaceInfo,
                    path: workspaceData.path || '',
                    isInitialized: workspaceData.isInitialized || false
                });

                // Пытаемся восстановить доступ к папке
                if (workspaceData.isInitialized && canWrite()) {
                    try {
                        // Запрашиваем разрешение на доступ к папке
                        const dirHandle = await window.showDirectoryPicker({
                            id: `repo-${repoId}`,
                            mode: 'readwrite',
                            startIn: 'documents'
                        });

                        // Проверяем, что это та же папка
                        if (dirHandle.name === workspaceData.path) {
                            setWorkspaceInfo(prev => ({
                                ...prev,
                                handle: dirHandle,
                                isInitialized: true
                            }));
                            await scanLocalFiles(dirHandle);
                        } else {
                            // Если папка другая, сбрасываем сохраненные данные
                            localStorage.removeItem(`workspace-${repoId}`);
                            setWorkspaceInfo({
                                path: '',
                                handle: null,
                                isInitialized: false
                            });
                        }
                    } catch (err) {
                        console.log('Не удалось восстановить доступ к папке, потребуется повторный выбор');
                        // Не сбрасываем путь, но помечаем что нужен повторный выбор
                        setWorkspaceInfo(prev => ({
                            ...prev,
                            isInitialized: false
                        }));
                    }
                }
            }
        } catch (err) {
            console.error('Ошибка загрузки сохраненной рабочей области', err);
        }
    };

    const initializeWorkspace = async (changeFolder = false) => {
        try {
            const dirHandle = await window.showDirectoryPicker({
                id: `repo-${repoId}`,
                mode: 'readwrite',
                startIn: 'documents'
            });

            // Проверяем, не пустая ли папка (опционально)
            const hasContent = await checkFolderContent(dirHandle);

            const newWorkspaceInfo = {
                handle: dirHandle,
                path: dirHandle.name,
                isInitialized: true
            };

            setWorkspaceInfo(newWorkspaceInfo);

            // Сохраняем информацию о рабочей области
            localStorage.setItem(`workspace-${repoId}`, JSON.stringify({
                path: dirHandle.name,
                isInitialized: true
            }));

            await scanLocalFiles(dirHandle);

            // Если папка не пустая, предлагаем синхронизироваться
            if (hasContent) {
                const shouldPull = window.confirm(
                    'В выбранной папке найдены файлы. Хотите загрузить актуальные файлы с сервера?'
                );
                if (shouldPull) {
                    await pullFromServer(true);
                }
            }

            setShowFolderSelector(false);
        } catch (err) {
            console.error('Ошибка доступа к папке:', err);
            if (err.name !== 'AbortError') {
                alert('Для работы с репозиторием необходимо выбрать папку');
            }
        }
    };

    const checkFolderContent = async (dirHandle) => {
        let hasContent = false;
        for await (const entry of dirHandle.values()) {
            hasContent = true;
            break;
        }
        return hasContent;
    };

    const changeWorkspace = () => {
        setShowFolderSelector(true);
    };

    const clearWorkspace = () => {
        if (window.confirm('Вы уверены, что хотите отвязать локальную папку?')) {
            localStorage.removeItem(`workspace-${repoId}`);
            setWorkspaceInfo({
                path: '',
                handle: null,
                isInitialized: false
            });
            setLocalFiles([]);
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
        if (localFile.lastModified > new Date(serverFile.file.uploadDate).getTime()) return 'modified';
        return 'synced';
    };

    const getNewLocalFiles = () => {
        const serverPaths = new Set(
            serverFiles.map(cf => cf.filePathInRepo.slice(1))
        );
        return localFiles.filter(f => !serverPaths.has(f.path));
    };

    const pushToServer = async () => {
        if (!workspaceInfo.handle || !workspaceInfo.isInitialized) {
            alert('Сначала выберите локальную папку');
            await initializeWorkspace();
            return;
        }

        const messageToUse = pushMessage.trim() || 'Push local changes';

        setSyncing(true);
        try {
            const formData = new FormData();
            formData.append('message', messageToUse);
            formData.append('repositoryId', repoId);

            const filesToUpload = localFiles;

            for (const file of filesToUpload) {
                const fileBlob = await file.handle.getFile();
                formData.append('files', fileBlob);
                formData.append('paths', '/' + file.path);
            }

            const response = await API.post('/commits', formData, {
                headers: {'Content-Type': 'multipart/form-data'}
            });

            if (response.status === 200) {
                await loadRepository();
                setPushMessage('');
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
        if (!workspaceInfo.handle) {
            throw new Error('Рабочая папка не выбрана');
        }

        const pathParts = relativePath.split('/').filter(p => p);
        const fileName = pathParts.pop();

        let currentHandle = workspaceInfo.handle;
        for (const part of pathParts) {
            currentHandle = await currentHandle.getDirectoryHandle(part, {create: true});
        }

        const fileHandle = await currentHandle.getFileHandle(fileName, {create: true});
        const writable = await fileHandle.createWritable();
        await writable.write(fileData);
        await writable.close();
    };

    const pullFromServer = async (silent = false) => {
        if (!workspaceInfo.handle || !workspaceInfo.isInitialized) {
            if (!silent) {
                alert('Сначала выберите локальную папку');
                await initializeWorkspace();
            }
            return;
        }

        setSyncing(true);
        try {
            const commitsRes = await API.get(`/commits/repository/${repoId}`);
            if (commitsRes.data.length === 0) {
                if (!silent) alert('Репозиторий пуст');
                return;
            }

            const lastCommit = commitsRes.data[0];
            const filesRes = await API.get(`/commits/${lastCommit.id}/files`);

            if (filesRes.data.length === 0) {
                if (!silent) alert('В последнем коммите нет файлов');
                return;
            }

            // Проверяем, нет ли локальных изменений
            const localChanges = serverFiles.filter(cf => getFileStatus(cf) === 'modified').length > 0;
            if (localChanges && !silent) {
                const proceed = window.confirm(
                    'У вас есть несохраненные локальные изменения. При загрузке с сервера они могут быть перезаписаны. Продолжить?'
                );
                if (!proceed) return;
            }

            for (const cf of filesRes.data) {
                if (!cf.file) continue;

                const relativePath = cf.filePathInRepo.slice(1);
                const response = await API.get(`/commits/files/${cf.file.id}/download`, {
                    responseType: 'blob'
                });

                await saveFileToWorkspace(response.data, relativePath);
            }

            await scanLocalFiles(workspaceInfo.handle);
            if (!silent) {
                alert('Файлы успешно загружены с сервера!');
            }
        } catch (err) {
            console.error('Ошибка pull', err);
            if (!silent) {
                alert('Ошибка при загрузке: ' + (err.response?.data?.message || err.message));
            }
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

                {/* Управление папкой для WRITER/OWNER */}
                {canWrite() && (
                    <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                        {!workspaceInfo.isInitialized ? (
                            <button onClick={() => initializeWorkspace()} style={{backgroundColor: '#28a745'}}>
                                📁 Выбрать локальную папку
                            </button>
                        ) : (
                            <>
                                <button onClick={changeWorkspace} style={{backgroundColor: '#ffc107'}}>
                                    🔄 Сменить папку
                                </button>
                                <button onClick={clearWorkspace} style={{backgroundColor: '#dc3545'}}>
                                    🗑️ Отвязать папку
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Диалог выбора папки */}
                {showFolderSelector && canWrite() && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            maxWidth: '500px'
                        }}>
                            <h3>Выбор локальной папки</h3>
                            <p>Выберите действие:</p>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                <button onClick={() => {
                                    initializeWorkspace(true);
                                }} style={{padding: '10px'}}>
                                    📁 Выбрать другую папку
                                </button>
                                <button onClick={clearWorkspace} style={{padding: '10px', backgroundColor: '#dc3545'}}>
                                    🗑️ Отвязать текущую папку
                                </button>
                                <button onClick={() => setShowFolderSelector(false)} style={{padding: '10px'}}>
                                    ❌ Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Кнопки для WRITER и OWNER */}
                {canWrite() && workspaceInfo.isInitialized && (
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '20px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        width: '100%'
                    }}>
                        <input
                            type="text"
                            placeholder="Введите сообщение для коммита (обязательно)"
                            value={pushMessage}
                            onChange={(e) => setPushMessage(e.target.value)}
                            style={{
                                flex: '2',
                                minWidth: '300px',
                                padding: '10px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px'
                            }}
                        />
                        <button
                            onClick={() => pullFromServer()}
                            disabled={syncing}
                            style={{ flex: '0 0 auto' }}
                        >
                            {syncing ? '⏳ Синхронизация...' : '📥 Pull (скачать с сервера)'}
                        </button>
                        <button
                            onClick={pushToServer}
                            disabled={syncing || !pushMessage.trim()}
                            style={{
                                flex: '0 0 auto',
                                backgroundColor: !pushMessage.trim() ? '#6c757d' : '#28a745'
                            }}
                        >
                            {syncing ? '⏳ Синхронизация...' : '📤 Push (отправить на сервер)'}
                        </button>
                    </div>
                )}

                {/* Кнопка для READER */}
                {userRole === 'READER' && (
                    <button onClick={() => pullFromServer()} disabled={syncing} style={{backgroundColor: '#17a2b8'}}>
                        {syncing ? '⏳ Загрузка...' : '📥 Скачать файлы (только чтение)'}
                    </button>
                )}

                {/* Управление доступом */}
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

            {/* Информация о локальной папке */}
            {canWrite() && workspaceInfo.path && (
                <div style={{
                    padding: '10px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span>📁 <strong>Локальная папка:</strong> {workspaceInfo.path}</span>
                    {!workspaceInfo.isInitialized && (
                        <span style={{color: '#dc3545'}}>(требуется подтверждение доступа)</span>
                    )}
                </div>
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
                            <th>Дата изменения</th>
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
                                    <td>{new Date(cf.file.uploadDate).toLocaleString()}</td>
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

            {/* Новые локальные файлы */}
            {canWrite() && newLocalFiles.length > 0 && (
                <div className="card" style={{marginTop: '20px'}}>
                    <h4>Новые локальные файлы (не отправлены на сервер)</h4>
                    <table>
                        <thead>
                        <tr>
                            <th>Путь</th>
                            <th>Имя файла</th>
                            <th>Размер</th>
                            <th>Дата изменения</th>
                        </tr>
                        </thead>
                        <tbody>
                        {newLocalFiles.map((file, index) => (
                            <tr key={`local-${index}`}>
                                <td style={{fontStyle: 'italic'}}>{'/' + file.path}</td>
                                <td>{file.name}</td>
                                <td>{(file.size / 1024).toFixed(2)} KB</td>
                                <td>{new Date(file.lastModified).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Управление видимостью */}
            {canManage() && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                }}>
                    <span>Видимость репозитория:</span>
                    <select
                        value={repo.visibility || 'PRIVATE'}
                        onChange={async (e) => {
                            try {
                                const params = new URLSearchParams();
                                params.append('visibility', e.target.value);
                                const response = await API.post(`/repositories/${repoId}/visibility`, params);
                                setRepo(response.data);
                            } catch (err) {
                                alert('Ошибка изменения видимости');
                            }
                        }}
                        style={{ padding: '5px' }}
                    >
                        <option value="PRIVATE">🔒 Приватный</option>
                        <option value="PUBLIC">🌍 Публичный</option>
                    </select>
                </div>
            )}
        </div>
    );
}

export default Repository;