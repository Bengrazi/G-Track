"use client";
import { useEffect, useMemo, useState } from "react";
import { Section, Chip, download } from "@/lib/ui";
import { todayISO } from "@/lib/period";
import { completedPercent } from "@/lib/score";
import {
  loadEntry, saveEntry, DEFAULT_ROUTINES,
  entriesToCSV, loadRange, currentWeekGoalText
} from "@/lib/storage";

export default function Daily() {
  const [date, setDate] = useState<string>(todayISO());
  const [e, setE] = useState(loadEntry(todayISO()));
  const [aiLoading, setAiLoading] = useState(false);

  // Load when date changes
  useEffect(()=>{ setE(loadEntry(date)); }, [date]);

  // Recompute Completed %
  const completedPct = useMemo(()=>completedPercent(e), [e]);
  useEffect(()=>{ setE(prev => ({...prev, completedPct})); }, [completedPct]);

  // Save explicitly
  function doSave() { saveEntry(e); }

  // AI: Today’s theme + one action
  async function refreshTip(){
    setAiLoading(true);
    try {
      const res = await fetch(`/api/ai/daily`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ date, entry: e, weekly_goal: currentWeekGoalText(date) })
      });
      const data = await res.json();
      setE(prev => ({ ...prev, aiTheme: data.theme, aiAction: data.action }));
      saveEntry({ ...e, aiTheme: data.theme, aiAction: data.action });
    } finally { setAiLoading(false); }
  }

  // CSV export presets
  async function exportPreset(days: number | "365" | "all") {
    let from = "0000-01-01";
    let to = date;
    if (days === 365) {
      const d = new Date(date); d.setDate(d.getDate()-365); from = d.toISOString().slice(0,10);
    } else if (typeof days === "number") {
      const d = new Date(date); d.setDate(d.getDate() - days); from = d.toISOString().slice(0,10);
    }
    const rows = loadRange(from, to);
    download(`tracker-${from}_to_${to}.csv`, entriesToCSV(rows));
  }

  return (
    <>
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily</h1>
          <p className="text-sm text-slate-500">Week Goal: {currentWeekGoalText(date) || "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="px-2 py-1 rounded-lg border bg-white" value={date} onChange={e=>setDate(e.target.value)} />
          <a className="px-3 py-1 rounded-lg border" href="/planning">Planning</a>
          <a className="px-3 py-1 rounded-lg border" href="/ai">AI Dashboard</a>
        </div>
      </header>

      {/* Today’s Theme + One Action from AI */}
      <Section title="Today's Theme + One Action" right={
        <button onClick={refreshTip} className="text-sm underline" disabled={aiLoading}>{aiLoading ? "Thinking…" : "Refresh tip"}</button>
      }>
        <div className="text-sm text-slate-700">
          <div><b>Theme:</b> {e.aiTheme || "—"}</div>
          <div><b>Action:</b> {e.aiAction || "—"}</div>
        </div>
      </Section>

      <Section title="Daily Intention">
        <input className="w-full px-3 py-2 rounded-lg border" value={e.intention} onChange={ev=>setE({...e, intention: ev.target.value})} placeholder="One sentence intention" />
      </Section>

      <Section title="A+ Problem & To‑Dos" right={<span className="text-sm text-slate-500">check to complete</span>}>
        <input className="w-full px-3 py-2 rounded-lg border mb-2" value={e.aplus} onChange={ev=>setE({...e, aplus: ev.target.value})} placeholder="A+ Problem" />
        {(e.todos||[]).map((t,i)=>(
          <div key={t.id} className="flex items-center gap-2 mb-2">
            <input type="checkbox" className="h-5 w-5" checked={t.checked} onChange={ev=>{
              const todos=[...e.todos]; todos[i] = {...todos[i], checked: ev.target.checked}; setE({...e, todos});
            }} />
            <input className={`flex-1 px-3 py-2 rounded-lg border ${t.checked?"line-through text-slate-400":""}`} value={t.text}
                   onChange={ev=>{ const todos=[...e.todos]; todos[i] = {...todos[i], text: ev.target.value}; setE({...e, todos});}} />
            <button className="text-sm" onClick={()=>{ const todos=e.todos.filter((_,j)=>j!==i); setE({...e, todos}); }}>Remove</button>
          </div>
        ))}
        <button className="text-sm underline" onClick={()=>setE({...e, todos:[...e.todos,{id:`t${e.todos.length}`, text:"New task", checked:false}]})}>+ Add To‑Do</button>
      </Section>

      <Section title="Daily Routine for Success">
        {(e.routines||[]).map((r,i)=>(
          <div key={r.id} className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" className="h-5 w-5" checked={r.checked} onChange={ev=>{
                const routines=[...e.routines]; routines[i] = {...routines[i], checked: ev.target.checked}; setE({...e, routines});
              }} />
              <input className="flex-1 px-3 py-2 rounded-lg border" value={r.title}
                     onChange={ev=>{ const routines=[...e.routines]; routines[i] = {...routines[i], title: ev.target.value}; setE({...e, routines}); }} />
              <button className="text-sm" onClick={()=>setE({...e, routines:e.routines.filter((_,j)=>j!==i)})}>Remove</button>
            </div>
            <div className="mb-1 text-xs text-slate-500">Sub‑selector (multi‑select):</div>
            <div className="flex flex-wrap">
              {(r.subOptions||[]).map(opt => {
                const on = r.selected?.includes(opt);
                return (
                  <button key={opt} className={`px-3 py-1 mr-2 mb-2 rounded-full border text-sm ${on?"bg-slate-900 text-white":""}`}
                          onClick={()=> {
                            const sel = new Set(r.selected||[]);
                            on ? sel.delete(opt) : sel.add(opt);
                            const routines=[...e.routines]; routines[i] = {...routines[i], selected: Array.from(sel)};
                            setE({...e, routines});
                          }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input placeholder="Add option" className="flex-1 px-2 py-1 rounded border"
                     onKeyDown={ev=>{ if(ev.key==="Enter"){ const val=(ev.target as HTMLInputElement).value.trim(); if(val){ const routines=[...e.routines]; routines[i]={...routines[i], subOptions:[...r.subOptions,val]}; setE({...e, routines}); (ev.target as HTMLInputElement).value=""; }}}} />
            </div>
          </div>
        ))}
        <button className="text-sm underline" onClick={()=>setE({...e, routines:[...e.routines, {id:`r${e.routines.length}`, title:"New Routine", checked:false, subOptions:[], selected:[]}]})}>+ Add Routine</button>
      </Section>

      <Section title="Reflect (EOD)">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm">Daily Completed %</label>
            <div className="text-2xl font-bold">{e.completedPct}</div>
          </div>
          <div>
            <label className="text-sm">Daily Score (0–100)</label>
            <input type="number" min={0} max={100} className="w-full px-3 py-2 rounded-lg border"
                   value={e.dailyScore} onChange={ev=>setE({...e, dailyScore: Number(ev.target.value)})} />
          </div>
        </div>
        <textarea className="w-full px-3 py-2 rounded-lg border mb-2" rows={2} placeholder="What worked?" value={e.worked} onChange={ev=>setE({...e, worked: ev.target.value})} />
        <textarea className="w-full px-3 py-2 rounded-lg border mb-2" rows={2} placeholder="What challenged me?" value={e.challenged} onChange={ev=>setE({...e, challenged: ev.target.value})} />
        <input className="w-full px-3 py-2 rounded-lg border" placeholder="Tomorrow A+ problem" value={e.tomorrowAPlus} onChange={ev=>setE({...e, tomorrowAPlus: ev.target.value})} />
      </Section>

      <div className="flex items-center gap-2">
        <button onClick={doSave} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Save</button>
        <div className="ml-auto flex gap-2">
          <button className="px-3 py-2 rounded-xl border" onClick={()=>exportPreset(7)}>Export 7d</button>
          <button className="px-3 py-2 rounded-xl border" onClick={()=>exportPreset(30)}>Export 30d</button>
          <button className="px-3 py-2 rounded-xl border" onClick={()=>exportPreset(365)}>Export 365d</button>
          <button className="px-3 py-2 rounded-xl border" onClick={()=>exportPreset("all")}>Export All</button>
        </div>
      </div>
    </>
  );
}
