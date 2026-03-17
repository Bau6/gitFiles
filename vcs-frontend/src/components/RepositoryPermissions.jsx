import React, { useState, useEffect } from 'react';
import API from '../api';

function RepositoryPermissions({ repoId, onClose }) {
    const [users, setUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('READER');
    const [loading, setLoading] = useState(true);
    const [myRole, setMyRole] = useState('');
    const [userSearchTerm, setUserSearchTerm] = useState('');

    useEffect(() => {
        loadPermissions();
        loadMyRole();
        loadAllUsers();
    }, [repoId]);

    useEffect(() => {
        // Фильтрация пользователей при поиске
        if (userSearchTerm.trim() === '') {
            setFilteredUsers(allUsers);
        } else {
            const term = userSearchTerm.toLowerCase();
            const filtered = allUsers.filter(user =>
                user.username.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term)
            );
            setFilteredUsers(filtered);
        }
    }, [userSearchTerm, allUsers]);

    const loadPermissions = async () => {
        try {
            const response = await API.get(`/repositories/${repoId}/permissions`);
            setUsers(response.data);
        } catch (err) {
            console.error('Ошибка загрузки прав', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMyRole = async () => {
        try {
            const response = await API.get(`/repositories/${repoId}/permissions/my-role`);
            setMyRole(response.data.role);
        } catch (err) {
            console.error('Ошибка загрузки роли', err);
        }
    };

    const loadAllUsers = async () => {
        try {
            const response = await API.get('/users/all');
            setAllUsers(response.data);
            setFilteredUsers(response.data);
        } catch (err) {
            console.error('Ошибка загрузки пользователей', err);
        }
    };

    const grantAccess = async () => {
        if (!selectedUserId) return;

        try {
            const params = new URLSearchParams();
            params.append('userId', selectedUserId);
            params.append('role', selectedRole);

            await API.post(`/repositories/${repoId}/permissions/grant`, params);

            setSelectedUserId('');
            setSelectedRole('READER');
            setUserSearchTerm('');
            loadPermissions();
            loadAllUsers(); // Перезагружаем список всех пользователей
        } catch (err) {
            alert('Ошибка при предоставлении доступа');
        }
    };

    const revokeAccess = async (userId) => {
        if (!window.confirm('Удалить доступ у этого пользователя?')) return;

        try {
            const params = new URLSearchParams();
            params.append('userId', userId);

            await API.delete(`/repositories/${repoId}/permissions/revoke?${params}`);
            loadPermissions();
            loadAllUsers(); // Перезагружаем список всех пользователей
        } catch (err) {
            alert('Ошибка при отзыве доступа');
        }
    };

    const getRoleName = (role) => {
        const roles = {
            'OWNER': '👑 Владелец',
            'WRITER': '✏️ Редактор',
            'READER': '👁️ Читатель'
        };
        return roles[role] || role;
    };

    if (loading) return <div>Загрузка...</div>;

    // Пользователи, которые уже имеют доступ
    const usersWithAccess = new Set(users.map(u => u.id));

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '20px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>Управление доступом</h3>
                <button onClick={onClose}>✖</button>
            </div>

            {myRole === 'OWNER' && (
                <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
                    <h4>Предоставить доступ</h4>

                    {/* Поиск пользователей */}
                    <input
                        type="text"
                        placeholder="🔍 Поиск по логину или email..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        style={{ width: '100%', marginBottom: '10px' }}
                    />

                    <div style={{ display: 'flex', gap: '5px' }}>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            style={{ flex: 2 }}
                        >
                            <option value="">Выберите пользователя</option>
                            {filteredUsers
                                .filter(u => !usersWithAccess.has(u.id))
                                .map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username} ({user.email})
                                    </option>
                                ))
                            }
                        </select>

                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            style={{ flex: 1 }}
                        >
                            <option value="READER">👁️ Читатель</option>
                            <option value="WRITER">✏️ Редактор</option>
                        </select>

                        <button onClick={grantAccess}>➕</button>
                    </div>
                </div>
            )}

            <table>
                <thead>
                <tr>
                    <th>Пользователь</th>
                    <th>Email</th>
                    <th>Роль</th>
                    {myRole === 'OWNER' && <th></th>}
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{getRoleName(user.role)}</td>
                        {myRole === 'OWNER' && user.role !== 'OWNER' && (
                            <td>
                                <button onClick={() => revokeAccess(user.id)}>
                                    ❌
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default RepositoryPermissions;