import { evalCondition } from './condition';

// Le moteur est 100 % pur : il ne connaît ni React, ni l'API, ni le localStorage.
// `chapter` = { id, data } où data est le contenu du JSON (meta, nodes, ...).
// `state`   = { score, flags, items }

const MAX_HOPS = 100; // garde-fou contre une boucle de noeuds automatiques

const cloneState = (s) => ({ score: s.score, flags: { ...s.flags }, items: [...s.items], bg: s.bg ?? null, pose: s.pose ?? null, });
const namedOf = (chapter) => chapter.data.meta.named_conditions ?? {};
const hasContent = (n) => Boolean(n.text || n.dialogue?.length || n.choices?.length);

function getNode(chapter, id) {
  const node = chapter.data.nodes[id];
  if (!node) throw new Error(`Noeud introuvable : "${id}" (${chapter.id})`);
  return node;
}

export function applyOnEnter(state, onEnter) {
  const next = cloneState(state);
  const gained = [];
  if (!onEnter) return { state: next, gained };
  if (typeof onEnter.score === 'number') next.score += onEnter.score;
  if (onEnter.set_flags) Object.assign(next.flags, onEnter.set_flags);
  for (const item of onEnter.add_items ?? []) {
    if (!next.items.includes(item)) {
      next.items.push(item);
      gained.push(item);
    }
  }
  return { state: next, gained };
}

function pickWeighted(outcomes, rng) {
  const total = outcomes.reduce((sum, o) => sum + o.weight, 0);
  let roll = rng() * total;
  for (const o of outcomes) {
    roll -= o.weight;
    if (roll < 0) return o.next;
  }
  return outcomes[outcomes.length - 1].next;
}

function resolveBranch(node, state, named) {
  const hit = node.branches.find((b) => evalCondition(b.condition, state, named));
  return hit ? hit.next : node.default;
}

// 'chapter_end' | 'game_over' | 'ending' | null
export function terminalKind(node) {
  if (node.type === 'chapter_end') return 'chapter_end';
  if (node.type === 'hub' && !node.next) return 'chapter_end'; // fin du chapitre 1
  if (node.type === 'game_over') return 'game_over';
  if (node.type === 'ending') return 'ending';
  if (node.return_to === 'map') return 'chapter_end';
  return null;
}

// Entre dans un noeud : applique on_enter, puis traverse automatiquement les
// noeuds "invisibles" (random, branch sans texte) jusqu'au prochain noeud à afficher.
export function advance(chapter, fromId, state, rng = Math.random) {
  const named = namedOf(chapter);
  const gained = [];
  let id = fromId;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const node = getNode(chapter, id);
    const entered = applyOnEnter(state, node.on_enter);
    state = entered.state;
    gained.push(...entered.gained);
    if (node.bg !== undefined) state.bg = node.bg;
    if (node.pose !== undefined) state.pose = node.pose;

    if (node.type === 'random') {
      id = pickWeighted(node.outcomes, rng);
      continue;
    }
    if (node.type === 'branch' && !hasContent(node)) {
      id = resolveBranch(node, state, named);
      continue;
    }
    return { nodeId: id, state, gained };
  }
  throw new Error(`Boucle de noeuds automatiques depuis "${fromId}" (${chapter.id})`);
}

// Ce que l'UI doit afficher pour un noeud.
export function getView(chapter, nodeId, state) {
  const node = getNode(chapter, nodeId);
  const named = namedOf(chapter);

  const variant = node.text_variants?.find((v) => evalCondition(v.condition, state, named));
  const text = variant ? variant.text : node.text;

  const beats = (node.dialogue ?? []).map((l) => ({ speaker: l.speaker, text: l.text }));
  if (text) beats.push({ speaker: node.speaker ?? null, text });

  const choices = (node.choices ?? [])
    .filter((c) => evalCondition(c.condition, state, named))
    .map((c) => ({ id: c.id, label: c.label, disabled: Boolean(c.disabled), reason: c.disabled_reason }));

  return {
    nodeId,
    title: node.title ?? null,
    beats,
    choices,
    bg: state.bg ?? null,
    pose: state.pose ?? null,
    kind: terminalKind(node),
    unlockMessage: node.unlock_message ?? null,
  };
}

// Quitte le noeud courant (par un choix, ou par `next` / branch) et avance.
export function leave(chapter, nodeId, state, choiceId = null, rng = Math.random) {
  const node = getNode(chapter, nodeId);
  let target;
  if (choiceId) {
    const choice = node.choices?.find((c) => c.id === choiceId);
    if (!choice) throw new Error(`Choix "${choiceId}" inconnu sur "${nodeId}"`);
    target = choice.next;
  } else if (node.type === 'branch') {
    target = resolveBranch(node, state, namedOf(chapter));
  } else {
    target = node.next;
  }
  if (!target) throw new Error(`Aucune suite depuis "${nodeId}" (${chapter.id})`);
  return advance(chapter, target, state, rng);
}