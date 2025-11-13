"use client";
import { useState, useEffect } from "react";
import { Section } from "@/lib/ui";
import { todayISO } from "@/lib/period";
import {
  loadYearGoals, saveYearGoals,
  loadMonthGoals, saveMonthGoals,
  loadWeekGoals, saveWeekGoals
} from "@/lib/storage";

function GoalsEditor({title, value, onChange}:{title:string; value:{items:{id:string;text:string}[]}; onChange:(g:any)=>void}) {
  return (
    <Section title={title} right={<button className="text-sm underline" onClick={()=>onChange({ items:[...value.items, {id:`n${value.items.length}`, text:"New goal"}] })}>+ Add</button>}>
      <div className="space-y-2">
        {value.items.map((it, i)=>(
          <div key={it.id} className="flex gap-2 items-center">
            <input className="flex-1 px-3 py-2 rounded-lg border" value={it.text} onChange={ev=>{
              const items=[...value.items]; items[i] = {...items[i], text: ev.target.value}; onChange({ items });
            }} />
            <button className="text-sm" onClick={()=>onChange({ items: value.items.filter((_,j)=>j!==i) })}>Remove</button>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function Planning(){
  const [date, setDate] = useState(todayISO());
  const [gy, setGy] = useState(loadYearGoals(date));
  const [gm, setGm] = useState(loadMonthGoals(date));
  const [gw, setGw] = useState(loadWeekGoals(date));

  useEffect(()=>{ setGy(loadYearGoals(date)); setGm(loadMonthGoals(date)); setGw(loadWeekGoals(date)); },[date]);

  return (
    <>
      <header className="mb-4 flex items-start justify-between">
        <div><h1 className="text-2xl font-bold">Planning</h1></div>
        <div className="flex items-center gap-2">
          <input type="date" className="px-2 py-1 rounded-lg border bg-white" value={date} onChange={e=>setDate(e.target.value)} />
          <a className="px-3 py-1 rounded-lg border" href="/">Daily</a>
          <a className="px-3 py-1 rounded-lg border" href="/ai">AI Dashboard</a>
        </div>
      </header>

      <GoalsEditor title="Annual Goals"  value={gy} onChange={setGy} />
      <GoalsEditor title="Monthly Goals" value={gm} onChange={setGm} />
      <GoalsEditor title="Weekly Goals"  value={gw} onChange={setGw} />

      <div className="flex items-center gap-2">
        <button className="px-4 py-2 rounded-xl bg-slate-900 text-white" onClick={()=>{ saveYearGoals(date,gy); saveMonthGoals(date,gm); saveWeekGoals(date,gw); }}>Save</button>
        <a className="px-3 py-2 rounded-xl border" href="/">Back to Daily</a>
      </div>
    </>
  );
}
