export function completedPercent(entry: EntryV2) {
  const todoDone = entry.todos.filter(t=>t.checked).length;
  const todoAll  = entry.todos.length || 1;

  const routineDone = entry.routines.filter(r=>r.checked).length;
  const routineAll  = entry.routines.length || 1;

  const pct = 100 * ((todoDone/todoAll) + (routineDone/routineAll)) / 2;
  return Math.round(pct);
}
