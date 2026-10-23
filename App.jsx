import React, { useState, useEffect } from 'react';
import './App.css';

const EDITOR_PASSWORD = 'colsam123';

const INITIAL_MATCHES = [
  { id: 1, sport: 'Futsal', icon: 'fa-futbol', date: '25 May, 08:00 AM', team1: '11° A', score1: '4', team2: '11° B', score2: '2', status: 'Finalizado' },
  { id: 2, sport: 'Futsal', icon: 'fa-futbol', date: '25 May, 09:30 AM', team1: '10° C', score1: '1', team2: '10° A', score2: '1', status: 'Finalizado' },
  { id: 3, sport: 'Balonmano', icon: 'fa-hand', date: '26 May, 08:00 AM', team1: '9° B', score1: '15', team2: '9° C', score2: '12', status: 'Finalizado' },
  { id: 4, sport: 'Voleibol', icon: 'fa-volleyball', date: '27 May, 10:00 AM', team1: '11° C', score1: '2', team2: '10° B', score2: '0', status: 'Finalizado' },
  { id: 5, sport: 'Futsal', icon: 'fa-futbol', date: 'Hoy, 14:00 PM', team1: '8° A', score1: '-', team2: '8° B', score2: '-', status: 'Próximo' },
  { id: 6, sport: 'Balonmano', icon: 'fa-hand', date: 'Hoy, En curso', team1: '11° A', score1: '8', team2: '10° C', score2: '5', status: 'En curso' }
];

// Valida que el curso sea de 1° a 11° (con letra de sección opcional)
function cursoValido(texto) {
  const m = texto.trim().match(/^(\d{1,2})\s*°?\s*([A-Za-z])?$/);
  if (!m) return false;
  const grado = parseInt(m[1], 10);
  return grado >= 1 && grado <= 11;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState(() => {
    try {
      const data = localStorage.getItem('colsam_matches');
      const parsed = data ? JSON.parse(data) : [];
      return parsed.length > 0 ? parsed : INITIAL_MATCHES;
    } catch (e) {
      return INITIAL_MATCHES;
    }
  });
  const [currentFilter, setCurrentFilter] = useState('TODOS');

  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [loginError, setLoginError] = useState('');

  const [loginForm, setLoginForm] = useState({
    name: '',
    curso: '',
    role: 'JUGADOR',
    password: ''
  });

  const [matchForm, setMatchForm] = useState({
    sport: 'Futsal',
    team1: '',
    score1: '0',
    team2: '',
    score2: '0',
    status: 'Finalizado'
  });

  // Guardar partidos en el navegador cada vez que cambian
  useEffect(() => {
    try { localStorage.setItem('colsam_matches', JSON.stringify(matches)); } catch (e) {}
  }, [matches]);

  // Cargar sesión guardada si existe
  useEffect(() => {
    const savedSession = localStorage.getItem('colsam_user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        setIsLoginOpen(false);
      } catch (e) {
        localStorage.removeItem('colsam_user_session');
      }
    }
  }, []);

  // Manejador del Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!cursoValido(loginForm.curso)) {
      setLoginError('El curso debe ser de 1° a 11° (Ej. 11° A).');
      return;
    }

    if (loginForm.role === 'EDITOR' && loginForm.password !== EDITOR_PASSWORD) {
      setLoginError('Contraseña incorrecta para Editor. Verifícala e intenta de nuevo.');
      return;
    }

    const userData = {
      name: loginForm.name,
      curso: loginForm.curso,
      role: loginForm.role
    };

    setUser(userData);
    localStorage.setItem('colsam_user_session', JSON.stringify(userData));
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('colsam_user_session');
    setUser(null);
    setIsLoginOpen(true);
    setLoginForm({ name: '', curso: '', role: 'JUGADOR', password: '' });
  };

  // Abrir modal para crear partido nuevo
  const handleOpenCreateModal = () => {
    setEditingMatchId(null);
    setMatchForm({
      sport: 'Futsal',
      team1: '',
      score1: '0',
      team2: '',
      score2: '0',
      status: 'En curso'
    });
    setIsModalOpen(true);
  };

  // Abrir modal con el lápiz para editar un partido existente
  const handleOpenEditModal = (match) => {
    setEditingMatchId(match.id);
    setMatchForm({
      sport: match.sport,
      team1: match.team1,
      score1: match.score1 === '-' ? '0' : match.score1,
      team2: match.team2,
      score2: match.score2 === '-' ? '0' : match.score2,
      status: match.status
    });
    setIsModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSaveMatch = (e) => {
    e.preventDefault();

    if (!cursoValido(matchForm.team1) || !cursoValido(matchForm.team2)) {
      alert('Los equipos deben ser cursos de 1° a 11° (Ej. 11° A).');
      return;
    }

    const iconMap = { Futsal: 'fa-futbol', Balonmano: 'fa-hand', Voleibol: 'fa-volleyball' };

    if (editingMatchId) {
      // Editar partido existente
      setMatches(matches.map(m => {
        if (m.id === editingMatchId) {
          return {
            ...m,
            sport: matchForm.sport,
            icon: iconMap[matchForm.sport] || 'fa-trophy',
            team1: matchForm.team1,
            score1: matchForm.status === 'Próximo' ? '-' : matchForm.score1,
            team2: matchForm.team2,
            score2: matchForm.status === 'Próximo' ? '-' : matchForm.score2,
            status: matchForm.status,
            date: matchForm.status === 'En curso' ? 'Hoy, En curso' : m.date
          };
        }
        return m;
      }));
    } else {
      // Crear nuevo partido
      const newMatch = {
        id: Date.now(),
        sport: matchForm.sport,
        icon: iconMap[matchForm.sport] || 'fa-trophy',
        date: matchForm.status === 'En curso' ? 'Hoy, En curso' : 'Hoy',
        team1: matchForm.team1,
        score1: matchForm.status === 'Próximo' ? '-' : matchForm.score1,
        team2: matchForm.team2,
        score2: matchForm.status === 'Próximo' ? '-' : matchForm.score2,
        status: matchForm.status
      };
      setMatches([newMatch, ...matches]);
    }

    setIsModalOpen(false);
  };

  const filteredMatches = currentFilter === 'TODOS'
    ? matches
    : matches.filter(m => m.sport === currentFilter);

  return (
    <div className="app-root">
      {/* PANTALLA DE INICIO / LOGIN */}
      {isLoginOpen && (
        <div className="login-overlay">
          <div className="login-card">
            <div className="brand-login">
              <img src="colsam-sport.jpg" alt="Colsam Sport Logo" className="login-logo-img" />
            </div>
            <div className="brand-login-sub">Juegos Intercursos Oficiales</div>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Nombre y Apellido</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Juan Pérez"
                  required
                  value={loginForm.name}
                  onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Curso / Grado (1° a 11°)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 11° A"
                  required
                  value={loginForm.curso}
                  onChange={(e) => setLoginForm({ ...loginForm, curso: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Usuario</label>
                <select
                  className="form-input"
                  value={loginForm.role}
                  onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })}
                >
                  <option value="JUGADOR">Espectador / Jugador (Sin Clave)</option>
                  <option value="EDITOR">Editor Deportivo (Requiere Clave)</option>
                </select>
              </div>

              {loginForm.role === 'EDITOR' && (
                <div className="form-group">
                  <label>Contraseña de Editor</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Ingresa contraseña"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
              )}

              {loginError && <div className="login-error-msg">{loginError}</div>}

              <button type="submit" className="btn-login">
                <i className="fa-solid fa-right-to-bracket"></i> Ingresar a la Plataforma
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CABEZAL SUPERIOR CON LOGO OFICIAL */}
      <header className="top-header">
        <div className="header-brand">
          <img src="colsam-sport.jpg" alt="Colsam Sport Logo" className="header-logo-img" />
          <div>
            <div className="brand-title">Colsam-Sport</div>
            <div className="brand-subtitle">JUEGOS INTERCURSOS OFICIALES</div>
          </div>
        </div>

        <div className="header-actions">
          <div className="season-badge">
            <i className="fa-regular fa-calendar"></i>
            <span>Temporada 2026</span>
          </div>

          {user && (
            <div className="user-pill">
              <span>{user.name} ({user.curso})</span>
              <button className="btn-logout" onClick={handleLogout} title="Cerrar Sesión">
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-container">
        {/* Banner para Editores */}
        {user?.role === 'EDITOR' && (
          <div className="editor-banner">
            <div>
              <i className="fa-solid fa-user-gear"></i> <strong>Modo Editor Activo</strong> — Haz clic en el icono de lápiz ✏️ de cualquier partido para actualizarlo en vivo.
            </div>
            <button className="btn-action" onClick={handleOpenCreateModal}>
              <i className="fa-solid fa-plus"></i> + Registrar Resultado
            </button>
          </div>
        )}

        {/* Botones de Filtro tipo Píldora */}
        <div className="filter-pills">
          <button
            className={`pill-btn ${currentFilter === 'TODOS' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('TODOS')}
          >
            <i className="fa-solid fa-border-all"></i> Todos
          </button>
          <button
            className={`pill-btn ${currentFilter === 'Futsal' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('Futsal')}
          >
            <i className="fa-solid fa-futbol"></i> Futsal
          </button>
          <button
            className={`pill-btn ${currentFilter === 'Balonmano' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('Balonmano')}
          >
            <i className="fa-solid fa-hand"></i> Balonmano
          </button>
          <button
            className={`pill-btn ${currentFilter === 'Voleibol' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('Voleibol')}
          >
            <i className="fa-solid fa-volleyball"></i> Voleibol
          </button>
        </div>

        {/* Grilla de Partidos */}
        <div className="matches-grid">
          {filteredMatches.length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '2rem' }}>
              Aún no hay partidos registrados.
            </p>
          )}
          {filteredMatches.map((m) => (
            <div className="match-card" key={m.id}>
              <div>
                <div className="card-header">
                  <div className="card-sport">
                    <i className={`fa-solid ${m.icon}`}></i>
                    <span>{m.sport}</span>
                  </div>
                  <div className="card-header-right">
                    <span>{m.date}</span>
                    {user?.role === 'EDITOR' && (
                      <button
                        className="btn-edit-pencil"
                        title="Editar marcador / estado"
                        onClick={() => handleOpenEditModal(m)}
                      >
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="teams-container">
                  <div className="team-row">
                    <span className="team-name">{m.team1}</span>
                    <div className="score-box">{m.score1}</div>
                  </div>
                  <div className="vs-divider">
                    <span className="vs-text">VS</span>
                  </div>
                  <div className="team-row">
                    <span className="team-name">{m.team2}</span>
                    <div className="score-box">{m.score2}</div>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                {m.status === 'Finalizado' && (
                  <span className="badge-status status-finalizado">Finalizado</span>
                )}
                {m.status === 'En curso' && (
                  <span className="badge-status status-encurso">
                    <span className="dot"></span> En curso
                  </span>
                )}
                {m.status === 'Próximo' && (
                  <span className="badge-status status-proximo">Próximo</span>
                )}

                <button
                  className="btn-details"
                  onClick={() => alert(`Detalles del encuentro: ${m.team1} (${m.score1}) vs ${m.team2} (${m.score2})`)}
                >
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL PARA CREAR / EDITAR PARTIDOS */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginBottom: '1rem', color: '#0d2847' }}>
              {editingMatchId ? '✏️ Editar Partido en Vivo' : '➕ Registrar Nuevo Partido'}
            </h3>
            <form onSubmit={handleSaveMatch}>
              <div className="form-group">
                <label>Deporte</label>
                <select
                  className="form-input"
                  value={matchForm.sport}
                  onChange={(e) => setMatchForm({ ...matchForm, sport: e.target.value })}
                >
                  <option value="Futsal">Futsal</option>
                  <option value="Balonmano">Balonmano</option>
                  <option value="Voleibol">Voleibol</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Equipo 1</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. 11° A"
                    required
                    value={matchForm.team1}
                    onChange={(e) => setMatchForm({ ...matchForm, team1: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ width: '80px' }}>
                  <label>Marcador</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={matchForm.score1}
                    onChange={(e) => setMatchForm({ ...matchForm, score1: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Equipo 2</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. 11° B"
                    required
                    value={matchForm.team2}
                    onChange={(e) => setMatchForm({ ...matchForm, team2: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ width: '80px' }}>
                  <label>Marcador</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={matchForm.score2}
                    onChange={(e) => setMatchForm({ ...matchForm, score2: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Estado del Partido</label>
                <select
                  className="form-input"
                  value={matchForm.status}
                  onChange={(e) => setMatchForm({ ...matchForm, status: e.target.value })}
                >
                  <option value="En curso">🔴 En curso</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Próximo">Próximo</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="pill-btn" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-login" style={{ width: 'auto', padding: '0.55rem 1.2rem' }}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
