import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Repositories from './components/Repositories';
import Repository from './components/Repository';
import History from './components/History';
import PublicRepositories from './components/PublicRepositories';      // нужно импортировать
import PublicRepositoryView from './components/PublicRepositoryView';  // нужно импортировать
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  // ЕДИНСТВЕННОЕ состояние для определения текущего вида
  const [view, setView] = useState('repositories'); // 'repositories', 'public', 'repository', 'history', 'public-view'
  const [currentRepoId, setCurrentRepoId] = useState(null);
  const [publicRepoId, setPublicRepoId] = useState(null);

  const handleLogin = (userId, token) => {
    localStorage.setItem('userId', userId);
    localStorage.setItem('token', token);
    setUserId(userId);
    setToken(token);
    setView('repositories');
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    setUserId(null);
    setToken(null);
    setView('repositories');
  };

  const openRepository = (repoId) => {
    setCurrentRepoId(repoId);
    setView('repository');
  };

  const showHistory = (repoId) => {
    setCurrentRepoId(repoId);
    setView('history');
  };

  const backToRepositories = () => {
    setView('repositories');
  };

  const showPublicRepositories = () => {
    setView('public');
  };

  const showMyRepositories = () => {
    setView('repositories');
  };

  const viewPublicRepo = (repoId) => {
    setPublicRepoId(repoId);
    setView('public-view');
  };

  const backFromPublicView = () => {
    setView('public');
  };

  if (!token) {
    return (
        <div className="app">
          <h1>Система управления версиями файлов</h1>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Login onLogin={handleLogin} />
            <Register onRegister={() => setView('login')} />
          </div>
        </div>
    );
  }

  return (
      <div className="app">
        <div className="header">
          <h1>VCS File Manager</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={showMyRepositories}>Мои репозитории</button>
            <button onClick={showPublicRepositories}>Публичные репозитории</button>
            <button onClick={handleLogout}>Выйти</button>
          </div>
        </div>

        {/* Мои репозитории */}
        {view === 'repositories' && (
            <Repositories
                userId={userId}
                onSelectRepo={openRepository}
                onShowHistory={showHistory}
            />
        )}

        {/* Публичные репозитории */}
        {view === 'public' && (
            <PublicRepositories
                userId={userId}
                onViewPublicRepo={viewPublicRepo}
            />
        )}

        {/* Просмотр публичного репозитория */}
        {view === 'public-view' && (
            <PublicRepositoryView
                repoId={publicRepoId}
                onBack={backFromPublicView}
            />
        )}

        {/* Мой репозиторий (детальный просмотр) */}
        {view === 'repository' && (
            <Repository
                repoId={currentRepoId}
                userId={userId}
                onBack={backToRepositories}
                onShowHistory={() => showHistory(currentRepoId)}
            />
        )}

        {/* История моего репозитория */}
        {view === 'history' && (
            <History
                repoId={currentRepoId}
                onBack={() => setView('repository')}
            />
        )}
      </div>
  );
}

export default App;