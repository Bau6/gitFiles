import React, { useState, useEffect } from 'react';
import API from '../api';

function PublicRepositories({ userId, onSelectRepo, onViewPublicRepo }) {
    const [repos, setRepos] = useState([]);
    const [filteredRepos, setFilteredRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPublicRepos();
    }, []);

    useEffect(() => {
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

    const loadPublicRepos = async () => {
        try {
            const response = await API.get('/repositories/public');
            setRepos(response.data);
            setFilteredRepos(response.data);
        } catch (err) {
            console.error('Ошибка загрузки публичных репозиториев', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Загрузка...</div>;

    return (
        <div>
            <h2>Публичные репозитории</h2>

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
                <p>{searchTerm ? 'Репозитории не найдены' : 'Нет публичных репозиториев'}</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Название</th>
                        <th>Описание</th>
                        <th>Владелец</th>
                        <th>Дата создания</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredRepos.map(repo => (
                        <tr key={repo.id}>
                            <td><strong>{repo.name}</strong></td>
                            <td>{repo.description || '—'}</td>
                            <td>{repo.owner?.username || 'Неизвестно'}</td>
                            <td>{new Date(repo.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => onViewPublicRepo(repo.id)}>
                                    Просмотр
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

export default PublicRepositories;