import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { ITEMS } from '../../data/chapterList.js.js';
import { bgUrl, slugUrl } from '../../data/assets.js';

// Affiche le texte lettre par lettre (instantané si l'utilisateur réduit les animations).
function useTypewriter(text, cps = 70) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(text.length);
      return;
    }
    setN(0);
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const k = Math.min(text.length, Math.floor(((now - t0) / 1000) * cps));
      setN((prev) => Math.max(prev, k));
      if (k < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, cps]);
  return { shown: text.slice(0, n), done: n >= text.length, finish: () => setN(text.length) };
}

// Une scène = un noeud. Remontée via key={nodeId} : l'index de réplique repart à 0.
function Scene({ view, gained, onChoose, onContinue, onFinish, onRetry, onLeave }) {
  const [i, setI] = useState(0);
  const beat = view.beats[i];
  const tw = useTypewriter(beat?.text ?? '');
  const isLast = i >= view.beats.length - 1;
  const ready = !beat || (tw.done && isLast);

  const advanceBeat = () => {
    if (!tw.done) tw.finish();
    else if (!isLast) setI(i + 1);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('button')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advanceBeat();
      }
      const n = Number(e.key);
      if (ready && n >= 1 && n <= view.choices.length && !view.choices[n - 1].disabled) {
        onChoose(view.choices[n - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const isEnd = view.kind !== null;
  const endTitle = { chapter_end: 'Chapitre terminé', game_over: view.title ?? 'Perdu', ending: view.title ?? "Fin d'histoire" }[view.kind];

  return (
    <div className="scene">
      {gained.length > 0 && (
        <ul className="loot" aria-live="polite">
          {gained.map((id) => (
            <li key={id}><strong>{ITEMS[id]?.name ?? id}</strong>{ITEMS[id]?.description && ` — ${ITEMS[id].description}`}</li>
          ))}
        </ul>
      )}

      {beat && (
        <div className="dialog" onClick={advanceBeat}>
          {beat.speaker && <p className="dialog__who">{beat.speaker}</p>}
          <p className={`dialog__text ${beat.speaker ? '' : 'dialog__text--narr'}`}>{tw.shown}</p>
          {!ready && tw.done && <span className="dialog__more" aria-hidden="true">▼</span>}
        </div>
      )}

      {ready && (
        <div className="actions">
          {isEnd ? (
            <>
              <h2 className="end__title">{endTitle}</h2>
              {view.unlockMessage && <p className="end__unlock">{view.unlockMessage}</p>}
              {view.kind === 'chapter_end' ? (
                <button className="btn" onClick={onFinish}>Retour à la carte</button>
              ) : (
                <>
                  <button className="btn" onClick={onRetry}>Réessayer le chapitre</button>
                  <button className="btn btn--ghost" onClick={onLeave}>Retour à la carte</button>
                </>
              )}
            </>
          ) : view.choices.length > 0 ? (
            view.choices.map((c, k) => (
              <button key={c.id} className="choice" disabled={c.disabled} onClick={() => onChoose(c.id)}>
                <span className="choice__n">{k + 1}</span>
                <span>{c.label}{c.disabled && c.reason ? ` (${c.reason})` : ''}</span>
              </button>
            ))
          ) : (
            <button className="btn" onClick={onContinue}>Continuer</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlayPage() {
  const game = useGame();
  const navigate = useNavigate();
  if (!game.ready) return <div className="splash">Chargement…</div>;
  if (!game.session) return <Navigate to="/map" replace />;

  const { view, chapter, session, gained } = game;
  const toMap = () => navigate('/map');
  const bg = bgUrl(view.bg);
  const slug = slugUrl(view.pose);

  return (
    <main className="play">
      <header className="hud">
        <div className="stage" aria-hidden="true">
            {bg && <div key={bg} className="stage__bg" style={{ backgroundImage: `url(${bg})` }} />}
            {slug && <img className="stage__slug" src={slug} alt="" />}
        </div>
        <button className="btn btn--ghost" onClick={toMap}>Carte</button>
        <p className="hud__chapter">Chapitre {chapter.number} · {chapter.title}</p>
        <p className="hud__stat">Morale <strong>{session.state.score}</strong></p>
        <p className="hud__stat">Objets <strong>{session.state.items.length}</strong></p>
      </header>

      <Scene
        key={view.nodeId}
        view={view}
        gained={gained}
        onChoose={(id) => game.step(id)}
        onContinue={() => game.step()}
        onFinish={() => { game.completeChapter(); toMap(); }}
        onRetry={game.retryChapter}
        onLeave={() => { game.abandonRun(); toMap(); }}
      />
    </main>
  );
}