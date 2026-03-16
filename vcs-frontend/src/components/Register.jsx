import React, { useState } from 'react';
import API from '../api';

function Register({ onRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);
            params.append('email', email);

            // ✅ ИСПРАВЛЕНО: добавили /register
            const response = await API.post('/users/register', params);

            // Можно использовать response.data, если нужно
            setMessage('Регистрация успешна! Теперь можно войти.');
            setError('');
            setUsername('');
            setPassword('');
            setEmail('');

            // Если хотите автоматически переключиться на форму входа
            // setTimeout(() => onRegister(), 2000);

        } catch (err) {
            console.error('Детали ошибки:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Ошибка регистрации');
            setMessage('');
        }
    };

    return (
        <div className="card" style={{ width: '300px' }}>
            <h2>Регистрация</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="text"
                        placeholder="Логин"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                {message && <div className="success">{message}</div>}
                {error && <div className="error">{error}</div>}
                <button type="submit">Зарегистрироваться</button>
            </form>
        </div>
    );
}

export default Register;