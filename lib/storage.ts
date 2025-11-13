import { startOfWeekISO, monthKey, yearKey, todayISO } from "./period";

const LS_ENTRIES   = "v2_entries";     // map<date, EntryV2>
const LS_GOALS_Y   = "v2_goals_year";  // map<YYYY, Goals>
const LS_GOALS_M   = "v2_goals_month"; // map<YYYY-MM, Goals>
const LS_GOALS_W   = "v2_goals_week";  // map<YYYY-MM-DD(monday), Goals>

export const DEFAULT_ROUTINES = (): Routine[] => [
  { id:"r0", title:"Breathing / Stillness", checked:false, subOptions:["Wim Hof","Box","Nose","Mouth"], selected:[] },
  { id:"r1", title:"Exercise 45 minutes",   checked:false, subOptions:["Push","Pull","Legs","Run","Golf","Chest","Back"], selected:[] },
  { id:"r2", title:"Eat 150g+ Protein",     checked:false, subOptions:["Shakes","Whole foods"], selected:[] }
];

export function loadEntries(): Record<string, EntryV2> {
  try { return JSON.parse(localStorage.getItem(LS_ENTRIES) || "{}"); } catch { return {}; }
}
export function saveEntries(map: Record<string, EntryV2>) {
  localStorage.setItem(LS_ENTRIES, JSON.stringify(map));
}
export function loadEntry(date: string): EntryV2 {
  const map = loadEntries();
  if (map[date]) return map[date];
  return {
    date,
    weeklyGoal: "", intention:"", aplus:"",
    todos: [{ id:"t0", text:"A+ supporting task", checked:false }],
    routines: DEFAULT_ROUTINES(),
    worked:"", challenged:"", tomorrowAPlus:"",
    dailyScore: 0, completedPct: 0,
    aiTheme: undefined, aiAction: undefined
  };
}
export function saveEntry(entry: EntryV2) {
  const map = loadEntries(); map[entry.date] = entry; saveEntries(map);
}
export function loadRange(from: string, to: string) {
  const map = loadEntries(); const rows = Object.values(map) as EntryV2[];
  return rows.filter(r => r.date >= from && r.date <= to).sort((a,b)=>a.date<b.date? -1: 1);
}

// Goals (checklist, starts with one item; can add/remove)
function loadMap(key: string){ try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } }
function saveMap(key: string, v:any){ localStorage.setItem(key, JSON.stringify(v)); }

export function loadYearGoals(date: string): Goals {
  const y = yearKey(date); const map = loadMap(LS_GOALS_Y); return map[y] || { items:[{id:"gY0", text:"Annual Goal"}] };
}
export function saveYearGoals(date: string, g: Goals){ const y = yearKey(date); const map = loadMap(LS_GOALS_Y); map[y]=g; saveMap(LS_GOALS_Y, map); }

export function loadMonthGoals(date: string): Goals {
  const m = monthKey(date); const map = loadMap(LS_GOALS_M); return map[m] || { items:[{id:"gM0", text:"Monthly Goal"}] };
}
export function saveMonthGoals(date: string, g: Goals){ const m = monthKey(date); const map = loadMap(LS_GOALS_M); map[m]=g; saveMap(LS_GOALS_M, map); }

export function loadWeekGoals(date: string): Goals {
  const w = startOfWeekISO(date); const map = loadMap(LS_GOALS_W); return map[w] || { items:[{id:"gW0", text:"Weekly Goal"}] };
}
export function saveWeekGoals(date: string, g: Goals){ const w = startOfWeekISO(date); const map = loadMap(LS_GOALS_W); map[w]=g; saveMap(LS_GOALS_W, map); }

// Glue for Daily to read the current week's goal (first item or concatenated)
export function currentWeekGoalText(date: string) {
  const g = loadWeekGoals(date); return g.items.map(i=>i.text).filter(Boolean).join(" • ");
}

// CSV export of entries in range (same shape we send to AI)
export function entriesToCSV(rows: EntryV2[]) {
  const header = [
    "date", "weekly_goal", "intention", "aplus",
    "todos_done/total", "routines_done/total",
    "routines_selected", "completed_pct", "daily_score",
    "ai_theme", "ai_action"
  ];
  const lines = [header.join(",")];
  for (const e of rows) {
    const td = e.todos.filter(t=>t.checked).length, tt = e.todos.length;
    const rd = e.routines.filter(r=>r.checked).length, rt = e.routines.length;
    const sel = e.routines.map(r=>`${r.title}:{${r.selected.join("|")}}`).join(" / ");
    const row = [
      e.date, q(currentWeekGoalText(e.date)), q(e.intention), q(e.aplus),
      `${td}/${tt}`, `${rd}/${rt}`, q(sel), e.completedPct, e.dailyScore,
      q(e.aiTheme||""), q(e.aiAction||"")
    ];
    lines.push(row.join(","));
  }
  return lines.join("\n");
}
function q(s:string){ return `"${String(s).replaceAll('"','""')}"`; }
