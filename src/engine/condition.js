// Évalue la grammaire de conditions des JSON :
// { flag, equals? } | { item } | { score_gte } | { score_lt } | { all } | { any } | { not } | { ref }
export function evalCondition(cond, state, named = {}) {
  if (!cond) return true;

  if (cond.ref !== undefined) {
    const target = named[cond.ref];
    if (!target) {
      console.warn(`[engine] condition nommée introuvable : "${cond.ref}"`);
      return false;
    }
    return evalCondition(target, state, named);
  }
  if (cond.all) return cond.all.every((c) => evalCondition(c, state, named));
  if (cond.any) return cond.any.some((c) => evalCondition(c, state, named));
  if (cond.not) return !evalCondition(cond.not, state, named);

  if (cond.flag !== undefined) {
    // un flag jamais défini compte comme false
    return Boolean(state.flags[cond.flag]) === (cond.equals ?? true);
  }
  if (cond.item !== undefined) return state.items.includes(cond.item);
  if (cond.score_gte !== undefined) return state.score >= cond.score_gte;
  if (cond.score_lt !== undefined) return state.score < cond.score_lt;

  console.warn('[engine] condition inconnue', cond);
  return false;
}