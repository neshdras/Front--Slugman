// "bg": "bar_marine"  ->  src/assets/bg/bar_marine.webp
// "pose": "colere"    ->  src/assets/characters/slugman_colere.png (sinon slugman.png)
const fileId = (path) => path.split('/').pop().replace(/\.[^.]+$/, '');
const toMap = (files) => Object.fromEntries(Object.entries(files).map(([p, url]) => [fileId(p), url]));

const BACKGROUNDS = toMap(
  import.meta.glob('../src/assets/bg/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' })
);
const SPRITES = toMap(
  import.meta.glob('../src/assets/characters/*.{png,webp}', { eager: true, query: '?url', import: 'default' })
);

const warned = new Set();
const warnOnce = (msg) => {
  if (!warned.has(msg)) {
    warned.add(msg);
    console.warn(`[assets] ${msg}`);
  }
};

export function bgUrl(id) {
  if (!id) return null;
  if (!BACKGROUNDS[id]) {
    warnOnce(`décor introuvable : "${id}" (src/assets/bg/${id}.webp ?)`);
    return null;
  }
  return BACKGROUNDS[id];
}

export function slugUrl(pose) {
  if (!pose) return SPRITES.slugman_base ?? null;

  // 1. Cherche si la clé existe telle quelle (ex: "slugman_base")
  if (SPRITES[pose]) return SPRITES[pose];

  // 2. Cherche avec le préfixe (ex: "base" -> "slugman_base")
  if (SPRITES[`slugman_${pose}`]) return SPRITES[`slugman_${pose}`];

  // 3. Fallback sur l'image de base si la pose demandée n'existe pas
  return SPRITES.slugman_base ?? null;
}