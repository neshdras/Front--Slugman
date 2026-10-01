import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { advance, getView, leave } from '../engine/engine.js';
import { CHAPTERS, getChapter } from '../../data/chapterList.js.js';
import { emptyProgress, loadProgress, saveProgress } from '../services/progress.js';
import { useAuth } from './AuthContext.jsx';

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

const withGained = (collection, gained) => [...new Set([...collection, ...gained])];

export function GameProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id_user;
  const [progress, setProgress] = useState(null); // null = pas encore chargé
  const [gained, setGained] = useState([]); // objets obtenus à l'étape qui vient de se jouer

  useEffect(() => {
    if (!userId) {
      setProgress(null);
      return;
    }
    let alive = true;
    loadProgress(userId).then((p) => alive && setProgress(p));
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (userId && progress) saveProgress(userId, progress);
  }, [userId, progress]);

  const session = progress?.session ?? null;
  const chapter = session ? getChapter(session.chapterId) : null;
  const view = session ? getView(chapter, session.nodeId, session.state) : null;

  const isUnlocked = useCallback(
    (c) => c.requires.every((id) => progress?.story.completed.includes(id)),
    [progress]
  );

  // Lance (ou relance) un chapitre à partir de l'état validé.
  const startChapter = useCallback(
    (chapterId) => {
      const ch = getChapter(chapterId);
      const r = advance(ch, ch.data.meta.start, progress.story.state);
      setGained(r.gained);
      setProgress({
        ...progress,
        session: { chapterId, nodeId: r.nodeId, state: r.state },
        collection: withGained(progress.collection, r.gained),
      });
    },
    [progress]
  );

  // choiceId = null pour un simple "Continuer".
  const step = useCallback(
    (choiceId = null) => {
      const r = leave(chapter, session.nodeId, session.state, choiceId);
      setGained(r.gained);
      setProgress({
        ...progress,
        session: { ...session, nodeId: r.nodeId, state: r.state },
        collection: withGained(progress.collection, r.gained),
      });
    },
    [progress, session, chapter]
  );

  // Fin de chapitre : l'état de la session devient l'état validé.
  const completeChapter = useCallback(() => {
    setGained([]);
    setProgress({
      ...progress,
      story: {
        state: session.state,
        completed: [...new Set([...progress.story.completed, session.chapterId])],
      },
      session: null,
    });
  }, [progress, session]);

  const retryChapter = useCallback(() => startChapter(session.chapterId), [startChapter, session]);

  const abandonRun = useCallback(() => {
    setGained([]);
    setProgress({ ...progress, session: null });
  }, [progress]);

  const resetAll = useCallback(() => {
    setGained([]);
    setProgress(emptyProgress());
  }, []);

  return (
    <GameContext.Provider
      value={{
        ready: progress !== null,
        progress,
        session,
        chapter,
        view,
        gained,
        chapters: CHAPTERS,
        isUnlocked,
        startChapter,
        step,
        completeChapter,
        retryChapter,
        abandonRun,
        resetAll,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}