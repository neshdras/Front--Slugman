import ch1 from './chapitre1.json';
import ch2 from './chapitre2.json';

// Pour ajouter un chapitre : importer son JSON, ajouter une entrée ici (et une position sur la carte).
// `requires` = chapitres à avoir terminés pour le débloquer.
export const CHAPTERS = [
  { id: 'chapitre1', number: 1, data: ch1, requires: [], pin: { x: 18, y: 72 } },
  { id: 'chapitre2', number: 2, data: ch2, requires: ['chapitre1'], pin: { x: 52, y: 38 } },
].map((c) => ({ ...c, title: c.data.meta.title }));

export const getChapter = (id) => CHAPTERS.find((c) => c.id === id);

// État de départ : initial_state du ch.1 + les flags ajoutés par les chapitres suivants.
export const INITIAL_STATE = {
  score: 0,
  items: [],
  flags: CHAPTERS.reduce(
    (flags, c) => ({
      ...flags,
      ...(c.data.initial_state?.flags ?? {}),
      ...(c.data.state_additions?.flags ?? {}),
    }),
    {}
  ),
};

// Catalogue des objets de tous les chapitres.
export const ITEMS = CHAPTERS.reduce((all, c) => ({ ...all, ...(c.data.items ?? {}) }), {});