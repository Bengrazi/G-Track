"use client";
import { useState } from "react";
import { Section, download } from "@/lib/ui";
import { todayISO } from "@/lib/period";
import { loadRange, entriesToCSV } from "@/lib/storage";

export default function AIDashboard(){
  const [from,setFrom] = useState<string>(()=>{ const d=new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10); });
  const [to,setTo] = useState<string>(todayISO());
  const [resp,setResp] = useState<any>(null);
  const [loading,setLoading] = useState(false);

  async function analyze(){
    setLoading(true);
    try{
      const entries = loadRange(from,to);
      const res = await fetch(`/api/ai/patterns?from=${from}&to=${to}`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ entries })
      });
      setResp(await res.json());
    } finally { setLoading(false); }
  }
  function exportCSV(){
    const rows = loadRange(from,to);
    download(`tracker-${from}_to_${to}.csv`, entriesToCSV(rows));
  }

  return (
    <>
      <header className="mb-4 flex items-start justify-between">
        <div><h1 className="text-2xl font-bold">AI Dashboard</h1></div>
        <div className="flex items-center gap-2">
          <a className="px-3 py-1 rounded-lg border" href="/">Daily</a>
          <a className="px-3 py-1 rounded-lg border" href="/planning">Planning</a>
        </div>
      </header>

      <Section title="Filter">
        <div className="flex gap-2 items-center">
          <input type="date" className="px-2 py-1 rounded-lg border" value={from} onChange={e=>setFrom(e.target.value)} />
          <span>to</span>
          <input type="date" className="px-2 py-1 rounded-lg border" value={to} onChange={e=>setTo(e.target.value)} />
          <button onClick={()=>{ const d=new Date(); d.setDate(d.getDate()-7); setFrom(d.toISOString().slice(0,10)); setTo(todayISO()); }} className="px-3 py-1 rounded-lg border">Last 7</button>
          <button onClick={()=>{ const d=new Date(); d.setDate(d.getDate()-30); setFrom(d.toISOString().slice(0,10)); setTo(todayISO()); }} className="px-3 py-1 rounded-lg border">Last 30</button>
          <button onClick={()=>{ const d=new Date(); d.setDate(d.getDate()-365); setFrom(d.toISOString().slice(0,10)); setTo(todayISO()); }} className="px-3 py-1 rounded-lg border">Last 1y</button>
          <button onClick={()=>{ setFrom("0000-01-01"); setTo(todayISO()); }} className="px-3 py-1 rounded-lg border">All</button>
          <button onClick={analyze} className="ml-auto px-4 py-2 rounded-xl bg-slate-900 text-white">{loading ? "Analyzing…" : "Analyze"}</button>
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl border">Export CSV</button>
        </div>
      </Section>

      <Section title="Patterns & Correlations (AI)">
        {!resp ? <div className="text-sm text-slate-500">Run Analyze to generate insights.</div> :
          (<div className="space-y-4">
            {resp.patterns?.length ? (
              <div>
                <h4 className="font-semibold mb-1">Patterns</h4>
                <ul className="list-disc pl-5">{resp.patterns.map((p:string,i:number)=><li key={i}>{p}</li>)}</ul>
              </div>
            ) : null}
            {resp.correlations?.length ? (
              <div>
                <h4 className="font-semibold mb-1">Top Correlations</h4>
                <ul className="list-disc pl-5">
                  {resp.correlations.map((c:any,i:number)=>(<li key={i}><b>{c.signal}</b>: Δscore {c.delta_score.toFixed(2)} ({c.days} days)</li>))}
                </ul>
              </div>
            ) : null}
          </div>)
        }
      </Section>

      <Section title="Averages (non‑AI)">
        {(() => {
          const rows = loadRange(from,to);
          const avgScore = rows.length ? Math.round(rows.reduce((a,r)=>a+(r.dailyScore||0),0)/rows.length) : 0;
          const todoComp = rows.length ? Math.round(100*rows.reduce((a,r)=> a+(r.todos.filter(t=>t.checked).length / Math.max(r.todos.length,1)),0)/rows.length) : 0;
          const routineComp = rows.length ? Math.round(100*rows.reduce((a,r)=> a+(r.routines.filter(t=>t.checked).length / Math.max(r.routines.length,1)),0)/rows.length) : 0;
          return (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm">Avg Daily Score</div><div className="text-3xl font-bold">{avgScore}</div></div>
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm">To‑Do Completion</div><div className="text-3xl font-bold">{todoComp}%</div></div>
              <div className="bg-white p-4 rounded-xl border"><div className="text-sm">Routine Completion</div><div className="text-3xl font-bold">{routineComp}%</div></div>
            </div>
          );
        })()}
      </Section>
    </>
  );
}
