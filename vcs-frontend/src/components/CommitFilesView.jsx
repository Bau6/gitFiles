import React, { useState, useEffect } from 'react';
import API from '../api';

function CommitFilesView({ commitId, repoId, onBack }) {
    const [files, setFiles] = useState([]);
    const [commit, setCommit] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCommitFiles();
    }, [commitId]);

    const loadCommitFiles = async () => {
        try {
            // Загружаем информацию о коммите
            const commitRes = await API.get(`/commits/${commitId}`);
            setCommit(commitRes.data);

            // Загружаем файлы коммита
            const filesRes = await API.get(`/commits/${commitId}/files`);
            setFiles(filesRes.data);
        } catch (err) {
            console.error('Ошибка загрузки файлов', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = (fileId, filename) => {
        window.open(`http://localhost:8080/api/commits/files/${fileId}/download`);
    };

    const downloadAllFiles = () => {
        window.open(`http://localhost:8080/api/commits/${commitId}/download-all`);
    };

    if (loading) return <div>Загрузка файлов...</div>;

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <button onClick={onBack}>← Назад к коммитам</button>
                <h2>Файлы в коммите</h2>
                {commit && (
                    <div style={commitInfoStyle}>
                        <p><strong>Сообщение:</strong> {commit.message}</p>
                        <p><strong>Автор:</strong> {commit.author?.username || 'Неизвестно'}</p>
                        <p><strong>Дата:</strong> {new Date(commit.createdAt).toLocaleString()}</p>
                    </div>
                )}
            </div>

            <div style={actionsStyle}>
                <button onClick={downloadAllFiles} style={downloadAllButtonStyle}>
                    📦 Скачать все файлы ZIP
                </button>
            </div>

            <div style={contentStyle}>
                <h3>Файлы ({files.length})</h3>

                {files.length === 0 ? (
                    <p>В этом коммите нет файлов</p>
                ) : (
                    <table style={tableStyle}>
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
                                <td>{(cf.file?.fileSize / 1024).toFixed(2)} KB</td>
                                <td>{cf.file?.mimeType || 'Неизвестно'}</td>
                                <td>
                                    <button
                                        onClick={() => downloadFile(cf.file.id, cf.file.filename)}
                                        style={downloadButtonStyle}
                                    >
                                        Скачать
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Стили
const containerStyle = {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
};

const headerStyle = {
    marginBottom: '20px'
};

const commitInfoStyle = {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginTop: '10px'
};

const actionsStyle = {
    marginBottom: '20px'
};

const contentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px'
};

const downloadButtonStyle = {
    padding: '5px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};

const downloadAllButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
};

export default CommitFilesView;