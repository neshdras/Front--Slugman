// "bg": "bar_marine"  ->  src/assets/bg/bar_marine.webp
// "pose": "colere"    ->  src/assets/characters/slugman_colere.png (sinon slugman.png)
const fileId = (path) => path.split('/').pop().replace(/\.[^.]+$/, '');
const toMap = (files) => Object.fromEntries(Object.entries(files).map(([p, url]) => [fileId(p), url]));

const BACKGROUNDS = toMap(
  import.meta.glob('../assets/bg/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' })
);
const SPRITES = toMap(
  import.meta.glob('../assets/characters/*.{png,webp}', { eager: true, query: '?url', import: 'default' })
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
  if (pose && SPRITES[`slugman_${pose}`]) return SPRITES[`slugman_${pose}`];
  if (pose) warnOnce(`pose introuvable : "slugman_${pose}", image par défaut utilisée`);
  return SPRITES.slugman ?? null;
}