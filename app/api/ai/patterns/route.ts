import { NextRequest, NextResponse } from "next/server";

type EntryV2 = {
  date: string; dailyScore:number; completedPct:number;
  routines:{title:string;checked:boolean}[]; todos:{checked:boolean}[];
  intention:string; aplus:string;
};

export async function POST(req: NextRequest) {
  const { entries } = await req.json() as { entries: EntryV2[] };
  // Compute simple correlations: average score delta when a routine is done vs not done
  const corrs: {signal:string; delta_score:number; days:number}[] = [];
  const routineNames = Array.from(new Set(entries.flatMap(e => e.routines.map(r=>r.title))));
  for (const name of routineNames) {
    const withR = entries.filter(e => e.routines.some(r=>r.title===name && r.checked));
    const withoutR = entries.filter(e => e.routines.some(r=>r.title===name) && !e.routines.some(r=>r.title===name && r.checked));
    if (withR.length >= 3 && withoutR.length >= 3) {
      const avgWith = avg(withR.map(e=>e.dailyScore));
      const avgWithout = avg(withoutR.map(e=>e.dailyScore));
      corrs.push({ signal:name, delta_score: avgWith - avgWithout, days: withR.length });
    }
  }
  corrs.sort((a,b)=>Math.abs(b.delta_score)-Math.abs(a.delta_score));
  const top = corrs.slice(0,5);

  if (process.env.OPENAI_API_KEY) {
    try {
      const out = await callPatternsModel({ entries, correlations: top });
      return NextResponse.json({ patterns: out.patterns, correlations: top });
    } catch (e:any) { console.error(e); }
  }
  // Stub output (no key)
  return NextResponse.json({
    patterns: [
      "Exercise 45 is associated with higher Daily Scores in this range.",
      "Higher Completed % days tend to include a written intention."
    ],
    correlations: top
  });
}

function avg(a:number[]){ return a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0; }

async function callPatternsModel(payload: any) {
  const system = `You analyze habits data and return STRICT JSON: {"patterns": string[]} with 3-5 concise bullets. No medical claims.`;
  const user = JSON.stringify({
    correlations: payload.correlations,
    sample: payload.entries.slice(-7).map((e:any)=>({ date:e.date, dailyScore:e.dailyScore, completedPct:e.completedPct, aplus:e.aplus, intention:e.intention }))
  });
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const resp = await client.chat.completions.create({
    model, temperature: 0.2, response_format:{ type:"json_object" },
    messages: [{role:"system",content:system},{role:"user",content:user}]
  });
  const text = resp.choices[0]?.message?.content || "{}";
  const json = JSON.parse(text);
  return { patterns: Array.isArray(json.patterns) ? json.patterns : [] };
}
