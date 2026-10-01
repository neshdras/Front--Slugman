import { INITIAL_STATE } from '../../data/chapterList.js.js';
import { api } from './api.js';

// Passe à true quand ta route de sauvegarde existe côté back (voir réponse).
const SERVER_SYNC = false;

const key = (userId) => `vn_progress_${userId}`;

// story.state  = état "validé" (à la fin du dernier chapitre terminé)
// session      = chapitre en cours : { chapterId, nodeId, state } — state évolue pendant la lecture
// collection   = objets débloqués définitivement (même après un game over)
export const emptyProgress = () => ({
  version: 1,
  story: { state: structuredClone(INITIAL_STATE), completed: [] },
  session: null,
  collection: [],
});

export async function loadProgress(userId) {
  if (SERVER_SYNC) {
    try {
      const data = await api('/game/progress');
      if (data?.game_state) return data.game_state;
    } catch (err) {
      console.warn('[progress] lecture serveur impossible, repli local', err);
    }
  }
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(userId, progress) {
  localStorage.setItem(key(userId), JSON.stringify(progress));
  if (!SERVER_SYNC) return;
  const { session, story } = progress;
  api('/game/progress', {
    method: 'PUT',
    body: {
      actual_chapter_user: session?.chapterId ?? null,
      actual_act_user: session?.nodeId ?? null,
      fame_user: (session?.state ?? story.state).score,
      game_state: progress,
    },
  }).catch((err) => console.warn('[progress] sauvegarde serveur échouée', err));
}