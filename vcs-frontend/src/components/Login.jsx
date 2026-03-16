import React, { useState } from 'react';
import API from '../api';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await API.post('/users/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            if (response.data.success) {
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('token', response.data.token); // Сохраняем токен!
                onLogin(response.data.userId, response.data.token);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError('Ошибка входа');
        }
    };

    return (
        <div className="card" style={{ width: '300px' }}>
            <h2>Вход</h2>
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
                {error && <div className="error">{error}</div>}
                <button type="submit">Войти</button>
            </form>
        </div>
    );
}

export default Login;