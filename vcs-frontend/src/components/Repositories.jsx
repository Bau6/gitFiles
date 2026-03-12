import React, { useState, useEffect } from 'react';
import API from '../api';

function Repositories({ userId, onSelectRepo, onShowHistory }) {
    const [repos, setRepos] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRepos();
    }, [userId]);

    const loadRepos = async () => {
        try {
            const response = await API.get(`/repositories/user/${userId}`);
            setRepos(response.data);
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
            params.append('ownerId', userId);

            await API.post('/repositories', params);
            setName('');
            setDescription('');
            loadRepos();
        } catch (err) {
            console.error('Ошибка создания репозитория', err);
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

            {repos.length === 0 ? (
                <p>У вас пока нет репозиториев</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Название</th>
                        <th>Описание</th>
                        <th>Дата создания</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {repos.map(repo => (
                        <tr key={repo.id}>
                            <td>{repo.name}</td>
                            <td>{repo.description}</td>
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