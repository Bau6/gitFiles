import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Repositories from './components/Repositories';
import Repository from './components/Repository';
import History from './components/History';
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [currentView, setCurrentView] = useState('repositories');
  const [currentRepoId, setCurrentRepoId] = useState(null);

  const handleLogin = (userId, token) => {
    localStorage.setItem('userId', userId);
    localStorage.setItem('token', token);
    setUserId(userId);
    setToken(token);
    setCurrentView('repositories');
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    setUserId(null);
    setToken(null);
    setCurrentView('repositories');
  };

  const openRepository = (repoId) => {
    setCurrentRepoId(repoId);
    setCurrentView('repository');
  };

  const showHistory = (repoId) => {
    setCurrentRepoId(repoId);
    setCurrentView('history');
  };

  const backToRepositories = () => {
    setCurrentView('repositories');
  };

  if (!token) {
    return (
        <div className="app">
          <h1>Система управления версиями файлов</h1>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Login onLogin={handleLogin} />
            <Register onRegister={() => setCurrentView('login')} />
          </div>
        </div>
    );
  }

  return (
      <div className="app">
        <div className="header">
          <h1>VCS File Manager</h1>
          <button onClick={handleLogout}>Выйти</button>
        </div>

        {currentView === 'repositories' && (
            <Repositories
                userId={userId}
                onSelectRepo={openRepository}
                onShowHistory={showHistory}
            />
        )}

        {currentView === 'repository' && (
            <Repository
                repoId={currentRepoId}
                userId={userId}
                onBack={backToRepositories}
                onShowHistory={() => showHistory(currentRepoId)}
            />
        )}

        {currentView === 'history' && (
            <History
                repoId={currentRepoId}
                onBack={() => setCurrentView('repository')}
            />
        )}
      </div>
  );
}

export default App;
