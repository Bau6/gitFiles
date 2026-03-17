import React, { useState, useEffect } from 'react';
import API from '../api';

function Repositories({ userId, onSelectRepo, onShowHistory }) {
    const [repos, setRepos] = useState([]);
    const [filteredRepos, setFilteredRepos] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState({}); // роль в каждом репозитории

    useEffect(() => {
        loadRepos();
    }, [userId]);

    useEffect(() => {
        // Фильтрация репозиториев при изменении поиска
        if (searchTerm.trim() === '') {
            setFilteredRepos(repos);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = repos.filter(repo =>
                repo.name.toLowerCase().includes(term) ||
                (repo.description && repo.description.toLowerCase().includes(term)) ||
                (repo.owner?.username && repo.owner.username.toLowerCase().includes(term))
            );
            setFilteredRepos(filtered);
        }
    }, [searchTerm, repos]);

    const loadRepos = async () => {
        try {
            const response = await API.get('/repositories/my');
            setRepos(response.data);
            setFilteredRepos(response.data);

            // Загружаем роли для каждого репозитория
            const roles = {};
            for (const repo of response.data) {
                try {
                    const roleRes = await API.get(`/repositories/${repo.id}/permissions/my-role`);
                    roles[repo.id] = roleRes.data.role;
                } catch (err) {
                    console.error(`Ошибка загрузки роли для репозитория ${repo.id}`, err);
                }
            }
            setUserRole(roles);
        } catch (err) {
            console.error('Ошибка загрузки репозиториев', err);
        } finally {
            setLoading(false);
        }
    };

    const createRepo = async (e) => {
        e.preventDefault();
        try {
            const params = new URLSearchParams();
            params.append('name', name);
            params.append('description', description);

            await API.post('/repositories', params);
            setName('');
            setDescription('');
            loadRepos();
        } catch (err) {
            console.error('Ошибка создания репозитория', err);
        }
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'OWNER': return '👑';
            case 'WRITER': return '✏️';
            case 'READER': return '👁️';
            default: return '❓';
        }
    };

    const getRoleName = (role) => {
        switch(role) {
            case 'OWNER': return 'Владелец';
            case 'WRITER': return 'Редактор';
            case 'READER': return 'Читатель';
            default: return 'Нет доступа';
        }
    };

    if (loading) return <div>Загрузка...</div>;

    return (
        <div>
            <h2>Мои репозитории</h2>

            <div className="card">
                <h3>Создать новый репозиторий</h3>
                <form onSubmit={createRepo}>
                    <input
                        type="text"
                        placeholder="Название"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Описание"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="2"
                    />
                    <button type="submit">Создать</button>
                </form>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="🔍 Поиск по названию, описанию или владельцу..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px' }}
                />
            </div>

            {filteredRepos.length === 0 ? (
                <p>
                    {searchTerm ? 'Репозитории не найдены' : 'У вас пока нет репозиториев'}
                </p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Название</th>
                        <th>Описание</th>
                        <th>Владелец</th>
                        <th>Ваша роль</th>
                        <th>Дата создания</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredRepos.map(repo => (
                        <tr key={repo.id}>
                            <td>
                                <strong>{repo.name}</strong>
                            </td>
                            <td>{repo.description || '—'}</td>
                            <td>
                                {repo.owner?.username || 'Неизвестно'}
                                {repo.owner?.id === userId && ' (вы)'}
                            </td>
                            <td>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: userRole[repo.id] === 'OWNER' ? '#6f42c1' :
                                            (userRole[repo.id] === 'WRITER' ? '#28a745' : '#17a2b8'),
                                        color: 'white',
                                        fontSize: '0.9em'
                                    }}>
                                        {getRoleIcon(userRole[repo.id])} {getRoleName(userRole[repo.id])}
                                    </span>
                            </td>
                            <td>{new Date(repo.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => onSelectRepo(repo.id)}>
                                    Открыть
                                </button>
                                <button onClick={() => onShowHistory(repo.id)}>
                                    История
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

export default Repositories;