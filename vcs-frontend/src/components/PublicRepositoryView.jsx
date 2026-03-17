import React, { useState, useEffect } from 'react';
import API from '../api';
import CommitFilesView from './CommitFilesView';

function PublicRepositoryView({ repoId, onBack }) {
    const [repo, setRepo] = useState(null);
    const [commits, setCommits] = useState([]);
    const [filteredCommits, setFilteredCommits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCommitId, setSelectedCommitId] = useState(null);
    const [showFilesView, setShowFilesView] = useState(false);

    // Состояния для поиска
    const [searchTerm, setSearchTerm] = useState('');
    const [searchAuthor, setSearchAuthor] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showSearchFilters, setShowSearchFilters] = useState(false);

    useEffect(() => {
        loadRepository();
    }, [repoId]);

    useEffect(() => {
        filterCommits();
    }, [commits, searchTerm, searchAuthor, startDate, endDate]);

    const loadRepository = async () => {
        try {
            const repoRes = await API.get(`/repositories/${repoId}`);
            setRepo(repoRes.data);

            const commitsRes = await API.get(`/commits/repository/${repoId}`);
            setCommits(commitsRes.data);
            setFilteredCommits(commitsRes.data);
        } catch (err) {
            console.error('Ошибка загрузки репозитория', err);
        } finally {
            setLoading(false);
        }
    };

    const filterCommits = () => {
        let filtered = [...commits];

        // Фильтр по тексту в сообщении
        if (searchTerm.trim()) {
            filtered = filtered.filter(commit =>
                commit.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Фильтр по автору
        if (searchAuthor.trim()) {
            filtered = filtered.filter(commit =>
                commit.author?.username?.toLowerCase().includes(searchAuthor.toLowerCase())
            );
        }

        // Фильтр по начальной дате
        if (startDate) {
            const start = new Date(startDate).setHours(0, 0, 0, 0);
            filtered = filtered.filter(commit =>
                new Date(commit.createdAt) >= start
            );
        }

        // Фильтр по конечной дате
        if (endDate) {
            const end = new Date(endDate).setHours(23, 59, 59, 999);
            filtered = filtered.filter(commit =>
                new Date(commit.createdAt) <= end
            );
        }

        setFilteredCommits(filtered);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSearchAuthor('');
        setStartDate('');
        setEndDate('');
    };

    const handleShowFiles = (commitId) => {
        setSelectedCommitId(commitId);
        setShowFilesView(true);
    };

    const getUniqueAuthors = () => {
        const authors = new Set();
        commits.forEach(commit => {
            if (commit.author?.username) {
                authors.add(commit.author.username);
            }
        });
        return Array.from(authors);
    };

    if (loading) return <div>Загрузка...</div>;
    if (!repo) return <div>Репозиторий не найден</div>;

    // Если выбран просмотр файлов, показываем компонент с файлами
    if (showFilesView && selectedCommitId) {
        return (
            <CommitFilesView
                commitId={selectedCommitId}
                repoId={repoId}
                onBack={() => setShowFilesView(false)}
            />
        );
    }

    return (
        <div>
            <button onClick={onBack}>← Назад к публичным репозиториям</button>

            <h2>{repo.name}
                <span style={{ fontSize: '0.6em', color: '#666', marginLeft: '10px' }}>
                    🌍 публичный репозиторий
                </span>
            </h2>
            <p>{repo.description}</p>
            <p><strong>Владелец:</strong> {repo.owner?.username || 'Неизвестно'}</p>

            {/* Блок поиска */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div style={searchHeaderStyle}>
                    <h3 style={{ margin: 0 }}>Поиск по коммитам</h3>
                    <button
                        onClick={() => setShowSearchFilters(!showSearchFilters)}
                        style={toggleButtonStyle}
                    >
                        {showSearchFilters ? '▲ Скрыть фильтры' : '▼ Показать фильтры'}
                    </button>
                </div>

                {showSearchFilters && (
                    <div style={searchContainerStyle}>
                        {/* Поиск по сообщению */}
                        <div style={searchRowStyle}>
                            <label style={searchLabelStyle}>Поиск по сообщению:</label>
                            <input
                                type="text"
                                placeholder="Введите текст для поиска..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={searchInputStyle}
                            />
                        </div>

                        {/* Поиск по автору */}
                        <div style={searchRowStyle}>
                            <label style={searchLabelStyle}>Автор:</label>
                            <div style={authorSearchContainerStyle}>
                                <input
                                    type="text"
                                    placeholder="Введите имя автора..."
                                    value={searchAuthor}
                                    onChange={(e) => setSearchAuthor(e.target.value)}
                                    style={{...searchInputStyle, marginRight: '10px'}}
                                    list="authors"
                                />
                                <datalist id="authors">
                                    {getUniqueAuthors().map(author => (
                                        <option key={author} value={author} />
                                    ))}
                                </datalist>
                                <select
                                    onChange={(e) => setSearchAuthor(e.target.value)}
                                    value={searchAuthor}
                                    style={authorSelectStyle}
                                >
                                    <option value="">Выберите автора</option>
                                    {getUniqueAuthors().map(author => (
                                        <option key={author} value={author}>{author}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Фильтр по дате */}
                        <div style={searchRowStyle}>
                            <label style={searchLabelStyle}>Период:</label>
                            <div style={dateRangeStyle}>
                                <div style={dateInputContainerStyle}>
                                    <span>с</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={dateInputStyle}
                                    />
                                </div>
                                <div style={dateInputContainerStyle}>
                                    <span>по</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={dateInputStyle}
                                        min={startDate}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Кнопки действий */}
                        <div style={searchActionsStyle}>
                            <button
                                onClick={clearFilters}
                                style={clearButtonStyle}
                            >
                                🧹 Очистить фильтры
                            </button>
                            <span style={resultsCountStyle}>
                                Найдено коммитов: {filteredCommits.length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Список коммитов */}
            <div className="card" style={{ marginTop: '20px' }}>
                <h3>Коммиты ({filteredCommits.length})</h3>

                {filteredCommits.length === 0 ? (
                    <div style={noResultsStyle}>
                        <p>Коммиты не найдены</p>
                        {(searchTerm || searchAuthor || startDate || endDate) && (
                            <button onClick={clearFilters} style={clearFiltersButtonStyle}>
                                Сбросить фильтры
                            </button>
                        )}
                    </div>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Автор</th>
                            <th>Сообщение</th>
                            <th>Файлы</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredCommits.map(commit => (
                            <tr key={commit.id}>
                                <td>{new Date(commit.createdAt).toLocaleString()}</td>
                                <td>
                                    <span style={authorBadgeStyle}>
                                        {commit.author?.username || 'Неизвестно'}
                                    </span>
                                </td>
                                <td>
                                    {searchTerm ? (
                                        <span dangerouslySetInnerHTML={{
                                            __html: highlightText(commit.message, searchTerm)
                                        }} />
                                    ) : (
                                        commit.message
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleShowFiles(commit.id)}
                                        style={viewFilesButtonStyle}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                                    >
                                        📁 Просмотр файлов
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Информация о поиске */}
            {(searchTerm || searchAuthor || startDate || endDate) && filteredCommits.length > 0 && (
                <div style={searchInfoStyle}>
                    <span>🔍 Применены фильтры: </span>
                    {searchTerm && <span style={filterTagStyle}>"{searchTerm}"</span>}
                    {searchAuthor && <span style={filterTagStyle}>автор: {searchAuthor}</span>}
                    {startDate && <span style={filterTagStyle}>с {startDate}</span>}
                    {endDate && <span style={filterTagStyle}>по {endDate}</span>}
                </div>
            )}
        </div>
    );
}

// Вспомогательная функция для подсветки текста
const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px;">$1</mark>');
};

// Стили
const searchHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
};

const toggleButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
};

const searchContainerStyle = {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '4px',
    marginTop: '10px'
};

const searchRowStyle = {
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap'
};

const searchLabelStyle = {
    width: '120px',
    fontWeight: 'bold',
    color: '#495057'
};

const searchInputStyle = {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '200px'
};

const authorSearchContainerStyle = {
    display: 'flex',
    flex: 1,
    alignItems: 'center'
};

const authorSelectStyle = {
    padding: '8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: 'black',
};

const dateRangeStyle = {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
};

const dateInputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
};

const dateInputStyle = {
    padding: '8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '14px'
};

const searchActionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #dee2e6'
};

const clearButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};

const resultsCountStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#28a745'
};

const noResultsStyle = {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px'
};

const clearFiltersButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
};

const viewFilesButtonStyle = {
    padding: '5px 10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
};

const authorBadgeStyle = {
    padding: '3px 8px',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    fontSize: '0.9em'
};

const searchInfoStyle = {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e7f3ff',
    borderRadius: '4px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
};

const filterTagStyle = {
    padding: '4px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px'
};

export default PublicRepositoryView;