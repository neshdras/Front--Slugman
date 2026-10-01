import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';

// Image de la carte : à placer dans /public (ou adapter le chemin).
// Les positions des pastilles (c.pin.x / c.pin.y, en %) sont relatives à CETTE image.
const MAP_IMAGE = '../../public/map.webp';

function statusOf(ch, { progress, session, isUnlocked }) {
  if (progress?.story.completed.includes(ch.id)) return 'done';
  if (session?.chapterId === ch.id) return 'current';
  return isUnlocked(ch) ? 'open' : 'locked';
}

const STATUS_LABEL = {
  done: 'Terminé',
  current: 'En cours',
  open: 'Disponible',
  locked: 'Verrouillé',
};

export default function MapPage() {
  const game = useGame();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { ready, chapters, progress, session, startChapter } = game;
  const { resetAll } = game
  const [confirmReset, setConfirmReset] = useState(false)

  const [selectedId, setSelectedId] = useState(() => {
    const open = chapters.find((c) => ['current', 'open'].includes(statusOf(c, game)));
    return (open ?? chapters[chapters.length - 1]).id;
  });

  if (!ready || !progress) {
    return <div className="splash">Chargement de la carte…</div>;
  }


const replay = () => {
  resetAll()
  setSelectedId(chapters[0].id)   // retour sur le chapitre 1
  setConfirmReset(false)
}
const hasProgress = progress.story.completed.length > 0 || session
  


  const selected = chapters.find((c) => c.id === selectedId);
  const status = statusOf(selected, game);
  const fame = progress.story.state.score;
  const otherRunning = session && session.chapterId !== selected.id;

  const play = () => {
    if (status !== 'current') startChapter(selected.id);
    navigate('/play');
  };

  const allDone = chapters.every((c) => progress.story.completed.includes(c.id));

  return (
    <main className="mappage">
      <header className="topbar">
        <h1 className="logo">SlugMan</h1>
        <p className="topbar__who">{user.name_user ?? user.email_user}</p>
        <button className="btn btn--ghost" onClick={logout}>Déconnexion</button>
      </header>

      <section className="map" aria-label="Carte des chapitres">
        <img className="map__img" src={MAP_IMAGE} alt="" draggable={false} />
        {chapters.map((c) => {
          const s = statusOf(c, game);
          return (
            <button
              key={c.id}
              className={`pin pin--${s} ${c.id === selectedId ? 'pin--selected' : ''}`}
              style={{ left: `${c.pin.x}%`, top: `${c.pin.y}%` }}
              onClick={() => setSelectedId(c.id)}
              aria-label={`Chapitre ${c.number} : ${c.title} (${STATUS_LABEL[s]})`}
              aria-pressed={c.id === selectedId}
            >
              <span className="pin__n">{c.number}</span>
            </button>
          );
        })}
        {allDone && <p className="map__more">La suite arrive bientôt.</p>}
      </section>

      <aside className="panel">
        <p className="panel__meta">Chapitre {selected.number} · {STATUS_LABEL[status]}</p>
        <h2 className="panel__title">{selected.title}</h2>
        <p className="panel__fame">Morale actuelle : <strong>{fame}</strong></p>

        {status === 'locked' && <p>Termine d'abord le chapitre précédent.</p>}
        {status === 'done' && <p>Chapitre terminé. Tes choix sont conservés pour la suite.</p>}
        {(status === 'open' || status === 'current') && (
          <>
            <button className="btn" onClick={play}>
              {status === 'current' ? 'Reprendre' : 'Jouer'}
            </button>
            {otherRunning && (
              <p className="panel__warn">
                Une partie du chapitre {game.chapter.number} est en cours : elle sera abandonnée.
              </p>
            )}
          </>
        )}
        {hasProgress && (
            <div className="panel__reset">
                {!confirmReset ? (
                <button className="btn btn--line" onClick={() => setConfirmReset(true)}>
                    Rejouer depuis le début
                </button>
                ) : (
                <>
                    <p>
                    Ta progression et tes choix seront effacés. Les objets déjà débloqués
                    sont conservés.
                    </p>
                    <div className="panel__reset-actions">
                    <button className="btn" onClick={replay}>Oui, rejouer</button>
                    <button className="btn btn--line" onClick={() => setConfirmReset(false)}>Annuler</button>
                    </div>
                </>
                )}
            </div>
            )}
      </aside>
    </main>
  );
}